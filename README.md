# Ayoola Signature — Full-Stack E-Commerce Platform

Ayoola Signature is a modern full-stack e-commerce platform designed to provide a smooth and responsive online shopping experience.

The project is being developed with a focus on clean architecture, responsive user interfaces, secure backend services, database-driven functionality, and scalable application structure.

> 🚧 **Project Status:** Actively in development

## Overview

Ayoola Signature is designed as a complete e-commerce solution with separate frontend and backend applications.

The platform is being developed to support:

* Customer registration and authentication
* Product browsing and categorization
* Product details and inventory management
* Shopping cart functionality
* Customer account management
* Order management
* Secure payment processing
* Administrative product and category management
* Role-based access control
* RESTful API communication

Features are being implemented and tested progressively as development continues.

---

## Technology Stack

### Frontend

* **React.js** — User interface
* **Vite** — Development and build tooling
* **Tailwind CSS** — Responsive UI styling
* **React Router** — Client-side routing
* **Axios** — API communication
* **Lucide React** — Interface icons

### Backend

* **Node.js** — Server-side runtime
* **Express.js** — REST API framework
* **Mongoose** — MongoDB object modeling
* **JWT** — Authentication and authorization
* **bcryptjs** — Password hashing
* **CORS** — Cross-origin request handling
* **dotenv** — Environment configuration

### Database

* **MongoDB**

---

## Architecture

The project follows a separated frontend/backend architecture:

```text
Ayoola Signature
│
├── client/
│   ├── React
│   ├── Vite
│   ├── Tailwind CSS
│   └── React Router
│
└── server/
    ├── Node.js
    ├── Express.js
    ├── REST APIs
    ├── JWT Authentication
    └── MongoDB / Mongoose
```

This separation allows the frontend and backend to be developed, tested, and maintained independently.

---

## Project Structure

```text
Ayoola Signature/
│
├── client/                 # React + Vite frontend
│
├── server/                 # Node.js + Express backend
│
├── README.md
└── ...
```

---

## Current Development Areas

The application is being developed progressively across multiple stages.

### Authentication & Security

* User registration
* User login
* Password hashing
* JWT authentication
* Protected routes
* Role-based authorization

### Product Management

* Product creation
* Product editing
* Product deletion
* Product categories
* Product information management
* Inventory/quantity management

### Customer Experience

* Product browsing
* Product details
* Shopping cart
* Customer profile
* Order workflow

### Administration

* Admin authentication
* Product management
* Category management
* Customer management
* Order management

### Payments

Payment processing is planned through a secure payment gateway integration.

---

## Getting Started

### Prerequisites

Before running the project, make sure you have:

* Node.js v18 or later
* npm
* MongoDB running locally or a MongoDB Atlas connection
* Git

---

## Environment Configuration

Create the required environment file inside the `server` directory.

Example:

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_secure_jwt_secret
```

> **Important:** Never commit real passwords, API keys, JWT secrets, or other sensitive credentials to GitHub.

---

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/ibnrosheed/ayoola-signature.git
cd ayoola-signature
```

### 2. Install backend dependencies

```bash
cd server
npm install
```

### 3. Install frontend dependencies

```bash
cd ../client
npm install
```

---

## Running the Application

### Start the backend

```bash
cd server
npm run dev
```

The backend API runs locally on:

```text
http://localhost:5000
```

### Start the frontend

Open another terminal:

```bash
cd client
npm run dev
```

The frontend will normally be available at:

```text
http://localhost:5173
```

---

## API Health Check

The backend provides a health-check endpoint:

```http
GET /api/health
```

Expected response:

```json
{
  "success": true,
  "message": "Ayoola Signature API is running"
}
```

---

## Development Approach

The project is being developed with emphasis on:

* Clean and maintainable code
* Modular architecture
* Secure authentication
* Proper API design
* Database consistency
* Responsive user interfaces
* Error handling
* Validation
* Scalable application structure
* Continuous testing and improvement

---

## Future Improvements

Planned improvements include:

* Production deployment
* Complete payment integration
* Advanced order tracking
* Improved product search and filtering
* Image optimization
* Performance optimization
* Automated testing
* Enhanced administrative analytics
* Additional security improvements

---

## Project Status

**Status: 🚧 Active Development**

Ayoola Signature is an ongoing project. Features are being implemented, tested, refined, and documented progressively.

---

## Author

### Opeyemi Yusuf

**Full-Stack Web Developer**

* GitHub: https://github.com/ibnrosheed
* LinkedIn: https://www.linkedin.com/in/ibnrosheed/

---

## License

This project is currently maintained as a personal/business development project.

© Ayoola Signature. All rights reserved.
