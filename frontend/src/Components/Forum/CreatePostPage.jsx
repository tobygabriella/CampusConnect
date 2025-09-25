import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PenTool, MessageSquare } from "lucide-react";
import CreatePostModal from "./CreatePostModal";
import ModernButton from "@/Components/UI/ModernButton";
import { useAuth } from "@/Components/context/AuthContext";
import { useUserColleges } from "@/hooks/useUserColleges";
import SidebarNav from "@/Components/Navigation/SideBarNav";
import TopNavbar from "@/Components/Navigation/TopNavBar";
import { motion } from "framer-motion";

const CreatePostPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { userCollegeId } = useUserColleges();

  const handleClose = () => {
    setIsModalOpen(false);
    navigate("/community");
  };

  const handlePostCreated = (newPost) => {
    setIsModalOpen(false);
    navigate(`/community/posts/${newPost.id}`);
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
            <div className="bg-blue-100 p-3 rounded-full mb-6">
              <PenTool className="h-8 w-8 text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Create a Community Post</h1>
            <p className="text-gray-600 max-w-md mb-8">
              Share your thoughts, questions or ideas with your college community.
            </p>
            <div className="flex justify-center">
              <ModernButton 
                onClick={() => setIsModalOpen(true)}
                variant="primary"
                size="lg"
                icon={<MessageSquare className="h-5 w-5" />}
                iconPosition="left"
                rounded="full"
              >
                Open Post Form
              </ModernButton>
            </div>
          </div>
          
          {/* Some guidance/tips */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-left">
            <h3 className="font-medium text-lg text-gray-900 mb-4">Tips for a great post</h3>
            <ul className="space-y-3 text-gray-600">
              <li className="flex gap-2 items-start">
                <div className="h-5 w-5 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-blue-600 text-xs font-bold">1</span>
                </div>
                <span>Use a clear, descriptive title that captures the main point</span>
              </li>
              <li className="flex gap-2 items-start">
                <div className="h-5 w-5 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-blue-600 text-xs font-bold">2</span>
                </div>
                <span>Add relevant tags to help others find your post</span>
              </li>
              <li className="flex gap-2 items-start">
                <div className="h-5 w-5 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-blue-600 text-xs font-bold">3</span>
                </div>
                <span>Be respectful and follow community guidelines</span>
              </li>
            </ul>
          </div>
        </motion.div>
      </div>

      <CreatePostModal 
        isOpen={isModalOpen}
        onClose={handleClose}
        onPostCreated={handlePostCreated}
        userCollegeId={userCollegeId}
        selectedCollegeId={user?.collegeId}
      />
    </div>
  );
};

export default CreatePostPage;
