// src/pages/Home.tsx
import React, { useState, useEffect } from "react";
import { ref, onValue } from "firebase/database";
import { database } from "../config/firebase";
import { Testimonial, Product, OurWorkItem } from "../types";
import Hero from "../components/Hero";
import ProductCard from "../components/product/ProductCard";
import ProductModal from "../components/product/ProductModal";
import TestimonialForm from "../components/testimonials/TestimonialForm";
import OurWorkPublic from "./OurWorkPublic";
import { ArrowRight, Star, Users } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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

  return (
    <div className="bg-white text-gray-900 overflow-hidden">
      {/* HERO */}
      <Hero />

      {/* Featured products section */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-2xl sm:text-3xl font-bold text-center sm:text-left"
          >
            Featured Products
          </motion.h2>
          <motion.a 
            href="/catalogue"
            className="inline-flex items-center text-indigo-600 font-semibold gap-2 group"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            View Full Catalogue 
            <ArrowRight className="transition-transform group-hover:translate-x-1" />
          </motion.a>
        </div>

        {/* Grid for desktop */}
        <div className="hidden md:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {loadingProducts
            ? Array(4).fill(0).map((_, idx) => (
                <SkeletonCard key={idx} className="h-80" />
              ))
            : previewProducts.map((p, idx) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: idx * 0.1 }}
                >
                  <ProductCard product={p} onViewDetails={() => setSelectedProduct(p)} />
                </motion.div>
              ))}
        </div>

        {/* Mobile scroll */}
        <div className="md:hidden flex overflow-x-auto pb-4 -mx-4 px-4 hide-scrollbar gap-4">
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
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4 }}
                  >
                    <ProductCard product={p} onViewDetails={() => setSelectedProduct(p)} />
                  </motion.div>
                </div>
              ))}
        </div>
      </section>

      {/* Our Work */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 bg-gray-50 rounded-3xl my-8 mx-4 sm:mx-6 lg:mx-auto">
        <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-2xl sm:text-3xl font-bold text-center sm:text-left"
          >
            Our Work
          </motion.h2>
          <motion.a 
            href="/our-work"
            className="inline-flex items-center text-indigo-600 font-semibold gap-2 group"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            View All Work 
            <ArrowRight className="transition-transform group-hover:translate-x-1" />
          </motion.a>
        </div>
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ duration: 0.8 }}
>
  {loadingWork ? (
    <div
      className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 overflow-y-auto"
      style={{ maxHeight: 280 }}
    >
      {Array(5).fill(0).map((_, idx) => (
        <SkeletonCard key={idx} className="min-h-[260px]" />
      ))}
    </div>
  ) : (
    <div
      className="overflow-x-auto hide-scrollbar"
      style={{ maxHeight: 280 }}
    >
      <div className="inline-flex gap-4 min-h-[260px]">
        <OurWorkPublic horizontalPreview previewCount={5} />
      </div>
    </div>
  )}
</motion.div>





      </section>

      {/* Testimonials */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="text-center mb-10">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-2xl sm:text-3xl font-bold"
          >
            What Our Clients Say
          </motion.h2>
          <motion.p 
            className="text-gray-600 mt-3 max-w-2xl mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Hear from clients who transformed their homes with our curated interiors.
          </motion.p>
        </div>

        {loadingTestimonials ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Array(3).fill(0).map((_, idx) => (
              <TestimonialSkeleton key={idx} />
            ))}
          </div>
        ) : testimonials.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, idx) => (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: idx * 0.15 }}
                className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300"
              >
                <div className="flex items-center mb-3">
                  {[...Array(Math.max(0, t.rating || 5))].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <h4 className="font-semibold mb-2 text-lg">{t.title}</h4>
                <p className="text-gray-600 italic">"{t.content}"</p>
                <div className="flex items-center mt-6">
                  {t.userImage ? (
                    <motion.img 
                      src={t.userImage} 
                      alt={t.userName} 
                      className="w-10 h-10 rounded-full mr-3 object-cover"
                      whileHover={{ scale: 1.1 }}
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-200 mr-3 flex items-center justify-center">
                      <Users className="w-5 h-5 text-gray-600" />
                    </div>
                  )}
                  <div>
                    <div className="font-medium">{t.userName}</div>
                    <div className="text-xs text-gray-500">Verified Customer</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <motion.div 
            className="text-center py-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <p className="text-gray-600 mb-4">No testimonials yet — be the first to share your experience.</p>
            <div className="mt-4">
              <motion.button 
                onClick={() => setShowTestimonialForm(true)}
                className="px-5 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
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
        className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7 }}
      >
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-center md:text-left">
            <h3 className="text-xl md:text-2xl font-semibold">Need expert guidance?</h3>
            <p className="text-sm mt-1 max-w-md">Book a consultation and get a tailored design and estimate for your home.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <motion.a 
              href="/contact" 
              className="bg-white text-indigo-700 px-5 py-3 rounded-lg font-semibold text-center transition-colors hover:bg-gray-100"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
            >
              Consult a Professional
            </motion.a>
            <motion.a 
              href="/estimate" 
              className="border border-white px-5 py-3 rounded-lg text-center hover:bg-indigo-700 transition-colors"
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