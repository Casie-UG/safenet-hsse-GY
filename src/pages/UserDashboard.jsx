import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { Link } from "react-router-dom";

export default function UserDashboard() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [email, setEmail] = useState("");

  useEffect(() => {
    const fetchMyReports = async () => {
      setLoading(true);
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        setError(sessionError.message);
        setLoading(false);
        return;
      }

      const user = session?.user;
      if (!user) {
        setError("No active session. Please log in again.");
        setLoading(false);
        return;
      }

      setEmail(user.email); // show greeting

      // 👉  filter by user_id = UUID
      const { data, error } = await supabase
        .from("reports")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        setError(error.message);
      } else {
        setReports(data);
      }
      setLoading(false);
    };

    fetchMyReports();
  }, []);

  if (loading) return <div className="p-6">Loading your dashboard...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-blue-700 mb-5">Welcome, {email}</h1>

      <Link
        to="/report"
        className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 mb-6"
      >
        Submit New Report
      </Link>

      <h2 className="text-xl font-semibold mb-2">Your Reports</h2>

      {reports.length === 0 ? (
        <p>You haven't submitted any reports yet.</p>
      ) : (
        <ul className="space-y-4">
          {reports.map((r) => (
            <li key={r.id} className="border p-4 rounded bg-white shadow-sm">
              <h3 className="font-bold">{r.incident_description}</h3>
              <p className="text-sm text-gray-700">{r.type_of_accident}</p>
              <p className="text-sm text-gray-500">
                Submitted {new Date(r.created_at).toLocaleString()}
              </p>
              <p className="mt-1">
                <strong>Status:</strong>{" "}
                <span
                  className={
                    r.status === "resolved" ? "text-green-600" : "text-yellow-600"
                  }
                >
                  {r.status || "pending"}
                </span>
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
