# Faculte Connect

This repository contains the source code for the Faculte Connect platform.

The project is split into two main components:
- **Frontend** (`/frontend`): A React application built with Vite and Tailwind CSS.
- **Backend** (`/backend`): A Node.js and Express API server that serves data to the frontend.

## Getting Started

### Prerequisites
- Node.js (v18 or higher recommended)
- npm

### Installation
From the root directory, install the necessary dependencies for both the frontend and backend by running:
```bash
npm run install:all
```
*(Alternatively, you can navigate to `frontend/` and `backend/` and run `npm install` independently in each directory.)*

### Running the Application Locally
You can start both the frontend development server and the backend API server concurrently from the root directory by running:
```bash
npm run dev
```

This will:
- Start the backend Express server on `http://localhost:8080` (auto-reloading with nodemon).
- Start the frontend Vite server on `http://localhost:8080`.

Open your browser and navigate to `http://localhost:8080` to access the application. The frontend is configured to proxy API requests to the backend automatically.

## Project Structure
```
faculte-connect/
├── backend/            # Express.js backend API
│   ├── data.js         # Mock data
│   ├── server.js       # Main server entry point
│   └── package.json    # Backend dependencies
├── frontend/           # React frontend
│   ├── src/            # Application source code
│   │   ├── lib/api.ts  # API fetch utility
│   │   └── ...         # Components, Pages, Utilities
│   ├── vite.config.ts  # Vite configuration (incl. proxy settings)
│   └── package.json    # Frontend dependencies
├── package.json        # Root scripts for running/building both sides concurrently
└── README.md           # This file
```
