import React, { useState, useEffect } from 'react';
import { User, Friend } from '../types';
import { supabaseDB as mockDB } from '../services/supabaseService';
import { Icons } from '../components/Icon';
import { QrScanner } from 'react-qr-scanner';

interface AddFriendProps {
  currentUser: User;
  onBack: () => void;
}

const AddFriend: React.FC<AddFriendProps> = ({ currentUser, onBack }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  const [scannedData, setScannedData] = useState<string | null>(null);
  const [scannerError, setScannerError] = useState<string | null>(null);

  const loadUsers = async () => {
    try {
      // Get all users except the current user
      const allUsers = await mockDB.getAllUsers(currentUser.id);
      setUsers(allUsers);
    } catch (error) {
      console.error('Error loading users:', error);
      // Fallback to some default users if API fails
      const fallbackUsers: User[] = [
        { id: 'uid_demo_friend', username: 'Sarah Parker', status: 'busy', job_title: 'Product Manager', avatar_url: 'https://picsum.photos/200/200?random=2', created_at: new Date().toISOString() },
        { id: 'uid_ai_bot', username: 'Gemini Assistant', status: 'online', job_title: 'Virtual Assistant', avatar_url: 'https://picsum.photos/200/200?random=1', created_at: new Date().toISOString() }
      ];
      setUsers(fallbackUsers);
    }
  };

  const loadFriends = async () => {
    const data = await mockDB.getFriends(currentUser.id);
    setFriends(data);
  };

  useEffect(() => {
    loadUsers();
    loadFriends();
    setLoading(false);
  }, [currentUser.id]);

  const isFriend = (userId: string) => {
    return friends.some(f => f.friend_id === userId);
  };

  const handleAddFriend = async (userId: string) => {
    try {
      await mockDB.addFriend(currentUser.id, userId);
      setSuccessMessage(`${users.find(u => u.id === userId)?.username} added successfully!`);
      loadFriends(); // Refresh the friends list
      
      // Clear success message after 2 seconds
      setTimeout(() => setSuccessMessage(''), 2000);
    } catch (error) {
      console.error('Error adding friend:', error);
      alert('Failed to add friend');
    }
  };

  const handleScan = (result: string | null) => {
    if (result && !scannedData) {
      setScannedData(result);
      // Process the scanned result - this could be a user ID or friend code
      console.log('Scanned result:', result);
      
      // Attempt to add the friend based on the scanned result
      // The result might be in the format 'meetme:user:<user_id>'
      if (result.startsWith('meetme:user:')) {
        const userId = result.replace('meetme:user:', '');
        // Find the user in our user list
        const foundUser = users.find(user => user.id === userId);
        if (foundUser) {
          handleAddFriend(userId);
          setTimeout(() => {
            setShowScanner(false);
            setScannedData(null);
          }, 1500);
        } else {
          setScannerError('User not found. Please try again.');
          setTimeout(() => {
            setScannerError(null);
            setScannedData(null);
          }, 3000);
        }
      } else {
        // If the QR code doesn't match our expected format, show an error
        setScannerError('Invalid QR code format. Please scan a valid MeetMe contact QR code.');
        setTimeout(() => {
          setScannerError(null);
          setScannedData(null);
        }, 3000);
      }
    }
  };

  const handleError = (err: any) => {
    console.error('QR Scanner error:', err);
    setScannerError('Camera access denied. Please allow camera permissions to scan QR codes.');
  };

  const filteredUsers = users.filter(user => 
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) &&
    user.id !== currentUser.id &&
    !isFriend(user.id)
  );

  if (showScanner) {
    return (
      <div className="flex flex-col h-full pt-6 pb-20">
        <header className="px-6 mb-4 flex items-center gap-4">
          <button 
            onClick={() => {
              setShowScanner(false);
              setScannedData(null);
              setScannerError(null);
            }}
            className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white"
          >
            <Icons.Back size={24} />
          </button>
          <h1 className="text-2xl font-bold tracking-tight text-white">Scan QR Code</h1>
        </header>

        <div className="flex-1 flex flex-col items-center justify-center px-6">
          <div className="w-full max-w-md">
            {scannerError ? (
              <div className="bg-red-500/20 border border-red-500/30 rounded-2xl p-6 text-center">
                <div className="flex flex-col items-center">
                  <Icons.Scan size={48} className="text-red-400 mb-4" />
                  <p className="text-red-300 mb-4">{scannerError}</p>
                  <button
                    onClick={() => {
                      setScannerError(null);
                      setScannedData(null);
                    }}
                    className="bg-primary-600 hover:bg-primary-500 text-white font-bold py-3 px-6 rounded-xl shadow-lg shadow-primary-900/50 transition-all"
                  >
                    Retry Scan
                  </button>
                </div>
              </div>
            ) : scannedData ? (
              <div className="bg-green-500/20 border border-green-500/30 rounded-2xl p-6 text-center">
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
                    <Icons.Check size={32} className="text-green-400" />
                  </div>
                  <p className="text-green-300 mb-2">Contact found!</p>
                  <p className="text-gray-300 text-sm mb-4 break-words px-4">Processing...</p>
                  <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              </div>
            ) : (
              <div className="relative">
                {/* Camera preview */}
                <div className="aspect-square w-full rounded-2xl overflow-hidden border-4 border-white/20 bg-black relative">
                  <QrScanner
                    onResult={(result) => handleScan(result?.getText() || null)}
                    onError={handleError}
                    style={{ width: '100%', height: '100%' }}
                    constraints={{ facingMode: 'environment' }} // Use back camera
                  />
                  
                  {/* Scanning frame overlay */}
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4/5 h-4/5 max-w-xs max-h-xs border-2 border-primary-500/70 rounded-lg">
                      <div className="absolute -top-1 -left-1 w-6 h-6 border-t-2 border-l-2 border-primary-500 rounded-tl-lg"></div>
                      <div className="absolute -top-1 -right-1 w-6 h-6 border-t-2 border-r-2 border-primary-500 rounded-tr-lg"></div>
                      <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-2 border-l-2 border-primary-500 rounded-bl-lg"></div>
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-2 border-r-2 border-primary-500 rounded-br-lg"></div>
                      
                      {/* Animated scanning line */}
                      <div className="absolute left-0 right-0 top-0 h-1 bg-gradient-to-r from-transparent via-primary-500 to-transparent animate-pulse"></div>
                    </div>
                  </div>
                </div>
                
                <p className="text-center text-gray-400 text-sm mt-4">
                  Point your camera at a QR code to add a contact
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full pt-6 pb-20">
      <header className="px-6 mb-4 flex items-center gap-4">
        <button 
          onClick={onBack}
          className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white"
        >
          <Icons.Back size={24} />
        </button>
        <h1 className="text-2xl font-bold tracking-tight text-white">Add Friend</h1>
      </header>

      <div className="px-6 mb-4 flex gap-2">
        <div className="relative group flex-1">
          <Icons.Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-primary-500 transition-colors" size={18} />
          <input 
            type="text" 
            placeholder="Search by username..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-dark-surface border border-dark-border rounded-xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:border-primary-500 transition-all placeholder-gray-600"
          />
        </div>
        <button 
          onClick={() => setShowScanner(true)}
          className="bg-primary-600 hover:bg-primary-500 text-white p-3 rounded-xl shadow-lg shadow-primary-900/20 flex items-center justify-center"
        >
          <Icons.Scan size={20} />
        </button>
      </div>

      {successMessage && (
        <div className="mx-6 mb-4 p-3 bg-green-900/30 border border-green-800/50 text-green-400 rounded-xl text-center">
          {successMessage}
        </div>
      )}

      <div className="flex-1 overflow-y-auto no-scrollbar px-6">
        {loading ? (
          <div className="flex justify-center p-10"><div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div></div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center p-10 opacity-50 flex flex-col items-center">
            <div className="bg-dark-surface p-4 rounded-full mb-4">
              <Icons.Users size={32} className="text-gray-600" />
            </div>
            <p className="text-sm font-medium">No users found.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredUsers.map(user => (
              <div 
                key={user.id}
                className="flex items-center gap-4 p-4 bg-dark-surface/30 rounded-2xl"
              >
                <div className="relative">
                  <img 
                    src={user.avatar_url} 
                    alt={user.username} 
                    className="w-12 h-12 rounded-full object-cover border-2 border-dark-surface"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-white truncate">{user.username}</h3>
                  <p className="text-gray-400 text-sm truncate max-w-[80%]">{user.job_title}</p>
                </div>
                <button 
                  onClick={() => handleAddFriend(user.id)}
                  className="bg-primary-600 hover:bg-primary-500 text-white p-2 rounded-xl shadow-lg shadow-primary-900/20"
                >
                  <Icons.Plus size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AddFriend;