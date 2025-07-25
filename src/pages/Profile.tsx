import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Calendar, Shield, Camera, Edit, Save, X, Phone, MapPin, Briefcase, Globe } from 'lucide-react';

const Profile: React.FC = () => {
  const { currentUser, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    displayName: currentUser?.displayName || '',
    phone: currentUser?.phone || '',
    address: currentUser?.address || '',
    company: currentUser?.company || '',
    website: currentUser?.website || '',
    bio: currentUser?.bio || '',
    profileImage: null as File | null,
  });
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Please log in to view your profile.</p>
      </div>
    );
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({ ...formData, profileImage: file });
      
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await updateProfile(formData.displayName, formData.profileImage || undefined, {
        phone: formData.phone,
        address: formData.address,
        company: formData.company,
        website: formData.website,
        bio: formData.bio,
      });
      setIsEditing(false);
      setPreviewImage(null);
      setFormData({ ...formData, profileImage: null });
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData({
      displayName: currentUser?.displayName || '',
      phone: currentUser?.phone || '',
      address: currentUser?.address || '',
      company: currentUser?.company || '',
      website: currentUser?.website || '',
      bio: currentUser?.bio || '',
      profileImage: null,
    });
    setPreviewImage(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-12 relative">
            <div className="flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-8">
              <div className="relative">
                {currentUser.profileImage || previewImage ? (
                  <img
                    src={previewImage || currentUser.profileImage}
                    alt="Profile"
                    className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
                  />
                ) : (
                  <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center border-4 border-white shadow-lg">
                    <User className="w-16 h-16 text-blue-600" />
                  </div>
                )}
                
                {isEditing && (
                  <label className="absolute bottom-2 right-2 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full cursor-pointer transition-colors shadow-lg">
                    <Camera className="w-5 h-5" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
              
              <div className="text-white text-center md:text-left flex-1">
                <h1 className="text-3xl md:text-4xl font-bold mb-2">
                  {currentUser.displayName || 'User Profile'}
                </h1>
                <p className="text-blue-100 text-lg mb-4">{currentUser.email}</p>
                <div className="flex flex-wrap justify-center md:justify-start gap-4">
                  <span className={`inline-flex px-4 py-2 rounded-full text-sm font-medium ${
                    currentUser.role === 'admin'
                      ? 'bg-purple-500 bg-opacity-20 text-purple-100 border border-purple-300'
                      : currentUser.role === 'employee'
                      ? 'bg-blue-500 bg-opacity-20 text-blue-100 border border-blue-300'
                      : 'bg-green-500 bg-opacity-20 text-green-100 border border-green-300'
                  }`}>
                    <Shield className="w-4 h-4 mr-2" />
                    {currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1)}
                  </span>
                  <span className="inline-flex px-4 py-2 rounded-full text-sm font-medium bg-white bg-opacity-20 text-white border border-white border-opacity-30">
                    <Calendar className="w-4 h-4 mr-2" />
                    Joined {new Date(currentUser.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 flex items-center backdrop-blur-sm border border-white border-opacity-30"
                >
                  <Edit className="w-5 h-5 mr-2" />
                  Edit Profile
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Profile Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Personal Information */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Personal Information</h2>
              
              {!isEditing ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-6">
                    <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-xl">
                      <Mail className="w-6 h-6 text-blue-600" />
                      <div>
                        <p className="text-sm font-medium text-gray-500">Email Address</p>
                        <p className="text-gray-900 font-medium">{currentUser.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-xl">
                      <User className="w-6 h-6 text-green-600" />
                      <div>
                        <p className="text-sm font-medium text-gray-500">Display Name</p>
                        <p className="text-gray-900 font-medium">
                          {currentUser.displayName || 'Not set'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-xl">
                      <Phone className="w-6 h-6 text-purple-600" />
                      <div>
                        <p className="text-sm font-medium text-gray-500">Phone Number</p>
                        <p className="text-gray-900 font-medium">
                          {currentUser.phone || 'Not provided'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="flex items-start space-x-4 p-4 bg-gray-50 rounded-xl">
                      <MapPin className="w-6 h-6 text-red-600 mt-1" />
                      <div>
                        <p className="text-sm font-medium text-gray-500">Address</p>
                        <p className="text-gray-900 font-medium">
                          {currentUser.address || 'Not provided'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-xl">
                      <Briefcase className="w-6 h-6 text-orange-600" />
                      <div>
                        <p className="text-sm font-medium text-gray-500">Company</p>
                        <p className="text-gray-900 font-medium">
                          {currentUser.company || 'Not provided'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-xl">
                      <Globe className="w-6 h-6 text-teal-600" />
                      <div>
                        <p className="text-sm font-medium text-gray-500">Website</p>
                        <p className="text-gray-900 font-medium">
                          {currentUser.website ? (
                            <a href={currentUser.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                              {currentUser.website}
                            </a>
                          ) : (
                            'Not provided'
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Display Name
                      </label>
                      <input
                        type="text"
                        value={formData.displayName}
                        onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter your display name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter your phone number"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Company
                      </label>
                      <input
                        type="text"
                        value={formData.company}
                        onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter your company name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Website
                      </label>
                      <input
                        type="url"
                        value={formData.website}
                        onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="https://yourwebsite.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Address
                    </label>
                    <textarea
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter your address"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Bio
                    </label>
                    <textarea
                      value={formData.bio}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Tell us about yourself..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={currentUser.email}
                      disabled
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 text-gray-500"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Email address cannot be changed
                    </p>
                  </div>
                  
                  <div className="flex space-x-4 pt-6">
                    <button
                      type="button"
                      onClick={handleCancel}
                      className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 py-3 px-6 rounded-xl font-medium transition-colors flex items-center justify-center"
                    >
                      <X className="w-5 h-5 mr-2" />
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center justify-center"
                    >
                      {loading ? (
                        'Updating...'
                      ) : (
                        <>
                          <Save className="w-5 h-5 mr-2" />
                          Save Changes
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>

          {/* Account Summary */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Account Summary</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-600">Account Status</span>
                  <span className="text-sm font-bold text-green-600">Active</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-600">Member Since</span>
                  <span className="text-sm font-bold text-gray-900">
                    {new Date(currentUser.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-600">Role</span>
                  <span className="text-sm font-bold text-purple-600 capitalize">
                    {currentUser.role}
                  </span>
                </div>
              </div>
            </div>

            {currentUser.bio && (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">About</h3>
                <p className="text-gray-600 leading-relaxed">{currentUser.bio}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;