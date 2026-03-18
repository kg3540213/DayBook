import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  userInfo: null,
  userPassword: null
}

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    userInfo: (state, action) => {
      state.userInfo = action.payload;
    },
    setUserPassword: (state, action) => {
      state.userPassword = action.payload;
    },
    removeUserInfo: (state) => {
      state.userInfo = null;
      state.userPassword = null;
    },
  },
});

export const { userInfo, removeUserInfo, setUserPassword } = userSlice.actions;
export default userSlice.reducer;
