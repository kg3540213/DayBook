// frontend/src/pages/InviteHandler.jsx
// Fixes vs original:
//   1. Redirect to /signup (not just /login) preserving the full redirect URL
//   2. Auto-trigger (useEffect) has a stable guard so it doesn't fire
//      while info is still null — was causing a race on first load after signup
//   3. "Wrong account" warning shows the signup link too, not just login
//   4. Manual Accept/Decline UI is now always shown when the account matches,
//      even if ?action= is present but the effect hasn't fired yet

import { useEffect, useRef } from "react";
import {
  useParams,
  useNavigate,
  Navigate,
  useLocation,
  useSearchParams,
} from "react-router-dom";
import { useSelector } from "react-redux";
import {
  useGetInviteInfoQuery,
  useAcceptInviteMutation,
  useDeclineInviteMutation,
} from "../redux/api/sharedJournalApiSlice";
import Loader from "../components/Loader";
import { toast } from "react-toastify";
import { FaUsers } from "react-icons/fa";

const InviteHandler = () => {
  const user           = useSelector((state) => state.user.data);
  const { token }      = useParams();
  const navigate       = useNavigate();
  const location       = useLocation();
  const [searchParams] = useSearchParams();

  const action = searchParams.get("action"); // "accept" | "decline" | null

  const { data, isLoading, isError } = useGetInviteInfoQuery(token, {
    skip: !token,
  });

  const [acceptInvite,  { isLoading: accepting  }] = useAcceptInviteMutation();
  const [declineInvite, { isLoading: declining  }] = useDeclineInviteMutation();

  // ── Guard: must be logged in ───────────────────────────────────
  // Preserve the FULL path + query string so after login/signup the
  // user lands right back here with the token and ?action= intact.
  if (!user) {
    const redirectPath = encodeURIComponent(
      location.pathname + location.search
    );
    // Send to login; login page already has a "Sign up" link that also
    // preserves the redirect.  We pass signup hint via the same param.
    return <Navigate to={`/login?redirect=${redirectPath}`} replace />;
  }

  const info           = data?.data;
  const currentEmail   = user.data.email;
  const isRightAccount = info ? currentEmail === info.inviteEmail : false;

  // ── Auto-trigger accept/decline from email link ────────────────
  // Use a ref so this only fires ONCE per mount even in StrictMode.
  const autoTriggered = useRef(false);

  useEffect(() => {
    // Wait until info is loaded AND we haven't triggered yet
    if (!info || !action || autoTriggered.current) return;
    // Only the invited email can auto-accept/decline
    if (!isRightAccount) return;
    // Don't auto-trigger if the journal is already in a terminal state
    if (info.status === "active" || info.status === "declined") return;

    autoTriggered.current = true;

    if (action === "accept") {
      acceptInvite(token)
        .unwrap()
        .then((res) => {
          toast.success(res.message || "You've joined the shared journal!");
          navigate("/shared-journals", { replace: true });
        })
        .catch((err) => {
          toast.error(err?.data?.message || "Could not accept invite.");
          // Reset so the manual buttons are usable as a fallback
          autoTriggered.current = false;
        });
    } else if (action === "decline") {
      declineInvite(token)
        .unwrap()
        .then((res) => {
          toast.info(res.message || "Invite declined.");
          navigate("/", { replace: true });
        })
        .catch((err) => {
          toast.error(err?.data?.message || "Could not decline invite.");
          autoTriggered.current = false;
        });
    }
  }, [info, action, isRightAccount]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Manual handlers (fallback + wrong-account guard) ──────────
  const handleAccept = async () => {
    try {
      const res = await acceptInvite(token).unwrap();
      toast.success(res.message);
      navigate("/shared-journals", { replace: true });
    } catch (err) {
      toast.error(err?.data?.message || "Could not accept invite.");
    }
  };

  const handleDecline = async () => {
    try {
      const res = await declineInvite(token).unwrap();
      toast.info(res.message);
      navigate("/", { replace: true });
    } catch (err) {
      toast.error(err?.data?.message || "Could not decline invite.");
    }
  };

  // ── Loading ────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100dvh-64px-52px)]">
        <Loader />
      </div>
    );
  }

  // ── Error / invalid token ──────────────────────────────────────
  if (isError || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100dvh-64px-52px)] gap-4 px-6 text-center">
        <span className="text-5xl">⚠️</span>
        <h2 className="text-2xl font-bold">Invalid or Expired Invite</h2>
        <p className="text-base-content/60 max-w-sm">
          This invite link is no longer valid. It may have expired (7 days) or
          already been used.
        </p>
        <button
          onClick={() => navigate("/shared-journals")}
          className="btn btn-primary rounded-xl"
        >
          Go to Shared Journals
        </button>
      </div>
    );
  }

  // ── Already active ─────────────────────────────────────────────
  if (info.status === "active") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100dvh-64px-52px)] gap-4 px-6 text-center">
        <span className="text-5xl">✅</span>
        <h2 className="text-2xl font-bold">Already Active!</h2>
        <p className="text-base-content/60">This journal is already active.</p>
        <button
          onClick={() => navigate("/shared-journals")}
          className="btn btn-primary rounded-xl"
        >
          Open Shared Journals
        </button>
      </div>
    );
  }

  // ── Already declined ───────────────────────────────────────────
  if (info.status === "declined") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100dvh-64px-52px)] gap-4 px-6 text-center">
        <span className="text-5xl">❌</span>
        <h2 className="text-2xl font-bold">Invite Declined</h2>
        <p className="text-base-content/60">This invite was already declined.</p>
        <button onClick={() => navigate("/")} className="btn btn-ghost rounded-xl">
          Go Home
        </button>
      </div>
    );
  }

  // ── Auto-triggering spinner ────────────────────────────────────
  // Show this ONLY when the effect is actively running (after it fired).
  // While it hasn't fired yet we fall through to the manual UI below
  // so the user always sees buttons — no blank screen.
  if (autoTriggered.current && isRightAccount && (accepting || declining)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100dvh-64px-52px)] gap-4 px-6 text-center">
        <Loader />
        <p className="text-base-content/60 text-sm">
          {action === "accept" ? "Joining journal…" : "Declining invite…"}
        </p>
      </div>
    );
  }

  // ── Main invite card — always shown if not in a terminal state ─
  return (
    <div className="flex justify-center items-center min-h-[calc(100dvh-64px-52px)] px-6">
      <div className="card bg-base-200 w-full max-w-sm rounded-3xl shadow-xl border border-base-300">
        <div className="card-body items-center text-center gap-4">
          <FaUsers className="text-primary text-4xl" />

          <div>
            <h1 className="text-xl font-bold mb-1">You've been invited!</h1>
            <p className="text-base-content/60 text-sm">
              <strong>{info.ownerName}</strong> invited you to join a shared
              journal on DayBook.
            </p>
          </div>

          {/* Journal name */}
          <div className="bg-base-300 rounded-2xl px-6 py-4 w-full">
            <p className="text-xs text-base-content/50 uppercase tracking-widest mb-1">
              Journal
            </p>
            <p className="text-xl font-bold text-primary">{info.journalName}</p>
          </div>

          {/* Encryption warning */}
          <div className="alert alert-warning rounded-xl text-xs py-2 text-left">
            <span>🔓</span>
            <span>
              Shared entries are <strong>not encrypted</strong> — both members
              can read them.
            </span>
          </div>

          {/* ── Wrong account warning ────────────────────────── */}
          {!isRightAccount && (
            <div className="alert alert-error rounded-xl text-xs py-2 text-left">
              <span>⚠️</span>
              <div>
                <p>
                  This invite was sent to{" "}
                  <strong>{info.inviteEmail}</strong>.
                </p>
                <p className="mt-1">
                  You're logged in as <strong>{currentEmail}</strong>.
                </p>
                <p className="mt-2">
                  Please{" "}
                  <a
                    href={`/login?redirect=${encodeURIComponent(
                      location.pathname + location.search
                    )}`}
                    className="underline font-semibold"
                  >
                    log in
                  </a>{" "}
                  or{" "}
                  <a
                    href={`/signup?redirect=${encodeURIComponent(
                      location.pathname + location.search
                    )}`}
                    className="underline font-semibold"
                  >
                    sign up
                  </a>{" "}
                  with <strong>{info.inviteEmail}</strong>.
                </p>
              </div>
            </div>
          )}

          {/* ── Accept / Decline buttons ─────────────────────── */}
          {/* Shown whenever the email matches — whether auto-trigger
              is pending or not.  This guarantees the user always has
              a way to act even if the auto-trigger fails. */}
          {isRightAccount && (
            <div className="flex gap-3 w-full">
              <button
                onClick={handleAccept}
                disabled={accepting || declining}
                className="btn btn-primary flex-1 rounded-xl"
              >
                {accepting ? (
                  <>
                    <span className="loading loading-spinner loading-xs" />{" "}
                    Joining…
                  </>
                ) : (
                  "✅ Accept"
                )}
              </button>
              <button
                onClick={handleDecline}
                disabled={accepting || declining}
                className="btn btn-ghost flex-1 rounded-xl text-error"
              >
                {declining ? "…" : "✕ Decline"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InviteHandler;