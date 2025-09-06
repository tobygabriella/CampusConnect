import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import AroLogo from "@/assets/aro.png"; // Import your logo

const GettingStarted = () => {
  return (
    <div className="flex justify-center items-center min-h-screen w-screen bg-gradient-to-b from-white to-[#f5f5f5]">
      {/* Content directly on the background */}
      <div className="text-center max-w-lg -mt-20">
        {/* Logo */}
        <img src={AroLogo} alt="ARO Logo" className="h-45 mx-auto mb-8" /> 
        
        {/* Subheading */}
        <p className="text-gray-600 text-2xl mb-12">
          Let us point you in the right direction
        </p>

        {/* Buttons */}
        <div className="flex flex-col items-center gap-8">
          <Button
            asChild
            className="w-full text-xl py-5 bg-transparent border-2 border-[#062970] text-[#062970] hover:bg-[#062970] hover:text-white rounded-lg transition-all duration-300"
          >
            <Link to="/login">Login →</Link>
          </Button>
          <span className="text-[#ddb2ef] text-lg">or</span>
          <Button
            asChild
            variant="outline"
            className="w-full text-xl py-5 border-2 border-[#062970] text-[#062970] hover:bg-[#062970] hover:text-white rounded-lg transition-all duration-300"
          >
            <Link to="/signup">Sign Up →</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default GettingStarted;




