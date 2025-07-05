// src/pages/AdminDashboard.jsx
import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

export default function AdminDashboard() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("reports")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) console.error("Fetch error:", error);
    else setReports(data);
    setLoading(false);
  };

  const toggleResolved = async (id, status) => {
    const { error } = await supabase
      .from("reports")
      .update({ status: status === "resolved" ? "unresolved" : "resolved" })
      .eq("id", id);
    if (error) console.error(error);
    else fetchReports();
  };

  const deleteReport = async (id) => {
    if (!window.confirm("Delete this report?")) return;
    const { error } = await supabase.from("reports").delete().eq("id", id);
    if (error) console.error(error);
    else fetchReports();
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Admin Dashboard</h2>

      {loading ? (
        <p>Loading reports…</p>
      ) : reports.length === 0 ? (
        <p>No reports available.</p>
      ) : (
        <div className="overflow-x-auto border rounded">
          <table className="min-w-[1200px] text-sm whitespace-nowrap">
            <thead className="bg-gray-100">
              <tr>
                {/* ► add/remove columns as desired */}
                <th className="p-2 border">Reporter</th>
                <th className="p-2 border">Anonymous</th>
                <th className="p-2 border">Description</th>
                <th className="p-2 border">Date</th>
                <th className="p-2 border">Severity</th>
                <th className="p-2 border">Industry</th>
                <th className="p-2 border">Accident Type</th>
                <th className="p-2 border">Location Text</th>
                <th className="p-2 border">Lat</th>
                <th className="p-2 border">Lng</th>
                <th className="p-2 border">Reg Class</th>
                <th className="p-2 border">Employer</th>
                <th className="p-2 border">Casualties?</th>
                <th className="p-2 border"># Injured</th>
                <th className="p-2 border"># Dead</th>
                <th className="p-2 border">Paramedics Called</th>
                <th className="p-2 border">Paramedics Responded</th>
                <th className="p-2 border">Status</th>
                <th className="p-2 border">Submitted At</th>
                <th className="p-2 border">Actions</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="p-2 border">{r.reporter_name}</td>
                  <td className="p-2 border">{r.is_anonymous ? "Yes" : "No"}</td>
                  <td className="p-2 border max-w-xs truncate">{r.incident_description}</td>
                  <td className="p-2 border">{r.date_of_incident}</td>
                  <td className="p-2 border">{r.severity}</td>
                  <td className="p-2 border">{r.industry}</td>
                  <td className="p-2 border">{r.type_of_accident}</td>
                  <td className="p-2 border">{r.location_text}</td>
                  <td className="p-2 border">{r.latitude}</td>
                  <td className="p-2 border">{r.longitude}</td>
                  <td className="p-2 border">{r.regulation_class}</td>
                  <td className="p-2 border">{r.employer_details}</td>
                  <td className="p-2 border">{r.casualties ? "Yes" : "No"}</td>
                  <td className="p-2 border">{r.num_injured ?? "-"}</td>
                  <td className="p-2 border">{r.num_dead ?? "-"}</td>
                  <td className="p-2 border">{r.paramedics_called ? "Yes" : "No"}</td>
                  <td className="p-2 border">{r.paramedics_responded ? "Yes" : "No"}</td>
                  <td className="p-2 border capitalize">{r.status || "unresolved"}</td>
                  <td className="p-2 border">{new Date(r.created_at).toLocaleString()}</td>
                  <td className="p-2 border space-x-2">
                    <button
                      onClick={() => toggleResolved(r.id, r.status)}
                      className={`px-2 py-1 rounded text-white ${
                        r.status === "resolved" ? "bg-yellow-600" : "bg-green-600"
                      }`}
                    >
                      {r.status === "resolved" ? "Unresolve" : "Resolve"}
                    </button>
                    <button
                      onClick={() => deleteReport(r.id)}
                      className="px-2 py-1 rounded bg-red-600 text-white"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
