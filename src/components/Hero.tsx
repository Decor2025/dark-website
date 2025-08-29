// src/components/Hero.tsx
import React, { useState, useEffect } from "react";
import {
  ArrowRight,
  ShoppingBag,
  Users,
  Award,
  Shield,
  Ruler,
  Truck,
  CheckCircle,
  ChevronDown,
  Phone,
  Quote,
  Sparkles,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useSiteSettings } from "../hooks/useSiteSettings";

const Hero: React.FC = () => {
  const { settings, get } = useSiteSettings();
  const [activeFeature, setActiveFeature] = useState(0);

  const loading = settings === null;

  const heading = get("site_title") || "Premium Blinds & Mosquito Nets";
  const tagline =
    get("site_description") || "Custom fittings • Quality materials • Expert installation";

  const badges = [
    { label: "500+ Happy Clients", icon: Users },
    { label: "1k+ Installations", icon: Award },
    { label: "5-Year Warranty", icon: Shield },
    { label: "Free Measurement", icon: Ruler },
  ];

  const features = [
    {
      title: "Custom Sizing",
      description: "Perfect fit for any window or door",
      icon: Ruler,
    },
    {
      title: "Quality Materials",
      description: "Durable, UV-resistant options",
      icon: Shield,
    },
    {
      title: "Quick Installation",
      description: "Professional setup within 24 hours",
      icon: Truck,
    },
    {
      title: "Easy Maintenance",
      description: "Designed for easy cleaning",
      icon: CheckCircle,
    },
  ];

  // Blinds and mosquito mesh specific images
  const productImages = [
    {
      url: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80",
      title: "Roller Blinds"
    },
    {
      url: "https://media.istockphoto.com/id/1167452861/photo/open-mosquito-net-wire-screen-on-house-window-protection-against-insect.jpg?s=612x612&w=0&k=20&c=paJ7XM1JBbRouSSKZY56hgY7r7R2m__X8ykRMCyepn8=",
      title: "Mosquito Nets"
    },
    {
      url: "https://images.unsplash.com/photo-1595877244574-e90ce41ce089?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80",
      title: "Roman Blinds"
    },
    {
      url: "https://images.unsplash.com/photo-1560448076-3f6f44b6b4a8?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80",
      title: "Window Solutions"
    }
  ];

  const words = heading.split(" ");
  const halfIdx = Math.ceil(words.length / 2);
  const firstHalf = words.slice(0, halfIdx).join(" ");
  const secondHalf = words.slice(halfIdx).join(" ");

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % features.length);
    }, 4000);
    
    return () => clearInterval(interval);
  }, [features.length]);

  // Fixed animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3
      }
    }
  };

  const itemVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring" as const,
        damping: 12,
        stiffness: 100
      }
    }
  };

  const imageVariants = {
    hidden: { scale: 0.9, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: {
        type: "spring" as const,
        damping: 15,
        stiffness: 100
      }
    }
  };

  const featureCardVariants = {
    hidden: { scale: 0.8, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: {
        type: "spring" as const,
        damping: 15,
        stiffness: 100,
        delay: 0.8
      }
    }
  };

  return (
    <section className="relative bg-gradient-to-br from-slate-50 to-blue-50/30 overflow-hidden min-h-screen flex items-center">
      {/* Background pattern with mesh texture */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/light-mesh.png')] opacity-20 z-0" />
      
      {/* Animated decorative elements */}
      <motion.div 
        className="absolute top-0 right-0 w-1/3 h-1/3 bg-blue-100/40 rounded-full filter blur-3xl"
        initial={{ translateY: "-50%", translateX: "50%", opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
      />
      <motion.div 
        className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-slate-200/40 rounded-full filter blur-3xl"
        initial={{ translateY: "50%", translateX: "-50%", opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.5, ease: "easeOut", delay: 0.3 }}
      />
      
      {/* Floating particles */}
      {[...Array(15)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 bg-blue-400/30 rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [0, -20, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 3 + Math.random() * 4,
            repeat: Infinity,
            delay: Math.random() * 2,
          }}
        />
      ))}
      
      {/* Main container */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 lg:px-8 py-12 md:py-16 w-full">
        <motion.div 
          className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* LEFT COLUMN */}
          <div className="text-center lg:text-left space-y-8 order-2 lg:order-1">
            {loading ? (
              <div className="animate-pulse space-y-6">
                <div className="h-12 md:h-14 bg-slate-300 rounded w-3/4 mx-auto lg:mx-0" />
                <div className="h-6 bg-slate-300 rounded w-1/2 mx-auto lg:mx-0" />
                <div className="flex flex-wrap gap-3 justify-center lg:justify-start mt-6">
                  <div className="h-12 bg-slate-300 rounded-full w-40" />
                  <div className="h-12 bg-slate-300 rounded-full w-44" />
                </div>
                <div className="mt-8 flex flex-wrap justify-center lg:justify-start gap-4">
                  {Array.from({ length: badges.length }).map((_, i) => (
                    <div key={i} className="flex items-center space-x-2">
                      <div className="w-5 h-5 bg-slate-300 rounded-full" />
                      <div className="w-20 h-4 bg-slate-300 rounded" />
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <>
                <motion.div variants={itemVariants} className="space-y-4">
                  <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold leading-tight text-slate-800 tracking-tight">
                    <span className="block font-bold">{firstHalf}</span>
                    <span className="block bg-gradient-to-r from-blue-600 to-teal-500 bg-clip-text text-transparent font-bold">
                      {secondHalf}
                    </span>
                  </h1>
                  
                  <p className="text-xl text-slate-600 max-w-md mx-auto lg:mx-0 font-normal leading-relaxed">
                    {tagline}
                  </p>
                </motion.div>

                {/* Buttons */}
                <motion.div 
                  variants={itemVariants}
                  className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mt-8"
                >
                  <motion.a
                    href="/estimate"
                    whileHover={{ 
                      scale: 1.03, 
                      boxShadow: "0 10px 25px -5px rgba(59, 130, 246, 0.4)",
                      transition: { type: "spring", stiffness: 400, damping: 17 }
                    }}
                    whileTap={{ scale: 0.98 }}
                    className="inline-flex items-center justify-center px-6 py-4 font-semibold rounded-xl shadow-lg bg-blue-600 text-white hover:bg-blue-700 transition-all duration-300 text-base"
                  >
                    <Quote className="mr-3 h-5 w-5" />
                    Free Quote
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </motion.a>

                  <motion.a
                    href="/catalogue"
                    whileHover={{ 
                      scale: 1.03, 
                      boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
                      transition: { type: "spring", stiffness: 400, damping: 17 }
                    }}
                    whileTap={{ scale: 0.98 }}
                    className="inline-flex items-center justify-center px-6 py-4 font-semibold rounded-xl shadow-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition-all duration-300 text-base"
                  >
                    <ShoppingBag className="mr-3 h-5 w-5" />
                    Browse Products
                  </motion.a>
                </motion.div>

                {/* Call to action button */}
                <motion.div 
                  variants={itemVariants}
                  className="flex justify-center lg:justify-start mt-4"
                >
                  <motion.a
                    href="tel:+91 9738101408"
                    whileHover={{ scale: 1.02 }}
                    className="inline-flex items-center justify-center px-5 py-3 font-medium rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition text-sm"
                  >
                    <Phone className="mr-2 h-4 w-4" />
                    Call Now
                  </motion.a>
                </motion.div>

                {/* Badges */}
                <motion.div 
                  variants={itemVariants}
                  className="grid grid-cols-2 gap-4 mt-10"
                >
                  {badges.map(({ label, icon: Icon }, i) => (
                    <motion.div
                      key={label}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.2 + i * 0.1 }}
                      className="flex items-center space-x-3 p-4 bg-white/80 rounded-xl shadow-sm backdrop-blur-sm border border-slate-200/60"
                    >
                      <div className="p-2 bg-blue-100 rounded-full">
                        <Icon className="w-5 h-5 text-blue-600" />
                      </div>
                      <span className="text-sm font-medium text-slate-700">{label}</span>
                    </motion.div>
                  ))}
                </motion.div>
              </>
            )}
          </div>

          {/* RIGHT COLUMN - Product Showcase */}
          <motion.div 
            className="relative order-1 lg:order-2 mb-8 lg:mb-0"
            variants={containerVariants}
          >
            <div className="grid grid-cols-2 grid-rows-2 gap-4 md:gap-5 aspect-square max-w-md mx-auto lg:max-w-none">
              {/* Main image */}
              <motion.div 
                className="relative col-span-1 row-span-2 rounded-2xl overflow-hidden shadow-2xl border-4 border-white group"
                variants={imageVariants}
                whileHover={{ scale: 1.03 }}
                transition={{ type: "spring", stiffness: 300, damping: 15 }}
              >
                <img
                  src={productImages[0].url}
                  alt={productImages[0].title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex items-end p-5">
                  <div>
                    <h3 className="text-white font-bold text-lg">{productImages[0].title}</h3>
                    <div className="w-10 h-1 bg-blue-400 mt-2 rounded-full"></div>
                  </div>
                </div>
                <div className="absolute top-4 right-4">
                  <Sparkles className="text-yellow-300" size={24} />
                </div>
              </motion.div>

              {/* Top right image */}
              <motion.div 
                className="relative rounded-xl overflow-hidden shadow-lg border-3 border-white group"
                variants={imageVariants}
                whileHover={{ y: -5 }}
                transition={{ type: "spring", stiffness: 300, damping: 15 }}
              >
                <img
                  src={productImages[1].url}
                  alt={productImages[1].title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-slate-900/50 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex items-start justify-center p-3">
                  <div className="w-7 h-7 bg-blue-500 rounded-full flex items-center justify-center">
                    <CheckCircle className="text-white" size={16} />
                  </div>
                </div>
              </motion.div>

              {/* Bottom right image */}
              <motion.div 
                className="relative rounded-xl overflow-hidden shadow-lg border-3 border-white group"
                variants={imageVariants}
                whileHover={{ y: 5 }}
                transition={{ type: "spring", stiffness: 300, damping: 15 }}
              >
                <img
                  src={productImages[2].url}
                  alt={productImages[2].title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-blue-900/20 opacity-0 group-hover:opacity-100 transition-all duration-500 flex items-center justify-center">
                  <div className="w-7 h-7 bg-blue-500 rounded-full flex items-center justify-center">
                    <CheckCircle className="text-white" size={16} />
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Floating feature card - Better placement and animation */}
            <motion.div 
              className="absolute -bottom-4 -right-4 bg-white p-5 rounded-2xl shadow-2xl border border-slate-200/60 w-72 z-10"
              variants={featureCardVariants}
              whileHover={{ 
                y: -5,
                transition: { type: "spring", stiffness: 400, damping: 17 }
              }}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeFeature}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="flex items-start space-x-4"
                >
                  <div className="p-2.5 bg-blue-100 rounded-xl">
                    {React.createElement(features[activeFeature].icon, { 
                      className: "w-6 h-6 text-blue-600" 
                    })}
                  </div>
                  <div>
                    <h4 className="text-slate-800 font-bold text-base">{features[activeFeature].title}</h4>
                    <p className="text-slate-600 text-sm mt-1">{features[activeFeature].description}</p>
                  </div>
                </motion.div>
              </AnimatePresence>
              <div className="flex justify-center mt-4">
                {features.map((_, index) => (
                  <button
                    key={index}
                    className={`w-2 h-2 rounded-full mx-1 transition-all duration-300 ${index === activeFeature ? 'bg-blue-500 scale-125' : 'bg-slate-300'}`}
                    onClick={() => setActiveFeature(index)}
                  />
                ))}
              </div>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Features section below */}
        <motion.div 
          className="grid grid-cols-2 md:grid-cols-4 gap-5 mt-16"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.6 }}
        >
          {features.map((feature, index) => (
            <motion.div 
              key={index}
              className="bg-white/80 backdrop-blur-sm rounded-xl p-5 border border-slate-200/60 hover:border-blue-300 transition-all duration-300 shadow-sm"
              whileHover={{ 
                y: -5,
                transition: { type: "spring", stiffness: 400, damping: 17 }
              }}
            >
              <div className="flex items-center space-x-3 mb-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  {React.createElement(feature.icon, { 
                    className: "w-5 h-5 text-blue-600" 
                  })}
                </div>
                <h3 className="text-slate-800 font-semibold text-sm">{feature.title}</h3>
              </div>
              <p className="text-slate-600 text-xs">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Scrolling indicator */}
        <motion.div 
          className="flex flex-col items-center mt-16"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.6 }}
        >
          <span className="text-slate-600 text-sm mb-2 font-medium">Scroll to see more</span>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <ChevronDown className="w-6 h-6 text-blue-500" />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;