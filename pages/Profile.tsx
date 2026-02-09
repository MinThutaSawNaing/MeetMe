import React, { useState, useRef } from 'react';
import { User } from '../types';
import { supabaseDB as mockDB, supabaseAuth as authDB } from '../services/supabaseService';
import ImageCompressionService from '../services/imageCompressionService';
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
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = async () => {
    if (isSaving) return;
    
    setIsSaving(true);
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
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarClick = () => {
    if (editing && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!ImageCompressionService.isSupportedImage(file)) {
      alert('Please select a valid image file (JPEG, PNG, WebP, GIF)');
      return;
    }

    // Validate file size (before compression)
    if (file.size > 10 * 1024 * 1024) { // 10MB limit before compression
      alert('Image is too large. Please select an image under 10MB.');
      return;
    }

    setIsUploading(true);
    
    try {
      // Create preview
      const preview = await ImageCompressionService.createPreview(file);
      setAvatarPreview(preview);
      
      // Compress image
      const compressionResult = await ImageCompressionService.compressImage(file, {
        maxSizeMB: 1.5,
        maxWidth: 1024,
        maxHeight: 1024,
        quality: 0.8
      });
      
      console.log(`Image compressed from ${ImageCompressionService.formatFileSize(compressionResult.originalSize)} to ${ImageCompressionService.formatFileSize(compressionResult.compressedSize)} (${(compressionResult.compressionRatio * 100).toFixed(1)}% of original size)`);
      
      // Upload to Supabase storage
      if (mockDB) {
        const avatarUrl = await authDB.uploadAvatar(currentUser.id, compressionResult.file);
        
        // Update user profile with new avatar URL
        const updatedUser = await mockDB.updateUserProfile(currentUser.id, {
          avatar_url: avatarUrl
        });
        
        // Update current user in session storage
        sessionStorage.setItem('currentUser', JSON.stringify(updatedUser));
        
        // Update local state
        setAvatarPreview(null);
        
        console.log('Avatar updated successfully');
      }
    } catch (error) {
      console.error('Error uploading avatar:', error);
      alert('Failed to upload avatar. Please try again.');
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
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
  };

  const saveApiKey = () => {
    setApiKey(tempApiKey);
    setShowKeyInput(false);
  };

  const getStatusColor = (statusValue: string) => {
    switch(statusValue) {
      case 'online': return 'from-green-500 to-emerald-400';
      case 'busy': return 'from-red-500 to-orange-400';
      case 'away': return 'from-yellow-500 to-amber-400';
      default: return 'from-gray-500 to-gray-400';
    }
  };

  const getStatusBg = (statusValue: string) => {
    switch(statusValue) {
      case 'online': return 'bg-green-500/20 border-green-500/30';
      case 'busy': return 'bg-red-500/20 border-red-500/30';
      case 'away': return 'bg-yellow-500/20 border-yellow-500/30';
      default: return 'bg-gray-500/20 border-gray-500/30';
    }
  };

  return (
    <div className="flex flex-col h-full pt-6 pb-20 bg-gradient-to-br from-dark-bg to-dark-surface">
      {/* Header with glass effect */}
      <div className="px-6 mb-6">
        <div className="backdrop-blur-xl bg-dark-surface/40 border border-dark-border/50 rounded-2xl p-4 shadow-2xl">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-400 to-cyan-400 bg-clip-text text-transparent">
              Profile
            </h1>
            <button 
              onClick={() => setEditing(!editing)}
              className="p-3 bg-dark-bg/50 hover:bg-dark-bg/70 border border-dark-border/50 rounded-xl transition-all duration-300 hover:scale-105 active:scale-95 backdrop-blur-sm"
              disabled={isSaving}
            >
              <Icons.Settings size={22} className="text-primary-400" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar px-6 space-y-6">
        {/* User Profile Card */}
        <div className="backdrop-blur-xl bg-dark-surface/30 border border-dark-border/50 rounded-3xl p-6 shadow-2xl">
          <div className="flex flex-col items-center">
            {/* Avatar with enhanced status indicator */}
            <div className="relative mb-6 group">
              <div className="absolute -inset-2 bg-gradient-to-r from-primary-500/20 to-cyan-500/20 rounded-full blur-xl group-hover:blur-2xl transition-all duration-500"></div>
              <div className="relative">
                <div 
                  className={`relative w-28 h-28 rounded-full overflow-hidden border-4 border-white/10 shadow-2xl cursor-${editing ? 'pointer' : 'default'} transition-all duration-300 ${editing ? 'hover:scale-105 hover:shadow-2xl' : ''}`}
                  onClick={handleAvatarClick}
                >
                  <img 
                    src={avatarPreview || currentUser.avatar_url} 
                    alt={currentUser.username} 
                    className="w-full h-full object-cover"
                  />
                  {editing && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-300">
                      <div className="text-center text-white p-2">
                        {isUploading ? (
                          <div className="flex flex-col items-center gap-1">
                            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            <span className="text-xs font-medium">Uploading...</span>
                          </div>
                        ) : (
                          <>
                            <Icons.Camera size={20} className="mx-auto mb-1" />
                            <span className="text-xs font-medium">Change Photo</span>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <div className={`absolute bottom-2 right-2 w-8 h-8 rounded-full border-3 border-dark-bg bg-gradient-to-br ${getStatusColor(status)} shadow-lg flex items-center justify-center`}>
                  <div className="w-2 h-2 rounded-full bg-white"></div>
                </div>
              </div>
              
              {/* Hidden file input */}
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </div>
            
            {/* Username */}
            <div className="text-center mb-2">
              {editing ? (
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="text-2xl font-bold text-center bg-transparent border-b-2 border-primary-500/50 text-white focus:outline-none focus:border-primary-400 transition-colors px-2 py-1 w-full max-w-[200px]"
                  autoFocus
                />
              ) : (
                <h2 className="text-2xl font-bold text-white group-hover:text-primary-300 transition-colors">
                  {username}
                </h2>
              )}
            </div>
            
            {/* Job Title */}
            <div className="text-center mb-6">
              {editing ? (
                <input
                  type="text"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="Job title"
                  className="text-gray-400 text-center bg-transparent border-b border-gray-600/50 focus:outline-none focus:border-primary-400 transition-colors px-2 py-1 w-full max-w-[180px]"
                />
              ) : (
                <p className="text-gray-400 text-lg">{jobTitle || 'Team Member'}</p>
              )}
            </div>

            {/* Status Selection */}
            {editing && (
              <div className="w-full">
                <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4 text-center">
                  Status
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {(['online', 'busy', 'away', 'offline'] as User['status'][]).map(stat => (
                    <button
                      key={stat}
                      onClick={() => handleStatusChange(stat)}
                      className={`py-3 px-4 rounded-2xl text-sm font-semibold capitalize transition-all duration-300 transform hover:scale-105 active:scale-95 border-2 ${
                        status === stat 
                          ? `bg-gradient-to-r ${getStatusColor(stat)} text-white shadow-lg shadow-${stat === 'online' ? 'green' : stat === 'busy' ? 'red' : stat === 'away' ? 'yellow' : 'gray'}-500/30`
                          : 'bg-dark-bg/50 border-dark-border/50 text-gray-300 hover:text-white hover:border-primary-500/50'
                      }`}
                    >
                      {stat}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Save Button */}
            {editing && (
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="mt-6 w-full py-3 bg-gradient-to-r from-primary-600 to-cyan-600 hover:from-primary-500 hover:to-cyan-500 text-white font-bold rounded-2xl shadow-lg shadow-primary-500/30 hover:shadow-xl transition-all duration-300 transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isSaving ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Saving...</span>
                  </div>
                ) : (
                  'Save Changes'
                )}
              </button>
            )}
          </div>
        </div>

        {/* Action Cards */}
        <div className="space-y-4">
          {/* AI Integration Card */}
          <div 
            className="backdrop-blur-xl bg-dark-surface/30 border border-dark-border/50 rounded-2xl p-5 shadow-xl hover:shadow-2xl transition-all duration-300 hover:bg-dark-surface/40 cursor-pointer group"
            onClick={() => setShowKeyInput(!showKeyInput)}
          >
            <div className="flex justify-between items-center">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <div className="p-2 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl">
                    <Icons.Bot size={20} className="text-purple-400" />
                  </div>
                  <h3 className="font-bold text-white text-lg">AI Integration</h3>
                </div>
                <p className="text-gray-400 text-sm ml-11">Configure Gemini API for smart features</p>
              </div>
              <div className="p-2 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-xl group-hover:rotate-12 transition-transform duration-300">
                <Icons.Sparkles size={18} className="text-purple-400" />
              </div>
            </div>
          </div>

          {/* API Key Input */}
          {showKeyInput && (
            <div className="backdrop-blur-xl bg-dark-surface/40 border border-dark-border/50 rounded-2xl p-5 shadow-xl animate-in slide-in-from-top-4 duration-300">
              <h3 className="font-bold text-white text-lg mb-4 flex items-center gap-2">
                <Icons.Settings size={20} className="text-yellow-400" />
                API Key Configuration
              </h3>
              <input
                type="password"
                value={tempApiKey}
                onChange={(e) => setTempApiKey(e.target.value)}
                placeholder="Enter your Gemini API key"
                className="w-full bg-dark-bg/50 border border-dark-border/50 rounded-xl p-4 mb-4 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 text-white placeholder-gray-500 transition-all duration-300"
              />
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowKeyInput(false)}
                  className="flex-1 py-3 bg-dark-bg/50 hover:bg-dark-bg/70 text-gray-300 hover:text-white font-medium rounded-xl border border-dark-border/50 hover:border-gray-500 transition-all duration-300"
                >
                  Cancel
                </button>
                <button 
                  onClick={saveApiKey}
                  className="flex-1 py-3 bg-gradient-to-r from-yellow-600 to-amber-600 hover:from-yellow-500 hover:to-amber-500 text-white font-bold rounded-xl shadow-lg shadow-yellow-500/20 hover:shadow-xl transition-all duration-300 transform hover:scale-105 active:scale-95"
                >
                  Save Key
                </button>
              </div>
            </div>
          )}

          {/* Logout Card */}
          <div 
            className="backdrop-blur-xl bg-dark-surface/30 border border-red-500/20 rounded-2xl p-5 shadow-xl hover:shadow-2xl transition-all duration-300 hover:bg-red-500/5 hover:border-red-500/40 cursor-pointer group"
            onClick={onLogout}
          >
            <div className="flex justify-between items-center">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <div className="p-2 bg-gradient-to-br from-red-500/20 to-orange-500/20 rounded-xl">
                    <Icons.LogOut size={20} className="text-red-400" />
                  </div>
                  <h3 className="font-bold text-white text-lg">Log Out</h3>
                </div>
                <p className="text-gray-400 text-sm ml-11">End your session securely</p>
              </div>
              <div className="p-2 bg-gradient-to-br from-red-500/10 to-orange-500/10 rounded-xl group-hover:rotate-12 transition-transform duration-300">
                <Icons.ChevronDown size={18} className="text-red-400 rotate-90" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;