import { useAuth } from '/Users/tobygabriella/Desktop/Aro/frontend/src/Components/context/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';

const ServiceProviderInfo = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#0b1c42]">
      <h1 className="text-4xl font-bold text-white mb-8">Service Provider Info</h1>
      <button
        onClick={handleLogout}
        className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
      >
        Logout
      </button>
    </div>
  );
};

export default ServiceProviderInfo;