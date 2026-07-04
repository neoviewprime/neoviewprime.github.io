const TOKEN_STORAGE_KEY = 'neoview_token';

export const getStoredAuthToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(TOKEN_STORAGE_KEY);
};
