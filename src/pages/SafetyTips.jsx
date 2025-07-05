import { useState } from "react";
import { useNavigate } from "react-router-dom";

const flyers = [
    {
      id: 1,
      title: "Hazard Safety Flyer",
      imgUrl: "/flyers/hazard.png",   
      description: "Important hazard safety protocols you should follow.",
    },
    {
      id: 2,
      title: "PPE Safety Flyer",
      imgUrl: "/flyers/ppe.png",
      description: "PPE",
    },
    {
      id: 3,
      title: "Workplace Stress Management Flyer",
      imgUrl: "/flyers/stressmanag.png",
      description: "General workplace stress management tips.",
    },
  ];
  

export default function SafetyTips() {
  const [selectedFlyer, setSelectedFlyer] = useState(null);
  const navigate = useNavigate();

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      {/* Header */}
      <h1 className="text-4xl font-bold text-center">SAFETY TIPS</h1>
      <hr className="border-gray-300" />

      {/* Carousel */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Flyers Gallery</h2>
        <div className="flex space-x-4 overflow-x-auto no-scrollbar py-2">
          {flyers.map(({ id, imgUrl, title }) => (
            <button
              key={id}
              onClick={() => setSelectedFlyer(flyers.find((f) => f.id === id))}
              className="flex-shrink-0 w-48 h-32 rounded-lg overflow-hidden shadow-lg focus:outline-none border border-transparent hover:border-blue-600 transition"
              aria-label={`View details for ${title}`}
            >
              <img
                src={imgUrl}
                alt={title}
                className="object-cover w-full h-full"
                loading="lazy"
              />
            </button>
          ))}
        </div>

        {/* Modal for flyer details */}
        {selectedFlyer && (
          <div
            onClick={() => setSelectedFlyer(null)}
            className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center p-4 z-50 cursor-pointer"
            role="dialog"
            aria-modal="true"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-lg max-w-lg w-full p-6 relative"
            >
              <button
                onClick={() => setSelectedFlyer(null)}
                className="absolute top-3 right-3 text-gray-600 hover:text-gray-900 text-xl font-bold"
                aria-label="Close flyer details"
              >
                &times;
              </button>
              <img
                src={selectedFlyer.imgUrl}
                alt={selectedFlyer.title}
                className="w-full rounded mb-4"
              />
              <h3 className="text-xl font-semibold mb-2">{selectedFlyer.title}</h3>
              <p>{selectedFlyer.description}</p>
            </div>
          </div>
        )}
      </section>

      <hr className="border-gray-300" />

      {/* General Safety Tips */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">General Safety Tips</h2>
        <ul className="list-disc list-inside space-y-2 text-gray-700">
          <li>Always wear appropriate personal protective equipment (PPE).</li>
          <li>Keep your work area clean and free of hazards.</li>
          <li>Report unsafe conditions immediately.</li>
          <li>Follow proper procedures for handling equipment and materials.</li>
          <li>Participate in regular safety training and drills.</li>
        </ul>
      </section>

      <hr className="border-gray-300" />

      {/* Urgent Advisory Section */}
      <section className="bg-red-100 border border-red-400 rounded p-6 flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div className="flex items-center space-x-3 text-red-700 text-lg font-semibold">
          <span role="img" aria-label="Warning">
            ⚠️
          </span>
          <p className="max-w-xl">
            IF ANY OF THESE PROTOCOLS WERE SEEN VIOLATED, REPORT IMMEDIATELY TO YOUR SUPERVISOR OR USE THE FORM
          </p>
        </div>
        <button
          onClick={() => navigate("/report")}
          className="bg-red-600 hover:bg-red-700 text-white font-semibold px-6 py-3 rounded shadow"
        >
          Report an Incident
        </button>
      </section>
    </div>
  );
}
