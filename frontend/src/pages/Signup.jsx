import { useEffect, useRef, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import {
  useSignupMutation,
  useVerifyOtpMutation,
  useResendOtpMutation,
} from "../redux/api/usersApiSlice";
import {
  userInfo,
  setUserPassword,
  setPendingEmail,
} from "../redux/features/userSlice";
import { savePasswordToSession } from "../utils/sessionPassword";

// ── LPU domain constant ───────────────────────────────────────────
const ALLOWED_DOMAIN = "lpu.in";

// Returns true only if email ends exactly with @lpu.in
const isLpuEmail = (email) =>
  email.trim().toLowerCase().endsWith(`@${ALLOWED_DOMAIN}`);

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

  const [step, setStep] = useState(pendingEmail ? "otp" : "form");

  const [formData, setFormData] = useState({
    firstName: "",
    lastName:  "",
    email:     "",
    password:  "",
  });

  // Tracks whether the typed email violates the domain rule in real-time
  const [emailError, setEmailError] = useState("");

  const [passwordForEncryption, setPasswordForEncryption] = useState("");
  const [otp, setOtp] = useState("");

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

  // ── Handle email field change — instant domain check ──────────
  const handleEmailChange = (e) => {
    const val = e.target.value;
    setFormData((prev) => ({ ...prev, email: val }));

    // Only validate once the user has typed past the @ symbol
    if (val.includes("@")) {
      if (!isLpuEmail(val)) {
        setEmailError(`Only @${ALLOWED_DOMAIN} email addresses are allowed.`);
      } else {
        setEmailError("");
      }
    } else {
      setEmailError(""); // no @ yet, don't nag yet
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "email") {
      handleEmailChange(e);
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  // ── Step 1: Signup form submit ─────────────────────────────────
  const handleSignup = async (e) => {
    e.preventDefault();

    // Guard: block submit if email domain is wrong
    if (!isLpuEmail(formData.email)) {
      setEmailError(`Only @${ALLOWED_DOMAIN} email addresses are allowed.`);
      toast.error(`Only LPU college emails (@${ALLOWED_DOMAIN}) can sign up.`);
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
      dispatch(setUserPassword(passwordForEncryption));
      savePasswordToSession(passwordForEncryption);
      dispatch(setPendingEmail(null));

      navigate("/");
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

  // ── Render ─────────────────────────────────────────────────────
  return (
    <div className="min-h-[calc(100svh-64px-52px-40px)]">

      {/* ── Step 1: Signup form ─────────────────────────────────── */}
      {step === "form" && (
        <>
          <div className="my-10 text-center">
            <p className="text-lg font-semibold">Create your DayBook account</p>
            <p className="text-lg font-semibold">and stay organized effortlessly.</p>

            {/* LPU-only notice */}
            <div className="inline-flex items-center gap-2 mt-3 px-4 py-2 rounded-xl bg-primary/10 border border-primary/30 text-sm font-medium text-primary">
              🎓 Open exclusively to LPU students &amp; staff &nbsp;·&nbsp;
              <span className="font-mono">@{ALLOWED_DOMAIN}</span> only
            </div>
          </div>

          <div className="flex justify-center px-7 my-10">
            <div className="card card-xl bg-base-200 w-full max-w-sm rounded-2xl shadow-xl hover:shadow-2xl">
              <div className="card-body">
                <h2 className="card-title block text-center text-lg mb-2">
                  Sign up to DayBook
                </h2>

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
                        LPU Email <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="email"
                        type="email"
                        name="email"
                        className={`input w-full rounded-lg my-3 ${
                          emailError ? "input-error border-error" : ""
                        }`}
                        placeholder={`e.g. avikghosh32@${ALLOWED_DOMAIN}`}
                        value={formData.email}
                        onChange={handleChange}
                        required
                        autoComplete="on"
                      />
                      {/* Instant domain error message */}
                      {emailError && (
                        <p className="text-error text-xs -mt-2 mb-2 flex items-center gap-1">
                          <span>⚠️</span> {emailError}
                        </p>
                      )}
                      {/* Green tick when domain is correct */}
                      {!emailError && formData.email.includes("@") && isLpuEmail(formData.email) && (
                        <p className="text-success text-xs -mt-2 mb-2 flex items-center gap-1">
                          <span>✅</span> Valid LPU email address
                        </p>
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
                      disabled={signingUp || !!emailError}
                    >
                      {signingUp ? "Sending code..." : "Create Account"}
                    </button>
                  </div>
                </form>

                <div className="text-center text-sm">
                  Already have an account?{" "}
                  <Link to="/login" className="text-red-500 hover:font-bold">
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
                Verify your LPU email
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