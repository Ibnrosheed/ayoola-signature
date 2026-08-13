# Ayoola Signature — E-Commerce Platform

Ayoola Signature is a luxury full-stack e-commerce web application designed with high aesthetic standards and architecture.

## Tech Stack

- **Frontend**: React, Vite, Tailwind CSS, React Router, Axios, Lucide React
- **Backend**: Node.js, Express.js, Mongoose (MongoDB), JWT, bcryptjs, CORS, dotenv
- **Database**: MongoDB

## Project Structure

```text
Ayoola Signature/
├── client/          # React + Vite frontend application
└── server/          # Node.js + Express backend REST API
```

## Getting Started

### Prerequisites

- Node.js (v18+)
- MongoDB (running locally or MongoDB Atlas URI)

### Environment Setup

1. Copy `.env.example` to `.env` in the `server` directory (or workspace root):
   ```bash
   cp .env.example server/.env
   ```

2. Fill in your environment details (e.g. `MONGODB_URI`, `PORT`, `JWT_SECRET`).

### Installation

Install dependencies for both server and client:

```bash
# Server setup
cd server
npm install

# Client setup
cd ../client
npm install
```

### Running in Development

1. Start the server (Backend API running on `http://localhost:5000`):
   ```bash
   cd server
   npm run dev
   ```

2. Start the client (Frontend app running on `http://localhost:5173`):
   ```bash
   cd client
   npm run dev
   ```

### API Health Check

```bash
GET http://localhost:5000/api/health
```

Expected Response:
```json
{
  "success": true,
  "message": "Ayoola Signature API is running"
}
```
