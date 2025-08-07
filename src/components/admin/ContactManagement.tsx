import React, { useState, useEffect } from 'react';
import { ref, onValue, set } from 'firebase/database';
import { database } from '../../config/firebase';
import { useAuth } from '../../context/AuthContext';
import { ContactMessage } from '../../types';
import { Mail, Eye, Reply, Trash2, MailOpen, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

const ContactManagement: React.FC = () => {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const { currentUser } = useAuth();

  useEffect(() => {
    const messagesRef = ref(database, 'contactMessages');
    const unsubscribe = onValue(messagesRef, (snapshot) => {
      if (snapshot.exists()) {
        const messagesData = snapshot.val();
        const messagesList: ContactMessage[] = Object.keys(messagesData).map(key => ({
          id: key,
          ...messagesData[key],
        }));
        setMessages(messagesList.sort((a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ));
      } else {
        setMessages([]);
      }
    });

    return () => unsubscribe();
  }, []);

  const markAsRead = async (messageId: string) => {
    try {
      const message = messages.find(m => m.id === messageId);
      if (message && !message.isRead) {
        const messageRef = ref(database, `contactMessages/${messageId}`);
        await set(messageRef, {
          ...message,
          isRead: true,
        });
        toast.success('Message marked as read');
      }
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };

  const sendResponse = async (messageId: string) => {
    if (!response.trim()) {
      toast.error('Please enter a response');
      return;
    }

    setLoading(true);
    try {
      const message = messages.find(m => m.id === messageId);
      if (message) {
        const messageRef = ref(database, `contactMessages/${messageId}`);
        await set(messageRef, {
          ...message,
          response,
          respondedAt: new Date().toISOString(),
          isRead: true,
        });

        toast.success('Response saved successfully!');
        setResponse('');
        setSelectedMessage(null);
      }
    } catch (error) {
      toast.error('Failed to save response');
      console.error('Error saving response:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteMessage = async (messageId: string) => {
    if (confirm('Are you sure you want to delete this message?')) {
      try {
        const messageRef = ref(database, `contactMessages/${messageId}`);
        await set(messageRef, null);
        toast.success('Message deleted successfully!');
      } catch (error) {
        toast.error('Failed to delete message');
        console.error('Error deleting message:', error);
      }
    }
  };

  const filteredMessages = messages.filter(message => {
    if (filter === 'unread') return !message.isRead;
    if (filter === 'read') return message.isRead;
    return true;
  });

  const unreadCount = messages.filter(m => !m.isRead).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-gray-900">Contact Messages</h2>
        <div className="flex flex-wrap gap-2">
          {['all', 'unread', 'read'].map((filterOption) => (
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
              {filterOption === 'unread' && unreadCount > 0 && (
                <span className="ml-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                  {unreadCount}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Table view for desktop */}
      <div className="hidden md:block bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">From</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredMessages.map((message) => (
                <tr key={message.id} className={!message.isRead ? 'bg-blue-50' : ''}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {message.isRead ? (
                        <MailOpen className="w-5 h-5 text-gray-400" />
                      ) : (
                        <Mail className="w-5 h-5 text-blue-600" />
                      )}
                      {message.response && (
                        <Reply className="w-4 h-4 text-green-600 ml-2" />
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{message.name}</div>
                    <div className="text-sm text-gray-500">{message.email}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 truncate max-w-xs">
                    {message.subject}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      {new Date(message.createdAt).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          setSelectedMessage(message);
                          markAsRead(message.id);
                        }}
                        className="text-blue-600 hover:text-blue-900 p-1"
                        title="View Message"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteMessage(message.id)}
                        className="text-red-600 hover:text-red-900 p-1"
                        title="Delete Message"
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

      {/* Card view for mobile */}
      <div className="md:hidden space-y-4">
        {filteredMessages.map((message) => (
          <div
            key={message.id}
            className={`rounded-lg border shadow-sm p-4 ${!message.isRead ? 'bg-blue-50' : 'bg-white'}`}
          >
            <div className="flex justify-between items-start">
              <div>
                <div className="text-lg font-semibold text-gray-800">{message.name}</div>
                <div className="text-sm text-gray-500">{message.email}</div>
              </div>
              <div className="flex items-center space-x-1">
                {message.isRead ? (
                  <MailOpen className="w-5 h-5 text-gray-400" />
                ) : (
                  <Mail className="w-5 h-5 text-blue-600" />
                )}
                {message.response && <Reply className="w-4 h-4 text-green-600" />}
              </div>
            </div>

            <div className="mt-2 text-sm text-gray-700">
              <span className="font-medium">Subject:</span> {message.subject}
            </div>
            <div className="text-sm text-gray-500 mt-1">
              <Clock className="w-4 h-4 inline-block mr-1" />
              {new Date(message.createdAt).toLocaleDateString()}
            </div>

            <div className="mt-3 flex justify-end space-x-2">
              <button
                onClick={() => {
                  setSelectedMessage(message);
                  markAsRead(message.id);
                }}
                className="text-blue-600 hover:text-blue-800"
              >
                <Eye className="w-5 h-5" />
              </button>
              <button
                onClick={() => deleteMessage(message.id)}
                className="text-red-600 hover:text-red-800"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {selectedMessage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">{selectedMessage.subject}</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    From: {selectedMessage.name} ({selectedMessage.email})
                  </p>
                  <p className="text-sm text-gray-500">
                    {new Date(selectedMessage.createdAt).toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedMessage(null)}
                  className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Message</h4>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-700 whitespace-pre-wrap">{selectedMessage.message}</p>
                </div>
              </div>

              {selectedMessage.response && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Previous Response</h4>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-gray-700 whitespace-pre-wrap">{selectedMessage.response}</p>
                    <p className="text-sm text-gray-500 mt-2">
                      Responded on {new Date(selectedMessage.respondedAt!).toLocaleString()}
                    </p>
                  </div>
                </div>
              )}

              <div>
                <h4 className="font-semibold text-gray-900 mb-2">
                  {selectedMessage.response ? 'Update Response' : 'Send Response'}
                </h4>
                <textarea
                  value={response}
                  onChange={(e) => setResponse(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Type your response here..."
                />
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={() => setSelectedMessage(null)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 py-2 px-4 rounded-lg font-medium transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => sendResponse(selectedMessage.id)}
                  disabled={loading || !response.trim()}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center"
                >
                  {loading ? 'Saving...' : (
                    <>
                      <Reply className="w-4 h-4 mr-2" />
                      {selectedMessage.response ? 'Update Response' : 'Send Response'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContactManagement;
