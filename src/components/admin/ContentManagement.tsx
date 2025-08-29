import React, { useState, useEffect } from 'react';
import { ref, onValue, set, push } from 'firebase/database';
import { database } from '../../config/firebase';
import { useAuth } from '../../context/AuthContext';
import { SiteContent } from '../../types';
import { Edit, Save, X, Plus, Trash2, Globe } from 'lucide-react';
import toast from 'react-hot-toast';

const ContentManagement: React.FC = () => {
  const [content, setContent] = useState<SiteContent[]>([]);
  const [editingContent, setEditingContent] = useState<SiteContent | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newContent, setNewContent] = useState({
    section: 'header' as 'header' | 'footer' | 'hero' | 'about',
    key: '',
    value: '',
  });
  const { currentUser } = useAuth();

  useEffect(() => {
    const contentRef = ref(database, 'siteContent');
    const unsubscribe = onValue(contentRef, (snapshot) => {
      if (snapshot.exists()) {
        const contentData = snapshot.val();
        const contentList: SiteContent[] = Object.keys(contentData).map(key => ({
          id: key,
          ...contentData[key],
        }));
        setContent(contentList.sort((a, b) => a.section.localeCompare(b.section)));
      } else {
        setContent([]);
      }
    });

    return () => unsubscribe();
  }, []);

  const saveContent = async (contentItem: SiteContent) => {
    setLoading(true);
    try {
      const contentRef = ref(database, `siteContent/${contentItem.id}`);
      await set(contentRef, {
        ...contentItem,
        updatedAt: new Date().toISOString(),
        updatedBy: currentUser?.email || 'admin',
      });
      
      toast.success('Content updated successfully!');
      setEditingContent(null);
    } catch (error) {
      toast.error('Failed to update content');
      console.error('Error updating content:', error);
    } finally {
      setLoading(false);
    }
  };

  const addNewContent = async () => {
    if (!newContent.key || !newContent.value) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const contentRef = ref(database, 'siteContent');
      await push(contentRef, {
        section: newContent.section,
        key: newContent.key,
        value: newContent.value,
        updatedAt: new Date().toISOString(),
        updatedBy: currentUser?.email || 'admin',
      });
      
      toast.success('Content added successfully!');
      setNewContent({ section: 'header', key: '', value: '' });
      setShowAddForm(false);
    } catch (error) {
      toast.error('Failed to add content');
      console.error('Error adding content:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteContent = async (contentId: string) => {
    if (confirm('Are you sure you want to delete this content?')) {
      try {
        const contentRef = ref(database, `siteContent/${contentId}`);
        await set(contentRef, null);
        toast.success('Content deleted successfully!');
      } catch (error) {
        toast.error('Failed to delete content');
        console.error('Error deleting content:', error);
      }
    }
  };

  const groupedContent = content.reduce((acc, item) => {
    if (!acc[item.section]) {
      acc[item.section] = [];
    }
    acc[item.section].push(item);
    return acc;
  }, {} as Record<string, SiteContent[]>);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Content Management</h2>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Content
        </button>
      </div>

      {/* Add Content Form */}
      {showAddForm && (
        <div className="bg-white p-6 rounded-lg shadow-md border">
          <h3 className="text-lg font-semibold mb-4">Add New Content</h3>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Section
              </label>
              <select
                value={newContent.section}
                onChange={(e) => setNewContent({ ...newContent, section: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="header">Header</option>
                <option value="footer">Footer</option>
                <option value="hero">Hero</option>
                <option value="about">About</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Key
              </label>
              <input
                type="text"
                value={newContent.key}
                onChange={(e) => setNewContent({ ...newContent, key: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., company_name, tagline"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Value
              </label>
              <input
                type="text"
                value={newContent.value}
                onChange={(e) => setNewContent({ ...newContent, value: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Content value"
              />
            </div>
          </div>
          <div className="flex space-x-4 mt-4">
            <button
              onClick={() => setShowAddForm(false)}
              className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={addNewContent}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              {loading ? 'Adding...' : 'Add Content'}
            </button>
          </div>
        </div>
      )}

      {/* Content Sections */}
      {Object.entries(groupedContent).map(([section, items]) => (
        <div key={section} className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b">
            <div className="flex items-center">
              <Globe className="w-5 h-5 text-gray-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900 capitalize">{section}</h3>
              <span className="ml-2 bg-gray-200 text-gray-700 px-2 py-1 rounded-full text-xs">
                {items.length} items
              </span>
            </div>
          </div>
          
          <div className="divide-y divide-gray-200">
            {items.map((item) => (
              <div key={item.id} className="p-6">
                {editingContent?.id === item.id ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Key
                      </label>
                      <input
                        type="text"
                        value={editingContent.key}
                        onChange={(e) => setEditingContent({ ...editingContent, key: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Value
                      </label>
                      <textarea
                        value={editingContent.value}
                        onChange={(e) => setEditingContent({ ...editingContent, value: e.target.value })}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => saveContent(editingContent)}
                        disabled={loading}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        {loading ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        onClick={() => setEditingContent(null)}
                        className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-lg font-medium transition-colors flex items-center"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <h4 className="text-sm font-medium text-gray-900">{item.key}</h4>
                        <span className="ml-2 bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                          {item.section}
                        </span>
                      </div>
                      <p className="text-gray-700 mb-2">{item.value}</p>
                      <p className="text-xs text-gray-500">
                        Last updated: {new Date(item.updatedAt).toLocaleString()} by {item.updatedBy}
                      </p>
                    </div>
                    <div className="flex space-x-2 ml-4">
                      <button
                        onClick={() => setEditingContent(item)}
                        className="text-blue-600 hover:text-blue-900 p-1"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteContent(item.id)}
                        className="text-red-600 hover:text-red-900 p-1"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      {content.length === 0 && (
        <div className="text-center py-12">
          <Globe className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No content found</h3>
          <p className="text-gray-600 mb-4">Start by adding some content to manage your site.</p>
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Add First Content
          </button>
        </div>
      )}
    </div>
  );
};

export default ContentManagement;