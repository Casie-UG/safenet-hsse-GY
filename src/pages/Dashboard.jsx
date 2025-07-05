import React, { useEffect, useState, useMemo } from "react";
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
  } from "recharts";
  

export default function Dashboard() {
  const [incidents, setIncidents] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const stats = useMemo(() => {
    const tally = {};
    incidents.forEach((inc) => {
      if (!inc.industry) return;            // skip empty industry
      tally[inc.industry] = (tally[inc.industry] || 0) + 1;
    });
    // convert to array for Recharts
    return Object.entries(tally).map(([name, reports]) => ({ name, reports }));
  }, [incidents]);

  useEffect(() => {
    const fetchIncidents = async () => {
      try {
        const { data, error } = await supabase
          .from("reports")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(10);

        if (error) {
          setError(error.message);
          setLoading(false);
          return;
        }
        setIncidents(data);
      } catch (err) {
        setError("Unexpected error: " + err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchIncidents();
  }, []);

  if (loading) return <div className="p-6 text-center">Loading incidents...</div>;
  if (error)
    return (
      <div className="p-6 text-center text-red-600">
        Error loading incidents: {error}
      </div>
    );
  if (incidents.length === 0)
    return <div className="p-6 text-center">No incidents found.</div>;

  const incident = incidents[currentIndex];

  const lat = incident.location?.lat ?? 6.8;
  const lng = incident.location?.lng ?? -58.15;

  const nextIncident = () => {
    setCurrentIndex((prev) => (prev + 1) % incidents.length);
  };

  const prevIncident = () => {
    setCurrentIndex((prev) => (prev - 1 + incidents.length) % incidents.length);
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Public Dashboard</h1>

      {/*incident card*/}
        <div className="bg-white shadow-md rounded p-6 mb-6 relative px-16">
        <h2 className="text-2xl font-bold text-blue-700 mb-4">
            {incident.incident_description || 'No description provided'}
        </h2>

        
        {/*navigation arrows*/}
        <button
            onClick={prevIncident}
            className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white border rounded-full p-2 shadow hover:bg-gray-100"
            aria-label="Previous Incident"
        >
            <ChevronLeft className="h-5 w-5" />
        </button>
        <button
            onClick={nextIncident}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white border rounded-full p-2 shadow hover:bg-gray-100"
            aria-label="Next Incident"
        >
            <ChevronRight className="h-5 w-5" />
        </button>

        {/*pull from table fields*/}
        <p><strong>Date:</strong> {incident.date || incident.created_at}</p>
        <p><strong>Severity:</strong> {incident.severity}</p>
        <p><strong>Industry:</strong> {incident.industry}</p>
        <p><strong>Type of Incident:</strong> {incident.incident_type || 'Not specified'}</p>
        <p><strong>Location:</strong> {incident.location_text || 'Not specified'}</p>
        <p><strong>Casualties:</strong> {incident.casualties || 'None reported'}</p>
        </div>


      {/*map container */}
      <div className="h-64 mb-6 rounded overflow-hidden shadow-md">
        <MapContainer
          center={[lat, lng]}
          zoom={13}
          scrollWheelZoom={false}
          style={{ height: "100%", width: "100%" }}
          key={incident.id}
        >
          <TileLayer
            attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker position={[lat, lng]}>
            <Popup>
              {incident.description} <br /> Location on map.
            </Popup>
          </Marker>
        </MapContainer>
      </div>

      {/*stats*/}
        <div className="bg-white shadow-md rounded p-6">
            <h2 className="text-xl font-semibold mb-4">Reports by Industry</h2>

            {stats.length ? (
                <ResponsiveContainer width="100%" height={280}>
                <BarChart data={stats}>
                    <XAxis dataKey="name" stroke="#8884d8" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="reports" fill="#60A5FA" radius={[8, 8, 0, 0]} />
                </BarChart>
                </ResponsiveContainer>
            ) : (
                <p className="text-sm text-gray-500">Not enough data yet.</p>
            )}
        </div>

    </div>
  );
}
