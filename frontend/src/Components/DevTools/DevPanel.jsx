import { useState } from 'react';
import { useAuth } from '@/Components/context/AuthContext';

// Only shows in development mode
const DevPanel = () => {
  const DEV_MODE = import.meta.env.VITE_DEV_MODE === "true";
  const { user, switchDevRole } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);
  
  if (!DEV_MODE) return null;

  const togglePanel = () => {
    setIsExpanded(!isExpanded);
  };

  const switchToStudentRole = () => {
    if (switchDevRole) {
      switchDevRole('student');
    }
  };

  const switchToProviderRole = () => {
    if (switchDevRole) {
      switchDevRole('service_provider');
    }
  };

  return (
    <div 
      className="fixed bottom-4 right-4 z-50 bg-black bg-opacity-80 text-white rounded-lg shadow-lg"
      style={{ maxWidth: isExpanded ? '300px' : '120px' }}
    >
      {/* Header bar */}
      <div 
        className="p-2 flex justify-between items-center cursor-pointer"
        onClick={togglePanel}
      >
        <span className="text-yellow-300 font-bold">⚠️ DEV MODE</span>
        <span>{isExpanded ? '▲' : '▼'}</span>
      </div>
      
      {/* Expanded panel */}
      {isExpanded && (
        <div className="p-3 border-t border-gray-600">
          <div className="mb-4">
            <div className="text-xs text-gray-400 mb-1">Current Role:</div>
            <div className="font-mono text-green-400">{user?.role || 'none'}</div>
          </div>
          
          <div className="mb-4">
            <div className="text-xs text-gray-400 mb-1">Actions:</div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={switchToStudentRole}
                className="bg-blue-700 hover:bg-blue-600 text-white px-2 py-1 rounded text-xs"
                disabled={user?.role === 'student'}
              >
                Switch to Student
              </button>
              <button
                onClick={switchToProviderRole}
                className="bg-purple-700 hover:bg-purple-600 text-white px-2 py-1 rounded text-xs"
                disabled={user?.role === 'service_provider'}
              >
                Switch to Provider
              </button>
            </div>
          </div>
          
          <div className="text-xs text-gray-400 mt-2">
            Set VITE_DEV_MODE="false" in .env to disable
          </div>
        </div>
      )}
    </div>
  );
};

export default DevPanel;
