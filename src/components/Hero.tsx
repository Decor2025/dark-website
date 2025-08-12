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
  const tagline = get("site_description") || "Premium products • Expert installations";
  const imageUrl = get("site_logo") || "/hero-image.jpg";

  const badges = [
    { label: "500+ Clients", icon: Users },
    { label: "1k+ Projects", icon: Award },
    { label: "24/7 Support", icon: LifeBuoy },
    { label: "5★ Rating", icon: Star },
  ];

  // Split heading for gradient effect
  const words = heading.split(" ");
  const halfIdx = Math.ceil(words.length / 2);
  const firstHalf = words.slice(0, halfIdx).join(" ");
  const secondHalf = words.slice(halfIdx).join(" ");

  return (
    <section className="relative bg-white overflow-hidden min-h-screen flex items-center">
      {/* Background pattern - subtle repeating dots */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundColor: "#ffffff",
          backgroundImage:
            `radial-gradient(rgba(203, 213, 224, 0.1) 1px, transparent 1px)`,
          backgroundSize: "20px 20px",
          zIndex: 0,
        }}
      />

      {/* Animated subtle color blobs behind */}
      <motion.div
        className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-50 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"
        animate={{
          scale: [1, 1.3, 1],
          x: [0, 40, 0],
          y: [0, -50, 0],
          rotate: [0, 10, 0],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          repeatType: "reverse",
          ease: "easeInOut",
        }}
        aria-hidden="true"
      />
      <motion.div
        className="absolute bottom-1/4 right-1/4 w-112 h-112 bg-gray-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"
        animate={{
          scale: [1, 1.4, 1],
          x: [0, -40, 0],
          y: [0, 50, 0],
          rotate: [0, -10, 0],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          repeatType: "reverse",
          ease: "easeInOut",
          delay: 2,
        }}
        aria-hidden="true"
      />
      <motion.div
        className="absolute top-1/3 left-2/3 w-80 h-80 bg-blue-50 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"
        animate={{
          scale: [1, 1.2, 1],
          x: [0, 30, 0],
          y: [0, -30, 0],
          rotate: [0, 5, 0],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          repeatType: "reverse",
          ease: "easeInOut",
          delay: 1,
        }}
        aria-hidden="true"
      />
      <motion.div
        className="absolute bottom-1/3 left-1/3 w-72 h-72 bg-gray-50 rounded-full mix-blend-multiply filter blur-3xl opacity-25 animate-blob"
        animate={{
          scale: [1, 1.25, 1],
          x: [0, -30, 0],
          y: [0, 40, 0],
          rotate: [0, -5, 0],
        }}
        transition={{
          duration: 14,
          repeat: Infinity,
          repeatType: "reverse",
          ease: "easeInOut",
          delay: 3,
        }}
        aria-hidden="true"
      />

      {/* Main container */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 lg:px-8 py-20 flex flex-col lg:flex-row items-center w-full">
        {/* LEFT COLUMN */}
        <div className="lg:w-1/2 text-center lg:text-left space-y-6">
          {loading ? (
            <>
              <div className="h-14 bg-gray-200 rounded w-3/4 mx-auto lg:mx-0 mb-6 animate-pulse" />
              <div className="h-6 bg-gray-200 rounded w-1/2 mx-auto lg:mx-0 mb-8 animate-pulse" />
              <div className="flex justify-center lg:justify-start gap-4 mb-8">
                <div className="h-12 px-10 bg-gray-200 rounded-full animate-pulse" />
                <div className="h-12 px-10 bg-gray-200 rounded-full animate-pulse" />
              </div>
              <div className="flex flex-wrap justify-center lg:justify-start gap-6">
                {badges.map((_, i) => (
                  <div
                    key={i}
                    className="h-10 w-32 bg-gray-200 rounded-lg animate-pulse"
                  />
                ))}
              </div>
            </>
          ) : (
            <>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight text-gray-900">
                {firstHalf}{" "}
                <span
                  className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-500"
                  style={{ WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}
                >
                  {secondHalf}
                </span>
              </h1>
              <p className="text-lg text-gray-600 max-w-md mx-auto lg:mx-0">
                {tagline}
              </p>

              {/* Buttons container - center on small screens */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mt-6">
                <motion.a
                  href="/estimate"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="inline-flex items-center px-6 py-3 font-semibold rounded-full shadow bg-indigo-600 text-white hover:bg-indigo-700 transition"
                  aria-label="Get Free Estimate"
                >
                  Get Free Estimate
                  <ArrowRight className="ml-2 w-5 h-5" />
                </motion.a>

                <motion.a
                  href="/catalogue"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="inline-flex items-center px-6 py-3 font-semibold rounded-full shadow border-2 border-gray-300 text-gray-700 hover:bg-gray-100 transition"
                  aria-label="Browse Catalogue"
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
              <div
                className="absolute inset-0 bg-gray-200 animate-pulse rounded-xl"
                aria-hidden="true"
              />
            )}
            {!loading && (
              <img
                src={encodeURI(imageUrl)}
                alt="Hero Illustration"
                onLoad={() => setImgLoaded(true)}
                className={`absolute inset-0 w-full h-full object-cover rounded-xl transition-opacity duration-500
                  ${imgLoaded ? "opacity-100" : "opacity-0"}
                `}
              />
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
