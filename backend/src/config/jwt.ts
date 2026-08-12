export const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('FATAL: JWT_SECRET environment variable is missing. Please configure JWT_SECRET in backend/.env');
  }
  return secret;
};
