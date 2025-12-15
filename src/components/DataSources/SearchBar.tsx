import { Search } from "lucide-react";
import React, { memo } from "react";

interface SearchBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  filterStatus: string;
  onStatusChange: (value: string) => void;
  filterCategory: string;
  onCategoryChange: (value: string) => void;
}

const SearchBar: React.FC<SearchBarProps> = memo(
  ({
    searchTerm,
    onSearchChange,
    filterStatus,
    onStatusChange,
    filterCategory,
    onCategoryChange,
  }: any) => (
    <div className="p-4 border-b border-gray-200 flex gap-4">
      <div className="w-3/5 relative">
        <Search
          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
          size={18}
        />
        <input
          type="text"
          placeholder="Search connectors by name or type..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none "
        />
      </div>
      <select
        value={filterStatus}
        onChange={(e) => onStatusChange(e.target.value)}
        className="w-1/5 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none "
      >
        <option value="all">All Status</option>
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
        <option value="error">Error</option>
      </select>
      <select
        value={filterCategory}
        onChange={(e) => onCategoryChange(e.target.value)}
        className="w-1/5 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none "
      >
        <option value="all">All Categories</option>
        <option value="database">Database</option>
        <option value="cloud">Cloud</option>
      </select>
    </div>
  )
);

export default SearchBar;

SearchBar.displayName = "SearchBar";
