import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import ReportIncident from "./pages/ReportIncident";
import SafetyTips from './pages/SafetyTips';



function login() {
  return <div className="p-6">Admin Panel Page (to be implemented)</div>;
}

export default function App() {
  return (
    <Router>
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow bg-gray-50">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/report" element={<ReportIncident />} />
            <Route path="/safety-tips" element={<SafetyTips />} />
            <Route path="/admin" element={<login />} />
            <Route path="/report" element={<ReportIncident />} />
            <Route path="/safety" element={<SafetyTips />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
