const SESSION_KEY = "_db_sp";

export const savePasswordToSession = (password) => {
  try {
    sessionStorage.setItem(SESSION_KEY, btoa(unescape(encodeURIComponent(password))));
  } catch {
    // sessionStorage unavailable (e.g. private mode restrictions) — fail silently
  }
};

export const getPasswordFromSession = () => {
  try {
    const encoded = sessionStorage.getItem(SESSION_KEY);
    if (!encoded) return null;
    return decodeURIComponent(escape(atob(encoded)));
  } catch {
    return null;
  }
};

export const clearPasswordFromSession = () => {
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch {
    // fail silently
  }
};