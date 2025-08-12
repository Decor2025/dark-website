import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ref, onValue } from 'firebase/database';
import { database } from '../config/firebase';
import { Testimonial, Product, OurWorkItem } from '../types';
import Hero from '../components/Hero';
import ProductModal from '../components/product/ProductModal';
import TestimonialForm from '../components/testimonials/TestimonialForm';
import ProductCard from '../components/product/ProductCard';
import OurWorkPublic from './OurWorkPublic'; 

import {
  ArrowRight,
  Users,
  Shield,
  Phone,
  Star,
  CheckCircle,
  Award,
  Clock,
  Headphones
} from 'lucide-react';

const Home: React.FC = () => {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [showTestimonialForm, setShowTestimonialForm] = useState(false);

  // Products state only
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [ourWorkItems, setOurWorkItems] = useState<any[]>([]);

  useEffect(() => {
    // Fetch testimonials
    const testimonialsRef = ref(database, 'testimonials');
    const unsubscribeTestimonials = onValue(testimonialsRef, (snapshot) => {
      if (snapshot.exists()) {
        const testimonialsData = snapshot.val();
        const testimonialsList: Testimonial[] = Object.keys(testimonialsData)
          .map(key => ({ id: key, ...testimonialsData[key] }))
          .filter(t => t.isApproved)
          .sort(() => Math.random() - 0.5)
          .slice(0, 3);
        setTestimonials(testimonialsList);
      }
    });

    // Fetch products only
    const productsRef = ref(database, 'products');
    const unsubscribeProducts = onValue(productsRef, (snapshot) => {
      if (snapshot.exists()) {
        const productsData = snapshot.val();
        const productsList: Product[] = Object.keys(productsData).map(key => ({
          id: key,
          ...productsData[key],
        }));
        setProducts(productsList);
      } else {
        setProducts([]);
      }
    });

    // Fetch our work items
    const ourWorkRef = ref(database, 'ourWork');
    const unsubscribeOurWork = onValue(ourWorkRef, (snapshot) => {
      if (snapshot.exists()) {
        const ourWorkData = snapshot.val();
        const ourWorkList: OurWorkItem[] = Object.keys(ourWorkData)
          .map(key => ({ id: key, ...ourWorkData[key] }))
          .slice(0, 5); // Limit to 5 items
        setOurWorkItems(ourWorkList);
      }
    });

    return () => {
      unsubscribeTestimonials();
      unsubscribeProducts();
      unsubscribeOurWork();
    };
  }, []);

  // Now only use products directly
  const previewProducts = products.slice(0, 4);

  // Your features array unchanged
  const features = [
    { icon: Award, title: "Premium Quality", description: "Carefully curated selection of high-quality products that meet the highest standards" },
    { icon: Clock, title: "Fast Delivery", description: "Quick and reliable delivery service to get your products when you need them" },
    { icon: Headphones, title: "Expert Support", description: "Professional customer support team ready to assist you with any questions" },
    { icon: Shield, title: "Secure Shopping", description: "Safe and secure payment processing with full customer protection guarantee" },
  ];

  // Affiliate partners data
  const affiliatePartners = [
    { name: "Flipkart", logo: "/flipkart-logo.png", url: "https://www.flipkart.com" },
    { name: "IndiaMart", logo: "/indiamart-logo.png", url: "https://www.indiamart.com" },
    { name: "Amazon", logo: "/amazon-logo.png", url: "https://www.amazon.in" },
    { name: "eBay", logo: "/ebay-logo.png", url: "https://www.ebay.com" },
    { name: "Alibaba", logo: "/alibaba-logo.png", url: "https://www.alibaba.com" },
  ];

  return (
    <div className="min-h-screen">

      {/* Hero Section */}
      <Hero />

      {/* Catalogue Preview Section */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center mb-8 md:mb-12 gap-4">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Featured Products</h2>
            <Link
              to="/catalogue"
              className="inline-flex items-center text-blue-600 hover:text-blue-700 font-semibold"
            >
              View Full Catalogue <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
          </div>

          {/* Grid for desktop */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 hidden md:grid">
            {previewProducts.map(product => (
              <ProductCard
                key={product.id}
                product={product}
                onViewDetails={() => setSelectedProduct(product)}
              />
            ))}
          </div>

          {/* Scroll for mobile */}
          <div className="md:hidden flex overflow-x-auto pb-4 -mx-4 px-4 hide-scrollbar">
            <div className="flex space-x-4">
              {previewProducts.map(product => (
                <div key={`mobile-${product.id}`} className="min-w-[75vw] sm:min-w-[50vw]">
                  <ProductCard
                    product={product}
                    onViewDetails={() => setSelectedProduct(product)}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal */}
        {selectedProduct && (
          <ProductModal
            product={selectedProduct}
            onClose={() => setSelectedProduct(null)}
          />
        )}
      </section>

      {/* Why Choose Us Section */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 md:mb-20">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 md:mb-6">
              Why Choose Us?
            </h2>
            <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">
              We combine expertise, quality, and dedication to deliver exceptional results for your business
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {features.map((feature, index) => (
              <div key={index} className="group text-center p-6 md:p-8 rounded-2xl bg-gray-50 hover:bg-white hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
                <div className="w-14 h-14 md:w-16 md:h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 md:mb-6 group-hover:scale-110 transition-transform duration-300">
                  <feature.icon className="w-6 md:w-8 h-6 md:h-8 text-white" />
                </div>
                <h3 className="text-lg md:text-xl font-semibold mb-3 md:mb-4 text-gray-900">{feature.title}</h3>
                <p className="text-sm md:text-base text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Work Section */}
      <section className="py-16 md:py-24 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center mb-8 md:mb-12 gap-4">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Our Work</h2>
            <Link
              to="/our-work"
              className="inline-flex items-center text-blue-600 hover:text-blue-700 font-semibold"
            >
              View All Work <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
          </div>
          
          <div className="relative">
            <OurWorkPublic 
              horizontalPreview 
              previewCount={5} 
            />
          </div>
        </div>
      </section>

      {/* Affiliate Partners Section */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              We Work With
            </h2>
            <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">
              Trusted by leading platforms and marketplaces
            </p>
          </div>
          
          <div className="flex flex-wrap justify-center gap-6 md:gap-10">
            {affiliatePartners.map((partner, index) => (
              <a 
                key={index}
                href={partner.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 border border-gray-200"
              >
                <div className="flex flex-col items-center">
                  <div className="bg-gray-200 border-2 border-dashed rounded-xl w-16 h-16" />
                  <span className="mt-2 text-sm font-medium text-gray-700">{partner.name}</span>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 md:py-24 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 md:mb-20">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 md:mb-6">
              What Our Clients Say
            </h2>
            <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">
              Don't just take our word for it - hear from our satisfied customers
            </p>
            <div className="mt-6">
              <button
                onClick={() => setShowTestimonialForm(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 md:px-6 md:py-3 rounded-lg font-medium transition-colors inline-flex items-center text-sm md:text-base"
              >
                <Star className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                Share Your Experience
              </button>
            </div>
          </div>

          {testimonials.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {testimonials.map((testimonial) => (
                <div key={testimonial.id} className="bg-white p-6 md:p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300">
                  <div className="flex items-center mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 md:w-5 md:h-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <h4 className="text-base md:text-lg font-semibold text-gray-900 mb-2">{testimonial.title}</h4>
                  <p className="text-sm md:text-base text-gray-600 mb-4 md:mb-6 leading-relaxed italic">
                    "{testimonial.content}"
                  </p>
                  <div className="flex items-center">
                    {testimonial.userImage ? (
                      <img
                        src={testimonial.userImage}
                        alt={testimonial.userName}
                        className="w-10 h-10 md:w-12 md:h-12 rounded-full object-cover mr-3 md:mr-4"
                      />
                    ) : (
                      <div className="w-10 h-10 md:w-12 md:h-12 bg-gray-200 rounded-full flex items-center justify-center mr-3 md:mr-4">
                        <Users className="w-5 h-5 md:w-6 md:h-6 text-gray-600" />
                      </div>
                    )}
                    <div>
                      <div className="font-semibold text-gray-900 text-sm md:text-base">{testimonial.userName}</div>
                      <div className="text-gray-500 text-xs md:text-sm">Verified Customer</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600 mb-6">Be the first to share your experience!</p>
              <button
                onClick={() => setShowTestimonialForm(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 md:px-6 md:py-3 rounded-lg font-medium transition-colors inline-flex items-center text-sm md:text-base"
              >
                <Star className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                Write a Review
              </button>
            </div>
          )}
        </div>

        {/* Testimonial Form Modal */}
        <TestimonialForm
          isOpen={showTestimonialForm}
          onClose={() => setShowTestimonialForm(false)}
        />
      </section>

      {/* Consult a Professional CTA */}
      <section className="py-16 md:py-24 bg-gradient-to-r from-blue-600 to-purple-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 md:mb-6">
              Need Expert Guidance?
            </h2>
            <p className="text-lg md:text-xl mb-6 md:mb-8 opacity-90 leading-relaxed">
              Our professional consultants are ready to help you find the perfect solution for your business needs. 
              Get personalized recommendations and expert advice.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center">
              <Link
                to="/contact"
                className="bg-white text-blue-600 px-6 py-3 md:px-8 md:py-4 rounded-xl font-semibold text-base md:text-lg hover:bg-gray-100 transition-colors inline-flex items-center justify-center shadow-xl hover:shadow-2xl transform hover:-translate-y-1"
              >
                <Phone className="mr-2 w-4 h-4 md:w-5 md:h-5" />
                Consult a Professional
              </Link>
              <Link
                to="/estimate"
                className="border-2 border-white text-white px-6 py-3 md:px-8 md:py-4 rounded-xl font-semibold text-base md:text-lg hover:bg-white/10 transition-colors inline-flex items-center justify-center"
              >
                Get Free Quote
                <ArrowRight className="ml-2 w-4 h-4 md:w-5 md:h-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Links Section */}
      <section className="py-16 md:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            <Link
              to="/estimate"
              className="group bg-gradient-to-br from-blue-50 to-blue-100 p-6 md:p-8 rounded-2xl hover:shadow-lg transition-all duration-300 text-center transform hover:-translate-y-1"
            >
              <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-3 md:mb-4 group-hover:scale-110 transition-transform">
                <CheckCircle className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </div>
              <h3 className="text-base md:text-lg font-semibold mb-1 md:mb-2 text-gray-900">Get Estimate</h3>
              <p className="text-xs md:text-sm text-gray-600">Request a custom quote for your specific needs</p>
            </Link>

            <Link
              to="/catalogue"
              className="group bg-gradient-to-br from-green-50 to-green-100 p-6 md:p-8 rounded-2xl hover:shadow-lg transition-all duration-300 text-center transform hover:-translate-y-1"
            >
              <div className="w-10 h-10 md:w-12 md:h-12 bg-green-600 rounded-xl flex items-center justify-center mx-auto mb-3 md:mb-4 group-hover:scale-110 transition-transform">
                <Star className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </div>
              <h3 className="text-base md:text-lg font-semibold mb-1 md:mb-2 text-gray-900">Catalogue</h3>
              <p className="text-xs md:text-sm text-gray-600">Browse our complete product range</p>
            </Link>

            <Link
              to="/our-work"
              className="group bg-gradient-to-br from-purple-50 to-purple-100 p-6 md:p-8 rounded-2xl hover:shadow-lg transition-all duration-300 text-center transform hover:-translate-y-1"
            >
              <div className="w-10 h-10 md:w-12 md:h-12 bg-purple-600 rounded-xl flex items-center justify-center mx-auto mb-3 md:mb-4 group-hover:scale-110 transition-transform">
                <Users className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </div>
              <h3 className="text-base md:text-lg font-semibold mb-1 md:mb-2 text-gray-900">Our Work</h3>
              <p className="text-xs md:text-sm text-gray-600">See examples of completed projects</p>
            </Link>

            <Link
              to="/contact"
              className="group bg-gradient-to-br from-red-50 to-red-100 p-6 md:p-8 rounded-2xl hover:shadow-lg transition-all duration-300 text-center transform hover:-translate-y-1"
            >
              <div className="w-10 h-10 md:w-12 md:h-12 bg-red-600 rounded-xl flex items-center justify-center mx-auto mb-3 md:mb-4 group-hover:scale-110 transition-transform">
                <Phone className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </div>
              <h3 className="text-base md:text-lg font-semibold mb-1 md:mb-2 text-gray-900">Contact Us</h3>
              <p className="text-xs md:text-sm text-gray-600">Get in touch with our team</p>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
