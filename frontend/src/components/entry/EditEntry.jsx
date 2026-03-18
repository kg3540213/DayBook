import ModalLayout from "../ModalLayout";
import { FaPencilAlt } from "react-icons/fa";
import { useEffect, useState } from "react";
import {
  useGetEntryQuery,
  useUpdateEntryMutation,
} from "../../redux/api/entriesApiSlice";
import { encryptText, decryptText } from "../../utils/crypto.js";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";

const EditEntry = ({ id }) => {
  const [open, setOpen] = useState(false);
  const { data: getEntry, isLoading: entryLoading } = useGetEntryQuery(id, {
    skip: !open,
  });
  const [updateEntry, { isLoading: entryUpdating }] = useUpdateEntryMutation();
  // Bug fix: read userPassword from correct path in state
  const userPassword = useSelector((state) => state.user.userPassword);

  const isLoading = entryLoading || entryUpdating;

  const [formData, setFormData] = useState({
    title: "",
    mood: "",
    content: "",
    date: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  useEffect(() => {
    if (getEntry) {
      // Bug fix: decrypt the stored ciphertext before populating the form
      let decryptedContent = getEntry.data?.content || "";
      if (userPassword && decryptedContent) {
        try {
          const result = decryptText(decryptedContent, userPassword);
          // decryptText returns empty string if decryption fails — fall back to raw
          decryptedContent = result || decryptedContent;
        } catch {
          // leave as-is if decryption fails (e.g. old unencrypted entries)
        }
      }

      setFormData({
        title: getEntry.data?.title || "",
        mood: getEntry.data?.mood || "",
        content: decryptedContent,
        date: new Date(getEntry.data?.date).toISOString().slice(0, 10) || "",
      });
    }
  }, [getEntry, userPassword]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Bug fix: guard against missing password
    if (!userPassword) {
      toast.error("Session expired. Please log out and log in again to edit entries.");
      return;
    }

    try {
      // Bug fix: re-encrypt the (now plaintext) content before saving
      const encryptedContent = encryptText(formData.content, userPassword);

      const response = await updateEntry({
        id,
        data: { ...formData, content: encryptedContent },
      }).unwrap();
      setOpen(false);
      toast.success(response.message);
    } catch (error) {
      toast.error(error.data?.message || "An error occurred");
    }
  };

  return (
    <>
      <p
        onClick={() => setOpen(true)}
        className="text-success hover:cursor-pointer"
      >
        <FaPencilAlt />
      </p>

      <ModalLayout isOpen={open} close={() => setOpen(false)}>
        <div className="card-body">
          <h2 className="card-title block text-center text-lg mb-2">
            Edit Your Entry
          </h2>

          <form onSubmit={handleSubmit}>
            <div>
              <label htmlFor={`title.${id}`}>
                Entry Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="title"
                id={`title.${id}`}
                value={formData.title}
                onChange={handleChange}
                className="input w-full rounded-lg my-3"
                required
                placeholder="Give your entry a title"
              />
            </div>

            <div className="flex gap-5 justify-center items-center">
              <div>
                <label htmlFor={`date.${id}`}>
                  Select Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="date"
                  id={`date.${id}`}
                  value={formData.date}
                  onChange={handleChange}
                  className="input rounded-lg my-3"
                />
              </div>

              <div>
                <label htmlFor={`mood.${id}`}>
                  Your Mood <span className="text-red-500">*</span>
                </label>

                <select
                  name="mood"
                  id={`mood.${id}`}
                  value={formData.mood}
                  onChange={handleChange}
                  className="select rounded-lg my-3"
                >
                  <option value="🙂">🙂 Happy</option>
                  <option value="😔">😔 Sad</option>
                  <option value="😡">😡 Angry</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor={`content.${id}`}>
                Describe Your Day <span className="text-red-500">*</span>
              </label>
              <textarea
                name="content"
                id={`content.${id}`}
                value={formData.content}
                onChange={handleChange}
                className="textarea w-full rounded-lg my-3 h-50"
                required
                placeholder="Write about your day, thoughts, or experiences"
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary w-full rounded-lg mt-3"
              disabled={isLoading}
            >
              {isLoading ? "Please wait!.." : "Save Changes"}
            </button>
          </form>
        </div>
      </ModalLayout>
    </>
  );
};
export default EditEntry;