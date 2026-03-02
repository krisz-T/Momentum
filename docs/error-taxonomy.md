# Momentum API - Error Taxonomy

**Version:** 1.0.0

This document categorizes the HTTP status codes used by the Momentum API to ensure consistent and predictable error handling. The API uses standard HTTP status codes to indicate the success or failure of a request.

---

## 2xx Success

This class of status codes indicates that the client's request was successfully received, understood, and accepted.

*   **`200 OK`**: The standard response for successful `GET` and `PATCH` requests. The response body will contain the requested or updated resource.
*   **`201 Created`**: The response for successful `POST` requests that result in the creation of a new resource (e.g., logging a workout, creating a plan). The response body contains the newly created resource.
*   **`204 No Content`**: The response for successful `DELETE` requests. The action was successful, but there is no data to return.

---

## 4xx Client Errors

This class of status codes indicates that the request could not be processed due to an issue on the client's side.

*   **`400 Bad Request`**: The server cannot process the request due to a client error, such as malformed request syntax or missing required fields in the request body.
    *   **Example:** A client tries to create a new exercise via `POST /api/exercises` but omits the required `name` field.

*   **`401 Unauthorized`**: The request failed because it lacks valid authentication credentials. This occurs when a non-logged-in user tries to access a protected route.
    *   **Example:** A client without a valid JWT attempts to access `GET /api/profile`.

*   **`403 Forbidden`**: The server understands the request, but refuses to authorize it. This is different from `401`; it means the user is authenticated, but does not have the necessary permissions for the resource.
    *   **Example:** A regular user (Athlete) attempts to access an admin-only route like `GET /api/users`.

*   **`404 Not Found`**: The server cannot find the requested resource.
    *   **Example:** A client makes a request to `GET /api/plans/some-non-existent-uuid`.

*   **`409 Conflict`**: The request could not be completed due to a conflict with the current state of the resource.
    *   **Example:** A user tries to change their username to one that is already taken (`PATCH /api/profile`).
    *   **Example:** A user tries to enroll in a training plan they are already enrolled in (`POST /api/plans/:id/enroll`).

---

## 5xx Server Errors

This class of status codes indicates that the server failed to fulfill a valid request due to an unexpected condition.

*   **`500 Internal Server Error`**: A generic error message given when an unexpected condition was encountered and no more specific message is suitable.
    *   **Example:** The Express API server is unable to connect to the Supabase database, or an unexpected database error occurs during a query. The frontend will simply show a "Failed to fetch..." message.

---