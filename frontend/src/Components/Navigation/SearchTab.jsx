import { useState, useRef, useEffect } from "react";
import { Input, List, Avatar, Button } from "antd";
import { useNavigate } from "react-router-dom";
import { SearchOutlined, FilterOutlined } from "@ant-design/icons";
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
      <div className="flex items-center bg-white rounded-full border border-[#d8b4fe] focus-within:border-[#010a4f] transition-all py-0 h-6">
        <Input
          placeholder="Search..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            handleSearch(e.target.value);
          }}
          prefix={<SearchOutlined className="text-[#010a4f]" />}
          onFocus={() => query && results.length > 0 && setVisible(true)}
          className="!bg-transparent !border-none !shadow-none focus:!ring-0 focus:!outline-none !py-0 !text-xs !h-6"
          style={{ borderRadius: "9999px" }}
        />

        <Button
          type="text"
          icon={<FilterOutlined className="text-[#010a4f]" />}
          onClick={() => {
            setShowFilters(!showFilters);
            if (!showFilters) setVisible(false);
          }}
          className="rounded-r-full hover:bg-[#023e8a] hover:text-white active:bg-[#555555]"
        />
      </div>

      {/* Filter Dropdown */}
      {showFilters && (
        <div
          className="absolute right-0 mt-2 bg-white rounded-md shadow-lg z-50 w-48 sm:w-56"
        >
          {[
            { value: "all", label: "All" },
            { value: "users", label: "Users" },
            { value: "service_providers", label: "Service Providers" },
            { value: "services", label: "Services" },
          ].map((option) => (
            <div
              key={option.value}
              onClick={() => {
                setFilter(option.value);
                setShowFilters(false);
                if (query) handleSearch(query);
              }}
              className={`px-4 py-2 cursor-pointer transition rounded ${
                filter === option.value
                  ? "bg-[#023e8a] text-white font-semibold"
                  : "hover:bg-[#023e8a] hover:text-white text-[#010a4f]"
              }`}
            >
              {option.label}
            </div>
          ))}
        </div>
      )}

      {/* Results Dropdown */}
      {visible && results.length > 0 && (
        <div
          className="absolute mt-2 w-full bg-white border border-gray-300 rounded-md shadow-lg z-40 max-h-60 sm:max-h-80 overflow-y-auto"
        >
          <List
            dataSource={results}
            renderItem={(item) => (
              <List.Item
                onClick={() => handleSelect(item)}
                className="group hover:bg-[#023e8a] hover:text-white cursor-pointer px-3 py-2 transition-colors"
              >
                <List.Item.Meta
                  avatar={
                    <Avatar src={item.profilePicture || defaultProfile} />
                  }
                  title={<span className="text-[#010a4f] group-hover:text-white">{item.name || item.username || "Unknown"}</span>}
                  description={
                    <span className="text-[#555555] group-hover:text-gray-200">
                      {item.role === "service"
                        ? `Service by ${item.provider || "Unknown"}`
                        : item.role || "No role"}
                    </span>
                  }
                />
              </List.Item>
            )}
          />
        </div>
      )}
    </div>
  );
};

export default SearchBarWithDropdown;
