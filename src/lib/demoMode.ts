export const DEMO_MODE = true;

export const DEMO_SESSION_USER_ID = 'demo-user-local';
export const DEMO_SESSION_TOKEN = 'demoSession-local-only';

export const isDemoMode = () => DEMO_MODE;
export const isDemoUserId = (userId?: string | null) => Boolean(userId) && DEMO_MODE;
