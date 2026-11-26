const AUTHOR_ROLES = new Set(['super_admin', 'admin', 'instructor']);
const ADMIN_ROLES = new Set(['super_admin', 'admin']);

export const ROLE_BADGE_CLASSES = {
  super_admin: 'bg-[#EDE9FE] text-[#5B21B6] ring-[#DDD6FE]',
  admin: 'bg-[#FEF2F2] text-[#991B1B] ring-[#FECACA]',
  instructor: 'bg-[#FEF3C7] text-[#92400E] ring-[#FDE68A]',
  student: 'bg-[#D1FAE5] text-[#065F46] ring-[#A7F3D0]',
};

export const getRoleBadgeClass = (role) => ROLE_BADGE_CLASSES[role] || ROLE_BADGE_CLASSES.student;

export const isSuperAdmin = (user) => user?.role === 'super_admin';

export const isAdminOrSuper = (user) => Boolean(user && ADMIN_ROLES.has(user.role));

export const canAuthorCourses = (user) => Boolean(user && AUTHOR_ROLES.has(user.role));

export const canManageCourse = (user, course) => {
  if (!user || !course) return false;
  if (isAdminOrSuper(user)) return true;
  if (user.role !== 'instructor') return false;
  const ownerId = course.instructor?._id || course.instructor;
  return ownerId === user._id;
};
