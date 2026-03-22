import { useEffect, useRef, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  useUpdateProfileMutation,
  useUploadProfilePhotoMutation,
  useDeleteProfilePhotoMutation,
} from "../../redux/api/usersApiSlice";
import { setProfilePhoto } from "../../redux/features/userSlice";
import { toast } from "react-toastify";

// ── Default avatar initials ───────────────────────────────────────
const DefaultAvatar = ({ firstName, lastName }) => {
  const initials = `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.toUpperCase() || "?";
  return (
    <div className="w-24 h-24 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center text-2xl font-bold text-primary select-none">
      {initials}
    </div>
  );
};

const Profile = ({ close }) => {
  const dispatch   = useDispatch();
  const user       = useSelector((state) => state.user.data);

  const [firstName,    setFirstName]    = useState("");
  const [lastName,     setLastName]     = useState("");
  const [preview,      setPreview]      = useState(null); // local preview URL
  const [isDragging,   setIsDragging]   = useState(false);
  const fileInputRef = useRef(null);

  const [updateProfile,      { isLoading: saving         }] = useUpdateProfileMutation();
  const [uploadProfilePhoto, { isLoading: uploading      }] = useUploadProfilePhotoMutation();
  const [deleteProfilePhoto, { isLoading: deleting       }] = useDeleteProfilePhotoMutation();

  const currentPhoto = user?.data?.profilePhoto ?? null;

  useEffect(() => {
    if (user) {
      setFirstName(user?.data?.firstName ?? "");
      setLastName(user?.data?.lastName  ?? "");
    }
    setPreview(null);
  }, [user, close]);

  // ── Convert File → base64 data URI ───────────────────────────────
  const toBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload  = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  // ── Validate and set local preview ───────────────────────────────
  const handleFile = async (file) => {
    if (!file) return;

    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowed.includes(file.type)) {
      toast.error("Only JPG, PNG, WEBP, or GIF images are allowed.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be smaller than 5 MB.");
      return;
    }

    const base64 = await toBase64(file);
    setPreview(base64);
  };

  const handleFileInput  = (e)  => handleFile(e.target.files[0]);
  const handleDrop       = (e)  => { e.preventDefault(); setIsDragging(false); handleFile(e.dataTransfer.files[0]); };
  const handleDragOver   = (e)  => { e.preventDefault(); setIsDragging(true);  };
  const handleDragLeave  = ()   => setIsDragging(false);

  // ── Upload preview to Cloudinary ─────────────────────────────────
  const handleUploadPhoto = async () => {
    if (!preview) return;
    try {
      const res = await uploadProfilePhoto({ image: preview }).unwrap();
      dispatch(setProfilePhoto(res.profilePhoto));
      setPreview(null);
      toast.success(res.message);
    } catch (err) {
      toast.error(err?.data?.message || "Upload failed. Please try again.");
    }
  };

  // ── Delete current photo ──────────────────────────────────────────
  const handleDeletePhoto = async () => {
    try {
      const res = await deleteProfilePhoto().unwrap();
      dispatch(setProfilePhoto(null));
      toast.success(res.message);
    } catch (err) {
      toast.error(err?.data?.message || "Could not remove photo.");
    }
  };

  // ── Save name changes ─────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await updateProfile({ firstName, lastName }).unwrap();
      toast.success(res.message);
      close();
    } catch (err) {
      toast.error(err?.data?.message || "Update failed.");
    }
  };

  const isProcessing = uploading || deleting || saving;

  return (
    <div className="card-body">
      <h2 className="card-title block text-center text-lg mb-4">
        Profile Information
      </h2>

      {/* ── Photo section ──────────────────────────────────────── */}
      <div className="flex flex-col items-center gap-3 mb-4">

        {/* Avatar — shows preview → current photo → initials fallback */}
        <div className="relative group">
          {preview || currentPhoto ? (
            <img
              src={preview ?? currentPhoto}
              alt="Profile"
              className="w-24 h-24 rounded-full object-cover border-2 border-primary"
            />
          ) : (
            <DefaultAvatar
              firstName={user?.data?.firstName}
              lastName={user?.data?.lastName}
            />
          )}

          {/* Click overlay to open file picker */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-medium"
          >
            Change
          </button>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={handleFileInput}
        />

        {/* Drag-and-drop zone */}
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          className={`w-full border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors text-sm ${
            isDragging
              ? "border-primary bg-primary/10 text-primary"
              : "border-base-300 hover:border-primary/50 text-base-content/50"
          }`}
        >
          {preview
            ? "New photo selected — click Upload below to save"
            : "Drag & drop a photo here, or click to browse"}
          <p className="text-xs mt-1 text-base-content/40">JPG, PNG, WEBP or GIF · max 5 MB</p>
        </div>

        {/* Action buttons for photo */}
        <div className="flex gap-2 w-full">
          {preview && (
            <>
              <button
                type="button"
                onClick={handleUploadPhoto}
                disabled={isProcessing}
                className="btn btn-primary btn-sm flex-1 rounded-xl"
              >
                {uploading ? "Uploading..." : "Upload Photo"}
              </button>
              <button
                type="button"
                onClick={() => setPreview(null)}
                disabled={isProcessing}
                className="btn btn-ghost btn-sm rounded-xl"
              >
                Cancel
              </button>
            </>
          )}

          {!preview && currentPhoto && (
            <button
              type="button"
              onClick={handleDeletePhoto}
              disabled={isProcessing}
              className="btn btn-error btn-outline btn-sm flex-1 rounded-xl"
            >
              {deleting ? "Removing..." : "Remove Photo"}
            </button>
          )}
        </div>
      </div>

      <div className="divider my-1" />

      {/* ── Name form ──────────────────────────────────────────── */}
      <p className="text-center text-sm text-base-content/50 mb-3">
        Update your first and last name below.
      </p>

      <form onSubmit={handleSubmit}>
        <div className="flex gap-4 justify-center items-start flex-wrap">
          <div>
            <label htmlFor="firstName" className="text-sm">
              First Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="firstName"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="input rounded-lg my-2 w-full"
              placeholder="First name"
              required
            />
          </div>
          <div>
            <label htmlFor="lastName" className="text-sm">
              Last Name
            </label>
            <input
              type="text"
              id="lastName"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="input rounded-lg my-2 w-full"
              placeholder="Optional"
            />
          </div>
        </div>

        <button
          type="submit"
          className="btn btn-primary w-full rounded-lg mt-3"
          disabled={isProcessing}
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </form>
    </div>
  );
};

export default Profile;