import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import api from "/Users/tobygabriella/Desktop/Aro/frontend/src/utils/axiosInstance.js";

const LoginPage = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [errorMessage, setErrorMessage] = useState(""); // Store error messages
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMessage(""); // Reset previous errors

    try {
      const response = await api.post("http://localhost:5001/auth/login", formData, { withCredentials: true });

      toast.success("Login successful! Redirecting...");
      
      if (response.data.onboarding) {
        navigate("/onboarding");
      } else if (response.data.user?.role === "service_provider") {
        navigate("/service-provider-info");
      } else {
        navigate("/home"); // Default route for authenticated users
      }
    } catch (error) {
      console.error("Login Error:", error.response);

      if (error.response?.status === 400) {
        setErrorMessage("Incorrect email, username, or password.");
      } else if (error.response?.status === 401) {
        setErrorMessage("Invalid password. Please try again.");
      } else if (error.response?.status === 403) {
        setErrorMessage("Complete onboarding first.");
        navigate("/onboarding"); // Redirect to onboarding if needed
      } else {
        setErrorMessage("Something went wrong. Please try again.");
      }
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen w-screen bg-[#0b1c42]">
      <div className="bg-white p-8 shadow-lg rounded-lg w-full max-w-md">
        <h1 className="text-4xl font-bold text-center text-[#1d3557] mb-4">
          aro<span className="text-[#457b9d]">➝</span>
        </h1>
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <label className="text-sm font-semibold text-black">Email or Username</label>
          <input
            type="text"
            name="email"
            placeholder="Enter Email or Username"
            className="p-3 border border-gray-300 rounded-lg bg-white text-black"
            onChange={handleChange}
            required
          />

          <label className="text-sm font-semibold text-black">Password</label>
          <input
            type="password"
            name="password"
            placeholder="Enter Password"
            className="p-3 border border-gray-300 rounded-lg bg-white text-black"
            onChange={handleChange}
            required
          />

          {errorMessage && <p className="text-red-500 text-sm text-center">{errorMessage}</p>} {/* Display error */}

          <button type="submit" className="w-full bg-black text-white py-2 rounded-lg hover:opacity-80 transition">
            Log In
          </button>

          <a href="http://localhost:5001/auth/google" className="w-full text-center bg-gray-400 text-white py-2 rounded-lg hover:bg-gray-500">
            Log In with Google
          </a>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;




