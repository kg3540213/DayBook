import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { FaHome, FaBookOpen, FaChartBar, FaInfo, FaCalendarAlt, FaFire } from "react-icons/fa";

const NavLinks = ({ toggle }) => {
  const user = useSelector((state) => state.user.data);
  const isAuthenticated = !!user;

  return (
    <>
      <li onClick={toggle}>
        <Link to="/">
          <FaHome />
          Home
        </Link>
      </li>

      {isAuthenticated && (
        <>
          <li onClick={toggle}>
            <Link to="/feed">
              <FaFire />
              Today Feed
            </Link>
          </li>
          <li onClick={toggle}>
            <Link to="/entries">
              <FaBookOpen />
              Your Entries
            </Link>
          </li>
          <li onClick={toggle}>
            <Link to="/calendar">
              <FaCalendarAlt />
              Calendar
            </Link>
          </li>
          <li onClick={toggle}>
            <Link to="/dashboard">
              <FaChartBar />
              Dashboard
            </Link>
          </li>
        </>
      )}

      <li onClick={toggle}>
        <Link to="/about">
          <FaInfo />
          About
        </Link>
      </li>
    </>
  );
};
export default NavLinks;