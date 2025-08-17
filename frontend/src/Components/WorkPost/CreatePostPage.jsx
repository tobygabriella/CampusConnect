import { useState } from "react";
import { useNavigate } from "react-router-dom";
import CreateWorkPost from "./CreateWorkPost";
import SidebarNav from "@/Components/Navigation/SideBarNav";
import TopNavbar from "@/Components/Navigation/TopNavBar";

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
        {/* The page content will be behind the modal */}
        <div className="max-w-xl mx-auto py-6 px-4 space-y-6">
          <p className="text-center text-gray-500">Creating a new post...</p>
        </div>
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