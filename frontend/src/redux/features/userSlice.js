import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  data: null,           // full user object after verified login/signup
  userPassword: null,   // plaintext password kept for entry encryption
  pendingEmail: null,   // email held between signup → OTP verification step
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    userInfo: (state, action) => {
      state.data = action.payload;
    },
    setUserPassword: (state, action) => {
      state.userPassword = action.payload;
    },
    setPendingEmail: (state, action) => {
      state.pendingEmail = action.payload;
    },
    removeUserInfo: (state) => {
      state.data         = null;
      state.userPassword = null;
      state.pendingEmail = null;
    },
    // Safely update profile photo regardless of nested state shape
    setProfilePhoto: (state, action) => {
      if (!state.data) return;
      // Shape after login/verifyOtp: { message, data: { _id, firstName, ... } }
      // Shape after profile query:   { message, data: { email, firstName, profilePhoto, ... } }
      if (state.data.data) {
        state.data.data.profilePhoto = action.payload;
      }
    },
    // Update name fields safely
    setProfileName: (state, action) => {
      if (!state.data) return;
      const { firstName, lastName } = action.payload;
      if (state.data.data) {
        state.data.data.firstName = firstName;
        state.data.data.lastName  = lastName;
      }
    },
  },
});

export const {
  userInfo,
  setUserPassword,
  setPendingEmail,
  removeUserInfo,
  setProfilePhoto,
  setProfileName,
} = userSlice.actions;

export default userSlice.reducer;