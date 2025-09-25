import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import api from "@/utils/axiosInstance.js";
import AroLogo from "@/assets/aro.png"; 
import GoogleLogo from "@/assets/google.png";
import Loading from "@/Components/Loading/LoadingState";
import AnimatedElement from "@/Components/Animation/AnimatedElement";
import { motion, AnimatePresence } from "framer-motion";
import ModernButton from "@/Components/UI/ModernButton";
import { ArrowLeft, UserPlus, Mail, Lock, Eye, EyeOff, User } from "lucide-react";

const SignupPage = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();
  const [showVerificationMessage, setShowVerificationMessage] = useState(false);
  const [email, setEmail] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const handleChange = (e) => { setFormData({ ...formData, [e.target.name]: e.target.value });};
  const [loading, setLoading] = useState(false);
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
    setLoading(true); 
    try {
      const response = await api.post("/auth/signup", formData, { withCredentials: true });
      if (response.data.emailSent) {
        toast.success("Signup successful. Please verify your email.");
        setShowVerificationMessage(true);
        setEmail(formData.email); // store for resend
        return; // stop redirect
      }
    } catch (error) {
      console.error("Signup failed:", error.response?.data?.message);
      setErrors({ form: error.response?.data?.message || "Signup failed." });
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
                <img src={AroLogo} alt="ARO Logo" className="h-12" />
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
          <h1 className="text-4xl font-bold mb-6">Join your campus community</h1>
          <p className="text-xl mb-4">Share experiences, discover new trends, and support your friends</p>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="mt-10 grid grid-cols-2 gap-4 text-sm"
          >
            <div className="bg-white/10 backdrop-blur-sm p-4 rounded-xl">
              <h3 className="font-bold text-lg mb-2">Direct Communication</h3>
              <p>Chat with providers to discuss your needs and book appointments</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm p-4 rounded-xl">
              <h3 className="font-bold text-lg mb-2">Campus Community</h3>
              <p>Connect with other students about beauty trends and recommendations</p>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Right panel with signup form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <AnimatedElement animation="fade-in-up" delay={0.3} className="mb-6 flex justify-center lg:hidden">
            <img src={AroLogo} alt="ARO Logo" className="h-16" />
          </AnimatedElement>
          
          <AnimatedElement animation="fade-in" delay={0.5} className="mb-8 text-center">
            <h2 className="text-3xl font-bold text-gray-900">Create an account</h2>
            <p className="text-gray-600 mt-2">Join Aro to connect with service providers</p>
          </AnimatedElement>
          
          {/* Google Signup Button */}
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

          {/* Signup Form */}
          <AnimatedElement animation="fade-in-up" delay={0.9}>
            <form onSubmit={handleSignup} className="flex flex-col gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">Full Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                    <User size={18} />
                  </div>
                  <input
                    type="text"
                    name="name"
                    placeholder="Enter your full name"
                    className={`w-full pl-10 p-3 border ${errors.name ? "border-red-500 focus:ring-red-300" : "border-gray-200 focus:ring-blue-400"} rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:border-transparent transition-all`}
                    onChange={handleChange}
                  />
                </div>
                <AnimatePresence>
                  {errors.name && (
                    <motion.p 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="text-red-500 text-xs mt-1"
                    >
                      {errors.name}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                    <Mail size={18} />
                  </div>
                  <input
                    type="email"
                    name="email"
                    placeholder="Enter your email address"
                    className={`w-full pl-10 p-3 border ${errors.email ? "border-red-500 focus:ring-red-300" : "border-gray-200 focus:ring-blue-400"} rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:border-transparent transition-all`}
                    onChange={handleChange}
                  />
                </div>
                <AnimatePresence>
                  {errors.email && (
                    <motion.p 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="text-red-500 text-xs mt-1"
                    >
                      {errors.email}
                    </motion.p>
                  )}
                </AnimatePresence>
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
                    placeholder="Create a password"
                    className={`w-full pl-10 p-3 border ${errors.password ? "border-red-500 focus:ring-red-300" : "border-gray-200 focus:ring-blue-400"} rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:border-transparent transition-all`}
                    onChange={handleChange}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <AnimatePresence>
                  {errors.password && (
                    <motion.p 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="text-red-500 text-xs mt-1"
                    >
                      {errors.password}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              <AnimatePresence>
                {errors.form && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg overflow-hidden text-sm"
                  >
                    {errors.form}
                  </motion.div>
                )}
              </AnimatePresence>

              <ModernButton
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                rounded="xl"
                icon={<UserPlus size={18} />}
                iconPosition="left"
                disabled={loading}
                className="mt-4"
              >
                {loading ? <Loading inline={true} /> : "Create Account"}
              </ModernButton>
              
              <p className="text-center text-sm text-gray-600 mt-4">
                Already have an account? 
                <Link to="/login" className="text-blue-600 font-medium hover:text-blue-800 ml-1 transition-colors">Sign in</Link>
              </p>
            </form>
          </AnimatedElement>

          {/* Verification Message */}
          {showVerificationMessage && (
            <AnimatedElement animation="scale-in" className="mt-6 bg-green-100 border border-green-400 p-4 rounded-lg text-green-800 text-sm">
              <div className="flex flex-col">
                <div className="flex items-center mb-2">
                  <span className="text-green-500 text-xl mr-2">✓</span>
                  <p className="font-medium">Signup successful!</p>
                </div>
                <p>Please check your email to verify your account. The link expires in 24 hours.</p>
                <ModernButton
                  variant="ghost"
                  size="sm"
                  className="mt-3 text-blue-600"
                  onClick={async () => {
                    try {
                      await api.post("http://localhost:5001/auth/resend-verification", { email });
                      toast.success("Verification email resent!");
                    } catch {
                      toast.error("Failed to resend verification email.");
                    }
                  }}
                >
                  Resend verification email
                </ModernButton>
              </div>
            </AnimatedElement>
          )}
        </div>
      </div>
    </div>
  );
};

export default SignupPage;