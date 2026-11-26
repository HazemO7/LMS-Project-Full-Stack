import { useCallback, useEffect, useRef, useState } from 'react';
import { adminAPI } from '../../services/api';
import { buildSettingsPatch, DEFAULT_SETTINGS, normalizeSettingsData } from './adminConstants';

const fetchAllActiveByRole = async (role, reqId, reqIdRef) => {
  const all = [];
  let cursor = '';
  do {
    const res = await adminAPI.getUsers({ limit: 100, role, status: 'active', cursor, cursorMode: true });
    if (reqId !== reqIdRef.current) return [];
    all.push(...(res.data || []));
    cursor = res.nextCursor || '';
  } while (cursor);
  return all;
};

const deduplicateUsersById = (lists) => {
  const merged = [];
  const seenIds = new Set();
  for (const list of lists) {
    for (const user of list) {
      if (!seenIds.has(user._id)) {
        seenIds.add(user._id);
        merged.push(user);
      }
    }
  }
  return merged;
};

export const useAdminStats = (onError) => {
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await adminAPI.getStats();
      setStats(res.data);
    } catch (err) {
      onError(err.message || 'Failed to load platform stats');
    } finally {
      setStatsLoading(false);
    }
  }, [onError]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { stats, statsLoading, fetchStats };
};

export const useAdminUsers = (activeTab, onError) => {
  const [users, setUsers] = useState([]);
  const [fetchedAt, setFetchedAt] = useState(() => Date.now());
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersPage, setUsersPage] = useState(1);
  const [usersTotalPages, setUsersTotalPages] = useState(1);
  const [userSearchInput, setUserSearchInput] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [usersRefreshTick, setUsersRefreshTick] = useState(0);
  const reqIdRef = useRef(0);

  const fetchUsers = useCallback(async () => {
    const reqId = ++reqIdRef.current;
    setUsersLoading(true);
    try {
      const res = await adminAPI.getUsers({
        page: usersPage,
        limit: 10,
        role: roleFilter,
        status: statusFilter,
        search: userSearch,
      });
      if (reqId !== reqIdRef.current) return;
      const totalPages = Math.max(1, res.totalPages || 1);
      setUsersTotalPages(totalPages);
      if (usersPage > totalPages) {
        setUsersPage(totalPages);
        return;
      }
      setFetchedAt(Date.now());
      setUsers(res.data || []);
    } catch (err) {
      if (reqId === reqIdRef.current) onError(err.message || 'Failed to load users');
    } finally {
      if (reqId === reqIdRef.current) setUsersLoading(false);
    }
  }, [usersPage, roleFilter, statusFilter, userSearch, onError]);

  useEffect(() => {
    if (activeTab === 'users' && usersRefreshTick >= 0) fetchUsers();
  }, [activeTab, fetchUsers, usersRefreshTick]);

  const refreshUsers = useCallback(() => setUsersRefreshTick((n) => n + 1), []);

  return {
    users, fetchedAt, usersLoading, usersPage, usersTotalPages, userSearchInput, roleFilter, statusFilter,
    setUsersPage, setUserSearchInput, setUserSearch, setRoleFilter, setStatusFilter, fetchUsers, refreshUsers,
  };
};

export const useAdminCourses = (activeTab, onError) => {
  const [courses, setCourses] = useState([]);
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [coursesPage, setCoursesPage] = useState(1);
  const [coursesTotalPages, setCoursesTotalPages] = useState(1);
  const [courseSearchInput, setCourseSearchInput] = useState('');
  const [courseSearch, setCourseSearch] = useState('');
  const reqIdRef = useRef(0);

  const fetchCourses = useCallback(async () => {
    const reqId = ++reqIdRef.current;
    setCoursesLoading(true);
    try {
      const res = await adminAPI.getCourses({ page: coursesPage, limit: 10, search: courseSearch });
      if (reqId !== reqIdRef.current) return;
      setCourses(res.data || []);
      setCoursesTotalPages(res.totalPages || 1);
    } catch (err) {
      if (reqId === reqIdRef.current) onError(err.message || 'Failed to load courses');
    } finally {
      if (reqId === reqIdRef.current) setCoursesLoading(false);
    }
  }, [coursesPage, courseSearch, onError]);

  useEffect(() => {
    if (activeTab === 'courses') fetchCourses();
  }, [activeTab, fetchCourses]);

  return {
    courses, setCourses, coursesLoading, coursesPage, coursesTotalPages,
    courseSearchInput, setCoursesPage, setCourseSearchInput, setCourseSearch, fetchCourses,
  };
};

export const useAdminStaffPool = (activeTab, isSuperAdmin) => {
  const [staffPool, setStaffPool] = useState([]);
  const [staffPoolLoading, setStaffPoolLoading] = useState(false);
  const [staffPoolError, setStaffPoolError] = useState('');
  const reqIdRef = useRef(0);

  const fetchStaffPool = useCallback(async () => {
    if (!isSuperAdmin) return;
    const reqId = ++reqIdRef.current;
    setStaffPoolLoading(true);
    setStaffPoolError('');
    try {
      const lists = await Promise.all([
        fetchAllActiveByRole('instructor', reqId, reqIdRef),
        fetchAllActiveByRole('admin', reqId, reqIdRef),
        fetchAllActiveByRole('super_admin', reqId, reqIdRef),
      ]);
      if (reqId === reqIdRef.current) setStaffPool(deduplicateUsersById(lists));
    } catch (err) {
      if (reqId !== reqIdRef.current) return;
      setStaffPool([]);
      setStaffPoolError(err.message || 'Failed to load eligible owners');
    } finally {
      if (reqId === reqIdRef.current) setStaffPoolLoading(false);
    }
  }, [isSuperAdmin]);

  useEffect(() => {
    if (activeTab === 'courses') fetchStaffPool();
  }, [activeTab, fetchStaffPool]);

  return { staffPool, staffPoolLoading, staffPoolError, fetchStaffPool };
};

export const useAdminSettings = (activeTab, isSuperAdmin, setError, setSuccessMsg, t) => {
  const [settingsForm, setSettingsForm] = useState(DEFAULT_SETTINGS);
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [settingsLoadError, setSettingsLoadError] = useState('');
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const reqIdRef = useRef(0);
  const baselineRef = useRef(null);

  const fetchSettings = useCallback(async () => {
    if (!isSuperAdmin) return;
    const reqId = ++reqIdRef.current;
    setSettingsLoading(true);
    setSettingsLoadError('');
    try {
      const res = await adminAPI.getSettings();
      if (reqId !== reqIdRef.current) return;
      if (res.data) {
        const normalized = normalizeSettingsData(res.data);
        baselineRef.current = normalized;
        setSettingsForm(normalized);
        setSettingsLoaded(true);
      } else {
        setSettingsLoaded(false);
        setSettingsLoadError('Failed to load platform settings');
      }
    } catch (err) {
      if (reqId !== reqIdRef.current) return;
      setSettingsLoaded(false);
      setSettingsLoadError(err.message || 'Failed to load platform settings');
    } finally {
      if (reqId === reqIdRef.current) setSettingsLoading(false);
    }
  }, [isSuperAdmin]);

  useEffect(() => {
    if (activeTab === 'settings') fetchSettings();
  }, [activeTab, fetchSettings]);

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    if (!settingsLoaded || settingsSaving) return;
    const patch = buildSettingsPatch(baselineRef.current, settingsForm);
    if (Object.keys(patch).length === 0) {
      setSuccessMsg(t('admin.settingsSavedMsg'));
      return;
    }
    setSettingsSaving(true);
    setError('');
    setSuccessMsg('');
    try {
      const res = await adminAPI.updateSettings(patch);
      reqIdRef.current += 1;
      setSettingsLoading(false);
      if (res?.data) {
        const normalized = normalizeSettingsData(res.data);
        baselineRef.current = normalized;
        setSettingsForm(normalized);
      }
      setSuccessMsg(t('admin.settingsSavedMsg'));
    } catch (err) {
      setError(err.message || 'Failed to update settings');
    } finally {
      setSettingsSaving(false);
    }
  };

  return {
    settingsForm, setSettingsForm, settingsLoaded, settingsLoadError,
    settingsLoading, settingsSaving, fetchSettings, handleSaveSettings,
  };
};

export const useAdminAuditLogs = (activeTab, isSuperAdmin, onError) => {
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditPage, setAuditPage] = useState(1);
  const [auditTotalPages, setAuditTotalPages] = useState(1);
  const [auditActionFilter, setAuditActionFilter] = useState('all');
  const [expandedAuditIds, setExpandedAuditIds] = useState(() => new Set());
  const reqIdRef = useRef(0);

  const fetchAuditLogs = useCallback(async () => {
    if (!isSuperAdmin) return;
    const reqId = ++reqIdRef.current;
    setAuditLoading(true);
    try {
      const res = await adminAPI.getAuditLogs({ page: auditPage, limit: 15, action: auditActionFilter });
      if (reqId !== reqIdRef.current) return;
      setAuditLogs(res.data || []);
      setAuditTotalPages(res.totalPages || 1);
    } catch (err) {
      if (reqId === reqIdRef.current) onError(err.message || 'Failed to load audit logs');
    } finally {
      if (reqId === reqIdRef.current) setAuditLoading(false);
    }
  }, [isSuperAdmin, auditPage, auditActionFilter, onError]);

  useEffect(() => {
    if (activeTab === 'audit') fetchAuditLogs();
  }, [activeTab, fetchAuditLogs]);

  const toggleAuditDetails = (logId) => {
    setExpandedAuditIds((prev) => {
      const next = new Set(prev);
      if (next.has(logId)) next.delete(logId);
      else next.add(logId);
      return next;
    });
  };

  return {
    auditLogs, auditLoading, auditPage, auditTotalPages, auditActionFilter, expandedAuditIds,
    setAuditPage, setAuditActionFilter, toggleAuditDetails,
  };
};
