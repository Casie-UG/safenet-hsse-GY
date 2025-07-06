import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import ReportIncident from "./pages/ReportIncident";
import SafetyTips from './pages/SafetyTips';
import Login from './pages/Login';
import UserDashboard from "./pages/UserDashboard";   
import AdminDashboard from "./pages/AdminDashboard";  
import { ProtectedRoute } from "./routes/ProtectedRoute";
import Quiz from './pages/Quiz';



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
            <Route path="/report" element={<ReportIncident />} />
            <Route path="/safety" element={<SafetyTips />} />
            <Route path="/login" element={<Login />} />
            <Route path="/quiz" element={<Quiz />} />
            
            {/* User‑only section */}
              <Route path="pages/quiz" element={<Quiz />} />
            <Route element={<ProtectedRoute allowedRoles={["user"]} />}>
              <Route path="/user" element={<UserDashboard />} />
            </Route>

            {/* Admin‑only section */}
            <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
              <Route path="/admin" element={<AdminDashboard />} />
            </Route>

            {/* 404 fallback */}
            <Route path="*" element={<div className="p-8 text-center">Page not found</div>} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
