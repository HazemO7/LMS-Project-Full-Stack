# LMS Full-Stack Platform 🎓

A modern, full-stack Learning Management System (LMS) designed for a seamless educational experience. This project features a robust Node.js backend API and a responsive React frontend client, providing everything needed to manage courses, modules, lessons, and student enrollments.

---

## ✨ Features

- **User Authentication**: Secure JWT-based registration, login, and logout flow using Bcrypt for password hashing.
- **Role-Based Access Control**: Differentiated permissions for `student`, `instructor`, and `admin` roles.
- **Curriculum Management**: Complete CRUD operations for a nested hierarchy of Courses, Modules, and Lessons.
- **Enrollment & Progress Tracking**: Students can enroll in courses, mark lessons as complete, and view course-specific progress.
- **Data Validation**: Client-side validation using React Hook Form and robust server-side request validation using Joi.
- **Automated Database Seeding**: Automatic creation of a default admin and insertion of realistic demo courses upon initialization.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: [React 19](https://react.dev/) (Bootstrapped with [Vite](https://vitejs.dev/))
- **Styling**: [Bootstrap](https://getbootstrap.com/) & [React-Bootstrap](https://react-bootstrap.github.io/)
- **Routing**: [React Router DOM](https://reactrouter.com/)
- **Form Handling**: [React Hook Form](https://react-hook-form.com/)
- **Icons**: Bootstrap Icons

### Backend
- **Environment**: [Node.js](https://nodejs.org/)
- **Framework**: [Express.js](https://expressjs.com/)
- **Database**: [MongoDB](https://www.mongodb.com/) via [Mongoose](https://mongoosejs.com/)
- **Security & Validation**: JSON Web Tokens (JWT), Bcrypt, Joi
- **CORS**: Enabled for frontend-backend communication

### Infrastructure
- **Containerization**: Docker & Docker Compose

---

## 📁 Project Structure

```text
LMS-Project-Full-Stack/
├── docker-compose.yml   # Multi-container orchestration
├── backend/             # Node.js Express API
│   ├── app.js           # Server Entry Point
│   ├── Dockerfile       # Backend Container config
│   ├── .env.example     # Environment template
│   └── src/
│       ├── controllers/ # Request handlers
│       ├── middleware/  # Auth & validation guards
│       ├── models/      # Mongoose Schemas (User, Course, Module, Lesson, etc.)
│       ├── routes/      # API Route Definitions
│       └── seed/        # Database seeders (Admin & Courses)
└── frontend/            # React Client Application
    ├── Dockerfile       # Frontend Container config
    ├── vite.config.js   # Vite builder configuration
    └── src/
        └── (React Components, Pages, and Context)
```

---

## 🐳 Docker Architecture

The recommended execution environment utilizes **Docker Compose** to orchestrate three distinct containers:
1. **Database Container (`mern_mongodb`)**: Runs the official `mongo:6.0` image with a persistent volume (`mongo_data`) so your data is saved across container restarts.
2. **Backend Container (`mern_backend`)**: Builds the Node.js API environment and automatically links to the MongoDB service.
3. **Frontend Container (`mern_frontend`)**: Builds and serves the Vite React application.

---

## 🚦 Getting Started

### Quick Start (Docker - Recommended)

The easiest and recommended way to run this project is using Docker. This ensures a consistent environment and automates the entire setup process.

**Prerequisites:**
- [Docker](https://www.docker.com/get-started)
- [Docker Compose](https://docs.docker.com/compose/install/)

1. **Clone the repository**
   ```bash
   git clone https://github.com/HazemO7/LMS-Project-Full-Stack.git
   cd LMS-Project-Full-Stack
   ```

2. **Run with Docker Compose**
   ```bash
   docker compose up --build
   ```

This single command automatically:
- Starts a MongoDB instance
- Builds and configures the backend API
- Builds and configures the frontend client
- Runs all containers simultaneously
- Automatically creates a default admin user if none exists
- Automatically seeds demo courses if the database is empty

#### Exposed Services
Once the containers are running, access the application via:
- **Frontend App**: [http://localhost](http://localhost) (Port 80)
- **Backend API**: [http://localhost:5000](http://localhost:5000)
- **MongoDB**: `localhost:27017`

---

### Local Development (Without Docker)

If you prefer to run the project manually on your host machine:

**Prerequisites:**
- [Node.js](https://nodejs.org/) (v16 or higher)
- A running [MongoDB](https://www.mongodb.com/try/download/community) instance (Local or Atlas)

1. **Clone the repository**
   ```bash
   git clone https://github.com/HazemO7/LMS-Project-Full-Stack.git
   cd LMS-Project-Full-Stack
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install

   # Setup environment variables by copying the example file
   cp .env.example .env
   ```
   *(Ensure your MongoDB is running locally before starting the backend)*
   ```bash
   npm run dev 
   ```

3. **Frontend Setup**
   ```bash
   # Open a new terminal session
   cd frontend
   npm install
   npm run dev
   ```

---

## 🔐 Environment Variables

The backend relies on the following environment variables. A `.env.example` file is provided in the `backend/` directory.

| Variable | Description |
| :--- | :--- |
| `PORT` | The port the backend API runs on (e.g., `5000` or `8000`) |
| `DB_URL` | MongoDB connection string (e.g., `mongodb://localhost:27017/lms` or `mongodb://database:27017/my_database` for Docker) |
| `JWT_SECRET` | Secret key used for signing JWT tokens |
| `ADMIN_NAME` | Name for the automatically seeded admin account |
| `ADMIN_EMAIL` | Email for the automatically seeded admin account |
| `ADMIN_PASSWORD` | Password for the automatically seeded admin account (hashed upon insertion) |

---

## 🪴 Automatic Database Seeding

When the backend starts and connects to MongoDB, it automatically performs an idempotent database seeding process via an orchestrator (`src/seed/index.js`):
- **Default Admin**: Automatically created only if no user with the `admin` role currently exists.
- **Demo Courses**: A set of professional demo courses, complete with nested modules and lessons, are automatically inserted only if the `courses` collection is completely empty.
- **Idempotency**: The seed process checks existing collections and ensures that duplicate records are never created on subsequent API restarts.

---

## 🔌 API Overview

### Authentication (`/api/auth`)
- `POST /register`: Register a new user
- `POST /login`: Authenticate and receive a JWT token
- `POST /logout`: Logout user

### Users (`/api/users`)
- `GET /me`: Get current authenticated user profile
- `PATCH /me`: Update current user profile
- `PATCH /:id/role`: Update a user's role (Admin only)

### Courses (`/api/courses`)
- `GET /`: Retrieve all courses
- `POST /`: Create a new course (Admin/Instructor)
- `GET /:id`: Retrieve a course by ID
- `GET /:id/full`: Retrieve full course data with modules & lessons (Requires Enrollment)
- `PUT /:id`: Update a course (Admin/Instructor)
- `DELETE /:id`: Delete a course (Admin/Instructor)
- `POST /:id/enroll`: Enroll the authenticated student in a course

### Modules (`/api/modules`)
- `GET /`, `GET /:id`: Retrieve modules
- `POST /`, `PUT /:id`, `DELETE /:id`: Manage modules (Admin/Instructor)

### Lessons (`/api/lessons`)
- `GET /`, `GET /:id`: Retrieve lessons
- `POST /`, `PUT /:id`, `DELETE /:id`: Manage lessons (Admin/Instructor)

### Progress & Enrollments (Root App Routes)
- `GET /api/my-courses`: List courses the authenticated student is enrolled in
- `POST /api/lessons/:id/complete`: Mark a specific lesson as complete
- `GET /api/courses/:id/progress`: Get student progress percentage for a course



## 🚀 Future Improvements

- **Stripe Integration**: Add a payment gateway for purchasing premium courses.
- **File Uploads**: Support for uploading custom course thumbnail images and PDF attachments (via Multer/AWS S3).
- **Video Hosting**: Direct video uploads or integration with Vimeo/Mux instead of standard URLs.
- **Quiz System**: Add automated quizzes and assignments to evaluate student comprehension.
- **Real-time Notifications**: Notify students when new lessons are added to their enrolled courses.

---

## 📄 License

This project is licensed under the [MIT License](https://opensource.org/licenses/MIT) - see the LICENSE file for details.

Developed with ❤️ for the education community.
