import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ref, onValue } from "firebase/database";
import { database } from "../../config/firebase";
import { SiteSettings } from "../../types";
import {
  Mail,
  Phone,
  MapPin,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  ShoppingBag,
  Users,
  Shield,
  Clock,
  ArrowRight,
} from "lucide-react";

const Footer: React.FC = () => {
  const [settings, setSettings] = useState<SiteSettings[]>([]);
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    const settingsRef = ref(database, "siteSettings");
    const unsubscribe = onValue(settingsRef, (snapshot) => {
      if (snapshot.exists()) {
        const settingsData = snapshot.val();
        const settingsList: SiteSettings[] = Object.keys(settingsData).map(
          (key) => ({
            id: key,
            ...settingsData[key],
          })
        );
        setSettings(settingsList);
      }
    });

    return () => unsubscribe();
  }, []);

  const getSetting = (key: string) => {
    const setting = settings.find((s) => s.key === key);
    return setting?.value || "";
  };

  const footerLinks = [
    { name: 'Home', path: '/' },
    { name: 'About', path: '/about' },
    { name: 'Catalogue', path: '/catalogue' },
    { name: 'Our Work', path: '/our-work' },
  ];

  const legalLinks = [
    { name: 'Privacy Policy', path: '/privacy' },
    { name: 'Terms', path: '/terms' },
  ];

  return (
    <footer className="bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-950 border-t border-gray-200 dark:border-gray-700 transition-colors duration-300">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Company Info */}
          <div className="space-y-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-cyan-500 dark:from-blue-500 dark:to-cyan-400 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-lg">
                  {(getSetting("store_name") || "HLG").charAt(0)}
                </span>
              </div>
              <div>
                <p className="font-bold text-lg text-gray-900 dark:text-gray-100 dark:text-white">
                  {getSetting("store_name") || "HLG"}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">Quality Furnishings</p>
              </div>
            </div>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-sm">
              {getSetting("store_tagline") ||
                "Premium window furnishings and home decor solutions. Crafted with excellence, delivered with pride."}
            </p>
            <div className="flex space-x-3">
              <a
                href={getSetting("facebook_url") || "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-gray-200 dark:bg-gray-700 hover:bg-blue-600 dark:hover:bg-blue-600 text-gray-700 dark:text-gray-300 hover:text-white rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-110"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a
                href={getSetting("twitter_url") || "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-gray-200 dark:bg-gray-700 hover:bg-blue-400 dark:hover:bg-blue-600 text-gray-700 dark:text-gray-300 hover:text-white rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-110"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a
                href={getSetting("instagram_url") || "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-gray-200 dark:bg-gray-700 hover:bg-pink-600 dark:hover:bg-pink-600 text-gray-700 dark:text-gray-300 hover:text-white rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-110"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a
                href={getSetting("linkedin_url") || "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-gray-200 dark:bg-gray-700 hover:bg-blue-700 dark:hover:bg-blue-600 text-gray-700 dark:text-gray-300 hover:text-white rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-110"
              >
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-bold text-gray-900 dark:text-gray-100 dark:text-white text-lg mb-6">Quick Links</h3>
            <ul className="space-y-3">
              {footerLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.path}
                    className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 text-sm font-medium transition-colors duration-200 inline-flex items-center group"
                  >
                    <ArrowRight className="w-4 h-4 mr-2 opacity-0 group-hover:opacity-100 transform -translate-x-2 group-hover:translate-x-0 transition-all duration-200" />
                    <span>{link.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal & Support */}
          <div>
            <h3 className="font-bold text-gray-900 dark:text-gray-100 dark:text-white text-lg mb-6">Legal</h3>
            <ul className="space-y-3">
              {legalLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.path}
                    className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 text-sm font-medium transition-colors duration-200 inline-flex items-center group"
                  >
                    <ArrowRight className="w-4 h-4 mr-2 opacity-0 group-hover:opacity-100 transform -translate-x-2 group-hover:translate-x-0 transition-all duration-200" />
                    <span>{link.name}</span>
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  to="/contact"
                  className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 text-sm font-medium transition-colors duration-200 inline-flex items-center group"
                >
                  <ArrowRight className="w-4 h-4 mr-2 opacity-0 group-hover:opacity-100 transform -translate-x-2 group-hover:translate-x-0 transition-all duration-200" />
                  <span>Contact</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="font-bold text-gray-900 dark:text-gray-100 dark:text-white text-lg mb-6">Contact</h3>
            <ul className="space-y-4">
              {getSetting("phone") && (
                <li className="flex items-start space-x-3">
                  <Phone className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">Phone</p>
                    <a
                      href={`tel:${getSetting("phone")}`}
                      className="text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 text-sm font-semibold transition-colors"
                    >
                      {getSetting("phone")}
                    </a>
                  </div>
                </li>
              )}
              {getSetting("email") && (
                <li className="flex items-start space-x-3">
                  <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">Email</p>
                    <a
                      href={`mailto:${getSetting("email")}`}
                      className="text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 text-sm font-semibold transition-colors break-all"
                    >
                      {getSetting("email")}
                    </a>
                  </div>
                </li>
              )}
              {getSetting("address") && (
                <li className="flex items-start space-x-3">
                  <MapPin className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">Address</p>
                    <p className="text-gray-900 dark:text-gray-100 text-sm font-semibold leading-relaxed">
                      {getSetting("address")}
                    </p>
                  </div>
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-200 dark:border-gray-700 my-12"></div>

        {/* Bottom Section */}
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">
            © {currentYear} {getSetting("store_name") || "HLG"}. All rights reserved.
          </p>
          <div className="flex space-x-6 text-sm text-gray-600 dark:text-gray-400 font-medium">
            <Link to="/privacy" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              Privacy
            </Link>
            <Link to="/terms" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
