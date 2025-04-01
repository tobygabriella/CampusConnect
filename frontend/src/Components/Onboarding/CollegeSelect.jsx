import { useState, useEffect } from "react";
import PropTypes from 'prop-types';
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";
import { Check, X } from "lucide-react";
import api from "/Users/tobygabriella/Desktop/Aro/frontend/src/utils/axiosInstance.js";

const CollegeSelect = ({ multiple = false, value = multiple ? [] : '', onChange }) => {
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]); // For search results
  const [selectedColleges, setSelectedColleges] = useState([]); // For maintaining selected colleges
  const [loading, setLoading] = useState(false);

  // Fetch selected colleges on mount and when value changes
  useEffect(() => {
    const fetchSelectedColleges = async () => {
      if (!value || (Array.isArray(value) && value.length === 0)) {
        setSelectedColleges([]);
        return;
      }

      const ids = Array.isArray(value) ? value : [value];
      const existingSelected = selectedColleges.filter(college => ids.includes(college.id));
      const missingIds = ids.filter(id => !selectedColleges.find(college => college.id === id));

      if (missingIds.length > 0) {
        try {
          // You'll need to create this endpoint in your backend
          const response = await api.get(`http://localhost:5001/colleges/details?ids=${missingIds.join(',')}`);
          const newColleges = response.data.colleges || [];
          setSelectedColleges([...existingSelected, ...newColleges]);
        } catch (error) {
          console.error('Error fetching selected colleges:', error);
        }
      }
    };

    fetchSelectedColleges();
  }, [value]);

  // Handle search
  useEffect(() => {
    if (!search || search.length < 2) {
      setSearchResults([]);
      return;
    }

    const fetchColleges = async () => {
      setLoading(true);
      try {
        const response = await api.get(
          `http://localhost:5001/colleges/search?query=${encodeURIComponent(search)}`
        );
        setSearchResults(response.data.colleges || []);
      } catch (error) {
        console.error('Error fetching colleges:', error);
        setSearchResults([]);
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(fetchColleges, 300);
    return () => clearTimeout(debounceTimer);
  }, [search]);

  const handleSelect = (college) => {
    if (multiple) {
      const currentValue = Array.isArray(value) ? value : [];
      const newValue = currentValue.includes(college.id)
        ? currentValue.filter(id => id !== college.id)
        : [...currentValue, college.id];
      onChange(newValue);
      
      // Update selected colleges
      if (!currentValue.includes(college.id)) {
        setSelectedColleges(prev => [...prev, college]);
      }
    } else {
      onChange(college.id);
      setSelectedColleges([college]);
      setSearch(college.name);
    }
  };

  // Combined array for display in dropdown
  const displayColleges = search ? searchResults : selectedColleges;

  return (
    <div className="relative w-full">
      {/* Command Input and Dropdown */}
      <Command className="border border-gray-300 rounded-lg" shouldFilter={false}>
        <CommandInput
          placeholder="Start typing to search colleges (min. 2 characters)..."
          value={search}
          onValueChange={setSearch}
          className="border-none focus:ring-0 text-[#062970] placeholder:text-gray-400"
        />
        <CommandList>
          <CommandEmpty className="py-2 text-sm text-gray-500">
            {loading ? (
              'Searching...'
            ) : search.length < 2 ? (
              'Type at least 2 characters to search'
            ) : (
              'No colleges found'
            )}
          </CommandEmpty>
          <CommandGroup>
            {displayColleges.map((college) => (
              <CommandItem
                key={college.id}
                value={college.name}
                onSelect={() => handleSelect(college)}
                className="flex items-center justify-between py-2 px-3 cursor-pointer hover:bg-[#f3e8ff]"
              >
                <div>
                  <div className="font-medium text-[#062970]">{college.name}</div>
                  <div className="text-sm text-gray-500">
                    {college.city}, {college.state}
                  </div>
                </div>
                {multiple ? (
                  <Check
                    className={`h-4 w-4 ${
                      value.includes(college.id) ? 'opacity-100 text-[#062970]' : 'opacity-0'
                    }`}
                  />
                ) : (
                  value === college.id && <Check className="h-4 w-4 text-[#062970]" />
                )}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </Command>

      {/* Display selected colleges for multiple select */}
      {multiple && value.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {selectedColleges
            .filter(college => value.includes(college.id))
            .map(college => (
              <span
                key={college.id}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-[#f3e8ff] text-[#062970]"
              >
                {college.name}
                <button
                  onClick={() => handleSelect(college)}
                  className="ml-2 text-[#062970]"
                >
                  <X size={14} className="bg-[#f3e8ff]"/>
                </button>
              </span>
            ))}
        </div>
      )}
    </div>
  );
};

CollegeSelect.propTypes = {
  multiple: PropTypes.bool,
  value: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.arrayOf(PropTypes.string)
  ]).isRequired,
  onChange: PropTypes.func.isRequired
};

export default CollegeSelect;