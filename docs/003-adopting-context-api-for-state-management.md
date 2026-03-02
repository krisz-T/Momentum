# ADR 003: Adopting a Context API for Frontend State Management

**Date:** 2026-03-27

**Status:** Accepted

## Context

The React application has several components across different levels of the component tree that require access to global state, specifically the user's authentication status (`session`) and their profile data (`userProfile`). The initial approach of passing this data down from the main `App.jsx` component through multiple layers of props ("prop drilling") was becoming cumbersome and difficult to maintain. This tight coupling made refactoring difficult and cluttered intermediate components with props they didn't use themselves.

We needed a solution to provide this global state to any component that needs it without this explicit prop-passing chain.

## Decision

We will use React's built-in **Context API** to create a dedicated `AuthContext`.

1.  An `AuthProvider` component will wrap the entire application in `main.jsx`.
2.  This provider is responsible for all authentication-related state logic: fetching the initial session, listening for authentication state changes, and fetching the corresponding user profile.
3.  A custom hook, `useAuth()`, is exposed to allow any component in the application to easily and cleanly consume the `session` and `userProfile` values.

We explicitly decided *against* using a more complex external state management library like Redux or Zustand. The application's global state needs are primarily centered around authentication and are not expected to involve frequent, high-performance updates that would necessitate a more powerful solution.

## Consequences

**Positive:**

*   **Eliminates Prop Drilling:** Components like `Header`, `MyProfile`, and `ProtectedRoute` can now directly access user data, making them cleaner and more decoupled.
*   **Centralized Logic:** All authentication state logic is co-located within the `AuthProvider`. This dramatically simplified the `App.jsx` component, turning it into a pure router.
*   **Improved Maintainability:** Adding a new component that requires authentication data is now trivial; it simply needs to call the `useAuth` hook.
*   **No External Dependencies:** We are using a core feature of React, which avoids adding another third-party library to the project bundle, keeping it lightweight.

**Negative:**

*   **Re-render Performance:** A naive implementation of Context can cause all consuming components to re-render whenever any part of the context value changes. We have mitigated this by keeping the context focused only on slowly changing auth state. For more complex, frequently changing global state, this might not be the optimal solution.
*   **Not as Powerful as Dedicated Libraries:** For applications with extremely complex state interactions (e.g., requiring middleware, time-travel debugging), a dedicated library like Redux offers more powerful developer tools. This is an acceptable trade-off for our current scope.