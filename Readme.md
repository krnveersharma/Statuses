


# Statuses - Incident & Service Status Management

Statuses is a system for tracking incidents, services in an organization. This project uses a relational database  to manage and relate these entities.

## Project Setup Instructions

### Prerequisites

- **Node.js** (v16+ recommended) and **npm** or **yarn** (for the React client)
- **Go** (v1.23 ) (for the backend)
- **PostgreSQL** database (matching your schema, e.g., via Supabase or local Postgres)
- (Optional) **Git** for version control

---

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd Statuses
```

---

### 2. Setup the Backend (Go)

```bash
cd server
# Copy example env if present
cp .env.example .env   # Edit .env with your DB credentials

# Install dependencies (if using Go modules)
go mod tidy

# Run database migrations if any (customize as needed)
# go run migrate.go

# Start the server
go run main.go
```

---

### 3. Setup the Frontend (React)

```bash
cd ../client
# Install dependencies
npm install
# or
yarn install

# Start the development server
npm run dev
# or
yarn dev
```

---

### 4. Environment Variables

#### Backend (`server/.env`)
Create a `.env` file in the `server` directory with the following variables:

```env
# Database connection string (PostgreSQL DSN)
DSN=postgres://username:password@host:port/database

# Port for the Go server to run on
PORT=8080

# Clerk authentication keys
CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key

# Allowed hosts (comma-separated, e.g., localhost,127.0.0.1)
ALLOWED_HOST=localhost
```

#### Frontend (`client/.env`)
Create a `.env` file in the `client` directory with the following variables:

```env
# Base URL for the backend API
VITE_API_BASE_URL=http://localhost:8080

# Clerk publishable key for frontend authentication
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
```
---

### 5. Access the App

- **Frontend:**  
  Open [http://localhost:5173](http://localhost:5173) (or the port shown in your terminal).
- **Backend:**  
  The API will run on the port specified in your Go server (commonly `localhost:8080`).

---

### 6. Database

- Ensure your PostgreSQL database is running and matches the schema described above.
- You can use Supabase or a local Postgres instance.



## Database Schema Overview

### Tables

#### 1. services
- **id** (int4, PK): Service ID.
- **name** (varchar): Service name.
- **status** (service_status): Current status of the service.
- **created_at** (timestamp): Creation timestamp.
- **updated_at** (timestamp): Last update timestamp.
- **clerk_org_id** (text): Organization ID (FK to organizations).
- **created_by_clerk** (text): User who created the service.

#### 2. incidents
- **id** (int4, PK): Incident ID.
- **title** (varchar): Incident title.
- **description** (varchar): Incident description.
- **status** (incident_status): Current status of the incident.
- **started_at** (timestamp): When the incident started.
- **resolved_at** (timestamp): When the incident was resolved.
- **created_at** (timestamp): Creation timestamp.
- **updated_at** (timestamp): Last update timestamp.
- **clerk_org_id** (text): Organization ID (FK to organizations).
- **created_by_clerk** (text): User who created the incident.

#### 3. incident_updates
- **id** (int4, PK): Update ID.
- **incident_id** (int4, FK): Related incident.
- **message** (text): Update message.
- **status** (incident_status): Status at the time of update.
- **created_at** (timestamp): Update timestamp.
- **created_by_clerk** (text): User who made the update.

#### 4. service_incidents
- **service_id** (int4, FK): Related service.
- **incident_id** (int4, FK): Related incident.

---