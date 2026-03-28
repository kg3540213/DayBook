import { useEffect } from "react";
import { useParams, useNavigate, Navigate, useLocation, useSearchParams } from "react-router-dom";
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

  // ?action=accept  or  ?action=decline  (set by the email links)
  const action = searchParams.get("action"); // "accept" | "decline" | null

  const { data, isLoading, isError } = useGetInviteInfoQuery(token, { skip: !token });

  const [acceptInvite,  { isLoading: accepting  }] = useAcceptInviteMutation();
  const [declineInvite, { isLoading: declining  }] = useDeclineInviteMutation();

  // Must be logged in — preserve the full path + query string for redirect
  if (!user) {
    return (
      <Navigate
        to={`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`}
        replace
      />
    );
  }

  const info = data?.data;

  // ── Auto-trigger accept / decline when arriving from the email link ──
  useEffect(() => {
    if (!info || !action) return;
    if (info.status === "active" || info.status === "declined") return;

    // Only the invited email can act
    if (user.data.email !== info.inviteEmail) return;

    if (action === "accept") {
      acceptInvite(token)
        .unwrap()
        .then((res) => {
          toast.success(res.message || "You've joined the shared journal!");
          navigate("/shared-journals");
        })
        .catch((err) => {
          toast.error(err?.data?.message || "Could not accept invite.");
        });
    } else if (action === "decline") {
      declineInvite(token)
        .unwrap()
        .then((res) => {
          toast.info(res.message || "Invite declined.");
          navigate("/");
        })
        .catch((err) => {
          toast.error(err?.data?.message || "Could not decline invite.");
        });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [info, action]);

  // ── Loading ──────────────────────────────────────────────────────
  if (isLoading || (action && !info)) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100dvh-64px-52px)]">
        <Loader />
      </div>
    );
  }

  // ── Error / invalid token ────────────────────────────────────────
  if (isError || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100dvh-64px-52px)] gap-4 px-6 text-center">
        <span className="text-5xl">⚠️</span>
        <h2 className="text-2xl font-bold">Invalid or Expired Invite</h2>
        <p className="text-base-content/60 max-w-sm">
          This invite link is no longer valid. It may have expired (7 days) or already been used.
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

  // ── Already active ───────────────────────────────────────────────
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

  // ── Already declined ─────────────────────────────────────────────
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

  // ── Auto-triggering spinner (email link with ?action=) ───────────
  if (action && user.data.email === info.inviteEmail) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100dvh-64px-52px)] gap-4 px-6 text-center">
        <Loader />
        <p className="text-base-content/60 text-sm">
          {action === "accept" ? "Joining journal…" : "Declining invite…"}
        </p>
      </div>
    );
  }

  // ── Manual accept / decline UI (no ?action, or wrong account) ────
  const handleAccept = async () => {
    try {
      const res = await acceptInvite(token).unwrap();
      toast.success(res.message);
      navigate("/shared-journals");
    } catch (err) {
      toast.error(err?.data?.message || "Could not accept invite.");
    }
  };

  const handleDecline = async () => {
    try {
      const res = await declineInvite(token).unwrap();
      toast.info(res.message);
      navigate("/");
    } catch (err) {
      toast.error(err?.data?.message || "Could not decline invite.");
    }
  };

  return (
    <div className="flex justify-center items-center min-h-[calc(100dvh-64px-52px)] px-6">
      <div className="card bg-base-200 w-full max-w-sm rounded-3xl shadow-xl border border-base-300">
        <div className="card-body items-center text-center gap-4">
          <FaUsers className="text-primary text-4xl" />

          <div>
            <h1 className="text-xl font-bold mb-1">You've been invited!</h1>
            <p className="text-base-content/60 text-sm">
              <strong>{info.ownerName}</strong> invited you to join a shared journal on DayBook.
            </p>
          </div>

          {/* Journal name */}
          <div className="bg-base-300 rounded-2xl px-6 py-4 w-full">
            <p className="text-xs text-base-content/50 uppercase tracking-widest mb-1">Journal</p>
            <p className="text-xl font-bold text-primary">{info.journalName}</p>
          </div>

          {/* Encryption warning */}
          <div className="alert alert-warning rounded-xl text-xs py-2 text-left">
            <span>🔓</span>
            <span>
              Shared entries are <strong>not encrypted</strong> — both members can read them.
            </span>
          </div>

          {/* Wrong account warning */}
          {user.data.email !== info.inviteEmail && (
            <div className="alert alert-error rounded-xl text-xs py-2">
              <span>⚠️</span>
              <span>
                This invite was sent to <strong>{info.inviteEmail}</strong>. You're logged in as{" "}
                <strong>{user.data.email}</strong>. Please log in with the correct account.
              </span>
            </div>
          )}

          {/* Action buttons — only shown for the right account */}
          {user.data.email === info.inviteEmail && (
            <div className="flex gap-3 w-full">
              <button
                onClick={handleAccept}
                disabled={accepting || declining}
                className="btn btn-primary flex-1 rounded-xl"
              >
                {accepting ? (
                  <><span className="loading loading-spinner loading-xs" /> Joining…</>
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