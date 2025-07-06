import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { supabase } from "../supabaseClient";


import {
  FaBars,
  FaHome,
  FaClipboardList,
  FaShieldAlt,
  FaUser,
  FaUserShield,
  FaSignInAlt,
  FaSignOutAlt, 
  FaChalkboardTeacher,
} from "react-icons/fa";

export default function Navbar({ children }) {
  const [session, setSession] = useState(null);
  const [role, setRole] = useState(null);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session?.user) fetchRole(data.session.user.id);
    });
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_evt, newSession) => {
        setSession(newSession);
        if (newSession?.user) fetchRole(newSession.user.id);
        else setRole(null);
      }
    );
    return () => listener.subscription.unsubscribe();
  }, []);

  const fetchRole = async (uid) => {
    const { data } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", uid)
      .single();
    setRole(data?.role || "user");
  };


  const toggle = () => setCollapsed((c) => !c);
  const iconSize = 18;
  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-2 rounded-md whitespace-nowrap transition-all duration-200 ${
      isActive
        ? "bg-blue-700 text-white"
        : "text-gray-300 hover:bg-gray-600 hover:text-gray-100"
    }`;


  return (
    <div className="flex">
      <nav
        className={`fixed top-0 left-0 h-screen bg-gray-800 text-gray-300
          transition-all duration-300 ease-in-out
          flex flex-col
          ${collapsed ? "w-16" : "w-64"}`}
      >

        <div
          className={`flex items-center border-b border-gray-700 h-14 px-4 ${
            collapsed ? "justify-center" : "justify-between"
          }`}
        >
          {!collapsed && (
            <span className="text-xl font-bold text-blue-400 truncate">
              SafeNet&nbsp;HSSE
            </span>
          )}
          <button
            onClick={toggle}
            aria-label="Toggle sidebar"
            className="text-gray-300 hover:text-white focus:outline-none"
          >
            <FaBars size={iconSize} />
          </button>
        </div>

        <div className="flex flex-col flex-grow mt-4 space-y-1 px-1 overflow-y-auto">
          {!session && (
            <NavLink to="/" end className={linkClass} title="Public Dashboard">
              <FaHome size={iconSize} />
              {!collapsed && <span className="truncate">Public Dashboard</span>}
            </NavLink>
          )}

          {session && (
            <NavLink
              to={role === "admin" ? "/admin" : "/user"}
              className={linkClass}
              title={role === "admin" ? "Admin Panel" : "My Dashboard"}
            >
              {role === "admin" ? (
                <FaUserShield size={iconSize} />
              ) : (
                <FaUser size={iconSize} />
              )}
              {!collapsed && (
                <span className="truncate">
                  {role === "admin" ? "Admin Panel" : "My Dashboard"}
                </span>
              )}
            </NavLink>
          )}

          <NavLink
            to="/admin/incidents"
            className={linkClass}
            title="Incident Management"
          >
            <FaClipboardList size={iconSize} />
            {!collapsed && <span className="truncate">Incident Management</span>}
          </NavLink>

          <NavLink to="/report" className={linkClass} title="Report an Incident">
            <FaClipboardList size={iconSize} />
            {!collapsed && <span className="truncate">Report an Incident</span>}
          </NavLink>

          <NavLink to="/safety" className={linkClass} title="Safety Tips">
            <FaShieldAlt size={iconSize} />
            {!collapsed && <span className="truncate">Safety Tips</span>}
          </NavLink>

          <NavLink to="/quiz" className={linkClass} title="Test Your Knowledge">
            <FaChalkboardTeacher size={iconSize} />
            {!collapsed && <span className="truncate">Test Your Knowledge</span>}
          </NavLink>

          
        {/* ── Auth / Logout ─────────────────────── */}
        <div className="w-full">
          {session ? (
            <button
              onClick={async () => {
                await supabase.auth.signOut();
              }}
              className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-gray-200 hover:bg-gray-700"
            >
              <FaSignOutAlt size={18} />
              {!collapsed && <span>Logout</span>}
            </button>
          ) : (
            <NavLink
              to="/login"
              className={({ isActive }) =>
                `w-full flex items-center gap-3 px-4 py-2 rounded-lg ${
                  isActive ? "bg-gray-700 text-white" : "text-gray-300 hover:bg-gray-700"
                }`
              }
            >
              <FaSignInAlt size={18} />
              {!collapsed && <span>Log In</span>}
            </NavLink>
          )}
        </div>

        </div>
      </nav>

      {/*Main content – scrollable*/}
      <main
        className="flex-grow min-h-screen overflow-y-auto bg-gray-50 p-1 transition-all duration-300 ease-in-out"
        style={{ marginLeft: collapsed ? "4rem" : "16rem" }}
      >
        {children}
      </main>
    </div>
  );

  
}
