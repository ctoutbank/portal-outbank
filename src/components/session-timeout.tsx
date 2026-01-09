"use client";

import { useUserCache } from "@/hooks/use-user-cache";
import { useIdleTimer } from "react-idle-timer";
import { useEffect } from "react";

interface SessionTimeoutProps {
  children: React.ReactNode;
}

export default function SessionTimeout({ children }: SessionTimeoutProps) {
  const { user, logout } = useUserCache();
  const isSignedIn = !!user;

  const handleOnIdle = () => {
    if (isSignedIn) {
      logout();
    }
  };

  const { getRemainingTime } = useIdleTimer({
    timeout: 1000 * 60 * 20, // 20 minutes in milliseconds
    onIdle: handleOnIdle,
    debounce: 500,
  });

  useEffect(() => {
    const interval = setInterval(() => {
      if (isSignedIn) {
        console.log("Session timeout remaining:", Math.round(getRemainingTime() / 1000), "seconds");
      }
    }, 30000); // Log every 30 seconds

    return () => clearInterval(interval);
  }, [getRemainingTime, isSignedIn]);

  return <>{children}</>;
}
