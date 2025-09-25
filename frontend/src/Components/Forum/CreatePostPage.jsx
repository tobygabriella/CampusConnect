import { useState } from "react";
import { useNavigate } from "react-router-dom";
import CreatePostModal from "./CreatePostModal";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/Components/context/AuthContext";
import { useUserColleges } from "@/hooks/useUserColleges";

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
    <>
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold text-center mb-4">Create a Post</h1>
        <p className="text-center mb-8">
          Create a new post to share with your college community
        </p>
        <div className="flex justify-center">
          <Button 
            onClick={() => setIsModalOpen(true)}
            className="bg-[#062970] hover:bg-[#041d4b] text-white"
          >
            Open Post Form
          </Button>
        </div>
      </div>

      <CreatePostModal 
        isOpen={isModalOpen}
        onClose={handleClose}
        onPostCreated={handlePostCreated}
        userCollegeId={userCollegeId}
        selectedCollegeId={user?.collegeId}
      />
    </>
  );
};

export default CreatePostPage;
