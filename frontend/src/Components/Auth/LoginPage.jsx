import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import AroLogo from "@/assets/aro.png";
import GoogleLogo from "@/assets/google.png";
import { useAuth } from "@/Components/context/AuthContext";
import Loading from "@/Components/Loading/LoadingState";
import { useLocation } from "react-router-dom";
import AnimatedElement from "@/Components/Animation/AnimatedElement";
import { motion, AnimatePresence } from "framer-motion";
import ModernButton from "@/Components/UI/ModernButton";
import { ArrowLeft, LogIn, Mail, Lock, Eye, EyeOff } from "lucide-react";

const LoginPage = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const { login } = useAuth();
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
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
    <div className="flex min-h-screen w-full bg-aro-light-blue">
      {/* Header for returning back to main site */}
      <motion.header
        className="absolute top-0 left-0 right-0 z-50 py-4 px-6"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="container mx-auto">
          <div className="flex justify-between items-center">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <Link to="/">
                <img src={AroLogo} alt="ARO Logo" className="h-8" />
              </Link>
            </motion.div>
            
            <ModernButton 
              variant="ghost"
              size="sm"
              icon={<ArrowLeft className="h-4 w-4" />}
              iconPosition="left"
              rounded="full"
              href="/"
            >
              Back to Home
            </ModernButton>
          </div>
        </div>
      </motion.header>
      
      {/* Left panel with logo and decorative elements */}
      <div className="hidden lg:flex lg:w-1/2 bg-aro-navy justify-center items-center relative overflow-hidden">
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          transition={{ duration: 1 }}
          className="absolute inset-0 bg-gradient-to-br from-aro-navy via-aro-blue to-aro-accent opacity-80"
        ></motion.div>
        
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="z-10 text-white max-w-lg px-8"
        >
          <h1 className="text-4xl font-bold mb-6">Welcome back to Aro</h1>
          <p className="text-xl mb-4">Discover and book quality personal care services for you</p>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="mt-10 grid grid-cols-2 gap-4 text-sm"
          >
            <div className="bg-white/10 backdrop-blur-sm p-4 rounded-xl">
              <h3 className="font-bold text-lg mb-2">Peer-Vetted Providers</h3>
              <p>Find trusted service providers recommended by your campus community</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm p-4 rounded-xl">
              <h3 className="font-bold text-lg mb-2">Easy Scheduling</h3>
              <p>Book appointments that fit your busy student schedule</p>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Right panel with login form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <AnimatedElement animation="fade-in-up" delay={0.3} className="mb-6 flex justify-center lg:hidden">
            <img src={AroLogo} alt="ARO Logo" className="h-16" />
          </AnimatedElement>
          
          <AnimatedElement animation="fade-in" delay={0.5} className="mb-8 text-center">
            <h2 className="text-3xl font-bold text-aro-navy">Log in to your account</h2>
            <p className="text-aro-gray mt-2">Welcome back! Please enter your details</p>
          </AnimatedElement>
          
          {verified && (
            <AnimatedElement animation="scale-in" className="bg-green-100 border border-green-500 text-green-700 p-3 rounded-lg mb-6 text-sm text-center">
              ✅ Your email has been verified! You can now log in.
            </AnimatedElement>
          )}
          
          {/* Google Login Button */}
          <AnimatedElement animation="fade-in-up" delay={0.7} className="mb-6">
            <ModernButton
              variant="secondary"
              fullWidth
              href="http://localhost:5001/auth/google"
              icon={<img src={GoogleLogo} alt="Google Logo" className="h-5 w-5" />}
              iconPosition="left"
              rounded="xl"
              className="bg-white py-3"
            >
              Continue with Google
            </ModernButton>
            
            {/* Separator */}
            <div className="flex items-center my-6">
              <div className="flex-grow border-t border-gray-300"></div>
              <span className="px-4 text-sm text-gray-500">or continue with email</span>
              <div className="flex-grow border-t border-gray-300"></div>
            </div>
          </AnimatedElement>

          {/* Login Form */}
          <AnimatedElement animation="fade-in-up" delay={0.9}>
            <form onSubmit={handleLogin} className="flex flex-col gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">Email or Username</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                    <Mail size={18} />
                  </div>
                  <input
                    type="text"
                    name="email"
                    placeholder="Enter your email or username"
                    className="w-full pl-10 p-3 border border-gray-200 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                    <Lock size={18} />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="••••••••"
                    className="w-full pl-10 p-3 border border-gray-200 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
                    onChange={handleChange}
                    required
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Display error message */}
              <AnimatePresence>
                {errorMessage && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-red-50 border border-red-200 rounded-lg overflow-hidden"
                  >
                    <p className="text-red-600 text-sm p-3">
                      {errorMessage}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex justify-between items-center mt-1 mb-2">
                <div className="flex items-center">
                  <input 
                    type="checkbox" 
                    id="remember" 
                    className="h-4 w-4 text-blue-600 focus:ring-blue-400 border-gray-300 rounded" 
                  />
                  <label htmlFor="remember" className="ml-2 text-sm text-gray-600">Remember me</label>
                </div>
                <a href="#" className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors">Forgot password?</a>
              </div>

              <ModernButton
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                rounded="xl"
                icon={<LogIn size={18} />}
                iconPosition="left"
                disabled={loading}
                className="mt-2"
              >
                {loading ? <Loading inline={true} /> : "Sign in"}
              </ModernButton>
              
              <p className="text-center text-sm text-gray-600 mt-4">
                Don't have an account? 
                <Link to="/signup" className="text-blue-600 font-medium hover:text-blue-800 ml-1 transition-colors">Sign up</Link>
              </p>
            </form>
          </AnimatedElement>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;