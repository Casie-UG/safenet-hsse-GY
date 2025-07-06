import React, { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { supabase } from "../supabaseClient";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { FaExclamationCircle, FaMapMarkerAlt } from "react-icons/fa";

//colour palette for pie
const COLORS = ["#EF4444", "#F97316", "#FBBF24", "#10B981", "#3B82F6"];

export default function Dashboard() {
  //incident feed (latest 10)
  const [incidents, setIncidents] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  //summary stats pulled from DB
  const [criticalToday, setCriticalToday] = useState(0);
  const [severityStats, setSeverityStats] = useState([]); 
  const [topLocation, setTopLocation] = useState("N/A");

  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch feed
  useEffect(() => {
    (async () => {
      try {
        const { data, error } = await supabase
          .from("reports")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(10);
        if (error) throw error;
        setIncidents(data);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Fetch stats
  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);

    (async () => {
      try {
        /* critical today */
        const { count: crit, error: critErr } = await supabase
          .from("reports")
          .select("id", { count: "exact", head: true })
          .eq("severity", "Critical")
          .eq("date_of_incident", today);
        if (critErr) throw critErr;
        setCriticalToday(crit ?? 0);

        /* severity distribution (all‑time) */
        const { data: sevRows, error: sevErr } = await supabase
          .from("reports")
          .select("severity");
        if (sevErr) throw sevErr;
        const sevCount = {};
        sevRows.forEach(({ severity }) => {
          if (!severity) return;
          const key =
            severity.trim().charAt(0).toUpperCase() +
            severity.trim().slice(1).toLowerCase();
          sevCount[key] = (sevCount[key] || 0) + 1;
        });
        setSeverityStats(
          Object.entries(sevCount).map(([name, value]) => ({ name, value }))
        );

        /* top location today */
        const { data: locRows, error: locErr } = await supabase
          .from("reports")
          .select("location_text")
          .eq("date_of_incident", today);
        if (locErr) throw locErr;
        const locCounter = {};
        locRows.forEach(({ location_text }) => {
          if (!location_text) return;
          locCounter[location_text.trim()] =
            (locCounter[location_text.trim()] || 0) + 1;
        });
        const best = Object.entries(locCounter).sort((a, b) => b[1] - a[1])[0];
        setTopLocation(best?.[0] || "N/A");
      } catch (e) {
        console.error("Stats query error:", e);
      } finally {
        setStatsLoading(false);
      }
    })();
  }, []);

  /* bar‑chart (last 10) */
  const industryStats = useMemo(() => {
    const tally = {};
    incidents.forEach((inc) => {
      if (!inc.industry) return;
      tally[inc.industry] = (tally[inc.industry] || 0) + 1;
    });
    return Object.entries(tally).map(([name, reports]) => ({ name, reports }));
  }, [incidents]);

  /* guards */
  if (loading) return <div className="p-6">Loading incidents…</div>;
  if (error) return <div className="p-6 text-red-600">Error: {error}</div>;
  if (!incidents.length) return <div className="p-6">No incidents found.</div>;

  /* current incident */
  const incident = incidents[currentIndex];
  const lat = incident.location?.lat ?? 6.8;
  const lng = incident.location?.lng ?? -58.15;

  //interface
  return (
    <div className="max-w-8xl mx-auto px-4 sm:px-6 py-4 space-y-4 ">
      <h1 className="text-3xl font-bold text-blue-700">Public Dashboard</h1>

      {/*cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

      {/* card 1 */}
      <div className="bg-pink-50 p-4 rounded-xl shadow relative h-48">
        <p className="absolute top-2 left-4 text-sm text-rose-600 font-semibold">
          Critical Reports Today
        </p>
        <div className="flex items-center justify-center h-full gap-3">
          <div className="p-3 rounded-full bg-rose-100 text-rose-600">
            <FaExclamationCircle size={28} />
          </div>
          <p className="text-2xl font-bold text-rose-700">
            {statsLoading ? "—" : criticalToday}
          </p>
        </div>
      </div>
      
      {/* card 2 */}
      <div className="bg-blue-200 p-4 rounded-xl shadow relative h-48">
        <p className="absolute top-2 left-4 text-sm text-indigo-600 font-semibold">
          Top Risk Area
        </p>
        <div className="flex items-center justify-center h-full gap-3">
          <div className="p-3 rounded-full bg-indigo-100 text-indigo-600">
            <FaMapMarkerAlt size={28} />
          </div>
          <p className="text-lg font-bold text-indigo-700 truncate max-w-[150px]">
            {statsLoading ? "—" : topLocation}
          </p>
        </div>
      </div>

      {/* card 3 – pie chart */}
      <div className="bg-yellow-300 p-4 rounded-xl shadow h-48">
        <p className="text-sm text-gray-600 font-semibold mb-2 text-left">
          Incidents by Severity
        </p>
        {statsLoading ? (
          <div className="h-32 flex items-center justify-center text-gray-400 text-sm">
            Loading…
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={115}>
            <PieChart>
              <Pie
                data={severityStats}
                dataKey="value"
                cx="50%"
                cy="50%"
                outerRadius={50}
                nameKey="name"
              >
                {severityStats.map((_, idx) => (
                  <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend
                verticalAlign="bottom"
                height={5}
                iconType="circle"
                wrapperStyle={{ fontSize: "0.75rem" }}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
      </div>

      {/*incidents  */}
      <div className="bg-white shadow rounded p-4 relative px-16">
        <h2 className="text-xl font-bold text-blue-700 mb-3">
          {incident.incident_description || "No description"}
        </h2>

        <NavButton
          direction="left"
          onClick={() =>
            setCurrentIndex(
              (i) => (i - 1 + incidents.length) % incidents.length
            )
          }
        />
        <NavButton
          direction="right"
          onClick={() => setCurrentIndex((i) => (i + 1) % incidents.length)}
        />

        <InfoRow label="Date" value={incident.date || incident.created_at} />
        <InfoRow label="Severity" value={incident.severity} />
        <InfoRow label="Industry" value={incident.industry} />
        <InfoRow
          label="Type"
          value={incident.incident_type || "Not specified"}
        />
        <InfoRow
          label="Location"
          value={incident.location_text || "Not specified"}
        />
        <InfoRow
          label="Casualties"
          value={incident.casualties || "None reported"}
        />
      </div>

      {/*map*/}
      <div className="h-60 rounded overflow-hidden shadow">
        <MapContainer
          center={[lat, lng]}
          zoom={13}
          scrollWheelZoom={false}
          style={{ height: "100%", width: "100%" }}
          key={incident.id}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <Marker position={[lat, lng]}>
            <Popup>{incident.incident_description}</Popup>
          </Marker>
        </MapContainer>
      </div>

      {/*chart*/}
      <div className="bg-white shadow rounded p-4">
        <h2 className="text-lg font-semibold mb-3">
          Reports by Industry (latest 10)
        </h2>
        {industryStats.length ? (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={industryStats}>
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="reports" fill="#60A5FA" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-sm text-gray-500">Not enough data yet.</p>
        )}
      </div>
    </div>
  );
}

//componeents 

function StatCard({ title, icon, value, bg, truncate = false }) {
  return (
    <div className="bg-white rounded-xl shadow px-4 pt-5 pb-4 relative">
      <p className="absolute top-2 right-3 text-xs font-semibold text-gray-500">
        {title}
      </p>
      <div className="flex items-center justify-center h-20 gap-3">
        <div className={`p-3 rounded-full ${bg}`}>{icon}</div>
        <span
          className={`text-2xl font-bold ${
            truncate ? "max-w-[8rem] truncate" : ""
          }`}
        >
          {value}
        </span>
      </div>
    </div>
  );
}

function NavButton({ direction, onClick }) {
  const Icon = direction === "left" ? ChevronLeft : ChevronRight;
  const posClass =
    direction === "left" ? "left-2 -translate-x-1/2" : "right-2 translate-x-1/2";
  return (
    <button
      onClick={onClick}
      className={`absolute top-1/2 ${posClass} -translate-y-1/2 bg-white border rounded-full p-2 shadow`}
      aria-label={direction === "left" ? "Previous" : "Next"}
    >
      <Icon className="h-5 w-5" />
    </button>
  );
}

function InfoRow({ label, value }) {
  return (
    <p>
      <strong>{label}:</strong> {value}
    </p>
  );
}
