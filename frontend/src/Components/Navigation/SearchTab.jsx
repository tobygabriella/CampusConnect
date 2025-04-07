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
    <div className="relative w-full max-w-lg" ref={containerRef}>
      <div className="flex items-center bg-white rounded-full border border-[#d8b4fe] focus-within:border-[#6b46c1] transition-all">
        <Input
          placeholder="Search..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            handleSearch(e.target.value);
          }}
          prefix={<SearchOutlined className="text-[#6b46c1]" />}
          onFocus={() => query && results.length > 0 && setVisible(true)}
          className="!bg-transparent !border-none !shadow-none focus:!ring-0 focus:!outline-none"
          style={{ borderRadius: "9999px" }}
        />

        <Button
          type="text"
          icon={<FilterOutlined className="text-[#6b46c1]" />}
          onClick={() => {
            setShowFilters(!showFilters);
            if (!showFilters) setVisible(false);
          }}
          className="rounded-r-full hover:bg-[#f3e8ff]"
        />
      </div>

      {/* Filter Dropdown */}
      {showFilters && (
        <div
          className="absolute right-0 mt-2 bg-white rounded-md shadow-lg z-50 w-48"
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
                  ? "bg-[#e9e3ff] text-[#6b46c1] font-semibold"
                  : "hover:bg-[#f3e8ff] text-gray-700"
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
          className="absolute mt-2 w-full bg-white border border-gray-300 rounded-md shadow-lg z-40 max-h-80 overflow-y-auto"
        >
          <List
            dataSource={results}
            renderItem={(item) => (
              <List.Item
                onClick={() => handleSelect(item)}
                className="hover:bg-[#f3e8ff] cursor-pointer px-3 py-2"
              >
                <List.Item.Meta
                  avatar={
                    <Avatar src={item.profilePicture || defaultProfile} />
                  }
                  title={<span>{item.name || item.username || "Unknown"}</span>}
                  description={
                    item.role === "service"
                      ? `Service by ${item.provider || "Unknown"}`
                      : item.role || "No role"
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

