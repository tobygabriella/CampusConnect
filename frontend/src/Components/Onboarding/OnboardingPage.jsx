import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "/Users/tobygabriella/Desktop/Aro/frontend/src/Components/context/AuthContext.jsx";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"; 
import { Label } from "@/components/ui/label"; 
import { Card, CardContent } from "@/components/ui/card"; 
import { CameraIcon } from "lucide-react"; 
import defaultProfile from "@/assets/default-profile.jpg"; 
import CollegeSelect from "./CollegeSelect";
import api from "/Users/tobygabriella/Desktop/Aro/frontend/src/utils/axiosInstance.js";
import AroLogo from "@/assets/aro.png"; 

const OnboardingPage = () => {
  const [username, setUsername] = useState("");
  const [role, setRole] = useState("");
  const [profilePicture, setProfilePicture] = useState(null);
  const [imagePreview, setImagePreview] = useState(defaultProfile);
  const [error, setError] = useState("");
  const [isAvailable, setIsAvailable] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [college, setCollege] = useState("");
  const [collegesServed, setCollegesServed] = useState([]);
  const navigate = useNavigate();
  const { verifyAuth } = useAuth();

  // Check username availability
  useEffect(() => {
    if (!username) {
      setIsAvailable(null);
      setError("");
      return;
    }

    const checkUsername = async () => {
      try {
        await api.get(`http://localhost:5001/onboarding/check-username/${username}`);
        setIsAvailable(true);
        setError("");
      } catch (error) {
        setIsAvailable(false);
        setError(error.response?.data?.message || "Username is already taken.");
      }
    };

    const debounce = setTimeout(checkUsername, 500);
    return () => clearTimeout(debounce);
  }, [username]);

  // Handle file selection
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePicture(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  // Upload profile picture
  const handleUpload = async () => {
    if (!profilePicture) return toast.error("Please select a profile picture.");

    setIsUploading(true);
    const formData = new FormData();
    formData.append("profilePicture", profilePicture);

    try {
      const response = await api.post("http://localhost:5001/upload/profile-picture", formData, {
        withCredentials: true,
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Profile picture uploaded!");
      setImagePreview(response.data.imageUrl);
    } catch (error) {
      toast.error("Failed to upload profile picture.");
    } finally {
      setIsUploading(false);
    }
  };

  // Handle onboarding submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !role) {
      setError("Username and role selection are required.");
      return;
    }
    if (!isAvailable) {
      setError("Please choose a different username.");
      return;
    }
    if (role === "student" && !college) {
      setError("Please select your college.");
      return;
    }
    if (role === "service_provider" && collegesServed.length === 0) {
      setError("Please select at least one college you serve.");
      return;
    }

    try {
      const response = await api.post(
        "http://localhost:5001/onboarding/complete",
        {
          username,
          role,
          college: role === "student" ? college : null,
          collegesServed: role === "service_provider" ? collegesServed : [],
        },
        { withCredentials: true }
      );
      toast.success("Onboarding complete! Redirecting...");
      await verifyAuth();

      // Update this navigation logic
      if (role === "service_provider") {
        navigate("/service-provider-info", { replace: true });
      } else {
        navigate("/profile", { replace: true });
      }
    } catch (error) {
      console.error("Onboarding Error:", error);
      console.error("Error Response Data:", error.response?.data);
      setError(error.response?.data?.message || "Failed to complete onboarding.");
    }
  };

  const renderCollegeSelection = () => {
    if (!role) return null;

    if (role === "student") {
      return (
        <div className="mb-4">
          <Label className="text-sm font-semibold text-[#062970]">Select Your College</Label>
          <CollegeSelect value={college} onChange={setCollege} />
        </div>
      );
    }

    if (role === "service_provider") {
      return (
        <div className="mb-4">
          <Label className="text-sm font-semibold text-[#062970]">Select Colleges You Serve</Label>
          <CollegeSelect multiple value={collegesServed} onChange={setCollegesServed} />
        </div>
      );
    }
  };

  return (
    <div className="flex flex-col justify-center items-center min-h-screen w-screen bg-gradient-to-b from-[#f3e8ff] to-white">
      {/* ARO Logo at the top */}
      <img src={AroLogo} alt="ARO Logo" className="h-40 mb-6" />

      {/* Profile Section */}
      <Card className="w-full max-w-md p-6 shadow-lg">
        <CardContent>
          <h1 className="text-2xl font-bold text-center text-[#062970] mb-6">Set Up Your Profile</h1>

          {/* Profile Picture Upload */}
          <div className="flex flex-col items-center mb-6">
            <div className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-white">
              <img src={imagePreview} alt="Profile Preview" className="w-full h-full object-cover" />
              <label htmlFor="fileUpload" className="absolute bottom-0 w-full h-1/3 bg-black bg-opacity-50 flex justify-center items-center cursor-pointer">
                <CameraIcon size={18} className="text-white" />
              </label>
            </div>
            <input id="fileUpload" type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            <Button onClick={handleUpload} className="mt-2 text-sm" size="sm" variant="outline" disabled={isUploading}>
              {isUploading ? "Uploading..." : "Upload Profile Photo"}
            </Button>
          </div>

          {/* Username Input */}
          <div className="mb-4">
            <Label className="text-sm font-semibold text-[#062970]">Username</Label>
            <Input
              type="text"
              name="username"
              placeholder="Enter Username"
              className="p-3 border border-gray-300 rounded-lg text-black focus:outline-none focus:border-[#062970] w-full"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            {isAvailable === true && <p className="text-green-500 text-sm">✅ Username is available</p>}
            {isAvailable === false && <p className="text-red-500 text-sm">❌ {error}</p>}
          </div>

          {/* Role Selection */}
          <div className="mb-4">
            <Label className="text-sm font-semibold text-[#062970]">Select Your Role</Label>
            <select
              name="role"
              className="p-3 border border-gray-300 rounded-lg text-black focus:outline-none focus:border-[#062970] w-full"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="">-- Select Role --</option>
              <option value="student">Student</option>
              <option value="service_provider">Service Provider</option>
            </select>
          </div>

          {/* College Selection */}
          {renderCollegeSelection()}

          {/* Error Message */}
          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

          {/* Continue Button */}
          <Button
            onClick={handleSubmit}
            className={`w-full py-3 rounded-full transition ${
              isAvailable && role && ((role === "student" && college) || (role === "service_provider" && collegesServed.length > 0))
                ? "bg-[#062970] text-white hover:bg-[#051f5c]"
                : "bg-gray-400 text-gray-200 cursor-not-allowed"
            }`}
            disabled={
              !isAvailable || !role || (role === "student" && !college) || (role === "service_provider" && collegesServed.length === 0)
            }
          >
            Continue
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default OnboardingPage;