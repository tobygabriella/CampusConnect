import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import AroLogo from "@/assets/aro.png";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import AnimatedElement from "@/Components/Animation/AnimatedElement";

const GettingStarted = () => {
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        when: "beforeChildren", 
        staggerChildren: 0.3,
        duration: 0.8 
      } 
    }
  };
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.8 } }
  };

  const buttonHoverVariants = {
    hover: { scale: 1.03, transition: { duration: 0.3 } },
    tap: { scale: 0.98 }
  };

  return (
    <div className="relative flex justify-center items-center min-h-screen overflow-hidden bg-gradient-to-b from-aro-light-blue via-white to-white">
      {/* Background animated circles */}
      <motion.div 
        className="absolute top-24 right-20 h-64 w-64 bg-blue-100 rounded-full opacity-30 blur-3xl"
        animate={{ 
          scale: [1, 1.2, 1], 
          x: [0, 20, 0],
          y: [0, -20, 0]
        }} 
        transition={{ 
          repeat: Infinity, 
          duration: 15,
          ease: "easeInOut" 
        }}
      />

      <motion.div 
        className="absolute bottom-24 left-20 h-64 w-64 bg-blue-200 rounded-full opacity-20 blur-3xl"
        animate={{ 
          scale: [1, 1.3, 1], 
          x: [0, -20, 0],
          y: [0, 20, 0]
        }} 
        transition={{ 
          repeat: Infinity, 
          duration: 12,
          ease: "easeInOut",
          delay: 2
        }}
      />

      {/* Main content */}
      <motion.div 
        className="relative z-10 text-center max-w-md px-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Logo */}
        <motion.div variants={itemVariants}>
          <img src={AroLogo} alt="ARO Logo" className="h-32 mx-auto mb-8" /> 
        </motion.div>
        
        {/* Heading */}
        <motion.h1 
          className="text-3xl md:text-4xl font-bold text-aro-navy mb-4"
          variants={itemVariants}
        >
          Welcome to Aro
        </motion.h1>

        {/* Subheading */}
        <motion.p 
          className="text-gray-600 text-xl mb-12"
          variants={itemVariants}
        >
          Let us point you in the right direction
        </motion.p>

        {/* Buttons */}
        <div className="space-y-6">
          <motion.div variants={itemVariants}>
            <motion.div 
              variants={buttonHoverVariants}
              whileHover="hover"
              whileTap="tap"
              className="w-full"
            >
              <Link 
                to="/login" 
                className="flex items-center justify-center w-full py-4 bg-aro-navy text-white rounded-xl hover:bg-aro-blue transition-all duration-300 text-lg font-medium"
              >
                <span>Log in to your account</span>
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </motion.div>
          </motion.div>

          <motion.div 
            variants={itemVariants}
            className="flex items-center justify-center space-x-4"
          >
            <div className="h-px bg-gray-300 flex-grow"></div>
            <span className="text-gray-500 px-2">or</span>
            <div className="h-px bg-gray-300 flex-grow"></div>
          </motion.div>

          <motion.div variants={itemVariants}>
            <motion.div 
              variants={buttonHoverVariants}
              whileHover="hover"
              whileTap="tap"
              className="w-full"
            >
              <Link 
                to="/signup" 
                className="flex items-center justify-center w-full py-4 bg-white border-2 border-aro-navy text-aro-navy rounded-xl hover:bg-aro-light-blue transition-all duration-300 text-lg font-medium"
              >
                <span>Create an account</span>
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </motion.div>
          </motion.div>

          <motion.div variants={itemVariants} className="mt-10">
            <Link 
              to="/" 
              className="text-aro-accent hover:text-aro-navy transition-colors font-medium"
            >
              Return to home page
            </Link>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default GettingStarted;




