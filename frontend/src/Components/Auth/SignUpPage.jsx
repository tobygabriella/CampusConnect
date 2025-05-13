import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import api from "@/utils/axiosInstance.js";
import AroLogo from "@/assets/aro.png"; 
import GoogleLogo from "@/assets/google.png";

const SignupPage = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    let validationErrors = {};
    if (!formData.name) validationErrors.name = "Name is required.";
    if (!formData.email) validationErrors.email = "Email is required.";
    if (!formData.password) validationErrors.password = "Password is required.";

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      const response = await api.post("http://localhost:5001/auth/signup", formData, { withCredentials: true });
      toast.success("Signup successful! Redirecting...");
      if (response.data.onboarding) {
        navigate("/onboarding");
      } else {
        navigate("/dashboard");
      }
    } catch (error) {
      console.error("❌ Signup failed:", error.response?.data?.message);
      setErrors({ form: error.response?.data?.message || "Signup failed." });
    }
  };

  return (
    <div className="flex flex-col justify-center items-center min-h-screen w-screen bg-gradient-to-b from-[#f3e8ff] to-white">
      <img src={AroLogo} alt="ARO Logo" className="h-40 mb-6" />
      
      {/* Google Signup Button */}
      <a
        href="http://localhost:5001/auth/google"
        className="flex items-center justify-center w-80 bg-white text-black py-3 rounded-full shadow-md hover:bg-gray-100 transition-all duration-300 border"
      >
        <img src={GoogleLogo} alt="Google Logo" className="h-6 w-6 mr-3" />
        Continue with Google
      </a>
      
      {/* Separator */}
      <p className="text-gray-500 my-4">or sign up with email and password</p>
      
      {/* Signup Form */}
      <form onSubmit={handleSignup} className="flex flex-col gap-4 w-80">
      <label className="text-sm font-semibold text-[#062970]">Name <span className="text-red-500">*</span></label>
        <input
          type="text"
          name="name"
          placeholder="Full Name"
          className="p-3 border border-gray-300 rounded-lg text-black focus:outline-none focus:border-[#062970]"
          onChange={handleChange}
        />
        {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
        <label className="text-sm font-semibold text-[#062970]">Email <span className="text-red-500">*</span></label>
        <input
          type="email"
          name="email"
          placeholder="Email Address"
          className="p-3 border border-gray-300 rounded-lg text-black focus:outline-none focus:border-[#062970]"
          onChange={handleChange}
        />
        {errors.email && <p className="text-red-500 text-sm">{errors.email}</p>}

        <label className="text-sm font-semibold text-[#062970]">Password <span className="text-red-500">*</span></label>
        <input
          type="password"
          name="password"
          placeholder="Password"
          className="p-3 border border-gray-300 rounded-lg text-black focus:outline-none focus:border-[#062970]"
          onChange={handleChange}
        />
        {errors.password && <p className="text-red-500 text-sm">{errors.password}</p>}

        <button
        type="submit"
        className="flex items-center justify-center w-80 bg-[#062970] text-white py-3 rounded-full shadow-md hover:bg-[#051f5c] transition-all duration-300"
        >
          Sign Up
        </button>
      </form>
    </div>
  );
};

export default SignupPage;