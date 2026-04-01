import { useEffect, useRef, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  useUpdateProfileMutation,
  useUploadProfilePhotoMutation,
  useDeleteProfilePhotoMutation,
} from "../../redux/api/usersApiSlice";
import { setProfilePhoto, userInfo } from "../../redux/features/userSlice";
import { toast } from "react-toastify";

// ── Initials avatar fallback ──────────────────────────────────────
const DefaultAvatar = ({ firstName, lastName }) => {
  const initials =
    `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.toUpperCase() || "?";
  return (
    <div className="w-24 h-24 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center text-2xl font-bold text-primary select-none">
      {initials}
    </div>
  );
};

const Profile = ({ close }) => {
  const dispatch  = useDispatch();
  const user      = useSelector((state) => state.user.data);

  const [firstName,  setFirstName]  = useState("");
  const [lastName,   setLastName]   = useState("");
  const [preview,    setPreview]    = useState(null);   // local base64 preview
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const [updateProfile,      { isLoading: saving    }] = useUpdateProfileMutation();
  const [uploadProfilePhoto, { isLoading: uploading }] = useUploadProfilePhotoMutation();
  const [deleteProfilePhoto, { isLoading: deleting  }] = useDeleteProfilePhotoMutation();

  const currentPhoto = user?.data?.data?.profilePhoto ?? null;

  useEffect(() => {
    if (user) {
      setFirstName(user?.data?.data?.firstName ?? "");
      setLastName(user?.data?.data?.lastName   ?? "");
    }
    setPreview(null);
  }, [user, close]);

  // ── File → base64 data URI ────────────────────────────────────────
  const toBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload  = () => resolve(reader.result);
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });

  // ── Validate then set local preview ──────────────────────────────
  const handleFile = async (file) => {
    if (!file) return;

    const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error("Only JPG, PNG, WEBP, or GIF images are allowed.");
      return;
    }

    // 5 MB client-side guard
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be smaller than 5 MB.");
      return;
    }

    try {
      const base64 = await toBase64(file);
      setPreview(base64);
    } catch {
      toast.error("Could not read the file. Please try again.");
    }
  };

  const handleFileInput = (e) => {
    handleFile(e.target.files[0]);
    // Reset so picking the same file again still triggers onChange
    e.target.value = "";
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const handleDragOver  = (e) => { e.preventDefault(); setIsDragging(true);  };
  const handleDragLeave = ()   => setIsDragging(false);

  // ── Upload preview to Cloudinary via backend ─────────────────────
  const handleUploadPhoto = async () => {
    if (!preview) return;

    try {
      const res = await uploadProfilePhoto({ image: preview }).unwrap();
      // Update both the photo and the full user object in Redux
      dispatch(setProfilePhoto(res.profilePhoto));
      // Update the full user object to ensure UI reflects changes everywhere
      dispatch(
        userInfo({
          ...user,
          data: {
            ...user?.data,
            data: {
              ...user?.data?.data,
              profilePhoto: res.profilePhoto,
            },
          },
        })
      );
      setPreview(null);
      toast.success(res.message || "Photo updated!");
    } catch (err) {
      console.error("Upload error:", err);
      toast.error(
        err?.data?.message || "Upload failed. Check your internet and try again."
      );
    }
  };

  // ── Remove current photo ──────────────────────────────────────────
  const handleDeletePhoto = async () => {
    try {
      const res = await deleteProfilePhoto().unwrap();
      // Update both the photo and the full user object in Redux
      dispatch(setProfilePhoto(null));
      dispatch(
        userInfo({
          ...user,
          data: {
            ...user?.data,
            data: {
              ...user?.data?.data,
              profilePhoto: null,
            },
          },
        })
      );
      toast.success(res.message || "Photo removed.");
    } catch (err) {
      toast.error(err?.data?.message || "Could not remove photo.");
    }
  };

  // ── Save name ─────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await updateProfile({ firstName, lastName }).unwrap();
      // Update Redux with the new name
      dispatch(
        userInfo({
          ...user,
          data: {
            ...user?.data,
            data: {
              ...user?.data?.data,
              firstName,
              lastName,
            },
          },
        })
      );
      toast.success(res.message || "Profile saved.");
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

      {/* ── Photo area ─────────────────────────────────────────── */}
      <div className="flex flex-col items-center gap-3 mb-4">

        {/* Avatar — preview → current photo → initials */}
        <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
          {preview || currentPhoto ? (
            <img
              src={preview ?? currentPhoto}
              alt="Profile"
              className="w-24 h-24 rounded-full object-cover border-2 border-primary"
            />
          ) : (
            <DefaultAvatar
              firstName={user?.data?.data?.firstName}
              lastName={user?.data?.data?.lastName}
            />
          )}
          <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold pointer-events-none">
            Change
          </div>
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
          className={`w-full border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors text-sm select-none ${
            isDragging
              ? "border-primary bg-primary/10 text-primary"
              : "border-base-300 hover:border-primary/50 text-base-content/50"
          }`}
        >
          {preview
            ? "✅ Photo selected — click Upload to save"
            : "Drag & drop a photo here, or click to browse"}
          <p className="text-xs mt-1 text-base-content/40">
            JPG, PNG, WEBP or GIF · max 5 MB
          </p>
        </div>

        {/* Upload / Cancel buttons — shown only when a preview is staged */}
        {preview && (
          <div className="flex gap-2 w-full">
            <button
              type="button"
              onClick={handleUploadPhoto}
              disabled={isProcessing}
              className="btn btn-primary btn-sm flex-1 rounded-xl"
            >
              {uploading ? (
                <><span className="loading loading-spinner loading-xs" /> Uploading…</>
              ) : (
                "Upload Photo"
              )}
            </button>
            <button
              type="button"
              onClick={() => setPreview(null)}
              disabled={isProcessing}
              className="btn btn-ghost btn-sm rounded-xl"
            >
              Cancel
            </button>
          </div>
        )}

        {/* Remove button — shown only when a photo exists and no new one is staged */}
        {!preview && currentPhoto && (
          <button
            type="button"
            onClick={handleDeletePhoto}
            disabled={isProcessing}
            className="btn btn-error btn-outline btn-sm w-full rounded-xl"
          >
            {deleting ? (
              <><span className="loading loading-spinner loading-xs" /> Removing…</>
            ) : (
              "Remove Photo"
            )}
          </button>
        )}
      </div>

      <div className="divider my-1" />

      {/* ── Name form ──────────────────────────────────────────── */}
      <p className="text-center text-sm text-base-content/50 mb-3">
        Update your display name below.
      </p>

      <form onSubmit={handleSubmit}>
        <div className="flex gap-4 justify-center flex-wrap">
          <div className="flex flex-col gap-1 flex-1 min-w-[140px]">
            <label htmlFor="firstName" className="text-sm font-medium">
              First Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="firstName"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="input rounded-lg"
              placeholder="First name"
              required
            />
          </div>
          <div className="flex flex-col gap-1 flex-1 min-w-[140px]">
            <label htmlFor="lastName" className="text-sm font-medium">
              Last Name
            </label>
            <input
              type="text"
              id="lastName"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="input rounded-lg"
              placeholder="Optional"
            />
          </div>
        </div>

        <button
          type="submit"
          className="btn btn-primary w-full rounded-lg mt-4"
          disabled={isProcessing}
        >
          {saving ? "Saving…" : "Save Changes"}
        </button>
      </form>
    </div>
  );
};

export default Profile;