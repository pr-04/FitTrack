# 🏋️‍♂️ FitTrack - Full-Stack Workout & Calorie Tracker

FitTrack is a comprehensive, modern MERN stack application designed to help users track their fitness journey. It features a robust dashboard, workout logging, calorie tracking with localized mock data, and weight progress monitoring with BMI calculations.

**Live Demo:** [https://fit-track-phi-virid.app/](https://fit-track-phi-virid.vercel.app/)

![FitTrack Logo](https://raw.githubusercontent.com/pr-04/FitTrack/main/client/public/vite.svg)

## 📁 Project Structure

```text
.
├── client/                # React + Vite Frontend
│   ├── src/
│   │   ├── components/    # Reusable UI components (Card, Button, etc.)
│   │   ├── pages/         # Main page views (Dashboard, Weight, Calories)
│   │   ├── context/       # Authentication context (AuthContext)
│   │   ├── services/      # Axios API service configurations
│   │   └── App.jsx        # Root component & Routing
│   └── public/            # Static assets
├── server/                # Node.js + Express Backend
│   ├── config/            # Database connection logic
│   ├── controllers/       # API controllers (Auth, Food, Workout, Weight)
│   ├── models/            # Mongoose schemas (User, Workout, Food, Weight)
│   ├── routes/            # API route definitions
│   ├── middleware/        # Auth & Error handling middleware
│   └── server.js          # Backend entry point
├── README.md              # Project documentation
└── .gitignore             # Git ignore rules for root, client, and server
```

## 🚀 Key Features

- **Dashboard**: A bird's-eye view of your daily calories, workouts, weight, and fitness goals.
- **Workout Logger**: Track your exercises, sets, reps, and dates with ease.
- **Calorie Tracker**: Log meals (Breakfast, Lunch, Dinner, Snack) using a curated database of common foods with automatic calorie population.
- **Weight Progress**: Monitor your weight over time with interactive charts and an automatic **BMI Calculator**.
- **Dynamic Goals**: Calorie intake targets automatically adjust based on your selected fitness goal (Lose Weight, Gain Muscle, etc.).
- **Authentication**: Secure JWT-based authentication with personalized user profiles.
- **Modern UI**: A premium, responsive dark-mode interface built with Tailwind CSS and Framer-friendly styling.

## 🛠️ Tech Stack

**Frontend:**
- React 19 (Vite)
- Tailwind CSS
- Lucide React (Icons)
- Recharts (Data Visualization)
- Axios

**Backend:**
- Node.js & Express
- MongoDB Atlas (Database)
- Mongoose (ODM)
- JSON Web Token (JWT)
- Bcryptjs (Password Hashing)

---

## 💻 Getting Started

### Prerequisites
- Node.js (v18+)
- MongoDB Atlas account (or local MongoDB)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/pr-04/FitTrack.git
   cd FitTrack
   ```

2. **Backend Setup:**
   ```bash
   # Navigate to root (server is managed here)
   npm install
   ```
   Create a `.env` file in the root directory:
   ```env
   NODE_ENV=development
   PORT=5000
   MONGO_URI=your_mongodb_atlas_uri
   JWT_SECRET=your_jwt_secret
   CALORIE_NINJAS_API_KEY=your_optional_api_key
   ```

3. **Frontend Setup:**
   ```bash
   cd client
   npm install
   ```
   Create a `.env` file in the `client/` directory:
   ```env
   VITE_API_URL=http://localhost:5000/api
   ```

### Running the App
- Run backend: `npm run dev` (from root)
- Run frontend: `npm run dev` (from `client/`)

---

## 🌐 Deployment (Render)

### Backend (Web Service)
1. **Build Command**: `npm install`
2. **Start Command**: `npm start`
3. **Internal Port**: `5000`

## 🌐 Deployment (Vercel)

### Frontend (Static Site)
1. **Root Directory**: `client`
2. **Build Command**: `npm install && npm run build`
3. **Publish Directory**: `dist`
4. **Environment Variable**: `VITE_API_URL` set to your deployed backend API URL.

---

## 🛡️ License
Distributed under the ISC License.

## 👤 Author
**Priyanshu Ranjan** - [GitHub](https://github.com/pr-04)

---
*Developed with ❤️ *
