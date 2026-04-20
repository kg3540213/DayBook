// frontend/src/pages/Login.jsx
//
// Option A changes:
//   - No encryptedDataKey / decryptDataKey
//   - After successful login: derive AES key from password, store in sessionStorage,
//     dispatch setEncKey so components can encrypt/decrypt immediately

import { useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { useLoginMutation } from "../redux/api/usersApiSlice";
import { useDispatch, useSelector } from "react-redux";
import { userInfo, setEncKey } from "../redux/features/userSlice";
import { deriveAndStoreKey } from "../utils/crypto";
import { toast } from "react-toastify";

const Login = () => {
  const user    = useSelector((state) => state.user.data);
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const [searchParams] = useSearchParams();
  const [login, { isLoading }] = useLoginMutation();

  if (user) return <Navigate to="/" replace />;

  const redirectTo = searchParams.get("redirect") || "/";

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await login({ email, password }).unwrap();

      // Derive the AES-256 key from the password and persist to sessionStorage.
      // This is the ONLY place the key is derived from the password —
      // all subsequent operations read from Redux / sessionStorage.
      const encKey = deriveAndStoreKey(password);

      dispatch(userInfo(response));
      dispatch(setEncKey(encKey));

      navigate(redirectTo, { replace: true });
      toast.success(`Welcome back, ${response.data.firstName}!`);
    } catch (error) {
      toast.error(error?.data?.message || "An unexpected error occurred!");
    }
  };

  return (
    <div className="min-h-[calc(100dvh-64px-52px-40px)]">
      <div className="my-10">
        <p className="text-lg font-semibold text-center">
          Log in to access your account
        </p>
        <p className="text-lg font-semibold text-center">
          and continue your journey with DayBook.
        </p>
      </div>

      <div className="flex justify-center px-7 my-10">
        <div className="card card-xl bg-base-200 w-full max-w-sm rounded-2xl shadow-xl hover:shadow-2xl">
          <div className="card-body">
            <h2 className="card-title block text-center text-lg mb-2">
              Log in to DayBook
            </h2>

            {redirectTo.includes("invite") && (
              <div className="alert alert-info rounded-xl text-xs py-2 mb-2">
                <span>📩</span>
                <span>Log in to view your journal invite.</span>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="text-sm">
                <div>
                  <label htmlFor="email">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="email"
                    type="email"
                    className="input w-full rounded-lg my-3"
                    placeholder="Enter email"
                    onChange={(e) => setEmail(e.target.value)}
                    value={email}
                    required
                    autoComplete="on"
                  />
                </div>

                <div>
                  <label htmlFor="password">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="password"
                    type="password"
                    className="input w-full rounded-lg my-3"
                    placeholder="Password"
                    onChange={(e) => setPassword(e.target.value)}
                    value={password}
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary w-full rounded-lg my-3"
                  disabled={isLoading}
                >
                  {isLoading ? "Logging in..." : "Log in"}
                </button>
              </div>
            </form>

            <div className="text-center text-sm">
              Don&apos;t have an account?{" "}
              <Link to="/signup" className="text-red-500 hover:font-bold">
                Sign up
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;