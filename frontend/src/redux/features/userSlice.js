import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  data:         null,   // full user object (from login / profile query)
  encKey:       null,   // base64-encoded AES-256 key, in memory only
  pendingEmail: null,   // email held between signup → OTP verification step
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    userInfo: (state, action) => {
      state.data = action.payload;
    },

    setEncKey: (state, action) => {
      state.encKey = action.payload;
    },

    setPendingEmail: (state, action) => {
      state.pendingEmail = action.payload;
    },

    removeUserInfo: (state) => {
      state.data         = null;
      state.encKey       = null;
      state.pendingEmail = null;
    },

    // Update profile photo safely regardless of nested shape
    setProfilePhoto: (state, action) => {
      if (!state.data) return;
      // Handle nested structure (state.data.data.profilePhoto)
      if (state.data.data && typeof state.data.data === 'object') {
        state.data.data.profilePhoto = action.payload;
      } 
      // Handle direct structure (state.data.profilePhoto)
      else if (typeof state.data === 'object') {
        state.data.profilePhoto = action.payload;
      }
    },

    // Update name fields safely
    setProfileName: (state, action) => {
      if (!state.data) return;
      const { firstName, lastName } = action.payload;
      // Handle nested structure
      if (state.data.data && typeof state.data.data === 'object') {
        state.data.data.firstName = firstName;
        state.data.data.lastName  = lastName;
      } 
      // Handle direct structure
      else if (typeof state.data === 'object') {
        state.data.firstName = firstName;
        state.data.lastName  = lastName;
      }
    },
  },
});

export const {
  userInfo,
  setEncKey,
  setPendingEmail,
  removeUserInfo,
  setProfilePhoto,
  setProfileName,
} = userSlice.actions;

export default userSlice.reducer;