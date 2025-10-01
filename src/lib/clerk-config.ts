export function getClerkConfig() {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  
  const isInvalidKey = !publishableKey || 
      publishableKey === 'pk_test_placeholder' ||
      publishableKey.includes('bGVhcm5pbmctZGVtby0xMjM0NTY3ODkw') ||
      publishableKey.includes('placeholder') ||
      publishableKey === 'pk_test_bGVhcm5pbmctZGVtby0xMjM0NTY3ODkwLmNsZXJrLmFjY291bnRzLmRldg';
  
  if (isInvalidKey) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('🔧 Clerk not configured - running in development mode without authentication');
      return null;
    }
    console.error('❌ Clerk publishable key is invalid or missing in production');
    return null;
  }
  
  return {
    publishableKey,
    secretKey: process.env.CLERK_SECRET_KEY
  };
}

export function isClerkConfigured(): boolean {
  const config = getClerkConfig();
  return config !== null;
}

export function shouldUseClerk(): boolean {
  return isClerkConfigured();
}
