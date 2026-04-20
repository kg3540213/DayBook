// frontend/src/components/auth/Password.jsx
//
// Option A changes:
//   - After successful password change: derive the new AES key from newPassword,
//     update sessionStorage and Redux state immediately
//   - User does NOT need to log out and back in
//   - Old entries encrypted with the old key will be unreadable with the new key
//     (this is the accepted tradeoff of Option A — documented in the warning below)

import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useChangePasswordMutation } from "../../redux/api/usersApiSlice";
import { setEncKey } from "../../redux/features/userSlice";
import { deriveAndStoreKey, clearKeyFromSession } from "../../utils/crypto";
import { toast } from "react-toastify";

const Password = ({ close }) => {
  const user     = useSelector((state) => state.user.data);
  const dispatch = useDispatch();

  const [email,       setEmail]       = useState("");
  const [firstName,   setFirstName]   = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  useEffect(() => {
    if (user) {
      setEmail(user?.data?.email     || "");
      setFirstName(user?.data?.firstName || "");
    }
  }, [user]);

  // Reset fields when modal is closed
  useEffect(() => {
    setOldPassword("");
    setNewPassword("");
  }, [close]);

  const [changePassword, { isLoading }] = useChangePasswordMutation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await changePassword({ oldPassword, newPassword }).unwrap();

      // Clear the old session key
      clearKeyFromSession();

      // Derive a new key from the new password and persist to sessionStorage
      const newEncKey = deriveAndStoreKey(newPassword);
      dispatch(setEncKey(newEncKey));

      toast.success(response?.message);
      close();
    } catch (error) {
      toast.error(error?.data?.message || "Password change failed.");
    }
  };

  return (
    <div className="card-body">
      <h2 className="card-title block text-center text-lg mb-2">
        Change your password
      </h2>

      <p className="text-center text-error">{email}</p>

      {/* Option A warning: password change = key change */}
      <div className="alert alert-warning rounded-xl text-xs py-2 my-2">
        <span>⚠️</span>
        <span>
          <strong>Note:</strong> Changing your password updates your encryption key.
          Entries written with your old password will no longer be readable.
          New entries will be encrypted with the new password.
        </span>
      </div>

      <div className="text-center my-3">
        <p>
          Hello {firstName}, please enter your current password to confirm before
          setting a new one.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="flex gap-5 justify-center items-center flex-wrap">
          <div>
            <label htmlFor="oldPassword">
              Old Password <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              name="oldPassword"
              id="oldPassword"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              className="input rounded-lg my-3"
              placeholder="Current password"
              required
            />
          </div>

          <div>
            <label htmlFor="newPassword">
              New Password <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              name="newPassword"
              id="newPassword"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="input rounded-lg my-3"
              placeholder="New password"
              required
            />
          </div>
        </div>

        <button
          type="submit"
          className="btn btn-primary w-full rounded-lg mt-3"
          disabled={isLoading}
        >
          {isLoading ? "Changing..." : "Change Password"}
        </button>
      </form>
    </div>
  );
};

export default Password;