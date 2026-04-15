import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { FaSearch, FaPaperPlane } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';

export default function Messages({ socket }) {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  useEffect(() => {
    fetchConversations();
    if (socket) {
      socket.on('message', (message) => {
        if (selectedConversation && message.sender === selectedConversation._id) {
          setMessages(prev => [...prev, message]);
        }
      });
    }
    return () => {
      if (socket) socket.off('message');
    };
  }, [socket, selectedConversation]);

  const fetchConversations = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/messages`);
      setConversations(response.data.conversations || []);
    } catch (error) {
      toast.error('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      const response = await axios.post(`${API_URL}/api/messages/send`, {
        receiverId: selectedConversation._id,
        content: newMessage,
      });
      setMessages(prev => [...prev, response.data.data]);
      setNewMessage('');
    } catch (error) {
      toast.error('Failed to send message');
    }
  };

  return (
    <div className="flex h-full bg-gray-900">
      {/* Conversations List */}
      <div className="w-80 border-r border-gray-700 flex flex-col">
        <div className="p-4 border-b border-gray-700">
          <div className="relative">
            <FaSearch className="absolute left-3 top-3 text-gray-500" />
            <input
              type="text"
              placeholder="Search conversations..."
              className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {conversations.map((conv) => (
            <button
              key={conv._id}
              onClick={() => setSelectedConversation(conv.user)}
              className={`w-full px-4 py-3 border-b border-gray-700 text-left hover:bg-gray-800 transition-colors ${
                selectedConversation?._id === conv.user._id ? 'bg-gray-800' : ''
              }`}
            >
              <div className="flex items-center gap-3">
                <img
                  src={conv.user.profilePicture || 'https://via.placeholder.com/40'}
                  alt={conv.user.username}
                  className="w-10 h-10 rounded-full"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white truncate">
                    {conv.user.firstName} {conv.user.lastName}
                  </p>
                  <p className="text-sm text-gray-400 truncate">{conv.lastMessage}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-700 flex items-center gap-3">
              <img
                src={selectedConversation.profilePicture || 'https://via.placeholder.com/40'}
                alt={selectedConversation.username}
                className="w-10 h-10 rounded-full"
              />
              <div>
                <p className="font-medium text-white">
                  {selectedConversation.firstName} {selectedConversation.lastName}
                </p>
                <p className="text-sm text-gray-400">@{selectedConversation.username}</p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg._id}
                  className={`flex ${msg.sender === user?._id ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs px-4 py-2 rounded-lg ${
                      msg.sender === user?._id
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 text-gray-100'
                    }`}
                  >
                    <p>{msg.content}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Message Input */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-700 flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                <FaPaperPlane />
              </button>
            </form>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            Select a conversation to start messaging
          </div>
        )}
      </div>
    </div>
  );
}
