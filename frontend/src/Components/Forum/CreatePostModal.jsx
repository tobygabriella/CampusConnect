import { useState } from "react";
import { X, Plus, PlusCircle, Hash, MessageCircle, PenTool, User } from "lucide-react";
import api from "@/utils/axiosInstance";
import { toast } from "react-toastify";
import Loading from "@/Components/Loading/LoadingState";
import PropTypes from 'prop-types';
import { formatRoleName } from "@/utils/formatters";
import { useAuth } from "@/Components/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import ModernButton from "@/Components/UI/ModernButton";

// Styles are now in main.css

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
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black"
            onClick={onClose}
          />
          
          <motion.div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="create-post-modal bg-white rounded-xl shadow-lg w-full max-w-lg border border-gray-100 overflow-hidden"
              initial={{ scale: 0.9, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 20, opacity: 0 }}
              transition={{ type: "spring", damping: 25 }}
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex justify-between items-center border-b border-gray-100 p-5">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <PenTool className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">Create New Post</h2>
                    {user && (
                      <div className="flex items-center gap-1 mt-1">
                        <User className="h-3 w-3 text-gray-400" />
                        <span className="text-xs text-gray-500">
                          Posting as <span className="text-blue-600 font-medium">{formatRoleName(user.role)}</span>
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                
                <ModernButton
                  variant="ghost"
                  size="sm"
                  className="!p-2"
                  onClick={onClose}
                  rounded="full"
                >
                  <X className="h-5 w-5" />
                </ModernButton>
              </div>
              
              {/* Form */}
              <form onSubmit={handleSubmit} className="p-5">
                <div className="space-y-5">
                  {/* Title Input */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <MessageCircle className="h-4 w-4 text-gray-500" />
                        <span>Title</span>
                      </div>
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="input-modern w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent text-gray-800 placeholder-gray-400 bg-white transition-all shadow-sm"
                      placeholder="Write a descriptive title"
                      required
                    />
                  </div>
                  
                  {/* Content Input */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <PenTool className="h-4 w-4 text-gray-500" />
                        <span>Content</span>
                      </div>
                    </label>
                    <textarea
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      rows={5}
                      className="input-modern w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent text-gray-800 placeholder-gray-400 bg-white transition-all shadow-sm"
                      placeholder="Share your thoughts, questions, or ideas..."
                      required
                    />
                  </div>
                  
                  {/* Tags Input */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <Hash className="h-4 w-4 text-gray-500" />
                        <span>Tags</span>
                        <span className="text-xs text-gray-400 font-normal">(at least one required)</span>
                      </div>
                    </label>
                    
                    <div className="flex gap-2 mb-2">
                      <div className="flex-1 relative">
                        <input
                          type="text"
                          value={newTag}
                          onChange={(e) => setNewTag(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                          className="input-modern w-full p-3 pl-9 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent text-gray-800 placeholder-gray-400 bg-white transition-all shadow-sm"
                          placeholder="Add tag and press Enter"
                        />
                        <Hash className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
                      </div>
                      
                      <ModernButton
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addTag}
                        disabled={!newTag.trim()}
                        className="px-3"
                      >
                        <Plus className="h-4 w-4" />
                      </ModernButton>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 min-h-[36px]">
                      <AnimatePresence>
                        {tags.map((tag) => (
                          <motion.span
                            key={tag}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
                            className="inline-flex items-center px-2 py-1 bg-blue-50 text-blue-600 border border-blue-100 rounded-full text-xs"
                          >
                            #{tag}
                            <button
                              type="button"
                              onClick={() => removeTag(tag)}
                              className="ml-1.5 text-blue-500 hover:text-blue-700 transition-colors"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </motion.span>
                        ))}
                      </AnimatePresence>
                    </div>
                    
                    {tags.length === 0 && (
                      <p className="text-xs text-amber-600 mt-1.5">
                        Please add at least one tag to categorize your post.
                      </p>
                    )}
                  </div>
                </div>
                
                {/* Actions */}
                <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-gray-100">
                  <ModernButton
                    type="button"
                    variant="ghost"
                    size="md"
                    onClick={onClose}
                  >
                    Cancel
                  </ModernButton>
                  
                  <ModernButton
                    type="submit"
                    variant="primary"
                    size="md"
                    icon={<PlusCircle className="h-4 w-4" />}
                    iconPosition="left"
                    disabled={loading || tags.length === 0}
                  >
                    {loading ? <Loading inline={true} /> : "Create Post"}
                  </ModernButton>
                </div>
              </form>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
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
