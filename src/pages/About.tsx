import React, { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { database } from '../config/firebase';
import { SiteSettings, TeamMember } from '../types';
import { Users, Target, Award, Heart } from 'lucide-react';

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
            {getSetting('site_description') || 'We are a passionate team dedicated to providing high-quality products and exceptional customer service.'}
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
                  
                  {(member.email || member.linkedin || member.twitter) && (
                    <div className="flex justify-center space-x-3 mt-4">
                      {member.email && (
                        <a
                          href={`mailto:${member.email}`}
                          className="text-gray-400 hover:text-blue-600 transition-colors"
                        >
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                            <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                          </svg>
                        </a>
                      )}
                      {member.linkedin && (
                        <a
                          href={member.linkedin}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-400 hover:text-blue-600 transition-colors"
                        >
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.338 16.338H13.67V12.16c0-.995-.017-2.277-1.387-2.277-1.39 0-1.601 1.086-1.601 2.207v4.248H8.014v-8.59h2.559v1.174h.037c.356-.675 1.227-1.387 2.526-1.387 2.703 0 3.203 1.778 3.203 4.092v4.711zM5.005 6.575a1.548 1.548 0 11-.003-3.096 1.548 1.548 0 01.003 3.096zm-1.337 9.763H6.34v-8.59H3.667v8.59zM17.668 1H2.328C1.595 1 1 1.581 1 2.298v15.403C1 18.418 1.595 19 2.328 19h15.34c.734 0 1.332-.582 1.332-1.299V2.298C19 1.581 18.402 1 17.668 1z" clipRule="evenodd" />
                          </svg>
                        </a>
                      )}
                      {member.twitter && (
                        <a
                          href={member.twitter}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-400 hover:text-blue-600 transition-colors"
                        >
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M6.29 18.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0020 3.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.073 4.073 0 01.8 7.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 010 16.407a11.616 11.616 0 006.29 1.84" />
                          </svg>
                        </a>
                      )}
                    </div>
                  )}
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
      </div>
    </div>
  );
};

export default About;