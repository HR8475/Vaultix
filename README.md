# Vaultix — Secrets Management Platform

A modern, full-stack secrets management platform built with the MERN stack (MongoDB, Express, React, Node.js).

> **Note:** This is the foundation layer. Secret encryption logic is not yet implemented.

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                    React Frontend                    │
│         (Vite + React Router + Axios)               │
│  ┌──────────┐  ┌──────────┐  ┌─────────────────┐   │
│  │  Auth     │  │  Layout  │  │  Pages           │  │
│  │  Context  │  │  Shell   │  │  (Dashboard,     │  │
│  │          │  │  (Sidebar │  │   Projects,      │  │
│  │          │  │   Topbar) │  │   Environments)  │  │
│  └──────────┘  └──────────┘  └─────────────────┘   │
└────────────────────┬────────────────────────────────┘
                     │ /api/v1/*
                     ▼
┌─────────────────────────────────────────────────────┐
│                  Express Backend                     │
│  ┌─────────┐  ┌────────────┐  ┌──────────────────┐  │
│  │ Routes  │→ │ Middleware │→ │  Controllers     │  │
│  │         │  │ (auth,rbac │  │  (auth,workspace │  │
│  │         │  │  validate) │  │   project,env)   │  │
│  └─────────┘  └────────────┘  └────────┬─────────┘  │
│                                        │             │
│  ┌──────────────┐  ┌──────────────────┘             │
│  │  Services    │  │                                 │
│  │ (auth,audit) │←─┘                                │
│  └──────┬───────┘                                    │
└─────────┼───────────────────────────────────────────┘
          │
          ▼
┌─────────────────────┐
│     MongoDB          │
│  ┌───────────────┐   │
│  │ Users         │   │
│  │ Workspaces    │   │
│  │ Projects      │   │
│  │ Environments  │   │
│  │ Secrets       │   │
│  │ AuditLogs     │   │
│  └───────────────┘   │
└─────────────────────┘
```

## 📁 Project Structure

```
├── client/                     # React frontend
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   │   ├── common/         # Button, Input, Spinner, ProtectedRoute
│   │   │   ├── layout/         # Sidebar, Topbar, DashboardLayout
│   │   │   └── ui/             # Logo
│   │   ├── context/            # AuthContext (user state)
│   │   ├── pages/              # Login, Signup, Dashboard, Project, Environment
│   │   ├── services/           # Axios API instance
│   │   └── styles/             # CSS design system
│   └── vite.config.js          # Dev proxy → backend
│
├── server/                     # Express backend
│   ├── config/                 # Database connection
│   ├── controllers/            # Request handlers
│   ├── middleware/              # Auth, RBAC, validation, errors
│   ├── models/                 # Mongoose schemas
│   ├── routes/                 # API route definitions
│   ├── services/               # Business logic (auth, audit)
│   ├── utils/                  # ApiError, constants
│   └── server.js               # Entry point
│
├── .env.example                # Environment variable template
└── .gitignore
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)

### 1. Clone and set up environment
```bash
cp .env.example server/.env
# Edit server/.env with your MongoDB URI and JWT secret
```

### 2. Start the backend
```bash
cd server
npm install
npm run dev
```
Server runs on `http://localhost:5000`

### 3. Start the frontend
```bash
cd client
npm install
npm run dev
```
Client runs on `http://localhost:5173` (proxies `/api` to backend)

---

## 🔐 Authentication Flow

1. **Signup** → `POST /api/v1/auth/signup` → Creates user, hashes password (bcrypt, 12 rounds), returns JWT
2. **Login** → `POST /api/v1/auth/login` → Validates credentials, returns JWT
3. **JWT Storage** → Token stored in httpOnly cookie + localStorage
4. **Protected Routes** → `auth.js` middleware extracts & verifies JWT, attaches `req.user`
5. **Frontend** → `AuthContext` checks `/auth/me` on mount, `ProtectedRoute` redirects if not authenticated
6. **Logout** → Clears cookie and localStorage token

## 👥 Role-Based Access Control

Workspaces have a `members[]` array with roles:

| Role | Permissions |
|------|------------|
| `owner` | Full access, manage members and roles |
| `admin` | Manage members, create/edit/delete resources |
| `member` | Create and edit resources |
| `viewer` | Read-only access |

The `requireRole()` middleware enforces this on every workspace-scoped route.

## 📊 Data Models

| Model | Purpose | Key Relations |
|-------|---------|---------------|
| **User** | Authentication & identity | — |
| **Workspace** | Top-level org container | Has owner (User), members[] |
| **Project** | Groups environments | Belongs to Workspace |
| **Environment** | Groups secrets (dev, staging, prod) | Belongs to Project |
| **Secret** | Key-value pairs | Belongs to Environment |
| **AuditLog** | Activity tracking | References User + Workspace |

**Hierarchy:** Workspace → Project → Environment → Secret

## 📡 API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/signup` | Create account |
| POST | `/api/v1/auth/login` | Sign in |
| POST | `/api/v1/auth/logout` | Sign out |
| GET | `/api/v1/auth/me` | Get current user |

### Workspaces
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/workspaces` | Create workspace |
| GET | `/api/v1/workspaces` | List user's workspaces |
| GET | `/api/v1/workspaces/:id` | Get workspace |
| POST | `/api/v1/workspaces/:id/members` | Add member |
| PATCH | `/api/v1/workspaces/:id/members/:userId` | Update role |

### Projects & Environments
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/workspaces/:wid/projects` | Create project |
| GET | `/api/v1/workspaces/:wid/projects` | List projects |
| POST | `/api/v1/workspaces/:wid/environments/:pid` | Create environment |
| GET | `/api/v1/workspaces/:wid/environments/:pid` | List environments |

## 🤖 API Key Authentication

Vaultix supports machine-to-machine authentication via API keys, ideal for CI/CD pipelines, Docker containers, and automated scripts.

### 1. Create an API Key
- Navigate to **API Keys** in the Vaultix dashboard.
- Click **Create API Key**.
- Assign a name, scope, expiration, and permissions (e.g. `env.pull`).
- **Copy the key** (it will never be shown again).

### 2. Using Vaultix CLI in CI/CD (GitHub Actions)

Store your API key as a secret in your repository (e.g. `VAULTIX_TOKEN`), then use it in your workflow:

```yaml
name: Deploy with Vaultix Secrets
on: [push]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      # The CLI will automatically use the VAULTIX_TOKEN env var if present
      - name: Pull Secrets
        env:
          VAULTIX_TOKEN: ${{ secrets.VAULTIX_TOKEN }}
        run: |
          npx vaultix pull --env production --output .env.prod
```

Alternatively, you can authenticate manually:
```bash
vaultix auth "vx_live_xxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

---

## 🔮 Next Steps

- [ ] Secret encryption (AES-256-GCM)
- [ ] Secret versioning and rollback
- [x] API key generation for CI/CD
- [ ] Team invitation via email
- [x] Audit log viewer page
- [x] Secret import/export (`.env` files)
- [ ] Webhook notifications
- [ ] Rate limiting and IP allowlisting

