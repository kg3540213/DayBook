// frontend/src/components/Layout.jsx
//
// Option A changes:
//   - No encryptedDataKey / decryptDataKey logic
//   - On reload: restore encKey directly from sessionStorage via restoreKeyFromSession()
//   - If not found: user must log in again (session expired / tab was closed)

import Navbar from "./navbar/Navbar";
import { Link, Outlet } from "react-router-dom";
import Footer from "./Footer";
import { useEffect, useState } from "react";
import { useProfileQuery } from "../redux/api/usersApiSlice";
import { useDispatch, useSelector } from "react-redux";
import { removeUserInfo, userInfo, setEncKey } from "../redux/features/userSlice";
import { restoreKeyFromSession } from "../utils/crypto";
import Loader from "./Loader";
import NavLinks from "./navbar/NavLinks";
import SearchBox from "./navbar/SearchBox";
import logo from "../assets/logo.svg";
import { useGetSavedSearchesQuery } from "../redux/api/entriesApiSlice";
import { FaFolder } from "react-icons/fa";

const Layout = () => {
  const { data: profile, isError, isLoading } = useProfileQuery();
  const user = useSelector((s) => s.user.data);
  const { data: savedSearchesData } = useGetSavedSearchesQuery(undefined, { skip: !user });

  const dispatch  = useDispatch();
  const [isReady, setIsReady] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const toggle = () => setIsDrawerOpen((v) => !v);

  useEffect(() => {
    if (isLoading) return;

    if (profile) {
      // Store user profile in Redux
      dispatch(userInfo(profile));

      // Restore the AES key from sessionStorage (set at login / signup).
      // sessionStorage survives page reloads within the same tab but is
      // cleared when the tab or browser is closed — by design.
      const storedKey = restoreKeyFromSession();
      if (storedKey) {
        dispatch(setEncKey(storedKey));
      }
      // If storedKey is null the session expired.
      // encKey stays null → entries show as unreadable ciphertext until
      // the user logs out and back in. This is the correct security behaviour.
    } else if (isError) {
      dispatch(removeUserInfo());
    }

    setIsReady(true);
  }, [profile, dispatch, isError, isLoading]);

  if (!isReady) {
    const getTheme = localStorage.getItem("theme") || "dark";
    return (
      <div
        data-theme={getTheme}
        className="flex justify-center items-center min-h-[calc(100dvh)]"
      >
        <Loader />
      </div>
    );
  }

  return (
    <div className="drawer drawer-mobile">
      <input
        id="my-drawer-3"
        type="checkbox"
        className="drawer-toggle"
        checked={isDrawerOpen}
        onChange={toggle}
      />
      <div className="drawer-content">
        <Navbar toggle={toggle} />
        <Outlet />
        <Footer />
      </div>

      <div className="drawer-side z-20">
        <label
          htmlFor="my-drawer-3"
          aria-label="close sidebar"
          className="drawer-overlay"
        />
        <ul className="menu bg-base-200 min-h-screen w-80 p-4">
          <div className="py-4 pb-5">
            <Link
              className="btn btn-ghost text-2xl p-0"
              to="/"
              onClick={toggle}
            >
              <img className="w-10 h-10" src={logo} alt="logo" />
              DayBook
            </Link>
          </div>

          <SearchBox toggle={toggle} expanded={true} />
          <NavLinks toggle={toggle} />

          {user && savedSearchesData?.data?.length > 0 && (
            <>
              <div className="divider my-2 opacity-50"></div>
              <li className="menu-title flex flex-row items-center gap-1.5 px-3 py-1 text-xs font-bold tracking-wider text-base-content/40 uppercase">
                <FaFolder className="text-[10px]" /> Smart Folders
              </li>
              <div className="flex flex-col gap-1 max-h-[220px] overflow-y-auto mt-1 px-1">
                {savedSearchesData.data.map((folder) => {
                  const params = new URLSearchParams();
                  if (folder.searchText) params.set("search", folder.searchText);
                  if (folder.mood) params.set("mood", folder.mood);
                  if (folder.dateFrom) params.set("dateFrom", folder.dateFrom);
                  if (folder.dateTo) params.set("dateTo", folder.dateTo);
                  if (folder.tags && folder.tags.length > 0) params.set("tags", folder.tags.join(","));
                  params.set("page", "1");
                  
                  return (
                    <li key={folder._id}>
                      <Link
                        to={`/entries?${params.toString()}`}
                        onClick={toggle}
                        className="flex items-center gap-2 py-2 px-3 text-xs rounded-xl hover:bg-base-300 transition-colors"
                      >
                        <span className="text-base-content/40 shrink-0">📁</span>
                        <span className="truncate flex-1 font-medium">{folder.name}</span>
                      </Link>
                    </li>
                  );
                })}
              </div>
            </>
          )}
        </ul>
      </div>
    </div>
  );
};

export default Layout;