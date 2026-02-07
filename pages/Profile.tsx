import React, { useState } from 'react';
import { User } from '../types';
import { supabaseDB as mockDB } from '../services/supabaseService';
import { Icons } from '../components/Icon';

interface ProfileProps {
  currentUser: User;
  onLogout: () => void;
  apiKey: string;
  setApiKey: (key: string) => void;
}

const Profile: React.FC<ProfileProps> = ({ currentUser, onLogout, apiKey, setApiKey }) => {
  const [editing, setEditing] = useState(false);
  const [username, setUsername] = useState(currentUser.username);
  const [jobTitle, setJobTitle] = useState(currentUser.job_title || '');
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [tempApiKey, setTempApiKey] = useState(apiKey);
  const [status, setStatus] = useState<User['status']>(currentUser.status || 'online');

  const handleSave = async () => {
    // Update user profile in database
    try {
      if (!mockDB) {
        console.error('Supabase not available');
        alert('Supabase not available');
        return;
      }
      
      // Update user profile using the service
      const updatedUser = await mockDB.updateUserProfile(currentUser.id, {
        username,
        job_title: jobTitle
      });
      
      // Update current user in session storage
      sessionStorage.setItem('currentUser', JSON.stringify(updatedUser));
      
      setEditing(false);
    } catch (err) {
      console.error('Error updating user profile:', err);
      alert('Failed to update profile');
    }
  };

  const handleStatusChange = async (newStatus: User['status']) => {
    setStatus(newStatus);
    // Update status in database
    try {
      await mockDB.updateUserStatus(currentUser.id, newStatus);
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status. Please try again.');
      // Revert to previous status
      setStatus(currentUser.status || 'online');
    }
    
    // In a real app, we would subscribe to status changes
    // Here we just update the local state
  };

  const saveApiKey = () => {
    setApiKey(tempApiKey);
    setShowKeyInput(false);
  };

  return (
    <div className="flex flex-col h-full pt-6 pb-20">
      <header className="px-6 mb-4 flex items-center gap-4">
        <button 
          onClick={() => setEditing(!editing)}
          className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white"
        >
          <Icons.Settings size={24} />
        </button>
        <h1 className="text-2xl font-bold tracking-tight text-white">Profile</h1>
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar px-6">
        <div className="flex flex-col items-center mb-8">
          <div className="relative mb-4">
            <img 
              src={currentUser.avatar_url} 
              alt={currentUser.username} 
              className="w-24 h-24 rounded-full object-cover border-4 border-dark-surface"
            />
            <div className={`absolute bottom-2 right-2 w-6 h-6 rounded-full border-2 border-dark-surface ${status === 'online' ? 'bg-green-500' : status === 'busy' ? 'bg-red-500' : status === 'away' ? 'bg-yellow-500' : 'bg-gray-500'}`}></div>
          </div>
          
          {editing ? (
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="text-center text-xl font-bold bg-transparent border-b border-gray-600 text-white focus:outline-none focus:border-primary-500"
            />
          ) : (
            <h2 className="text-xl font-bold text-white">{username}</h2>
          )}
          
          <div className="flex items-center gap-2 mt-2">
            {editing ? (
              <input
                type="text"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="Job title"
                className="text-center text-gray-400 bg-transparent border-b border-gray-600 focus:outline-none focus:border-primary-500"
              />
            ) : (
              <p className="text-gray-400">{jobTitle || 'Team Member'}</p>
            )}
          </div>
        </div>

        {editing && (
          <div className="mb-6">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Status</h3>
            <div className="grid grid-cols-4 gap-2">
              {(['online', 'busy', 'away', 'offline'] as User['status'][]).map(stat => (
                <button
                  key={stat}
                  onClick={() => handleStatusChange(stat)}
                  className={`py-2 px-3 rounded-xl text-sm font-medium capitalize ${
                    status === stat 
                      ? 'bg-primary-600 text-white' 
                      : 'bg-dark-surface text-gray-400 hover:text-white'
                  }`}
                >
                  {stat}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-4">
          <div 
            className="p-4 bg-dark-surface rounded-2xl border border-dark-border"
            onClick={() => setShowKeyInput(!showKeyInput)}
          >
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-bold text-white">AI Integration</h3>
                <p className="text-gray-400 text-sm">Configure Gemini API for smart features</p>
              </div>
              <div className="p-2 bg-primary-600/10 text-primary-500 rounded-xl">
                <Icons.Bot size={20} />
              </div>
            </div>
          </div>

          {showKeyInput && (
            <div className="p-4 bg-dark-surface rounded-2xl border border-dark-border">
              <h3 className="font-bold text-white mb-3">API Key</h3>
              <input
                type="password"
                value={tempApiKey}
                onChange={(e) => setTempApiKey(e.target.value)}
                placeholder="Enter Gemini API key"
                className="w-full bg-dark-bg border border-dark-border rounded-xl p-3 mb-3 focus:outline-none focus:border-primary-500 text-sm"
              />
              <div className="flex gap-2">
                <button 
                  onClick={() => setShowKeyInput(false)}
                  className="flex-1 py-2 text-gray-400 hover:text-white font-medium text-sm"
                >
                  Cancel
                </button>
                <button 
                  onClick={saveApiKey}
                  className="flex-1 bg-primary-600 rounded-xl py-2 font-bold hover:bg-primary-500 text-white text-sm"
                >
                  Save
                </button>
              </div>
            </div>
          )}

          <div 
            className="p-4 bg-dark-surface rounded-2xl border border-dark-border"
            onClick={onLogout}
          >
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-bold text-white">Log Out</h3>
                <p className="text-gray-400 text-sm">End your session</p>
              </div>
              <div className="p-2 bg-red-600/10 text-red-500 rounded-xl">
                <Icons.LogOut size={20} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;