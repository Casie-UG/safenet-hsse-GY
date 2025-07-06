import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import Select from "react-select";
import VoiceRecorder from "../components/VoiceRecorder"; 

const accidentTypesOptions = [
  { value: "fall", label: "Fall" },
  { value: "fire", label: "Fire" },
  { value: "electrical", label: "Electrical" },
  { value: "chemical", label: "Chemical Exposure" },
 
];

const violationTagsOptions = [
  { value: "osha", label: "OSHA" },
  { value: "environmental", label: "Environmental" },
  { value: "fire_code", label: "Fire Code" },
  { value: "safety_protocol", label: "Safety Protocol" },

];

const initialFormData = {
  report_type: "",
  type_of_accident: "",
  severity: "",
  casualties: false,
  num_injured: "",
  num_dead: "",
  cause_of_death: "",
  paramedics_called: false,
  violation_tags: [],
  date_of_incident: "",
  description: "",
  // media
  images: [],
  videos: [],
  voice: null,
};

export default function ReportIncident() {
  const [formData, setFormData] = useState(initialFormData);
  const [uploading, setUploading] = useState(false);

  //load draft from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("reportDraft");
    if (saved) setFormData(JSON.parse(saved));
  }, []);

  //handle form field change (basic inputs)
  function handleChange(e) {
    const { name, type, value, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  //handle multi-select violation tags change (react-select)
  function handleViolationTagsChange(selected) {
    setFormData((prev) => ({
      ...prev,
      violation_tags: selected || [],
    }));
  }

  //handle accident type select change
  function handleAccidentTypeChange(selected) {
    setFormData((prev) => ({
      ...prev,
      type_of_accident: selected ? selected.value : "",
    }));
  }

  //handle images selection (max 4)
  function handleImagesChange(e) {
    const files = Array.from(e.target.files).slice(0, 4);
    setFormData((prev) => ({ ...prev, images: files }));
  }

  //handle videos selection (max 2)
  function handleVideosChange(e) {
    const files = Array.from(e.target.files).slice(0, 2);
    setFormData((prev) => ({ ...prev, videos: files }));
  }

  //handle voice note file selection
  function handleVoiceFileSelect(e) {
    const file = e.target.files[0];
    if (file) setFormData((prev) => ({ ...prev, voice: file }));
  }

  //receive recorded voice from VoiceRecorder component
  function handleVoiceReady(file) {
    setFormData((prev) => ({ ...prev, voice: file }));
  }

  //save draft to localStorage
  function saveDraft() {
    localStorage.setItem("reportDraft", JSON.stringify(formData));
    Swal.fire("Draft saved", "", "success");
  }

  //clear draft and reset form
  function clearDraft() {
    localStorage.removeItem("reportDraft");
    setFormData(initialFormData);
    Swal.fire("Draft cleared", "", "info");
  }

  //submit handler
  async function handleSubmit(e) {
    e.preventDefault();

    const result = await Swal.fire({
      title: "Submit Report?",
      text: "Are you sure you want to submit this report?",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes, submit",
      cancelButtonText: "Cancel",
    });

    if (!result.isConfirmed) return;

    setUploading(true);

    try {
      //prepare data for backend
      const submission = {
        ...formData,
        violation_tags: formData.violation_tags.map((tag) => tag.value),
        submitted_at: new Date().toISOString(),
      };

      console.log("Submit to backend:", submission);

      setUploading(false);
      Swal.fire("Report submitted!", "", "success");
      clearDraft();
    } catch (error) {
      setUploading(false);
      Swal.fire("Error submitting report", error.message || "", "error");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl mx-auto p-4 space-y-6">
      <h2 className="text-xl font-bold mb-4">Report Incident / Violation</h2>

      {/* Report Type */}
      <label className="block">
        Report Type:
        <select
          name="report_type"
          value={formData.report_type}
          onChange={handleChange}
          className="input"
          required
        >
          <option value="">Select Report Type</option>
          <option value="incident">Incident</option>
          <option value="violation">Violation</option>
        </select>
      </label>

      {/* Conditionally show Incident fields */}
      {formData.report_type === "incident" && (
        <>
          <label className="block">
            Type of Accident:
            <Select
              options={accidentTypesOptions}
              value={accidentTypesOptions.find(
                (opt) => opt.value === formData.type_of_accident
              )}
              onChange={handleAccidentTypeChange}
              isClearable
              placeholder="Select Type of Accident"
            />
          </label>

          <label className="block">
            Severity:
            <select
              name="severity"
              value={formData.severity}
              onChange={handleChange}
              className="input"
              required={formData.report_type === "incident"}
            >
              <option value="">Select Severity</option>
              <option value="minor">Minor</option>
              <option value="major">Major</option>
              <option value="critical">Critical</option>
            </select>
          </label>

          <label className="inline-flex items-center space-x-2">
            <input
              type="checkbox"
              name="casualties"
              checked={formData.casualties}
              onChange={handleChange}
            />
            <span>Casualties Involved</span>
          </label>

          {/* Paramdics called checkbox */}
          <label className="inline-flex items-center space-x-2">
            <input
              type="checkbox"
              name="paramedics_called"
              checked={formData.paramedics_called}
              onChange={handleChange}
            />
            <span>Paramedics Called</span>
          </label>

          {/* Casualties details */}
          {formData.casualties && (
            <div className="space-y-2">
              <label>
                Number Injured:
                <input
                  type="number"
                  name="num_injured"
                  min="0"
                  value={formData.num_injured}
                  onChange={handleChange}
                  className="input"
                  required={formData.casualties}
                />
              </label>
              <label>
                Number Dead:
                <input
                  type="number"
                  name="num_dead"
                  min="0"
                  value={formData.num_dead}
                  onChange={handleChange}
                  className="input"
                  required={formData.casualties}
                />
              </label>
              {Number(formData.num_dead) > 0 && (
                <label>
                  Cause of Death:
                  <input
                    type="text"
                    name="cause_of_death"
                    value={formData.cause_of_death}
                    onChange={handleChange}
                    className="input"
                    required={Number(formData.num_dead) > 0}
                  />
                </label>
              )}
            </div>
          )}
        </>
      )}

      {/* Violation fields */}
      {formData.report_type === "violation" && (
        <label className="block">
          Violation Tags:
          <Select
            isMulti
            options={violationTagsOptions}
            value={formData.violation_tags}
            onChange={handleViolationTagsChange}
            placeholder="Select Violation Tags"
          />
        </label>
      )}

      {/* Date of Incident */}
      <label className="block">
        Date of Incident:
        <input
          type="date"
          name="date_of_incident"
          value={formData.date_of_incident}
          onChange={handleChange}
          className="input"
          required
        />
      </label>

      {/* Description */}
      <label className="block">
        Description:
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          className="input h-24"
          required
        />
      </label>

      {/* Media Uploads */}
      <div>
        <label className="block mb-1 font-semibold">Upload Images (max 4):</label>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleImagesChange}
          className="input"
        />
        {formData.images.length > 0 && (
          <div className="grid grid-cols-4 gap-2 mt-2">
            {formData.images.map((img, i) => (
              <img
                key={i}
                src={URL.createObjectURL(img)}
                alt={`Selected ${i + 1}`}
                className="h-24 w-full object-cover rounded"
              />
            ))}
          </div>
        )}
      </div>

      <div>
        <label className="block mb-1 font-semibold">Upload Videos (max 2):</label>
        <input
          type="file"
          accept="video/*"
          multiple
          onChange={handleVideosChange}
          className="input"
        />
        {formData.videos.length > 0 && (
          <div className="grid grid-cols-2 gap-2 mt-2">
            {formData.videos.map((vid, i) => (
              <video
                key={i}
                src={URL.createObjectURL(vid)}
                controls
                className="h-32 w-full rounded"
              />
            ))}
          </div>
        )}
      </div>

      <div>
        <label className="block mb-1 font-semibold">
          Voice Note (Upload or Record):
        </label>
        <input
          type="file"
          accept="audio/*"
          onChange={handleVoiceFileSelect}
          className="input mb-2"
        />

        <VoiceRecorder onRecordingComplete={handleVoiceReady} />

        {formData.voice && (
          <div className="mt-2 flex items-center space-x-2">
            <audio controls src={URL.createObjectURL(formData.voice)} />
            <button
              type="button"
              onClick={() => setFormData((prev) => ({ ...prev, voice: null }))}
              className="text-red-500 hover:text-red-700"
              title="Remove voice note"
            >
              Remove
            </button>
          </div>
        )}
      </div>

      {/* Draft and Submit Buttons */}
      <div className="flex space-x-4">
        <button
          type="button"
          onClick={saveDraft}
          className="btn btn-secondary flex-1"
          disabled={uploading}
        >
          Save Draft
        </button>
        <button
          type="button"
          onClick={clearDraft}
          className="btn btn-warning flex-1"
          disabled={uploading}
        >
          Clear Draft
        </button>
        <button
          type="submit"
          className="btn btn-primary flex-1"
          disabled={uploading}
        >
          {uploading ? "Submitting..." : "Submit Report"}
        </button>
      </div>
    </form>
  );
}
