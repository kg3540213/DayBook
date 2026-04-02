// frontend/src/pages/Signup.jsx
// Fix: after successful OTP verification, navigate to ?redirect= URL
// if one exists (e.g. the invite page), otherwise fall back to "/"
// Also: Login link preserves the redirect param so the user can
// switch between login/signup without losing the invite URL.

import { useEffect, useRef, useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import {
  useSignupMutation,
  useVerifyOtpMutation,
  useResendOtpMutation,
} from "../redux/api/usersApiSlice";
import {
  userInfo,
  setUserDataKey,
  setPendingEmail,
} from "../redux/features/userSlice";
import { decryptDataKey } from "../utils/crypto";
import { savePasswordToSession } from "../utils/sessionPassword";

// ── OTP input — 6 individual digit boxes ─────────────────────────
const OtpInput = ({ otp, setOtp }) => {
  const inputsRef = useRef([]);

  const handleChange = (e, index) => {
    const val = e.target.value.replace(/\D/g, "");
    if (!val) return;
    const newOtp = otp.split("");
    newOtp[index] = val.slice(-1);
    setOtp(newOtp.join(""));
    if (index < 5) inputsRef.current[index + 1]?.focus();
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace") {
      const newOtp = otp.split("");
      if (newOtp[index]) {
        newOtp[index] = "";
        setOtp(newOtp.join(""));
      } else if (index > 0) {
        inputsRef.current[index - 1]?.focus();
      }
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    setOtp(pasted.padEnd(6, "").slice(0, 6));
    const focusIndex = Math.min(pasted.length, 5);
    inputsRef.current[focusIndex]?.focus();
  };

  return (
    <div className="flex gap-2 justify-center my-4" onPaste={handlePaste}>
      {Array.from({ length: 6 }).map((_, i) => (
        <input
          key={i}
          ref={(el) => (inputsRef.current[i] = el)}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={otp[i] || ""}
          onChange={(e) => handleChange(e, i)}
          onKeyDown={(e) => handleKeyDown(e, i)}
          className="input w-10 h-12 text-center text-xl font-bold rounded-lg p-0"
        />
      ))}
    </div>
  );
};

// ── Main component ────────────────────────────────────────────────
const Signup = () => {
  const user         = useSelector((state) => state.user.data);
  const pendingEmail = useSelector((state) => state.user.pendingEmail);
  const dispatch     = useDispatch();
  const navigate     = useNavigate();

  // ── FIX: read ?redirect= so we can bounce back after signup ──
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/";

  const [step, setStep] = useState(pendingEmail ? "otp" : "form");

  const [formData, setFormData] = useState({
    firstName: "",
    lastName:  "",
    email:     "",
    password:  "",
  });

  const [passwordForEncryption, setPasswordForEncryption] = useState("");
  const [otp, setOtp] = useState("");
  const [emailError, setEmailError] = useState("");

  const [countdown, setCountdown] = useState(0);
  const timerRef = useRef(null);

  const [signup,    { isLoading: signingUp }] = useSignupMutation();
  const [verifyOtp, { isLoading: verifying }] = useVerifyOtpMutation();
  const [resendOtp, { isLoading: resending }] = useResendOtpMutation();

  if (user) return <Navigate to="/" replace />;

  // ── Countdown helpers ──────────────────────────────────────────
  const startCountdown = (seconds = 60) => {
    setCountdown(seconds);
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) { clearInterval(timerRef.current); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => () => clearInterval(timerRef.current), []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Validate email format if field being changed is email
    if (name === "email") {
      const email = value.trim().toLowerCase();
      if (email && !email.endsWith("@lpu.in")) {
        setEmailError("Only LPU emails (e.g., avikgh12@lpu.in) are allowed");
      } else {
        setEmailError("");
      }
    }
  };

  // ── Step 1: Signup form submit ─────────────────────────────────
  const handleSignup = async (e) => {
    e.preventDefault();
    
    // Validate email before submission
    const email = formData.email.trim().toLowerCase();
    if (!email.endsWith("@lpu.in")) {
      toast.error("Only LPU emails (e.g., avikgh12@lpu.in) are allowed");
      setEmailError("Only LPU emails (e.g., avikgh12@lpu.in) are allowed");
      return;
    }
    
    try {
      const response = await signup(formData).unwrap();
      dispatch(setPendingEmail(formData.email));
      setPasswordForEncryption(formData.password);
      setStep("otp");
      startCountdown(60);
      toast.success(response.message);
    } catch (error) {
      toast.error(error?.data?.message || "Signup failed. Please try again.");
    }
  };

  // ── Step 2: OTP verify submit ──────────────────────────────────
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) {
      toast.warn("Please enter the complete 6-digit code.");
      return;
    }
    try {
      const email    = pendingEmail || formData.email;
      const response = await verifyOtp({ email, otp }).unwrap();

      dispatch(userInfo(response));

      const encryptedDataKey = response.data.encryptedDataKey;
      if (!encryptedDataKey) {
        toast.error("Missing encrypted data key from server. Cannot decrypt entries.");
        return;
      }

      let dataKey;
      try {
        dataKey = decryptDataKey(encryptedDataKey, passwordForEncryption);
      } catch (err) {
        toast.error("Unable to decrypt your data key after signup. Please try again.");
        return;
      }

      dispatch(setUserDataKey(dataKey));
      savePasswordToSession(passwordForEncryption);
      dispatch(setPendingEmail(null));

      // ── FIX: go to the invite page (or wherever redirect points) ──
      navigate(redirectTo, { replace: true });
      toast.success(response.message);
    } catch (error) {
      toast.error(error?.data?.message || "Verification failed. Please try again.");
      setOtp("");
    }
  };

  // ── Resend OTP ─────────────────────────────────────────────────
  const handleResend = async () => {
    if (countdown > 0) return;
    try {
      const email    = pendingEmail || formData.email;
      const response = await resendOtp({ email }).unwrap();
      toast.success(response.message);
      startCountdown(60);
      setOtp("");
    } catch (error) {
      const wait = error?.data?.waitSeconds;
      if (wait) startCountdown(wait);
      toast.error(error?.data?.message || "Failed to resend code.");
    }
  };

  // ── Build login href — preserve redirect so switching to login
  //    doesn't drop the invite URL ────────────────────────────────
  const loginHref = redirectTo && redirectTo !== "/"
    ? `/login?redirect=${encodeURIComponent(redirectTo)}`
    : "/login";

  // ── Render ─────────────────────────────────────────────────────
  return (
    <div className="min-h-[calc(100svh-64px-52px-40px)]">

      {/* ── Step 1: Signup form ─────────────────────────────────── */}
      {step === "form" && (
        <>
          <div className="my-10 text-center">
            <p className="text-lg font-semibold">Create your DayBook account</p>
            <p className="text-lg font-semibold">and stay organized effortlessly.</p>
          </div>

          <div className="flex justify-center px-7 my-10">
            <div className="card card-xl bg-base-200 w-full max-w-sm rounded-2xl shadow-xl hover:shadow-2xl">
              <div className="card-body">
                <h2 className="card-title block text-center text-lg mb-2">
                  Sign up to DayBook
                </h2>

                {/* Show hint if user arrived from an invite link */}
                {redirectTo.includes("invite") && (
                  <div className="alert alert-info rounded-xl text-xs py-2 mb-2">
                    <span>📩</span>
                    <span>Create an account to accept your journal invite.</span>
                  </div>
                )}

                <form onSubmit={handleSignup}>
                  <div className="text-sm">
                    <div>
                      <label htmlFor="firstName">
                        First Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="firstName"
                        type="text"
                        name="firstName"
                        className="input w-full rounded-lg my-3"
                        placeholder="Enter your first name"
                        value={formData.firstName}
                        onChange={handleChange}
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="lastName">Last Name</label>
                      <input
                        id="lastName"
                        type="text"
                        name="lastName"
                        className="input w-full rounded-lg my-3"
                        placeholder="Optional"
                        value={formData.lastName}
                        onChange={handleChange}
                      />
                    </div>

                    <div>
                      <label htmlFor="email">
                        Email <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="email"
                        type="email"
                        name="email"
                        className={`input w-full rounded-lg my-3 ${emailError ? 'input-error' : ''}`}
                        placeholder="avikgh12@lpu.in"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        autoComplete="on"
                      />
                      {emailError && (
                        <p className="text-error text-sm mt-1">{emailError}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="password">
                        Password <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="password"
                        type="password"
                        name="password"
                        className="input w-full rounded-lg my-3"
                        placeholder="Password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      className="btn btn-primary w-full rounded-lg my-3"
                      disabled={signingUp || emailError}
                    >
                      {signingUp ? "Sending code..." : "Create Account"}
                    </button>
                  </div>
                </form>

                <div className="text-center text-sm">
                  Already have an account?{" "}
                  {/* FIX: preserve redirect on the login link */}
                  <Link to={loginHref} className="text-red-500 hover:font-bold">
                    Log in
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Step 2: OTP verification ────────────────────────────── */}
      {step === "otp" && (
        <div className="flex justify-center px-7 my-16">
          <div className="card card-xl bg-base-200 w-full max-w-sm rounded-2xl shadow-xl hover:shadow-2xl">
            <div className="card-body">
              <h2 className="card-title block text-center text-lg mb-1">
                Verify your email
              </h2>
              <p className="text-center text-sm text-base-content/60 mb-2">
                We sent a 6-digit code to
              </p>
              <p className="text-center font-medium text-primary text-sm mb-4">
                {pendingEmail || formData.email}
              </p>

              <form onSubmit={handleVerifyOtp}>
                <OtpInput otp={otp} setOtp={setOtp} />

                <button
                  type="submit"
                  className="btn btn-primary w-full rounded-lg mt-2"
                  disabled={verifying || otp.length !== 6}
                >
                  {verifying ? "Verifying..." : "Verify & Continue"}
                </button>
              </form>

              <div className="text-center mt-4 text-sm">
                {countdown > 0 ? (
                  <p className="text-base-content/50">
                    Resend code in{" "}
                    <span className="font-medium text-primary">{countdown}s</span>
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={resending}
                    className="text-primary hover:underline font-medium"
                  >
                    {resending ? "Sending..." : "Resend code"}
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => {
                  setStep("form");
                  setOtp("");
                  dispatch(setPendingEmail(null));
                  clearInterval(timerRef.current);
                  setCountdown(0);
                }}
                className="btn btn-ghost btn-sm w-full mt-2 text-base-content/50"
              >
                ← Change email
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Signup;