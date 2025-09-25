import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, ImagePlus, Layers } from "lucide-react";
import { motion } from "framer-motion";
import CreateWorkPost from "./CreateWorkPost";
import SidebarNav from "@/Components/Navigation/SideBarNav";
import TopNavbar from "@/Components/Navigation/TopNavBar";
import ModernButton from "@/Components/UI/ModernButton";

const CreatePostPage = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(true);

  // Close modal and navigate back to home on close
  const handleClose = () => {
    setIsOpen(false);
    navigate("/home");
  };

  // Handle successful post creation
  const handlePostCreated = () => {
    navigate("/home");
  };

  return (
    <div className="flex w-screen min-h-screen bg-gradient-to-b from-white to-[#f5f5f5] overflow-x-hidden">
      <SidebarNav />
      <div className="flex-1 flex flex-col pt-16 min-h-screen overflow-y-auto ml-16 min-[850px]:ml-64">
        <TopNavbar />
        
        <motion.div 
          className="max-w-3xl mx-auto w-full py-12 px-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex flex-col items-center text-center mb-12">
            <div className="bg-purple-100 p-3 rounded-full mb-6">
              <Sparkles className="h-8 w-8 text-purple-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Showcase Your Work</h1>
            <p className="text-gray-600 max-w-md mb-8">
              Share your recent work, haircuts, styles, or beauty services with your community.
            </p>
            <div className="flex justify-center">
              <ModernButton 
                onClick={() => setIsOpen(true)}
                variant="primary"
                size="lg"
                icon={<ImagePlus className="h-5 w-5" />}
                iconPosition="left"
                rounded="full"
              >
                Create Work Post
              </ModernButton>
            </div>
          </div>
          
          {/* Some guidance/tips */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-left">
            <h3 className="font-medium text-lg text-gray-900 mb-4">Tips for a great work post</h3>
            <ul className="space-y-3 text-gray-600">
              <li className="flex gap-2 items-start">
                <div className="h-5 w-5 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-purple-600 text-xs font-bold">1</span>
                </div>
                <span>Upload high-quality images of your finished work</span>
              </li>
              <li className="flex gap-2 items-start">
                <div className="h-5 w-5 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-purple-600 text-xs font-bold">2</span>
                </div>
                <span>Link to the service you provided to help clients book similar appointments</span>
              </li>
              <li className="flex gap-2 items-start">
                <div className="h-5 w-5 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-purple-600 text-xs font-bold">3</span>
                </div>
                <span>Add a descriptive caption explaining techniques used</span>
              </li>
            </ul>
          </div>
        </motion.div>
      </div>

      {/* Render the CreateWorkPost modal */}
      <CreateWorkPost 
        isOpen={isOpen} 
        onClose={handleClose} 
        onPostCreated={handlePostCreated} 
      />
    </div>
  );
};

export default CreatePostPage;