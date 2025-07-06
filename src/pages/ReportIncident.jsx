import { useState, useEffect, useRef } from "react";
import { supabase } from "../supabaseClient";
import VoiceRecorder from "../components/VoiceRecorder";          // ⬅ make sure this path is correct
import {
  FaImage,
  FaVideo,
  FaMicrophoneAlt,
  FaCheckCircle,
} from "react-icons/fa";

const BUCKET = "hsse-media";
const NOMINATIM_HEADERS = { "User-Agent": "safenet-hsse-app" };

/* helper ─ upload a File → return publicUrl */
const uploadToSupabase = async (file, folder) => {
  const ext = file.name.split(".").pop();
  const path = `${folder}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw error;
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
};

export default function ReportIncident() {
  /* ───────────────────────  state  ─────────────────────── */
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
  });

  const [selectedMedia, setSelectedMedia] = useState({
    images: [], 
    video: null,
    voice: null
  });

  const [uploading, setUploading] = useState(false);
  const [session, setSession] = useState(null);
  const addressTimer = useRef(null);
  const reverseTimer = useRef(null);

  /* ────────────────  auth: autofill reporter  ───────────── */
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_e, ns) =>
      setSession(ns)
    );
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session && !formData.is_anonymous)
      setFormData((p) => ({ ...p, reporter_name: session.user.email }));
  }, [session, formData.is_anonymous]);

  /* ────────────────  forward geocode  ─────────────────── */
  useEffect(() => {
    if (!formData.location_text) return;
    clearTimeout(addressTimer.current);
    addressTimer.current = setTimeout(async () => {
      try {
        const r = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(
            formData.location_text
          )}`,
          { headers: NOMINATIM_HEADERS }
        );
        const d = await r.json();
        if (d[0])
          setFormData((p) => ({
            ...p,
            latitude: d[0].lat,
            longitude: d[0].lon,
          }));
      } catch (err) {
        console.error("Geocoding failed", err);
      }
    }, 300);
  }, [formData.location_text]);

  /* ────────────────  reverse geocode  ─────────────────── */
  useEffect(() => {
    const { latitude, longitude, location_text } = formData;
    if (!latitude || !longitude || location_text) return;

    clearTimeout(reverseTimer.current);
    reverseTimer.current = setTimeout(async () => {
      try {
        const r = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
          { headers: NOMINATIM_HEADERS }
        );
        const d = await r.json();
        if (d?.display_name)
          setFormData((p) => ({ ...p, location_text: d.display_name }));
      } catch (err) {
        console.error("Reverse geocoding failed", err);
      }
    }, 250);
  }, [formData.latitude, formData.longitude, formData.location_text]);
  

  /* ────────────────  handlers  ───────────────────────── */
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((p) => ({ ...p, [name]: type === "checkbox" ? checked : value }));
  };

  const handleImageSelect = (e) =>
    setSelectedMedia((p) => ({ ...p, images: Array.from(e.target.files) }));

  const handleVideoSelect = (e) =>
    setSelectedMedia((p) => ({ ...p, video: e.target.files[0] || null }));

  const handleVoiceFileSelect = (e) =>
    setSelectedMedia((p) => ({ ...p, voice: e.target.files[0] || null }));

  const handleVoiceReady = (file) =>
    setSelectedMedia((p) => ({ ...p, voice: file }));

  /* ────────────────  GPS  ─────────────────────────────── */
  const useBrowserLocation = () => {
    if (!navigator.geolocation) return alert("Geolocation not supported.");
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        setFormData((p) => ({
          ...p,
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          location_text: "",
        })),
      () => alert("Unable to fetch location.")
    );
  };

  
  /* ────────────────  submit  ──────────────────────────── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);

    try {
      const user =
        session?.user || (await supabase.auth.getSession()).data.session?.user;

      /* 1) upload any media that was selected */
      const mediaUrls = [];

      for (const img of selectedMedia.images)
        mediaUrls.push(await uploadToSupabase(img, "images"));

      if (selectedMedia.video)
        mediaUrls.push(await uploadToSupabase(selectedMedia.video, "videos"));

      if (selectedMedia.voice)
        mediaUrls.push(await uploadToSupabase(selectedMedia.voice, "voices"));

      /* 2) prepare payload */
      const payload = {
        ...formData,
        user_id: user ? user.id : null,
        reporter_name:
          formData.is_anonymous || !user ? formData.reporter_name : user.email,
        media_urls: mediaUrls,
      };

      ["latitude", "longitude", "num_injured", "num_dead"].forEach((k) => {
        payload[k] =
          payload[k] === "" || payload[k] == null ? null : Number(payload[k]);
      });

      /* 3) insert */
      const { error } = await supabase.from("reports").insert([payload]);
      if (error) throw error;

      alert("Report submitted successfully!");
      /* reset */
      setFormData((p) => ({
        ...p,
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
      }));
      setSelectedMedia({ images: [], video: null, voice: null });
    } catch (err) {
      console.error(err);
      alert("Error: " + err.message);
    } finally {
      setUploading(false);
    }
  };
  
  /* ────────────────  UI  ─────────────────────────────── */
  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-xl shadow border">
      <h2 className="text-3xl font-bold text-blue-700 mb-6">
        Report an Incident
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* reporter */}
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

        {/* description + date */}
        <textarea
          name="incident_description"
          value={formData.incident_description}
          onChange={handleChange}
          placeholder="Describe the incident…"
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

        {/* location */}
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


      {/* ─── MEDIA PICKERS ─── */}
      <div className="space-y-4">
          {/* images */}
          <label className="block font-medium">
            <FaImage className="inline mr-2" /> Images (max 4)
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageSelect}
              className="mt-1 input"
            />
          </label>

          {/* video */}
          <label className="block font-medium">
            <FaVideo className="inline mr-2" /> Video
            <input
              type="file"
              accept="video/*"
              onChange={handleVideoSelect}
              className="mt-1 input"
            />
          </label>

          {/* voice file */}
          <label className="block font-medium">
            <FaMicrophoneAlt className="inline mr-2" /> Voice note (file)
            <input
              type="file"
              accept="audio/*"
              onChange={handleVoiceFileSelect}
              className="mt-1 input"
            />
          </label>

          {/* in‑browser recorder */}
          <VoiceRecorder onRecordingComplete={handleVoiceReady} />

          {/* previews */}
          {selectedMedia.images.length > 0 && (
            <p className="text-sm text-gray-600 flex items-center gap-1">
              <FaCheckCircle className="text-green-500" />{" "}
              {selectedMedia.images.length} image(s) selected
            </p>
          )}
          {selectedMedia.video && (
            <p className="text-sm text-gray-600 flex items-center gap-1">
              <FaCheckCircle className="text-green-500" /> 1 video selected
            </p>
          )}
          {selectedMedia.voice && (
            <p className="text-sm text-gray-600 flex items-center gap-1">
              <FaCheckCircle className="text-green-500" /> voice note ready
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={uploading}
          className="w-full bg-blue-700 text-white py-3 rounded-md hover:bg-blue-800 disabled:opacity-60"
        >
          {uploading ? "Submitting…" : "Submit Report"}
        </button>
      </form>
    </div>
  );
}
