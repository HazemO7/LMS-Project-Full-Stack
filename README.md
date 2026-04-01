# LMS Full-Stack Platform 🎓

A modern, full-stack Learning Management System (LMS) designed for a seamless educational experience. This project features a robust Node.js backend and a responsive React frontend, providing everything needed to manage courses, lessons, and student progress.

### 📚 Documentation
- **[Backend Documentation](BACKEND.md)**: Detailed API reference, database models, and security middleware.
- **[Frontend Documentation](frontend/README.md)**: UI components, state management, and styling details.

---

## 🚀 Features

### Core Functionalities
- **User Authentication**: Secure JWT-based authentication for students and instructors.
- **Course Management**: Complete CRUD operations for courses, modules, and lessons.
- **Progress Tracking**: Students can track their completion of lessons and view overall course progress.
- **Role-Based Access**: Specialized access for students and potential instructor/admin roles.
- **Curriculum Structure**: Nested hierarchy of Courses → Modules → Lessons.

### Technical Highlights
- **Responsive Design**: Built with Bootstrap for a great experience on any device.
- **Form Validation**: Client-side validation using React Hook Form and backend validation with Joi.
- **Secure Storage**: Password hashing using Bcrypt.
- **State Management**: React-based state management with modern hooks.

---

## 🛠️ Tech Stack

### Backend
- **Framework**: [Express.js](https://expressjs.com/)
- **Database**: [MongoDB](https://www.mongodb.com/) with [Mongoose](https://mongoosejs.com/)
- **Security**: JSON Web Tokens (JWT), Bcrypt
- **Validation**: Joi
- **Environment**: Node.js

### Frontend
- **Framework**: [React](https://reactjs.org/) (Vite)
- **Styling**: [Bootstrap](https://getbootstrap.com/) & [React-Bootstrap](https://react-bootstrap.github.io/)
- **Routing**: [React Router](https://reactrouter.com/)
- **Form Handling**: [React Hook Form](https://react-hook-form.com/)
- **Icons**: [Bootstrap Icons](https://icons.getbootstrap.com/)

---

## 📁 Project Structure

```text
LMS-Project/
├── app.js               # Backend Entry Point
├── src/                 # Backend Source
│   ├── controllers/     # Route Controllers
│   ├── middleware/      # Auth & Global Middlewares
│   ├── models/          # Mongoose Schemas
│   └── routes/          # API Route Definitions
├── frontend/            # React Client Application
│   ├── src/
│   │   ├── components/  # Reusable UI Components
│   │   ├── pages/       # View Layouts
│   │   └── context/     # Auth & App States
│   └── vite.config.js   # Vite Configuration
└── .env                 # Environment Variables
```

---

## 🚦 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v16 or higher)
- [MongoDB](https://www.mongodb.com/try/download/community) (Local or Atlas)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/HazemO7/LMS-Project-Full-Stack.git
   cd LMS-Project-Full-Stack
   ```

2. **Backend Setup**
   ```bash
   # Install dependencies
   npm install

   # Setup environment variables
   # Create a .env file in the root
   PORT=8000
   DB_URL=your_mongodb_connection_string
   JWT_SECRET=your_secret_key
   # Initial Admin Credentials (Optional)
   ADMIN_NAME=Admin
   ADMIN_EMAIL=admin@lms.com
   ADMIN_PASSWORD=admin123
   ```

3. **Frontend Setup**
   ```bash
   cd frontend
   # Install dependencies
   npm install
   ```

### Running the Application

1. **Start the Backend** (from the root directory)
   ```bash
   npm run dev 
   # or
   node app.js
   ```

2. **Start the Frontend** (from the frontend directory)
   ```bash
   npm run dev
   ```

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/auth/register` | User registration |
| `POST` | `/api/auth/login` | User login |
| `GET` | `/api/courses` | List all courses |
| `GET` | `/api/my-courses` | List courses enrolled by user |
| `POST` | `/api/lessons/:id/complete` | Mark a lesson as complete |
| `GET` | `/api/courses/:id/progress` | Get student progress for a course |

Developed with ❤️ for the education community.
