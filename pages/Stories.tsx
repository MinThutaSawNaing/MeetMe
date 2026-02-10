import React, { useState, useEffect, useRef } from 'react';
import { User, Story } from '../types';
import { supabaseDB as mockDB } from '../services/supabaseService';
import { Icons } from '../components/Icon';

interface StoriesProps {
  currentUser: User;
}

interface StoryItemProps {
  story: Story;
  currentUser: User;
  onEdit: (story: Story) => void;
  onDelete: (storyId: string) => void;
}

const StoryItem: React.FC<StoryItemProps> = ({ story, currentUser, onEdit, onDelete }) => {
  const [showMenu, setShowMenu] = useState(false);

  const isOwnStory = story.user_id === currentUser.id;

  return (
    <div className="relative">
      <div 
        className="aspect-[9/16] rounded-3xl overflow-hidden bg-dark-surface border border-dark-border relative group cursor-pointer hover:scale-[1.02] transition-transform duration-300"
      >
        {/\.(mp4|mov|avi|webm|mkv)$/i.test(story.image_url) ? (
          <video 
            src={story.image_url} 
            autoPlay 
            muted 
            loop 
            playsInline
            className="w-full h-full object-cover"
            onError={(e) => {
              const target = e.target as HTMLVideoElement;
              // Fallback to image if video fails
              target.style.display = 'none';
              const img = document.createElement('img');
              img.src = 'https://placehold.co/600x800/1a1a1a/333333?text=Video+Error';
              img.className = 'w-full h-full object-cover';
              target.parentNode?.appendChild(img);
            }}
          />
        ) : (
          <img 
            src={story.image_url} 
            alt={story.caption || 'Story'} 
            className="w-full h-full object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = 'https://placehold.co/600x800/1a1a1a/333333?text=Media+Error';
            }}
          />
        )}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
          <div className="flex items-center gap-2 mb-2">
            {story.user_data?.avatar_url && (
              <img 
                src={story.user_data.avatar_url} 
                className="w-8 h-8 rounded-full border-2 border-white" 
                alt={story.user_data.username} 
              />
            )}
            <span className="text-white font-bold text-sm truncate">{story.user_data?.username}</span>
          </div>
          {story.caption && (
            <p className="text-white text-xs line-clamp-2">{story.caption}</p>
          )}
        </div>
        
        {/* Edit/Delete menu for own stories */}
        {isOwnStory && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              className="absolute top-3 right-3 p-2 bg-black/50 backdrop-blur rounded-full text-white hover:bg-black/70 transition-colors"
            >
              <Icons.More size={16} />
            </button>
            
            {showMenu && (
              <div className="absolute top-12 right-3 w-32 bg-dark-surface border border-dark-border rounded-xl shadow-2xl overflow-hidden z-10 animate-pop">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(story);
                    setShowMenu(false);
                  }}
                  className="w-full text-left px-4 py-3 text-sm hover:bg-white/5 flex items-center gap-2 text-blue-400 border-b border-dark-border"
                >
                  <Icons.Camera size={16} />
                  Edit
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(story.id);
                    setShowMenu(false);
                  }}
                  className="w-full text-left px-4 py-3 text-sm hover:bg-white/5 flex items-center gap-2 text-red-400"
                >
                  <Icons.Trash2 size={16} />
                  Delete
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

const Stories: React.FC<StoriesProps> = ({ currentUser }) => {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [caption, setCaption] = useState('');
  const [editingStory, setEditingStory] = useState<Story | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadStories = async () => {
      try {
        const data = await mockDB.getStories();
        setStories(data);
        setLoading(false);
      } catch (error) {
        console.error('Error loading stories:', error);
        setLoading(false);
        alert('Failed to load stories. Please try again later.');
      }
    };

    loadStories();
    
    // In a real app, we would set up a subscription for story updates
    // For now, we'll just refresh periodically
    const interval = setInterval(loadStories, 10000);
    
    return () => clearInterval(interval);
  }, []);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      // Upload the story using the new method
      const uploadedStory = await mockDB.uploadStory(currentUser.id, file, caption);
      
      // Add the new story to the list
      setStories(prev => [uploadedStory, ...prev]);
      
      // Reset form
      setCaption('');
      setShowUploadForm(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error: any) {
      console.error('Error uploading story:', error);
      alert(error.message || 'Failed to upload story. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleEditStory = (story: Story) => {
    setEditingStory(story);
    setCaption(story.caption || '');
    setShowUploadForm(true);
  };

  const handleUpdateStory = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !editingStory) return;

    setUploading(true);
    try {
      // Delete the old story file
      const oldFileName = editingStory.image_url.split('/').pop();
      if (oldFileName) {
        await mockDB.deleteStoryFile(oldFileName);
      }
      
      // Upload the new file
      const updatedStory = await mockDB.uploadStory(currentUser.id, file, caption);
      
      // Update the story in the list
      setStories(prev => 
        prev.map(s => s.id === editingStory.id ? {...updatedStory, id: editingStory.id} : s)
      );
      
      // Reset form
      setEditingStory(null);
      setCaption('');
      setShowUploadForm(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error: any) {
      console.error('Error updating story:', error);
      alert(error.message || 'Failed to update story. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteStory = async (storyId: string) => {
    try {
      // Delete the story file from storage
      const storyToDelete = stories.find(s => s.id === storyId);
      if (storyToDelete) {
        const fileName = storyToDelete.image_url.split('/').pop();
        if (fileName) {
          await mockDB.deleteStoryFile(fileName);
        }
      }
      
      // Delete from database
      await mockDB.deleteStory(storyId);
      
      // Update local state
      setStories(prev => prev.filter(s => s.id !== storyId));
      setShowDeleteConfirm(null);
    } catch (error: any) {
      console.error('Error deleting story:', error);
      alert(error.message || 'Failed to delete story. Please try again.');
    }
  };

  // Add delete confirmation modal
  const confirmDeleteStory = showDeleteConfirm ? stories.find(s => s.id === showDeleteConfirm) : null;

  return (
    <div className="flex flex-col h-full pt-6 pb-20">
      <header className="px-6 mb-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-primary-400 to-cyan-400 bg-clip-text text-transparent">
          Stories
        </h1>
        <button
          onClick={() => setShowUploadForm(!showUploadForm)}
          className="p-3 bg-gradient-to-r from-primary-600 to-cyan-600 hover:from-primary-500 hover:to-cyan-500 rounded-2xl shadow-lg shadow-primary-500/20 hover:shadow-xl transition-all duration-300 transform hover:scale-105 active:scale-95"
        >
          <Icons.Story size={24} />
        </button>
      </header>

      {/* Upload Form */}
      {showUploadForm && (
        <div className="px-6 mb-6 animate-in slide-in-from-top-4 duration-300">
          <div className="backdrop-blur-xl bg-dark-surface/40 border border-dark-border/50 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center gap-4 mb-4">
              <div className="relative">
                <img 
                  src={currentUser.avatar_url} 
                  className="w-12 h-12 rounded-full object-cover border-2 border-primary-500" 
                  alt={currentUser.username} 
                />
                <div className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-green-500 border-2 border-dark-surface"></div>
              </div>
              <h3 className="font-bold text-white">{currentUser.username}</h3>
            </div>
            
            <div className="space-y-4">
              <div 
                onClick={handleUploadClick}
                className="border-2 border-dashed border-dark-border/50 rounded-2xl p-8 text-center cursor-pointer hover:border-primary-500/50 transition-colors bg-dark-bg/30 hover:bg-dark-bg/50"
              >
                <div className="flex flex-col items-center justify-center gap-3">
                  <Icons.Camera size={32} className="text-primary-400" />
                  <p className="text-white font-medium">Tap to upload photo/video</p>
                  <p className="text-gray-400 text-sm">Max 4MB for images, 14MB for videos</p>
                </div>
              </div>
              
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*,video/*"
                onChange={editingStory ? handleUpdateStory : handleFileChange}
                className="hidden"
              />
              
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Add a caption..."
                className="w-full bg-dark-bg/50 border border-dark-border/50 rounded-xl p-4 text-white placeholder-gray-500 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all resize-none"
                rows={3}
              />
              
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowUploadForm(false);
                    setCaption('');
                    setEditingStory(null);
                    if (fileInputRef.current) {
                      fileInputRef.current.value = '';
                    }
                  }}
                  className="flex-1 py-3 bg-dark-bg/50 hover:bg-dark-bg/70 text-gray-300 hover:text-white font-medium rounded-xl border border-dark-border/50 hover:border-gray-500 transition-all duration-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUploadClick}
                  disabled={uploading}
                  className="flex-1 py-3 bg-gradient-to-r from-primary-600 to-cyan-600 hover:from-primary-500 hover:to-cyan-500 text-white font-bold rounded-xl shadow-lg shadow-primary-500/20 hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>{editingStory ? 'Updating...' : 'Uploading...'}</span>
                    </div>
                  ) : (
                    editingStory ? 'Update Story' : 'Share Story'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto no-scrollbar px-6">
        {loading ? (
          <div className="flex justify-center p-10">
            <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : stories.length === 0 ? (
          <div className="text-center p-10 opacity-50 flex flex-col items-center">
            <div className="bg-dark-surface p-4 rounded-full mb-4">
              <Icons.Story size={32} className="text-gray-600" />
            </div>
            <p className="text-sm font-medium">No stories yet.</p>
            <p className="text-gray-500 text-xs mt-2">Share your first moment!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {stories.map(story => (
              <StoryItem 
                key={story.id}
                story={story}
                currentUser={currentUser}
                onEdit={handleEditStory}
                onDelete={(id) => setShowDeleteConfirm(id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {confirmDeleteStory && (
        <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-dark-surface border border-dark-border p-6 rounded-3xl w-full max-w-xs animate-pop shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-red-400">Delete Story</h2>
              <Icons.AlertTriangle className="text-red-400" size={24} />
            </div>
            <p className="text-gray-300 text-sm mb-6">
              Are you sure you want to delete this story? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 py-3 bg-dark-bg/50 hover:bg-dark-bg/70 text-gray-300 hover:text-white font-medium rounded-xl border border-dark-border/50 hover:border-gray-500 transition-all duration-300"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteStory(confirmDeleteStory.id)}
                className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl shadow-lg shadow-red-500/20 transition-all duration-300"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Stories;