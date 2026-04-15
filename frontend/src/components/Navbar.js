import React, { useState, useEffect } from 'react';
import { FaBell, FaSearch } from 'react-icons/fa';
import axios from 'axios';
import { useNotifications } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';

export default function Navbar({ socket }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearch, setShowSearch] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationsList, setNotificationsList] = useState([]);
  const { unreadCount, markAsRead } = useNotifications();
  const { user } = useAuth();
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  // Listen for real-time notifications
  useEffect(() => {
    if (socket) {
      socket.on('notification', (notification) => {
        setNotificationsList(prev => [notification, ...prev]);
      });

      return () => {
        socket.off('notification');
      };
    }
  }, [socket]);

  // Fetch notifications
  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/notifications?limit=10`);
      setNotificationsList(response.data.notifications || []);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  const handleSearch = async (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (query.length > 2) {
      try {
        const response = await axios.get(`${API_URL}/api/users/search?q=${query}&limit=10`);
        setSearchResults(response.data.users || []);
      } catch (error) {
        console.error('Search error:', error);
      }
    } else {
      setSearchResults([]);
    }
  };

  return (
    <nav className="bg-gray-800 border-b border-gray-700 px-6 py-4 flex items-center justify-between sticky top-0 z-50">
      {/* Search Bar */}
      <div className="flex-1 max-w-md relative">
        <div className="relative">
          <FaSearch className="absolute left-3 top-3 text-gray-500" />
          <input
            type="text"
            placeholder="Search users..."
            value={searchQuery}
            onChange={handleSearch}
            onFocus={() => setShowSearch(true)}
            onBlur={() => setTimeout(() => setShowSearch(false), 200)}
            className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-full text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
          />

          {/* Search Results Dropdown */}
          {showSearch && searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-gray-800 border border-gray-700 rounded-lg shadow-lg max-h-96 overflow-y-auto">
              {searchResults.map((result) => (
                <a
                  key={result._id}
                  href={`/profile/${result._id}`}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-gray-700 transition-colors border-b border-gray-700 last:border-0"
                >
                  <img
                    src={result.profilePicture || 'https://via.placeholder.com/40'}
                    alt={result.username}
                    className="w-10 h-10 rounded-full"
                  />
                  <div>
                    <p className="font-medium text-white">{result.firstName} {result.lastName}</p>
                    <p className="text-sm text-gray-400">@{result.username}</p>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Side - Notifications */}
      <div className="flex items-center gap-6 ml-8">
        {/* Notifications Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 text-gray-400 hover:text-white transition-colors"
          >
            <FaBell className="text-xl" />
            {unreadCount > 0 && (
              <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute top-full right-0 mt-2 w-80 bg-gray-800 border border-gray-700 rounded-lg shadow-lg max-h-96 overflow-y-auto">
              <div className="p-4 border-b border-gray-700">
                <h3 className="font-bold text-white">Notifications</h3>
              </div>

              {notificationsList.length > 0 ? (
                notificationsList.map((notification) => (
                  <div
                    key={notification._id}
                    className="px-4 py-3 border-b border-gray-700 hover:bg-gray-700 transition-colors cursor-pointer"
                    onClick={() => markAsRead(notification._id)}
                  >
                    <p className="text-sm text-white">{notification.message}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(notification.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-gray-400">
                  No notifications yet
                </div>
              )}
            </div>
          )}
        </div>

        {/* User Avatar */}
        <a href={`/profile/${user?._id}`} className="flex items-center gap-2">
          <img
            src={user?.profilePicture || 'https://via.placeholder.com/40'}
            alt={user?.username}
            className="w-10 h-10 rounded-full hover:opacity-80 transition-opacity"
          />
        </a>
      </div>
    </nav>
  );
}
