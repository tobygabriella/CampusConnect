import { useState, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import api from "@/utils/axiosInstance";
import { Button } from "@/components/ui/button";
import Loading from "@/Components/Loading/LoadingState";

const CollegeFilter = ({ 
  userCollegeId,  
  userColleges = [], 
  availableColleges = [], 
  selectedCollegeId,  
  onSelectCollege 
}) => {
  const [allColleges, setAllColleges] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchColleges = async () => {
      if (availableColleges.length > 0) {
        setAllColleges(availableColleges);
        return;
      }
      
      setLoading(true);
      try {
        const response = await api.get("/forum/colleges");
        setAllColleges(response.data);
      } catch (error) {
        console.error("Error fetching colleges:", error);
        setAllColleges(userColleges);
      } finally {
        setLoading(false);
      }
    };

    fetchColleges();
  }, [availableColleges, userColleges]);

  // Get current college name to display
  const getCurrentCollegeName = () => {
    // First check selected college
    if (selectedCollegeId) {
      const college = [...userColleges, ...allColleges].find(
        c => String(c.id) === String(selectedCollegeId) // Compare as strings
      );
      return college?.name || "Selected Community";
    }
    
    // Then check user's default college
    if (userCollegeId) {
      const college = userColleges.find(
        c => String(c.id) === String(userCollegeId) // Compare as strings
      );
      return college?.name || "Your Community";
    }
    
    return "Select Community";
  };

  if (loading) {
    return (
      <div className="px-4 py-2">
        <Loading inline={true} />
      </div>
    );
  }

  return (
    <div className="relative inline-block text-left">
      <div>
        <Button
            variant="outline"
            onClick={() => setIsOpen(!isOpen)}
            className="bg-green-500 text-[#062970] hover:bg-green-600 !bg-transparent hover:!bg-[#f3e8ff]] truncate text-[#062970] border-[#062970]"
            style={{ color: "#062970"}}
            >
            <span className="truncate">{getCurrentCollegeName()}</span>
            <ChevronDown className="ml-2 h-4 w-4 flex-shrink-0" />
        </Button>
      </div>

      {isOpen && (
        <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
          <div className="py-1 max-h-64 overflow-y-auto">
            {/* Your Communities Section */}
            {userColleges.length > 0 && (
              <>
                <div className="px-4 py-2 text-xs font-semibold text-gray-500">
                  Your Communities
                </div>
                {userColleges.map((college) => (
                  <Button
                  key={college.id}
                  variant="ghost"
                  onClick={() => {
                    const currentId = String(college.id);
                    const selectedId = selectedCollegeId ? String(selectedCollegeId) : null;
                    onSelectCollege(currentId === selectedId ? null : currentId);
                    setIsOpen(false);                  
                  }}
                  className={`w-full justify-start px-4 py-2 text-sm ${
                    selectedCollegeId === college.id
                      ? "bg-[#f3e8ff] text-[#6b46c1]"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {college.name}
                </Button>
                ))}
              </>
            )}

            {/* Other Communities Section */}
            {allColleges.filter(c => !userColleges.some(uc => uc.id === c.id)).length > 0 && (
              <>
                <div className="px-4 py-2 text-xs font-semibold text-gray-500">
                  Other Communities
                </div>
                {allColleges
                  .filter(c => !userColleges.some(uc => uc.id === c.id))
                  .map((college) => (
                    <Button
                    key={college.id}
                    variant="ghost"
                    onClick={() => {
                        onSelectCollege(String(college.id));
                        setIsOpen(false);
                    }}
                    className={`w-full justify-start px-4 py-2 text-sm ${
                        selectedCollegeId === college.id
                        ? "bg-[#f3e8ff] text-[#6b46c1]"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                    >
                    {college.name}
                    </Button>
                  ))}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CollegeFilter;