import React, { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { database } from '../config/firebase';
import { SiteSettings, TeamMember } from '../types';
import { Users, Target, Award, Heart, MapPin, Phone, Mail } from 'lucide-react';

const About: React.FC = () => {
  const [settings, setSettings] = useState<SiteSettings[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);

  useEffect(() => {
    // Load settings
    const settingsRef = ref(database, 'siteSettings');
    const unsubscribeSettings = onValue(settingsRef, (snapshot) => {
      if (snapshot.exists()) {
        const settingsData = snapshot.val();
        const settingsList: SiteSettings[] = Object.keys(settingsData).map(key => ({
          id: key,
          ...settingsData[key],
        }));
        setSettings(settingsList);
      }
    });

    // Load team members
    const teamRef = ref(database, 'teamMembers');
    const unsubscribeTeam = onValue(teamRef, (snapshot) => {
      if (snapshot.exists()) {
        const teamData = snapshot.val();
        const teamList: TeamMember[] = Object.keys(teamData)
          .map(key => ({
            id: key,
            ...teamData[key],
          }))
          .filter(member => member.isActive)
          .sort((a, b) => a.order - b.order);
        setTeamMembers(teamList);
      }
    });

    return () => {
      unsubscribeSettings();
      unsubscribeTeam();
    };
  }, []);

  const getSetting = (key: string) => {
    const setting = settings.find(s => s.key === key);
    return setting?.value || '';
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            About {getSetting('store_name') || 'Our Shop'}
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            {getSetting('site_description') ||
              'We are a passionate team dedicated to providing high-quality products and exceptional customer service.'}
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
        <div className="bg-white rounded-lg shadow-md p-8 mb-16">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Meet Our Team</h2>
          
          {teamMembers.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {teamMembers.map((member) => (
                <div key={member.id} className="text-center">
                  <img
                    src={member.image || 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg'}
                    alt={member.name}
                    className="w-32 h-32 rounded-full object-cover mx-auto mb-4"
                  />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{member.name}</h3>
                  <p className="text-blue-600 font-medium mb-3">{member.position}</p>
                  <p className="text-gray-600 text-sm leading-relaxed">{member.bio}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-600 max-w-2xl mx-auto">
              Our dedicated team of professionals is here to help you find exactly what you need. 
              With years of experience and a passion for customer service, we're committed to your satisfaction.
            </p>
          )}
        </div>

        {/* Location Section */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-16">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">Find Us</h2>
          <div className="grid md:grid-cols-2 gap-8 items-center">
            {/* Map */}
            <div className="w-full h-[300px] rounded-xl overflow-hidden">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1944.0738054050848!2d77.58994253612006!3d12.962404815078278!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bae15fde41358f3%3A0x51705d17187d7f8a!2sDecor%20Drapes%20Instyle%20%2F%20Monsoon%20Blinds%20%2F%20Zebra%20Blinds%20%2F%20Roller%20Blinds!5e0!3m2!1sen!2sin!4v1756963029833!5m2!1sen!2sin"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen={true}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              ></iframe>
            </div>

            {/* Contact Info */}
            <div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-6">{getSetting('store_name') || 'Our Location'}</h3>
              <ul className="space-y-4 text-gray-700">
                <li className="flex items-start">
                  <MapPin className="w-6 h-6 text-blue-600 mr-3 flex-shrink-0" />
                  <span>
                    {getSetting('store_address') || '123 MG Road, Bengaluru, India'}
                  </span>
                </li>
                <li className="flex items-start">
                  <Phone className="w-6 h-6 text-green-600 mr-3 flex-shrink-0" />
                  <span>
                    {getSetting('primary_phone') || '+91 98765 43210'}
                  </span>
                </li>
                <li className="flex items-start">
                  <Mail className="w-6 h-6 text-red-600 mr-3 flex-shrink-0" />
                  <span>
                    {getSetting('primary_email') || 'info@decordrapes.com'}
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
