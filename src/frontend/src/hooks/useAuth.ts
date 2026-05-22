import { useActor, useInternetIdentity } from "@caffeineai/core-infrastructure";
import { useEffect } from "react";
import { createActor } from "../backend";
import { useAuthStore } from "../store/authStore";

export function useAuth() {
  const { login, clear, loginStatus, identity } = useInternetIdentity();
  const { actor } = useActor(createActor);
  const {
    isLoggedIn,
    adminName,
    adminEmail,
    setLoggedIn,
    setLoggedOut,
    setAdminIdentity,
  } = useAuthStore();

  // When Internet Identity reports a successful authentication, mark as logged
  // in and fire _initializeAccessControl so the backend can permanently lock
  // the first-caller-wins admin assignment.
  useEffect(() => {
    if (loginStatus === "success" && identity && actor) {
      setLoggedIn();
      void (actor as { _initializeAccessControl: () => Promise<void> })
        ._initializeAccessControl()
        .catch(() => {
          // Already initialised — safe to ignore
        });
    }
  }, [loginStatus, identity, actor, setLoggedIn]);

  const handleLogin = async () => {
    await login();
  };

  const handleLogout = () => {
    clear();
    setLoggedOut();
  };

  return {
    login: handleLogin,
    logout: handleLogout,
    loginStatus,
    identity,
    isLoggedIn,
    adminName,
    adminEmail,
    setLoggedIn,
    setAdminIdentity,
  };
}
