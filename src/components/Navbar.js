import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { supabase } from "../supabaseClient";
import LogoutButton from "./LogoutButton";

export default function Navbar() {
  const [session, setSession] = useState(null);
  const [role, setRole] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session?.user) fetchRole(data.session.user.id);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (newSession?.user) fetchRole(newSession.user.id);
      else setRole(null);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const fetchRole = async (uid) => {
    const { data } = await supabase.from("profiles").select("role").eq("id", uid).single();
    setRole(data?.role || "user");
  };

  const linkClass = ({ isActive }) =>
    isActive
      ? "text-blue-600 border-b-2 border-blue-600 font-semibold"
      : "text-gray-700 hover:text-blue-600";

  return (
    <nav className="bg-white shadow-md px-6 py-4 flex justify-between items-center sticky top-0 z-50">
      <div className="text-xl font-bold text-blue-700">SafeNet HSSE</div>

      <div className="space-x-6">
        {/* Only show Public Dashboard if not logged in */}
        {!session && (
          <NavLink to="/" className={linkClass} end>
            Public Dashboard
          </NavLink>
        )}

        {/* Always available links */}
        <NavLink to="/report" className={linkClass}>
          Report an Incident
        </NavLink>
        <NavLink to="/safety" className={linkClass}>
          Safety Tips
        </NavLink>

        {/* Dashboard link for logged-in users */}
        {session && (
          <NavLink
            to={role === "admin" ? "/admin" : "/user"}
            className={linkClass}
          >
            {role === "admin" ? "Admin Panel" : "My Dashboard"}
          </NavLink>
        )}

        {/* Auth buttons */}
        {session ? (
          <LogoutButton />
        ) : (
          <NavLink to="/login" className={linkClass}>
            Log In
          </NavLink>
        )}
      </div>
    </nav>
  );
}
