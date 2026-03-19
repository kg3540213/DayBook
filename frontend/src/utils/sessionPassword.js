// ------------------------------------------------------------------
// sessionPassword.js
// Stores the user's plaintext password in sessionStorage so it
// survives page refreshes within the same browser tab.
//
// sessionStorage is cleared automatically when the tab is closed —
// safer than localStorage for sensitive data.
//
// The password is base64-encoded before storage — not true encryption,
// but prevents the raw password from being trivially visible in
// DevTools → Application → sessionStorage.
// ------------------------------------------------------------------

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