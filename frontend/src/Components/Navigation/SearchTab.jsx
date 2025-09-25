import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Filter, X, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import api from "@/utils/axiosInstance";
import defaultProfile from "@/assets/default-profile.jpg";

const SearchBarWithDropdown = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [visible, setVisible] = useState(false);
  const [filter, setFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const containerRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setVisible(false);
        setShowFilters(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const handleSearch = async (text) => {
    if (!text) {
      setResults([]);
      return;
    }

    try {
      const response = await api.get(`/search`, {
        params: {
          query: text,
          filter: filter,
        },
      });
      const validResults = response.data.filter(
        (item) => item.username || item.provider
      );
      setResults(validResults);
      setVisible(true);
    } catch (error) {
      console.error("Search error:", error);
    }
  };

  const handleSelect = (item) => {
    setVisible(false);
    setShowFilters(false);
    const username = item.username || item.provider;
    if (username) {
      navigate(`/profile/${username}`);
    }
  };

  return (
    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-full w-full max-w-lg px-4 sm:px-0" ref={containerRef}>
      <motion.div 
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="relative"
      >
        <div className="flex items-center bg-white rounded-full border border-gray-200 focus-within:border-blue-400 hover:border-blue-300 shadow-md transition-all">
          <div className="flex items-center flex-grow px-4 py-2">
            <Search className="h-4 w-4 text-gray-400 mr-2" />
            <input
              type="text"
              placeholder="Search users, providers..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                handleSearch(e.target.value);
              }}
              onFocus={() => query && results.length > 0 && setVisible(true)}
              className="bg-transparent border-none w-full focus:outline-none text-sm text-gray-700 placeholder-gray-400"
            />
            {query && (
              <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                onClick={() => {
                  setQuery("");
                  setResults([]);
                  setVisible(false);
                }}
                className="text-gray-400 hover:text-gray-600"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <X className="h-4 w-4" />
              </motion.button>
            )}
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setShowFilters(!showFilters);
              if (!showFilters) setVisible(false);
            }}
            className={`p-2 rounded-r-full flex items-center justify-center transition-colors ${showFilters ? "bg-blue-50 text-blue-600" : "text-gray-200 hover:text-blue-600 hover:bg-blue-50"}`}
          >
            <Filter className="h-4 w-4" />
          </motion.button>
        </div>

      {/* Filter Dropdown */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-2 bg-white rounded-xl border border-gray-100 shadow-lg z-50 w-48 sm:w-56 overflow-hidden"
          >
            <div className="py-2">
              <div className="px-3 py-1 mb-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">Filter By</div>
              {[
                { value: "all", label: "All" },
                { value: "users", label: "Users" },
                { value: "service_providers", label: "Service Providers" },
                { value: "services", label: "Services" },
              ].map((option) => (
                <motion.div
                  key={option.value}
                  onClick={() => {
                    setFilter(option.value);
                    setShowFilters(false);
                    if (query) handleSearch(query);
                  }}
                  className={`px-4 py-2 cursor-pointer transition-all flex items-center ${
                    filter === option.value
                      ? "bg-blue-50 text-blue-600 font-medium"
                      : "hover:bg-gray-50 text-gray-700"
                  }`}
                  whileHover={{ x: 5 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {filter === option.value && (
                    <div className="w-1 h-5 bg-blue-600 rounded-full mr-2"></div>
                  )}
                  {option.label}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results Dropdown */}
      <AnimatePresence>
        {visible && results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
            className="absolute mt-2 w-full bg-white border border-gray-100 rounded-xl shadow-lg z-40 max-h-64 sm:max-h-80 overflow-hidden"
          >
            <div className="py-2">
              <div className="px-4 py-1 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Results ({results.length})
              </div>
              <div className="overflow-y-auto max-h-60 sm:max-h-72">
                {results.map((item, index) => (
                  <motion.div
                    key={item.id || index}
                    onClick={() => handleSelect(item)}
                    className="group hover:bg-blue-50 cursor-pointer px-4 py-3 transition-all flex items-center space-x-3"
                    whileHover={{ x: 3 }}
                    whileTap={{ scale: 0.98 }}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <div className="relative">
                      {item.profilePicture ? (
                        <img 
                          src={item.profilePicture} 
                          alt={item.name || item.username} 
                          className="w-10 h-10 rounded-full object-cover border border-gray-200"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-blue-100 border border-gray-200 flex items-center justify-center">
                          <User className="h-5 w-5 text-blue-600" />
                        </div>
                      )}
                      {item.role === "service_provider" && (
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 group-hover:text-blue-600">
                        {item.name || item.username || "Unknown"}
                      </div>
                      <div className="text-sm text-gray-500 group-hover:text-gray-700">
                        {item.role === "service"
                          ? `Service by ${item.provider || "Unknown"}`
                          : formatRole(item.role) || ""}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      </motion.div>
    </div>
  );
};

// Helper function to format role names nicely
const formatRole = (role) => {
  if (!role) return "";
  
  if (role === "service_provider") return "Service Provider";
  return role.charAt(0).toUpperCase() + role.slice(1);
};

export default SearchBarWithDropdown;
