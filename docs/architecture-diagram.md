# Momentum - High-Level Architecture Diagram

This diagram illustrates the 3-Tier Architecture of the Momentum application, showing the separation of concerns between the client, the server, and the database/authentication services.

```mermaid
graph TD
    subgraph "User's Browser"
        A[React Client (Vite)<br><em>Hosted on Vercel</em>]
    end

    subgraph "Render Cloud"
        B[Express API Server<br><em>Business Logic Tier</em>]
    end

    subgraph "Supabase Cloud"
        C[PostgreSQL Database<br><em>Data Tier</em>]
        D[Supabase Auth<br><em>Authentication Service</em>]
    end

    A -- "HTTPS API Calls (REST)" --> B
    B -- "Database Queries (supabase-js)" --> C
    B -- "JWT Validation" --> D
```

### How It Works:

1.  The **User** interacts with the **React Client** in their browser.
2.  The **React Client** makes secure HTTPS requests to the **Express API Server** to fetch data or perform actions. It never accesses the database directly.
3.  The **Express API Server** contains all business logic. It validates the user's JWT against **Supabase Auth** and then executes queries against the **PostgreSQL Database** to fulfill the request.