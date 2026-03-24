# 🏋️‍♂️ FitTrack - AI-Powered Fitness & Nutrition Ecosystem

FitTrack is a modern, full-stack MERN application that leverages **Google Gemini AI** to provide a deeply personalized fitness experience. Beyond traditional tracking, FitTrack serves as an intelligent coach that generates custom plans, analyzes progress, and provides real-time guidance.

**Live Demo:** [https://fit-track-phi-virid.vercel.app/](https://fit-track-phi-virid.vercel.app/)

![FitTrack Logo](https://raw.githubusercontent.com/pr-04/FitTrack/main/client/public/vite.svg)

## 📁 Project Structure

```text
.
├── client/                # React + Vite Frontend
│   ├── src/
│   │   ├── components/    # Reusable UI components (AI Chat, Cards, Buttons)
│   │   ├── pages/         # Core views (AI Plan Hub, Dashboard, Workouts)
│   │   ├── context/       # Auth & Theme state management
│   │   ├── services/      # Gemini & Backend API integrations
│   │   └── App.jsx        # Root component & Protected Routing
│   └── public/            # Static assets
├── server/                # Node.js + Express Backend
│   ├── config/            # Gemini AI & MongoDB configurations
│   ├── controllers/       # Business logic (AI Generation, Auth, Tracking)
│   ├── models/            # Mongoose schemas (AIPlan, User, Workout)
│   ├── routes/            # API endpoints & Middleware protection
│   ├── middleware/        # JWT Verification & CORS policy
│   └── server.js          # Backend entry point
├── README.md              # Project documentation
└── .gitignore             # Environment & dependency protection
```

## 🚀 Key Features

### 🤖 AI-Driven Intelligence
- **Personalize Plan Hub**: A central hub to generate 7-day custom workout and diet routines powered by Gemini AI, tailored to your specific goals and physical profile.
- **AI Plan Coach**: Context-aware chat sidebar that lets you ask specific questions about your generated plans (e.g., "Can I swap the lunch for a vegetarian option?").
- **Smart Dashboard**: Receive daily AI reminders, motivational advice, and health warnings based on your BMI and recent weight history.
- **AI Fitness Coach**: A floating chatbot accessible from any page for real-time fitness guidance and support.

### 📊 Comprehensive Tracking
- **Workout Logger**: Professional card-based UI to track exercises, sets, reps, and weight with persistent history.
- **Calorie Tracker**: Log meals using a curated database with automatic calorie population and goal-based progress bars.
- **Weight Progress**: Interactive charting system with automatic BMI calculation and trend analysis.

### 🔐 Security & UX
- **Google OAuth 2.0**: Seamless "Continue with Google" authentication alongside standard email/password login.
- **Privacy First**: Strict user isolation ensures your AI plans and tracking data are visible only to you.
- **Premium Dark UI**: A sleek, responsive interface built with Tailwind CSS, featuring glassmorphism and smooth transitions.

## 🛠️ Tech Stack

**Frontend:**
- **React 19 (Vite)**
- **Tailwind CSS**
- **Lucide React** (Modern Icons)
- **Recharts** (Advanced Data Visualization)
- **Axios** (API Interceptor for Auth)

**Backend:**
- **Node.js & Express**
- **Google Gemini API** (Generative AI)
- **MongoDB Atlas** (Cloud Database)
- **Passport.js** (Google OAuth Strategy)
- **JWT & Bcryptjs** (Secure Authentication)

---

## 💻 Getting Started

### Prerequisites
- Node.js (v18+)
- MongoDB Atlas account
- Google Cloud Console Project (for OAuth)
- Google AI Studio API Key (for Gemini)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/pr-04/FitTrack.git
   cd FitTrack
   ```

2. **Backend Setup:**
   ```bash
   npm install # Install root dependencies
   ```
   Create a `.env` file in the root directory:
   ```env
   MONGO_URI=your_mongodb_uri
   JWT_SECRET=your_jwt_secret
   GEMINI_API_KEY=your_gemini_api_key
   GOOGLE_CLIENT_ID=your_google_id
   GOOGLE_CLIENT_SECRET=your_google_secret
   CLIENT_URL=http://localhost:5173
   ```

3. **Frontend Setup:**
   ```bash
   cd client
   npm install
   ```
   Create a `.env` file in the `client/` directory:
   ```env
   VITE_API_URL=http://localhost:5000/api
   VITE_GOOGLE_CLIENT_ID=your_google_id
   ```

### Running the App
- **Both (Turbo)**: `npm run dev` (from root if using concurrently)
- **Backend Only**: `node server.js`
- **Frontend Only**: `npm run dev` (from `client/`)

---

## 👤 Author
**Priyanshu Ranjan** - [GitHub](https://github.com/pr-04)

---
*Empowering your fitness journey through AI intelligence.* 🏋️‍♂️✨
