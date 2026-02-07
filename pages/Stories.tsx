import React, { useState, useEffect } from 'react';
import { User, Story } from '../types';
import { supabaseDB as mockDB } from '../services/supabaseService';
import { Icons } from '../components/Icon';

interface StoriesProps {
  currentUser: User;
}

const Stories: React.FC<StoriesProps> = ({ currentUser }) => {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStories = async () => {
      const data = await mockDB.getStories();
      setStories(data);
      setLoading(false);
    };

    loadStories();
    
    // In a real app, we would set up a subscription for story updates
    // For now, we'll just refresh periodically
    const interval = setInterval(loadStories, 10000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col h-full pt-6 pb-20">
      <header className="px-6 mb-4">
        <h1 className="text-2xl font-bold tracking-tight text-white">Stories</h1>
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar px-6">
        {loading ? (
          <div className="flex justify-center p-10"><div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div></div>
        ) : stories.length === 0 ? (
          <div className="text-center p-10 opacity-50 flex flex-col items-center">
            <div className="bg-dark-surface p-4 rounded-full mb-4">
              <Icons.Story size={32} className="text-gray-600" />
            </div>
            <p className="text-sm font-medium">No stories yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {stories.map(story => (
              <div 
                key={story.id}
                className="aspect-[9/16] rounded-3xl overflow-hidden bg-dark-surface border border-dark-border relative group cursor-pointer"
              >
                <img 
                  src={story.image_url} 
                  alt={story.caption || 'Story'} 
                  className="w-full h-full object-cover"
                />
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
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Stories;
