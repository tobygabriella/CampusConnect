import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";

const SignupPage = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  // Update form data
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handle form submission with validation
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
      const response = await axios.post("http://localhost:5001/auth/signup", formData, { withCredentials: true });

      toast.success("Signup successful! Redirecting...");
      
      if (response.data.onboarding) {
        navigate("/onboarding"); // Redirect to onboarding page
      } else {
        navigate("/dashboard"); // Redirect to dashboard if onboarding is complete
      }
    } catch (error) {
      setErrors({ form: error.response?.data?.message || "Signup failed." });
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen w-screen bg-[#0b1c42]">
      <div className="bg-white p-8 shadow-lg rounded-lg w-full max-w-md">
        <h1 className="text-4xl font-bold text-center text-[#1d3557] mb-4">
          aro<span className="text-[#457b9d]">➝</span>
        </h1>
        <form onSubmit={handleSignup} className="flex flex-col gap-4">
          <label className="text-sm font-semibold text-black">Name</label>
          <input
            type="text"
            name="name"
            placeholder="Full Name"
            className="p-3 border border-gray-300 rounded-lg bg-white text-black"
            onChange={handleChange}
          />
          {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}

          <label className="text-sm font-semibold text-black">Email</label>
          <input
            type="email"
            name="email"
            placeholder="Email Address"
            className="p-3 border border-gray-300 rounded-lg bg-white text-black"
            onChange={handleChange}
          />
          {errors.email && <p className="text-red-500 text-sm">{errors.email}</p>}

          <label className="text-sm font-semibold text-black">Password</label>
          <input
            type="password"
            name="password"
            placeholder="Password"
            className="p-3 border border-gray-300 rounded-lg bg-white text-black"
            onChange={handleChange}
          />
          {errors.password && <p className="text-red-500 text-sm">{errors.password}</p>}

          <button type="submit" className="w-full bg-black text-white py-2 rounded-lg hover:opacity-80 transition">
            Sign Up
          </button>
          <a href="http://localhost:5001/auth/google" className="w-full text-center bg-gray-400 text-white py-2 rounded-lg hover:bg-gray-500">
            Sign Up with Google
          </a>
        </form>
      </div>
    </div>
  );
};

export default SignupPage;

