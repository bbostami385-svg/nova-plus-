import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaHome, FaVideo, FaFire, FaComments, FaBell, FaSearch, FaUser, FaSignOutAlt } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';

export default function Sidebar() {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(true);

  const menuItems = [
    { icon: FaHome, label: 'Home', path: '/' },
    { icon: FaFire, label: 'Explore', path: '/explore' },
    { icon: FaVideo, label: 'Videos', path: '/videos' },
    { icon: FaFire, label: 'Reels', path: '/reels' },
    { icon: FaComments, label: 'Messages', path: '/messages' },
    { icon: FaBell, label: 'Notifications', path: '/notifications' },
    { icon: FaUser, label: 'Profile', path: `/profile/${user?._id}` },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <aside className={`${isOpen ? 'w-64' : 'w-20'} bg-gray-800 border-r border-gray-700 transition-all duration-300 flex flex-col h-screen`}>
      {/* Logo */}
      <div className="p-4 border-b border-gray-700 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold">
            NP
          </div>
          {isOpen && <span className="font-bold text-lg">NovaPlus</span>}
        </Link>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center gap-4 px-4 py-3 rounded-lg transition-colors ${
              isActive(item.path)
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:bg-gray-700 hover:text-white'
            }`}
            title={item.label}
          >
            <item.icon className="text-xl flex-shrink-0" />
            {isOpen && <span className="font-medium">{item.label}</span>}
          </Link>
        ))}
      </nav>

      {/* Logout Button */}
      <div className="p-4 border-t border-gray-700">
        <button
          onClick={logout}
          className="w-full flex items-center gap-4 px-4 py-3 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors"
          title="Logout"
        >
          <FaSignOutAlt className="text-xl flex-shrink-0" />
          {isOpen && <span className="font-medium">Logout</span>}
        </button>
      </div>

      {/* Toggle Button */}
      <div className="p-4 border-t border-gray-700">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm transition-colors"
        >
          {isOpen ? '←' : '→'}
        </button>
      </div>
    </aside>
  );
}
