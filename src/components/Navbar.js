import React from 'react';
import { NavLink } from 'react-router-dom';

export default function Navbar() {
  const linkClass = ({ isActive }) =>
    isActive
      ? "text-blue-600 border-b-2 border-blue-600 font-semibold"
      : "text-gray-700 hover:text-blue-600";

  return (
    <nav className="bg-white shadow-md px-6 py-4 flex justify-between items-center sticky top-0 z-50">
      <div className="text-xl font-bold text-blue-700">SafeNet HSSE</div>
      <div className="space-x-6">
        <NavLink to="/" className={linkClass} end>
          Public Dashboard
        </NavLink>
        <NavLink to="/report" className={linkClass}>
          Report an Incident
        </NavLink>
        <NavLink to="/safety" className={linkClass}>
          Safety Tips
        </NavLink>
        <NavLink to="/login" className={linkClass}>
          Log In
        </NavLink>
      </div>
    </nav>
  );
}
