import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { Icons } from '../components/Icon';
import { QrScanner } from 'react-qr-scanner';

interface ScanProps {
  currentUser: User;
  onSuccess: () => void;
}

const Scan: React.FC<ScanProps> = ({ currentUser, onSuccess }) => {
  const [scannedData, setScannedData] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState<boolean>(true);

  const handleScan = (result: string | null) => {
    if (result && !scannedData) {
      setScannedData(result);
      // Process the scanned result - this could be a user ID or friend code
      console.log('Scanned result:', result);
      
      // Attempt to add the friend based on the scanned result
      // The result might be in the format 'meetme:user:<user_id>'
      if (result.startsWith('meetme:user:')) {
        const userId = result.replace('meetme:user:', '');
        // In a real implementation, you would call the service to add the friend
        // For now, we'll just navigate to the contacts screen after a brief delay
        setTimeout(() => {
          onSuccess();
        }, 1500);
      } else {
        // If the QR code doesn't match our expected format, show an error
        setError('Invalid QR code format. Please scan a valid MeetMe contact QR code.');
        setTimeout(() => {
          setScannedData(null);
          setError(null);
        }, 3000);
      }
    }
  };

  const handleError = (err: any) => {
    console.error('QR Scanner error:', err);
    setError('Camera access denied. Please allow camera permissions to scan QR codes.');
    setCameraActive(false);
  };

  const restartScanner = () => {
    setScannedData(null);
    setError(null);
    setCameraActive(true);
  };

  return (
    <div className="flex flex-col h-full pt-6 pb-20">
      <header className="px-6 mb-4">
        <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-primary-400 to-cyan-400 bg-clip-text text-transparent">
          Scan Contact
        </h1>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <div className="w-full max-w-md">
          {error ? (
            <div className="bg-red-500/20 border border-red-500/30 rounded-2xl p-6 text-center">
              <div className="flex flex-col items-center">
                <Icons.Scan size={48} className="text-red-400 mb-4" />
                <p className="text-red-300 mb-4">{error}</p>
                <button
                  onClick={restartScanner}
                  className="bg-primary-600 hover:bg-primary-500 text-white font-bold py-3 px-6 rounded-xl shadow-lg shadow-primary-900/50 transition-all"
                >
                  Retry Camera
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
                <p className="text-gray-300 text-sm mb-4 break-words px-4">{scannedData.substring(0, 50)}{scannedData.length > 50 ? '...' : ''}</p>
                <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            </div>
          ) : (
            <div className="relative">
              {/* Camera preview */}
              <div className="aspect-square w-full rounded-2xl overflow-hidden border-4 border-white/20 bg-black relative">
                {cameraActive ? (
                  <QrScanner
                    onResult={(result) => handleScan(result?.getText() || null)}
                    onError={handleError}
                    style={{ width: '100%', height: '100%' }}
                    constraints={{ facingMode: 'environment' }} // Use back camera
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-black">
                    <div className="text-center p-6">
                      <Icons.Scan size={64} className="text-gray-500 mx-auto mb-4" />
                      <p className="text-gray-400">Camera unavailable</p>
                    </div>
                  </div>
                )}
                
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
};

export default Scan;