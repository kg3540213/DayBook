# Redux Toolkit in DayBook Frontend

This document explains how Redux Toolkit is implemented and used in the DayBook frontend application.

## Overview

Redux Toolkit (RTK) is used for state management in this React application. The implementation combines:

- **RTK Query** for API state management and caching
- **Traditional Redux slices** for local UI state
- **Automatic re-authentication** for seamless user experience

## Architecture

### Store Configuration (`store.js`)

The Redux store is configured using `configureStore` from Redux Toolkit:

```javascript
import { configureStore } from "@reduxjs/toolkit";
import apiSlice from "./api/apiSlice";
import { postsApiSlice } from "./api/postsApiSlice";
import userReducer from "./features/userSlice";

const store = configureStore({
  reducer: {
    [apiSlice.reducerPath]: apiSlice.reducer,
    [postsApiSlice.reducerPath]: postsApiSlice.reducer,
    user: userReducer,
  },

  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .concat(apiSlice.middleware)
      .concat(postsApiSlice.middleware),
});

export default store;
```

**Key Points:**
- Combines multiple reducers into a single store
- Adds RTK Query middleware for API caching and request management
- Uses dynamic reducer paths for RTK Query APIs

### RTK Query APIs

#### Base API Slice (`apiSlice.js`)

The foundation API layer with automatic re-authentication:

```javascript
const apiSlice = createApi({
  reducerPath: "apiSlice",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["User", "Entries"],
  endpoints: () => ({}),
});
```

**Features:**
- **Automatic Token Refresh**: Intercepts 401 errors and refreshes tokens transparently
- **Mutex-based Refresh**: Prevents multiple concurrent refresh requests
- **Tag-based Caching**: Uses tags for intelligent cache invalidation

#### Injected API Slices

**Entries API (`entriesApiSlice.js`):**
- CRUD operations for journal entries
- Client-side search and filtering
- Tag invalidation for cache updates

**Users API (`usersApiSlice.js`):**
- Authentication endpoints (signup, login, OTP verification)
- Profile management
- User data caching

**Posts API (`postsApiSlice.js`):**
- Separate API for public feed
- Real-time polling (30-second intervals)
- Post creation and deletion

### Traditional Redux Slice

#### User Slice (`userSlice.js`)

Manages local user state that doesn't require API caching:

```javascript
const userSlice = createSlice({
  name: "user",
  initialState: {
    data: null,
    encKey: null,  // AES encryption key
    pendingEmail: null,
  },
  reducers: {
    userInfo: (state, action) => { state.data = action.payload; },
    setEncKey: (state, action) => { state.encKey = action.payload; },
    // ... other reducers
  },
});
```

**Purpose:**
- Stores user profile data
- Manages encryption keys (in-memory only)
- Handles authentication state transitions

## How It Works

### 1. API Data Flow

```
Component → RTK Query Hook → API Slice → Base Query → Server
    ↑              ↓              ↑              ↓
    ← Cache ← Invalidated ←   Response ←   Success/Failure
```

**Example Usage:**
```javascript
// In a component
const { data: entries, isLoading } = useGetEntriesQuery();
const [addEntry] = useAddEntryMutation();

const handleAddEntry = async (entryData) => {
  await addEntry(entryData);
  // Cache automatically invalidated, UI updates
};
```

### 2. Authentication Flow

```
Request → 401 Error → Refresh Token → Retry Request
    ↓                    ↓                    ↓
Failure → Clear State → Redirect to Login
```

- **Transparent**: Components never see authentication errors
- **Automatic**: Token refresh happens behind the scenes
- **Secure**: Failed refresh logs user out immediately

### 3. State Management Strategy

- **API State**: RTK Query (entries, posts, user profile)
- **Local State**: Traditional slices (encryption keys, UI state)
- **Caching**: Automatic with tag-based invalidation
- **Real-time**: Polling for live feed updates

## Benefits

1. **Reduced Boilerplate**: RTK eliminates Redux setup complexity
2. **Automatic Caching**: Smart cache invalidation with tags
3. **Type Safety**: TypeScript-ready with generated hooks
4. **Developer Experience**: Built-in devtools and error handling
5. **Performance**: Optimistic updates and background refetching

## Integration

The store is provided at the app root in `App.jsx`:

```javascript
<Provider store={store}>
  <BrowserRouter>
    {/* Routes */}
  </BrowserRouter>
</Provider>
```

All components can access RTK Query hooks and dispatch actions through this provider.</content>
<parameter name="filePath">c:\Users\ghosh\OneDrive\Desktop\DayBook\client.md