import React, { useState } from 'react';
import { User } from '../types';
import { Icons } from '../components/Icon';
import QRCode from 'react-qr-code';

interface ScanProps {
  currentUser: User;
  onScanQR: () => void;  // Navigate to scan another user's QR
  onShowQR: () => void;  // Navigate to show own QR code
}

const Scan: React.FC<ScanProps> = ({ currentUser, onScanQR, onShowQR }) => {
  const [showOwnQR, setShowOwnQR] = useState(false);

  if (showOwnQR) {
    return (
      <div className="flex flex-col h-full pt-6 pb-20">
        <header className="px-6 mb-4 flex items-center justify-between">
          <button 
            onClick={() => setShowOwnQR(false)}
            className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white"
          >
            <Icons.Back size={24} />
          </button>
          <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-primary-400 to-cyan-400 bg-clip-text text-transparent">
            Your QR Code
          </h1>
          <div className="w-10"></div> {/* Spacer for alignment */}
        </header>

        <div className="flex-1 flex flex-col items-center justify-center px-6">
          <div className="w-full max-w-xs">
            <div className="bg-dark-surface/30 p-6 rounded-2xl border border-dark-border/50">
              <div className="flex flex-col items-center">
                <div className="bg-white p-4 rounded-xl mb-6">
                  <QRCode
                    value={`meetme:user:${currentUser.id}`}
                    size={200}
                    bgColor={'white'}
                    fgColor={'#1e293b'}
                  />
                </div>
                <div className="text-center">
                  <h3 className="font-bold text-white text-lg">{currentUser.username}</h3>
                  <p className="text-gray-400 text-sm mt-1">{currentUser.job_title || 'Team Member'}</p>
                </div>
                <p className="text-gray-400 text-sm mt-4 text-center">
                  Show this code to others to add you as a contact
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full pt-6 pb-20">
      <header className="px-6 mb-4">
        <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-primary-400 to-cyan-400 bg-clip-text text-transparent">
          Scan Contact
        </h1>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <div className="w-full max-w-md">
          <div className="bg-dark-surface/30 border border-dark-border/50 rounded-2xl p-8 text-center">
            <div className="flex flex-col items-center mb-8">
              <div className="w-20 h-20 bg-primary-500/20 rounded-full flex items-center justify-center mb-6">
                <Icons.Scan size={40} className="text-primary-400" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Connect with Others</h2>
              <p className="text-gray-400 text-center">
                Choose an option to connect with other users
              </p>
            </div>

            <div className="space-y-4">
              <button
                onClick={() => setShowOwnQR(true)}
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold py-4 px-6 rounded-xl shadow-lg shadow-purple-500/20 hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3"
              >
                <Icons.QrCode size={24} />
                Show My QR Code
              </button>

              <button
                onClick={onScanQR}
                className="w-full bg-gradient-to-r from-primary-600 to-cyan-600 hover:from-primary-500 hover:to-cyan-500 text-white font-bold py-4 px-6 rounded-xl shadow-lg shadow-primary-500/20 hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3"
              >
                <Icons.Camera size={24} />
                Scan Their QR Code
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Scan;