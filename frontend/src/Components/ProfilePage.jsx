import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "react-toastify";
import { useAuth } from "@/Components/context/AuthContext";

const ProfilePage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Logged out successfully");
      navigate("/login");
    } catch (error) {
      toast.error("Failed to logout");
    }
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-[#0b1c42] flex justify-center items-center p-4 w-screen bg-[#0b1c42]">
      <Card className="w-full max-w-md">
        <CardContent className="p-6">
          <div className="text-center space-y-6">
            <h1 className="text-3xl font-bold text-blue-900">Profile</h1>
            
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-gray-600 text-sm">Username</p>
                <p className="text-xl font-semibold text-gray-900">{user.username}</p>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-gray-600 text-sm">Role</p>
                <p className="text-xl font-semibold text-gray-900 capitalize">
                  {user.role === 'service_provider' ? 'Service Provider' : user.role}
                </p>
              </div>

              {user.role === 'student' && user.college && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-gray-600 text-sm">College</p>
                  <p className="text-xl font-semibold text-gray-900">{user.college}</p>
                </div>
              )}
            </div>

            <Button
              onClick={handleLogout}
              className="w-full bg-red-600 hover:bg-red-700 text-white"
            >
              Logout
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfilePage;