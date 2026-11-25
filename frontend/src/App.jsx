import React from 'react';
import { BrowserRouter as Router, Link, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthProvider';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { ProtectedRoute } from './components/ProtectedRoute';

import { Home } from './pages/Home';
import { About } from './pages/About';
import { Contact } from './pages/Contact';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { ForgotPassword } from './pages/ForgotPassword';
import { ResetPassword } from './pages/ResetPassword';
import { Courses } from './pages/Courses';
import { CourseDetails } from './pages/CourseDetails';
import { CreateCourse } from './pages/CreateCourse';
import { Profile } from './pages/Profile';

const NotFound = () => (
  <section className="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center">
    <p className="font-mono-tabular text-sm font-medium text-[#1D4ED8]">404</p>
    <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-[#0F172A]">
      Page not found
    </h1>
    <p className="mt-3 text-sm leading-relaxed text-[#475569]">
      The route you opened does not exist or may have moved.
    </p>
    <Link
      to="/courses"
      className="mt-6 rounded-lg bg-[#1D4ED8] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#1E40AF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8] focus-visible:ring-offset-2"
    >
      Browse courses
    </Link>
  </section>
);

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="flex min-h-screen flex-col bg-[#F7F8FA] text-[#0F172A]">
          <Navbar />
          <main className="flex-1">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/courses" element={<Courses />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password/:token" element={<ResetPassword />} />

              {/* Protected Routes */}
              <Route
                path="/course/new"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'instructor']}>
                    <CreateCourse />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/course/:id"
                element={
                  <ProtectedRoute>
                    <CourseDetails />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
