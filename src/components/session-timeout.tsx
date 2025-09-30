"use client";

import { useAuth } from "@clerk/nextjs";
import { useIdleTimer } from "react-idle-timer";
import { useEffect } from "react";

interface SessionTimeoutProps {
  children: React.ReactNode;
}

export default function SessionTimeout({ children }: SessionTimeoutProps) {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const isDevelopmentMode = process.env.NODE_ENV === 'development' && 
    (!publishableKey || 
     publishableKey === 'pk_test_placeholder' ||
     publishableKey.includes('bGVhcm5pbmctZGVtby0xMjM0NTY3ODkw') ||
     publishableKey.includes('placeholder'));

  let signOut: (() => void) | undefined;
  let isSignedIn: boolean = false;

  try {
    const auth = useAuth();
    signOut = auth.signOut;
    isSignedIn = auth.isSignedIn || false;
  } catch (error) {
    if (!isDevelopmentMode) {
      console.error("Clerk authentication error:", error);
    }
  }

  const handleOnIdle = () => {
    if (isSignedIn && signOut) {
      signOut();
    }
  };

  const { getRemainingTime } = useIdleTimer({
    timeout: 1000 * 60 * 2, // 2 minutes in milliseconds
    onIdle: handleOnIdle,
    throttle: 500,
  });

  useEffect(() => {
    if (!isSignedIn || !getRemainingTime) return;

    const interval = setInterval(() => {
      if (isSignedIn) {
        console.log("Session timeout remaining:", Math.round(getRemainingTime() / 1000), "seconds");
      }
    }, 30000); // Log every 30 seconds

    return () => clearInterval(interval);
  }, [getRemainingTime, isSignedIn]);

  return <>{children}</>;
}
