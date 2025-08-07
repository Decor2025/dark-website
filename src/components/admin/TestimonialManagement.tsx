import React, { useState, useEffect } from 'react';
import { ref, onValue, set, remove } from 'firebase/database';
import { database } from '../../config/firebase';
import { useAuth } from '../../context/AuthContext';
import { Testimonial } from '../../types';
import { Star, Check, X, Trash2, Eye, User } from 'lucide-react';
import toast from 'react-hot-toast';

const TestimonialManagement: React.FC = () => {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved'>('all');
  const [selectedTestimonial, setSelectedTestimonial] = useState<Testimonial | null>(null);
  const { currentUser } = useAuth();

  useEffect(() => {
    const testimonialsRef = ref(database, 'testimonials');
    const unsubscribe = onValue(testimonialsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const list: Testimonial[] = Object.keys(data).map((key) => ({
          id: key,
          ...data[key],
        }));
        setTestimonials(list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      } else {
        setTestimonials([]);
      }
    });

    return () => unsubscribe();
  }, []);

  const approveTestimonial = async (id: string) => {
    const testimonial = testimonials.find(t => t.id === id);
    if (testimonial) {
      try {
        await set(ref(database, `testimonials/${id}`), {
          ...testimonial,
          isApproved: true,
          approvedAt: new Date().toISOString(),
          approvedBy: currentUser?.email || 'admin',
        });
        toast.success('Testimonial approved successfully!');
      } catch (err) {
        toast.error('Failed to approve testimonial');
      }
    }
  };

  const rejectTestimonial = async (id: string) => {
    const testimonial = testimonials.find(t => t.id === id);
    if (testimonial) {
      try {
        await set(ref(database, `testimonials/${id}`), {
          ...testimonial,
          isApproved: false,
        });
        toast.success('Testimonial rejected');
      } catch (err) {
        toast.error('Failed to reject testimonial');
      }
    }
  };

  const deleteTestimonial = async (id: string) => {
    if (confirm('Are you sure you want to delete this testimonial?')) {
      try {
        await remove(ref(database, `testimonials/${id}`));
        toast.success('Deleted testimonial');
      } catch (err) {
        toast.error('Failed to delete testimonial');
      }
    }
  };

  const filteredTestimonials = testimonials.filter(t => {
    if (filter === 'pending') return !t.isApproved;
    if (filter === 'approved') return t.isApproved;
    return true;
  });

  const getStatusBadge = (isApproved: boolean) => (
    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
      isApproved ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
    }`}>
      {isApproved ? 'Approved' : 'Pending'}
    </span>
  );

  return (
    <div className="p-4 space-y-6">
      {/* Header & Filters */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 flex-wrap">
        <h2 className="text-2xl font-bold text-gray-900">Testimonial Management</h2>
        <div className="flex flex-wrap gap-2">
          {['all', 'pending', 'approved'].map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type as any)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === type
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
              {type === 'pending' && (
                <span className="ml-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                  {testimonials.filter(t => !t.isApproved).length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* TABLE VIEW FOR DESKTOP */}
      <div className="hidden sm:block">
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="min-w-full table-auto text-sm divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Review</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rating</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTestimonials.map((t) => (
                <tr key={t.id}>
                  <td className="px-4 py-4">
                    <div className="flex items-center">
                      {t.userImage ? (
                        <img src={t.userImage} className="w-10 h-10 rounded-full object-cover mr-3" />
                      ) : (
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center mr-3">
                          <User className="w-5 h-5 text-gray-600" />
                        </div>
                      )}
                      <div>
                        <div className="text-sm font-medium text-gray-900">{t.userName}</div>
                        <div className="text-sm text-gray-500">{t.userEmail}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 max-w-xs truncate">
                    <div className="text-sm font-medium text-gray-900">{t.title}</div>
                    <div className="text-sm text-gray-500 truncate">{t.content}</div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center">
                      {[...Array(t.rating)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-4">{getStatusBadge(t.isApproved)}</td>
                  <td className="px-4 py-4 text-sm text-gray-500">{new Date(t.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-4">
                    <div className="flex space-x-2">
                      <button onClick={() => setSelectedTestimonial(t)} className="text-blue-600 hover:text-blue-900 p-1">
                        <Eye className="w-4 h-4" />
                      </button>
                      {!t.isApproved ? (
                        <button onClick={() => approveTestimonial(t.id)} className="text-green-600 hover:text-green-900 p-1">
                          <Check className="w-4 h-4" />
                        </button>
                      ) : (
                        <button onClick={() => rejectTestimonial(t.id)} className="text-yellow-600 hover:text-yellow-900 p-1">
                          <X className="w-4 h-4" />
                        </button>
                      )}
                      <button onClick={() => deleteTestimonial(t.id)} className="text-red-600 hover:text-red-900 p-1">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* CARD VIEW FOR MOBILE */}
      <div className="sm:hidden grid gap-4">
        {filteredTestimonials.map((t) => (
          <div key={t.id} className="bg-white p-4 rounded-lg shadow space-y-2">
            <div className="flex items-center gap-3">
              {t.userImage ? (
                <img src={t.userImage} className="w-10 h-10 rounded-full object-cover" />
              ) : (
                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-gray-600" />
                </div>
              )}
              <div>
                <div className="font-medium text-gray-900">{t.userName}</div>
                <div className="text-sm text-gray-500">{t.userEmail}</div>
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold">{t.title}</p>
              <p className="text-sm text-gray-600">{t.content}</p>
            </div>
            <div className="flex items-center gap-2">
              {[...Array(t.rating)].map((_, i) => (
                <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
              ))}
              <span className="text-sm text-gray-600">{t.rating}/5</span>
            </div>
            <div className="text-sm">{getStatusBadge(t.isApproved)}</div>
            <div className="text-xs text-gray-500">Submitted: {new Date(t.createdAt).toLocaleDateString()}</div>
            <div className="flex flex-wrap gap-2 pt-2">
              <button onClick={() => setSelectedTestimonial(t)} className="text-blue-600 hover:underline text-sm flex items-center gap-1">
                <Eye className="w-4 h-4" /> View
              </button>
              {!t.isApproved ? (
                <button onClick={() => approveTestimonial(t.id)} className="text-green-600 hover:underline text-sm flex items-center gap-1">
                  <Check className="w-4 h-4" /> Approve
                </button>
              ) : (
                <button onClick={() => rejectTestimonial(t.id)} className="text-yellow-600 hover:underline text-sm flex items-center gap-1">
                  <X className="w-4 h-4" /> Reject
                </button>
              )}
              <button onClick={() => deleteTestimonial(t.id)} className="text-red-600 hover:underline text-sm flex items-center gap-1">
                <Trash2 className="w-4 h-4" /> Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* VIEW MODAL */}
      {selectedTestimonial && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-lg w-full p-6 relative">
            <button
              onClick={() => setSelectedTestimonial(null)}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                {selectedTestimonial.userImage ? (
                  <img src={selectedTestimonial.userImage} className="w-12 h-12 rounded-full object-cover" />
                ) : (
                  <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-gray-600" />
                  </div>
                )}
                <div>
                  <h3 className="text-lg font-semibold">{selectedTestimonial.userName}</h3>
                  <p className="text-sm text-gray-500">{selectedTestimonial.userEmail}</p>
                </div>
              </div>
              <div>
                <h4 className="text-md font-medium">{selectedTestimonial.title}</h4>
                <p className="text-gray-600 text-sm">{selectedTestimonial.content}</p>
              </div>
              <div className="flex items-center gap-2">
                {[...Array(selectedTestimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                ))}
                <span className="text-sm text-gray-600">{selectedTestimonial.rating}/5</span>
              </div>
              <div>{getStatusBadge(selectedTestimonial.isApproved)}</div>
              <div className="text-xs text-gray-500">Submitted: {new Date(selectedTestimonial.createdAt).toLocaleString()}</div>
              {selectedTestimonial.approvedAt && (
                <div className="text-xs text-gray-500">Approved by: {selectedTestimonial.approvedBy} on {new Date(selectedTestimonial.approvedAt).toLocaleString()}</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestimonialManagement;
