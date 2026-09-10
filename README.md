# CareLink — Healthcare SaaS MVP

## 1. What CareLink Is
CareLink is a modern healthcare SaaS MVP platform designed to streamline healthcare workflows. This repository currently contains **Phase 0 — Project Foundation**, providing the clean full-stack architectural baseline for subsequent phases.

## 2. Tech Stack
- **Frontend**: React, Vite, Tailwind CSS, JavaScript, Axios
- **Backend**: Node.js, Express, JavaScript, Prisma ORM
- **Database**: PostgreSQL (running locally)

## 3. Project Structure
```text
carelink/
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── .env.example
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
├── backend/
│   ├── prisma/
│   │   └── schema.prisma
│   ├── src/
│   │   ├── app.js
│   │   └── server.js
│   ├── .env.example
│   └── package.json
│
├── .gitignore
└── README.md
```

## 4. Prerequisites
- Node.js (v18+ or v20+)
- npm (v9+)
- PostgreSQL (v14+ running locally)

## 5. PostgreSQL Local Setup
1. Ensure PostgreSQL is installed and the service is running locally on port `5432`.
2. Create the database using PostgreSQL CLI:
```bash
psql -U postgres -c "CREATE DATABASE carelink;"
```

## 6. How to Configure Backend `.env`
1. Navigate to the backend directory and copy the example environment file:
```bash
cd backend
cp .env.example .env
```
2. Open `backend/.env` and update the PostgreSQL connection string with your local username, password, and database name:
```env
PORT=5000
DATABASE_URL="postgresql://<username>:<password>@localhost:5432/carelink"
FRONTEND_URL="http://localhost:5173"
```

## 7. How to Configure Frontend `.env`
1. Navigate to the frontend directory and copy the example environment file:
```bash
cd frontend
cp .env.example .env
```
2. Verify the API base URL points to the backend server:
```env
VITE_API_URL=http://localhost:5000
```

## 8. How to Run Backend
From the root directory:
```bash
cd backend
npm install
npx prisma generate
npm run dev
```
The backend server will start on `http://localhost:5000`.

## 9. How to Run Frontend
From the root directory:
```bash
cd frontend
npm install
npm run dev
```
The frontend application will start on `http://localhost:5173`.

## 10. How to Verify `GET /api/health`
### Option A: Command Line / HTTP Client
Run:
```bash
curl http://localhost:5000/api/health
```
Expected response:
```json
{
  "success": true,
  "message": "CareLink backend is running"
}
```

### Option B: Frontend Connection Test
Open `http://localhost:5173` in your browser. The connection test component will call `GET /api/health` via Axios and display the connection status and response payload.
