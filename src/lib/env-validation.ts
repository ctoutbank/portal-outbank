export function validateEnvironment() {
  const required = [
    'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
    'CLERK_SECRET_KEY',
    'DATABASE_URL'
  ];

  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `❌ Missing required environment variables:\n${missing.join('\n')}\n\n` +
      'Please check your Vercel Environment Variables settings.'
    );
  }

  console.log('✅ All required environment variables are set');
}
