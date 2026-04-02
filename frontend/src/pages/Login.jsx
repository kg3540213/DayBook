import { useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { useLoginMutation } from "../redux/api/usersApiSlice";
import { useDispatch, useSelector } from "react-redux";
import { userInfo, setUserDataKey } from "../redux/features/userSlice";
import { decryptDataKey } from "../utils/crypto";
import { savePasswordToSession } from "../utils/sessionPassword";
import { toast } from "react-toastify";

const Login = () => {
  const user = useSelector((state) => state.user.data);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [login, { isLoading }] = useLoginMutation();

  if (user) return <Navigate to="/" replace />;

  // Read ?redirect= so we can bounce back to the invite page after login
  const redirectTo = searchParams.get("redirect") || "/";

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await login({ email, password }).unwrap();

      const encryptedDataKey = response.data.encryptedDataKey;
      if (!encryptedDataKey) {
        toast.error("Missing encrypted data key from server. Cannot decrypt entries.");
        return;
      }

      let dataKey;
      try {
        dataKey = decryptDataKey(encryptedDataKey, password);
      } catch (e) {
        toast.error("Incorrect password. Could not decrypt your data key.");
        return;
      }

      dispatch(userInfo(response));
      dispatch(setUserDataKey(dataKey));
      savePasswordToSession(password);

      navigate(redirectTo, { replace: true });
      toast.success(`Welcome back, ${response.data.firstName}`);
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

            {/* Show a hint if user came from an invite link */}
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
              Don't have an account?{" "}
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