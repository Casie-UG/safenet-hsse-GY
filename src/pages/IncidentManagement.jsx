import { createClient } from '@supabase/supabase-js';
import React, { useState, useEffect } from 'react';


const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);


const STATUS_OPTIONS = ['Open', 'In-Progress', 'Resolved', 'Forwarded'];
const CATEGORY_OPTIONS = ['Fire', 'Safety', 'Environmental', 'Noise', 'Other'];

export default function IncidentManagement() {
  const [reports, setReports] = useState([]);
  const [statusFilter, setStatusFilter] = useState('Open');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [selectedReport, setSelectedReport] = useState(null);
  const [editData, setEditData] = useState({
    status: '',
    category: '',
    assignee: '',
    response_notes: '',
  });
  const [saving, setSaving] = useState(false);

  // Fetch reports with filters
  useEffect(() => {
    async function fetchReports() {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('reports')
        .select('*')
        .order('submitted_at', { ascending: false });

      if (statusFilter) query = query.eq('status', statusFilter);
      if (categoryFilter) query = query.eq('category', categoryFilter);

      const { data, error } = await query;

      if (error) setError(error.message);
      else setReports(data || []);

      setLoading(false);
    }
    fetchReports();
  }, [statusFilter, categoryFilter]);

  // Open modal and populate edit data
  function openEditModal(report) {
    setSelectedReport(report);
    setEditData({
      status: report.status || '',
      category: report.category || '',
      assignee: report.assignee || '',
      response_notes: report.response_notes || '',
    });
  }

  // Close modal
  function closeModal() {
    setSelectedReport(null);
    setEditData({
      status: '',
      category: '',
      assignee: '',
      response_notes: '',
    });
  }

  // Handle input changes in modal
  function onChange(e) {
    const { name, value } = e.target;
    setEditData((prev) => ({ ...prev, [name]: value }));
  }

  // Save changes via RPC
  async function saveChanges() {
    if (!selectedReport) return;

    setSaving(true);
    const { error } = await supabase.rpc('admin_update_report', {
      p_report_id: selectedReport.id,
      p_status: editData.status,
      p_category: editData.category,
      p_assignee: editData.assignee,
      p_response_notes: editData.response_notes,
    });
    setSaving(false);

    if (error) {
      alert('Failed to update report: ' + error.message);
    } else {
      alert('Report updated successfully!');
      closeModal();
   
      setStatusFilter((prev) => prev); 
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Incident Management Dashboard</h1>

      {/* Filters */}
      <div className="mb-4 flex gap-4">
        <div>
          <label className="block font-semibold mb-1">Filter by Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border rounded p-1"
          >
            <option value="">All</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block font-semibold mb-1">Filter by Category:</label>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="border rounded p-1"
          >
            <option value="">All</option>
            {CATEGORY_OPTIONS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Loading & Error */}
      {loading && <p>Loading reports...</p>}
      {error && <p className="text-red-600">Error: {error}</p>}

      {/* Reports Table */}
      {!loading && reports.length === 0 && <p>No reports found.</p>}

      {!loading && reports.length > 0 && (
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr>
              <th className="border border-gray-300 p-2">ID</th>
              <th className="border border-gray-300 p-2">Submitted At</th>
              <th className="border border-gray-300 p-2">Type</th>
              <th className="border border-gray-300 p-2">Category</th>
              <th className="border border-gray-300 p-2">Status</th>
              <th className="border border-gray-300 p-2">Assignee</th>
              <th className="border border-gray-300 p-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {reports.map((r) => (
              <tr key={r.id} className="hover:bg-gray-100">
                <td className="border border-gray-300 p-2 text-xs">{r.id.slice(0, 8)}</td>
                <td className="border border-gray-300 p-2 text-xs">
                  {new Date(r.submitted_at).toLocaleString()}
                </td>
                <td className="border border-gray-300 p-2">{r.type || 'N/A'}</td>
                <td className="border border-gray-300 p-2">{r.category || 'N/A'}</td>
                <td className="border border-gray-300 p-2">{r.status || 'Open'}</td>
                <td className="border border-gray-300 p-2">{r.assignee || '-'}</td>
                <td className="border border-gray-300 p-2">
                  <button
                    onClick={() => openEditModal(r)}
                    className="bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700"
                  >
                    Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Edit Modal */}
      {selectedReport && (
        <div
          className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50"
          onClick={closeModal}
        >
          <div
            className="bg-white rounded p-6 w-[400px] relative"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold mb-4">Edit Report Details</h2>

            <p className="mb-2 text-sm text-gray-600">
              <strong>Report ID:</strong> {selectedReport.id}
            </p>
            <p className="mb-2 text-sm text-gray-600">
              <strong>Submitted:</strong>{' '}
              {new Date(selectedReport.submitted_at).toLocaleString()}
            </p>
            <p className="mb-2 text-sm text-gray-600">
              <strong>Description:</strong> {selectedReport.description || 'N/A'}
            </p>

            <label className="block font-semibold mt-2 mb-1">Status:</label>
            <select
              name="status"
              value={editData.status}
              onChange={onChange}
              className="border rounded w-full p-1"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>

            <label className="block font-semibold mt-2 mb-1">Category:</label>
            <select
              name="category"
              value={editData.category}
              onChange={onChange}
              className="border rounded w-full p-1"
            >
              <option value="">-- Select Category --</option>
              {CATEGORY_OPTIONS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <label className="block font-semibold mt-2 mb-1">Assignee:</label>
            <input
              type="text"
              name="assignee"
              value={editData.assignee}
              onChange={onChange}
              placeholder="Assignee email or ID"
              className="border rounded w-full p-1"
            />

            <label className="block font-semibold mt-2 mb-1">Response Notes:</label>
            <textarea
              name="response_notes"
              value={editData.response_notes}
              onChange={onChange}
              rows={4}
              className="border rounded w-full p-1"
            ></textarea>

            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={closeModal}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                onClick={saveChanges}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
