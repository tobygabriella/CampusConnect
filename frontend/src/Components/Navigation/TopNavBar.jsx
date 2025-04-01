import SearchBarWithDropdown from "@/Components/Navigation/SearchTab";

const TopNavbar = () => {
  return (
    <div className="h-16 bg-[#f3e8ff] border-b border-gray-200 px-6 flex items-center justify-center fixed left-64 top-0 right-0 z-40">
      <SearchBarWithDropdown />
    </div>
  );
};

export default TopNavbar;