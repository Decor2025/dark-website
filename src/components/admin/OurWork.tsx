import React, { useEffect, useState, useRef } from "react";
import { database as db } from "../../config/firebase";
import { ref, onValue, push, update, remove } from "firebase/database";
import { uploadToCloudinary } from "../../config/cloudinary";

interface WorkItem {
  id?: string;
  url?: string;
  videoUrl?: string;
  caption?: string;
  type: "image" | "youtube" | "social";
}

const OurWorkAdmin: React.FC = () => {
  const [items, setItems] = useState<WorkItem[]>([]);
  const [form, setForm] = useState<WorkItem>({
    url: "",
    videoUrl: "",
    caption: "",
    type: "image",
  });
  const [editId, setEditId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    const unsubscribe = onValue(ref(db, "ourWork"), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const arr = Object.keys(data).map((key) => {
          const item = data[key];
          // Migrate old video items to proper types
          if (item.type === "video") {
            return {
              id: key,
              ...item,
              type: isYouTubeUrl(item.videoUrl) ? "youtube" : "social"
            };
          }
          return { id: key, ...item };
        });
        setItems(arr);
      } else {
        setItems([]);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const isYouTubeUrl = (url: string) => {
    return url.includes("youtube.com") || url.includes("youtu.be");
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files[0]);
      e.dataTransfer.clearData();
    }
  };

  const handleFileUpload = async (file: File) => {
    setUploading(true);
    try {
      const url = await uploadToCloudinary(file);
      setForm((prev) => ({ ...prev, url }));
    } catch (err) {
      alert("Upload failed. Try again.");
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileUpload(e.target.files[0]);
    }
  };

  const resetForm = () => {
    setForm({ url: "", videoUrl: "", caption: "", type: "image" });
    setEditId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation based on media type
    if (form.type === "image" && !form.url) {
      alert("Please upload an image.");
      return;
    }
    
    if (form.type === "youtube" && !form.videoUrl) {
      alert("Please enter a YouTube URL.");
      return;
    }
    
    if (form.type === "social") {
      if (!form.videoUrl) {
        alert("Please enter a social media URL.");
        return;
      }
      if (!form.url) {
        alert("Please upload a thumbnail for social media video.");
        return;
      }
    }

    const payload: Omit<WorkItem, 'id'> = {
      type: form.type,
      caption: form.caption || "",
      url: form.url || undefined,
      videoUrl: form.videoUrl || undefined
    };

    try {
      if (editId) {
        await update(ref(db, `ourWork/${editId}`), payload);
        alert("Updated successfully");
      } else {
        await push(ref(db, "ourWork"), payload);
        alert("Added successfully");
      }
      resetForm();
    } catch (error) {
      alert("Error saving data");
      console.error(error);
    }
  };

  const handleEdit = (item: WorkItem & { id: string }) => {
    setEditId(item.id);
    setForm({
      url: item.url || "",
      videoUrl: item.videoUrl || "",
      caption: item.caption || "",
      type: item.type,
    });
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this item?")) {
      try {
        await remove(ref(db, `ourWork/${id}`));
        alert("Deleted successfully");
        if (editId === id) resetForm();
      } catch (error) {
        alert("Error deleting item");
        console.error(error);
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-3xl font-bold mb-8 text-center">Add to Our Work</h2>

      <form
        onSubmit={handleSubmit}
        onDragEnter={handleDragEnter}
        onDragOver={(e) => e.preventDefault()}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className="space-y-6"
      >
        {/* Type selector */}
        <div>
          <label className="block mb-2 font-semibold">Content Type</label>
          <select
            className="w-full border rounded p-2"
            value={form.type}
            onChange={(e) =>
              setForm({
                url: "",
                videoUrl: "",
                caption: "",
                type: e.target.value as WorkItem['type'],
              })
            }
          >
            <option value="image">Image</option>
            <option value="youtube">YouTube Video</option>
            <option value="social">Social Media Video (Instagram/Facebook)</option>
          </select>
        </div>

        {/* Image Upload (for image or social video thumbnail) */}
        {(form.type === "image" || form.type === "social") && (
          <div>
            <label className="block mb-2 font-semibold">
              {form.type === "social" ? "Upload Thumbnail" : "Upload Image"}
            </label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className={`cursor-pointer border-4 border-dashed rounded-lg p-8 text-center transition ${
                dragActive ? "border-blue-500 bg-blue-50" : "border-gray-300 bg-gray-50 hover:border-blue-400"
              }`}
            >
              {uploading ? (
                <div className="flex flex-col items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mb-2"></div>
                  <p className="text-blue-600 font-semibold">Uploading...</p>
                </div>
              ) : form.url ? (
                <img
                  src={form.url}
                  alt="Uploaded"
                  className="mx-auto max-h-52 object-contain rounded"
                />
              ) : (
                <div className="flex flex-col items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  <p className="text-gray-600 mb-2">Drag & drop or click to upload</p>
                  <p className="text-sm text-gray-400">PNG, JPG, JPEG max 5MB</p>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                ref={fileInputRef}
                onChange={onFileChange}
              />
            </div>
          </div>
        )}

        {/* Video URL Input */}
        {(form.type === "youtube" || form.type === "social") && (
          <div>
            <label className="block mb-2 font-semibold">
              {form.type === "youtube" ? "YouTube Video URL" : "Social Media Video URL"}
            </label>
            <input
              type="text"
              className="w-full border rounded p-2"
              placeholder={
                form.type === "youtube" 
                  ? "https://www.youtube.com/watch?v=..." 
                  : "https://www.instagram.com/reel/... or https://www.facebook.com/watch/..."
              }
              value={form.videoUrl}
              onChange={(e) => setForm({ ...form, videoUrl: e.target.value })}
            />
            {form.type === "social" && (
              <p className="text-sm text-gray-600 mt-2">
                <span className="font-medium">Note:</span> For Instagram/Facebook videos, 
                we require a thumbnail because these platforms don't allow direct embedding.
              </p>
            )}
          </div>
        )}

        {/* Caption */}
        <div>
          <label className="block mb-2 font-semibold">Caption (Optional)</label>
          <input
            type="text"
            className="w-full border rounded p-2"
            placeholder="Enter caption"
            value={form.caption}
            onChange={(e) => setForm({ ...form, caption: e.target.value })}
          />
        </div>

        {/* Buttons */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={uploading}
            className={`flex-1 py-2 rounded transition ${
              uploading 
                ? "bg-gray-400 cursor-not-allowed" 
                : "bg-green-600 hover:bg-green-700 text-white"
            }`}
          >
            {editId ? "Update Item" : "Add Item"}
          </button>
          {editId && (
            <button
              type="button"
              onClick={resetForm}
              className="flex-1 bg-gray-300 py-2 rounded hover:bg-gray-400 transition"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      <h3 className="text-2xl font-semibold mt-12 mb-6">Current Items</h3>

      {loading && (
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mx-auto"></div>
        </div>
      )}
      
      {!loading && items.length === 0 && (
        <p className="text-center text-gray-500 py-8 border rounded">No items found</p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((item) => (
          <div 
            key={item.id} 
            className="border rounded-lg shadow-sm overflow-hidden hover:shadow-md transition"
          >
            <div className="p-4 bg-gray-50 border-b">
              <div className="flex items-center mb-2">
                <span className={`inline-block px-2 py-1 text-xs rounded ${
                  item.type === "image" 
                    ? "bg-blue-100 text-blue-800" 
                    : item.type === "youtube" 
                      ? "bg-red-100 text-red-800" 
                      : "bg-purple-100 text-purple-800"
                }`}>
                  {item.type === "image" ? "Image" : item.type === "youtube" ? "YouTube" : "Social Media"}
                </span>
              </div>
              
              {item.url && (
                <div className="aspect-video bg-gray-200 rounded-md overflow-hidden mb-3">
                  <img
                    src={item.url}
                    alt={item.caption || "Thumbnail"}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              
              {item.videoUrl && !item.url && (
                <div className="aspect-video bg-gray-200 rounded-md flex items-center justify-center mb-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
              
              <p className="text-gray-700 mb-1 truncate">
                <span className="font-medium">URL:</span> {item.url ? "Uploaded" : "None"}
              </p>
              
              {item.videoUrl && (
                <p className="text-gray-700 mb-3 truncate">
                  <span className="font-medium">Video:</span> 
                  <a 
                    href={item.videoUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline ml-1"
                  >
                    {item.videoUrl.substring(0, 30)}...
                  </a>
                </p>
              )}
              
              {item.caption && (
                <p className="text-gray-800 font-medium truncate">{item.caption}</p>
              )}
            </div>
            
            <div className="p-3 bg-white flex justify-end space-x-2">
              <button
                onClick={() => item.id && handleEdit(item as WorkItem & { id: string })}
                className="px-3 py-1.5 bg-yellow-500 hover:bg-yellow-600 text-white rounded text-sm"
              >
                Edit
              </button>
              <button
                onClick={() => item.id && handleDelete(item.id)}
                className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded text-sm"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OurWorkAdmin;