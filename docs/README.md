# Momentum

Momentum is a full-stack web application designed as a workout tracker to keep users consistent through RPG-like mechanics (XP, badges) and social competition. It was built as a final project for a Software Architectures course, demonstrating a clean 3-tier architecture, a secure API, and a polished user experience.

## Live Demo

*   **Backend API (Render):** `https://momentum-api.onrender.com`
*   **Frontend UI (Vercel):** `https://momentum-krisz-t.vercel.app`

---

## Features

*   **Athlete Role:**
    *   Secure user authentication (Sign Up, Sign In, Password Reset).
    *   Manual and interactive workout logging.
    *   Gamification system with XP and unlockable badges.
    *   Global leaderboard to see top performers.
    *   Enroll in structured, multi-week training plans.
    *   Interactive workout sessions with timers and embedded exercise videos.
    *   Personal profile page with stats, workout history, and earned badges.
*   **Admin Role:**
    *   Full CRUD (Create, Read, Update, Delete) functionality for managing users, training plans, and the exercise library.
    *   Ability to ban and unban users.

---

## Architecture

Momentum is built using a classic **3-Tier Architecture** to ensure a clean separation of concerns.

1.  **Client (Presentation Tier):** A **React (Vite)** single-page application that handles all UI rendering and user interaction. It is completely decoupled from the backend.
2.  **Server (Business Logic Tier):** A **Node.js/Express** REST API that contains all core business logic, including authentication, authorization, gamification rules, and data validation. It is the single gateway to the database.
3.  **Database (Data Tier):** A cloud-hosted **PostgreSQL** database managed by **Supabase**, which also handles user authentication services.

For more detailed architectural decisions, please see the `docs/` directory.

---

## Getting Started Locally

To run this project on your local machine, you will need Node.js and npm installed.

### 1. Initial Setup

**Clone the repository:**
```sh
git clone https://github.com/krisz-T/Momentum.git
cd Momentum
```

**Set up Supabase:**
1.  Create a free account at supabase.com and start a new project.
2.  In your Supabase project, go to the **SQL Editor** and run the contents of `database.sql` to create all the necessary tables and functions.
3.  Go to **Project Settings > API**. You will need the **Project URL**, the **`anon` `public` key**, and the **`service_role` `secret` key** for the next step.

### 2. Backend Server Setup

1.  **Navigate to the server directory:**
    ```sh
    cd server
    ```
2.  **Install dependencies:**
    ```sh
    npm install
    ```
3.  **Create the environment file:** Create a new file named `.env` in the `server` directory and add your Supabase credentials:
    ```dotenv
    SUPABASE_URL=YOUR_SUPABASE_PROJECT_URL
    SUPABASE_SERVICE_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY
    ```
4.  **Start the server:**
    ```sh
    npm start
    ```
    The backend API will be running at `http://localhost:3001`.

### 3. Frontend Client Setup

1.  **Navigate to the client directory (from the root):**
    ```sh
    cd client
    ```
2.  **Install dependencies:**
    ```sh
    npm install
    ```
3.  **Create the environment file:** Create a new file named `.env` in the `client` directory and add your Supabase credentials and the local API URL:
    ```dotenv
    VITE_API_BASE_URL=http://localhost:3001
    VITE_SUPABASE_URL=YOUR_SUPABASE_PROJECT_URL
    VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
    ```
4.  **Start the client:**
    ```sh
    npm run dev
    ```
    The application will be available at `http://localhost:5173`.
