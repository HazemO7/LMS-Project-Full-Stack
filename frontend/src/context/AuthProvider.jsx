import React, { useState, useEffect, useCallback } from 'react';
import { AuthContext } from './AuthContext';
import { authAPI, usersAPI } from '../services/api';

export const AuthProvider = ({ children }) => {
  const [userToken, setUserToken] = useState(() => localStorage.getItem('token'));
  const [currentUser, setCurrentUser] = useState(null);
  const [userLoading, setUserLoading] = useState(() => Boolean(localStorage.getItem('token')));

  const refreshUser = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setCurrentUser(null);
      setUserLoading(false);
      return null;
    }

    setUserLoading(true);
    try {
      const res = await usersAPI.getMe();
      const user = res.data || res;
      setCurrentUser(user);
      return user;
    } catch (err) {
      if (err.status === 401) {
        localStorage.removeItem('token');
        setUserToken(null);
        setCurrentUser(null);
      }
      return null;
    } finally {
      setUserLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    if (!userToken) {
      setCurrentUser(null);
      setUserLoading(false);
      return;
    }

    setUserLoading(true);
    usersAPI
      .getMe()
      .then((res) => {
        if (!active) return;
        setCurrentUser(res.data || res);
      })
      .catch((err) => {
        if (!active) return;
        if (err.status === 401) {
          localStorage.removeItem('token');
          setUserToken(null);
          setCurrentUser(null);
        }
      })
      .finally(() => {
        if (active) setUserLoading(false);
      });

    return () => {
      active = false;
    };
  }, [userToken]);

  const loginUser = useCallback((token) => {
    localStorage.setItem('token', token);
    setUserToken(token);
  }, []);

  const logoutUser = useCallback(() => {
    authAPI.logout().catch(() => {});
    localStorage.removeItem('token');
    setUserToken(null);
    setCurrentUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        userToken,
        currentUser,
        userLoading,
        loginUser,
        logoutUser,
        refreshUser,
        setCurrentUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
