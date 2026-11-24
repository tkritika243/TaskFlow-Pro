# TaskFlow Pro

A full-stack task management application with:
- Signup and login (JWT + bcrypt)
- Personal tasks stored in MongoDB Atlas
- Create, edit, delete, and complete tasks
- Priority (High / Medium / Low)
- Due dates
- Search and status/priority filters
- Dashboard statistics and completion progress
- Dark mode preference saved in the browser

## Requirements
- Node.js 18+
- MongoDB Atlas connection string

## Setup
1. Open a terminal in `backend`.
2. Run `npm install`.
3. Copy `.env.example` to `.env`.
4. Put your MongoDB connection string in `MONGO_URI`.
5. Set a long random value for `JWT_SECRET`.
6. Run `npm start`.
7. Open `http://localhost:5000`.

## Render deployment
Create a **Web Service** from this repository:
- Root Directory: `backend`
- Build Command: `npm install`
- Start Command: `npm start`
- Environment Variables:
  - `MONGO_URI` = your existing MongoDB Atlas URI
  - `JWT_SECRET` = a new strong secret

The backend serves the frontend itself, so the app uses one URL. The existing live app is not changed until you upload/deploy this code.

## Important
Never upload `.env` or share your MongoDB URI / JWT secret. `.env` is ignored by Git.
