import React, { useMemo } from "react";

export default function SearchBar({ value, onChange, onSearch, onImageSearch, onKeyDown, inputRef, autoComplete, children }) {
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      onSearch();
    }
  };

  // Memoize placeholder to prevent recalculation on every render
  const placeholder = useMemo(() => {
    return value.trim().toLowerCase().startsWith('mal') 
      ? "Search by Accession (e.g., MAL0412)" 
      : "Search by Cultivar (e.g., Bedford)";
  }, [value]);

  return (
    <div className="search-card">
      <input
        ref={inputRef}
        className="search-input"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onKeyPress={handleKeyPress}
        onKeyDown={onKeyDown}
        autoComplete={autoComplete}
      />
      <button className="search-btn" onClick={onSearch}>Search</button>
      {children}
    </div>
  );
}
