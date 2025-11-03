import React, { useState, useEffect } from 'react';
import { ref, push, onValue } from 'firebase/database';
import { database } from '../config/firebase';
import { Mail, Phone, MapPin, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import { SiteSettings } from '../types';

const Contact: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState<SiteSettings[]>([]);

  useEffect(() => {
    const settingsRef = ref(database, 'siteSettings');
    const unsubscribe = onValue(settingsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const list = Object.keys(data).map((key) => ({
          id: key,
          ...data[key],
        }));
        setSettings(list);
      }
    });

    return () => unsubscribe();
  }, []);

  const getSetting = (key: string) => {
    const setting = settings.find((s) => s.key === key);
    return setting?.value || '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const contactRef = ref(database, 'contactMessages');
      await push(contactRef, {
        ...formData,
        isRead: false,
        createdAt: new Date().toISOString(),
      });

      toast.success("Message sent successfully! We'll get back to you soon.");
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch (error) {
      toast.error('Failed to send message. Please try again.');
      console.error('Error sending contact message:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">Contact Us</h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            We'd love to hear from you. Send us a message and we'll respond as
            soon as possible.
          </p>
        </div>

        <div className="space-y-12">
          {/* Contact Form (on top) */}
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-6 max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 text-center">
              Send us a Message
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6" noValidate>
              <div className="grid md:grid-cols-2 gap-6">
                {/* Floating input: Full Name */}
                <div className="relative z-0 w-full group">
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleInputChange}
                    className="block py-2.5 px-0 w-full text-gray-900 dark:text-gray-100 bg-transparent border-0 border-b-2 border-gray-300 dark:border-gray-600 appearance-none focus:outline-none focus:ring-0 focus:border-blue-600 peer"
                    placeholder=" "
                    autoComplete="off"
                  />
                  <label
                    htmlFor="name"
                    className="absolute text-sm text-gray-500 duration-300 transform -translate-y-6 scale-75 top-3 left-0 origin-[0] peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100 peer-focus:-translate-y-6 peer-focus:scale-75"
                  >
                    Full Name
                  </label>
                </div>

                {/* Floating input: Email */}
                <div className="relative z-0 w-full group">
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    className="block py-2.5 px-0 w-full text-gray-900 dark:text-gray-100 bg-transparent border-0 border-b-2 border-gray-300 dark:border-gray-600 appearance-none focus:outline-none focus:ring-0 focus:border-blue-600 peer"
                    placeholder=" "
                    autoComplete="off"
                  />
                  <label
                    htmlFor="email"
                    className="absolute text-sm text-gray-500 duration-300 transform -translate-y-6 scale-75 top-3 left-0 origin-[0] peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100 peer-focus:-translate-y-6 peer-focus:scale-75"
                  >
                    Email Address
                  </label>
                </div>
              </div>

              {/* Floating input: Subject */}
              <div className="relative z-0 w-full group">
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  required
                  value={formData.subject}
                  onChange={handleInputChange}
                  className="block py-2.5 px-0 w-full text-gray-900 dark:text-gray-100 bg-transparent border-0 border-b-2 border-gray-300 dark:border-gray-600 appearance-none focus:outline-none focus:ring-0 focus:border-blue-600 peer"
                  placeholder=" "
                  autoComplete="off"
                />
                <label
                  htmlFor="subject"
                  className="absolute text-sm text-gray-500 duration-300 transform -translate-y-6 scale-75 top-3 left-0 origin-[0] peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100 peer-focus:-translate-y-6 peer-focus:scale-75"
                >
                  Subject
                </label>
              </div>

              {/* Floating textarea: Message */}
              <div className="relative z-0 w-full group">
                <textarea
                  id="message"
                  name="message"
                  required
                  rows={6}
                  value={formData.message}
                  onChange={handleInputChange}
                  className="block py-2.5 px-0 w-full text-gray-900 dark:text-gray-100 bg-transparent border-0 border-b-2 border-gray-300 dark:border-gray-600 resize-none appearance-none focus:outline-none focus:ring-0 focus:border-blue-600 peer"
                  placeholder=" "
                />
                <label
                  htmlFor="message"
                  className="absolute text-sm text-gray-500 duration-300 transform -translate-y-6 scale-75 top-3 left-0 origin-[0] peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100 peer-focus:-translate-y-6 peer-focus:scale-75"
                >
                  Message
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center"
              >
                {loading ? (
                  "Sending..."
                ) : (
                  <>
                    Send Message
                    <Send className="w-4 h-4 ml-2" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Contact Info (below form) */}
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-6 max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 text-center">
              Get in Touch
            </h2>

            <div className="space-y-6">
              {/* Email */}
              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Mail className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">Email</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {getSetting("primary_email") || "contact@shop.com"}
                  </p>
                  <p className="text-gray-600 dark:text-gray-400">
                    {getSetting("support_email") || "support@shop.com"}
                  </p>
                </div>
              </div>

              {/* Phone */}
              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Phone className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">Phone</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {getSetting("primary_phone") || "+1 (555) 123-4567"}
                  </p>
                  <p className="text-gray-600 dark:text-gray-400">
                    {getSetting("secondary_phone") || "+1 (555) 987-6543"}
                  </p>
                </div>
              </div>

              {/* Address */}
              <div className="flex items-start space-x-4">
                <div className="shrink-0 w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">Address</h3>
                  {(
                    getSetting("store_address") ||
                    ""
                  )
                    .split("\n")
                    .map((line, index) => (
                      <p className="text-gray-600 dark:text-gray-400" key={index}>
                        {line}
                      </p>
                    ))}
                </div>
              </div>

              {/* Business Hours */}
              <div className="mt-8">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Business Hours
                </h3>
                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  {(
                    getSetting("store_hours") ||
                    "Mon-Fri: 9AM-6PM, Sat: 10AM-4PM, Sun: Closed"
                  )
                    .split(",")
                    .map((segment, idx) => (
                      <div className="flex justify-between" key={idx}>
                        <span>{segment.split(":")[0].trim()}</span>
                        <span>{segment.split(":")[1].trim()}</span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
