import { FaTrash, FaFolder, FaTag, FaCalendarAlt, FaRegSmile } from "react-icons/fa";
import { useDeleteSavedSearchMutation } from "../../redux/api/entriesApiSlice";
import { toast } from "react-toastify";

const SmartFolder = ({ folder, onSelect, active }) => {
  const [deleteSavedSearch, { isLoading: deleting }] = useDeleteSavedSearchMutation();

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to delete the "${folder.name}" smart folder?`)) {
      return;
    }
    try {
      await deleteSavedSearch(folder._id).unwrap();
      toast.success("Smart folder deleted successfully!");
    } catch (err) {
      toast.error(err?.data?.message || "Failed to delete smart folder.");
    }
  };

  const hasFilters = folder.searchText || folder.mood || folder.dateFrom || folder.dateTo || (folder.tags && folder.tags.length > 0);

  return (
    <div
      onClick={() => onSelect(folder)}
      className={`relative card bg-base-200 border-2 rounded-3xl p-4 transition-all duration-200 hover:shadow-lg cursor-pointer flex flex-col justify-between h-full select-none ${
        active
          ? "border-primary bg-primary/5 shadow-md"
          : "border-transparent hover:border-base-content/10"
      }`}
    >
      <div className="flex justify-between items-start gap-2">
        <div className="flex items-center gap-2">
          <FaFolder className={`text-lg shrink-0 ${active ? "text-primary" : "text-base-content/40"}`} />
          <h3 className="font-semibold text-sm truncate max-w-[150px]">{folder.name}</h3>
        </div>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="btn btn-ghost btn-xs btn-circle text-error hover:bg-error/15 opacity-60 hover:opacity-100 transition-opacity"
          title="Delete Smart Folder"
        >
          <FaTrash className="text-[10px]" />
        </button>
      </div>

      <div className="mt-3 flex flex-col gap-1.5 text-xs text-base-content/60">
        {folder.searchText && (
          <div className="flex items-center gap-1.5 truncate">
            <span className="font-medium text-base-content/40 shrink-0">Query:</span>
            <span className="italic truncate">&quot;{folder.searchText}&quot;</span>
          </div>
        )}
        {folder.mood && (
          <div className="flex items-center gap-1.5">
            <FaRegSmile className="text-[10px] text-base-content/40 shrink-0" />
            <span>Mood: {folder.mood}</span>
          </div>
        )}
        {(folder.dateFrom || folder.dateTo) && (
          <div className="flex items-center gap-1.5 truncate">
            <FaCalendarAlt className="text-[10px] text-base-content/40 shrink-0" />
            <span className="truncate">
              {folder.dateFrom ? folder.dateFrom : "Any"} to {folder.dateTo ? folder.dateTo : "Any"}
            </span>
          </div>
        )}
        {folder.tags && folder.tags.length > 0 && (
          <div className="flex items-start gap-1.5 flex-wrap mt-1">
            <FaTag className="text-[9px] text-base-content/40 mt-1 shrink-0" />
            <div className="flex flex-wrap gap-1">
              {folder.tags.map((t) => (
                <span key={t} className="badge badge-xs badge-ghost py-1 px-1.5 text-[9px]">
                  #{t}
                </span>
              ))}
            </div>
          </div>
        )}
        {!hasFilters && <span className="text-base-content/30 italic text-[11px]">All entries</span>}
      </div>
    </div>
  );
};

export default SmartFolder;
