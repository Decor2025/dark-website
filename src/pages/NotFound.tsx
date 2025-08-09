import React from "react";
import { Link } from "react-router-dom";

const links = [
  {
    name: "Home",
    to: "/",
    icon: (
      <svg
        className="w-6 h-6 mr-2 text-blue-500"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        viewBox="0 0 24 24"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    name: "Catalogue",
    to: "/catalogue",
    icon: (
      <svg
        className="w-6 h-6 mr-2 text-blue-500"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        viewBox="0 0 24 24"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M4 6h16M4 12h16m-7 6h7" />
      </svg>
    ),
  },
  {
    name: "About",
    to: "/about",
    icon: (
      <svg
        className="w-6 h-6 mr-2 text-blue-500"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        viewBox="0 0 24 24"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="16" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12.01" y2="8" />
      </svg>
    ),
  },
  {
    name: "Contact",
    to: "/contact",
    icon: (
      <svg
        className="w-6 h-6 mr-2 text-blue-500"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        viewBox="0 0 24 24"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
        <polyline points="22,6 12,13 2,6" />
      </svg>
    ),
  },
];

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 to-black px-6 py-12 relative overflow-hidden">
      {/* Stars background */}
      <div className="absolute inset-0">
        {[...Array(100)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white animate-pulse"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              width: `${Math.random() * 3}px`,
              height: `${Math.random() * 3}px`,
              opacity: Math.random() * 0.8 + 0.2,
              animationDuration: `${Math.random() * 5 + 2}s`,
            }}
          />
        ))}
      </div>
      
      {/* Floating astronaut */}
      <div className="relative mb-8 animate-float">
        <svg
          viewBox="0 0 200 200"
          className="w-48 h-48 md:w-64 md:h-64"
        >
          {/* Background circle */}
          <circle cx="100" cy="100" r="95" fill="#1e293b" stroke="#334155" strokeWidth="2" />
          
          {/* Helmet */}
          <circle cx="100" cy="85" r="35" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="2" />
          
          {/* Visor */}
          <ellipse cx="100" cy="85" rx="20" ry="15" fill="#0ea5e9" opacity="0.3" />
          
          {/* Body */}
          <rect x="75" y="115" width="50" height="50" rx="10" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="2" />
          
          {/* Backpack */}
          <circle cx="100" cy="125" r="15" fill="#334155" />
          
          {/* Stars */}
          <circle cx="60" cy="60" r="2" fill="#ffffff" />
          <circle cx="140" cy="50" r="1.5" fill="#ffffff" />
          <circle cx="80" cy="140" r="1" fill="#ffffff" />
          <circle cx="120" cy="150" r="2" fill="#ffffff" />
          <circle cx="40" cy="100" r="1" fill="#ffffff" />
        </svg>
      </div>
      
      {/* Content */}
      <div className="relative z-10 text-center">
        <h1 className="text-8xl md:text-9xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500 mb-4">
          404
        </h1>
        <p className="text-xl md:text-2xl text-gray-300 mb-2">Houston, we have a problem</p>
        <p className="text-lg text-gray-400 mb-10 max-w-md">
          The page you're looking for is lost in space. Let's get you back on track.
        </p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md mx-auto">
          {links.map(({ name, to, icon }) => (
            <Link
              key={to}
              to={to}
              className="flex items-center justify-center py-3 px-5 bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 text-blue-400 font-medium text-lg hover:bg-slate-700/50 hover:text-blue-300 transition-all duration-300 transform hover:-translate-y-1 shadow-lg hover:shadow-blue-500/10"
            >
              {icon}
              {name}
            </Link>
          ))}
        </div>
      </div>
      
      {/* Shooting stars */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full animate-shooting-star"
            style={{
              top: `${Math.random() * 30}%`,
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
            }}
          />
        ))}
      </div>
      
      {/* Custom animations */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-15px); }
        }
        
        @keyframes shooting-star {
          0% { 
            transform: translateX(0) translateY(0) scale(1);
            opacity: 0;
          }
          10% { opacity: 1; }
          100% { 
            transform: translateX(-100vw) translateY(100vh) scale(0.1);
            opacity: 0;
          }
        }
        
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        
        .animate-shooting-star {
          animation: shooting-star 5s linear infinite;
        }
      `}</style>
    </div>
  );
}