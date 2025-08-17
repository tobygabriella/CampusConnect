import SearchBarWithDropdown from "@/Components/Navigation/SearchTab";
import { useAuth } from "@/Components/context/AuthContext";

const TopNavbar = () => {
  const { user } = useAuth();

  return (
    <div className="relative h-2 bg-white border-b border-gray-200 px-6 flex items-start justify-center transition-all duration-300">
      {user?.role === "student" && <SearchBarWithDropdown />}
    </div>
  );
};

export default TopNavbar;