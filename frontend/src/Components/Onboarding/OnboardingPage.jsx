import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button"; // ShadCN Button
import { Input } from "@/components/ui/input"; // ShadCN Input
import { Label } from "@/components/ui/label"; // ShadCN Label
import { Card, CardContent } from "@/components/ui/card"; // ShadCN Card
import { CameraIcon } from "lucide-react"; // Camera icon for profile upload
import defaultProfile from "@/assets/default-profile.jpg"; // Default profile image
import CollegeSelect from "./CollegeSelect";
import api from "/Users/tobygabriella/Desktop/Aro/frontend/src/utils/axiosInstance.js";

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
      await api.post(
        "http://localhost:5001/onboarding/complete",
        { 
          username, 
          role,
          college: role === "student" ? college : null,
          collegesServed: role === "service_provider" ? collegesServed : []
        },
        { withCredentials: true }
      );
      toast.success("Onboarding complete! Redirecting...");
      if (role === "service_provider") {
        navigate("/service-provider-info");
      } else {
        navigate("/home");
      }
    } catch (error) {
      setError(error.response?.data?.message || "Failed to complete onboarding.");
    }
  };

  const renderCollegeSelection = () => {
    if (!role) return null;

    if (role === "student") {
      return (
        <div className="mb-4">
          <Label className="text-sm font-semibold text-gray-300">Select Your College</Label>
          <CollegeSelect
            value={college}
            onChange={setCollege}
          />
        </div>
      );
    }

    if (role === "service_provider") {
      return (
        <div className="mb-4">
          <Label className="text-sm font-semibold text-gray-300">Select Colleges You Serve</Label>
          <CollegeSelect
            multiple
            value={collegesServed}
            onChange={setCollegesServed}
          />
        </div>
      );
    }
  };

  return (
    <div className="flex flex-col items-center min-h-screen w-screen bg-[#0b1c42]">
      {/* Profile Section */}
      <div className="w-full h-44 bg-[#3a6ea5] rounded-b-3xl flex justify-center items-center relative">
        <div className="absolute -bottom-10 flex flex-col items-center">
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
      </div>

      {/* Form Section */}
      <Card className="w-full max-w-md p-6 shadow-lg mt-14">
        <CardContent>
        <h1 className="text-2xl font-bold text-center text-white mb-6">Set Up Your Profile</h1>

        <Label className="text-sm font-semibold text-gray-300">Username</Label>

        <Input
            type="text"
            name="username"
            placeholder="Enter Username"
            className="p-3 mb-2 border border-gray-500 text-black bg-white"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            />

          {isAvailable === true && <p className="text-green-500 text-sm">✅ Username is available</p>}
          {isAvailable === false && <p className="text-red-500 text-sm">❌ {error}</p>}

          <Label className="text-sm font-semibold text-gray-300">Select Your Role</Label>
          <select
            name="role"
            className="p-3 border border-gray-500 rounded-lg bg-white text-black w-full mb-4"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            >
            <option value="">-- Select Role --</option>
            <option value="student">Student</option>
            <option value="service_provider">Service Provider</option>
            </select>
            {renderCollegeSelection()}

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <Button 
            onClick={handleSubmit}
            className={`w-full py-2 rounded-lg transition ${
              isAvailable && role && 
              ((role === "student" && college) || 
               (role === "service_provider" && collegesServed.length > 0))
                ? "bg-black text-white hover:opacity-80" 
                : "bg-gray-400 text-gray-200 cursor-not-allowed"
            }`}
            disabled={
              !isAvailable || !role || 
              (role === "student" && !college) ||
              (role === "service_provider" && collegesServed.length === 0)
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