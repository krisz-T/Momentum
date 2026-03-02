# Momentum - Threat Model

**Version:** 1.0.0

This document outlines potential security threats to the Momentum application and the mitigations implemented to address them. The model follows a simple "Threat-Mitigation" format.

---

### Threat 1: Unauthorized Access to Admin Functionality

*   **Threat:** A regular user (Athlete) attempts to access admin-only API endpoints, such as `GET /api/users` or `DELETE /api/plans/:id`, by guessing the URL.
*   **Attack Vector:** Direct HTTP requests to admin API routes.
*   **Mitigation:**
    *   All admin-only routes on the Express server are protected by the `isAdmin` middleware.
    *   This middleware first authenticates the user's JWT, then performs a database lookup to verify that the user's `role` is 'Admin'.
    *   If the user is not an admin, the request is immediately rejected with a `403 Forbidden` status code, and the request handler is never executed.

### Threat 2: Unauthorized Access to Another User's Data

*   **Threat:** An authenticated user attempts to view or modify data belonging to another user. For example, User A tries to fetch User B's workout history.
*   **Attack Vector:** Manipulating API requests, such as `GET /api/profile/workouts`.
*   **Mitigation:**
    *   All profile-related endpoints (`/api/profile/*`) are designed to be context-aware. They exclusively use the `req.user.id` obtained from the validated JWT for all database queries.
    *   The API never trusts user-provided IDs for fetching sensitive data. For example, `GET /api/profile/badges` queries for badges where `user_id` equals `req.user.id`, making it impossible to view another user's badges.

### Threat 3: Banned User Continues to Participate

*   **Threat:** A user who has been banned by an admin continues to log workouts to gain XP and appear on the leaderboard.
*   **Attack Vector:** Sending requests to `POST /api/workouts` after being banned.
*   **Mitigation:**
    *   The `POST /api/workouts` endpoint performs a server-side check to fetch the user's `is_banned` status before processing the workout. If `true`, the request is rejected with a `403 Forbidden` error.
    *   The `GET /api/leaderboard` endpoint explicitly filters out banned users with a `WHERE is_banned = false` clause in its database query.
    *   The frontend `AuthProvider` logs out any user whose profile returns `is_banned: true`, preventing them from using the client application.

### Threat 4: Cross-Site Scripting (XSS)

*   **Threat:** A user attempts to inject malicious scripts into data fields, such as their username or a workout plan description, which would then execute in the browsers of other users.
*   **Attack Vector:** Submitting `<script>alert('XSS')</script>` as a username or other text field.
*   **Mitigation:**
    *   The React frontend, by default, automatically escapes all data rendered within JSX. This means any script tags are rendered as plain text on the screen rather than being executed by the browser, effectively neutralizing this threat.

---
