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
        const testimonialsData = snapshot.val();
        const testimonialsList: Testimonial[] = Object.keys(testimonialsData).map(key => ({
          id: key,
          ...testimonialsData[key],
        }));
        setTestimonials(testimonialsList.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ));
      } else {
        setTestimonials([]);
      }
    });

    return () => unsubscribe();
  }, []);

  const approveTestimonial = async (testimonialId: string) => {
    try {
      const testimonial = testimonials.find(t => t.id === testimonialId);
      if (testimonial) {
        const testimonialRef = ref(database, `testimonials/${testimonialId}`);
        await set(testimonialRef, {
          ...testimonial,
          isApproved: true,
          approvedAt: new Date().toISOString(),
          approvedBy: currentUser?.email || 'admin',
        });
        toast.success('Testimonial approved successfully!');
      }
    } catch (error) {
      toast.error('Failed to approve testimonial');
      console.error('Error approving testimonial:', error);
    }
  };

  const rejectTestimonial = async (testimonialId: string) => {
    try {
      const testimonial = testimonials.find(t => t.id === testimonialId);
      if (testimonial) {
        const testimonialRef = ref(database, `testimonials/${testimonialId}`);
        await set(testimonialRef, {
          ...testimonial,
          isApproved: false,
        });
        toast.success('Testimonial rejected');
      }
    } catch (error) {
      toast.error('Failed to reject testimonial');
      console.error('Error rejecting testimonial:', error);
    }
  };

  const deleteTestimonial = async (testimonialId: string) => {
    if (confirm('Are you sure you want to delete this testimonial?')) {
      try {
        const testimonialRef = ref(database, `testimonials/${testimonialId}`);
        await remove(testimonialRef);
        toast.success('Testimonial deleted successfully!');
      } catch (error) {
        toast.error('Failed to delete testimonial');
        console.error('Error deleting testimonial:', error);
      }
    }
  };

  const filteredTestimonials = testimonials.filter(testimonial => {
    if (filter === 'pending') return !testimonial.isApproved;
    if (filter === 'approved') return testimonial.isApproved;
    return true;
  });

  const getStatusBadge = (isApproved: boolean) => (
    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
      isApproved
        ? 'bg-green-100 text-green-800'
        : 'bg-yellow-100 text-yellow-800'
    }`}>
      {isApproved ? 'Approved' : 'Pending'}
    </span>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Testimonial Management</h2>
        
        <div className="flex space-x-2">
          {['all', 'pending', 'approved'].map((filterOption) => (
            <button
              key={filterOption}
              onClick={() => setFilter(filterOption as any)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === filterOption
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
              {filterOption === 'pending' && (
                <span className="ml-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                  {testimonials.filter(t => !t.isApproved).length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Review
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rating
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTestimonials.map((testimonial) => (
                <tr key={testimonial.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {testimonial.userImage ? (
                        <img
                          src={testimonial.userImage}
                          alt={testimonial.userName}
                          className="w-10 h-10 rounded-full object-cover mr-3"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center mr-3">
                          <User className="w-5 h-5 text-gray-600" />
                        </div>
                      )}
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {testimonial.userName}
                        </div>
                        <div className="text-sm text-gray-500">{testimonial.userEmail}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="max-w-xs">
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {testimonial.title}
                      </div>
                      <div className="text-sm text-gray-500 truncate">
                        {testimonial.content}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                      ))}
                      <span className="ml-2 text-sm text-gray-600">
                        {testimonial.rating}/5
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(testimonial.isApproved)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(testimonial.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setSelectedTestimonial(testimonial)}
                        className="text-blue-600 hover:text-blue-900 p-1"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      
                      {!testimonial.isApproved && (
                        <button
                          onClick={() => approveTestimonial(testimonial.id)}
                          className="text-green-600 hover:text-green-900 p-1"
                          title="Approve"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      )}
                      
                      {testimonial.isApproved && (
                        <button
                          onClick={() => rejectTestimonial(testimonial.id)}
                          className="text-yellow-600 hover:text-yellow-900 p-1"
                          title="Reject"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                      
                      <button
                        onClick={() => deleteTestimonial(testimonial.id)}
                        className="text-red-600 hover:text-red-900 p-1"
                        title="Delete"
                      >
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

      {/* Testimonial Detail Modal */}
      {selectedTestimonial && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold">Testimonial Details</h3>
              <button
                onClick={() => setSelectedTestimonial(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                {selectedTestimonial.userImage ? (
                  <img
                    src={selectedTestimonial.userImage}
                    alt={selectedTestimonial.userName}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                    <User className="w-8 h-8 text-gray-600" />
                  </div>
                )}
                <div>
                  <h4 className="text-lg font-semibold">{selectedTestimonial.userName}</h4>
                  <p className="text-gray-600">{selectedTestimonial.userEmail}</p>
                  <div className="flex items-center mt-1">
                    {[...Array(selectedTestimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                    ))}
                    <span className="ml-2 text-sm text-gray-600">
                      {selectedTestimonial.rating}/5
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h5 className="font-semibold text-gray-900 mb-2">Review Title</h5>
                <p className="text-gray-700">{selectedTestimonial.title}</p>
              </div>

              <div>
                <h5 className="font-semibold text-gray-900 mb-2">Review Content</h5>
                <p className="text-gray-700 leading-relaxed">{selectedTestimonial.content}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                <div>
                  <span className="font-medium">Submitted:</span> {new Date(selectedTestimonial.createdAt).toLocaleString()}
                </div>
                <div>
                  <span className="font-medium">Status:</span> {getStatusBadge(selectedTestimonial.isApproved)}
                </div>
                {selectedTestimonial.approvedAt && (
                  <>
                    <div>
                      <span className="font-medium">Approved:</span> {new Date(selectedTestimonial.approvedAt).toLocaleString()}
                    </div>
                    <div>
                      <span className="font-medium">Approved By:</span> {selectedTestimonial.approvedBy}
                    </div>
                  </>
                )}
              </div>

              <div className="flex space-x-4 pt-4">
                {!selectedTestimonial.isApproved ? (
                  <button
                    onClick={() => {
                      approveTestimonial(selectedTestimonial.id);
                      setSelectedTestimonial(null);
                    }}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Approve Testimonial
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      rejectTestimonial(selectedTestimonial.id);
                      setSelectedTestimonial(null);
                    }}
                    className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Reject Testimonial
                  </button>
                )}
                
                <button
                  onClick={() => {
                    deleteTestimonial(selectedTestimonial.id);
                    setSelectedTestimonial(null);
                  }}
                  className="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestimonialManagement;