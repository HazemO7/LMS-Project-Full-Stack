# LMS Full-Stack Platform

A modern, full-stack Learning Management System (LMS) built with a Node.js/Express/MongoDB backend API and a React + Vite frontend client for managing courses, modules, lessons, enrollments, and student progress.

---

## Features

- **User Authentication & Security**: JWT-based registration, login, logout, password change, and forgot/reset password flow using `bcrypt` hashing, `helmet`, CORS, and `express-rate-limit` account lockout/rate limiting.
- **Role-Based Access Control**: Differentiated permissions for `student`, `instructor`, and `admin` roles.
- **Curriculum Management**: Full CRUD management for Courses, Modules, and Lessons (including embedded YouTube lesson videos).
- **Enrollment & Progress Tracking**: Students can browse/search courses, enroll, mark lessons as complete, and track course completion progress.
- **Validation & Logging**: Client-side forms via React Hook Form, server-side schema validation via Joi, and structured request/error logging via Morgan + Winston.
- **Automated Database Seeding**: Automatically creates a default admin account and seeds demo courses with modules and lessons on initial startup.

---

## Tech Stack

### Frontend
- **Framework**: React 19 + Vite 8
- **Styling & Icons**: Tailwind CSS (`@tailwindcss/vite`) & Phosphor Icons (`@phosphor-icons/react`)
- **Routing & Forms**: React Router DOM 7 & React Hook Form 7

### Backend
- **Runtime & Framework**: Node.js + Express 5
- **Database**: MongoDB via Mongoose 9
- **Security & Validation**: JSON Web Tokens (`jsonwebtoken`), `bcrypt`, `joi`, `helmet`, `cors`, `express-rate-limit`
- **Email & Logging**: Nodemailer (with automatic console mock fallback in dev), Morgan, Winston

### Infrastructure
- **Containerization**: Docker & Docker Compose (`mongo:6.0`, Node backend, Nginx frontend)

---

## Project Structure

```text
LMS-Project-Full-Stack/
├── docker-compose.yml       # Orchestrates MongoDB, backend, and frontend containers
├── README.md
├── backend/                 # Express REST API
│   ├── app.js               # Server entry point
│   ├── Dockerfile
│   ├── .env.example         # Backend environment template
│   ├── package.json         # Scripts: start, dev
│   ├── scripts/
│   │   └── createAdmin.js   # Manual admin creation script
│   └── src/
│       ├── controllers/     # Route handlers
│       ├── middleware/      # Auth, enrollment guard, rate limiters, error & request logging
│       ├── models/          # Mongoose schemas (User, Course, Module, Lesson, Enrollment, Progress)
│       ├── routes/          # API route definitions
│       ├── seed/            # Idempotent admin & demo course seeders
│       ├── services/        # Auth token & email services
│       ├── utils/           # Logger, AppError, catchAsync, password policy
│       └── validators/      # Joi validation schemas
└── frontend/                # React + Vite client application
    ├── Dockerfile
    ├── nginx.conf
    ├── vite.config.js
    └── src/
        ├── components/
        ├── context/
        ├── pages/
        ├── services/        # API client (defaults to http://localhost:8000/api)
        └── utils/
```

---

## Prerequisites

Choose either **Docker** (easiest) or **Local Development**:

- **For Docker**:
  - [Docker Desktop](https://www.docker.com/get-started) (with Docker Compose v2)
- **For Local Development (without Docker)**:
  - [Node.js](https://nodejs.org/) **v20.19+** or **v22.12+** (v22 LTS recommended; required by Vite 8 and Mongoose 9)
  - `npm` (v10+)
  - A running [MongoDB](https://www.mongodb.com/try/download/community) instance (local MongoDB service, MongoDB Atlas, or the Docker `database` container)

---

## Quick Start (Docker — Recommended)

1. **Clone the repository**
   ```bash
   git clone https://github.com/HazemO7/LMS-Project-Full-Stack.git
   cd LMS-Project-Full-Stack
   ```

2. **Create `backend/.env` (Required before running Docker Compose)**
   `docker-compose.yml` loads environment variables from `./backend/.env`.

   **macOS / Linux / Git Bash:**
   ```bash
   cp backend/.env.example backend/.env
   ```

   **Windows PowerShell:**
   ```powershell
   Copy-Item backend\.env.example backend\.env
   ```

   Edit `backend/.env` and replace `JWT_SECRET` with a strong random secret (and optionally set `CLIENT_URL=http://localhost` for Docker password-reset links).

3. **Build and start all containers**
   ```bash
   docker compose up -d --build
   ```

   This automatically:
   - Starts MongoDB (`mern_mongodb`) with persistent storage (`mongo_data` volume)
   - Waits for MongoDB to pass its health check
   - Starts the Express API (`mern_backend`) and connects to `mongodb://database:27017/lms`
   - Seeds the default admin user and 7 demo courses if the database is empty
   - Builds and serves the React app (`mern_frontend`) via Nginx

4. **Access the application**
   - **Frontend App**: [http://localhost](http://localhost) (Port `80`)
   - **Backend API**: [http://localhost:8000/api/courses](http://localhost:8000/api/courses) (Port `8000`)
   - **MongoDB**: `localhost:27017`

5. **Useful Docker commands**
   ```bash
   docker compose ps                 # Check container status
   docker compose logs -f backend    # View backend & seeding logs
   docker compose down               # Stop containers (keeps database data)
   docker compose down -v            # Stop containers and wipe database volume
   ```

---

## Hybrid Mode (Docker MongoDB + Local Dev Servers)

Best for active development when you want hot-reloading (`nodemon` + Vite HMR) without installing MongoDB locally:

1. **Start only the MongoDB container** (from `LMS-Project-Full-Stack/`):
   ```bash
   docker compose stop backend frontend   # only needed if the full Docker stack was running
   docker compose up -d database
   ```
   MongoDB will be available at `localhost:27017` with persistent storage (`mongo_data`).

2. **Configure and start the backend locally** (Terminal 1):
   ```bash
   cd backend
   npm install
   cp .env.example .env   # PowerShell: Copy-Item .env.example .env
   npm run dev
   ```
   *(Ensure `DB_URL=mongodb://localhost:27017/lms` and `CLIENT_URL=http://localhost:5173` in `backend/.env`.)*

3. **Start the frontend locally** (Terminal 2):
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

4. **Access the application**:
   - **Frontend App**: [http://localhost:5173](http://localhost:5173)
   - **Backend API**: [http://localhost:8000/api/courses](http://localhost:8000/api/courses)

---

## Local Development (Without Docker)

> **Note**: If you previously started the Docker stack, stop the Docker `backend` and `frontend` containers first so ports `8000` and `80` are free (you can keep `database` running if you want to use containerized MongoDB):
> ```bash
> docker compose stop backend frontend
> ```

### 1. Start MongoDB
Ensure MongoDB is running on `localhost:27017`:
- **Using Docker just for MongoDB**:
  ```bash
  docker compose up -d database
  ```
- **Or using a local MongoDB installation / Atlas**: Start your local `mongod` / `MongoDB` service, or set `DB_URL` in `backend/.env` to your MongoDB Atlas connection string.

### 2. Backend Setup
```bash
cd backend
npm install
```

Create `backend/.env` from the example template:
```bash
# macOS / Linux / Git Bash
cp .env.example .env
```
```powershell
# Windows PowerShell
Copy-Item .env.example .env
```

Update `backend/.env` as needed (at minimum set a strong `JWT_SECRET` and `CLIENT_URL=http://localhost:5173`), then start the API server:
```bash
npm run dev     # Starts with nodemon (auto-reloads on file changes)
# or
npm start       # Starts directly with node app.js
```

The backend API will run at [http://localhost:8000](http://localhost:8000).

### 3. Frontend Setup
Open a new terminal in the repository root:
```bash
cd frontend
npm install
npm run dev
```

The frontend dev server will run at [http://localhost:5173](http://localhost:5173) and connect to `http://localhost:8000/api` by default.

Available frontend scripts:
- `npm run dev` — Start Vite development server
- `npm run build` — Build production bundle into `frontend/dist`
- `npm run preview` — Preview the production build locally
- `npm run lint` — Run ESLint

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Default / Example | Description |
| :--- | :--- | :--- | :--- |
| `PORT` | No (Recommended) | `8000` (code fallback `3000`) | Port the Express API listens on. Keep `8000` so the frontend connects properly. |
| `DB_URL` | Yes | `mongodb://localhost:27017/lms` | MongoDB connection string (`MONGO_URI` is also accepted as an alias). `docker-compose.yml` automatically sets `mongodb://database:27017/lms` inside Docker. |
| `JWT_SECRET` | Yes | *(generate a strong random string)* | Secret key used to sign and verify JWT tokens. |
| `CLIENT_URL` | Recommended | `http://localhost:5173` (local) / `http://localhost` (Docker) | Allowed CORS origin and base URL used for password-reset links (falls back to `http://localhost:3000` if unset). |
| `NODE_ENV` | Recommended | `development` | Set to `development` for verbose logs/stack traces, or `production` for info-level logs and sanitized errors. |
| `ADMIN_NAME` | For auto-seed | `Admin` | Display name for the seeded admin account. |
| `ADMIN_EMAIL` | For auto-seed | `admin@lms.com` | Email for the seeded admin account. |
| `ADMIN_PASSWORD` | For auto-seed | `admin123` | Password for the seeded admin account (hashed with bcrypt on insert). |
| `SMTP_HOST` | Optional | — | SMTP server host for sending password-reset emails. |
| `SMTP_PORT` | Optional | `587` | SMTP server port (`465` uses TLS/SSL). |
| `SMTP_USER` | Optional | — | SMTP authentication username. |
| `SMTP_PASS` | Optional | — | SMTP authentication password. |
| `SMTP_FROM` | Optional | `"LMS Support" <noreply@example.com>` | Sender address for outgoing emails. |

> **Email behavior in development**: If `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, or `SMTP_PASS` are omitted, password-reset requests still succeed and log the reset link (`MOCK EMAIL DISPATCHED ...`) to the backend console and `backend/logs/combined.log`.

### Frontend (`frontend/.env.local`, optional)

| Variable | Required | Default | Description |
| :--- | :--- | :--- | :--- |
| `VITE_API_URL` | Optional | `http://localhost:8000/api` | Base API URL used by `frontend/src/services/api.js`. |

---

## Automatic Database Seeding & Default Admin

When the backend connects to MongoDB, `src/seed/index.js` runs automatically:
- **Default Admin**: Created only if no user with `role: "admin"` exists and `ADMIN_NAME`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD` are set.
  - Default credentials from `.env.example`: `admin@lms.com` / `admin123` (change in production).
  - You can also run `node scripts/createAdmin.js` inside `backend/` manually.
- **Demo Courses**: Inserts 7 sample courses (with nested modules and lessons in the first course) only if the `courses` collection is empty.

### Password Rules (Registration & Password Reset)
New registrations and password updates/resets enforce a minimum of **8 characters** containing at least:
- 1 uppercase letter
- 1 lowercase letter
- 1 number
- 1 special character (`!@#$%^&*(),.?":{}|<>`)

---

## API Overview

Base URL: `http://localhost:8000/api`

### Authentication (`/api/auth`)
- `POST /register` — Register a new `student` user
- `POST /login` — Authenticate and receive a JWT token
- `POST /logout` — Logout user
- `POST /forgot-password` — Request a password reset link (15-minute expiry)
- `PUT /reset-password/:token` — Reset password using a reset token
- `PUT /change-password` — Change password for the authenticated user

### Users (`/api/users`)
- `GET /me` — Get current authenticated user profile
- `PATCH /me` — Update current user profile
- `PATCH /:id/role` — Update a user's role (`admin` only)

### Courses (`/api/courses`)
- `GET /` — List courses (supports `page`, `limit`, `search`)
- `POST /` — Create a course (`admin` / `instructor`)
- `GET /:id` — Get course summary (authenticated)
- `GET /:id/full` — Get course with modules and lessons (enrolled student, course instructor, or `admin`)
- `PUT /:id` — Update a course (course instructor or `admin`)
- `DELETE /:id` — Delete a course (course instructor or `admin`)
- `POST /:id/enroll` — Enroll the authenticated student in a course

### Modules (`/api/modules`) & Lessons (`/api/lessons`)
- `GET /`, `GET /:id` — Retrieve modules or lessons
- `POST /`, `PUT /:id`, `DELETE /:id` — Manage modules or lessons (`admin` / `instructor`)

### Progress & Enrollments
- `GET /api/my-courses` — List courses the authenticated student is enrolled in
- `POST /api/lessons/:id/complete` — Mark a lesson as complete (`student`)
- `GET /api/courses/:id/progress` — Get student progress percentage for a course (`student`)

---

## Troubleshooting

- **`env file .../backend/.env not found` when running Docker Compose**
  Create `backend/.env` from `backend/.env.example` before running `docker compose up --build`.
- **`error in connction Data Base: connect ECONNREFUSED 127.0.0.1:27017`**
  MongoDB is not running locally. Either start your local MongoDB service (on Windows PowerShell as Administrator: `Start-Service MongoDB`), use `docker compose up -d database`, or point `DB_URL` to a MongoDB Atlas URI.
- **`listen EADDRINUSE: address already in use :::8000` (or Port `80` / `5173`)**
  Another instance (such as a running Docker container or local dev server) is already bound to that port. Stop the conflicting process or run `docker compose down`.
- **Password reset link points to `localhost:3000`**
  Set `CLIENT_URL=http://localhost:5173` (for Vite local dev) or `CLIENT_URL=http://localhost` (for Docker) in `backend/.env`.
- **Frontend cannot reach the backend API**
  Verify `PORT=8000` in `backend/.env` and that `http://localhost:8000/api/courses` responds. If your backend runs on a different URL/port, set `VITE_API_URL` in `frontend/.env.local`.

---

## License

This project is licensed under the [MIT License](https://opensource.org/licenses/MIT).
