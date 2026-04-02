// frontend/src/components/auth/Password.jsx
import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useChangePasswordMutation } from "../../redux/api/usersApiSlice";
import { setUserDataKey } from "../../redux/features/userSlice";
import { decryptDataKey } from "../../utils/crypto";
import { savePasswordToSession } from "../../utils/sessionPassword";
import { toast } from "react-toastify";

const Password = ({ close }) => {
  const user    = useSelector((state) => state.user.data);
  const dispatch = useDispatch();

  const [email,       setEmail]       = useState("");
  const [firstName,   setFirstName]   = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  useEffect(() => {
    if (user) {
      setEmail(user?.data?.email);
      setFirstName(user?.data?.firstName);
    }
  }, [user]);

  useEffect(() => {
    setOldPassword("");
    setNewPassword("");
  }, [close]);

  const [changePassword, { isLoading }] = useChangePasswordMutation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await changePassword({ oldPassword, newPassword }).unwrap();

      // ── KEY FIX ───────────────────────────────────────────────────────────────
      // The backend re-wraps the encryptedDataKey under the new password and
      // returns the updated encryptedDataKey in the response.
      //
      // We must do two things here so that after a refresh the dataKey can still
      // be restored:
      //
      // 1. Re-decrypt the new encryptedDataKey using the new password → get the
      //    raw dataKey (it hasn't changed — only its wrapper has).
      // 2. Save the new password to sessionStorage so Layout.jsx can do the same
      //    unwrap on the next page reload.
      //
      // Without this, sessionStorage still holds the OLD password, decryptDataKey
      // throws on reload, dataKey stays null, and all entries look encrypted.
      // ─────────────────────────────────────────────────────────────────────────
      const newEncryptedDataKey = response?.encryptedDataKey;
      if (newEncryptedDataKey) {
        try {
          const dataKey = decryptDataKey(newEncryptedDataKey, newPassword);
          dispatch(setUserDataKey(dataKey));
          savePasswordToSession(newPassword);
        } catch (keyErr) {
          // Non-fatal: the password change itself succeeded.
          // The user will just need to log out and back in to restore decryption.
          console.warn("[Password] Could not re-derive dataKey after password change:", keyErr.message);
          toast.warning("Password changed. Please log out and log in again to keep reading your entries.");
        }
      } else {
        // Server didn't return the new encryptedDataKey — update session password
        // anyway so the next reload uses the right password for decryption.
        savePasswordToSession(newPassword);
      }

      toast.success(response?.message);
      close();
    } catch (error) {
      toast.error(error?.data?.message);
    }
  };

  return (
    <div className="card-body">
      <h2 className="card-title block text-center text-lg mb-2">
        Change your password
      </h2>

      <p className="text-center text-error">{email}</p>
      <div className="text-center my-3">
        <p>
          Hello {firstName}, for security reasons, you must confirm your old
          password before setting a new one. Please enter your current password
          below to proceed with updating your account credentials. Thank you!
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="flex gap-5 justify-center items-center">
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