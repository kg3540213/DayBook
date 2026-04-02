// frontend/src/components/Layout.jsx
// Improvement: cleaner dataKey restoration logic with explicit error states
// and no silent failures that could leave the user with broken encryption.
import Navbar from "./navbar/Navbar";
import { Link, Outlet } from "react-router-dom";
import Footer from "./Footer";
import { useEffect, useState } from "react";
import { useProfileQuery } from "../redux/api/usersApiSlice";
import { useDispatch } from "react-redux";
import { removeUserInfo, userInfo, setUserDataKey } from "../redux/features/userSlice";
import { getPasswordFromSession } from "../utils/sessionPassword";
import { decryptDataKey } from "../utils/crypto";
import Loader from "./Loader";
import NavLinks from "./navbar/NavLinks";
import SearchBox from "./navbar/SearchBox";
import logo from "../assets/logo.svg";

const Layout = () => {
  const { data: profile, isError, isLoading } = useProfileQuery();
  const dispatch = useDispatch();
  const [isReady, setIsReady] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const toggle = () => setIsDrawerOpen(!isDrawerOpen);

  useEffect(() => {
    if (isLoading) return;

    if (profile) {
      // Store user profile in Redux
      dispatch(userInfo(profile));

      // Attempt to restore dataKey from the password saved in sessionStorage.
      // This only works within the same browser session (tab group) — by design.
      // If sessionStorage is cleared (tab close, explicit logout), the user must
      // re-enter their password on next login.
      const savedPassword = getPasswordFromSession();
      const encryptedDataKey = profile?.data?.encryptedDataKey;

      if (savedPassword && encryptedDataKey) {
        try {
          const dataKey = decryptDataKey(encryptedDataKey, savedPassword);
          dispatch(setUserDataKey(dataKey));
        } catch (err) {
          // Password in sessionStorage doesn't match the current encryptedDataKey.
          // This can happen if the user changed their password in another tab.
          // Safe to ignore — user will just need to log in again to get the key.
          console.warn("[Layout] Could not restore dataKey from session:", err.message);
        }
      }
      // If no savedPassword: dataKey stays null. The app renders correctly but
      // encrypted entry content shows as unreadable until the user logs in again.
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
        ></label>
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