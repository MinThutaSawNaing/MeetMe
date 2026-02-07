import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { Icons } from '../components/Icon';

interface ScanProps {
  currentUser: User;
  onSuccess: () => void;
}

const Scan: React.FC<ScanProps> = ({ currentUser, onSuccess }) => {
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
            <div className="flex flex-col items-center">
              <div className="w-20 h-20 bg-primary-500/20 rounded-full flex items-center justify-center mb-6">
                <Icons.Scan size={40} className="text-primary-400" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Ready to Scan</h2>
              <p className="text-gray-400 mb-6 text-center">
                The camera scanning feature has been moved to the Add Friend section.
              </p>
              <button
                onClick={onSuccess}
                className="bg-gradient-to-r from-primary-600 to-cyan-600 hover:from-primary-500 hover:to-cyan-500 text-white font-bold py-3 px-6 rounded-xl shadow-lg shadow-primary-500/20 hover:shadow-xl transition-all duration-300 transform hover:scale-105 active:scale-95"
              >
                Go to Add Friend
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Scan;