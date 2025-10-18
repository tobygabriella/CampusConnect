import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/Components/context/AuthContext";
import { toast } from "react-toastify";
import { Input } from "@/components/ui/input"; 
import { Label } from "@/components/ui/label"; 
import { Card, CardContent } from "@/components/ui/card"; 
import { CameraIcon, User, School, Briefcase, CheckCircle, Upload, ArrowRight } from "lucide-react"; 
import { motion } from "framer-motion";
import ModernButton from "@/Components/UI/ModernButton";
import defaultProfile from "@/assets/default-profile.jpg"; 
import CollegeSelect from "./CollegeSelect";
import api from "@/utils/axiosInstance.js";
import AroLogo from "@/assets/aro.png"; 
import useUsernameAvailability from "@/hooks/useUsernameAvailability";
import Loading from "@/Components/Loading/LoadingState";

const OnboardingPage = () => {
  const [username, setUsername] = useState("");
  const [role, setRole] = useState("");
  const [profilePicture, setProfilePicture] = useState(null);
  const [imagePreview, setImagePreview] = useState(defaultProfile);
  const [error, setError] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [college, setCollege] = useState("");
  const [collegesServed, setCollegesServed] = useState([]);
  const navigate = useNavigate();
  const { verifyAuth } = useAuth();
  const { isAvailable, error: usernameError } = useUsernameAvailability(username);

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
    } catch {
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
      toast.error("Please choose a different username.");
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
        <motion.div 
          className="mb-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <Label className="text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
            <School className="h-4 w-4 text-blue-500" />
            <span>Select Your College</span>
          </Label>
          <CollegeSelect value={college} onChange={setCollege} />
        </motion.div>
      );
    }

    if (role === "service_provider") {
      return (
        <motion.div 
          className="mb-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <Label className="text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
            <School className="h-4 w-4 text-blue-500" />
            <span>Select Colleges You Serve</span>
          </Label>
          <CollegeSelect multiple value={collegesServed} onChange={setCollegesServed} />
        </motion.div>
      );
    }
  };

  return (
    <div className="flex flex-col justify-center items-center min-h-screen w-screen bg-gradient-to-b from-white to-blue-50">
      {/* ARO Logo at the top with animation */}
      <motion.img 
        src={AroLogo} 
        alt="ARO Logo" 
        className="h-40 mb-8" 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      />

      {/* Profile Section */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <Card className="w-full p-6 shadow-xl border border-blue-100 rounded-xl overflow-hidden bg-white">
          <CardContent>
            <motion.div 
              className="flex items-center justify-center mb-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <div className="bg-blue-100 p-3 rounded-full mr-3">
                <User className="h-6 w-6 text-blue-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-800">Set Up Your Profile</h1>
            </motion.div>

          {/* Profile Picture Upload */}
          <motion.div 
            className="flex flex-col items-center mb-6"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="relative w-28 h-28 rounded-full overflow-hidden border-4 border-white shadow-lg group">
              <img src={imagePreview} alt="Profile Preview" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center">
                <label 
                  htmlFor="fileUpload" 
                  className="opacity-0 group-hover:opacity-100 transition-all duration-200 cursor-pointer bg-blue-600 hover:bg-blue-700 text-white p-2.5 rounded-full"
                >
                  <CameraIcon size={18} />
                </label>
              </div>
            </div>
            <input id="fileUpload" type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            <ModernButton 
              onClick={handleUpload} 
              variant="outline"
              size="sm" 
              disabled={isUploading}
              icon={<Upload className="h-4 w-4" />}
              iconPosition="left"
              className="mt-2"
            >
              {isUploading ? <Loading inline /> : "Upload Photo"}
            </ModernButton>
          </motion.div>

          {/* Username Input */}
          <motion.div 
            className="mb-6"
            initial={{ opacity: 0, x: -5 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <Label className="text-sm font-semibold text-gray-700 mb-1.5 block">Choose a Username</Label>
            <div className="relative">
              <Input
                type="text"
                name="username"
                placeholder="Enter Username"
                className="p-3 pl-8 border border-gray-300 rounded-lg text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-300 w-full transition-all shadow-sm"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
              <User className="absolute left-2.5 top-3 h-4 w-4 text-gray-400" />
              {isAvailable === true && username && (
                <div className="mt-1.5 flex items-center text-green-600">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  <p className="text-sm">Username is available</p>
                </div>
              )}
              {isAvailable === false && (
                <div className="mt-1.5 flex items-center text-red-500">
                  <X className="h-4 w-4 mr-1" />
                  <p className="text-sm">{usernameError}</p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Role Selection */}
          <motion.div 
            className="mb-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <Label className="text-sm font-semibold text-gray-700 mb-2 block">I am a...</Label>
            <div className="grid grid-cols-2 gap-3">
              <div 
                onClick={() => setRole("student")}
                className={`flex flex-col items-center p-4 border ${role === "student" ? "border-blue-500 bg-blue-50" : "border-gray-200"} rounded-lg cursor-pointer hover:border-blue-300 hover:bg-blue-50/50 transition-all`}
              >
                <div className={`p-3 rounded-full ${role === "student" ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-600"} mb-2`}>
                  <School className="h-6 w-6" />
                </div>
                <div className="font-medium text-gray-900">Student</div>
              </div>
              
              <div 
                onClick={() => setRole("service_provider")}
                className={`flex flex-col items-center p-4 border ${role === "service_provider" ? "border-blue-500 bg-blue-50" : "border-gray-200"} rounded-lg cursor-pointer hover:border-blue-300 hover:bg-blue-50/50 transition-all`}
              >
                <div className={`p-3 rounded-full ${role === "service_provider" ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-600"} mb-2`}>
                  <Briefcase className="h-6 w-6" />
                </div>
                <div className="font-medium text-gray-900">Service Provider</div>
              </div>
            </div>
          </motion.div>

          {/* College Selection */}
          {renderCollegeSelection()}

          {/* Error Message */}
          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

          {/* Continue Button */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            <ModernButton
              onClick={handleSubmit}
              variant="primary"
              size="lg"
              className="w-full"
              icon={<ArrowRight className="h-5 w-5" />}
              iconPosition="right"
              disabled={
                !isAvailable || !role || (role === "student" && !college) || (role === "service_provider" && collegesServed.length === 0)
              }
            >
              Continue
            </ModernButton>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
    </div>
  );
};

export default OnboardingPage;