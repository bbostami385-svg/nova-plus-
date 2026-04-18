import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  profilePicture: string;
  bio: string;
  followers: number;
  following: number;
  postsCount: number;
  isFollowing: boolean;
  isBlocked: boolean;
  website: string;
  location: string;
  joinedDate: string;
}

interface UserState {
  profile: UserProfile | null;
  isLoading: boolean;
  error: string | null;
  followers: UserProfile[];
  following: UserProfile[];
}

const initialState: UserState = {
  profile: null,
  isLoading: false,
  error: null,
  followers: [],
  following: [],
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setProfile: (state, action: PayloadAction<UserProfile>) => {
      state.profile = action.payload;
    },
    updateProfile: (state, action: PayloadAction<Partial<UserProfile>>) => {
      if (state.profile) {
        state.profile = { ...state.profile, ...action.payload };
      }
    },
    setFollowers: (state, action: PayloadAction<UserProfile[]>) => {
      state.followers = action.payload;
    },
    setFollowing: (state, action: PayloadAction<UserProfile[]>) => {
      state.following = action.payload;
    },
    addFollower: (state, action: PayloadAction<UserProfile>) => {
      state.followers.push(action.payload);
      if (state.profile) {
        state.profile.followers += 1;
      }
    },
    removeFollower: (state, action: PayloadAction<string>) => {
      state.followers = state.followers.filter((user) => user.id !== action.payload);
      if (state.profile) {
        state.profile.followers -= 1;
      }
    },
    addFollowing: (state, action: PayloadAction<UserProfile>) => {
      state.following.push(action.payload);
      if (state.profile) {
        state.profile.following += 1;
      }
    },
    removeFollowing: (state, action: PayloadAction<string>) => {
      state.following = state.following.filter((user) => user.id !== action.payload);
      if (state.profile) {
        state.profile.following -= 1;
      }
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
    },
  },
});

export const {
  setProfile,
  updateProfile,
  setFollowers,
  setFollowing,
  addFollower,
  removeFollower,
  addFollowing,
  removeFollowing,
  setLoading,
  setError,
} = userSlice.actions;
export default userSlice.reducer;
