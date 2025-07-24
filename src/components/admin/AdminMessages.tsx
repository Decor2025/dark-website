import React, { useState, useEffect } from 'react';
import { ref, onValue, remove } from 'firebase/database';
import { database } from '../../config/firebase';
import { Message } from '../../types';
import { Trash2, User, Mail, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const AdminMessages: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    const messagesRef = ref(database, 'messages');
    const unsubscribe = onValue(messagesRef, snapshot => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const list: Message[] = Object.keys(data).map(key => ({
          id: key,
          ...data[key],
        }));
        setMessages(list);
      } else {
        setMessages([]);
      }
    });

    return () => unsubscribe();
  }, []);

  const deleteMessage = async (id: string) => {
    if (!confirm('Delete this message?')) return;
    try {
      await remove(ref(database, `messages/${id}`));
      toast.success('Message deleted');
    } catch (err) {
      console.error(err);
      toast.error('Delete failed');
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Customer Messages</h2>

      <div className="bg-white rounded-lg shadow-md overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subject</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Message</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {messages.map(msg => (
              <tr key={msg.id}>
                <td className="px-6 py-4 whitespace-nowrap">{msg.name}</td>
                <td className="px-6 py-4 whitespace-nowrap">{msg.email}</td>
                <td className="px-6 py-4 whitespace-nowrap">{msg.subject}</td>
                <td className="px-6 py-4 max-w-xs truncate">{msg.message}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => deleteMessage(msg.id)}
                    className="text-red-600 hover:text-red-900 p-1"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}

            {messages.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                  <div className="flex items-center justify-center space-x-2">
                    <AlertCircle className="w-5 h-5 text-gray-400" />
                    <span>No messages found.</span>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminMessages;
