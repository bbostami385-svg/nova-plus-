# 🚀 NovaPlus Social - Premium Social Media Platform

A **production-ready, full-featured social media platform** combining the best features of Facebook, Instagram, YouTube, WhatsApp, and TikTok.

![Status](https://img.shields.io/badge/status-production--ready-brightgreen)
![License](https://img.shields.io/badge/license-MIT-blue)
![Version](https://img.shields.io/badge/version-1.0.0-blue)
![GitHub repo size](https://img.shields.io/github/repo-size/bbostami385-svg/NovaPlus-Social?style=flat-square)
![GitHub stars](https://img.shields.io/github/stars/bbostami385-svg/NovaPlus-Social?style=flat-square)

---

## ✨ Complete Feature Set

### 👤 User System
- ✅ User registration & login (Email + Google OAuth)
- ✅ Profile creation & editing with avatar & cover photo
- ✅ Follow / unfollow system
- ✅ Online / offline status tracking
- ✅ User search & discovery
- ✅ Friend suggestions

### 📝 Posts System
- ✅ Create posts (text + images)
- ✅ Like, comment, share functionality
- ✅ News feed with algorithm-ready structure
- ✅ Post visibility control (public/private)
- ✅ Nested comments and replies
- ✅ Share posts to timeline

### 📸 Story System (Instagram-style)
- ✅ Upload image/video stories
- ✅ Stories auto-expire after 24 hours
- ✅ Story viewers list
- ✅ Stories carousel display
- ✅ Story reactions

### 🎥 Video System (YouTube-style)
- ✅ Upload long-form videos
- ✅ Video streaming support
- ✅ Like, comment on videos
- ✅ Channel-like profile section
- ✅ View count tracking
- ✅ Video recommendations

### 💬 Messaging System (WhatsApp + Messenger-style)
- ✅ Real-time 1-to-1 chat
- ✅ Group chat system
- ✅ Send text messages
- ✅ Send images/videos/files
- ✅ Message delivery status (sent, delivered, seen)
- ✅ Typing indicator
- ✅ Online/offline presence
- ✅ Message search

### 🎬 Reels System (TikTok/Instagram-style)
- ✅ Vertical scroll feed
- ✅ Short video upload (15s-60s)
- ✅ Like, comment, share
- ✅ Follow from reels
- ✅ Trending reels
- ✅ Reel recommendations

### 🔔 Notification System
- ✅ Real-time notifications
- ✅ Likes, comments, messages
- ✅ Friend requests, followers
- ✅ Push notification support
- ✅ Notification preferences
- ✅ Mark as read functionality

### 👥 Friend System (Facebook-style)
- ✅ Send friend requests
- ✅ Accept/decline requests
- ✅ Friends list management
- ✅ Friend suggestions
- ✅ Mutual friends display

### 🔍 Explore & Search
- ✅ Discover users
- ✅ Search posts
- ✅ Search videos
- ✅ Trending content
- ✅ Hashtag support
- ✅ Advanced filters

---

## 🏗️ Architecture

### Backend Stack
- **Runtime:** Node.js 18+
- **Framework:** Express.js 4
- **Database:** MongoDB
- **Authentication:** Firebase OAuth + JWT
- **Real-time:** Socket.io
- **Storage:** Cloudflare R2 (S3-compatible)
- **Deployment:** Render
- **API Documentation:** Swagger/OpenAPI

### Frontend Stack
- **Framework:** React 18
- **Styling:** Tailwind CSS 3
- **State Management:** React Context + Hooks
- **HTTP Client:** Axios
- **Real-time:** Socket.io Client
- **Authentication:** Firebase SDK
- **Deployment:** Vercel
- **UI Components:** Custom + shadcn/ui

### Database Schema (10 MongoDB Models)
- **Users** - User profiles & relationships
- **Posts** - Feed posts & interactions
- **Comments** - Nested comments
- **Videos** - Long-form videos
- **Reels** - Short-form videos
- **Stories** - 24-hour stories
- **Messages** - Direct & group messaging
- **Groups** - Group chat management
- **Notifications** - Real-time alerts
- **FriendRequests** - Friend management

---

## 🛠 Technology Stack

**Frontend:** React 18, Tailwind CSS 3, Socket.io Client, Firebase SDK  
**Backend:** Node.js, Express 4, Socket.io, JWT, Firebase Admin  
**Database:** MongoDB (Atlas)
**Authentication:** Firebase OAuth + JWT
**Storage:** Cloudflare R2 (S3-compatible)
**Deployment:** Vercel (Frontend), Render (Backend)

---

## 📁 Project Structure

```
NovaPlus-Social/
├── backend/
│   ├── models/              # MongoDB schemas (10 models)
│   ├── routes/              # API endpoints (5+ route files)
│   ├── services/            # Business logic
│   ├── middleware/          # Auth, error handling
│   ├── config/              # Database, Firebase, Storage
│   ├── server.js            # Express app
│   ├── package.json
│   ├── .env.example
│   └── render.yaml          # Render deployment config
│
├── frontend/
│   ├── src/
│   │   ├── pages/           # 8+ page components
│   │   ├── components/      # Reusable UI components
│   │   ├── context/         # React contexts (Auth, Notifications)
│   │   ├── App.js           # Main app with routing
│   │   ├── index.css        # Global styles
│   │   └── index.js         # Entry point
│   ├── public/              # Static assets
│   ├── package.json
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── vercel.json          # Vercel deployment config
│   └── .env.example
│
├── LAUNCH_GUIDE.md          # Complete deployment guide (step-by-step)
├── PRODUCTION_SETUP.md      # Detailed setup instructions
├── README.md                # This file
└── LICENSE
```

---

## 🚀 Quick Start (5 Minutes)

### Prerequisites
- Node.js 18+
- MongoDB Atlas account
- Firebase project
- Cloudflare R2 account
- GitHub account

### Local Development

**1. Clone Repository**
```bash
git clone https://github.com/bbostami385-svg/NovaPlus-Social.git
cd NovaPlus-Social
```

**2. Setup Backend**
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your credentials
npm run dev
```

**3. Setup Frontend**
```bash
cd ../frontend
npm install
cp .env.example .env
# Edit .env with your API URL
npm start
```

**4. Open Browser**
```
http://localhost:3000
```

---

## 📦 Deployment (Production)

### One-Click Deployment

**Backend on Render:**
1. Go to [render.com](https://render.com)
2. Connect GitHub repository
3. Create Web Service
4. Add environment variables
5. Deploy!

**Frontend on Vercel:**
1. Go to [vercel.com](https://vercel.com)
2. Import GitHub repository
3. Configure build settings
4. Add environment variables
5. Deploy!

### Detailed Instructions
See [LAUNCH_GUIDE.md](./LAUNCH_GUIDE.md) for complete step-by-step deployment guide.

---

## 🔐 Environment Variables

### Backend (.env)
```
NODE_ENV=production
PORT=10000
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/db
JWT_SECRET=your-super-secret-key-min-32-chars
FIREBASE_PROJECT_ID=novaplus-app
FIREBASE_PRIVATE_KEY=your-firebase-private-key
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@novaplus-app.iam.gserviceaccount.com
STORAGE_PROVIDER=r2
R2_ACCESS_KEY_ID=your-r2-access-key
R2_SECRET_ACCESS_KEY=your-r2-secret-key
R2_BUCKET_NAME=novaplus-social
R2_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com
R2_PUBLIC_URL=https://your-public-url.r2.dev
CORS_ORIGIN=https://novaplus.vercel.app
```

### Frontend (.env)
```
REACT_APP_API_URL=https://novaplus-social-api.onrender.com
REACT_APP_FIREBASE_API_KEY=AIzaSyAQ1wNehf7efchAliA1ZTJdnKEiqbTww08
REACT_APP_FIREBASE_AUTH_DOMAIN=novaplus-app.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=novaplus-app
REACT_APP_FIREBASE_STORAGE_BUCKET=novaplus-app.firebasestorage.app
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=967183591469
REACT_APP_FIREBASE_APP_ID=1:967183591469:web:dc4a5e01aa767bf265b0a4
REACT_APP_FIREBASE_MEASUREMENT_ID=G-4QXRE8K8KY
```

---

## 📚 API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login with email
- `POST /api/auth/google` - Login with Google
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user

### User Endpoints
- `GET /api/users/:userId` - Get user profile
- `PUT /api/users/profile/update` - Update profile
- `POST /api/users/:userId/follow` - Follow user
- `POST /api/users/:userId/unfollow` - Unfollow user
- `GET /api/users/search` - Search users
- `POST /api/users/:userId/friend-request` - Send friend request

### Post Endpoints
- `POST /api/posts` - Create post
- `GET /api/posts/feed` - Get feed
- `GET /api/posts/:postId` - Get post
- `POST /api/posts/:postId/like` - Like post
- `POST /api/posts/:postId/unlike` - Unlike post
- `POST /api/posts/:postId/comments` - Add comment

### Message Endpoints
- `POST /api/messages/send` - Send message
- `GET /api/messages/conversation/:userId` - Get conversation
- `GET /api/messages` - Get all conversations
- `POST /api/messages/:messageId/read` - Mark as read

### Notification Endpoints
- `GET /api/notifications` - Get notifications
- `POST /api/notifications/:notificationId/read` - Mark as read
- `POST /api/notifications/read-all` - Mark all as read

See [backend/API_DOCUMENTATION.md](./backend/API_DOCUMENTATION.md) for complete API reference.

---

## 💻 Installation (Development)

1. Clone the repository:
```bash
git clone https://github.com/bbostami385-svg/NovaPlus-Social.git
cd NovaPlus-Social
