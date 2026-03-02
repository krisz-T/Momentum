# ADR 002: Using Supabase for Database and Authentication

**Date:** 2026-03-27

**Status:** Accepted

## Context

The project requires a persistent data store for user profiles, workouts, and plans, as well as a secure system for user authentication. A traditional approach would involve setting up a local PostgreSQL database, managing connection strings, and building an authentication system from scratch (handling password hashing, JWTs, and email verification). This approach introduces significant complexity and a high risk of local environment errors (making keys public among other things), which conflicts with our project goal of prioritizing deployability,rapid, stable development and especially security.

## Decision

We will use **Supabase** as our Backend-as-a-Service (BaaS) provider. It will fulfill two critical roles in our 3-Tier Architecture:

1.  **Data Tier:** Supabase provides a fully managed, cloud-hosted PostgreSQL database. Our Express server interacts with it as the data layer, using the `supabase-js` client library for all database operations (CRUD).
2.  **Authentication Service:** We will leverage Supabase's built-in authentication system to handle user sign-up, sign-in, and password resets. Our Express server's `authenticate` middleware validates JWTs provided by the client against the Supabase auth service.

This decision means we are intentionally *not* using Supabase's auto-generated APIs directly from the client, as that would violate our 3-Tier architecture. The Express server remains the sole intermediary.

## Consequences

**Positive:**

*   **Zero Local Database Setup:** This completely eliminated the need for developers (or graders) to install and configure PostgreSQL locally, dramatically improving ease of setup and deployability. No need for Docker, or anything else.
*   **Robust, Pre-built Authentication:** We get secure, industry-standard authentication out of the box, including password hashing, JWT management, and email-based password recovery. Building this from scratch would be time-consuming and very error-prone especially utilising AI.
*   **Excellent Tooling:** The Supabase dashboard provides a powerful SQL Editor and an intuitive table viewer, which significantly sped up development and debugging. We can rapidly test out functionalities, adding sample data, making users Administrators and many other things.
*   **Simplified Backend Code:** The `supabase-js` client library provides a clean, fluent API for interacting with the database, reducing the amount of boilerplate data access code in our Express server.

**Negative:**

*   **Vendor Lock-in:** The application is now tightly coupled to Supabase's ecosystem. Migrating to a different database provider in the future would require a significant refactoring effort. At least, developer opinion on Supabase is overwhelmingly positive.
*   **External Service Dependency:** The application's uptime is dependent on Supabase's uptime. An outage at Supabase would render our application non-functional. Still, better than hosting locally.
*   **Free Tier Limitations:** The free plan has limits on database size, API request frequency, and the number of users. For a large-scale production application, this would incur costs.