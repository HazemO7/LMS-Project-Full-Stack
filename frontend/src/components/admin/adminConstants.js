import { BookOpen, ChartBar, ClipboardText, Gear, Users } from '@phosphor-icons/react';

export const AUDIT_ACTIONS = [
  'USER_CREATED',
  'ROLE_UPDATED',
  'USER_STATUS_CHANGED',
  'USER_UNLOCKED',
  'USER_DELETED',
  'COURSE_TRANSFERRED',
  'ENROLLMENT_ADDED',
  'ENROLLMENT_REMOVED',
  'SETTINGS_UPDATED',
];

export const DEFAULT_SETTINGS = {
  allowPublicRegistration: true,
  maxVideoSizeMB: 250,
  maxDocumentSizeMB: 25,
  maxImageSizeMB: 10,
};

export const normalizeSettingsData = (data) => ({
  allowPublicRegistration: Boolean(data.allowPublicRegistration),
  maxVideoSizeMB: data.maxVideoSizeMB ?? 250,
  maxDocumentSizeMB: data.maxDocumentSizeMB ?? 25,
  maxImageSizeMB: data.maxImageSizeMB ?? 10,
});

export const buildSettingsPatch = (baseline, form) => {
  const nextValues = {
    allowPublicRegistration: Boolean(form.allowPublicRegistration),
    maxVideoSizeMB: Number(form.maxVideoSizeMB),
    maxDocumentSizeMB: Number(form.maxDocumentSizeMB),
    maxImageSizeMB: Number(form.maxImageSizeMB),
  };
  const patch = {};
  for (const key of Object.keys(nextValues)) {
    if (!baseline || nextValues[key] !== baseline[key]) {
      patch[key] = nextValues[key];
    }
  }
  return patch;
};

export const getAdminTabs = (isSuperAdmin, t) => {
  const baseTabs = [
    { id: 'overview', label: t('admin.tabOverview'), icon: ChartBar },
    { id: 'users', label: t('admin.tabUsers'), icon: Users },
    { id: 'courses', label: t('admin.tabCourses'), icon: BookOpen },
  ];
  if (!isSuperAdmin) return baseTabs;
  return [
    ...baseTabs,
    { id: 'settings', label: t('admin.tabSettings'), icon: Gear },
    { id: 'audit', label: t('admin.tabAudit'), icon: ClipboardText },
  ];
};
