import React from "react";

export default function SearchBar({ value, onChange, onSearch, onImageSearch, onKeyDown, inputRef, autoComplete, children }) {
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      onSearch();
    }
  };

  return (
    <div className="search-card">
      <input
        ref={inputRef}
        className="search-input"
        placeholder={value.trim().toLowerCase().startsWith('mal') ? "Search by Accession (e.g., MAL0412)" : "Search by Cultivar (e.g., Bedford)"}
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
