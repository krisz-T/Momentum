# Momentum API Specification

**Version:** 1.0.0

This document provides a detailed specification for the Momentum REST API, which serves as the business logic tier for the application.

## Base URL

The API is hosted at the URL specified in the client's `VITE_API_BASE_URL` environment variable.

## Authentication

Endpoints marked as `Authenticated` or `Admin` require a JSON Web Token (JWT) to be included in the request headers:

`Authorization: Bearer <your_jwt_token>`

Tokens are obtained from the Supabase client library upon user login.

---

## Endpoints

### Tag: Profile

Endpoints for managing the currently authenticated user's profile.

#### `GET /api/profile`

*   **Description:** Fetches the complete profile for the currently authenticated user.
*   **Security:** Authenticated
*   **Success Response:** `200 OK` with the user object.
*   **Error Responses:** `401 Unauthorized`

#### `PATCH /api/profile`

*   **Description:** Updates the name of the currently authenticated user.
*   **Security:** Authenticated
*   **Request Body:** `{ "name": "NewUsername" }`
*   **Success Response:** `200 OK` with the updated user object.
*   **Error Responses:** `401 Unauthorized`, `409 Conflict` (if username is taken).

#### `GET /api/profile/enrollments`

*   **Description:** Fetches the active training plan enrollments for the current user.
*   **Security:** Authenticated
*   **Success Response:** `200 OK` with an array of enrollment objects.
*   **Error Responses:** `401 Unauthorized`

#### `GET /api/profile/badges`

*   **Description:** Fetches the earned badges for the current user.
*   **Security:** Authenticated
*   **Success Response:** `200 OK` with an array of badge objects.
*   **Error Responses:** `401 Unauthorized`

#### `GET /api/profile/workouts`

*   **Description:** Fetches the recent workout history for the current user.
*   **Security:** Authenticated
*   **Success Response:** `200 OK` with an array of workout objects.
*   **Error Responses:** `401 Unauthorized`

---

### Tag: Public

Endpoints that are publicly accessible without authentication.

#### `GET /api/leaderboard`

*   **Description:** Fetches the top 10 users by total XP.
*   **Security:** Public
*   **Success Response:** `200 OK` with an array of user objects (`id`, `name`, `total_xp`).

#### `GET /api/plans`

*   **Description:** Fetches a list of all available training plans.
*   **Security:** Public
*   **Success Response:** `200 OK` with an array of plan objects.

#### `GET /api/plans/:id`

*   **Description:** Fetches the detailed view of a single training plan, including its scheduled workouts and exercises.
*   **Security:** Public
*   **Success Response:** `200 OK` with a single, detailed plan object.
*   **Error Responses:** `404 Not Found`

---

### Tag: Workouts & Plans

Endpoints for user interactions with workouts and plans.

#### `POST /api/workouts`

*   **Description:** Logs a new workout for the authenticated user and calculates XP gained.
*   **Security:** Authenticated
*   **Request Body:** `{ "type": "Running", "duration": 1800 }` (duration in seconds)
*   **Success Response:** `201 Created` with the new workout object.
*   **Error Responses:** `401 Unauthorized`, `403 Forbidden` (if user is banned).

#### `POST /api/plans/:id/enroll`

*   **Description:** Enrolls the authenticated user in a specified training plan.
*   **Security:** Authenticated
*   **Success Response:** `201 Created` with the new enrollment object.
*   **Error Responses:** `401 Unauthorized`, `409 Conflict` (if already enrolled).

---

### Tag: Admin - User Management

Admin-only endpoints for moderating users.

#### `GET /api/users`

*   **Description:** Fetches a list of all users in the system.
*   **Security:** Admin
*   **Success Response:** `200 OK` with an array of user objects (`id`, `name`, `is_banned`).
*   **Error Responses:** `401 Unauthorized`, `403 Forbidden`.

#### `PATCH /api/users/:id/ban`

*   **Description:** Sets a user's `is_banned` status to `true`.
*   **Security:** Admin
*   **Success Response:** `200 OK` with the updated user object.
*   **Error Responses:** `401 Unauthorized`, `403 Forbidden`.

#### `PATCH /api/users/:id/unban`

*   **Description:** Sets a user's `is_banned` status to `false`.
*   **Security:** Admin
*   **Success Response:** `200 OK` with the updated user object.
*   **Error Responses:** `401 Unauthorized`, `403 Forbidden`.

#### `DELETE /api/users/:id`

*   **Description:** Permanently deletes a user from the system.
*   **Security:** Admin
*   **Success Response:** `204 No Content`.
*   **Error Responses:** `401 Unauthorized`, `403 Forbidden`.

---

### Tag: Admin - Content Management

Admin-only endpoints for creating and managing application content.

#### `GET /api/exercises`

*   **Description:** Fetches a list of all exercises in the library.
*   **Security:** Admin
*   **Success Response:** `200 OK` with an array of exercise objects.

#### `POST /api/exercises`

*   **Description:** Creates a new exercise in the library.
*   **Security:** Admin
*   **Success Response:** `201 Created` with the new exercise object.

#### `GET /api/exercises/:id`

*   **Description:** Fetches details for a single exercise.
*   **Security:** Admin
*   **Success Response:** `200 OK` with the exercise object.

#### `PATCH /api/exercises/:id`

*   **Description:** Updates an existing exercise.
*   **Security:** Admin
*   **Success Response:** `200 OK` with the updated exercise object.

#### `DELETE /api/exercises/:id`

*   **Description:** Deletes an exercise from the library.
*   **Security:** Admin
*   **Success Response:** `204 No Content`.
*   **Error Responses:** `409 Conflict` (if exercise is in use).

#### `POST /api/plans`

*   **Description:** Creates a new training plan.
*   **Security:** Admin
*   **Success Response:** `201 Created` with the new plan object.

#### `DELETE /api/plans/:id`

*   **Description:** Deletes a training plan and its associated workouts.
*   **Security:** Admin
*   **Success Response:** `204 No Content`.

#### `POST /api/plans/:planId/workouts`

*   **Description:** Adds a new scheduled workout to an existing plan.
*   **Security:** Admin
*   **Success Response:** `201 Created` with the new plan workout object.

#### `DELETE /api/plan-workouts/:id`

*   **Description:** Deletes a scheduled workout from a plan.
*   **Security:** Admin
*   **Success Response:** `204 No Content`.

#### `POST /api/plan-workouts/:workoutId/exercises`

*   **Description:** Assigns an exercise from the library to a scheduled workout.
*   **Security:** Admin
*   **Success Response:** `201 Created` with the new workout exercise link.

#### `DELETE /api/workout-exercises/:id`

*   **Description:** Removes an assigned exercise from a scheduled workout.
*   **Security:** Admin
*   **Success Response:** `204 No Content`.