// src/components/Hero.tsx
import React, { useState } from "react";
import {
  ArrowRight,
  ShoppingBag,
  Users,
  Award,
  LifeBuoy,
  Star,
} from "lucide-react";
import { motion } from "framer-motion";
import { useSiteSettings } from "../hooks/useSiteSettings";

const Hero: React.FC = () => {
  const { settings, get } = useSiteSettings();
  const [imgLoaded, setImgLoaded] = useState(false);

  const loading = settings === null;

  const heading = get("site_title") || "Industrial Solutions";
  const tagline =
    get("site_description") || "Premium products • Expert installations";
  const imageUrl = get("site_logo") || "/hero-image.jpg";

  const badges = [
    { label: "500+ Clients", icon: Users },
    { label: "1k+ Projects", icon: Award },
    { label: "24/7 Support", icon: LifeBuoy },
    { label: "5★ Rating", icon: Star },
  ];

  const words = heading.split(" ");
  const halfIdx = Math.ceil(words.length / 2);
  const firstHalf = words.slice(0, halfIdx).join(" ");
  const secondHalf = words.slice(halfIdx).join(" ");

  return (
    <section className="relative bg-white overflow-hidden min-h-screen flex items-center">
      {/* Animated circuit-style line pattern */}
      <svg
        className="absolute inset-0 w-full h-full text-gray-300 opacity-20"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern
            id="circuitPattern"
            width="60"
            height="60"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M0 30 H60 M30 0 V60"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              strokeDasharray="6 6"
            >
              <animate
                attributeName="stroke-dashoffset"
                values="0;12"
                dur="2s"
                repeatCount="indefinite"
              />
            </path>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#circuitPattern)" />
      </svg>

      {/* Floating blobs */}
      <motion.div
        className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-50 rounded-full mix-blend-multiply filter blur-3xl opacity-30"
        animate={{ scale: [1, 1.3, 1], x: [0, 40, 0], y: [0, -50, 0] }}
        transition={{ duration: 15, repeat: Infinity, repeatType: "reverse" }}
      />
      <motion.div
        className="absolute bottom-1/4 right-1/4 w-112 h-112 bg-gray-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30"
        animate={{ scale: [1, 1.4, 1], x: [0, -40, 0], y: [0, 50, 0] }}
        transition={{
          duration: 18,
          repeat: Infinity,
          repeatType: "reverse",
          delay: 2,
        }}
      />

      {/* Main container */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 lg:px-8 py-20 flex flex-col lg:flex-row items-center w-full">
        {/* LEFT COLUMN */}
        <div className="lg:w-1/2 text-center lg:text-left space-y-6">
          {loading ? (
            <div className="animate-pulse space-y-6">
              {/* Heading skeleton */}
              <div className="h-14 bg-gray-200 rounded w-3/4 mx-auto lg:mx-0" />
              <div className="h-6 bg-gray-200 rounded w-1/2 mx-auto lg:mx-0" />

              {/* Buttons skeleton */}
              <div className="flex flex-wrap gap-4 justify-center lg:justify-start mt-6">
                <div className="h-12 bg-gray-200 rounded-full w-40" />
                <div className="h-12 bg-gray-200 rounded-full w-44" />
              </div>

              {/* Badges skeleton */}
              <div className="mt-10 flex flex-wrap justify-center lg:justify-start gap-6">
                {Array.from({ length: badges.length }).map((_, i) => (
                  <div key={i} className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-gray-200 rounded-full" />
                    <div className="w-20 h-4 bg-gray-200 rounded" />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight text-gray-900">
                {firstHalf}{" "}
                <span className="block bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
                  {secondHalf}
                </span>
              </h1>
              <p className="text-lg text-gray-600 max-w-md mx-auto lg:mx-0">
                {tagline}
              </p>

              {/* Buttons */}
              <div className="flex flex-wrap gap-4 justify-center lg:justify-start mt-6">
                <motion.a
                  href="/estimate"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="inline-flex w-auto items-center px-6 py-3 font-semibold rounded-full shadow bg-indigo-600 text-white hover:bg-indigo-700 transition"
                >
                  Get Free Estimate
                  <ArrowRight className="ml-2 w-5 h-5" />
                </motion.a>

                <motion.a
                  href="/catalogue"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="inline-flex w-auto items-center px-6 py-3 font-semibold rounded-full shadow border-2 border-gray-300 text-gray-700 hover:bg-gray-100 transition"
                >
                  Browse Catalogue
                  <ShoppingBag className="ml-2 w-5 h-5" />
                </motion.a>
              </div>

              {/* Badges */}
              <div className="mt-10 flex flex-wrap justify-center lg:justify-start gap-6">
                {badges.map(({ label, icon: Icon }, i) => (
                  <motion.div
                    key={label}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.15 * i }}
                    className="flex items-center space-x-2"
                  >
                    <Icon className="w-6 h-6 text-blue-500" />
                    <span className="text-gray-600 font-medium">{label}</span>
                  </motion.div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* RIGHT COLUMN */}
        <div className="mt-12 lg:mt-0 lg:w-1/2 flex justify-center lg:justify-end">
          <div className="relative w-full max-w-md aspect-square rounded-xl overflow-hidden shadow-lg">
            {(loading || !imgLoaded) && (
              <div className="absolute inset-0 bg-gray-200 animate-pulse rounded-xl" />
            )}
            {!loading && (
              <img
                src={encodeURI(imageUrl)}
                alt="Hero Illustration"
                onLoad={() => setImgLoaded(true)}
                className={`absolute inset-0 w-full h-full object-cover rounded-xl transition-opacity duration-500 ${
                  imgLoaded ? "opacity-100" : "opacity-0"
                }`}
              />
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
