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
import { useDispatch } from "react-redux";
import { removeUserInfo, userInfo, setEncKey } from "../redux/features/userSlice";
import { restoreKeyFromSession } from "../utils/crypto";
import Loader from "./Loader";
import NavLinks from "./navbar/NavLinks";
import SearchBox from "./navbar/SearchBox";
import logo from "../assets/logo.svg";

const Layout = () => {
  const { data: profile, isError, isLoading } = useProfileQuery();
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
    <div className="drawer">
      <input
        id="my-drawer-3"
        type="checkbox"
        className="drawer-toggle"
        checked={isDrawerOpen}
        onChange={toggle}
      />
      <div className="drawer-content">
        <Navbar />
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
        </ul>
      </div>
    </div>
  );
};

export default Layout;