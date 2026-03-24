import { Link } from "react-router-dom";
import { FaHome, FaBookOpen, FaChartBar, FaInfo, FaUsers } from "react-icons/fa";

const NavLinks = ({ toggle }) => {
  return (
    <>
      <li onClick={toggle}>
        <Link to="/">
          <FaHome />
          Home
        </Link>
      </li>
      <li onClick={toggle}>
        <Link to="/entries">
          <FaBookOpen />
          Your Entries
        </Link>
      </li>
      <li onClick={toggle}>
        <Link to="/shared-journals">
          <FaUsers />
          Shared Journals
        </Link>
      </li>
      <li onClick={toggle}>
        <Link to="/dashboard">
          <FaChartBar />
          Dashboard
        </Link>
      </li>
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