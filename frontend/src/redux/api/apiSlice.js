import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { removeUserInfo }           from "../features/userSlice";
import { clearKeyFromSession }      from "../../utils/crypto";

// ── 1. Base query — same as before ───────────────────────────────
const baseQuery = fetchBaseQuery({
  baseUrl:     `${import.meta.env.VITE_BACKEND_URL}/api`,
  credentials: "include",                          // always send cookies
});

// ── 2. Mutex — prevents multiple concurrent refresh calls ─────────
// If two requests fail simultaneously we should only call /refresh once,
// then replay both originals. We use a simple Promise-based lock.
let refreshPromise = null;

// ── 3. Base query WITH automatic re-authentication ─────────────────
const baseQueryWithReauth = async (args, api, extraOptions) => {
  // First attempt
  let result = await baseQuery(args, api, extraOptions);

  // Only retry when the server explicitly tells us the access token expired
  const isExpiredAccess =
    result.error?.status === 401 &&
    result.error?.data?.tokenExpired === true;

  if (isExpiredAccess) {
    // ── Silent refresh ──────────────────────────────────────────
    if (!refreshPromise) {
      // Kick off a single refresh call; store the promise so concurrent
      // requests can share the result instead of each making their own call.
      refreshPromise = baseQuery(
        { url: "/auth/refresh", method: "POST" },
        api,
        extraOptions
      ).finally(() => {
        refreshPromise = null; // release lock when done
      });
    }

    const refreshResult = await refreshPromise;

    if (refreshResult.data) {
      // Refresh succeeded — retry the original request
      // The new access token is already in the cookie (set by the server),
      // so the retry will pick it up automatically.
      result = await baseQuery(args, api, extraOptions);
    } else {
      // Refresh failed (refresh token expired, invalid, or server error) — log the user out
      const errorStatus = refreshResult.error?.status;
      const errorMsg = refreshResult.error?.data?.message || "Token refresh failed";
      
      console.warn(`[apiSlice] Refresh failed (${errorStatus}): ${errorMsg}`, refreshResult.error);
      console.warn("[apiSlice] Session invalid or expired — logging out.");
      
      api.dispatch(removeUserInfo());
      clearKeyFromSession();

      // Redirect to login page (outside React Router context, so use window)
      if (typeof window !== "undefined") {
        const current = window.location.pathname + window.location.search;
        const loginUrl =
          current && current !== "/" && current !== "/login"
            ? `/login?redirect=${encodeURIComponent(current)}`
            : "/login";
        window.location.href = loginUrl;
      }
    }
  }

  return result;
};

// ── 4. API slice — identical shape to the original ───────────────
const apiSlice = createApi({
  reducerPath: "apiSlice",
  baseQuery:   baseQueryWithReauth,   // ← only change from original
  tagTypes:    ["User", "Entries", "SavedSearches"],
  endpoints:   () => ({}),
});

export default apiSlice;