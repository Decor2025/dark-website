import React from 'react';
import { Users, Target, Award, Heart } from 'lucide-react';

const About: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">About Our Shop</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            We are a passionate team dedicated to providing high-quality products and exceptional customer service.
          </p>
        </div>

        {/* Story Section */}
        <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Story</h2>
            <p className="text-gray-600 mb-4">
              Founded with a vision to make quality products accessible to everyone, our shop has been serving customers 
              with dedication and excellence for years.
            </p>
            <p className="text-gray-600 mb-4">
              We believe in building lasting relationships with our customers by providing not just products, 
              but complete solutions that meet their needs.
            </p>
            <p className="text-gray-600">
              Our commitment to quality, innovation, and customer satisfaction drives everything we do.
            </p>
          </div>
          <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg p-8 text-white">
            <h3 className="text-2xl font-bold mb-4">Why Choose Us?</h3>
            <ul className="space-y-2">
              <li className="flex items-center">
                <Award className="w-5 h-5 mr-2" />
                Quality Guarantee
              </li>
              <li className="flex items-center">
                <Heart className="w-5 h-5 mr-2" />
                Customer First Approach
              </li>
              <li className="flex items-center">
                <Target className="w-5 h-5 mr-2" />
                Competitive Pricing
              </li>
              <li className="flex items-center">
                <Users className="w-5 h-5 mr-2" />
                Expert Support Team
              </li>
            </ul>
          </div>
        </div>

        {/* Values Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Our Values</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Target className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Excellence</h3>
              <p className="text-gray-600">
                We strive for excellence in every product we offer and every service we provide.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Integrity</h3>
              <p className="text-gray-600">
                Honesty and transparency are at the core of all our business relationships.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Community</h3>
              <p className="text-gray-600">
                We believe in building strong relationships and giving back to our community.
              </p>
            </div>
          </div>
        </div>

        {/* Team Section */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">Meet Our Team</h2>
          <p className="text-center text-gray-600 max-w-2xl mx-auto">
            Our dedicated team of professionals is here to help you find exactly what you need. 
            With years of experience and a passion for customer service, we're committed to your satisfaction.
          </p>
        </div>
      </div>
    </div>
  );
};

export default About;