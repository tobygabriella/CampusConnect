import { useState, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
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
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="bg-green-500 text-[#062970] hover:bg-green-600 !bg-transparent hover:!bg-[#f3e8ff] border-[#062970] truncate"
      >
        <span className="truncate">{currentTagLabel}</span>
        <ChevronDown className="ml-2 h-4 w-4 flex-shrink-0" />
      </Button>

      {isOpen && (
        <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
          <div className="py-1 max-h-64 overflow-y-auto">
          <Button
            variant="ghost"
            onClick={() => {
                onSelectTag(null);
                setIsOpen(false);
            }}
            className={`w-full justify-start px-4 py-2 text-sm ${
                selectedTag === null
                ? "bg-[#f3e8ff] text-[#6b46c1]"
                : "text-gray-700 hover:bg-gray-100"
            }`}
            >
            All Tags
            </Button>
            {tags.map((tag) => (
                <Button
                    key={tag}
                    variant="ghost"
                    onClick={() => {
                        onSelectTag(tag);
                        setIsOpen(false);
                    }}
                    className={`w-full justify-start px-4 py-2 text-sm ${
                        selectedTag === tag
                        ? "bg-[#f3e8ff] text-[#6b46c1]"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                    >
                    {tag}
                    </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TagFilter;