export function getClerkConfig() {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  
  if (!publishableKey || 
      publishableKey === 'pk_test_placeholder' ||
      publishableKey.includes('bGVhcm5pbmctZGVtby0xMjM0NTY3ODkw') ||
      publishableKey.includes('placeholder')) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('Clerk publishable key not configured for development');
      return null;
    }
    throw new Error('Clerk publishable key is required for production');
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
