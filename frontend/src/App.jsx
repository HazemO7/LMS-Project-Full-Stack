import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Link, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthProvider';
import { useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageProvider';
import { useLanguage } from './context/LanguageContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { ProtectedRoute } from './components/ProtectedRoute';

import { Home } from './pages/Home';
import { Courses } from './pages/Courses';

const About = lazy(() =>
  import('./pages/About').then((m) => ({ default: m.About }))
);
const Contact = lazy(() =>
  import('./pages/Contact').then((m) => ({ default: m.Contact }))
);
const Login = lazy(() =>
  import('./pages/Login').then((m) => ({ default: m.Login }))
);
const Register = lazy(() =>
  import('./pages/Register').then((m) => ({ default: m.Register }))
);
const ForgotPassword = lazy(() =>
  import('./pages/ForgotPassword').then((m) => ({ default: m.ForgotPassword }))
);
const ResetPassword = lazy(() =>
  import('./pages/ResetPassword').then((m) => ({ default: m.ResetPassword }))
);
const CourseDetails = lazy(() =>
  import('./pages/CourseDetails').then((m) => ({ default: m.CourseDetails }))
);
const CreateCourse = lazy(() =>
  import('./pages/CreateCourse').then((m) => ({ default: m.CreateCourse }))
);
const Profile = lazy(() =>
  import('./pages/Profile').then((m) => ({ default: m.Profile }))
);
const AdminDashboard = lazy(() =>
  import('./pages/AdminDashboard').then((m) => ({ default: m.AdminDashboard }))
);

const RouteFallback = () => {
  const { t } = useLanguage();
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div
        className="h-7 w-7 animate-spin rounded-full border-2 border-[#99F6E4] border-t-[#0D9488]"
        role="status"
        aria-label={t('common.loadingPage')}
      />
    </div>
  );
};

const NotFound = () => {
  const { t } = useLanguage();
  return (
    <section className="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center">
      <span className="rounded-full bg-[#FEF3C7] px-3 py-1 font-mono-tabular text-xs font-semibold text-[#92400E] ring-1 ring-[#FDE68A]">
        404
      </span>
      <h1 className="mt-4 font-display text-3xl font-bold tracking-tight text-[#0D2E2F]">
        {t('notFound.title')}
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-[#335C5D]">
        {t('notFound.body')}
      </p>
      <Link
        to="/courses"
        className="mt-6 rounded-lg bg-[#0D9488] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#0F766E] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D9488] focus-visible:ring-offset-2"
      >
        {t('notFound.cta')}
      </Link>
    </section>
  );
};

const isPasswordRotationExemptPath = (pathname) =>
  pathname === '/profile' ||
  pathname === '/forgot-password' ||
  pathname === '/reset-password' ||
  pathname.startsWith('/reset-password/');

const AppShell = () => {
  const { t } = useLanguage();
  const { currentUser } = useAuth();
  const location = useLocation();
  const mustRotatePw =
    Boolean(currentUser?.mustChangePassword) && !isPasswordRotationExemptPath(location.pathname);

  return (
    <div className="flex min-h-screen flex-col bg-[#F0FDFA] text-[#0D2E2F]">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:start-3 focus:z-50 focus:rounded-lg focus:bg-[#0B3B3C] focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white focus:shadow-lg"
      >
        {t('nav.skipToContent')}
      </a>
      <Navbar />
      <main id="main-content" tabIndex={-1} className="flex-1 outline-none">
        {mustRotatePw ? (
          <Navigate to="/profile" replace state={{ forcedPasswordChange: true }} />
        ) : (
        <Suspense fallback={<RouteFallback />}>
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
                <ProtectedRoute allowedRoles={['super_admin', 'admin', 'instructor']}>
                  <CreateCourse />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={['super_admin', 'admin']}>
                  <AdminDashboard />
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
        </Suspense>
        )}
      </main>
      <Footer />
    </div>
  );
};

function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <Router>
          <AppShell />
        </Router>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;
