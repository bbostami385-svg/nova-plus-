import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import IdentityVerification from '../models/IdentityVerification.js';
import InstitutionalAccount from '../models/InstitutionalAccount.js';
import VIPAccount from '../models/VIPAccount.js';
import AuditLog from '../models/AuditLog.js';

class AuthService {
  // Generate JWT Token
  static generateToken(userId, expiresIn = '7d') {
    return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn });
  }

  // Verify JWT Token
  static verifyToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  // Hash Password
  static async hashPassword(password) {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
  }

  // Compare Password
  static async comparePassword(password, hashedPassword) {
    return bcrypt.compare(password, hashedPassword);
  }

  // Register User
  static async registerUser(userData) {
    try {
      const { email, password, firstName, lastName, accountType = 'standard' } = userData;

      // Check if user exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        throw new Error('User already exists');
      }

      // Hash password
      const hashedPassword = await this.hashPassword(password);

      // Create user
      const user = new User({
        email,
        password: hashedPassword,
        firstName,
        lastName,
        accountType,
        isEmailVerified: false,
      });

      await user.save();

      // Create IdentityVerification record
      const identityVerification = new IdentityVerification({
        userId: user._id,
        profileId: null,
        verificationStatus: 'unverified',
        verificationLevel: 'level_0',
      });

      await identityVerification.save();

      // Log activity
      await AuditLog.logActivity({
        userId: user._id,
        accountType,
        action: 'user_registration',
        actionCategory: 'authentication',
        actionStatus: 'success',
        description: `User registered with email: ${email}`,
        performedBy: {
          userType: 'user',
          userId: user._id,
          userName: `${firstName} ${lastName}`,
          userEmail: email,
        },
      });

      return {
        user,
        token: this.generateToken(user._id),
      };
    } catch (error) {
      throw error;
    }
  }

  // Login User
  static async loginUser(email, password, ipAddress, deviceInfo) {
    try {
      const user = await User.findOne({ email });
      if (!user) {
        throw new Error('Invalid credentials');
      }

      const isPasswordValid = await this.comparePassword(password, user.password);
      if (!isPasswordValid) {
        throw new Error('Invalid credentials');
      }

      // Update last login
      user.lastLogin = new Date();
      await user.save();

      // Log activity
      await AuditLog.logActivity({
        userId: user._id,
        accountType: user.accountType,
        action: 'user_login',
        actionCategory: 'authentication',
        actionStatus: 'success',
        description: `User logged in`,
        performedBy: {
          userType: 'user',
          userId: user._id,
          userName: `${user.firstName} ${user.lastName}`,
          userEmail: email,
        },
        ipAddress,
        deviceInfo,
      });

      return {
        user,
        token: this.generateToken(user._id),
      };
    } catch (error) {
      throw error;
    }
  }

  // Logout User
  static async logoutUser(userId) {
    try {
      await AuditLog.logActivity({
        userId,
        action: 'user_logout',
        actionCategory: 'authentication',
        actionStatus: 'success',
        description: 'User logged out',
        performedBy: {
          userType: 'user',
          userId,
        },
      });

      return { success: true };
    } catch (error) {
      throw error;
    }
  }

  // Get User by ID
  static async getUserById(userId) {
    try {
      const user = await User.findById(userId).select('-password');
      if (!user) {
        throw new Error('User not found');
      }
      return user;
    } catch (error) {
      throw error;
    }
  }

  // Update User Profile
  static async updateUserProfile(userId, profileData) {
    try {
      const user = await User.findByIdAndUpdate(userId, profileData, { new: true }).select('-password');

      await AuditLog.logActivity({
        userId,
        action: 'profile_update',
        actionCategory: 'profile',
        actionStatus: 'success',
        description: 'User profile updated',
        performedBy: {
          userType: 'user',
          userId,
        },
        changes: Object.keys(profileData).map((key) => ({
          field: key,
          newValue: profileData[key],
        })),
      });

      return user;
    } catch (error) {
      throw error;
    }
  }

  // Change Password
  static async changePassword(userId, oldPassword, newPassword) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      const isPasswordValid = await this.comparePassword(oldPassword, user.password);
      if (!isPasswordValid) {
        throw new Error('Current password is incorrect');
      }

      user.password = await this.hashPassword(newPassword);
      await user.save();

      await AuditLog.logActivity({
        userId,
        action: 'password_change',
        actionCategory: 'security',
        actionStatus: 'success',
        description: 'User changed password',
        performedBy: {
          userType: 'user',
          userId,
        },
      });

      return { success: true };
    } catch (error) {
      throw error;
    }
  }

  // Verify Email
  static async verifyEmail(userId, verificationCode) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      if (user.emailVerificationCode !== verificationCode) {
        throw new Error('Invalid verification code');
      }

      user.isEmailVerified = true;
      user.emailVerificationCode = null;
      await user.save();

      const identityVerification = await IdentityVerification.findOne({ userId });
      if (identityVerification) {
        identityVerification.emailVerification.status = 'verified';
        identityVerification.emailVerification.verificationDate = new Date();
        await identityVerification.save();
      }

      await AuditLog.logActivity({
        userId,
        action: 'email_verified',
        actionCategory: 'security',
        actionStatus: 'success',
        description: 'Email verified',
        performedBy: {
          userType: 'user',
          userId,
        },
      });

      return { success: true };
    } catch (error) {
      throw error;
    }
  }

  // Check Account Type
  static async checkAccountType(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      let accountDetails = null;

      if (user.accountType === 'institutional') {
        accountDetails = await InstitutionalAccount.findOne({ userId });
      } else if (user.accountType === 'vip') {
        accountDetails = await VIPAccount.findOne({ userId });
      }

      return {
        accountType: user.accountType,
        accountDetails,
      };
    } catch (error) {
      throw error;
    }
  }

  // Verify Account Status
  static async verifyAccountStatus(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      if (user.isBlocked) {
        throw new Error('Account is blocked');
      }

      if (user.isSuspended) {
        throw new Error('Account is suspended');
      }

      return { status: 'active' };
    } catch (error) {
      throw error;
    }
  }
}

export default AuthService;
