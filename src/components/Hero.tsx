import React, { useState } from "react";
import {
  ArrowRight,
  ShoppingBag,
  Users,
  Award,
  LifeBuoy,
  Star,
} from "lucide-react";
import { useSiteSettings } from "../hooks/useSiteSettings";

const Hero: React.FC = () => {
  const { settings, get } = useSiteSettings();
  const [imgLoaded, setImgLoaded] = useState(false);

  // While settings haven't arrived yet…
  const loading = settings === null;

  // Pull values (or defaults) once loaded
  const heading = get("site_title") || "";
  const tagline = get("site_description") || "";
  const imageUrl = get("site_logo") || "";

  const badges = [
    { label: "500+ Clients", icon: Users },
    { label: "1k+ Projects", icon: Award },
    { label: "24/7 Support", icon: LifeBuoy },
    { label: "5★ Rating", icon: Star },
  ];

  // Split for gradient
  const words = heading.split(" ");
  const halfIdx = Math.ceil(words.length / 2);
  const firstHalf = words.slice(0, halfIdx).join(" ");
  const secondHalf = words.slice(halfIdx).join(" ");

  return (
    <section className="relative bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-20 lg:py-32 flex flex-col lg:flex-row items-center">
        {/* LEFT COLUMN */}
        <div className="lg:w-1/2 text-center lg:text-left space-y-6">
          {loading ? (
            // Skeleton for heading + tagline + buttons
            <>
              <div className="h-12 bg-gray-200 rounded animate-pulse w-3/4 mx-auto lg:mx-0" />
              <div className="h-6 bg-gray-200 rounded animate-pulse w-1/2 mx-auto lg:mx-0" />
              <div className="flex justify-center lg:justify-start space-x-4 mt-6">
                <div className="h-10 bg-gray-200 rounded animate-pulse w-32" />
                <div className="h-10 bg-gray-200 rounded animate-pulse w-32" />
              </div>
            </>
          ) : (
            // Real content
            <>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 leading-tight">
                {firstHalf}{" "}
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-500">
                  {secondHalf}
                </span>
              </h1>
              <p className="text-lg text-gray-600 max-w-md mx-auto lg:mx-0">
                {tagline}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mt-6">
                <a
                  href="/estimate"
                  className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow hover:bg-blue-700 transition"
                >
                  Get Free Estimate
                  <ArrowRight className="ml-2 w-5 h-5" />
                </a>
                <a
                  href="/catalogue"
                  className="inline-flex items-center px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-100 transition"
                >
                  Browse Catalogue
                  <ShoppingBag className="ml-2 w-5 h-5" />
                </a>
              </div>
              {/* Trust Badges */}
              <div className="mt-10 flex flex-wrap justify-center lg:justify-start gap-6">
                {badges.map(({ label, icon: Icon }) => (
                  <div key={label} className="flex items-center space-x-2">
                    <Icon className="w-6 h-6 text-blue-500" />
                    <span className="text-gray-600 font-medium">{label}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* RIGHT COLUMN */}
        <div className="mt-12 lg:mt-0 lg:w-1/2 flex justify-center lg:justify-end">
          <div className="relative w-full max-w-md aspect-square">
            {loading || !imgLoaded ? (
              // Skeleton overlay
              <div
                className="absolute inset-0 bg-gray-200 animate-pulse rounded-xl"
                aria-hidden="true"
              />
            ) : null}
            {!loading && (
              <img
                src={encodeURI(imageUrl)}
                alt="Hero Illustration"
                onLoad={() => setImgLoaded(true)}
                className={`absolute inset-0 w-full h-full object-cover rounded-xl shadow-lg transition-opacity duration-500
                  ${imgLoaded ? "opacity-100" : "opacity-0"}
                `}
              />
            )}
          </div>
        </div>
      </div>

      {/* Decorative SVG Curve */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0">
        {/* … your SVG … */}
      </div>
    </section>
  );
};

export default Hero;