// RedirectManager.jsx
import { useState, useEffect } from 'react';
import { 
  ref, 
  onValue, 
  set, 
  remove,
  off 
} from 'firebase/database';
import { database as db } from '../../config/firebase';

const RedirectManager = () => {
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newSlug, setNewSlug] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [toast, setToast] = useState({ show: false, message: '', type: '' });

  // Show toast notification
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: '' }), 3000);
  };

  // Copy to clipboard
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
      .then(() => showToast('Copied to clipboard', 'success'))
      .catch(() => showToast('Failed to copy', 'error'));
  };

  // Load redirects from Firebase
  useEffect(() => {
    const redirectsRef = ref(db, 'redirects');
    
    const unsubscribe = onValue(redirectsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const linksArray = Object.entries(data).map(([slug, url]) => ({ slug, url }));
        setLinks(linksArray);
      } else {
        setLinks([]);
      }
      setLoading(false);
    });

    // Cleanup listener on unmount
    return () => off(redirectsRef, 'value', unsubscribe);
  }, []);

  // Add new redirect
  const addRedirect = (e) => {
    e.preventDefault();
    if (!newSlug || !newUrl) {
      showToast('Both fields are required', 'error');
      return;
    }

    set(ref(db, `redirects/${newSlug}`), newUrl)
      .then(() => {
        showToast('Redirect added successfully');
        setNewSlug('');
        setNewUrl('');
      })
      .catch((error) => {
        showToast(error.message, 'error');
      });
  };

  // Update redirect
  const updateRedirect = (oldSlug, newSlug, newUrl) => {
    if (!newSlug || !newUrl) {
      showToast('Both fields are required', 'error');
      return;
    }

    // If slug changed, remove old and create new
    const updates = {};
    if (oldSlug !== newSlug) {
      updates[`redirects/${oldSlug}`] = null;
    }
    updates[`redirects/${newSlug}`] = newUrl;

    set(ref(db), updates)
      .then(() => showToast('Redirect updated'))
      .catch((error) => showToast(error.message, 'error'));
  };

  // Delete redirect
  const deleteRedirect = (slug) => {
    if (window.confirm('Are you sure you want to delete this redirect?')) {
      remove(ref(db, `redirects/${slug}`))
        .then(() => showToast('Redirect deleted'))
        .catch((error) => showToast(error.message, 'error'));
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden p-6">
      <h1 className="text-xl font-medium text-gray-800 mb-6">Redirect Manager</h1>
      
      {/* Add New Redirect Form */}
      <form onSubmit={addRedirect} className="space-y-3 mb-6">
        <h2 className="text-lg font-medium text-gray-800">Add New Redirect</h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
          <div className="md:col-span-2">
            <input
              type="text"
              placeholder="Slug"
              value={newSlug}
              onChange={(e) => setNewSlug(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="md:col-span-2">
            <input
              type="url"
              placeholder="Destination URL"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 px-3 rounded-lg hover:bg-blue-700 transition h-[40px]"
            >
              Add
            </button>
          </div>
        </div>
      </form>

      {/* Redirects List */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-medium text-gray-800">Your Redirects</h2>
          <span className="bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded">
            {links.length} {links.length === 1 ? 'link' : 'links'}
          </span>
        </div>

        {loading ? (
          // Skeleton loading
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="animate-pulse bg-white p-4 rounded-lg border border-gray-200">
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-3"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="flex space-x-2">
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : links.length === 0 ? (
          // Empty state
          <div className="text-center py-8">
            <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <i className="fas fa-link text-gray-400 text-xl"></i>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">No redirects created</h3>
            <p className="text-gray-500">Add a new redirect using the form above</p>
          </div>
        ) : (
          // Links list
          <div className="space-y-3">
            {links.map(({ slug, url }) => (
              <RedirectItem
                key={slug}
                slug={slug}
                url={url}
                onUpdate={updateRedirect}
                onDelete={deleteRedirect}
                onCopy={copyToClipboard}
              />
            ))}
          </div>
        )}
      </div>

      {/* Toast Notification */}
      {toast.show && (
        <div className={`fixed bottom-4 right-4 px-4 py-3 rounded-lg shadow max-w-xs transition-transform duration-300 ${
          toast.type === 'error' ? 'bg-red-600' : 'bg-gray-800'
        } text-white`}>
          <div className="flex items-start">
            <i className={`fas ${
              toast.type === 'error' ? 'fa-exclamation-circle' : 'fa-check-circle'
            } mt-1 mr-3`}></i>
            <p className="text-sm">{toast.message}</p>
          </div>
        </div>
      )}
    </div>
  );
};

// Individual Redirect Item Component
const RedirectItem = ({ slug, url, onUpdate, onDelete, onCopy }) => {
  const [editSlug, setEditSlug] = useState(slug);
  const [editUrl, setEditUrl] = useState(url);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = () => {
    setIsSaving(true);
    onUpdate(slug, editSlug, editUrl);
    setIsEditing(false);
    setIsSaving(false);
  };

  const fullUrl = `https://decordrapesinstyle.com/virtual/${slug}`;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex justify-between items-start mb-3">
        <div>
          <div className="font-medium text-gray-800">/{slug}</div>
          <a
            href={fullUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 hover:underline block mt-1"
          >
            {url.length > 55 ? `${url.slice(0, 55)}...` : url}
          </a>
        </div>

        <div className="flex items-center gap-2 mt-1">
          {/* External Link Icon */}
          <a
            href={fullUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-500 hover:text-blue-600 text-sm flex items-center"
            title="Open link"
          >
            <i className="fas fa-external-link-alt"></i>
          </a>

          {/* Copy URL Button */}
          <button
            onClick={() => onCopy(url)}
            className="text-gray-500 hover:text-green-600 text-sm flex items-center focus:outline-none"
            title="Copy URL"
          >
            <i className="fas fa-copy"></i>
          </button>
        </div>
      </div>

      {/* QR Code Section */}
      <div className="mb-3">
        <img
          src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(fullUrl)}`}
          alt={`QR for ${slug}`}
          className="w-24 h-24 border rounded"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <input
          type="text"
          value={isEditing ? editSlug : slug}
          onChange={(e) => setEditSlug(e.target.value)}
          readOnly={!isEditing}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <input
          type="url"
          value={isEditing ? editUrl : url}
          onChange={(e) => setEditUrl(e.target.value)}
          readOnly={!isEditing}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <div className="flex justify-end space-x-2 mt-3">
        {isEditing ? (
          <>
            <button
              onClick={() => {
                setIsEditing(false);
                setEditSlug(slug);
                setEditUrl(url);
              }}
              className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded-md hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 flex items-center"
            >
              {isSaving ? (
                <i className="fas fa-spinner animate-spin mr-1"></i>
              ) : null}
              Save
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => onDelete(slug)}
              className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded-md hover:bg-gray-200"
            >
              Delete
            </button>
            <button
              onClick={() => setIsEditing(true)}
              className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
            >
              Edit
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default RedirectManager;