import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import AroLogo from "@/assets/aro.png";
import GoogleLogo from "@/assets/google.png";
import { useAuth } from "@/Components/context/AuthContext";
import Loading from "@/Components/Loading/LoadingState";
import { useLocation } from "react-router-dom";

const LoginPage = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const { login} = useAuth();
  const [errorMessage, setErrorMessage] = useState(""); // Store error messages
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const verified = queryParams.get("verified") === "true";

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMessage(""); // Reset previous errors
    setLoading(true);
    try {
      await login(formData, navigate);
      toast.success("Login successful! Redirecting...");
    } catch (error) {
      console.error("Login Error:", error.response);

      if (error.response?.status === 400) {
        setErrorMessage("Incorrect email, username, or password.");
      } else if (error.response?.status === 401) {
        setErrorMessage("Invalid password. Please try again.");
      } else if (error.response?.status === 403 && error.response?.data?.resend) {
        setErrorMessage("Please verify your email. We've sent you a new link.");
      } else if (error.response?.status === 403) {
        setErrorMessage("Complete onboarding first.");
        navigate("/onboarding"); // Redirect to onboarding if needed
      } else {
        setErrorMessage("Something went wrong. Please try again.");
      }
    }finally {
      setLoading(false); // Set loading to false when done
    }
  };

  return (
    <div className="flex flex-col justify-center items-center min-h-screen w-screen bg-gradient-to-b from-white to-[#f5f5f5]">
      <img src={AroLogo} alt="ARO Logo" className="h-40 mb-6" />
      
      {/* Google Login Button */}
      <a
        href="http://localhost:5001/auth/google"
        className="flex items-center justify-center w-80 bg-white text-black py-3 rounded-full shadow-md hover:bg-gray-100 transition-all duration-300 border"
      >
        <img src={GoogleLogo} alt="Google Logo" className="h-6 w-6 mr-3" />
        Continue with Google
      </a>
      
      {/* Separator */}
      <p className="text-gray-500 my-4">or log in with email and password</p>

      {verified && (
        <div className="bg-green-100 border border-green-500 text-green-700 p-3 rounded w-80 mb-4 text-sm text-center">
           Your email has been verified! You can now log in.
        </div>
      )}
      {/* Login Form */}
      <form onSubmit={handleLogin} className="flex flex-col gap-4 w-80">
        <label className="text-sm font-semibold text-[#062970]">Email or Username <span className="text-red-500">*</span></label>
        <input
          type="text"
          name="email"
          placeholder="Enter Email or Username"
          className="p-4 border border-gray-300 rounded-lg text-black text-lg focus:outline-none focus:border-[#062970]"
          onChange={handleChange}
          required
        />

        <label className="text-sm font-semibold text-[#062970]">Password <span className="text-red-500">*</span></label>
        <input
          type="password"
          name="password"
          placeholder="Enter Password"
          className="p-4 border border-gray-300 rounded-lg text-black text-lg focus:outline-none focus:border-[#062970]"
          onChange={handleChange}
          required
        />

        {/* Display error message */}
        {errorMessage && <p className="text-red-500 text-sm text-center">{errorMessage}</p>}

        <button
          type="submit"
          className="flex items-center justify-center w-80 bg-[#062970] text-white py-3 rounded-full shadow-md hover:bg-[#051f5c] transition-all duration-300"
        >
          {loading ? <Loading inline={true} /> : "Log In"}
        </button>
      </form>
    </div>
  );
};

export default LoginPage;