import React, { useState, useEffect } from 'react';
import { ref, onValue, set, push, remove } from 'firebase/database';
import { database } from '../../config/firebase';
import { uploadToCloudinary } from '../../config/cloudinary';
import { useAuth } from '../../context/AuthContext';
import { SiteSettings, TeamMember } from '../../types';
import { 
  Settings, 
  Plus, 
  Edit, 
  Trash2, 
  Upload, 
  Globe, 
  Users, 
  Phone, 
  Store,
  Eye,
  EyeOff,
  Camera,
  Menu
} from 'lucide-react';
import toast from 'react-hot-toast';

const SettingsManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState<SiteSettings[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [showMemberForm, setShowMemberForm] = useState(false);
  const { currentUser } = useAuth();
  const [imageLoading, setImageLoading] = useState<Record<string, boolean>>({});
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const [memberForm, setMemberForm] = useState({
    name: '',
    position: '',
    bio: '',
    email: '',
    linkedin: '',
    twitter: '',
    imageFile: null as File | null,
    isActive: true,
  });

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
      } else {
        // Initialize default settings
        initializeDefaultSettings();
      }
    });

    // Load team members
    const teamRef = ref(database, 'teamMembers');
    const unsubscribeTeam = onValue(teamRef, (snapshot) => {
      if (snapshot.exists()) {
        const teamData = snapshot.val();
        const teamList: TeamMember[] = Object.keys(teamData).map(key => ({
          id: key,
          ...teamData[key],
        }));
        setTeamMembers(teamList.sort((a, b) => a.order - b.order));
      }
    });

    return () => {
      unsubscribeSettings();
      unsubscribeTeam();
    };
  }, []);

  const initializeDefaultSettings = async () => {
    const defaultSettings = [
      {
        category: "general",
        key: "site_title",
        value: "Shop",
        type: "text",
        label: "Title",
      },
      {
        category: "general",
        key: "site_description",
        value: "Your trusted business partner",
        type: "textarea",
        label: "Tagline",
      },
      {
        category: "general",
        key: "site_logo",
        value: "",
        type: "image",
        label: "Site Logo",
      },
      {
        category: "general",
        key: "favicon",
        value: "",
        type: "image",
        label: "Favicon",
      },
      {
        category: "store",
        key: "store_name",
        value: "Shop",
        type: "text",
        label: "Store Name",
      },
      {
        category: "store",
        key: "store_tagline",
        value: "Quality products for your business",
        type: "text",
        label: "Store Tagline",
      },
      {
        category: "store",
        key: "store_hours",
        value: "Mon-Fri: 9AM-6PM, Sat: 10AM-4PM, Sun: Closed",
        type: "textarea",
        label: "Store Hours",
      },
      {
        category: "store",
        key: "store_address",
        value: "123 Business Street, City, State 12345",
        type: "textarea",
        label: "Store Address",
      },
      {
        category: "contact",
        key: "primary_email",
        value: "contact@shop.com",
        type: "email",
        label: "Primary Email",
      },
      {
        category: "contact",
        key: "support_email",
        value: "support@shop.com",
        type: "email",
        label: "Support Email",
      },
      {
        category: "contact",
        key: "primary_phone",
        value: "+1 (555) 123-4567",
        type: "text",
        label: "Primary Phone",
      },
      {
        category: "contact",
        key: "secondary_phone",
        value: "+1 (555) 987-6543",
        type: "text",
        label: "Secondary Phone",
      },
      {
        category: "social",
        key: "facebook_url",
        value: "",
        type: "url",
        label: "Facebook URL",
      },
      {
        category: "social",
        key: "twitter_url",
        value: "",
        type: "url",
        label: "Twitter URL",
      },
      {
        category: "social",
        key: "instagram_url",
        value: "",
        type: "url",
        label: "Instagram URL",
      },
      {
        category: "social",
        key: "linkedin_url",
        value: "",
        type: "url",
        label: "LinkedIn URL",
      },
      {
        category: "seo",
        key: "meta_keywords",
        value: "shop, business, products, quality",
        type: "textarea",
        label: "Meta Keywords",
      },
      {
        category: "seo",
        key: "meta_description",
        value: "Your trusted business partner providing premium products and exceptional service.",
        type: "textarea",
        label: "Meta Description",
      },
      {
        category: "seo",
        key: "google_analytics",
        value: "",
        type: "text",
        label: "Google Analytics ID",
      },
      {
        category: "general",
        key: "hero_image",
        value: "",
        type: "image",
        label: "Hero Section Image",
      },
      {
        category: "general",
        key: "hero_heading",
        value: "Build Your Dream Interior House",
        type: "text",
        label: "Hero Heading",
      },
      {
        category: "general",
        key: "hero_tagline",
        value: "Launch an elegant, high‑performance e‑commerce site in minutes. Free estimate, secure payments, and 24/7 support included.",
        type: "textarea",
        label: "Hero Tagline",
      },
    ];

    const settingsRef = ref(database, 'siteSettings');
    for (const setting of defaultSettings) {
      const newSettingRef = push(settingsRef);
      await set(newSettingRef, {
        ...setting,
        updatedAt: new Date().toISOString(),
        updatedBy: currentUser?.email || 'system',
      });
    }
  };

  const updateSetting = async (settingId: string, value: string, imageFile?: File) => {
    setLoading(true);
    try {
      let finalValue = value;

      if (imageFile) {
        setImageLoading(prev => ({ ...prev, [settingId]: true }));
        finalValue = await uploadToCloudinary(imageFile);
      }

      const setting = settings.find(s => s.id === settingId);
      if (setting) {
        const settingRef = ref(database, `siteSettings/${settingId}`);
        await set(settingRef, {
          ...setting,
          value: finalValue,
          updatedAt: new Date().toISOString(),
          updatedBy: currentUser?.email || 'admin',
        });
        toast.success('Setting updated successfully!');
      }
    } catch (error) {
      toast.error('Failed to update setting');
      console.error('Error updating setting:', error);
    } finally {
      if (imageFile) {
        setImageLoading(prev => ({ ...prev, [settingId]: false }));
      }
      setLoading(false);
    }
  }

  const handleMemberSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let imageUrl = editingMember?.image || '';
      
      if (memberForm.imageFile) {
        imageUrl = await uploadToCloudinary(memberForm.imageFile);
      }

      const memberData = {
        name: memberForm.name,
        position: memberForm.position,
        bio: memberForm.bio,
        email: memberForm.email,
        linkedin: memberForm.linkedin,
        twitter: memberForm.twitter,
        image: imageUrl,
        isActive: memberForm.isActive,
        order: editingMember?.order || teamMembers.length + 1,
        updatedAt: new Date().toISOString(),
        ...(editingMember ? {} : { createdAt: new Date().toISOString() }),
      };

      if (editingMember) {
        const memberRef = ref(database, `teamMembers/${editingMember.id}`);
        await set(memberRef, memberData);
        toast.success('Team member updated successfully!');
      } else {
        const teamRef = ref(database, 'teamMembers');
        await push(teamRef, memberData);
        toast.success('Team member added successfully!');
      }

      resetMemberForm();
    } catch (error) {
      toast.error('Failed to save team member');
      console.error('Error saving team member:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteMember = async (memberId: string) => {
    if (confirm('Are you sure you want to delete this team member?')) {
      try {
        const memberRef = ref(database, `teamMembers/${memberId}`);
        await remove(memberRef);
        toast.success('Team member deleted successfully!');
      } catch (error) {
        toast.error('Failed to delete team member');
        console.error('Error deleting team member:', error);
      }
    }
  };

  const resetMemberForm = () => {
    setMemberForm({
      name: '',
      position: '',
      bio: '',
      email: '',
      linkedin: '',
      twitter: '',
      imageFile: null,
      isActive: true,
    });
    setEditingMember(null);
    setShowMemberForm(false);
  };

  const editMember = (member: TeamMember) => {
    setEditingMember(member);
    setMemberForm({
      name: member.name,
      position: member.position,
      bio: member.bio,
      email: member.email || '',
      linkedin: member.linkedin || '',
      twitter: member.twitter || '',
      imageFile: null,
      isActive: member.isActive,
    });
    setShowMemberForm(true);
  };

  const tabs = [
    { id: 'general', label: 'General', icon: Globe },
    { id: 'store', label: 'Store Info', icon: Store },
    { id: 'contact', label: 'Contact', icon: Phone },
    { id: 'social', label: 'Social Media', icon: Globe },
    { id: 'seo', label: 'SEO', icon: Settings },
    { id: 'team', label: 'Team', icon: Users },
  ];

  const renderSettingField = (setting: SiteSettings) => {
    switch (setting.type) {
      case 'textarea':
        return (
          <textarea
            defaultValue={setting.value}
            onBlur={(e) => updateSetting(setting.id, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
          />
        );
      case 'image':
        return (
          <div className="space-y-2">
            {setting.value && (
              <img
                src={setting.value}
                alt={setting.label}
                className="w-32 h-32 object-cover rounded-lg border"
              />
            )}
            <label
              htmlFor={`file-input-${setting.id}`}
              className={`inline-flex items-center px-4 py-2 border rounded-md cursor-pointer 
                ${
                  imageLoading[setting.id]
                    ? "opacity-50 cursor-wait"
                    : "hover:bg-gray-100"
                }
              `}
            >
              {imageLoading[setting.id]
                ? "Uploading…"
                : setting.value
                ? "Change Image"
                : "Upload Image"}
              <Upload className="w-4 h-4 ml-2" />
            </label>
            <input
              id={`file-input-${setting.id}`}
              type="file"
              accept="image/*"
              className="hidden"
              disabled={imageLoading[setting.id]}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  updateSetting(setting.id, setting.value, file);
                }
              }}
            />
          </div>
        );
      case 'boolean':
        return (
          <label className="flex items-center">
            <input
              type="checkbox"
              defaultChecked={setting.value === 'true'}
              onChange={(e) => updateSetting(setting.id, e.target.checked.toString())}
              className="mr-2"
            />
            Enable
          </label>
        );
      default:
        return (
          <input
            type={setting.type}
            defaultValue={setting.value}
            onBlur={(e) => updateSetting(setting.id, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        );
    }
  };

  const renderTabContent = () => {
    if (activeTab === 'team') {
      return (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h3 className="text-lg font-semibold">Team Management</h3>
            <button
              onClick={() => setShowMemberForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg font-medium transition-colors flex items-center whitespace-nowrap"
            >
              <Plus className="w-4 h-4 mr-1 sm:mr-2" />
              <span className="text-sm sm:text-base">Add Team Member</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {teamMembers.map((member) => (
              <div key={member.id} className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
                <div className="text-center">
                  <img
                    src={member.image || 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg'}
                    alt={member.name}
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover mx-auto mb-3 sm:mb-4"
                  />
                  <h4 className="text-base sm:text-lg font-semibold">{member.name}</h4>
                  <p className="text-blue-600 text-sm sm:text-base font-medium">{member.position}</p>
                  <p className="text-gray-600 text-xs sm:text-sm mt-1 sm:mt-2 line-clamp-3">{member.bio}</p>
                  
                  <div className="flex items-center justify-center mt-3 sm:mt-4 space-x-1 sm:space-x-2">
                    {member.isActive ? (
                      <Eye className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" />
                    ) : (
                      <EyeOff className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
                    )}
                    <span className={`text-xs sm:text-sm ${member.isActive ? 'text-green-600' : 'text-gray-400'}`}>
                      {member.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  <div className="flex space-x-2 mt-3 sm:mt-4">
                    <button
                      onClick={() => editMember(member)}
                      className="flex-1 bg-blue-100 hover:bg-blue-200 text-blue-700 py-1.5 px-2 sm:py-2 sm:px-3 rounded-lg font-medium transition-colors flex items-center justify-center text-xs sm:text-sm"
                    >
                      <Edit className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                      Edit
                    </button>
                    <button
                      onClick={() => deleteMember(member.id)}
                      className="flex-1 bg-red-100 hover:bg-red-200 text-red-700 py-1.5 px-2 sm:py-2 sm:px-3 rounded-lg font-medium transition-colors flex items-center justify-center text-xs sm:text-sm"
                    >
                      <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {showMemberForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
              <div className="bg-white rounded-lg w-full max-w-md mx-2 sm:mx-0 p-3 sm:p-6 max-h-[90vh] overflow-y-auto">
                <h3 className="text-lg font-semibold mb-4">
                  {editingMember ? 'Edit Team Member' : 'Add Team Member'}
                </h3>
                
                <form onSubmit={handleMemberSubmit} className="space-y-3 sm:space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                      Profile Photo
                    </label>
                    <div className="flex items-center space-x-3 sm:space-x-4">
                      {(memberForm.imageFile || editingMember?.image) && (
                        <img
                          src={memberForm.imageFile ? URL.createObjectURL(memberForm.imageFile) : editingMember?.image}
                          alt="Preview"
                          className="w-12 h-12 sm:w-16 sm:h-16 rounded-full object-cover"
                        />
                      )}
                      <label className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg font-medium transition-colors cursor-pointer flex items-center text-xs sm:text-sm">
                        <Camera className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                        Choose Photo
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => setMemberForm({ ...memberForm, imageFile: e.target.files?.[0] || null })}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                    <input
                      type="text"
                      required
                      value={memberForm.name}
                      onChange={(e) => setMemberForm({ ...memberForm, name: e.target.value })}
                      className="w-full px-2.5 py-1.5 sm:px-3 sm:py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
                    <input
                      type="text"
                      required
                      value={memberForm.position}
                      onChange={(e) => setMemberForm({ ...memberForm, position: e.target.value })}
                      className="w-full px-2.5 py-1.5 sm:px-3 sm:py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                    <textarea
                      required
                      value={memberForm.bio}
                      onChange={(e) => setMemberForm({ ...memberForm, bio: e.target.value })}
                      className="w-full px-2.5 py-1.5 sm:px-3 sm:py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email (Optional)</label>
                    <input
                      type="email"
                      value={memberForm.email}
                      onChange={(e) => setMemberForm({ ...memberForm, email: e.target.value })}
                      className="w-full px-2.5 py-1.5 sm:px-3 sm:py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn URL (Optional)</label>
                    <input
                      type="url"
                      value={memberForm.linkedin}
                      onChange={(e) => setMemberForm({ ...memberForm, linkedin: e.target.value })}
                      className="w-full px-2.5 py-1.5 sm:px-3 sm:py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Twitter URL (Optional)</label>
                    <input
                      type="url"
                      value={memberForm.twitter}
                      onChange={(e) => setMemberForm({ ...memberForm, twitter: e.target.value })}
                      className="w-full px-2.5 py-1.5 sm:px-3 sm:py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={memberForm.isActive}
                        onChange={(e) => setMemberForm({ ...memberForm, isActive: e.target.checked })}
                        className="mr-2"
                      />
                      <span className="text-sm font-medium text-gray-700">Active (visible on website)</span>
                    </label>
                  </div>

                  <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4 pt-3 sm:pt-4">
                    <button
                      type="button"
                      onClick={resetMemberForm}
                      className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 py-1.5 sm:py-2 px-4 rounded-lg font-medium transition-colors text-sm sm:text-base"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-1.5 sm:py-2 px-4 rounded-lg font-medium transition-colors disabled:opacity-50 text-sm sm:text-base"
                    >
                      {loading ? 'Saving...' : editingMember ? 'Update' : 'Add'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      );
    }

    const filteredSettings = settings.filter(setting => setting.category === activeTab);

    return (
      <div className="space-y-4 sm:space-y-6">
        <h3 className="text-base sm:text-lg font-semibold capitalize">{activeTab} Settings</h3>
        
        <div className="grid gap-4 sm:gap-6">
          {filteredSettings.map((setting) => (
            <div key={setting.id} className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
              <div className="mb-3 sm:mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                  {setting.label}
                </label>
                {setting.description && (
                  <p className="text-xs sm:text-sm text-gray-500 mb-1 sm:mb-2">{setting.description}</p>
                )}
                {renderSettingField(setting)}
              </div>
              <div className="text-xs text-gray-500">
                Last updated: {new Date(setting.updatedAt).toLocaleString()} by {setting.updatedBy}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
          Settings Management
        </h2>
      </div>

      {/* Mobile Menu Button */}
      <div className="sm:hidden">
        <button
          onClick={() => setShowMobileMenu(!showMobileMenu)}
          className="w-full flex items-center justify-between bg-white p-3 rounded-lg shadow-md"
        >
          <div className="flex items-center">
            {tabs.find((tab) => tab.id === activeTab)?.icon &&
              React.createElement(
                tabs.find((tab) => tab.id === activeTab)
                  ?.icon as React.ComponentType<{ className?: string }>,
                { className: "w-4 h-4 mr-2" }
              )}
            <span>{tabs.find((tab) => tab.id === activeTab)?.label}</span>
          </div>
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Settings Tabs */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="border-b border-gray-200">
          <nav
            className={`${
              showMobileMenu ? "block" : "hidden"
            } sm:flex space-x-0 sm:space-x-8 px-0 sm:px-6 flex-col sm:flex-row`}
          >
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setShowMobileMenu(false);
                }}
                className={`py-3 px-4 sm:py-4 sm:px-2 border-b-0 sm:border-b-2 font-medium text-sm transition-colors flex items-center w-full text-left sm:w-auto ${
                  activeTab === tab.id
                    ? "bg-gray-50 text-blue-600 sm:bg-transparent sm:border-blue-500"
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-50 sm:hover:bg-transparent sm:hover:border-gray-300"
                }`}
              >
                <tab.icon className="w-4 h-4 mr-2" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-3 sm:p-6">{renderTabContent()}</div>
      </div>
    </div>
  );
};

export default SettingsManagement;