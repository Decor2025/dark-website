// src/pages/Home.tsx
import React, { useState, useEffect } from "react";
import { ref, onValue } from "firebase/database";
import { database } from "../config/firebase";
import { Testimonial, Product, OurWorkItem } from "../types";
import Hero from "../components/Hero";
import ProductCard from "../components/product/ProductCard";
import ProductModal from "../components/product/ProductModal";
import TestimonialForm from "../components/testimonials/TestimonialForm";
import OurWorkPublic from "./OurWork";
import { 
  ArrowRight, 
  Star, 
  Users, 
  Shield, 
  Palette, 
  Zap, 
  Ruler, 
  EyeOff, 
  Clock,
  Droplets,
  Sparkles
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Sample images for visual enhancement (replace with your actual images)
const CATEGORY_IMAGES = {
  sheer: "https://media.istockphoto.com/id/1442115350/photo/modern-design-of-gray-fabric-sofa-with-cushion-and-round-black-coffee-table-in-luxury-white.jpg?s=612x612&w=0&k=20&c=zlTdhIZWcT-yjRSbQU2ZP5H40n76o47TcMRUsEYFc_s=",
  blinds: "https://images.unsplash.com/photo-1595428774223-ef52624120d2?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
  mosquito: "https://media.istockphoto.com/id/1492463709/photo/hand-hold-pleated-mosquito-net-wire-screen-handle-on-house-window.jpg?s=612x612&w=0&k=20&c=RitElFFOlM8T7mLdViTCT-H0Z2Y7B71tbGLkZDYy8jY=",
  motorized: "https://media.istockphoto.com/id/1438964450/photo/roller-blinds-on-the-windows-in-the-interior.jpg?s=612x612&w=0&k=20&c=Gs9RNXBV1Svrem8VEgoOtw2ZZQUj0eo1kjC5otE3wY8=",
  pvc: "https://images.unsplash.com/photo-1560448204-603b3fc33ddc?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
  
  zebra: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
};

// Enhanced skeleton components
const SkeletonCard: React.FC<{ className?: string }> = ({ className = "" }) => (
  <div className={`bg-gray-100 rounded-2xl overflow-hidden animate-pulse ${className}`}>
    <div className="bg-gray-200 h-40 w-full" />
    <div className="p-4">
      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
      <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
      <div className="h-8 bg-gray-200 rounded w-1/3"></div>
    </div>
  </div>
);

const TestimonialSkeleton: React.FC = () => (
  <div className="bg-white rounded-2xl p-6 shadow-sm">
    <div className="flex mb-3">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="w-4 h-4 bg-gray-200 rounded-full mr-1"></div>
      ))}
    </div>
    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
    <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
    <div className="h-4 bg-gray-200 rounded w-5/6 mb-6"></div>
    <div className="flex items-center">
      <div className="w-10 h-10 bg-gray-200 rounded-full mr-3"></div>
      <div>
        <div className="h-3 bg-gray-200 rounded w-24 mb-2"></div>
        <div className="h-2 bg-gray-200 rounded w-16"></div>
      </div>
    </div>
  </div>
);

const Home: React.FC = () => {
  // Data states
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [ourWorkItems, setOurWorkItems] = useState<any[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  
  // Loading flags
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingWork, setLoadingWork] = useState(true);
  const [loadingTestimonials, setLoadingTestimonials] = useState(true);
  
  // Testimonial form
  const [showTestimonialForm, setShowTestimonialForm] = useState(false);

  useEffect(() => {
    // Testimonials
    const testimonialsRef = ref(database, "testimonials");
    const unsubTestimonials = onValue(testimonialsRef, (snap) => {
      if (snap.exists()) {
        const data = snap.val();
        const list: Testimonial[] = Object.keys(data)
          .map((k) => ({ id: k, ...data[k] }))
          .filter((t) => t.isApproved)
          .sort(() => Math.random() - 0.5)
          .slice(0, 3);
        setTestimonials(list);
      } else {
        setTestimonials([]);
      }
      setLoadingTestimonials(false);
    });

    // Products
    const productsRef = ref(database, "products");
    const unsubProducts = onValue(productsRef, (snap) => {
      if (snap.exists()) {
        const data = snap.val();
        const list: Product[] = Object.keys(data).map((k) => ({ id: k, ...data[k] }));
        setProducts(list);
      } else {
        setProducts([]);
      }
      setLoadingProducts(false);
    });

    // OurWork
    const ourWorkRef = ref(database, "ourWork");
    const unsubWork = onValue(ourWorkRef, (snap) => {
      if (snap.exists()) {
        const data = snap.val();
        const list: OurWorkItem[] = Object.keys(data).map((k) => ({ id: k, ...data[k] })).slice(0, 5);
        setOurWorkItems(list);
      } else {
        setOurWorkItems([]);
      }
      setLoadingWork(false);
    });

    return () => {
      unsubTestimonials();
      unsubProducts();
      unsubWork();
    };
  }, []);

  const previewProducts = products.slice(0, 4);
  
  // Product categories data with images
  const productCategories = [
    {
      title: "Curtain Sheer Fabrics",
      description: "Elegant and lightweight fabrics that filter light while maintaining privacy",
      icon: <EyeOff className="w-8 h-8" />,
      image: CATEGORY_IMAGES.sheer,
      features: ["Light Filtering", "Elegant Draping", "Various Colors"]
    },
    {
      title: "Ready-made Blinds",
      description: "Precision-cut blinds available in various sizes for quick installation",
      icon: <Ruler className="w-8 h-8" />,
      image: CATEGORY_IMAGES.blinds,
      features: ["Perfect Fit", "Quick Installation", "Multiple Sizes"]
    },
    {
      title: "Pleated Mosquito Mesh",
      description: "Discreet protection against insects without compromising on ventilation",
      icon: <Shield className="w-8 h-8" />,
      image: CATEGORY_IMAGES.mosquito,
      features: ["Insect Protection", "Full Ventilation", "Discreet Design"]
    },
    {
      title: "Motorised Solutions",
      description: "Automated curtains and blinds for modern, convenient living",
      icon: <Zap className="w-8 h-8" />,
      image: CATEGORY_IMAGES.motorized,
      features: ["Smart Control", "Energy Efficient", "Quiet Operation"]
    },
    {
      title: "PVC & Monsoon Blinds",
      description: "Weather-resistant solutions for all seasons and conditions",
      icon: <Droplets className="w-8 h-8" />,
      image: CATEGORY_IMAGES.pvc,
      features: ["Weather Resistant", "All Seasons", "Durable Material"]
    },
    {
      title: "Wooden & Zebra Blinds",
      description: "Stylish options with various patterns and color combinations",
      icon: <Palette className="w-8 h-8" />,
      image: CATEGORY_IMAGES.zebra,
      features: ["Natural Materials", "Modern Styles", "Custom Designs"]
    }
  ];

  // Benefits data
  const benefits = [
    {
      title: "Custom Sizing",
      description: "Perfect fit for any window dimension",
      icon: <Ruler className="w-6 h-6" />
    },
    {
      title: "Quick Installation",
      description: "Professional fitting in less time",
      icon: <Clock className="w-6 h-6" />
    },
    {
      title: "Premium Materials",
      description: "Quality fabrics built to last",
      icon: <Sparkles className="w-6 h-6" />
    },
    {
      title: "Free Consultation",
      description: "Expert advice for your space",
      icon: <Sparkles className="w-6 h-6" />
    }
  ];

  return (
    <div className="bg-white text-gray-900 overflow-hidden">
      {/* HERO */}
      <Hero />

      {/* Product categories section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7 }}
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">Our Premium Window Solutions</h2>
          <p className="text-gray-600 mt-4 max-w-3xl mx-auto text-lg">
            Transform your space with our curated collection of high-quality window treatments designed for style and functionality
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {productCategories.map((category, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <div className="relative h-48 overflow-hidden">
                <img 
                  src={category.image} 
                  alt={category.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                  <div className="flex gap-2">
                    {category.features.map((feature, i) => (
                      <span key={i} className="text-xs text-white bg-indigo-600/90 px-2 py-1 rounded-full">
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="p-6">
                <div className="bg-indigo-100 p-3 rounded-full text-indigo-600 mb-4 inline-flex">
                  {category.icon}
                </div>
                <h3 className="font-semibold text-xl mb-2 text-gray-900">{category.title}</h3>
                <p className="text-gray-600">{category.description}</p>
                <button className="mt-4 text-indigo-600 font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
                  Explore options <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Benefits section */}
      <section className="bg-gradient-to-br from-indigo-50 to-gray-100 py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7 }}
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">Why Choose Our Products</h2>
            <p className="text-gray-600 mt-4 max-w-2xl mx-auto text-lg">
              Experience the difference with our premium products and exceptional service
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white rounded-2xl p-6 text-center shadow-md hover:shadow-lg transition-all duration-300"
              >
                <div className="bg-indigo-100 w-14 h-14 rounded-full flex items-center justify-center text-indigo-600 mx-auto mb-5">
                  {benefit.icon}
                </div>
                <h3 className="font-semibold text-lg mb-3 text-gray-900">{benefit.title}</h3>
                <p className="text-gray-600">{benefit.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured products section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <div className="flex flex-col sm:flex-row items-center justify-between mb-12 gap-4">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7 }}
            className="text-3xl sm:text-4xl font-bold text-gray-900 text-center sm:text-left"
          >
            Featured Products
          </motion.h2>
          <motion.a 
            href="/catalogue"
            className="inline-flex items-center text-indigo-600 font-semibold gap-2 group text-lg"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            View Full Catalogue 
            <ArrowRight className="transition-transform group-hover:translate-x-1" />
          </motion.a>
        </div>

        {/* Grid for desktop */}
        <div className="hidden md:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {loadingProducts
            ? Array(4).fill(0).map((_, idx) => (
                <SkeletonCard key={idx} className="h-80" />
              ))
            : previewProducts.map((p, idx) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.5, delay: idx * 0.1 }}
                >
                  <ProductCard product={p} onViewDetails={() => setSelectedProduct(p)} />
                </motion.div>
              ))}
        </div>

        {/* Mobile scroll */}
        <div className="md:hidden flex overflow-x-auto pb-4 -mx-4 px-4 hide-scrollbar gap-6">
          {loadingProducts
            ? Array(3).fill(0).map((_, idx) => (
                <div key={idx} className="min-w-[85vw]">
                  <SkeletonCard className="h-72" />
                </div>
              ))
            : previewProducts.map((p) => (
                <div key={p.id} className="min-w-[85vw]">
                  <motion.div
                    initial={{ opacity: 0, x: 50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ duration: 0.4 }}
                  >
                    <ProductCard product={p} onViewDetails={() => setSelectedProduct(p)} />
                  </motion.div>
                </div>
              ))}
        </div>
      </section>

      {/* Our Work */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 bg-gradient-to-br from-gray-50 to-indigo-50 rounded-3xl my-8 mx-4 sm:mx-6 lg:mx-auto">
        <div className="flex flex-col sm:flex-row items-center justify-between mb-12 gap-4">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7 }}
            className="text-3xl sm:text-4xl font-bold text-gray-900 text-center sm:text-left"
          >
            Our Recent Projects
          </motion.h2>
          <motion.a 
            href="/our-work"
            className="inline-flex items-center text-indigo-600 font-semibold gap-2 group text-lg"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            View All Projects
            <ArrowRight className="transition-transform group-hover:translate-x-1" />
          </motion.a>
        </div>
        
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
        >
          {loadingWork ? (
            <div
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6 overflow-y-auto"
              style={{ maxHeight: 300 }}
            >
              {Array(5).fill(0).map((_, idx) => (
                <SkeletonCard key={idx} className="min-h-[280px]" />
              ))}
            </div>
          ) : (
            <div
              className="overflow-x-auto hide-scrollbar"
              style={{ maxHeight: 300 }}
            >
              <div className="inline-flex gap-6 min-h-[280px]">
                <OurWorkPublic horizontalPreview previewCount={5} />
              </div>
            </div>
          )}
        </motion.div>
      </section>

      {/* Testimonials */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <div className="text-center mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7 }}
            className="text-3xl sm:text-4xl font-bold text-gray-900"
          >
            What Our Clients Say
          </motion.h2>
          <motion.p 
            className="text-gray-600 mt-4 max-w-2xl mx-auto text-lg"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Hear from clients who transformed their homes with our curated interiors.
          </motion.p>
        </div>

        {loadingTestimonials ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {Array(3).fill(0).map((_, idx) => (
              <TestimonialSkeleton key={idx} />
            ))}
          </div>
        ) : testimonials.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((t, idx) => (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: idx * 0.15 }}
                className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100"
              >
                <div className="flex items-center mb-4">
                  {[...Array(Math.max(0, t.rating || 5))].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <h4 className="font-semibold text-lg mb-3 text-gray-900">{t.title}</h4>
                <p className="text-gray-600 italic">"{t.content}"</p>
                <div className="flex items-center mt-8 pt-4 border-t border-gray-100">
                  {t.userImage ? (
                    <motion.img 
                      src={t.userImage} 
                      alt={t.userName} 
                      className="w-12 h-12 rounded-full mr-4 object-cover"
                      whileHover={{ scale: 1.1 }}
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-indigo-100 mr-4 flex items-center justify-center text-indigo-600">
                      <Users className="w-6 h-6" />
                    </div>
                  )}
                  <div>
                    <div className="font-medium text-gray-900">{t.userName}</div>
                    <div className="text-sm text-gray-500">Verified Customer</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <motion.div 
            className="text-center py-12 bg-gray-50 rounded-2xl"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5 }}
          >
            <p className="text-gray-600 mb-6 text-lg">No testimonials yet — be the first to share your experience.</p>
            <div className="mt-4">
              <motion.button 
                onClick={() => setShowTestimonialForm(true)}
                className="px-6 py-3 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-colors font-medium"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Write a Review
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* Testimonial modal/form */}
        <AnimatePresence>
          {showTestimonialForm && (
            <TestimonialForm 
              isOpen={showTestimonialForm} 
              onClose={() => setShowTestimonialForm(false)} 
            />
          )}
        </AnimatePresence>
      </section>

      {/* CTA */}
      <motion.section 
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.7 }}
      >
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-2xl p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8 overflow-hidden relative">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-72 h-72 bg-purple-300 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-300 rounded-full translate-x-1/3 translate-y-1/3"></div>
          </div>
          <div className="text-center md:text-left relative z-10">
            <h3 className="text-2xl md:text-3xl font-semibold mb-3">Need expert guidance?</h3>
            <p className="text-indigo-100 max-w-md">Book a consultation and get a tailored design and estimate for your home.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto relative z-10">
            <motion.a 
              href="/contact" 
              className="bg-white text-indigo-700 px-6 py-4 rounded-xl font-semibold text-center transition-colors hover:bg-gray-50 shadow-lg"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
            >
              Consult a Professional
            </motion.a>
            <motion.a 
              href="/estimate" 
              className="border border-white px-6 py-4 rounded-xl text-center hover:bg-indigo-700/20 transition-colors font-medium"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
            >
              Get Free Quote
            </motion.a>
          </div>
        </div>
      </motion.section>

      {/* Product modal */}
      <AnimatePresence>
        {selectedProduct && (
          <ProductModal 
            product={selectedProduct} 
            onClose={() => setSelectedProduct(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
};
export default Home;