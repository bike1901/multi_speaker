# 🎙️ MultiSpeaker - Real-time Multi-Speaker Recording

A modern web application for recording high-quality conversations with multiple speakers. Each participant gets their own audio track for perfect post-processing and editing.

## 🚀 **No Domain Required - Deploy to Vercel for Free!**

This app uses Vercel's free subdomains, so you don't need to buy a domain. Anyone can access your app at:
- **Production**: `your-app-name.vercel.app`
- **Preview**: `your-app-name-git-branch.vercel.app`

## 📋 **Quick Deploy to Vercel**

### 1. **Push to GitHub** (if not already done)
```bash
git add .
git commit -m "Initial MultiSpeaker app"
git push origin main
```

### 2. **Deploy to Vercel**
1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Click "New Project" 
3. Import your GitHub repository
4. Vercel will auto-detect Next.js settings
5. Add these **Environment Variables**:

```bash
# Supabase (already configured)
NEXT_PUBLIC_SUPABASE_URL=https://kjbefvouxyhmogmpomyk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtqYmVmdm91eHlobW9nbXBvbXlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzNTYwMDQsImV4cCI6MjA3MTkzMjAwNH0.ntoOr6Oaiv4u3xBvBxBzfo6UMtlUY3kEFgJBGn-Xjlg

# LiveKit (add after setting up LiveKit server)
LIVEKIT_API_KEY=your_livekit_api_key
LIVEKIT_API_SECRET=your_livekit_api_secret
NEXT_PUBLIC_LIVEKIT_URL=wss://your-livekit-server.com
```

6. Click **Deploy**

### 3. **Configure Supabase Auth**
After deployment, update your Supabase project:

1. Go to [Supabase Dashboard](https://supabase.com/dashboard) → Authentication → URL Configuration
2. Add your Vercel URLs to **Redirect URLs**:
   ```
   https://your-actual-app-name.vercel.app/auth/callback
   https://your-actual-app-name-git-*.vercel.app/auth/callback
   ```
3. Enable **GitHub OAuth** provider (or Email)

## 🏗️ **Architecture**

- **Frontend**: Next.js 15 with TypeScript & Tailwind CSS
- **Database**: Supabase (PostgreSQL with RLS)
- **Auth**: Supabase Auth with GitHub OAuth
- **Real-time**: LiveKit for audio streaming
- **Storage**: Supabase Storage (S3-compatible)
- **Deployment**: Vercel (free tier)

## 🛠️ **Tech Stack**

- ⚡ **Next.js 15** - React framework with App Router
- 🎯 **TypeScript** - Type safety
- 🎨 **Tailwind CSS** - Styling
- 🔒 **Supabase** - Backend as a Service
- 🎙️ **LiveKit** - Real-time audio streaming
- 📦 **Vercel** - Deployment platform

## 🔧 **Local Development**

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

## 📊 **Database Schema**

- **rooms** - Recording rooms with owner info
- **participants** - Track who joins each room
- **recordings** - Recording metadata and status

All tables have Row Level Security (RLS) enabled for data protection.

## 🎯 **Features**

- ✅ **Individual Audio Tracks** - Each speaker recorded separately
- ✅ **Real-time Streaming** - Low-latency audio with LiveKit
- ✅ **Secure Authentication** - GitHub OAuth via Supabase
- ✅ **Row Level Security** - Data isolation per user
- ✅ **Responsive Design** - Works on desktop and mobile
- ✅ **TypeScript** - Full type safety

## ✅ **Current Status**

**🎉 FULLY FUNCTIONAL MULTI-SPEAKER SYSTEM!**

- ✅ Frontend LiveKit integration complete
- ✅ Room creation and joining interface
- ✅ Real-time audio streaming
- ✅ Recording start/stop controls
- ✅ Individual participant tracks
- ✅ Real-time participant management

## 🚀 **How to Use**

1. **Sign in** with GitHub or Google OAuth
2. **Create a room** or join existing one by Room ID
3. **Share the Room ID** with other participants
4. **Start recording** when everyone is ready
5. **Individual audio tracks** are saved for each participant
6. **Download** recordings from the storage interface

## 📝 **Environment Variables**

Copy `.env.local` and update with your values:

- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `LIVEKIT_API_KEY` - LiveKit server API key
- `LIVEKIT_API_SECRET` - LiveKit server API secret
- `NEXT_PUBLIC_LIVEKIT_URL` - LiveKit server WebSocket URL

---

**🎉 Ready to record amazing multi-speaker conversations!**