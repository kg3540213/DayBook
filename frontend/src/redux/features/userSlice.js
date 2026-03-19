import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  data: null,         // full user object after verified login/signup
  userPassword: null, // plaintext password kept for entry encryption
  pendingEmail: null, // email held between signup → OTP verification step
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
    // Set after signup step 1 — tells OTP form which email to verify
    setPendingEmail: (state, action) => {
      state.pendingEmail = action.payload;
    },
    removeUserInfo: (state) => {
      state.data = null;
      state.userPassword = null;
      state.pendingEmail = null;
    },
  },
});

export const {
  userInfo,
  setUserPassword,
  setPendingEmail,
  removeUserInfo,
} = userSlice.actions;

export default userSlice.reducer;