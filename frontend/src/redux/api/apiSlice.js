// frontend/src/redux/api/apiSlice.js
//
// Adds silent token refresh via RTK Query's re-authentication pattern.
//
// How it works:
//   1. Every API call goes through baseQuery (fetchBaseQuery)
//   2. If the server returns 401 with { tokenExpired: true }, we call
//      POST /api/auth/refresh (which uses the httpOnly refresh token cookie)
//   3. If refresh succeeds, we retry the original failed request once
//   4. If refresh fails (refresh token expired / invalid), we clear Redux
//      state and redirect to /login — the user must re-authenticate
//
// This is 100% transparent to components — they never see the 401 or the retry.
// No component code needs to change.

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
      // Refresh failed (refresh token expired or invalid) — log the user out
      console.warn("[apiSlice] Refresh token invalid/expired — logging out.");
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