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
    // Called after a successful photo upload or delete so the avatar
    // updates instantly everywhere without waiting for a profile refetch.
    setProfilePhoto: (state, action) => {
      if (state.data?.data) {
        state.data.data.profilePhoto = action.payload; // null or URL string
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
} = userSlice.actions;

export default userSlice.reducer;