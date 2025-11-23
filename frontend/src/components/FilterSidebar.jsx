import React, { useMemo, useState, useCallback, useRef, useEffect } from "react";

const uniq = (list, key) => {
  if (!list || list.length === 0) return [];
  
  const uniqueValues = new Set();
  list.forEach(item => {
    const value = item?.[key];
    if (value && value !== 'null' && value !== null) {
      uniqueValues.add(String(value));
    }
  });
  
  return Array.from(uniqueValues).sort();
};

// SearchableDropdown component - custom dropdown with search inside
const SearchableDropdown = React.memo(({ label, name, options, filterValue, onFilterChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  // Filter options based on search query
  const filteredOptions = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return options;
    return options.filter(opt => 
      String(opt).toLowerCase().includes(q)
    );
  }, [options, searchQuery]);

  // Get display text for the control
  const displayText = filterValue || "All";

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchQuery("");
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      // Focus search input when dropdown opens
      setTimeout(() => {
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        }
      }, 0);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleOptionSelect = (value) => {
    onFilterChange(name, value);
    setIsOpen(false);
    setSearchQuery("");
  };

  const handleControlClick = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setSearchQuery("");
    }
  };

  return (
    <div className="f-field" ref={dropdownRef} style={{ position: 'relative' }}>
      <div className="f-label">{label}</div>
      <div style={{ position: 'relative' }}>
        {/* Clickable control */}
        <div
          onClick={handleControlClick}
          style={{
            width: '100%',
            padding: '10px 40px 10px 12px',
            borderRadius: '12px',
            border: '1px solid #d1d5db',
            backgroundColor: '#fff',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '14px',
            color: filterValue ? '#374151' : '#9ca3af',
            outline: 'none'
          }}
        >
          <span>{displayText}</span>
          <span style={{ 
            fontSize: '12px', 
            color: '#6b7280',
            position: 'absolute',
            right: '12px',
            top: '50%',
            transform: isOpen ? 'translateY(-50%) rotate(180deg)' : 'translateY(-50%) rotate(0deg)',
            transition: 'transform 0.2s',
            pointerEvents: 'none'
          }}>
            ▼
          </span>
        </div>

        {/* Dropdown panel */}
        {isOpen && (
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              marginTop: '4px',
              backgroundColor: '#fff',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              zIndex: 1000,
              maxHeight: '300px',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {/* Search input */}
            <div style={{ padding: '8px', borderBottom: '1px solid #e5e7eb' }}>
              <input
                ref={searchInputRef}
                type="text"
                placeholder={`Search ${label.toLowerCase()}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                style={{
                  width: '100%',
                  padding: '6px 8px',
                  borderRadius: '4px',
                  border: '1px solid #d1d5db',
                  fontSize: '13px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Options list */}
            <div
              style={{
                maxHeight: '250px',
                overflowY: 'auto',
                overflowX: 'hidden'
              }}
            >
              {/* "All" option */}
              <div
                onClick={() => handleOptionSelect("")}
                style={{
                  padding: '8px 12px',
                  cursor: 'pointer',
                  backgroundColor: !filterValue ? '#f3f4f6' : 'transparent',
                  fontSize: '14px',
                  color: '#374151',
                  borderBottom: '1px solid #f3f4f6'
                }}
                onMouseEnter={(e) => {
                  if (filterValue) e.target.style.backgroundColor = '#f9fafb';
                }}
                onMouseLeave={(e) => {
                  if (filterValue) e.target.style.backgroundColor = 'transparent';
                }}
              >
                All
              </div>

              {/* Filtered options */}
              {filteredOptions.length > 0 ? (
                filteredOptions.map((opt) => (
                  <div
                    key={opt}
                    onClick={() => handleOptionSelect(opt)}
                    style={{
                      padding: '8px 12px',
                      cursor: 'pointer',
                      backgroundColor: filterValue === opt ? '#f3f4f6' : 'transparent',
                      fontSize: '14px',
                      color: '#374151',
                      borderBottom: '1px solid #f3f4f6'
                    }}
                    onMouseEnter={(e) => {
                      if (filterValue !== opt) e.target.style.backgroundColor = '#f9fafb';
                    }}
                    onMouseLeave={(e) => {
                      if (filterValue !== opt) e.target.style.backgroundColor = 'transparent';
                    }}
                  >
                    {opt}
                  </div>
                ))
              ) : (
                <div style={{
                  padding: '12px',
                  textAlign: 'center',
                  fontSize: '13px',
                  color: '#9ca3af'
                }}>
                  No results found
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison - only re-render if these specific props change
  const optionsEqual = prevProps.options.length === nextProps.options.length &&
    prevProps.options.every((opt, idx) => opt === nextProps.options[idx]);
  
  return (
    prevProps.label === nextProps.label &&
    prevProps.name === nextProps.name &&
    prevProps.filterValue === nextProps.filterValue &&
    optionsEqual &&
    prevProps.onFilterChange === nextProps.onFilterChange
  );
});

export default function FilterSidebar({ data, value, onChange, onReset, sortBy, onSortChange }) {
  // Helper to get unique values from multiple possible field names
  // Checks both direct fields and metadata fields
  const uniqMulti = (list, fieldNames) => {
    if (!list || list.length === 0) return [];
    const uniqueValues = new Set();
    list.forEach(item => {
      for (const field of fieldNames) {
        // Check direct field first
        let value = item?.[field];
        if (value && value !== 'null' && value !== null && value !== '') {
          uniqueValues.add(String(value));
          break; // Use first found value
        }
        
        // Check metadata field if direct field not found
        if (!value && item?.metadata) {
          value = item.metadata[field];
          if (value && value !== 'null' && value !== null && value !== '') {
            uniqueValues.add(String(value));
            break; // Use first found value
          }
        }
      }
    });
    return Array.from(uniqueValues).sort();
  };

  // Using multiple possible field name formats
  // Check Excel column names first (as they're stored in metadata), then fallback to other formats
  const acno = useMemo(() => uniqMulti(data, ["ACNO", "acno"]), [data]);
  const accession = useMemo(() => uniqMulti(data, ["ACCESSION", "accession"]), [data]);
  const countries = useMemo(() => uniqMulti(data, ["COUNTRY", "e origin country", "E Origin Country", "e_origin_country"]), [data]);
  const provinces = useMemo(() => uniqMulti(data, ["PROVINCE/STATE", "e origin province", "E Origin Province", "e_origin_province"]), [data]);
  const pedigrees = useMemo(() => uniqMulti(data, ["PEDIGREE DESCRIPTION", "e pedigree", "E pedigree", "E Pedigree", "e_pedigree"]), [data]);
  const taxons = useMemo(() => uniqMulti(data, ["TAXON", "taxon"]), [data]);

  // Handler for filter changes - stable reference
  const handleFilterChange = useCallback((name, filterValue) => {
    onChange(prev => ({ ...prev, [name]: filterValue }));
  }, [onChange]);

  return (
    <div className="filters-card">
      <div className="filters-title-row">
        <h3>Filters</h3>
        <button className="reset" onClick={onReset}>
          Reset All
        </button>
      </div>
      <SearchableDropdown 
        label="ACNO" 
        name="acno" 
        options={acno}
        filterValue={value.acno || ""}
        onFilterChange={handleFilterChange}
      />
      <SearchableDropdown 
        label="ACCESSION" 
        name="accession" 
        options={accession}
        filterValue={value.accession || ""}
        onFilterChange={handleFilterChange}
      />
      <SearchableDropdown 
        label="COUNTRY" 
        name="country" 
        options={countries}
        filterValue={value.country || ""}
        onFilterChange={handleFilterChange}
      />
      <SearchableDropdown 
        label="PROVINCE/STATE" 
        name="province" 
        options={provinces}
        filterValue={value.province || ""}
        onFilterChange={handleFilterChange}
      />
      <SearchableDropdown 
        label="PEDIGREE DESCRIPTION" 
        name="pedigree" 
        options={pedigrees}
        filterValue={value.pedigree || ""}
        onFilterChange={handleFilterChange}
      />
      <SearchableDropdown 
        label="TAXON" 
        name="taxon" 
        options={taxons}
        filterValue={value.taxon || ""}
        onFilterChange={handleFilterChange}
      />
      
      {/* Sort By Section */}
      <div className="f-field" style={{ marginTop: '20px', marginBottom: '0', borderTop: '1px solid #e5e7eb', paddingTop: '16px' }}>
        <div className="f-label" style={{ fontWeight: 'bold', marginBottom: '12px', color: '#000000' }}>SORT BY</div>
        
        {/* Select Field Section */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '13px', fontWeight: '500', marginBottom: '8px', color: '#374151' }}>Select Field</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', fontSize: '14px' }}>
              <input
                type="radio"
                name="sortField"
                value="ACCESSION"
                checked={sortBy?.field === "ACCESSION"}
                onChange={(e) => {
                  onSortChange({ field: e.target.value, order: sortBy?.order || "" });
                }}
                style={{
                  marginRight: '8px',
                  width: '16px',
                  height: '16px',
                  cursor: 'pointer',
                  accentColor: '#22c55e'
                }}
              />
              <span style={{ color: '#374151' }}>ACCESSION</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', fontSize: '14px' }}>
              <input
                type="radio"
                name="sortField"
                value="CULTIVAR NAME"
                checked={sortBy?.field === "CULTIVAR NAME"}
                onChange={(e) => {
                  onSortChange({ field: e.target.value, order: sortBy?.order || "" });
                }}
                style={{
                  marginRight: '8px',
                  width: '16px',
                  height: '16px',
                  cursor: 'pointer',
                  accentColor: '#22c55e'
                }}
              />
              <span style={{ color: '#374151' }}>CULTIVAR NAME</span>
            </label>
          </div>
        </div>
        
        {/* Select Order Section */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ fontSize: '13px', fontWeight: '500', marginBottom: '8px', color: '#374151' }}>Select Order</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', fontSize: '14px' }}>
              <input
                type="radio"
                name="sortOrder"
                value="ascending"
                checked={sortBy?.order === "ascending"}
                onChange={(e) => {
                  onSortChange({ field: sortBy?.field || "", order: e.target.value });
                }}
                disabled={!sortBy?.field}
                style={{
                  marginRight: '8px',
                  width: '16px',
                  height: '16px',
                  cursor: sortBy?.field ? 'pointer' : 'not-allowed',
                  accentColor: '#22c55e',
                  opacity: sortBy?.field ? 1 : 0.5
                }}
              />
              <span style={{ color: sortBy?.field ? '#374151' : '#9ca3af' }}>Ascending Order</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', cursor: sortBy?.field ? 'pointer' : 'not-allowed', fontSize: '14px' }}>
              <input
                type="radio"
                name="sortOrder"
                value="descending"
                checked={sortBy?.order === "descending"}
                onChange={(e) => {
                  onSortChange({ field: sortBy?.field || "", order: e.target.value });
                }}
                disabled={!sortBy?.field}
                style={{
                  marginRight: '8px',
                  width: '16px',
                  height: '16px',
                  cursor: sortBy?.field ? 'pointer' : 'not-allowed',
                  accentColor: '#22c55e',
                  opacity: sortBy?.field ? 1 : 0.5
                }}
              />
              <span style={{ color: sortBy?.field ? '#374151' : '#9ca3af' }}>Descending Order</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', cursor: sortBy?.field ? 'pointer' : 'not-allowed', fontSize: '14px' }}>
              <input
                type="radio"
                name="sortOrder"
                value="latest"
                checked={sortBy?.order === "latest"}
                onChange={(e) => {
                  onSortChange({ field: sortBy?.field || "", order: e.target.value });
                }}
                disabled={!sortBy?.field}
                style={{
                  marginRight: '8px',
                  width: '16px',
                  height: '16px',
                  cursor: sortBy?.field ? 'pointer' : 'not-allowed',
                  accentColor: '#22c55e',
                  opacity: sortBy?.field ? 1 : 0.5
                }}
              />
              <span style={{ color: sortBy?.field ? '#374151' : '#9ca3af' }}>Latest</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}