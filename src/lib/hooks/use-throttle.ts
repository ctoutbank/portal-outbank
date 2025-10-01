import { useEffect, useMemo, useRef } from 'react';

export function useThrottle<T extends (...args: never[]) => void>(
  callback: T,
  delay: number = 300
): T {
  const callbackRef = useRef(callback);
  const lastRan = useRef(Date.now());
  
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  return useMemo(() => {
    return ((...args: Parameters<T>) => {
      const now = Date.now();
      
      if (now - lastRan.current >= delay) {
        callbackRef.current(...args);
        lastRan.current = now;
      }
    }) as T;
  }, [delay]);
}
