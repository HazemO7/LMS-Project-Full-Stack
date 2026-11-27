import { useCallback, useEffect, useRef, useState } from 'react';
import { adminAPI } from '../../services/api';
import { buildSettingsPatch, DEFAULT_SETTINGS, normalizeSettingsData } from './adminConstants';

const isActiveReq = (reqIdRef, reqId) => reqId === reqIdRef.current;

const runGuardedFetch = async ({ reqIdRef, setLoading, onStart, task, onError, fallbackError }) => {
  const reqId = ++reqIdRef.current;
  onStart?.();
  setLoading(true);
  try {
    await task(() => isActiveReq(reqIdRef, reqId), reqId);
  } catch (err) {
    if (isActiveReq(reqIdRef, reqId)) onError(err.message || fallbackError);
  } finally {
    if (isActiveReq(reqIdRef, reqId)) setLoading(false);
  }
};

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

const applyPagedListResult = (res, currentPage, handlers) => {
  const totalPages = Math.max(1, res.totalPages || 1);
  handlers.setTotalPages(totalPages);
  if (currentPage > totalPages) {
    handlers.setPage(totalPages);
    return;
  }
  handlers.onItems(res.data || []);
};

const toggleSetItem = (prev, id) => {
  const next = new Set(prev);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  return next;
};

const applyLoadedSettings = (data, baselineRef, setters) => {
  if (!data) {
    setters.setSettingsLoaded(false);
    setters.setSettingsLoadError('Failed to load platform settings');
    return;
  }
  const normalized = normalizeSettingsData(data);
  baselineRef.current = normalized;
  setters.setSettingsForm(normalized);
  setters.setSettingsLoaded(true);
};

const persistSettingsUpdate = async ({ patch, reqIdRef, baselineRef, setters, onSaved }) => {
  const res = await adminAPI.updateSettings(patch);
  reqIdRef.current += 1;
  setters.setSettingsLoading(false);
  if (res?.data) {
    const normalized = normalizeSettingsData(res.data);
    baselineRef.current = normalized;
    setters.setSettingsForm(normalized);
    setters.setSettingsLoadError('');
    setters.setSettingsLoaded(true);
  }
  onSaved();
};

export const useAdminStats = (onError) => {
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const reqIdRef = useRef(0);

  const fetchStats = useCallback(() => runGuardedFetch({
    reqIdRef,
    setLoading: setStatsLoading,
    onError,
    fallbackError: 'Failed to load platform stats',
    task: async (isCurrent) => {
      const res = await adminAPI.getStats();
      if (isCurrent()) setStats(res.data);
    },
  }), [onError]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { stats, statsLoading, fetchStats };
};

const findSoonestLockExpiryMs = (users) => {
  const now = Date.now();
  let soonest = Infinity;
  for (const u of users) {
    if (!u.lockUntil) continue;
    const ts = new Date(u.lockUntil).getTime();
    if (ts > now && ts < soonest) soonest = ts;
  }
  return soonest === Infinity ? null : Math.max(50, soonest - now + 50);
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

  const fetchUsers = useCallback(() => runGuardedFetch({
    reqIdRef,
    setLoading: setUsersLoading,
    onError,
    fallbackError: 'Failed to load users',
    task: async (isCurrent) => {
      const res = await adminAPI.getUsers({
        page: usersPage, limit: 10, role: roleFilter, status: statusFilter, search: userSearch,
      });
      if (isCurrent()) {
        applyPagedListResult(res, usersPage, {
          setTotalPages: setUsersTotalPages,
          setPage: setUsersPage,
          onItems: (data) => {
            setFetchedAt(Date.now());
            setUsers(data);
          },
        });
      }
    },
  }), [usersPage, roleFilter, statusFilter, userSearch, onError]);

  useEffect(() => {
    if (activeTab === 'users' && usersRefreshTick >= 0) fetchUsers();
  }, [activeTab, fetchUsers, usersRefreshTick]);

  useEffect(() => {
    const delay = findSoonestLockExpiryMs(users);
    if (delay === null) return undefined;
    const timer = window.setTimeout(() => setFetchedAt(Date.now()), delay);
    return () => window.clearTimeout(timer);
  }, [users, fetchedAt]);

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
  const [coursesRefreshTick, setCoursesRefreshTick] = useState(0);
  const reqIdRef = useRef(0);

  const fetchCourses = useCallback(() => runGuardedFetch({
    reqIdRef,
    setLoading: setCoursesLoading,
    onError,
    fallbackError: 'Failed to load courses',
    task: async (isCurrent) => {
      const res = await adminAPI.getCourses({ page: coursesPage, limit: 10, search: courseSearch });
      if (isCurrent()) {
        applyPagedListResult(res, coursesPage, {
          setTotalPages: setCoursesTotalPages,
          setPage: setCoursesPage,
          onItems: setCourses,
        });
      }
    },
  }), [coursesPage, courseSearch, onError]);

  useEffect(() => {
    if (activeTab === 'courses' && coursesRefreshTick >= 0) fetchCourses();
  }, [activeTab, fetchCourses, coursesRefreshTick]);

  const refreshCourses = useCallback(() => setCoursesRefreshTick((n) => n + 1), []);

  return {
    courses, setCourses, coursesLoading, coursesPage, coursesTotalPages,
    courseSearchInput, setCoursesPage, setCourseSearchInput, setCourseSearch, fetchCourses, refreshCourses,
  };
};

export const useAdminStaffPool = (activeTab, isSuperAdmin) => {
  const [staffPool, setStaffPool] = useState([]);
  const [staffPoolLoading, setStaffPoolLoading] = useState(false);
  const [staffPoolError, setStaffPoolError] = useState('');
  const reqIdRef = useRef(0);

  const fetchStaffPool = useCallback(() => {
    if (!isSuperAdmin) return Promise.resolve();
    return runGuardedFetch({
      reqIdRef,
      setLoading: setStaffPoolLoading,
      onStart: () => setStaffPoolError(''),
      fallbackError: 'Failed to load eligible owners',
      onError: (msg) => {
        setStaffPool([]);
        setStaffPoolError(msg);
      },
      task: async (isCurrent, reqId) => {
        const lists = await Promise.all([
          fetchAllActiveByRole('instructor', reqId, reqIdRef),
          fetchAllActiveByRole('admin', reqId, reqIdRef),
          fetchAllActiveByRole('super_admin', reqId, reqIdRef),
        ]);
        if (isCurrent()) setStaffPool(deduplicateUsersById(lists));
      },
    });
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

  const fetchSettings = useCallback(() => {
    if (!isSuperAdmin) return Promise.resolve();
    return runGuardedFetch({
      reqIdRef,
      setLoading: setSettingsLoading,
      onStart: () => setSettingsLoadError(''),
      fallbackError: 'Failed to load platform settings',
      onError: (msg) => {
        setSettingsLoaded(false);
        setSettingsLoadError(msg);
      },
      task: async (isCurrent) => {
        const res = await adminAPI.getSettings();
        if (isCurrent()) applyLoadedSettings(res.data, baselineRef, { setSettingsForm, setSettingsLoaded, setSettingsLoadError });
      },
    });
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
      await persistSettingsUpdate({
        patch, reqIdRef, baselineRef,
        setters: { setSettingsLoading, setSettingsForm, setSettingsLoaded, setSettingsLoadError },
        onSaved: () => setSuccessMsg(t('admin.settingsSavedMsg')),
      });
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

  const fetchAuditLogs = useCallback(() => {
    if (!isSuperAdmin) return Promise.resolve();
    return runGuardedFetch({
      reqIdRef,
      setLoading: setAuditLoading,
      onError,
      fallbackError: 'Failed to load audit logs',
      task: async (isCurrent) => {
        const res = await adminAPI.getAuditLogs({ page: auditPage, limit: 15, action: auditActionFilter });
        if (!isCurrent()) return;
        setAuditLogs(res.data || []);
        setAuditTotalPages(res.totalPages || 1);
      },
    });
  }, [isSuperAdmin, auditPage, auditActionFilter, onError]);

  useEffect(() => {
    if (activeTab === 'audit') fetchAuditLogs();
  }, [activeTab, fetchAuditLogs]);

  const toggleAuditDetails = (logId) => setExpandedAuditIds((prev) => toggleSetItem(prev, logId));

  return {
    auditLogs, auditLoading, auditPage, auditTotalPages, auditActionFilter, expandedAuditIds,
    setAuditPage, setAuditActionFilter, toggleAuditDetails,
  };
};
