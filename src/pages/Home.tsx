import React from 'react';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { database } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import { Testimonial } from '../types';
import TestimonialForm from '../components/testimonials/TestimonialForm';
import { ArrowRight, ShoppingBag, Users, Shield, Phone, Star, CheckCircle, Award, Clock, Headphones } from 'lucide-react';
import Marquee from 'react-fast-marquee';

const Home: React.FC = () => {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [showTestimonialForm, setShowTestimonialForm] = useState(false);
  const { currentUser } = useAuth();

  useEffect(() => {
    const testimonialsRef = ref(database, 'testimonials');
    const unsubscribe = onValue(testimonialsRef, (snapshot) => {
      if (snapshot.exists()) {
        const testimonialsData = snapshot.val();
        const testimonialsList: Testimonial[] = Object.keys(testimonialsData)
          .map(key => ({
            id: key,
            ...testimonialsData[key],
          }))
          .filter(testimonial => testimonial.isApproved)
          .sort(() => Math.random() - 0.5)
          .slice(0, 3);
        setTestimonials(testimonialsList);
      }
    });

    return () => unsubscribe();
  }, []);

  const features = [
    {
      icon: Award,
      title: "Premium Quality",
      description: "Carefully curated selection of high-quality products that meet the highest standards"
    },
    {
      icon: Clock,
      title: "Fast Delivery",
      description: "Quick and reliable delivery service to get your products when you need them"
    },
    {
      icon: Headphones,
      title: "Expert Support",
      description: "Professional customer support team ready to assist you with any questions"
    },
    {
      icon: Shield,
      title: "Secure Shopping",
      description: "Safe and secure payment processing with full customer protection guarantee"
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Enhanced Hero Section */}
      <section className="relative bg-white overflow-hidden">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32 flex flex-col lg:flex-row items-center">
      
      {/* Left Column */}
      <div className="lg:w-1/2 text-center lg:text-left space-y-6">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 leading-tight">
          Build Your Dream  
          <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-500">
            Interior Store
          </span>
        </h1>
        <p className="text-lg text-gray-600 max-w-md mx-auto lg:mx-0">
          Launch an elegant, high‑performance e‑commerce site in minutes.  
          Free estimate, secure payments, and 24/7 support included.
        </p>

        {/* Buttons: capped width on mobile */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mt-6">
          <a
            href="/estimate"
            className="w-auto inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow hover:bg-blue-700 transition"
          >
            Get Free Estimate
            <ArrowRight className="ml-2 w-5 h-5" />
          </a>
          <a
            href="/catalogue"
            className="w-auto inline-flex items-center justify-center px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-100 transition"
          >
            Browse Catalogue
            <ShoppingBag className="ml-2 w-5 h-5" />
          </a>
        </div>

        {/* Trust Badges */}
        <div className="mt-10 flex flex-wrap justify-center lg:justify-start gap-6">
          {[
            { label: '500+ Clients', icon: '../assets/icons/client.svg' },
            { label: '1k+ Projects', icon: '../assets/icons/project.svg' },
            { label: '24/7 Support', icon: '../assets/icons/support.svg' },
            { label: '5★ Rating', icon: '../assets/icons/rating.svg' },
          ].map((badge) => (
            <div key={badge.label} className="flex items-center space-x-2">
              <img src={badge.icon} alt="" className="h-6 w-6" />
              <span className="text-gray-600 font-medium">{badge.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right Column (Dynamic Illustration) */}
      <div className="mt-12 lg:mt-0 lg:w-1/2 flex justify-center lg:justify-end">
        <img
          src="../assets/1.jpg"
          alt="Hero Illustration"
          className="w-full max-w-md rounded-xl shadow-lg"
        />
      </div>
    </div>

    {/* Decorative SVG Curve */}
    <div className="pointer-events-none absolute inset-x-0 bottom-0">
      <svg
        className="w-full h-20"
        viewBox="0 0 1440 320"
        preserveAspectRatio="none"
      >
        <path
          fill="#FFFFFF"
          d="M0,192L48,170.7C96,149,192,107,288,106.7C384,107,480,149,576,160C672,171,768,149,864,133.3C960,117,1056,107,1152,122.7C1248,139,1344,181,1392,202.7L1440,224L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
        />
      </svg>
    </div>
  </section>

      {/* Why Choose Us Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Why Choose Us?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We combine expertise, quality, and dedication to deliver exceptional results for your business
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="group text-center p-8 rounded-2xl bg-gray-50 hover:bg-white hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-4 text-gray-900">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              What Our Clients Say
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Don't just take our word for it - hear from our satisfied customers
            </p>
            <div className="mt-8">
              <button
                onClick={() => setShowTestimonialForm(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors inline-flex items-center"
              >
                <Star className="w-5 h-5 mr-2" />
                Share Your Experience
              </button>
            </div>
          </div>

          {testimonials.length > 0 ? (
            <div className="grid md:grid-cols-3 gap-8">
              {testimonials.map((testimonial) => (
                <div key={testimonial.id} className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300">
                  <div className="flex items-center mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">{testimonial.title}</h4>
                  <p className="text-gray-600 mb-6 leading-relaxed italic">
                    "{testimonial.content}"
                  </p>
                  <div className="flex items-center">
                    {testimonial.userImage ? (
                      <img
                        src={testimonial.userImage}
                        alt={testimonial.userName}
                        className="w-12 h-12 rounded-full object-cover mr-4"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mr-4">
                        <Users className="w-6 h-6 text-gray-600" />
                      </div>
                    )}
                    <div>
                      <div className="font-semibold text-gray-900">{testimonial.userName}</div>
                      <div className="text-gray-500 text-sm">Verified Customer</div>
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
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors inline-flex items-center"
              >
                <Star className="w-5 h-5 mr-2" />
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
      <section className="py-24 bg-gradient-to-r from-blue-600 to-purple-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Need Expert Guidance?
            </h2>
            <p className="text-xl mb-8 opacity-90 leading-relaxed">
              Our professional consultants are ready to help you find the perfect solution for your business needs. 
              Get personalized recommendations and expert advice.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/contact"
                className="bg-white text-blue-600 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-gray-100 transition-colors inline-flex items-center justify-center shadow-xl hover:shadow-2xl transform hover:-translate-y-1"
              >
                <Phone className="mr-2 w-5 h-5" />
                Consult a Professional
              </Link>
              <Link
                to="/estimate"
                className="border-2 border-white text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-white/10 transition-colors inline-flex items-center justify-center"
              >
                Get Free Quote
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Links Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Link
              to="/estimate"
              className="group bg-gradient-to-br from-blue-50 to-blue-100 p-8 rounded-2xl hover:shadow-lg transition-all duration-300 text-center transform hover:-translate-y-1"
            >
              <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-gray-900">Get Estimate</h3>
              <p className="text-gray-600 text-sm">Request a custom quote for your specific needs</p>
            </Link>

            <Link
              to="/catalogue"
              className="group bg-gradient-to-br from-green-50 to-green-100 p-8 rounded-2xl hover:shadow-lg transition-all duration-300 text-center transform hover:-translate-y-1"
            >
              <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <ShoppingBag className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-gray-900">Catalogue</h3>
              <p className="text-gray-600 text-sm">Browse our complete product range</p>
            </Link>

            <Link
              to="/about"
              className="group bg-gradient-to-br from-purple-50 to-purple-100 p-8 rounded-2xl hover:shadow-lg transition-all duration-300 text-center transform hover:-translate-y-1"
            >
              <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <Users className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-gray-900">About Us</h3>
              <p className="text-gray-600 text-sm">Learn more about our company and values</p>
            </Link>

            <Link
              to="/contact"
              className="group bg-gradient-to-br from-orange-50 to-orange-100 p-8 rounded-2xl hover:shadow-lg transition-all duration-300 text-center transform hover:-translate-y-1"
            >
              <div className="w-12 h-12 bg-orange-600 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <Phone className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-gray-900">Contact</h3>
              <p className="text-gray-600 text-sm">Get in touch with our expert team</p>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;