import { useState } from "react";
import { X, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import api from "@/utils/axiosInstance";
import { toast } from "react-toastify";
import Loading from "@/Components/Loading/LoadingState";
import PropTypes from 'prop-types';
import { formatRoleName } from "@/utils/formatters";
import { useAuth } from "@/Components/context/AuthContext";

const CreatePostModal = ({ isOpen, onClose, onPostCreated, selectedCollegeId, userCollegeId }) => {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState([]);
  const [newTag, setNewTag] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    if (tags.length === 0) {
      toast.error("Please add at least one tag.");
      return;
    }
  
    setLoading(true);
    console.group('Forum Post Submission');
    try {
      const payload = {
        title,
        content,
        tags,
        collegeId: selectedCollegeId || userCollegeId
      };
  
      const response = await api.post("/forum/posts", payload);
      onPostCreated(response.data);
      toast.success("Post created successfully!");
    } catch (error) {
      console.error("Error creating post:", error);
      toast.error("Failed to create post");
    } finally {
      setLoading(false);
    }
  };
  

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag("");
    }
  };

  const removeTag = (tagToRemove) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/10 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex justify-between items-center border-b p-4">
          <div>
            <h2 className="text-xl font-semibold text-[#062970]">Create New Post</h2>
            {user && (
              <span className="text-xs bg-[#f3e8ff] text-[#6b46c1] px-2 py-0.5 rounded-full">
                {formatRoleName(user.role)}
              </span>
            )}
          </div>
          <Button variant="ghost" onClick={onClose} className= "bg-green-500 text-[#062970] hover:bg-green-600 !bg-transparent hover:!bg-[#f3e8ff]"
           style={{ color: "#062970"}}>
            <X className="h-5 w-5" />
          </Button>
        </div>
        <form onSubmit={handleSubmit} className="p-4">
          <div className="mb-4">
            <label className="block text-sm font-medium text-[#062970] mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-[#062970] text-gray-900 placeholder-gray-400 bg-white"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-[#062970] mb-1">Content</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              className="w-full p-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-[#062970] text-gray-900 placeholder-gray-400 bg-white"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-[#062970] mb-1">Tags</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                className="flex-1 p-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-[#062970] text-gray-900 placeholder-gray-400 bg-white"
                placeholder="Add tag and press Enter"
              />
              <Button
                type="button"
                onClick={addTag}
                className="bg-green-500 text-[#062970] hover:bg-green-600 !bg-transparent hover:!bg-[#f3e8ff]"
                style={{ color: "#062970"}}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center px-2 py-1 bg-[#f3e8ff] text-[#6b46c1] rounded-full text-xs"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="ml-1 text-[#6b46c1] hover:text-[#4c2d87]"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
              className="bg-green-500 text-[#062970] hover:bg-green-600 !bg-transparent hover:!bg-[#f3e8ff]"
              style={{ color: "#062970"}}
            >
              Cancel
            </Button>
            <Button
                type="submit"
                disabled={loading || tags.length === 0}
                className="bg-green-500 text-[#062970] hover:bg-green-600 !bg-transparent hover:!bg-[#f3e8ff]"
                style={{ color: "#062970"}}
                >
                {loading ? <Loading inline={true} /> : "Create Post"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

CreatePostModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onPostCreated: PropTypes.func.isRequired,
  selectedCollegeId: PropTypes.string,
  userCollegeId: PropTypes.string
};

export default CreatePostModal;