# CodeSphere: Project Architecture & Documentation

## Overview
CodeSphere is a production-grade, real-time collaborative coding workspace. It was built using a strict **MERN Stack** (MongoDB, Express, React, Node.js) architecture without relying on third-party backend-as-a-service providers like Firebase for core functionality.

## Core Architecture

### 1. The Backend (Node.js, Express, MongoDB)
*   **`server/server.js`**: This is the central entry point of the backend. It starts the Express REST API, connects to MongoDB, and crucially, binds two separate real-time WebSockets to the server.
*   **`server/config/db.js`**: Establishes the connection to the MongoDB database cluster using Mongoose.
*   **`server/models/`**: Defines the database schemas. 
    *   `User.js`: Stores user credentials, securely hashed passwords, and profile information.
    *   `Project.js`: Stores the code workspaces, their languages, and the last known document state.
*   **`server/controllers/`**: Contains the business logic. 
    *   `auth.controller.js`: Handles user registration and generates secure JSON Web Tokens (JWTs). Passwords are cryptographically hashed using `bcryptjs`.
    *   `ai.controller.js`: Acts as a proxy to the OpenAI API for the AI Pair Programmer.
    *   `github.controller.js`: Interacts with the GitHub API to allow users to pull and push code.
*   **`server/services/`**: Handles real-time infrastructure.
    *   `socket.service.js`: Uses `socket.io` for discrete events like instant chat messages and WebRTC video signaling.
    *   `yjs.service.js`: Runs the CRDT (Conflict-free Replicated Data Type) algorithm via `y-websocket` to allow multiple people to type code simultaneously without race conditions.

### 2. The Frontend (React via Webpack)
*   **`client/src/index.js` & `App.jsx`**: The starting points of the React application, configuring the DOM and URL routing via `react-router-dom`.
*   **`client/src/contexts/`**: Global state managers.
    *   `AuthContext.jsx`: Manages the custom JWT authentication flow and stores the user's secure token in `localStorage`.
    *   `SocketContext.jsx`: Keeps a persistent global socket connection open across the app.
*   **`client/src/pages/`**: The main screens. 
    *   `Landing.jsx` & `Login.jsx`: The public entry points, styled heavily using Vanilla CSS.
    *   `Dashboard.jsx`: The user's portal to create or join coding projects.
    *   `Room.jsx`: The most complex component. It renders the Monaco Code Editor and binds it to the `Yjs` WebSocket so collaboration works instantly.
*   **`client/src/components/panels/`**: Sidebar features inside the coding room.
    *   `GitHubPanel.jsx`: UI for pulling and pushing code to remote repositories.
    *   `AIPanel.jsx`: Chat interface for the OpenAI pair programmer.
    *   `ChatPanel.jsx`: Real-time text chat UI.

## Key Technical Decisions
1. **Pure MERN Authentication**: To adhere to a strict MERN stack, external providers like Firebase were removed. Authentication is handled natively using `jsonwebtoken` for secure sessions and `bcryptjs` for hashing passwords in MongoDB.
2. **Vanilla CSS**: The build pipeline was migrated away from Vite and Tailwind CSS. The application now uses standard Webpack (`react-scripts`) and relies on pure Vanilla CSS for layout, animations, and responsive design (including complex glassmorphism effects).
3. **Dual-WebSocket System**: The application uses two parallel real-time systems. `socket.io` handles standard message passing (like chat), while `y-websocket` specifically handles the complex mathematical state merging required for real-time multiplayer text editing.
