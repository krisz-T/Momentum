# ADR 001: Choosing a 3-Tier (Client-Server-Database) Architecture

**Date:** 2026-03-27

**Status:** Accepted

## Context

The project requires a clear separation of concerns to be maintainable, testable, and easy to document. We needed an architectural pattern that would isolate the user interface (presentation logic), the core business rules (business logic), and the data storage mechanism. A monolithic structure, where frontend and backend code are mixed, would make it difficult to modify one part of the system without impacting others and would complicate API documentation and security enforcement.

## Decision

We will implement a classic **3-Tier Architecture**:

1.  **Tier 1: Presentation (Client)**
    *   A React (Vite) single-page application (SPA) responsible for all UI rendering and user interaction.
    *   It is completely decoupled from the backend and communicates exclusively via HTTP requests to a defined API.

2.  **Tier 2: Business Logic (Server)**
    *   A Node.js/Express REST API server that contains all core business logic.
    *   This includes user authentication, authorization (admin roles), XP calculation, badge awarding, and data validation.
    *   It acts as the single gateway to the database, ensuring the client can never access the database directly.

3.  **Tier 3: Data (Database)**
    *   A cloud-hosted PostgreSQL database managed by Supabase.
    *   Responsible for data persistence, relational integrity (foreign keys), and executing database functions (like `increment_user_xp`).

## Consequences

**Positive:**

*   **High Modifiability:** We can change the entire frontend UI without touching the backend logic, and vice-versa. For example, we could build a mobile app that uses the same Express API.
*   **Clear Separation of Concerns:** Each tier has a single, well-defined responsibility, which simplifies development, testing, and debugging.
*   **Enhanced Security:** The client has no direct access to the database. All requests must go through the Express API, which enforces authentication and authorization rules (`isAdmin` middleware).
*   **Simplified Documentation:** Having a formal API contract (the OpenAPI spec) between the client and server makes the system easier to understand and document.

**Negative:**

*   **Increased Complexity:** Managing three separate components (frontend, backend, database) is more complex than a single monolithic application.
*   **Network Latency:** Communication between the client and server introduces network latency that would not exist in a monolith. This is an acceptable trade-off for the flexibility gained.
*   **Deployment Overhead:** Requires managing two separate deployments (Vercel for the frontend, Render for the backend), although our choice of PaaS providers mitigates this complexity.