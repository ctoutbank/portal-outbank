"use client";

import { useAuth } from "@clerk/nextjs";
import { useIdleTimer } from "react-idle-timer";
import { useEffect } from "react";

interface SessionTimeoutProps {
  children: React.ReactNode;
}

export default function SessionTimeout({ children }: SessionTimeoutProps) {
  const { signOut, isSignedIn } = useAuth();

  const handleOnIdle = () => {
    if (isSignedIn) {
      signOut();
    }
  };

  const { getRemainingTime } = useIdleTimer({
    timeout: 1000 * 60 * 2, // 2 minutes in milliseconds
    onIdle: handleOnIdle,
    debounce: 500,
    //throttle: 500,
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
