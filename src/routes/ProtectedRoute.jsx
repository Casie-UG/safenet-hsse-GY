
import { Navigate, Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

export function ProtectedRoute({ allowedRoles }) {
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRole = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) {
        setLoading(false);
        return;
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();
      setUserRole(profile?.role);
      setLoading(false);
    };
    fetchRole();
  }, []);

  if (loading) return <div className="p-6 text-center">Loading...</div>;
  if (!userRole || !allowedRoles.includes(userRole)) return <Navigate to="/login" />;

  return <Outlet />;
}