// src/pages/AdminDashboard.jsx
import { useEffect, useState, useMemo } from "react";
import {
  FaRegFileAlt,
  FaExclamationTriangle,
  FaCheckCircle,
  FaClock,
  FaFacebookF,
  FaTwitter,
  FaInstagram,
  FaGoogle,
} from "react-icons/fa";
import { supabase } from "../supabaseClient";


export default function AdminDashboard() {
  /* ─────────────────────  state  ───────────────────── */
  const [reports, setReports] = useState([]);
  const [loadingReports, setLoadingReports] = useState(true);
  
  const [socialCounts, setSocialCounts] = useState({
    facebook: 0,
    twitter: 0,
    instagram: 0,
    google_news: 0,
  });
  const [loadingSocial, setLoadingSocial] = useState(true);

  /* ───────────────── stat helpers (reports) ────────── */
  const totalReports = reports.length;

  const criticalThisWeek = useMemo(() => {
    const oneWeekAgo = Date.now() - 7 * 24 * 3600 * 1000;
    return reports.filter(
      (r) =>
        r.severity?.toLowerCase() === "critical" &&
        new Date(r.created_at).getTime() >= oneWeekAgo
    ).length;
  }, [reports]);

  const resolvedCount = reports.filter((r) => r.status === "resolved").length;
  const unresolvedCount = totalReports - resolvedCount;

  const newestAge =
    reports.length > 0
      ? Math.round(
          (Date.now() - new Date(reports[0].created_at).getTime()) /
            3600 /
            1000
        )
      : null; // hours

  /* ───────────────── fetch reports  ─────────────────── */
  useEffect(() => {
    const fetchReports = async () => {
      setLoadingReports(true);
      const { data, error } = await supabase
        .from("reports")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) console.error(error);
      else setReports(data);
      setLoadingReports(false);
    };
    fetchReports();
  }, []);

  /* ───────────────── fetch social‑media counts ───────────── */
  useEffect(() => {
    const fetchSocial = async () => {
      setLoadingSocial(true);

      const { data, error } = await supabase
        .from("social_media_incidents")
        .select("source, count:id", { group: "source" });
       

      if (error) {
        console.error("social fetch error:", error);
        setLoadingSocial(false);
        return;
      }

      // start all at 0
      const counts = { facebook: 0, twitter: 0, instagram: 0, google_news: 0 };

      data.forEach((row) => {
        const src = row.source.trim().toLowerCase();          // normalise
        const hits = Number(row.count) || 0;

        if (src.includes("face"))      counts.facebook     += hits;
        else if (src.includes("twit")) counts.twitter      += hits;
        else if (src.includes("insta")) counts.instagram   += hits;
        else if (src.includes("google")) counts.google_news += hits;
      });

      setSocialCounts(counts);
      setLoadingSocial(false);
    };

    fetchSocial();
  }, []);



  /* ───────────────── table actions  ────────────────── */
  const toggleResolved = async (id, status) => {
    await supabase
      .from("reports")
      .update({ status: status === "resolved" ? "unresolved" : "resolved" })
      .eq("id", id);
    setReports((prev) =>
      prev.map((r) =>
        r.id === id
          ? { ...r, status: r.status === "resolved" ? "unresolved" : "resolved" }
          : r
      )
    );
  };

  const deleteReport = async (id) => {
    if (!window.confirm("Delete this report?")) return;
    await supabase.from("reports").delete().eq("id", id);
    setReports((prev) => prev.filter((r) => r.id !== id));
  };

  /* ───────────────── ui helpers  ───────────────────── */
  const statCard = (bg, Icon, label, value) => (
    <div
      className={`${bg} relative text-white rounded-xl shadow overflow-hidden`}
    >
      {/* decorative poly‑line */}
      <svg
        className="absolute inset-0 w-full h-full opacity-15"
        preserveAspectRatio="none"
      >
        <polyline
          points="0,55 25,35 50,45 75,25 100,40 125,30 150,50"
          fill="none"
          stroke="currentColor"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      <p className="absolute top-3 left-4 text-xs font-semibold tracking-wide">
        {label}
      </p>
      <div className="h-44 flex items-center justify-center gap-4 relative z-10">
        <Icon size={32} className="opacity-90" />
        <span className="text-4xl font-bold">{value ?? "—"}</span>
      </div>
    </div>
  );

  const socialCard = (bg, Icon, platformKey, label) => (
    <div className="rounded-xl shadow overflow-hidden">
      <div className={`${bg} relative h-40 flex items-center justify-center`}>
        <svg
          className="absolute inset-0 w-full h-full opacity-20"
          preserveAspectRatio="none"
        >
          <path
            d="M0 60 Q25 20 50 40 T100 40 T150 60 T200 40"
            stroke="currentColor"
            strokeWidth="6"
            fill="none"
          />
        </svg>
        <Icon size={60} className="text-white relative z-10" />
      </div>
      <div className="bg-white flex flex-col items-center justify-center py-2 h-[68px]">
        <p className="text-xl font-semibold">
          {loadingSocial ? "—" : socialCounts[platformKey] ?? 0}
        </p>
        <p className="text-[11px] text-gray-500 uppercase tracking-wider">
          {label}
        </p>
      </div>
    </div>
  );

  /* ───────────────── render  ───────────────────────── */
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold text-blue-700">Admin Dashboard</h1>

      {/* ── top stats row ─────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCard("bg-indigo-600", FaRegFileAlt, "Total Reports", totalReports)}
        {statCard(
          "bg-red-500",
          FaExclamationTriangle,
          "Critical (7 days)",
          criticalThisWeek
        )}
        {statCard(
          "bg-emerald-500",
          FaCheckCircle,
          "Resolved",
          `${resolvedCount}/${totalReports}`
        )}
        {statCard(
          "bg-yellow-500",
          FaClock,
          "Hours Since Last",
          newestAge ?? "—"
        )}
      </div>

      {/* ── social media row ──────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {socialCard("bg-[#3b5998]", FaFacebookF, "facebook", "Facebook Incidents")}
        {socialCard("bg-[#1DA1F2]", FaTwitter, "twitter", "Twitter Incidents")}
        {socialCard(
          "bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500",
          FaInstagram,
          "instagram",
          "Instagram Incidents"
        )}
        {socialCard("bg-[#4285F4]", FaGoogle, "google_news", "Google News Hits")}
      </div>

      {/* ── reports table ─────────────────────────────── */}
      <div className="bg-white rounded-xl shadow p-4">
        <h2 className="text-xl font-semibold mb-4">All Reports</h2>

        {loadingReports ? (
          <p>Loading reports…</p>
        ) : reports.length === 0 ? (
          <p>No reports available.</p>
        ) : (
          <div className="overflow-x-auto border rounded">
            <table className="min-w-[1200px] text-sm whitespace-nowrap">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-2 border">Reporter</th>
                  <th className="p-2 border">Anon?</th>
                  <th className="p-2 border">Description</th>
                  <th className="p-2 border">Date</th>
                  <th className="p-2 border">Severity</th>
                  <th className="p-2 border">Industry</th>
                  <th className="p-2 border">Type</th>
                  <th className="p-2 border">Location</th>
                  <th className="p-2 border">Reg Class</th>
                  <th className="p-2 border">Casualties</th>
                  <th className="p-2 border">Status</th>
                  <th className="p-2 border">Submitted</th>
                  <th className="p-2 border">Actions</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="p-2 border">{r.reporter_name || "—"}</td>
                    <td className="p-2 border text-center">
                      {r.is_anonymous ? "✔" : "—"}
                    </td>
                    <td className="p-2 border max-w-xs truncate">
                      {r.incident_description}
                    </td>
                    <td className="p-2 border">{r.date_of_incident}</td>
                    <td className="p-2 border">{r.severity}</td>
                    <td className="p-2 border">{r.industry}</td>
                    <td className="p-2 border">{r.type_of_accident}</td>
                    <td className="p-2 border">{r.location_text}</td>
                    <td className="p-2 border">{r.regulation_class}</td>
                    <td className="p-2 border">{r.casualties ? "Yes" : "No"}</td>
                    <td className="p-2 border">{r.status || "unresolved"}</td>
                    <td className="p-2 border">
                      {new Date(r.created_at).toLocaleString()}
                    </td>
                    <td className="p-2 border space-x-2">
                      <button
                        onClick={() => toggleResolved(r.id, r.status)}
                        className={`px-2 py-1 rounded text-white ${
                          r.status === "resolved"
                            ? "bg-yellow-600"
                            : "bg-green-600"
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
    </div>
  );
}
