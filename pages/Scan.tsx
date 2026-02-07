import React, { useState } from 'react';
import { User } from '../types';
import { Icons } from '../components/Icon';
import QRCode from 'react-qr-code';

interface ScanProps {
  currentUser: User;
  onSuccess: () => void;
}

const Scan: React.FC<ScanProps> = ({ currentUser, onSuccess }) => {
  const [scanMode, setScanMode] = useState<'qr' | 'manual'>('qr');

  return (
    <div className="flex flex-col h-full pt-6 pb-20">
      <header className="px-6 mb-4">
        <h1 className="text-2xl font-bold tracking-tight text-white">Add Contact</h1>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <div className="w-full max-w-xs">
          <div className="flex border border-dark-border rounded-xl overflow-hidden mb-6">
            <button
              className={`flex-1 py-3 text-center font-medium ${
                scanMode === 'qr' 
                  ? 'bg-primary-600 text-white' 
                  : 'bg-dark-surface text-gray-400 hover:text-white'
              }`}
              onClick={() => setScanMode('qr')}
            >
              Scan QR
            </button>
            <button
              className={`flex-1 py-3 text-center font-medium ${
                scanMode === 'manual' 
                  ? 'bg-primary-600 text-white' 
                  : 'bg-dark-surface text-gray-400 hover:text-white'
              }`}
              onClick={() => setScanMode('manual')}
            >
              Manual
            </button>
          </div>

          {scanMode === 'qr' ? (
            <div className="bg-dark-surface p-4 rounded-2xl border border-dark-border">
              <div className="aspect-square w-full bg-black rounded-xl flex items-center justify-center p-4">
                <div className="bg-white p-4 rounded-xl">
                  <QRCode
                    value={`meetme:user:${currentUser.id}`}
                    size={200}
                    bgColor={'white'}
                    fgColor={'black'}
                  />
                </div>
              </div>
              <p className="text-center text-gray-400 text-sm mt-4">
                Show this QR code to your friend to add you
              </p>
            </div>
          ) : (
            <div className="bg-dark-surface p-6 rounded-2xl border border-dark-border">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-400 mb-2">Username</label>
                  <input
                    type="text"
                    placeholder="Enter username"
                    className="w-full bg-dark-bg border border-dark-border rounded-xl p-3 focus:outline-none focus:border-primary-500 text-sm"
                  />
                </div>
                
                <button 
                  onClick={onSuccess}
                  className="w-full bg-primary-600 hover:bg-primary-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-primary-900/50 transition-all"
                >
                  Add Friend
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Scan;