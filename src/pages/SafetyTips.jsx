// src/pages/SafetyTips.jsx
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

/* ––––– Flyer data ––––– */
const flyers = [
  {
    id: 1,
    title: "Hazard Safety Flyer",
    imgUrl: "/flyers/hazard.png",
    description: "Key hazard safety protocols everyone should follow.",
  },
  {
    id: 2,
    title: "PPE Safety Flyer",
    imgUrl: "/flyers/ppe.png",
    description: "The right PPE for the right job — always gear up.",
  },
  {
    id: 3,
    title: "Stress Management Flyer",
    imgUrl: "/flyers/stressmanag.png",
    description: "Tips to manage workplace stress effectively.",
  },
];

export default function SafetyTips() {
  const [idx, setIdx]  = useState(0);
  const navigate       = useNavigate();
  const flyer          = flyers[idx];

  const next  = () => setIdx((i) => (i + 1) % flyers.length);
  const prev  = () => setIdx((i) => (i - 1 + flyers.length) % flyers.length);

  return (
    <div className="min-h-screen flex flex-col justify-between">
      {/* HEADER */}
      <header className="py-3 text-center">
        <h1 className="text-4xl font-bold text-red-600 tracking-wide">
          SAFETY TIPS
        </h1>
      </header>

      {/* SLIDE SHOW */}
      <section className="flex-grow max-w-4xl mx-auto w-full px-4">
        <div className="relative bg-white rounded-xl shadow-xl h-[360px] flex items-center justify-center">
          {/* slide image */}
          <img
            src={flyer.imgUrl}
            alt={flyer.title}
            className="object-contain h-full max-h-full rounded-xl"
          />

          {/* navigation arrows */}
          <button
            onClick={prev}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/80 backdrop-blur-md rounded-full shadow hover:bg-white"
          >
            <ChevronLeft size={28} />
          </button>
          <button
            onClick={next}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/80 backdrop-blur-md rounded-full shadow hover:bg-white"
          >
            <ChevronRight size={28} />
          </button>
        </div>

        {/* caption */}
        <div className="mt-6 text-center space-y-1">
          <h2 className="text-2xl font-semibold text-gray-800">{flyer.title}</h2>
          <p className="text-gray-600">{flyer.description}</p>
        </div>
      </section>

      {/* Urgent Advisory Section */}
      <section className="bg-red-100 border border-red-400 rounded-lg p-6 mt-5 max-w-4xl mx-auto text-center space-y-4">
      <span role="img" aria-label="Warning" className="text-5xl">⚠️</span>
        <div className="flex justify-center items-center gap-3 text-red-700 text-lg font-semibold">
          <p className="max-w-2xl">
            If any of these protocols are violated, report immediately to your supervisor
            or use the online incident form below.
          </p>
        </div>
        <button
          onClick={() => navigate("/report")}
          className="bg-red-600 hover:bg-red-700 text-white font-semibold px-6 py-3 rounded shadow-md"
        >
          Report an Incident
        </button>
      </section>



      {/* FOOTER */}
      <footer className="mt-0 py-6 text-center text-sm text-gray-600 bg-gray-50">
        <p className="mb-1">Safenet HSSE Reporting Platform v1.0</p>
        <p>
          For support, email&nbsp;
          <a href="mailto:developer@example.com" className="text-blue-600 hover:underline">
            developer@example.com
          </a>
        </p>
        <p className="mt-2">© {new Date().getFullYear()} Safenet. All rights reserved.</p>
      </footer>
    </div>
  );
}
