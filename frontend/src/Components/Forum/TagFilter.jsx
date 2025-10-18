import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { ChevronDown, Tag } from "lucide-react";
import ModernButton from "@/Components/UI/ModernButton";
import api from "@/utils/axiosInstance";
import Loading from "@/Components/Loading/LoadingState";

const TagFilter = ({ selectedTag, onSelectTag }) => {
  const [tags, setTags] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchTags = async () => {
      try {
        setLoading(true);
        const response = await api.get("/forum/tags");
        setTags(response.data);
      } catch (error) {
        console.error("Error fetching tags:", error);
      }
      finally {
        setLoading(false);
      }
    };

    fetchTags();
  }, []);

  const currentTagLabel = selectedTag || "All Tags";

  if (loading) {
    return (
      <div className="px-4 py-2">
        <Loading inline={true} />
      </div>
    );
  }

  return (
    <div className="relative inline-block text-left">
      <ModernButton
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="truncate"
        icon={<Tag className="h-4 w-4" />}
        iconPosition="left"
        rounded="md"
      >
        <span className="truncate">{currentTagLabel}</span>
        <ChevronDown className="ml-1 h-3.5 w-3.5 flex-shrink-0" />
      </ModernButton>

      {isOpen && (
        <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
          <div className="py-1 max-h-64 overflow-y-auto">
          <div
            className={`w-full text-left px-4 py-2 text-sm cursor-pointer ${selectedTag === null ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'}`}
            onClick={() => {
                onSelectTag(null);
                setIsOpen(false);
            }}
          >
            All Tags
          </div>
          {tags.map((tag) => (
            <div
              key={tag}
              className={`w-full text-left px-4 py-2 text-sm cursor-pointer ${selectedTag === tag ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'}`}
              onClick={() => {
                onSelectTag(tag);
                setIsOpen(false);
              }}
            >
              {tag}
            </div>
          ))}
          </div>
        </div>
      )}
    </div>
  );
};

TagFilter.propTypes = {
  selectedTag: PropTypes.string,
  onSelectTag: PropTypes.func.isRequired
};

export default TagFilter;
