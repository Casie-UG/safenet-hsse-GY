import { useState, useEffect, useRef } from "react";
import { supabase } from "../supabaseClient";

const BUCKET = "hsse-media";
const NOMINATIM_HEADERS = { "User-Agent": "safenet-hsse-app" };

export default function ReportIncident() {
  const [formData, setFormData] = useState({
    reporter_name: "",
    is_anonymous: false,
    incident_description: "",
    date_of_incident: "",
    latitude: "",
    longitude: "",
    location_text: "",
    severity: "",
    industry: "",
    regulation_class: "",
    employer_details: "",
    type_of_accident: "",
    casualties: false,
    num_injured: "",
    num_dead: "",
    paramedics_called: false,
    paramedics_responded: false,
    media_urls: [],
  });
  const [uploading, setUploading] = useState(false);
  const [session, setSession] = useState(null);

  /* auth listener + autofill reporter*/
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_e, ns) =>
      setSession(ns)
    );
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session && !formData.is_anonymous) {
      setFormData((p) => ({ ...p, reporter_name: session.user.email }));
    }
  }, [session, formData.is_anonymous]);


  /* forward geocode (address ➜ lat/lng)*/
  const addressTimer = useRef(null);
  useEffect(() => {
    if (!formData.location_text) return;
    clearTimeout(addressTimer.current);
    addressTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(
            formData.location_text
          )}`,
          { headers: NOMINATIM_HEADERS }
        );
        const data = await res.json();
        if (data[0]) {
          setFormData((p) => ({
            ...p,
            latitude: data[0].lat,
            longitude: data[0].lon,
          }));
        }
      } catch (err) {
        console.error("Forward geocoding failed:", err);
      }
    }, 300);
  }, [formData.location_text]);

  /*reverse geocode (lat/lng ➜ address)*/
  const reverseTimer = useRef(null);
  useEffect(() => {
    const { latitude, longitude, location_text } = formData;
    if (!latitude || !longitude || location_text) return;

    clearTimeout(reverseTimer.current);
    reverseTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
          { headers: NOMINATIM_HEADERS }
        );
        const data = await res.json();
        if (data?.display_name) {
          setFormData((p) => ({ ...p, location_text: data.display_name }));
        }
      } catch (err) {
        console.error("Reverse geocoding failed:", err);
      }
    }, 250);
  }, [formData.latitude, formData.longitude, formData.location_text]);


  /*GPS pick‑up*/

  const useBrowserLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation not supported.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        setFormData((p) => ({
          ...p,
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          location_text: "", // trigger reverse geocode
        })),
      () => alert("Unable to fetch location.")
    );
  };

  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((p) => ({ ...p, [name]: type === "checkbox" ? checked : value }));
  };

  /*uploads*/
  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    setUploading(true);
    const urls = [];

    for (const f of files) {
      const path = `${crypto.randomUUID()}.${f.name.split(".").pop()}`;
      const { error } = await supabase.storage.from(BUCKET).upload(path, f);
      if (error) {
        console.error("Upload failed:", error);
        alert(`Upload failed: ${f.name}`);
        continue;
      }
      const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
      urls.push(data.publicUrl);
    }
    setFormData((p) => ({ ...p, media_urls: [...p.media_urls, ...urls] }));
    setUploading(false);
  };

  /*submit*/
  const handleSubmit = async (e) => {
    e.preventDefault();
    const user =
      session?.user || (await supabase.auth.getSession()).data.session?.user;

    const payload = {
      ...formData,
      user_id: user ? user.id : null,
      reporter_name:
        formData.is_anonymous || !user ? formData.reporter_name : user.email,
    };

    ["latitude", "longitude", "num_injured", "num_dead"].forEach((k) => {
      payload[k] =
        payload[k] === "" || payload[k] == null ? null : Number(payload[k]);
    });

    const { error } = await supabase.from("reports").insert([payload]);
    if (error) {
      console.error("Insert error:", error);
      alert("Error submitting report: " + error.message);
    } else {
      alert("Report submitted successfully!");
      setFormData((p) => ({
        ...p,
        reporter_name: "",
        incident_description: "",
        date_of_incident: "",
        latitude: "",
        longitude: "",
        location_text: "",
        severity: "",
        industry: "",
        regulation_class: "",
        employer_details: "",
        type_of_accident: "",
        casualties: false,
        num_injured: "",
        num_dead: "",
        paramedics_called: false,
        paramedics_responded: false,
        media_urls: [],
      }));
    }
  };

  
  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-xl shadow border">
      <h2 className="text-3xl font-bold mb-6">Report an Incident</h2>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/*reporter*/}
        <div className="grid md:grid-cols-2 gap-4">
          <input
            name="reporter_name"
            value={formData.reporter_name}
            onChange={handleChange}
            placeholder="Reporter Name"
            className="input disabled:bg-gray-100"
            disabled={!formData.is_anonymous && session}
          />
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              name="is_anonymous"
              checked={formData.is_anonymous}
              onChange={handleChange}
            />
            <span>Report anonymously</span>
          </label>
        </div>

        {/* incident description */}
        <textarea
          name="incident_description"
          value={formData.incident_description}
          onChange={handleChange}
          placeholder="Describe the incident..."
          className="input"
          rows={4}
          required
        />

        <input
          type="date"
          name="date_of_incident"
          value={formData.date_of_incident}
          onChange={handleChange}
          className="input"
          required
        />

        {/*dropdown lists*/}
        <div className="grid md:grid-cols-2 gap-4">
          <select
            name="type_of_accident"
            value={formData.type_of_accident}
            onChange={handleChange}
            className="input"
          >
            <option value="">Type of Accident</option>
            <option>Fall</option>
            <option>Equipment Failure</option>
            <option>Fire/Explosion</option>
            <option>Chemical Exposure</option>
            <option>Other</option>
          </select>

          <select
            name="severity"
            value={formData.severity}
            onChange={handleChange}
            className="input"
          >
            <option value="">Severity</option>
            <option>Low</option>
            <option>Moderate</option>
            <option>High</option>
            <option>Critical</option>
          </select>

          <select
            name="industry"
            value={formData.industry}
            onChange={handleChange}
            className="input"
          >
            <option value="">Industry</option>
            <option>Construction</option>
            <option>Mining</option>
            <option>Manufacturing</option>
            <option>Oil & Gas</option>
            <option>Utilities</option>
            <option>Other</option>
          </select>

          <select
            name="regulation_class"
            value={formData.regulation_class}
            onChange={handleChange}
            className="input"
          >
            <option value="">Regulation Class Broken </option>
            <option>OSHA</option>
            <option>Fire Safety</option>
            <option>Environmental</option>
            <option>Other</option>
          </select>
        </div>

        {/*employer*/}
        <input
          name="employer_details"
          value={formData.employer_details}
          onChange={handleChange}
          placeholder="Employer Details"
          className="input"
        />

        {/*location */}
        <input
          name="location_text"
          value={formData.location_text}
          onChange={handleChange}
          placeholder="Incident Address / Landmark"
          className="input"
        />

        <button
          type="button"
          onClick={useBrowserLocation}
          className="bg-green-600 text-white px-3 py-2 rounded hover:bg-green-700"
        >
          Use My Current Location
        </button>

        <div className="grid grid-cols-2 gap-4">
          <input
            value={formData.latitude}
            readOnly
            placeholder="Latitude"
            className="input bg-gray-100"
          />
          <input
            value={formData.longitude}
            readOnly
            placeholder="Longitude"
            className="input bg-gray-100"
          />
        </div>

        {/* Uploads */}
        <div className="space-y-1">
          <label className="block font-medium">Attach Photos / Videos</label>
          <input
            type="file"
            accept="image/*,video/*"
            multiple
            onChange={handleFileChange}
            className="input"
          />
          {uploading && <p className="text-blue-600 text-sm">Uploading…</p>}

          {formData.media_urls.length > 0 && (
            <ul className="list-disc list-inside text-green-700 text-sm space-y-1">
              {formData.media_urls.map((url) => (
                <li key={url}>{url.split("/").pop()}</li>
              ))}
            </ul>
          )}
        </div>


        {/*casualties*/}
        <label className="flex items-center font-semibold space-x-2">
          <input type="checkbox" name="casualties" checked={formData.casualties} onChange={handleChange} />
          <span>Casualties involved?</span>
        </label>

        {formData.casualties && (
          <div className="border-l-4 border-red-300 pl-4 space-y-3">
            <input
              name="num_injured"
              type="number"
              min="0"
              value={formData.num_injured}
              onChange={handleChange}
              placeholder="Number Injured"
              className="input"
            />
            <input
              name="num_dead"
              type="number"
              min="0"
              value={formData.num_dead}
              onChange={handleChange}
              placeholder="Number Dead"
              className="input"
            />
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                name="paramedics_called"
                checked={formData.paramedics_called}
                onChange={handleChange}
              />
              <span>Paramedics Called</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                name="paramedics_responded"
                checked={formData.paramedics_responded}
                onChange={handleChange}
              />
              <span>Paramedics Responded</span>
            </label>
          </div>
        )}


        <button
          type="submit"
          className="w-full bg-blue-700 text-white py-3 rounded-md hover:bg-blue-800"
        >
          Submit Report
        </button>
      </form>
    </div>
  );
}
