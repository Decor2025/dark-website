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
import { motion } from "framer-motion";

/* small skeleton card used for placeholders */
const SkeletonCard: React.FC<{ className?: string }> = ({ className = "" }) => (
  <div className={`bg-gray-200 rounded-2xl animate-pulse ${className}`} />
);

const Home: React.FC = () => {
  // data states
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [ourWorkItems, setOurWorkItems] = useState<any[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  // loading flags
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingWork, setLoadingWork] = useState(true);
  const [loadingTestimonials, setLoadingTestimonials] = useState(true);
  // testimonial form
  const [showTestimonialForm, setShowTestimonialForm] = useState(false);

  useEffect(() => {
    // testimonials
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

    // products
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

    // ourWork
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
    <div className="bg-white text-gray-900">
      {/* HERO */}
      <Hero />

      {/* Featured products section */}
      <section className="max-w-6xl mx-auto px-6 lg:px-8 py-14">
        <div className="flex items-center justify-between mb-8">
          <motion.h2 initial={{opacity:0, y:8}} whileInView={{opacity:1, y:0}} viewport={{once:true}} transition={{duration:0.6}} className="text-3xl font-bold">Featured Products</motion.h2>
          <a href="/catalogue" className="inline-flex items-center text-indigo-600 font-semibold gap-2">
            View Full Catalogue <ArrowRight />
          </a>
        </div>

        {/* grid for desktop */}
        <div className="hidden md:grid grid-cols-4 gap-6">
          {loadingProducts
            ? Array(4).fill(0).map((_, idx) => <SkeletonCard key={idx} className="h-64" />)
            : previewProducts.map((p) => (
                <ProductCard key={p.id} product={p} onViewDetails={() => setSelectedProduct(p)} />
              ))}
        </div>

        {/* mobile scroll */}
        <div className="md:hidden flex overflow-x-auto hide-scrollbar gap-4 pb-4 -mx-6 px-6">
          {loadingProducts
            ? Array(3).fill(0).map((_, idx) => <SkeletonCard key={idx} className="h-56 min-w-[75vw]" />)
            : previewProducts.map((p) => (
                <div key={p.id} className="min-w-[75vw]">
                  <ProductCard product={p} onViewDetails={() => setSelectedProduct(p)} />
                </div>
              ))}
        </div>
      </section>

      {/* Our Work */}
      <section className="max-w-6xl mx-auto px-6 lg:px-8 py-14 bg-gray-50 rounded-3xl mx-6 lg:mx-auto">
        <div className="flex items-center justify-between mb-8">
          <motion.h2 initial={{opacity:0, y:8}} whileInView={{opacity:1, y:0}} viewport={{once:true}} transition={{duration:0.6}} className="text-3xl font-bold">Our Work</motion.h2>
          <a href="/our-work" className="inline-flex items-center text-indigo-600 font-semibold gap-2">
            View All Work <ArrowRight />
          </a>
        </div>

        <div>
          {loadingWork ? (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {Array(5).fill(0).map((_, idx) => <SkeletonCard key={idx} className="h-40" />)}
            </div>
          ) : (
            <OurWorkPublic horizontalPreview previewCount={5} />
          )}
        </div>
      </section>

      {/* Testimonials */}
      <section className="max-w-6xl mx-auto px-6 lg:px-8 py-14">
        <div className="text-center mb-8">
          <motion.h2 initial={{opacity:0, y:8}} whileInView={{opacity:1, y:0}} viewport={{once:true}} transition={{duration:0.6}} className="text-3xl font-bold">What Our Clients Say</motion.h2>
          <p className="text-gray-600 mt-3 max-w-2xl mx-auto">Hear from clients who transformed their homes with our curated interiors.</p>
        </div>

        {loadingTestimonials ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Array(3).fill(0).map((_, idx) => <SkeletonCard key={idx} className="h-56" />)}
          </div>
        ) : testimonials.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div key={t.id} className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition">
                <div className="flex items-center mb-3">
                  {[...Array(Math.max(0, t.rating || 5))].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-yellow-400" />
                  ))}
                </div>
                <h4 className="font-semibold mb-2">{t.title}</h4>
                <p className="text-gray-600 italic">"{t.content}"</p>
                <div className="flex items-center mt-4">
                  {t.userImage ? (
                    <img src={t.userImage} alt={t.userName} className="w-10 h-10 rounded-full mr-3 object-cover" />
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
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-600">No testimonials yet — be the first to share your experience.</p>
            <div className="mt-4">
              <button onClick={() => setShowTestimonialForm(true)} className="px-5 py-2 rounded-lg bg-indigo-600 text-white">Write a Review</button>
            </div>
          </div>
        )}

        {/* testimonial modal/form */}
        <TestimonialForm isOpen={showTestimonialForm} onClose={() => setShowTestimonialForm(false)} />
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-6 lg:px-8 py-12">
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-2xl font-semibold">Need expert guidance?</h3>
            <p className="text-sm mt-1">Book a consultation and get a tailored design and estimate for your home.</p>
          </div>
          <div className="flex gap-4">
            <a href="/contact" className="bg-white text-indigo-700 px-5 py-3 rounded-lg font-semibold">Consult a Professional</a>
            <a href="/estimate" className="border border-white px-5 py-3 rounded-lg">Get Free Quote</a>
          </div>
        </div>
      </section>

      {/* Product modal */}
      {selectedProduct && <ProductModal product={selectedProduct} onClose={() => setSelectedProduct(null)} />}
    </div>
  );
};

export default Home;
