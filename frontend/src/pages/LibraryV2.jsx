import React, { useEffect, useMemo, useRef, useState, useDeferredValue, startTransition } from "react";
import FilterSidebar from "../components/FilterSidebar";
import SearchBar from "../components/SearchBar";
import { ChevronDown, Trash2, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import "../styles/LibraryV2.css";

// Component to handle image loading with fallbacks
const AppleImage = ({ imageUrl, accession, title, apiBase }) => {
  const [currentSrc, setCurrentSrc] = useState(null);
  const [errorCount, setErrorCount] = useState(0);
  const [showPlaceholder, setShowPlaceholder] = useState(false);
  const [foundImage, setFoundImage] = useState(null);
  
  // Fetch image from backend if not provided
  useEffect(() => {
    if (!imageUrl && accession) {
      const fetchImage = async () => {
        try {
          const response = await fetch(`${apiBase}/api/apples/find-image/${encodeURIComponent(accession)}`);
          const data = await response.json();
          if (data.success && data.images && data.images.length > 0) {
            // Use the first image from the API response
            const firstImage = data.images[0];
            // Properly encode the filename part
            const pathParts = firstImage.split('/');
            if (pathParts.length > 0) {
              const filename = pathParts[pathParts.length - 1];
              const encodedFilename = encodeURIComponent(filename);
              pathParts[pathParts.length - 1] = encodedFilename;
              setFoundImage(`${apiBase}${pathParts.join('/')}`);
            } else {
              setFoundImage(`${apiBase}${firstImage}`);
            }
          } else {
            // API returned no images, mark as checked so we can try fallbacks
            setFoundImage(null);
          }
        } catch (error) {
          console.error('Error fetching image:', error);
          // On error, allow fallbacks to be tried
          setFoundImage(null);
        }
      };
      fetchImage();
    } else if (imageUrl) {
      // If imageUrl is provided, don't try API or fallbacks
      setFoundImage(null);
    }
  }, [imageUrl, accession, apiBase]);
  
  // Generate fallback URLs based on accession and title (try common patterns)
  const getFallbackUrls = (acc, titleName) => {
    if (!acc) return [];
    const accUpper = acc.toUpperCase();
    const accLower = acc.toLowerCase();
    const cleanTitle = titleName ? titleName.replace(/[^a-zA-Z0-9\s]/g, '').trim() : '';
    
    const urls = [];
    
    // Try patterns with title + accession (most common pattern based on file listing)
    if (cleanTitle) {
      const titleWords = cleanTitle.split(/\s+/).filter(w => w.length > 2);
      // Try first word + accession
      if (titleWords.length > 0) {
        urls.push(`${apiBase}/images/${titleWords[0]} ${accUpper}.jpg`);
        urls.push(`${apiBase}/images/${titleWords[0]} ${accUpper}.JPG`);
        urls.push(`${apiBase}/images/${titleWords[0]} ${accUpper}.png`);
        urls.push(`${apiBase}/images/${titleWords[0]} ${accUpper}.PNG`);
      }
      // Try first two words + accession
      if (titleWords.length > 1) {
        urls.push(`${apiBase}/images/${titleWords[0]} ${titleWords[1]} ${accUpper}.jpg`);
        urls.push(`${apiBase}/images/${titleWords[0]} ${titleWords[1]} ${accUpper}.JPG`);
      }
    }
    
    // Try patterns with numbers + accession (like "8915 MAL0622.jpg")
    const accNumber = accUpper.match(/MAL(\d+)/);
    if (accNumber) {
      urls.push(`${apiBase}/images/${accNumber[1]} ${accUpper}.jpg`);
      urls.push(`${apiBase}/images/${accNumber[1]} ${accUpper}.JPG`);
    }
    
    // Try patterns with just accession
    urls.push(`${apiBase}/images/${accUpper}.jpg`);
    urls.push(`${apiBase}/images/${accUpper}.JPG`);
    urls.push(`${apiBase}/images/${accUpper}.png`);
    urls.push(`${apiBase}/images/${accUpper}.PNG`);
    urls.push(`${apiBase}/images/${accLower}.jpg`);
    urls.push(`${apiBase}/images/${accLower}.png`);
    
    // Try patterns with -2 suffix
    urls.push(`${apiBase}/images/${accUpper}-2.jpg`);
    urls.push(`${apiBase}/images/${accUpper}-2.JPG`);
    
    return urls;
  };
  
  const fallbacks = useMemo(() => getFallbackUrls(accession, title), [accession, title, apiBase]);
  // Priority: imageUrl > foundImage from API > fallbacks
  // Track if API has been checked
  const [apiChecked, setApiChecked] = useState(false);
  const [apiHasImages, setApiHasImages] = useState(false);
  
  useEffect(() => {
    // Mark API as checked when foundImage changes
    if (imageUrl) {
      setApiChecked(true);
      setApiHasImages(true); // Database image exists
    } else if (foundImage !== undefined) {
      setApiChecked(true);
      setApiHasImages(foundImage !== null); // API found images or not
    }
  }, [imageUrl, foundImage]);
  
  // Only include fallbacks if API was checked and found no images
  const allUrls = imageUrl 
    ? [imageUrl] // If database image exists, use only that
    : (foundImage 
      ? [foundImage] // If API found image, use only that (no fallbacks needed)
      : (apiChecked && !apiHasImages ? fallbacks : [])); // Only use fallbacks if API checked and found nothing
  
  useEffect(() => {
    // Reset when imageUrl, foundImage, or accession changes
    // Don't try fallbacks until API check is complete
    let initialSrc = null;
    if (imageUrl) {
      initialSrc = imageUrl;
    } else if (foundImage) {
      initialSrc = foundImage;
    } else if (apiChecked && !apiHasImages && fallbacks.length > 0) {
      // Only try fallbacks after API has been checked and found nothing
      initialSrc = fallbacks[0];
    }
    
    setCurrentSrc(initialSrc);
    setErrorCount(0);
    setShowPlaceholder(!initialSrc);
  }, [imageUrl, foundImage, accession, fallbacks, apiChecked, apiHasImages]);
  
  const handleError = () => {
    // Only try next URL if we have more URLs and haven't exhausted them
    if (allUrls.length > 0 && errorCount < allUrls.length - 1) {
      // Try next fallback URL
      const nextIndex = errorCount + 1;
      setErrorCount(nextIndex);
      setCurrentSrc(allUrls[nextIndex]);
    } else {
      // All URLs failed, show placeholder
      setShowPlaceholder(true);
    }
  };
  
  const handleLoad = () => {
    setShowPlaceholder(false);
  };
  
  if (!currentSrc || showPlaceholder) {
    return <div className="av-noimg" style={{ display: 'flex' }}>No Image</div>;
  }
  
  return (
    <img 
      key={currentSrc} // Force re-render when src changes
      src={currentSrc} 
      alt={title} 
      loading="lazy" 
      onError={handleError}
      onLoad={handleLoad}
      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
    />
  );
};

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";

export default function LibraryV2() {
  // Exact column order from Excel file - all 54 columns in sequence
  const columnOrder = [
    "SITE ID",
    "PREFIX (ACP)",
    "ACNO",
    "ACCESSION",
    "CULTIVAR NAME",
    "FAMILY",
    "HABITAT",
    "BREEDER OR COLLECTOR",
    "GENUS",
    "SPECIES",
    "INVENTORY TYPE",
    "INVENTORY MAINTENANCE POLICY",
    "PLANT TYPE",
    "LIFE FORM",
    "IS DISTRIBUTABLE?",
    "FRUITSHAPE 115057",
    "FRUITLGTH 115156",
    "FRUITWIDTH 115157",
    "FRTWEIGHT 115121",
    "FRTSTEMTHK 115127",
    "SEEDCOLOR 115086",
    "SSIZE Quantity of Seed",
    "SEEDLENGTH 115163",
    "SEEDWIDTH 115164",
    "SEEDNUMBER 115087",
    "FRTTEXTURE 115123",
    "FRTSTMLGTH 115158",
    "SEEDSHAPE 115167",
    "FRTFLSHOXI 115129",
    "FIRST BLOOM DATE",
    "FULL BLOOM DATE",
    "COLOUR",
    "DENSITY",
    "FIREBLIGHT RATING",
    "TAXON",
    "CMT",
    "NARATIVEKEYWORD",
    "FULL NARATIVE",
    "PEDIGREE DESCRIPTION",
    "AVAILABILITY STATUS ",
    "PROVINCE/STATE",
    "COUNTRY",
    "LOCATION SECTION 1",
    "LOCATION SECTION 2",
    "LOCATION SECTION 3",
    "LOCATION SECTION 4",
    "COOPERATOR",
    "IPR TYPE",
    "LABEL NAME",
    "LEVEL OF IMPROVEMENT",
    "RELEASED DATE",
    "RELEASED DATE FORMAT",
    "COOPERATOR_NEW",
    "IMAGES"
  ];

  const navigate = useNavigate();
  const [apples, setApples] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("table"); // 'table' | 'pictures'
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState(""); // Debounced query for performance
  const [filters, setFilters] = useState({
    acno: "",
    accession: "",
    country: "",
    province: "",
    city: "",
    pedigree: "",
    taxon: ""
  });
  const [sortBy, setSortBy] = useState({ field: "", order: "" }); // { field: "ACCESSION" | "CULTIVAR NAME", order: "ascending" | "descending" | "latest" }

  // Selection state
  const [selectedRecords, setSelectedRecords] = useState(new Set());

  // Download dropdown state
  const [showDownloadDropdown, setShowDownloadDropdown] = useState(false);
  const downloadDropdownRef = useRef(null);

  // Error message state
  const [errorMessage, setErrorMessage] = useState(null);

  // Autocomplete state
  const [showSuggest, setShowSuggest] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const searchBoxRef = useRef(null);
  const inputRef = useRef(null);
  const manuallyClosedRef = useRef(false);
  const allDataRef = useRef([]);

  // Helper to get unique record ID (stable, doesn't depend on array index)
  const getRecordId = (record, index) => {
    if (record._id) return record._id;
    if (record.id) return record.id;
    const acno = record.acno ?? "";
    const accession = record.accession ?? "";
    if (acno || accession) {
      return `${acno}_${accession}`;
    }
    return `record_${index}`;
  };

  // Debounce query updates for table filtering only (not for suggestions)
  // This allows input and suggestions to be instant while filtering is optimized
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 100); // 100ms debounce for table filtering - faster response
    
    return () => clearTimeout(timer);
  }, [query]);

  // Decide suggestion mode based on query
  const isAccessionMode = useMemo(() => /^mal/i.test(query.trim()), [query]);
  const suggestionKey = isAccessionMode ? "accession" : "cultivar_name";

  // Helper to normalize column names for matching (handles variations) - defined early for use in search
  const normalizeColumnName = (name) => {
    return String(name || '').toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
  };

  // Helper to get field value from record using Excel column name (optimized for performance)
  const getFieldValueForSearch = (record, excelColumnName) => {
    // Fast path: Try exact Excel column name in metadata first (most common case)
    if (record.metadata) {
      const metadataValue = record.metadata[excelColumnName];
      if (metadataValue !== undefined && metadataValue !== null && metadataValue !== '') {
        return metadataValue;
      }
      
      // Try with trimmed version (handle trailing spaces)
      const trimmedColumnName = excelColumnName.trim();
      if (trimmedColumnName !== excelColumnName) {
        const trimmedValue = record.metadata[trimmedColumnName];
        if (trimmedValue !== undefined && trimmedValue !== null && trimmedValue !== '') {
          return trimmedValue;
        }
      }
    }
    
    // Try exact Excel column name in direct fields
    const directValue = record[excelColumnName];
    if (directValue !== undefined && directValue !== null && directValue !== '') {
      return directValue;
    }
    
    // Last resort: normalized match (only if needed, as it's expensive)
    if (record.metadata) {
      const normalizedExcel = normalizeColumnName(excelColumnName);
      for (const key of Object.keys(record.metadata)) {
        if (normalizeColumnName(key) === normalizedExcel) {
          const value = record.metadata[key];
          if (value !== undefined && value !== null && value !== '') {
            return value;
          }
        }
      }
    }
    
    return '';
  };

  // Use deferred value for suggestions - prevents blocking input updates
  // This ensures input typing is NEVER blocked by suggestion calculations
  const deferredQuery = useDeferredValue(query);
  
  // Generate suggestions from local data - ULTRA-OPTIMIZED and NON-BLOCKING
  // Uses deferredQuery so it doesn't block input rendering
  const suggestions = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();
    if (!q || q.length < 1) return []; // Early exit for empty query

    // Use cached data reference for faster access
    const dataSource = allDataRef.current.length > 0 ? allDataRef.current : apples;
    if (!dataSource || dataSource.length === 0) return [];
    
    // Search more records to find matches like "M. sieversii" when searching "sie"
    const maxRecordsToSearch = Math.min(500, dataSource.length);
    
    // Search columns: ACCESSION, CULTIVAR NAME, FRUITLGTH 115156, FRUITWIDTH 115157, NARATIVEKEYWORD, TAXON
    const searchColumns = [
      'ACCESSION',
      'CULTIVAR NAME',
      'FRUITLGTH 115156',
      'FRUITWIDTH 115157',
      'NARATIVEKEYWORD',
      'TAXON'
    ];

    const seen = new Set();
    const filtered = [];
    const maxResults = 10; // Increased to show more suggestions
    const qLength = q.length;
    
    // Helper to get field value from record (checks both metadata and direct fields)
    const getFieldValue = (record, columnName) => {
      // Check metadata first (where Excel columns are stored)
      if (record.metadata) {
        const metadataValue = record.metadata[columnName] || record.metadata[columnName.trim()];
        if (metadataValue !== undefined && metadataValue !== null && metadataValue !== '') {
          return String(metadataValue).trim();
        }
      }
      // Check direct fields as fallback
      if (record[columnName] !== undefined && record[columnName] !== null && record[columnName] !== '') {
        return String(record[columnName]).trim();
      }
      // For TAXON, also check lowercase variations
      if (columnName === 'TAXON') {
        if (record.taxon !== undefined && record.taxon !== null && record.taxon !== '') {
          return String(record.taxon).trim();
        }
      }
      return null;
    };
    
    // Search through records - check both metadata and direct fields
    outerLoop: for (let i = 0; i < maxRecordsToSearch && filtered.length < maxResults; i++) {
      const record = dataSource[i];
      
      // Search each column
      for (let j = 0; j < searchColumns.length && filtered.length < maxResults; j++) {
        const column = searchColumns[j];
        const value = getFieldValue(record, column);
        
        if (value && value.length >= qLength) {
          const lower = value.toLowerCase();
          // Check if query matches (case-insensitive partial match)
          // This will match "sie" in "M. sieversii" or "Malus sieversii"
            if (lower.includes(q)) {
            // Use original value (not lowercased) for display
              if (!seen.has(lower)) {
                seen.add(lower);
              filtered.push(value);
                if (filtered.length >= maxResults) break outerLoop;
            }
          }
        }
      }
    }
    
    return filtered.sort(); // Sort alphabetically
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deferredQuery, apples]);

  // Helper to find matching database field for Excel column name
  const findMatchingField = (excelCol, record) => {
    // Try exact match first (direct field)
    if (record[excelCol] !== undefined && record[excelCol] !== null && record[excelCol] !== '') {
      return excelCol;
    }
    
    // Try exact match in metadata
    if (record.metadata && record.metadata[excelCol] !== undefined && record.metadata[excelCol] !== null && record.metadata[excelCol] !== '') {
      return excelCol;
    }
    
    const normalizedExcel = normalizeColumnName(excelCol);
    
    // Try case-insensitive match in direct fields
    for (const key of Object.keys(record)) {
      if (key !== '_id' && key !== '__v' && !key.startsWith('$') && key !== 'excelRowIndex' && key !== 'metadata' && key !== 'images') {
        if (normalizeColumnName(key) === normalizedExcel) {
          const value = record[key];
          if (value !== undefined && value !== null && value !== '') {
            return key;
          }
        }
      }
    }
    
    // Try in metadata with case-insensitive
    if (record.metadata) {
      for (const key of Object.keys(record.metadata)) {
        if (normalizeColumnName(key) === normalizedExcel) {
          const value = record.metadata[key];
          if (value !== undefined && value !== null && value !== '') {
            return key;
          }
        }
      }
    }
    
    // Try common field name mappings (Excel -> Database)
    // UPDATED: Include space-separated versions that match actual database fields
    const fieldMappings = {
      'CULTIVAR NAME': ['cultivar_name', 'CULTIVAR NAME', 'cultivar', 'name'],
      'ACNO': ['acno', 'ACNO', 'AC_NO'],
      'ACCESSION': ['accession', 'ACCESSION'],
      'COUNTRY': ['e origin country', 'e_origin_country', 'E Origin Country', 'E_ORIGIN_COUNTRY', 'COUNTRY'],
      'PROVINCE/STATE': ['e origin province', 'e_origin_province', 'E Origin Province', 'E_ORIGIN_PROVINCE', 'PROVINCE/STATE'],
      'GENUS': ['e genus', 'e_genus', 'E GENUS', 'E_GENUS', 'GENUS'],
      'SPECIES': ['e species', 'e_species', 'E SPECIES', 'E_SPECIES', 'SPECIES'],
      'PEDIGREE DESCRIPTION': ['e pedigree', 'e_pedigree', 'E pedigree', 'E_PEDIGREE', 'PEDIGREE DESCRIPTION'],
      'BREEDER OR COLLECTOR': ['e breeder', 'e_breeder', 'e breeder or collector', 'E Breeder', 'E_BREEDER', 'BREEDER OR COLLECTOR', 'e collector', 'e_collector', 'E Collector'],
      'LABEL NAME': ['cultivar_name', 'CULTIVAR NAME', 'LABEL NAME', 'label name', 'name'],
      'HABITAT': ['e habitat', 'e_habitat', 'habitat', 'HABITAT'],
      'FAMILY': ['family', 'FAMILY'],
      'TAXON': ['taxon', 'taxno', 'TAXON'],
      'SITE ID': ['site id', 'site_id', 'site', 'SITE ID'],
      'PREFIX (ACP)': ['acp', 'prefix acp', 'acp (accession prefix)', 'PREFIX (ACP)'],
      'AVAILABILITY STATUS ': ['status', 'distribute', 'availability status', 'AVAILABILITY STATUS ', 'AVAILABILITY STATUS'],
      'LIFE FORM': ['plant type', 'plant_type', 'LIFE FORM', 'life_form'],
      'INVENTORY TYPE': ['ivt', 'ivt (inventory type)', 'inventory type', 'inventory_type', 'INVENTORY TYPE'],
      'PLANT TYPE': ['plant type', 'plant_type', 'PLANT TYPE']
    };
    
    if (fieldMappings[excelCol]) {
      for (const variation of fieldMappings[excelCol]) {
        // Check direct field
        if (record[variation] !== undefined && record[variation] !== null && record[variation] !== '') {
          return variation;
        }
        // Check metadata
        if (record.metadata && record.metadata[variation] !== undefined && record.metadata[variation] !== null && record.metadata[variation] !== '') {
          return variation;
        }
      }
    }
    
    // For all other columns, try to find in metadata (most Excel columns are stored in metadata)
    if (record.metadata) {
      // Try exact match in metadata keys
      if (record.metadata[excelCol] !== undefined) {
        return excelCol; // Return the Excel column name, value will be retrieved from metadata
      }
      
      // Try normalized match in metadata
      for (const key of Object.keys(record.metadata)) {
        if (normalizeColumnName(key) === normalizedExcel) {
          return key;
        }
      }
    }
    
    // Return Excel column name as fallback (will try to get from metadata with that key)
    return excelCol;
  };

  // Get columns in exact Excel order - use hardcoded columnOrder array
  const getAllColumns = useMemo(() => {
    // Always use the hardcoded columnOrder array (54 columns in exact Excel sequence)
    return columnOrder;
  }, []);

  // Helper to get field value from record using Excel column name
  const getFieldValue = (record, excelColumnName) => {
    // Find the matching database field for this Excel column
    const dbField = findMatchingField(excelColumnName, record);
    
    if (dbField && dbField !== excelColumnName) {
      // If we found a different field name, try to get value from it
      // Try direct access first
      if (record[dbField] !== undefined && record[dbField] !== null && record[dbField] !== '') {
        return record[dbField];
      }
      
      // Try metadata
      if (record.metadata && record.metadata[dbField] !== undefined && record.metadata[dbField] !== null && record.metadata[dbField] !== '') {
        return record.metadata[dbField];
      }
    }
    
    // Try exact Excel column name in direct fields
    if (record[excelColumnName] !== undefined && record[excelColumnName] !== null && record[excelColumnName] !== '') {
      return record[excelColumnName];
    }
    
    // Try exact Excel column name in metadata (most Excel columns are stored here)
    if (record.metadata && record.metadata[excelColumnName] !== undefined && record.metadata[excelColumnName] !== null && record.metadata[excelColumnName] !== '') {
      return record.metadata[excelColumnName];
    }
    
    // Try with trimmed version (handle trailing spaces)
    const trimmedColumnName = excelColumnName.trim();
    if (trimmedColumnName !== excelColumnName) {
      if (record.metadata && record.metadata[trimmedColumnName] !== undefined && record.metadata[trimmedColumnName] !== null && record.metadata[trimmedColumnName] !== '') {
        return record.metadata[trimmedColumnName];
      }
    }
    
    // Try normalized match in metadata as last resort
    if (record.metadata) {
      const normalizedExcel = normalizeColumnName(excelColumnName);
      for (const key of Object.keys(record.metadata)) {
        if (normalizeColumnName(key) === normalizedExcel) {
          const value = record.metadata[key];
          if (value !== undefined && value !== null && value !== '') {
            return value;
          }
        }
      }
    }
    
    return '';
  };

  // Helper to render a cell with truncation + tooltip
  const renderCell = (value, columnName) => {
    const text = value === null || value === undefined ? "" : String(value);
    
    // Columns that should have truncated text with tooltip (same space allocation as other columns)
    const longTextColumns = ["CMT", "NARATIVEKEYWORD", "FULL NARATIVE", "COOPERATOR", "PEDIGREE DESCRIPTION", "COOPERATOR_NEW", "AVAILABILITY STATUS "];
    const shouldTruncate = longTextColumns.includes(columnName);
    
    // Columns that should be center-aligned (numeric/ID columns)
    const centerAlignedColumns = ["ACNO"];
    const shouldCenterAlign = centerAlignedColumns.includes(columnName);
    
    // Truncate text for specified columns (max 50 characters to keep consistent with other columns)
    const maxLength = 50;
    const displayText = shouldTruncate && text.length > maxLength 
      ? text.substring(0, maxLength) + "..." 
      : text;
    
    return (
      <td
        key={columnName}
        className="av-td"
        data-full-text={text} // used by CSS ::after for tooltip
        title={shouldTruncate && text.length > maxLength ? text : text} // Show full text in tooltip
        style={{
          maxWidth: shouldTruncate ? '180px' : undefined, // Constrain width for long text columns
          minWidth: shouldTruncate ? '120px' : undefined, // Same min width as other columns
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          textAlign: shouldCenterAlign ? 'center' : 'left' // Center align ACNO cells
        }}
      >
        {displayText}
      </td>
    );
  };

  // Function to fetch data
  const fetchData = async (searchTerm = "") => {
    try {
      setLoading(true);
      const url = searchTerm ? `${API_BASE}/api/apples?search=${encodeURIComponent(searchTerm)}` : `${API_BASE}/api/apples`;
      console.log("🔍 Fetching data from:", url);

      const res = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }).catch(err => {
        console.error("❌ Network error:", err);
        throw new Error(`Cannot connect to backend server at ${API_BASE}. Please ensure the server is running.`);
      });

      console.log("📡 Response status:", res.status, res.statusText);

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status} ${res.statusText}`);
      }

      const data = await res.json();
      console.log("📦 Data received:", Array.isArray(data) ? data.length : "Not an array", "items");

      // server might return { apples: [...] } or array directly
      const normalized = Array.isArray(data) ? data : (Array.isArray(data.apples) ? data.apples : (Array.isArray(data.data) ? data.data : []));
      console.log("✅ Setting apples state:", normalized.length, "records");
      
      // Verify order - first record should be "Heyer #6" (first in Excel)
      if (normalized.length > 0) {
        const firstRecord = normalized[0];
        const firstCultivar = firstRecord.cultivar_name || firstRecord['CULTIVAR NAME'] || 'Unknown';
        console.log("📋 First record in response:", firstCultivar, "- excelRowIndex:", firstRecord.excelRowIndex);
      }

      // If search returns no results but we have cached data, filter locally instead
      if (searchTerm && normalized.length === 0 && allDataRef.current.length > 0) {
        console.log("⚠️ Search returned no results, filtering cached data locally");
        const searchLower = searchTerm.toLowerCase();
        const filtered = allDataRef.current.filter((row) => {
          const cultivarName = (row.cultivar_name || row['CULTIVAR NAME'] || row.name || '').toLowerCase();
          const accession = (row.accession || row.ACCESSION || '').toLowerCase();
          const acno = String(row.acno || row.ACNO || '').toLowerCase();
          return cultivarName.includes(searchLower) ||
                 accession.includes(searchLower) ||
                 acno.includes(searchLower);
        });
        setApples(filtered);
      } else {
        setApples(normalized);
      }

      // Cache full dataset when fetching all data (not a search)
      if (!searchTerm) {
        allDataRef.current = normalized;
      }

    } catch (e) {
      console.error("❌ Failed to load apples:", e);
      if (allDataRef.current.length > 0) {
        console.log("⚠️ Using cached data after fetch error");
        // If we have cached data and a search term, filter it locally
        if (searchTerm) {
          const searchLower = searchTerm.toLowerCase();
          const filtered = allDataRef.current.filter((row) => {
            const cultivarName = (row.cultivar_name || row['CULTIVAR NAME'] || row.name || '').toLowerCase();
            const accession = (row.accession || row.ACCESSION || '').toLowerCase();
            const acno = String(row.acno || row.ACNO || '').toLowerCase();
            return cultivarName.includes(searchLower) ||
                   accession.includes(searchLower) ||
                   acno.includes(searchLower);
          });
          setApples(filtered);
        } else {
          setApples(allDataRef.current);
        }
      } else {
        setApples([]);
        setErrorMessage(e.message || "Failed to fetch data");
        setTimeout(() => setErrorMessage(null), 5000);
      }
    } finally {
      setLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle side effects when query changes - moved from onChange for performance
  // FIXED: Removed 'apples' from dependency array to prevent infinite loop
  useEffect(() => {
    // Reset active index when query changes
    setActiveIndex(-1);
    manuallyClosedRef.current = false;
    
    // Handle empty query - clear suggestions and reset data
    if (!query.trim()) {
      setShowSuggest(false);
      // Defer data reset to prevent blocking
      startTransition(() => {
        if (allDataRef.current.length > 0) {
          setApples(allDataRef.current);
        } else if (apples.length === 0) {
          fetchData();
        }
      });
      return;
    }
    
    // Show suggestions when query has text and suggestions are available
    if (manuallyClosedRef.current) {
      manuallyClosedRef.current = false;
      return;
    }
    const shouldShow = Boolean(query.trim() && suggestions.length > 0);
    setShowSuggest(shouldShow);
  }, [query, suggestions]); // FIXED: Removed 'apples' - was causing infinite loop

  // Close dropdown on outside click
  useEffect(() => {
    const onDoc = (e) => {
      if (!e.target.closest('.av-searchbox')) {
        manuallyClosedRef.current = true;
        setShowSuggest(false);
        setActiveIndex(-1);
      }
      if (downloadDropdownRef.current && !downloadDropdownRef.current.contains(e.target)) {
        setShowDownloadDropdown(false);
      }
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  // Run search and update data
  const runSearch = async (term) => {
    manuallyClosedRef.current = true;
    await fetchData(term);
    setShowSuggest(false);
  };

  // Handle picking a suggestion
  const handlePick = (value) => {
    manuallyClosedRef.current = true;
    setQuery(value);
    setShowSuggest(false);
    setActiveIndex(-1);
    inputRef.current?.blur();
    
    // Filter local data instead of making API call
    const dataSource = allDataRef.current.length > 0 ? allDataRef.current : apples;
    const searchTerm = value.trim().toLowerCase();
    
    if (!searchTerm) {
      setApples(dataSource);
      return;
    }
    
    const filtered = dataSource.filter((row) => {
      // Helper to get field value from record using Excel column name
      const getSearchValue = (columnName) => {
        const value = getFieldValueForSearch(row, columnName);
        return value ? String(value).toLowerCase() : '';
      };

      // Search across specified columns: ACCESSION, CULTIVAR NAME, FRUITLGTH 115156, FRUITWIDTH 115157, NARATIVEKEYWORD, TAXON
      const searchColumns = [
        'ACCESSION',
        'CULTIVAR NAME',
        'FRUITLGTH 115156',
        'FRUITWIDTH 115157',
        'NARATIVEKEYWORD',
        'TAXON'
      ];
      
      return searchColumns.some(column => {
        const value = getSearchValue(column);
        return value.includes(searchTerm);
      });
    });
    
    setApples(filtered);
  };

  // Input change handler - PURE typing logic (zero blocking, instant updates)
  // ONLY updates the query state - all other logic moved to useEffect
  const onInputChange = (e) => {
    setQuery(e.target.value);
  };

  // Keyboard handlers for autocomplete
  const onKeyDown = (e) => {
    if (e.key === 'Escape') {
      setShowSuggest(false);
      setActiveIndex(-1);
      return;
    }
    if (!showSuggest || !suggestions.length) {
      if (e.key === 'Enter') {
        runSearch(query);
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex(i => (i + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex(i => (i - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeIndex >= 0 && suggestions[activeIndex]) {
        handlePick(suggestions[activeIndex]);
      } else {
        runSearch(query);
      }
    }
  };

  // UPDATED FILTERED LOGIC WITH CORRECT FIELD NAMES - optimized for performance
  // Memoized to prevent re-renders when only query changes (before debounce completes)
  const filtered = useMemo(() => {
    if (!apples || apples.length === 0) {
      return [];
    }

    const q = debouncedQuery.trim().toLowerCase();

    // Pre-define search columns outside the filter function
    const searchColumns = [
      'ACCESSION',
      'CULTIVAR NAME',
      'FRUITLGTH 115156',
      'FRUITWIDTH 115157',
      'NARATIVEKEYWORD',
      'TAXON'
    ];

    // Helper to get field value from multiple possible field names
    // Checks both direct fields and metadata (where Excel columns are stored)
    const getField = (row, fieldNames) => {
      for (const field of fieldNames) {
        // Check direct field first
        let value = row?.[field];
        if (value !== undefined && value !== null && value !== '') {
          return String(value);
        }
        
        // Check metadata field if direct field not found
        if (row?.metadata) {
          value = row.metadata[field];
          if (value !== undefined && value !== null && value !== '') {
            return String(value);
          }
        }
      }
      return '';
    };

    // Optimized: use some() for early exit when match is found
    const filteredData = apples.filter((row) => {
      // Search query matching
      let byQuery = true;
      if (q) {
        byQuery = false;
        const metadata = row.metadata;
        
        // Ultra-fast path: direct metadata access (most common case)
        if (metadata) {
          for (let i = 0; i < searchColumns.length; i++) {
            const column = searchColumns[i];
            const value = metadata[column] || metadata[column.trim()];
            if (value) {
              const lower = String(value).toLowerCase();
              if (lower.includes(q)) {
                byQuery = true;
                break;
              }
            }
          }
        }
        
        // Fallback: check direct fields or use helper
        if (!byQuery) {
          for (let i = 0; i < searchColumns.length; i++) {
            const column = searchColumns[i];
            let value = row[column];
            if (!value && metadata) {
              value = getFieldValueForSearch(row, column);
            }
            if (value) {
              const lower = String(value).toLowerCase();
              if (lower.includes(q)) {
                byQuery = true;
                break;
              }
            }
          }
        }
      }

      // Filter matching
      const match =
        (!filters.acno || filters.acno === "" || String(getField(row, ['acno', 'ACNO']) || "") === String(filters.acno)) &&
        (!filters.accession || filters.accession === "" || getField(row, ['accession', 'ACCESSION']) === filters.accession) &&
        (!filters.country || filters.country === "" || getField(row, ['e origin country', 'E Origin Country', 'e_origin_country', 'COUNTRY']) === filters.country) &&
        (!filters.province || filters.province === "" || getField(row, ['e origin province', 'E Origin Province', 'e_origin_province', 'PROVINCE/STATE']) === filters.province) &&
        (!filters.pedigree || filters.pedigree === "" || getField(row, ['e pedigree', 'E pedigree', 'E Pedigree', 'e_pedigree', 'PEDIGREE DESCRIPTION']) === filters.pedigree) &&
        (!filters.taxon || filters.taxon === "" || getField(row, ['TAXON', 'taxon']) === filters.taxon);

      return byQuery && match;
    });

    if (apples.length > 0 && filteredData.length === 0) {
      console.log("⚠️ All data filtered out:", { applesCount: apples.length, query: q, filters });
    }

    // Apply sorting
    let sortedData = [...filteredData];
    if (sortBy.field && sortBy.order) {
      sortedData.sort((a, b) => {
        if (sortBy.order === "latest") {
          // Sort by latest added (newest first based on timestamps)
          const getTimestamp = (record) => {
            // Try createdAt first, then updatedAt, then excelRowIndex (higher = newer in Excel)
            if (record.createdAt) {
              return new Date(record.createdAt).getTime();
            }
            if (record.updatedAt) {
              return new Date(record.updatedAt).getTime();
            }
            // If no timestamp, use excelRowIndex (higher number = newer)
            return record.excelRowIndex || 0;
          };
          const timeA = getTimestamp(a);
          const timeB = getTimestamp(b);
          return timeB - timeA; // Descending order (newest first)
        } else {
          // Sort by selected field (ACCESSION or CULTIVAR NAME)
          let getFieldValue;
          if (sortBy.field === "ACCESSION") {
            getFieldValue = (record) => {
              return getField(record, ['ACCESSION', 'accession']) || '';
            };
          } else if (sortBy.field === "CULTIVAR NAME") {
            getFieldValue = (record) => {
              return getField(record, ['CULTIVAR NAME', 'cultivar_name', 'cultivar', 'name']) || '';
            };
          } else {
            return 0;
          }
          
          const valueA = getFieldValue(a).toLowerCase();
          const valueB = getFieldValue(b).toLowerCase();
          
          if (sortBy.order === "ascending") {
            return valueA.localeCompare(valueB);
          } else if (sortBy.order === "descending") {
            return valueB.localeCompare(valueA);
          }
        }
        return 0;
      });
    }

    return sortedData;
  }, [apples, debouncedQuery, filters, sortBy]);

  // Selection handlers
  const handleSelectRecord = (recordId) => {
    setSelectedRecords(prev => {
      const newSet = new Set(prev);
      if (newSet.has(recordId)) {
        newSet.delete(recordId);
      } else {
        newSet.add(recordId);
      }
      return newSet;
    });
  };

  const handleClearSelection = () => {
    setSelectedRecords(new Set());
  };

  const handleDeleteSelected = async () => {
    if (selectedRecords.size === 0) return;

    const adminToken = localStorage.getItem('adminToken');
    if (!adminToken) {
      alert('Admin authentication required to delete records. Please log in as admin.');
      return;
    }

    const recordsToDelete = filtered.filter((record, index) => {
      const recordId = getRecordId(record, index);
      return selectedRecords.has(recordId);
    });

    if (!window.confirm(`Are you sure you want to delete ${recordsToDelete.length} apple(s)? This action cannot be undone.`)) {
      return;
    }

    setLoading(true);
    const deletedIds = new Set();
    const failedDeletions = [];

    // Delete each record from database
    for (const record of recordsToDelete) {
      const recordId = record._id || record.id;
      if (!recordId) {
        console.warn('Cannot delete record without _id:', record);
        failedDeletions.push(record);
        continue;
      }

      try {
        const response = await fetch(`${API_BASE}/api/apples/${recordId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${adminToken}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          deletedIds.add(recordId);
          console.log(`✅ Deleted apple: ${record.cultivar_name || record['CULTIVAR NAME'] || recordId}`);
        } else {
          const errorData = await response.json();
          console.error(`❌ Failed to delete ${recordId}:`, errorData);
          failedDeletions.push(record);
        }
      } catch (error) {
        console.error(`❌ Error deleting ${recordId}:`, error);
        failedDeletions.push(record);
      }
    }

    setLoading(false);

    // Remove successfully deleted records from local state
    if (deletedIds.size > 0) {
    setApples(prev => {
      return prev.filter(record => {
          const recordId = record._id || record.id;
          return !deletedIds.has(recordId);
      });
    });

    if (allDataRef.current.length > 0) {
      allDataRef.current = allDataRef.current.filter(record => {
          const recordId = record._id || record.id;
          return !deletedIds.has(recordId);
        });
      }
    }

    setSelectedRecords(new Set());

    // Show feedback
    if (failedDeletions.length > 0) {
      alert(`Deleted ${deletedIds.size} apple(s) successfully. Failed to delete ${failedDeletions.length} apple(s). Check console for details.`);
    } else {
      alert(`Successfully deleted ${deletedIds.size} apple(s) from database.`);
    }
  };

  const handleSelectAll = () => {
    if (filtered.length === 0) return;

    const allSelected = filtered.every((record, index) =>
      selectedRecords.has(getRecordId(record, index))
    );

    if (allSelected) {
      setSelectedRecords(prev => {
        const newSet = new Set(prev);
        filtered.forEach((record, index) => {
          newSet.delete(getRecordId(record, index));
        });
        return newSet;
      });
    } else {
      setSelectedRecords(prev => {
        const newSet = new Set(prev);
        filtered.forEach((record, index) => {
          newSet.add(getRecordId(record, index));
        });
        return newSet;
      });
    }
  };

  const isAllSelected = filtered.length > 0 && filtered.every((record, index) =>
    selectedRecords.has(getRecordId(record, index))
  );

  const isIndeterminate = filtered.length > 0 &&
    filtered.some((record, index) => selectedRecords.has(getRecordId(record, index))) &&
    !isAllSelected;

  // Helper used for per-row delete in the table (single)
  const handleDeleteRecord = async (recordId) => {
    const adminToken = localStorage.getItem('adminToken');
    if (!adminToken) {
      alert('Admin authentication required to delete records. Please log in as admin.');
      return;
    }

    // Find the record to get its database ID
    const record = [...apples, ...Array.from(allDataRef.current)].find((r, idx) => getRecordId(r, idx) === recordId);
    if (!record) {
      console.warn('Record not found for deletion:', recordId);
      return;
    }

    const dbId = record._id || record.id;
    if (!dbId) {
      alert('Cannot delete: Record does not have a database ID.');
      return;
    }

    const cultivarName = record.cultivar_name || record['CULTIVAR NAME'] || 'this apple';
    if (!window.confirm(`Are you sure you want to delete "${cultivarName}"? This action cannot be undone.`)) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/apples/${dbId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        // Remove from local state only after successful deletion
    setApples(prev => prev.filter((r, idx) => getRecordId(r, idx) !== recordId));
    if (allDataRef.current.length > 0) {
      allDataRef.current = allDataRef.current.filter((r, idx) => getRecordId(r, idx) !== recordId);
    }
    setSelectedRecords(prev => {
      const s = new Set(prev);
      s.delete(recordId);
      return s;
    });
        alert(`Successfully deleted "${cultivarName}" from database.`);
        console.log(`✅ Deleted apple: ${cultivarName}`);
      } else {
        const errorData = await response.json();
        alert(`Failed to delete: ${errorData.message || errorData.error || 'Unknown error'}`);
        console.error('❌ Delete failed:', errorData);
      }
    } catch (error) {
      alert(`Error deleting record: ${error.message}`);
      console.error('❌ Delete error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="libv2-page">
      <aside className="libv2-sidebar">
        <FilterSidebar
          data={apples}
          value={filters}
          onChange={setFilters}
          sortBy={sortBy}
          onSortChange={setSortBy}
          onReset={() => {
            setFilters({ acno: "", accession: "", country: "", province: "", pedigree: "", taxon: "" });
            setSortBy({ field: "", order: "" });
          }}
        />
      </aside>

      <main className="libv2-main">
        <div className="libv2-search-section">
          <div className="libv2-searchRow" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
            <div ref={searchBoxRef} className="av-searchbox av-autocomplete" style={{ position: "relative", flex: '1', minWidth: '300px' }}>
              <SearchBar
                value={query}
                onChange={onInputChange}
                onSearch={() => {
                  setShowSuggest(false);
                  setActiveIndex(-1);
                  runSearch(query);
                }}
                onImageSearch={() => alert("Image search coming soon")}
                onKeyDown={onKeyDown}
                inputRef={inputRef}
                autoComplete="off"
              >
                <div className="av-chip-group" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
                  <div ref={downloadDropdownRef} style={{ position: 'relative', display: 'inline-block' }}>
                    <button
                      className="btn-csv"
                      onClick={() => setShowDownloadDropdown(!showDownloadDropdown)}
                      title="Download options"
                      style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      Download {selectedRecords.size > 0 ? `(${selectedRecords.size})` : ''}
                      <ChevronDown size={16} />
                    </button>
                    {showDownloadDropdown && (
                      <div style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        marginTop: '4px',
                        backgroundColor: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                        zIndex: 100,
                        minWidth: '150px',
                        overflow: 'hidden'
                      }}>
                        <button
                          onClick={() => {
                            const dataToExport = allDataRef.current.length > 0 ? allDataRef.current : apples;
                            exportCSV(dataToExport, selectedRecords.size > 0 ? selectedRecords : null, setErrorMessage);
                            setShowDownloadDropdown(false);
                          }}
                          style={{
                            width: '100%',
                            padding: '10px 16px',
                            textAlign: 'left',
                            border: 'none',
                            background: 'transparent',
                            cursor: 'pointer',
                            fontSize: '14px',
                            color: '#1f2937'
                          }}
                          onMouseEnter={(e) => e.target.style.backgroundColor = '#f3f4f6'}
                          onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                        >
                          CSV
                        </button>
                        <button
                          onClick={async () => {
                            setShowDownloadDropdown(false);
                            const dataToExport = allDataRef.current.length > 0 ? allDataRef.current : apples;
                            const selectedCount = selectedRecords.size;
                            
                            if (selectedCount === 0) {
                              if (setErrorMessage) {
                                setErrorMessage("To download, select the apples");
                                setTimeout(() => setErrorMessage(null), 5000);
                              } else {
                                alert("To download, select the apples");
                              }
                              return;
                            }
                            
                            // Calculate estimated time based on number of selected apples
                            // Estimate: ~0.6-0.8 seconds per apple (includes image loading with API calls)
                            const estimatedSeconds = Math.ceil(selectedCount * 0.7);
                            const estimatedMinutes = Math.floor(estimatedSeconds / 60);
                            const remainingSeconds = estimatedSeconds % 60;
                            
                            let timeEstimate = "";
                            if (estimatedMinutes > 0) {
                              timeEstimate = `${estimatedMinutes} minute${estimatedMinutes > 1 ? 's' : ''}`;
                              if (remainingSeconds > 0) {
                                timeEstimate += ` ${remainingSeconds} second${remainingSeconds > 1 ? 's' : ''}`;
                              }
                            } else {
                              timeEstimate = `${estimatedSeconds} second${estimatedSeconds > 1 ? 's' : ''}`;
                            }
                            
                            const message = `Generating PDF for ${selectedCount} selected apple(s)... Estimated time: ${timeEstimate}. Please wait.`;
                            
                            if (setErrorMessage) {
                              setErrorMessage(message);
                            } else {
                              alert(message);
                            }
                            
                            try {
                              await exportPDF(dataToExport, selectedRecords, API_BASE, setErrorMessage);
                            } catch (error) {
                              console.error("PDF error:", error);
                              if (setErrorMessage) {
                                setErrorMessage("Failed to generate PDF. Check console for details.");
                                setTimeout(() => setErrorMessage(null), 5000);
                              } else {
                                alert("Failed to generate PDF. Check console for details.");
                              }
                            }
                          }}
                          style={{
                            width: '100%',
                            padding: '10px 16px',
                            textAlign: 'left',
                            border: 'none',
                            background: 'transparent',
                            cursor: 'pointer',
                            fontSize: '14px',
                            color: '#1f2937',
                            borderTop: '1px solid #e5e7eb'
                          }}
                          onMouseEnter={(e) => e.target.style.backgroundColor = '#f3f4f6'}
                          onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                        >
                          PDF
                        </button>
                        <button
                          onClick={async () => {
                            setShowDownloadDropdown(false);
                            
                            // Calculate estimated time based on number of apples
                            const appleCount = filtered?.length || 0;
                            // Estimate: ~0.6-0.8 seconds per apple (includes image loading with API calls)
                            // Accounts for: data processing + API image fetch (2s timeout) + image loading (1s timeout)
                            const estimatedSeconds = Math.ceil(appleCount * 0.7);
                            const estimatedMinutes = Math.floor(estimatedSeconds / 60);
                            const remainingSeconds = estimatedSeconds % 60;
                            
                            let timeEstimate = "";
                            if (estimatedMinutes > 0) {
                              timeEstimate = `${estimatedMinutes} minute${estimatedMinutes > 1 ? 's' : ''}`;
                              if (remainingSeconds > 0) {
                                timeEstimate += ` ${remainingSeconds} second${remainingSeconds > 1 ? 's' : ''}`;
                              }
                            } else {
                              timeEstimate = `${estimatedSeconds} second${estimatedSeconds > 1 ? 's' : ''}`;
                            }
                            
                            const message = `Generating PDF(All) for ${appleCount} apples... Estimated time: ${timeEstimate}. Please wait.`;
                            
                            if (setErrorMessage) {
                              setErrorMessage(message);
                            } else {
                              alert(message);
                            }
                            try {
                              await exportPDFAll(filtered, API_BASE, setErrorMessage);
                            } catch (error) {
                              console.error("PDF(All) error:", error);
                              if (setErrorMessage) {
                                setErrorMessage("Failed to generate PDF(All). Check console for details.");
                                setTimeout(() => setErrorMessage(null), 5000);
                              } else {
                                alert("Failed to generate PDF(All). Check console for details.");
                              }
                            }
                          }}
                          style={{
                            width: '100%',
                            padding: '10px 16px',
                            textAlign: 'left',
                            border: 'none',
                            background: 'transparent',
                            cursor: 'pointer',
                            fontSize: '14px',
                            color: '#1f2937',
                            borderTop: '1px solid #e5e7eb'
                          }}
                          onMouseEnter={(e) => e.target.style.backgroundColor = '#f3f4f6'}
                          onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                        >
                          PDF(All)
                        </button>
                      </div>
                    )}
                  </div>
                  {selectedRecords.size > 0 && (
                    <>
                      <button
                        onClick={handleClearSelection}
                        title="Clear selection"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '8px 16px',
                          backgroundColor: '#6c757d',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontSize: '14px',
                          fontWeight: '500',
                          marginLeft: '8px'
                        }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = '#5a6268'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = '#6c757d'}
                      >
                        <X size={16} />
                        Clear
                      </button>
                      <button
                        onClick={handleDeleteSelected}
                        title="Delete selected"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '8px 16px',
                          backgroundColor: '#dc3545',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontSize: '14px',
                          fontWeight: '500',
                          marginLeft: '8px'
                        }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = '#c82333'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = '#dc3545'}
                      >
                        <Trash2 size={16} />
                        Delete {selectedRecords.size > 0 ? `(${selectedRecords.size})` : ''}
                      </button>
                    </>
                  )}
                  <div className="tp-toggle">
                    <div className={`tp-slider ${viewMode === "pictures" ? "right" : "left"}`}></div>
                  <button
                    type="button"
                      className={`tp-option ${viewMode === "table" ? "active" : ""}`}
                      onClick={() => setViewMode("table")}
                  >
                    Table
                  </button>
                  <button
                    type="button"
                      className={`tp-option ${viewMode === "pictures" ? "active" : ""}`}
                      onClick={() => setViewMode("pictures")}
                  >
                    Pictures
                  </button>
                  </div>
                </div>
              </SearchBar>

              {showSuggest && suggestions.length > 0 && (
                <div
                  className="av-suggest"
                  style={{
                    position: "absolute",
                    top: "100%",
                    left: 0,
                    right: 0,
                    zIndex: 50,
                    maxHeight: "320px",
                    overflowY: "auto"
                  }}
                  role="listbox"
                  aria-label={isAccessionMode ? "Accession suggestions" : "Cultivar suggestions"}
                >
                  {suggestions.map((s, i) => (
                    <div
                      key={s}
                      role="option"
                      aria-selected={i === activeIndex}
                      className={"av-suggest-item" + (i === activeIndex ? " active" : "")}
                      onMouseDown={(e) => { e.preventDefault(); handlePick(s); }}
                      onMouseEnter={() => setActiveIndex(i)}
                      style={{
                        padding: "10px 12px",
                        cursor: "pointer",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis"
                      }}
                    >
                      {s}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="libv2-content">
          {loading ? <div className="libv2-skeleton">Loading apples…</div>
            : (!apples || apples.length === 0) && allDataRef.current.length === 0 ? (
              <div className="av-empty-state" style={{ padding: "40px", textAlign: "center", color: "#666" }}>
                <p>No data available. Please ensure the backend server is running on {API_BASE}</p>
                <button
                  onClick={() => fetchData()}
                  style={{ marginTop: "16px", padding: "8px 16px", cursor: "pointer" }}
                >
                  Retry
                </button>
              </div>
            ) : (!apples || apples.length === 0) ? (
              <div className="av-empty-state" style={{ padding: "40px", textAlign: "center", color: "#666" }}>
                <p>No results found for your search.</p>
              </div>
            ) : viewMode === 'table' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', height: '100%', overflow: 'hidden' }}>
                <div style={{ 
                  padding: '8px 12px', 
                  backgroundColor: '#f8fafc', 
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#1e293b',
                  flexShrink: 0
                }}>
                  Showing {filtered.length} of {apples.length} records | {getAllColumns.length} columns
                </div>
                <div className="av-table-card" style={{ flex: 1, minHeight: 0 }}>
                  <table className="av-table" style={{ minWidth: '100%', tableLayout: 'auto' }}>
                  <thead>
                    <tr>
                      <th style={{ width: '60px', textAlign: 'center', position: 'sticky', left: 0, zIndex: 3, backgroundColor: '#0f172a', padding: '12px 4px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0' }}>
                          <input
                            type="checkbox"
                            checked={isAllSelected}
                            ref={input => {
                              if (input) input.indeterminate = isIndeterminate;
                            }}
                            onChange={handleSelectAll}
                            title="Select All"
                            style={{ margin: 0 }}
                          />
                        </div>
                      </th>
                      {getAllColumns.map((excelCol, idx) => {
                        // Columns that should have consistent width (no long text expansion)
                        const longTextColumns = ["CMT", "NARATIVEKEYWORD", "FULL NARATIVE", "COOPERATOR", "PEDIGREE DESCRIPTION", "COOPERATOR_NEW", "AVAILABILITY STATUS "];
                        const shouldConstrain = longTextColumns.includes(excelCol);
                        
                        // Columns that should be center-aligned (numeric/ID columns)
                        const centerAlignedColumns = ["ACNO"];
                        const shouldCenterAlign = centerAlignedColumns.includes(excelCol);
                        
                        return (
                          <th 
                            key={excelCol} 
                            style={{ 
                              minWidth: '120px',
                              maxWidth: shouldConstrain ? '180px' : undefined, // Constrain width for long text columns (same as cells)
                              whiteSpace: 'nowrap',
                              padding: '12px 10px',
                              fontSize: '12px',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              textAlign: shouldCenterAlign ? 'center' : 'left' // Center align ACNO header
                            }}
                          >
                            {excelCol}
                      </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {(filtered && filtered.length > 0) ? filtered.map((a, i) => {
                      const recordId = getRecordId(a, i);
                      const isSelected = selectedRecords.has(recordId);
                      return (
                        <tr key={recordId} style={{ backgroundColor: isSelected ? 'rgba(0, 123, 255, 0.1)' : '', cursor: 'pointer' }}
                          onClick={(e) => {
                            // prevent navigation if clicking on the checkbox or a control inside the first cell
                            if (e.target.closest('input[type="checkbox"]') || e.target.closest('[data-icon="trash"]')) {
                              return;
                            }
                            navigate(`/apple-detail/${recordId}`, { state: { apple: a } });
                          }}
                        >
                          <td style={{ 
                            textAlign: 'center', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            gap: '0',
                            position: 'sticky',
                            left: 0,
                            zIndex: 2,
                            backgroundColor: isSelected ? 'rgba(0, 123, 255, 0.1)' : '#fff',
                            width: '60px',
                            padding: '10px 4px',
                            minWidth: '60px',
                            maxWidth: '60px'
                          }}
                            onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleSelectRecord(recordId)}
                              style={{ cursor: 'pointer', margin: 0, marginRight: '4px' }}
                            />
                            <Trash2 size={16} style={{ color: '#dc3545', cursor: 'pointer', flexShrink: 0 }} data-icon="trash" onClick={() => handleDeleteRecord(recordId)} />
                          </td>
                          {getAllColumns.map((col) => {
                            const value = getFieldValue(a, col);
                            return renderCell(value, col);
                          })}
                        </tr>
                      );
                    }) : (
                      <tr>
                        <td className="av-empty" colSpan={getAllColumns.length + 1}>No results.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
                </div>
              </div>
            ) : (
              <div className="av-pictures-wrap">
                {(filtered && filtered.length > 0) ? (
                  <div className="av-pictures-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                      <h3 className="av-result-title">Result ({filtered.length} {filtered.length === 1 ? 'record' : 'records'})</h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={isAllSelected}
                            ref={input => {
                              if (input) input.indeterminate = isIndeterminate;
                            }}
                            onChange={handleSelectAll}
                          />
                          <span>Select All</span>
                        </label>
                        {selectedRecords.size > 0 && (
                          <>
                            <span style={{ color: '#666', fontSize: '14px' }}>
                              {selectedRecords.size} selected
                            </span>
                            <button
                              onClick={handleClearSelection}
                              title="Clear selection"
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '8px 16px',
                                backgroundColor: '#6c757d',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontSize: '14px',
                                fontWeight: '500'
                              }}
                              onMouseEnter={(e) => e.target.style.backgroundColor = '#5a6268'}
                              onMouseLeave={(e) => e.target.style.backgroundColor = '#6c757d'}
                            >
                              <X size={16} />
                              Clear
                            </button>
                            <button
                              onClick={handleDeleteSelected}
                              title="Delete selected"
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '8px 16px',
                                backgroundColor: '#dc3545',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontSize: '14px',
                                fontWeight: '500'
                              }}
                              onMouseEnter={(e) => e.target.style.backgroundColor = '#c82333'}
                              onMouseLeave={(e) => e.target.style.backgroundColor = '#dc3545'}
                            >
                              <Trash2 size={16} />
                              Delete {selectedRecords.size > 0 ? `(${selectedRecords.size})` : ''}
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="av-pictures-grid">
                      {filtered.map((a, i) => {
                        const recordId = getRecordId(a, i);
                        const isSelected = selectedRecords.has(recordId);
                        
                        // Get title from multiple sources including metadata
                        const title = getFieldValue(a, 'CULTIVAR NAME') || 
                                     (a.cultivar_name ?? 
                                     a['CULTIVAR NAME'] ?? 
                                     a.name ?? 
                                     'Unknown');
                        
                        // Get accession from multiple sources including metadata
                        const acc = getFieldValue(a, 'ACCESSION') || 
                                  (a.accession ?? 
                                  a.ACCESSION ?? 
                                  '');
                        
                        // Handle multiple field name formats for images
                        // Also check metadata for IMAGES column
                        let imgs = [];
                        
                        // Check metadata first (where Excel columns are stored)
                        if (a.metadata && a.metadata['IMAGES']) {
                          const metadataImages = a.metadata['IMAGES'];
                          if (Array.isArray(metadataImages)) {
                            imgs = metadataImages;
                          } else if (typeof metadataImages === 'string') {
                            // If it's a string, try to parse it (comma-separated or JSON)
                            try {
                              const parsed = JSON.parse(metadataImages);
                              if (Array.isArray(parsed)) {
                                imgs = parsed;
                              }
                            } catch {
                              // If not JSON, treat as comma-separated string
                              imgs = metadataImages.split(',').map(img => img.trim()).filter(img => img);
                            }
                          }
                        }
                        
                        // Fallback to direct fields if metadata doesn't have images
                        if (imgs.length === 0) {
                          imgs = (a.images && Array.isArray(a.images)) ? a.images :
                                   (a.Images && Array.isArray(a.Images)) ? a.Images :
                                   (a.IMAGE && Array.isArray(a.IMAGE)) ? a.IMAGE :
                                   (a['images'] && Array.isArray(a['images'])) ? a['images'] : [];
                        }
                        
                        // Note: If images array is empty, the AppleImage component will try fallback URLs
                        
                        const first = imgs.length > 0 ? imgs[0] : null;
                        let imageUrl = null;
                        
                        if (first) {
                          const imgPath = String(first).trim();
                          if (imgPath.startsWith('/images/') || imgPath.startsWith('/data/')) {
                            imageUrl = `${API_BASE}${imgPath}`;
                          } else if (imgPath.startsWith('http://') || imgPath.startsWith('https://')) {
                            imageUrl = imgPath;
                          } else if (imgPath.startsWith('images/') || imgPath.startsWith('data/')) {
                            imageUrl = `${API_BASE}/${imgPath}`;
                          } else {
                            imageUrl = `${API_BASE}/images/${imgPath}`;
                          }
                        }

                        const handleCardClick = (e) => {
                          if (e.target.closest('input[type="checkbox"]') || e.target.closest('[data-icon="trash"]')) {
                            return;
                          }
                          navigate(`/apple-detail/${recordId}`, { state: { apple: a } });
                        };

                        return (
                          <div
                            className="av-card"
                            key={recordId}
                            onClick={handleCardClick}
                            style={{
                              position: 'relative',
                              border: isSelected ? '3px solid #007bff' : 'none',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              transition: 'transform 0.2s, box-shadow 0.2s'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform = 'translateY(-2px)';
                              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = 'translateY(0)';
                              e.currentTarget.style.boxShadow = 'none';
                            }}
                          >
                            <div style={{
                              position: 'absolute',
                              top: '8px',
                              left: '8px',
                              zIndex: 10,
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px'
                            }}>
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => handleSelectRecord(recordId)}
                                style={{ cursor: 'pointer' }}
                              />
                              <Trash2 size={16} style={{ color: '#dc3545', cursor: 'pointer' }} data-icon="trash" onClick={(e) => { e.stopPropagation(); handleDeleteRecord(recordId); }} />
                            </div>
                            <div className="av-card-img">
                              <AppleImage 
                                imageUrl={imageUrl}
                                accession={acc}
                                title={title}
                                apiBase={API_BASE}
                                key={`${recordId}-${acc}-${title}`}
                              />
                            </div>
                            <div className="av-card-meta">
                              <div className="av-card-title">{title}</div>
                              <div className="av-card-sub">Accession: {acc || 'N/A'}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="av-nopics">No pictures to show.</div>
                )}
              </div>
            )}
        </div>
      </main>

      {errorMessage && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            backgroundColor: '#dc3545',
            color: 'white',
            padding: '16px 20px',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            minWidth: '300px',
            maxWidth: '400px',
            animation: 'slideIn 0.3s ease-out'
          }}
        >
          <span style={{ flex: 1 }}>{errorMessage}</span>
          <button
            onClick={() => setErrorMessage(null)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              fontSize: '18px',
              padding: '0',
              lineHeight: '1',
              fontWeight: 'bold'
            }}
          >
            ×
          </button>
          <style>{`
            @keyframes slideIn {
              from {
                transform: translateX(100%);
                opacity: 0;
              }
              to {
                transform: translateX(0);
                opacity: 1;
              }
            }
          `}</style>
        </div>
      )}
    </div>
  );
}

// Helper function to get record ID (same as component's getRecordId)
function getRecordIdForExport(record, index) {
  if (record._id) return record._id;
  if (record.id) return record.id;
  const acno = record.acno ?? '';
  const accession = record.accession ?? '';
  if (acno || accession) {
    return `${acno}_${accession}`;
  }
  return `record_${index}`;
}

// Helper to get field value from record (same logic as getFieldValue in component)
function getFieldValueForExport(record, excelColumnName) {
  // Try exact Excel column name in metadata first (most common case)
  if (record.metadata && record.metadata[excelColumnName] !== undefined && record.metadata[excelColumnName] !== null && record.metadata[excelColumnName] !== '') {
    return record.metadata[excelColumnName];
  }
  
  // Try with trimmed version (handle trailing spaces)
  const trimmedColumnName = excelColumnName.trim();
  if (trimmedColumnName !== excelColumnName) {
    if (record.metadata && record.metadata[trimmedColumnName] !== undefined && record.metadata[trimmedColumnName] !== null && record.metadata[trimmedColumnName] !== '') {
      return record.metadata[trimmedColumnName];
    }
  }
  
  // Try exact Excel column name in direct fields
  if (record[excelColumnName] !== undefined && record[excelColumnName] !== null && record[excelColumnName] !== '') {
    return record[excelColumnName];
  }
  
  // Try common field mappings
  const fieldMappings = {
    'CULTIVAR NAME': ['cultivar_name', 'CULTIVAR NAME'],
    'ACNO': ['acno', 'ACNO'],
    'ACCESSION': ['accession', 'ACCESSION'],
    'GENUS': ['e genus', 'e_genus', 'E GENUS', 'GENUS'],
    'SPECIES': ['e species', 'e_species', 'E SPECIES', 'SPECIES'],
    'COUNTRY': ['e origin country', 'e_origin_country', 'E Origin Country', 'COUNTRY'],
    'PROVINCE/STATE': ['e origin province', 'e_origin_province', 'E Origin Province', 'PROVINCE/STATE'],
    'PEDIGREE DESCRIPTION': ['e pedigree', 'e_pedigree', 'E pedigree', 'PEDIGREE DESCRIPTION'],
    'BREEDER OR COLLECTOR': ['e breeder', 'e_breeder', 'e breeder or collector', 'E Breeder', 'e collector', 'e_collector', 'E Collector', 'BREEDER OR COLLECTOR'],
    'LABEL NAME': ['cultivar_name', 'CULTIVAR NAME', 'LABEL NAME', 'label name']
  };
  
  if (fieldMappings[excelColumnName]) {
    for (const field of fieldMappings[excelColumnName]) {
      if (record[field] !== undefined && record[field] !== null && record[field] !== '') {
        return record[field];
      }
      if (record.metadata && record.metadata[field] !== undefined && record.metadata[field] !== null && record.metadata[field] !== '') {
        return record.metadata[field];
      }
    }
  }
  
  return '';
}

// Transform record to Excel format with all 54 columns
function transformRecordToExcelFormat(record, columnOrder) {
  const transformed = {};
  
  // Map each Excel column to its value
  columnOrder.forEach(columnName => {
    const value = getFieldValueForExport(record, columnName);
    transformed[columnName] = value !== null && value !== undefined ? String(value) : '';
  });
  
  return transformed;
}

async function exportCSV(rows, selectedIds = null, setErrorMessage = null) {
  if (!rows?.length) {
    if (setErrorMessage) {
      setErrorMessage("No rows to export.");
      setTimeout(() => setErrorMessage(null), 5000);
    } else {
      alert("No rows to export.");
    }
    return;
  }

  if (!selectedIds || selectedIds.size === 0) {
    if (setErrorMessage) {
      setErrorMessage("To download, select the apples");
      setTimeout(() => setErrorMessage(null), 5000);
    } else {
      alert("To download, select the apples");
    }
    return;
  }

  // Filter selected records
  let rowsToExport = rows.filter((row, index) => {
    const recordId = getRecordIdForExport(row, index);
    return selectedIds.has(recordId);
  });

  if (rowsToExport.length === 0) {
    if (setErrorMessage) {
      setErrorMessage("No selected records to export. Please select at least one record.");
      setTimeout(() => setErrorMessage(null), 5000);
    } else {
      alert("No selected records to export. Please select at least one record.");
    }
    return;
  }

  // Define exact column order (all 54 columns from Excel)
  const columnOrder = [
    "SITE ID",
    "PREFIX (ACP)",
    "ACNO",
    "ACCESSION",
    "CULTIVAR NAME",
    "FAMILY",
    "HABITAT",
    "BREEDER OR COLLECTOR",
    "GENUS",
    "SPECIES",
    "INVENTORY TYPE",
    "INVENTORY MAINTENANCE POLICY",
    "PLANT TYPE",
    "LIFE FORM",
    "IS DISTRIBUTABLE?",
    "FRUITSHAPE 115057",
    "FRUITLGTH 115156",
    "FRUITWIDTH 115157",
    "FRTWEIGHT 115121",
    "FRTSTEMTHK 115127",
    "SEEDCOLOR 115086",
    "SSIZE Quantity of Seed",
    "SEEDLENGTH 115163",
    "SEEDWIDTH 115164",
    "SEEDNUMBER 115087",
    "FRTTEXTURE 115123",
    "FRTSTMLGTH 115158",
    "SEEDSHAPE 115167",
    "FRTFLSHOXI 115129",
    "FIRST BLOOM DATE",
    "FULL BLOOM DATE",
    "COLOUR",
    "DENSITY",
    "FIREBLIGHT RATING",
    "TAXON",
    "CMT",
    "NARATIVEKEYWORD",
    "FULL NARATIVE",
    "PEDIGREE DESCRIPTION",
    "AVAILABILITY STATUS ",
    "PROVINCE/STATE",
    "COUNTRY",
    "LOCATION SECTION 1",
    "LOCATION SECTION 2",
    "LOCATION SECTION 3",
    "LOCATION SECTION 4",
    "COOPERATOR",
    "IPR TYPE",
    "LABEL NAME",
    "LEVEL OF IMPROVEMENT",
    "RELEASED DATE",
    "RELEASED DATE FORMAT",
    "COOPERATOR_NEW",
    "IMAGES"
  ];

  // Transform all records to Excel format with all 54 columns
  const transformedRows = rowsToExport.map(record => transformRecordToExcelFormat(record, columnOrder));

  // Create CSV content - Numbers applies grey to first column when importing CSV
  // This is a Numbers behavior that cannot be controlled via CSV format
  // CSV files are plain text and don't support cell formatting
  const escapeCSVValue = (value) => {
    if (value === null || value === undefined || value === '') {
      return '""'; // Return quoted empty string to ensure consistent formatting
    }
    const stringValue = String(value);
    // Always quote values to ensure Numbers treats them as text (prevents special formatting)
    // Escape any existing quotes by doubling them
    return `"${stringValue.replace(/"/g, '""')}"`;
  };

  // Build CSV header row (without empty first column)
  const csvHeader = columnOrder.map(col => escapeCSVValue(col)).join(',');
  
  // Build CSV data rows (without empty first column)
  const csvRows = transformedRows.map(row => {
    return columnOrder.map(col => escapeCSVValue(row[col] || '')).join(',');
  });
  
  // Combine header and rows
  const csvContent = [csvHeader, ...csvRows].join('\n');
  
  // Add UTF-8 BOM to ensure proper encoding
  const BOM = '\uFEFF';
  const csvWithBOM = BOM + csvContent;
  
  // Create and download CSV file
  const blob = new Blob([csvWithBOM], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `appleverse_selected_${rowsToExport.length}_records.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

async function downloadSelectedImages(rows, selectedIds, apiBase) {
  if (!selectedIds || selectedIds.size === 0) {
    return alert("Please select at least one apple to download images.");
  }

  const selectedRows = rows.filter((row, index) => {
    const recordId = getRecordIdForExport(row, index);
    return selectedIds.has(recordId);
  });

  if (selectedRows.length === 0) {
    return alert("No selected records found.");
  }

  const imagesToDownload = [];
  for (const row of selectedRows) {
    const imgs = (row.images && Array.isArray(row.images)) ? row.images : [];
    const cultivarName = (row.cultivar_name ?? row.name ?? 'Unknown').replace(/[^a-zA-Z0-9]/g, '_');
    const accession = (row.accession ?? '').replace(/[^a-zA-Z0-9]/g, '_');

    for (let i = 0; i < imgs.length; i++) {
      const imgPath = imgs[i];
      const imageUrl = imgPath.startsWith('/images/') || imgPath.startsWith('/data/')
        ? `${apiBase}${imgPath}`
        : imgPath;

      const ext = imgPath.match(/\.(jpg|jpeg|png|webp|gif)$/i)?.[0] || '.jpg';
      const filename = `${cultivarName}_${accession}_${i + 1}${ext}`;

      imagesToDownload.push({ url: imageUrl, filename });
    }
  }

  if (imagesToDownload.length === 0) {
    return alert("No images found for selected apples.");
  }

  for (const { url, filename } of imagesToDownload) {
    try {
      const response = await fetch(url);
      if (!response.ok) continue;

      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);

      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error(`Failed to download ${filename}:`, error);
    }
  }

  alert(`Downloaded ${imagesToDownload.length} image(s) from ${selectedRows.length} selected apple(s).`);
}

async function exportPDF(rows, selectedIds = null, apiBase, setErrorMessage = null) {
  if (!rows?.length) {
    if (setErrorMessage) {
      setErrorMessage("No rows to export.");
      setTimeout(() => setErrorMessage(null), 5000);
    } else {
      alert("No rows to export.");
    }
    return;
  }

  if (!selectedIds || selectedIds.size === 0) {
    if (setErrorMessage) {
      setErrorMessage("To download, select the apples");
      setTimeout(() => setErrorMessage(null), 5000);
    } else {
      alert("To download, select the apples");
    }
    return;
  }

  let rowsToExport = rows.filter((row, index) => {
    const recordId = getRecordIdForExport(row, index);
    return selectedIds.has(recordId);
  });

  if (rowsToExport.length === 0) {
    if (setErrorMessage) {
      setErrorMessage("No selected records to export. Please select at least one record.");
      setTimeout(() => setErrorMessage(null), 5000);
    } else {
      alert("No selected records to export. Please select at least one record.");
    }
    return;
  }

  try {
    const { jsPDF } = await import("jspdf");
    const JSZip = (await import("jszip")).default;

    const pdfs = [];
    const totalApples = rowsToExport.length;
    
    // Update progress function
    const updateProgress = (current, total) => {
      const percent = Math.round((current / total) * 100);
      if (setErrorMessage) {
        setErrorMessage(`Generating PDF... ${current}/${total} apples (${percent}%)`);
      }
      console.log(`PDF: Progress ${current}/${total} (${percent}%)`);
    };
    
    console.log(`PDF: Starting export with ${totalApples} selected apple(s)...`);

    for (let appleIndex = 0; appleIndex < rowsToExport.length; appleIndex++) {
      const row = rowsToExport[appleIndex];
      
      // Update progress: every apple if <= 10, every 5 if > 10, or on last apple
      if (totalApples <= 10 || appleIndex % 5 === 0 || appleIndex === rowsToExport.length - 1) {
        updateProgress(appleIndex + 1, totalApples);
      }
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 15;
      const bottomMargin = 20; // Extra margin at bottom to prevent text cutoff
      const leftWidth = pageWidth * 0.50; // Increased from 0.45 to give more space for text
      const rightWidth = pageWidth * 0.45;
      const rightStart = pageWidth * 0.52;

      let yPos = margin;

      // Helper to get field value from record (checks metadata and direct fields)
      const getPDFFieldValue = (record, fieldNames) => {
        // Check metadata first (where Excel columns are stored)
        if (record.metadata) {
          // Handle both Map and plain object formats
          const isMap = record.metadata instanceof Map;
          const getMetadataValue = (key) => {
            if (isMap) {
              return record.metadata.get(key);
            } else {
              return record.metadata[key];
            }
          };
          
          const getMetadataKeys = () => {
            if (isMap) {
              return Array.from(record.metadata.keys());
            } else {
              return Object.keys(record.metadata);
            }
          };
          
          for (const field of fieldNames) {
            // Try exact match
            let value = getMetadataValue(field);
            if (value !== undefined && value !== null && value !== '') {
              return String(value);
            }
            
            // Try with trimmed version (handle trailing spaces in column names)
            const trimmedField = field.trim();
            if (trimmedField !== field) {
              value = getMetadataValue(trimmedField);
              if (value !== undefined && value !== null && value !== '') {
                return String(value);
              }
            }
            
            // Try case-insensitive match in metadata keys
            const metadataKeys = getMetadataKeys();
            for (const key of metadataKeys) {
              if (key && String(key).trim().toLowerCase() === field.trim().toLowerCase()) {
                value = getMetadataValue(key);
                if (value !== undefined && value !== null && value !== '') {
                  return String(value);
                }
              }
            }
          }
        }
        // Check direct fields
        for (const field of fieldNames) {
          const value = record[field];
          if (value !== undefined && value !== null && value !== '') {
            return String(value);
          }
        }
        return '';
      };

      doc.setFontSize(18);
      doc.setTextColor(231, 76, 60);
      const cultivarName = getPDFFieldValue(row, ['CULTIVAR NAME', 'cultivar_name', 'name', 'cultivar']) || 'Unknown';
      doc.text(cultivarName, margin, yPos);
      yPos += 10;

      doc.setFontSize(12);
      doc.setTextColor(52, 73, 94);
      const accession = getPDFFieldValue(row, ['ACCESSION', 'accession']) || '';
      doc.text(`Accession: ${accession}`, margin, yPos);
      yPos += 8;

      doc.setDrawColor(231, 76, 60);
      doc.setLineWidth(0.5);
      doc.line(margin, yPos, leftWidth + margin, yPos);
      yPos += 8;

      // Get images first (before rendering data columns)
      let imgs = (row.images && Array.isArray(row.images)) ? row.images :
                 (row.Images && Array.isArray(row.Images)) ? row.Images :
                 (row.IMAGE && Array.isArray(row.IMAGE)) ? row.IMAGE :
                 (row['images'] && Array.isArray(row['images'])) ? row['images'] : [];
      
      // Format database images to full URLs
      if (imgs.length > 0) {
        imgs = imgs.map(img => {
          const imgPath = String(img).trim();
          if (imgPath.startsWith('http://') || imgPath.startsWith('https://')) {
            return imgPath;
          } else if (imgPath.startsWith('/images/') || imgPath.startsWith('/data/')) {
            return `${apiBase}${imgPath}`;
          } else if (imgPath.startsWith('images/') || imgPath.startsWith('data/')) {
            return `${apiBase}/${imgPath}`;
          } else {
            return `${apiBase}/images/${imgPath}`;
          }
        });
      }
      
      // Always try to fetch from backend API as well
      if (accession) {
        try {
          const response = await fetch(`${apiBase}/api/apples/find-image/${encodeURIComponent(accession)}`);
          const data = await response.json();
          if (data.success && data.images && data.images.length > 0) {
            const apiImgs = data.images.map(img => {
              const pathParts = img.split('/');
              if (pathParts.length > 0) {
                const filename = pathParts[pathParts.length - 1];
                const encodedFilename = encodeURIComponent(filename);
                pathParts[pathParts.length - 1] = encodedFilename;
                return `${apiBase}${pathParts.join('/')}`;
              }
              return `${apiBase}${img}`;
            });
            
            const seenUrls = new Set(imgs.map(url => url.toLowerCase()));
            apiImgs.forEach(apiImg => {
              if (!seenUrls.has(apiImg.toLowerCase())) {
                imgs.push(apiImg);
                seenUrls.add(apiImg.toLowerCase());
              }
            });
          }
        } catch (error) {
          console.error(`PDF: Error fetching images for ${accession}:`, error);
        }
      }
      
      // Render images at top right (fixed position)
      let imageY = margin + 10; // Start images right after title
      const imageSize = 45;
      const imageSpacing = 8;
      const imageWidth = rightWidth * (2 / 3);
      const imageX = rightStart + rightWidth - imageWidth;
      let imagesLoaded = 0;
      let rightSideTextStartY = margin + 10; // Where text can start on right side

      if (imgs.length === 0) {
        // No images - right side is available for text from the start
        rightSideTextStartY = margin + 10;
      } else {
        // Render images and track where they end
        for (let i = 0; i < Math.min(imgs.length, 4); i++) {
          let imgPath = imgs[i];
          let imageUrl = '';
          
          if (imgPath.startsWith('http://') || imgPath.startsWith('https://')) {
            imageUrl = imgPath;
            try {
              const urlObj = new URL(imageUrl);
              const pathParts = urlObj.pathname.split('/');
              if (pathParts.length > 0) {
                const filename = pathParts[pathParts.length - 1];
                if (filename.includes('%') === false && (filename.includes(' ') || filename.includes('&'))) {
                  const encodedFilename = encodeURIComponent(filename);
                  pathParts[pathParts.length - 1] = encodedFilename;
                  imageUrl = `${urlObj.origin}${pathParts.join('/')}`;
                }
              }
            } catch (e) {
              const lastSlash = imageUrl.lastIndexOf('/');
              if (lastSlash >= 0) {
                const before = imageUrl.substring(0, lastSlash + 1);
                const filename = imageUrl.substring(lastSlash + 1);
                if (!filename.includes('%')) {
                  imageUrl = before + encodeURIComponent(filename);
                }
              }
            }
          } else if (imgPath.startsWith('/images/') || imgPath.startsWith('/data/')) {
            const pathParts = imgPath.split('/');
            if (pathParts.length > 0) {
              const filename = pathParts[pathParts.length - 1];
              const encodedFilename = encodeURIComponent(filename);
              pathParts[pathParts.length - 1] = encodedFilename;
              imageUrl = `${apiBase}${pathParts.join('/')}`;
            } else {
              imageUrl = `${apiBase}${imgPath}`;
            }
          } else if (imgPath.startsWith('images/') || imgPath.startsWith('data/')) {
            imageUrl = `${apiBase}/${imgPath}`;
            const lastSlash = imageUrl.lastIndexOf('/');
            if (lastSlash >= 0) {
              const before = imageUrl.substring(0, lastSlash + 1);
              const filename = imageUrl.substring(lastSlash + 1);
              imageUrl = before + encodeURIComponent(filename);
            }
          } else {
            imageUrl = `${apiBase}/images/${encodeURIComponent(imgPath)}`;
          }

          try {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            
            const imageLoaded = await new Promise((resolve) => {
              img.onload = () => resolve(true);
              img.onerror = () => resolve(false);
              img.src = imageUrl;
              setTimeout(() => resolve(false), 10000);
            });
            
            if (imageLoaded && img.complete && img.naturalWidth > 0 && img.naturalHeight > 0) {
              const canvas = document.createElement('canvas');
              canvas.width = img.naturalWidth;
              canvas.height = img.naturalHeight;
              const ctx = canvas.getContext('2d');
              ctx.drawImage(img, 0, 0);
              
              const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
              let format = 'JPEG';
              if (imageUrl.toLowerCase().endsWith('.png')) {
                const pngDataUrl = canvas.toDataURL('image/png');
                format = 'PNG';
                doc.addImage(pngDataUrl, format, imageX, imageY, imageWidth, imageSize);
              } else {
                doc.addImage(dataUrl, format, imageX, imageY, imageWidth, imageSize);
              }
              
              imagesLoaded++;
              imageY += imageSize + imageSpacing;
            } else {
              doc.setFontSize(10);
              doc.setTextColor(150, 150, 150);
              const unavailableText = 'Image unavailable';
              const textWidth = doc.getTextWidth(unavailableText);
              const centerX = rightStart + (rightWidth / 2) - (textWidth / 2);
              doc.text(unavailableText, centerX, imageY);
              imageY += 15;
            }
          } catch (error) {
            console.error(`Failed to load image ${imageUrl}:`, error);
            doc.setFontSize(10);
            doc.setTextColor(150, 150, 150);
            const unavailableText = 'Image unavailable';
            const textWidth = doc.getTextWidth(unavailableText);
            const centerX = rightStart + (rightWidth / 2) - (textWidth / 2);
            doc.text(unavailableText, centerX, imageY);
            imageY += 15;
          }
        }
        // Set right side text start position after last image
        rightSideTextStartY = imageY + 5; // Start text 5px below last image
      }
      
      // If no images were loaded, right side is available from the start
      if (imagesLoaded === 0 && imgs.length === 0) {
        rightSideTextStartY = margin + 10;
      }

      // Now render data columns with bold column names
      doc.setFontSize(10);
      
      // Calculate where images end (if any)
      // Images are only on the first page, so track the Y position where they end
      let imagesEndY = margin + 10; // Default if no images
      let imagesPageNumber = 0; // Images are on page 0 (first page)
      if (imagesLoaded > 0) {
        imagesEndY = imageY; // Where last image ended
      }
      
      // Track current page number (0-based)
      let currentPageNumber = 0;
      
      // All 54 columns in exact order from Excel
      const allColumns = [
        "SITE ID",
        "PREFIX (ACP)",
        "ACNO",
        "ACCESSION",
        "CULTIVAR NAME",
        "FAMILY",
        "HABITAT",
        "BREEDER OR COLLECTOR",
        "GENUS",
        "SPECIES",
        "INVENTORY TYPE",
        "INVENTORY MAINTENANCE POLICY",
        "PLANT TYPE",
        "LIFE FORM",
        "IS DISTRIBUTABLE?",
        "FRUITSHAPE 115057",
        "FRUITLGTH 115156",
        "FRUITWIDTH 115157",
        "FRTWEIGHT 115121",
        "FRTSTEMTHK 115127",
        "SEEDCOLOR 115086",
        "SSIZE Quantity of Seed",
        "SEEDLENGTH 115163",
        "SEEDWIDTH 115164",
        "SEEDNUMBER 115087",
        "FRTTEXTURE 115123",
        "FRTSTMLGTH 115158",
        "SEEDSHAPE 115167",
        "FRTFLSHOXI 115129",
        "FIRST BLOOM DATE",
        "FULL BLOOM DATE",
        "COLOUR",
        "DENSITY",
        "FIREBLIGHT RATING",
        "TAXON",
        "CMT",
        "NARATIVEKEYWORD",
        "FULL NARATIVE",
        "PEDIGREE DESCRIPTION",
        "AVAILABILITY STATUS ",
        "PROVINCE/STATE",
        "COUNTRY",
        "LOCATION SECTION 1",
        "LOCATION SECTION 2",
        "LOCATION SECTION 3",
        "LOCATION SECTION 4",
        "COOPERATOR",
        "IPR TYPE",
        "LABEL NAME",
        "LEVEL OF IMPROVEMENT",
        "RELEASED DATE",
        "RELEASED DATE FORMAT",
        "COOPERATOR_NEW",
        "IMAGES"
      ];

      // Helper to get field value for a column (with fallback field names)
      const getColumnValue = (columnName) => {
        // Try exact column name first (most common case - stored in metadata)
        let value = getPDFFieldValue(row, [columnName]);
        
        // If not found, try common field name mappings
        if (!value) {
          const fieldMappings = {
            'CULTIVAR NAME': ['cultivar_name', 'name', 'cultivar'],
            'ACNO': ['acno'],
            'ACCESSION': ['accession'],
            'COUNTRY': ['e origin country', 'e_origin_country', 'E Origin Country'],
            'PROVINCE/STATE': ['e origin province', 'e_origin_province', 'E Origin Province'],
            'GENUS': ['e genus', 'e_genus', 'E GENUS'],
            'SPECIES': ['e species', 'e_species', 'E SPECIES'],
            'PEDIGREE DESCRIPTION': ['e pedigree', 'e_pedigree', 'E pedigree', 'E Pedigree'],
            'BREEDER OR COLLECTOR': ['e breeder', 'e_breeder', 'e breeder or collector', 'E Breeder', 'E_BREEDER', 'e collector', 'e_collector', 'E Collector'],
            'TAXON': ['taxon', 'taxno']
          };
          
          if (fieldMappings[columnName]) {
            value = getPDFFieldValue(row, fieldMappings[columnName]);
          }
        }
        
        return value || '';
      };

      let dataY = yPos;
      
      // Display all columns except IMAGES (which is handled separately)
      allColumns.forEach(columnName => {
        // Skip IMAGES column as it's handled separately
        if (columnName === 'IMAGES') {
          return;
        }
        
        const value = getColumnValue(columnName);
        const displayValue = value || 'N/A';
        const lineHeight = 5;
        const isFullNarrative = columnName === 'FULL NARATIVE';
        
        // Check if we need a new page
        if (dataY + lineHeight > pageHeight - bottomMargin) {
          doc.addPage();
          currentPageNumber++;
          dataY = margin;
        }
        
        // For FULL NARATIVE, render column name on separate line, then value below
        // For all other columns, render column name and value on same line
        if (isFullNarrative) {
          // Render column name in bold and black on its own line
          doc.setFont(undefined, 'bold');
          doc.setTextColor(0, 0, 0);
          const columnNameText = `${columnName}:`;
          doc.text(columnNameText, margin, dataY);
          dataY += lineHeight;
          
          // Render value - use full width if no images, past image area, or on new page
          doc.setFont(undefined, 'normal');
          doc.setTextColor(44, 62, 80);
          
          let remainingText = displayValue;
          const valueX = margin + 5;
          let textRendered = false;
          
          while (remainingText && remainingText.trim().length > 0) {
            // Determine available width:
            // - Full width if: no images, past image area on first page, or on any page after first
            const isOnFirstPage = currentPageNumber === imagesPageNumber;
            const isPastImageArea = isOnFirstPage && dataY >= imagesEndY;
            const useFullWidth = imagesLoaded === 0 || !isOnFirstPage || isPastImageArea;
            const availableWidth = useFullWidth ? (pageWidth - (margin * 2) - 5) : (leftWidth - 5);
            
            // Check if we need a new page before starting
            if (dataY + lineHeight > pageHeight - bottomMargin) {
              doc.addPage();
              currentPageNumber++;
              dataY = margin;
              // On new page (after first), always use full width since images are only on first page
              const availableWidthNewPage = pageWidth - (margin * 2) - 5;
              const valueLinesNewPage = doc.splitTextToSize(remainingText, availableWidthNewPage);
              
              for (let j = 0; j < valueLinesNewPage.length; j++) {
                if (dataY + lineHeight > pageHeight - bottomMargin) {
                  doc.addPage();
                  currentPageNumber++;
                  dataY = margin;
                }
                doc.text(valueLinesNewPage[j], valueX, dataY);
                dataY += lineHeight;
                textRendered = true;
              }
              break; // All text rendered on new page(s)
            }
            
            // Split text for current available width
            const valueLines = doc.splitTextToSize(remainingText, availableWidth);
            
            if (valueLines.length === 0) {
              break; // No more text to render
            }
            
            // Track if we need to recalculate with different width
            let needRecalculate = false;
            let newRemainingText = '';
            
            // Render all lines
            for (let i = 0; i < valueLines.length; i++) {
              // Check if we need a new page
              if (dataY + lineHeight > pageHeight - bottomMargin) {
                doc.addPage();
                currentPageNumber++;
                dataY = margin;
                // Recalculate remaining text for new page (always full width on new pages)
                newRemainingText = valueLines.slice(i).join(' ');
                needRecalculate = true;
                break;
              }
              
              // Check if we've passed image area on first page - need to recalculate with full width
              if (isOnFirstPage && imagesLoaded > 0 && dataY >= imagesEndY && i < valueLines.length - 1) {
                // Render current line, then recalculate remaining with full width
                doc.text(valueLines[i], valueX, dataY);
                dataY += lineHeight;
                textRendered = true;
                newRemainingText = valueLines.slice(i + 1).join(' ');
                needRecalculate = true;
                break;
              }
              
              // Render the line
              doc.text(valueLines[i], valueX, dataY);
              dataY += lineHeight;
              textRendered = true;
            }
            
            // Update remaining text if we need to recalculate
            if (needRecalculate) {
              remainingText = newRemainingText;
              continue; // Continue while loop with new remaining text
            }
            
            // If we rendered all lines, we're done
            break;
          }
        } else {
          // For all other columns, render column name and value on same line
          doc.setFont(undefined, 'bold');
          doc.setTextColor(0, 0, 0);
          const columnNameText = `${columnName}:`;
          const spaceWidth = doc.getTextWidth(' '); // Width of one space character
          const columnNameWidth = doc.getTextWidth(columnNameText);
          
          // Determine available width for value
          const isOnFirstPage = currentPageNumber === imagesPageNumber;
          const isPastImageArea = isOnFirstPage && dataY >= imagesEndY;
          const useFullWidth = imagesLoaded === 0 || !isOnFirstPage || isPastImageArea;
          const totalAvailableWidth = useFullWidth ? (pageWidth - (margin * 2)) : leftWidth;
          const valueWidth = totalAvailableWidth - columnNameWidth - spaceWidth; // One space between name and value
          const valueX = margin + columnNameWidth + spaceWidth;
          
          // Split value text to fit available width
          doc.setFont(undefined, 'normal');
          doc.setTextColor(44, 62, 80);
          const valueLines = doc.splitTextToSize(displayValue, valueWidth);
          
          // Render first line: column name + first part of value on same line
          if (valueLines.length > 0) {
            // Render column name
            doc.setFont(undefined, 'bold');
            doc.setTextColor(0, 0, 0);
            doc.text(columnNameText, margin, dataY);
            
            // Render first line of value on same line
            doc.setFont(undefined, 'normal');
            doc.setTextColor(44, 62, 80);
            doc.text(valueLines[0], valueX, dataY);
            dataY += lineHeight;
            
            // Render remaining value lines (if any) with proper indentation
            for (let i = 1; i < valueLines.length; i++) {
              if (dataY + lineHeight > pageHeight - bottomMargin) {
                doc.addPage();
                currentPageNumber++;
                dataY = margin;
                // On new page, recalculate width (always full width on new pages)
                const availableWidthNewPage = pageWidth - (margin * 2);
                const remainingText = valueLines.slice(i).join(' ');
                const valueLinesNewPage = doc.splitTextToSize(remainingText, availableWidthNewPage);
                
                for (let j = 0; j < valueLinesNewPage.length; j++) {
                  if (dataY + lineHeight > pageHeight - bottomMargin) {
                    doc.addPage();
                    currentPageNumber++;
                    dataY = margin;
                  }
                  doc.text(valueLinesNewPage[j], margin, dataY);
                  dataY += lineHeight;
                }
                break;
              }
              
              // Check if we've passed image area - recalculate width if needed
              const isOnFirstPageForLine = currentPageNumber === imagesPageNumber;
              const isPastImageAreaForLine = isOnFirstPageForLine && dataY >= imagesEndY;
              const useFullWidthForLine = imagesLoaded === 0 || !isOnFirstPageForLine || isPastImageAreaForLine;
              const availableWidthForLine = useFullWidthForLine ? (pageWidth - (margin * 2)) : leftWidth;
              
              // If width changed, recalculate remaining text
              if (useFullWidthForLine !== useFullWidth && i < valueLines.length - 1) {
                const remainingText = valueLines.slice(i).join(' ');
                const valueLinesRecalc = doc.splitTextToSize(remainingText, availableWidthForLine);
                
                for (let j = 0; j < valueLinesRecalc.length; j++) {
                  if (dataY + lineHeight > pageHeight - bottomMargin) {
                    doc.addPage();
                    currentPageNumber++;
                    dataY = margin;
                  }
                  doc.text(valueLinesRecalc[j], margin, dataY);
                  dataY += lineHeight;
                }
                break;
              }
              
              doc.text(valueLines[i], valueX, dataY);
              dataY += lineHeight;
            }
          } else {
            // Even if value is empty, render column name
            doc.setFont(undefined, 'bold');
            doc.setTextColor(0, 0, 0);
            doc.text(columnNameText, margin, dataY);
            dataY += lineHeight;
          }
        }
        
        dataY += 2; // Spacing after field
      });

      const pdfBlob = doc.output('blob');
      const cultivarNameSafe = cultivarName.replace(/[^a-zA-Z0-9]/g, '_');
      pdfs.push({ blob: pdfBlob, filename: `${cultivarNameSafe}_${accession || 'unknown'}.pdf` });
    }

    // Final progress update (100%)
    updateProgress(totalApples, totalApples);
    
    // Small delay to show 100% before starting download
    await new Promise(resolve => setTimeout(resolve, 300));

    if (pdfs.length > 1) {
      const zip = new JSZip();
      pdfs.forEach(({ blob, filename }) => {
        zip.file(filename, blob);
      });

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = window.URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `appleverse_selected_${pdfs.length}_apples.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      const successMsg = `Downloaded ZIP file with ${pdfs.length} PDF files.`;
      console.log("PDF:", successMsg);
      if (setErrorMessage) {
        setErrorMessage(successMsg);
        setTimeout(() => setErrorMessage(null), 5000);
      } else {
        alert(successMsg);
      }
    } else {
      const url = window.URL.createObjectURL(pdfs[0].blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = pdfs[0].filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      const successMsg = `Downloaded PDF: ${pdfs[0].filename}`;
      console.log("PDF:", successMsg);
      if (setErrorMessage) {
        setErrorMessage(successMsg);
        setTimeout(() => setErrorMessage(null), 5000);
      } else {
        alert(successMsg);
      }
    }
  } catch (error) {
    console.error("PDF export error:", error);
    const errorMsg = `Failed to generate PDF: ${error.message || 'Unknown error'}`;
    if (setErrorMessage) {
      setErrorMessage(errorMsg);
      setTimeout(() => setErrorMessage(null), 5000);
    } else {
      alert(errorMsg);
    }
  }
}

// Export all apples in a single PDF file
async function exportPDFAll(rows, apiBase, setErrorMessage = null) {
  console.log("PDF(All): Starting export with", rows?.length || 0, "apples");
  
  if (!rows?.length) {
    const msg = "No rows to export.";
    console.error("PDF(All):", msg);
    if (setErrorMessage) {
      setErrorMessage(msg);
      setTimeout(() => setErrorMessage(null), 5000);
    } else {
      alert(msg);
    }
    return;
  }

  try {
    console.log("PDF(All): Loading jsPDF library...");
    const { jsPDF } = await import("jspdf");
    console.log("PDF(All): jsPDF loaded, creating document...");

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    const bottomMargin = 20;
    const leftWidth = pageWidth * 0.50;
    const rightWidth = pageWidth * 0.45;
    const rightStart = pageWidth * 0.52;

    // Helper to get field value from record (same as exportPDF)
    const getPDFFieldValue = (record, fieldNames) => {
      if (record.metadata) {
        const isMap = record.metadata instanceof Map;
        const getMetadataValue = (key) => {
          if (isMap) {
            return record.metadata.get(key);
          } else {
            return record.metadata[key];
          }
        };
        
        const getMetadataKeys = () => {
          if (isMap) {
            return Array.from(record.metadata.keys());
          } else {
            return Object.keys(record.metadata);
          }
        };
        
        for (const field of fieldNames) {
          let value = getMetadataValue(field);
          if (value !== undefined && value !== null && value !== '') {
            return String(value);
          }
          
          const trimmedField = field.trim();
          if (trimmedField !== field) {
            value = getMetadataValue(trimmedField);
            if (value !== undefined && value !== null && value !== '') {
              return String(value);
            }
          }
          
          const metadataKeys = getMetadataKeys();
          for (const key of metadataKeys) {
            if (key && String(key).trim().toLowerCase() === field.trim().toLowerCase()) {
              value = getMetadataValue(key);
              if (value !== undefined && value !== null && value !== '') {
                return String(value);
              }
            }
          }
        }
      }
      for (const field of fieldNames) {
        const value = record[field];
        if (value !== undefined && value !== null && value !== '') {
          return String(value);
        }
      }
      return '';
    };

    // All 54 columns in exact order from Excel
    const allColumns = [
      "SITE ID", "PREFIX (ACP)", "ACNO", "ACCESSION", "CULTIVAR NAME", "FAMILY", "HABITAT",
      "BREEDER OR COLLECTOR", "GENUS", "SPECIES", "INVENTORY TYPE", "INVENTORY MAINTENANCE POLICY",
      "PLANT TYPE", "LIFE FORM", "IS DISTRIBUTABLE?", "FRUITSHAPE 115057", "FRUITLGTH 115156",
      "FRUITWIDTH 115157", "FRTWEIGHT 115121", "FRTSTEMTHK 115127", "SEEDCOLOR 115086",
      "SSIZE Quantity of Seed", "SEEDLENGTH 115163", "SEEDWIDTH 115164", "SEEDNUMBER 115087",
      "FRTTEXTURE 115123", "FRTSTMLGTH 115158", "SEEDSHAPE 115167", "FRTFLSHOXI 115129",
      "FIRST BLOOM DATE", "FULL BLOOM DATE", "COLOUR", "DENSITY", "FIREBLIGHT RATING", "TAXON",
      "CMT", "NARATIVEKEYWORD", "FULL NARATIVE", "PEDIGREE DESCRIPTION", "AVAILABILITY STATUS ",
      "PROVINCE/STATE", "COUNTRY", "LOCATION SECTION 1", "LOCATION SECTION 2", "LOCATION SECTION 3",
      "LOCATION SECTION 4", "COOPERATOR", "IPR TYPE", "LABEL NAME", "LEVEL OF IMPROVEMENT",
      "RELEASED DATE", "RELEASED DATE FORMAT", "COOPERATOR_NEW", "IMAGES"
    ];

    const getColumnValue = (row, columnName) => {
      let value = getPDFFieldValue(row, [columnName]);
      if (!value) {
        const fieldMappings = {
          'CULTIVAR NAME': ['cultivar_name', 'name', 'cultivar'],
          'ACNO': ['acno'],
          'ACCESSION': ['accession'],
          'COUNTRY': ['e origin country', 'e_origin_country', 'E Origin Country'],
          'PROVINCE/STATE': ['e origin province', 'e_origin_province', 'E Origin Province'],
          'GENUS': ['e genus', 'e_genus', 'E GENUS'],
          'SPECIES': ['e species', 'e_species', 'E SPECIES'],
          'PEDIGREE DESCRIPTION': ['e pedigree', 'e_pedigree', 'E pedigree', 'E Pedigree'],
          'BREEDER OR COLLECTOR': ['e breeder', 'e_breeder', 'e breeder or collector', 'E Breeder', 'E_BREEDER', 'e collector', 'e_collector', 'E Collector'],
          'TAXON': ['taxon', 'taxno']
        };
        if (fieldMappings[columnName]) {
          value = getPDFFieldValue(row, fieldMappings[columnName]);
        }
      }
      return value || '';
    };

    // Process each apple
    const totalApples = rows.length;
    console.log(`PDF(All): Processing ${totalApples} apples (optimized mode - images from data only, no API calls)...`);
    
    // Update progress every 25 apples for better feedback
    const updateProgress = (current, total) => {
      const percent = Math.round((current / total) * 100);
      if (setErrorMessage) {
        setErrorMessage(`Generating PDF(All)... ${current}/${total} apples (${percent}%)`);
      }
      console.log(`PDF(All): Progress ${current}/${total} (${percent}%)`);
    };
    
    for (let appleIndex = 0; appleIndex < rows.length; appleIndex++) {
      const row = rows[appleIndex];
      
      // Update progress every 25 apples
      if (appleIndex % 25 === 0 || appleIndex === rows.length - 1) {
        updateProgress(appleIndex + 1, totalApples);
      }
      
      // Add new page for each apple (except first)
      if (appleIndex > 0) {
        doc.addPage();
      }

      let yPos = margin;
      let currentPageNumber = 0;
      const imagesPageNumber = 0;

      // Title
      doc.setFontSize(18);
      doc.setTextColor(231, 76, 60);
      const cultivarName = getPDFFieldValue(row, ['CULTIVAR NAME', 'cultivar_name', 'name', 'cultivar']) || 'Unknown';
      doc.text(cultivarName, margin, yPos);
      yPos += 10;

      doc.setFontSize(12);
      doc.setTextColor(52, 73, 94);
      const accession = getPDFFieldValue(row, ['ACCESSION', 'accession']) || '';
      doc.text(`Accession: ${accession}`, margin, yPos);
      yPos += 8;

      doc.setDrawColor(231, 76, 60);
      doc.setLineWidth(0.5);
      doc.line(margin, yPos, leftWidth + margin, yPos);
      yPos += 8;

      // Get images
      let imgs = (row.images && Array.isArray(row.images)) ? row.images :
                 (row.Images && Array.isArray(row.Images)) ? row.Images :
                 (row.IMAGE && Array.isArray(row.IMAGE)) ? row.IMAGE :
                 (row['images'] && Array.isArray(row['images'])) ? row['images'] : [];
      
      if (imgs.length > 0) {
        imgs = imgs.map(img => {
          const imgPath = String(img).trim();
          if (imgPath.startsWith('http://') || imgPath.startsWith('https://')) {
            return imgPath;
          } else if (imgPath.startsWith('/images/') || imgPath.startsWith('/data/')) {
            return `${apiBase}${imgPath}`;
          } else if (imgPath.startsWith('images/') || imgPath.startsWith('data/')) {
            return `${apiBase}/${imgPath}`;
          } else {
            return `${apiBase}/images/${imgPath}`;
          }
        });
      }
      
      // Fetch images from API (same as single PDF export) but with timeout for efficiency
      if (accession) {
        try {
          // Use Promise.race to add timeout for API calls in bulk processing
          const fetchPromise = fetch(`${apiBase}/api/apples/find-image/${encodeURIComponent(accession)}`);
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout')), 2000) // 2 second timeout for API calls
          );
          
          const response = await Promise.race([fetchPromise, timeoutPromise]);
          const data = await response.json();
          
          if (data.success && data.images && data.images.length > 0) {
            const apiImgs = data.images.map(img => {
              const pathParts = img.split('/');
              if (pathParts.length > 0) {
                const filename = pathParts[pathParts.length - 1];
                const encodedFilename = encodeURIComponent(filename);
                pathParts[pathParts.length - 1] = encodedFilename;
                return `${apiBase}${pathParts.join('/')}`;
              }
              return `${apiBase}${img}`;
            });
            const seenUrls = new Set(imgs.map(url => url.toLowerCase()));
            apiImgs.forEach(apiImg => {
              if (!seenUrls.has(apiImg.toLowerCase())) {
                imgs.push(apiImg);
                seenUrls.add(apiImg.toLowerCase());
              }
            });
          }
        } catch (error) {
          // Silently continue if API call fails or times out - use images from row data
          console.log(`PDF(All): Skipping API image fetch for ${accession} (timeout or error)`);
        }
      }
      
      // Render images
      let imageY = margin + 10;
      const imageSize = 45;
      const imageSpacing = 8;
      const imageWidth = rightWidth * (2 / 3);
      const imageX = rightStart + rightWidth - imageWidth;
      let imagesLoaded = 0;
      let rightSideTextStartY = margin + 10;
      let imagesEndY = margin + 10;

      if (imgs.length > 0) {
        for (let i = 0; i < Math.min(imgs.length, 4); i++) {
          let imgPath = imgs[i];
          let imageUrl = '';
          
          if (imgPath.startsWith('http://') || imgPath.startsWith('https://')) {
            imageUrl = imgPath;
            try {
              const urlObj = new URL(imageUrl);
              const pathParts = urlObj.pathname.split('/');
              if (pathParts.length > 0) {
                const filename = pathParts[pathParts.length - 1];
                if (filename.includes('%') === false && (filename.includes(' ') || filename.includes('&'))) {
                  const encodedFilename = encodeURIComponent(filename);
                  pathParts[pathParts.length - 1] = encodedFilename;
                  imageUrl = `${urlObj.origin}${pathParts.join('/')}`;
                }
              }
            } catch (e) {
              const lastSlash = imageUrl.lastIndexOf('/');
              if (lastSlash >= 0) {
                const before = imageUrl.substring(0, lastSlash + 1);
                const filename = imageUrl.substring(lastSlash + 1);
                if (!filename.includes('%')) {
                  imageUrl = before + encodeURIComponent(filename);
                }
              }
            }
          } else if (imgPath.startsWith('/images/') || imgPath.startsWith('/data/')) {
            const pathParts = imgPath.split('/');
            if (pathParts.length > 0) {
              const filename = pathParts[pathParts.length - 1];
              const encodedFilename = encodeURIComponent(filename);
              pathParts[pathParts.length - 1] = encodedFilename;
              imageUrl = `${apiBase}${pathParts.join('/')}`;
            } else {
              imageUrl = `${apiBase}${imgPath}`;
            }
          } else if (imgPath.startsWith('images/') || imgPath.startsWith('data/')) {
            imageUrl = `${apiBase}/${imgPath}`;
            const lastSlash = imageUrl.lastIndexOf('/');
            if (lastSlash >= 0) {
              const before = imageUrl.substring(0, lastSlash + 1);
              const filename = imageUrl.substring(lastSlash + 1);
              imageUrl = before + encodeURIComponent(filename);
            }
          } else {
            imageUrl = `${apiBase}/images/${encodeURIComponent(imgPath)}`;
          }

          try {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            
            // Optimized timeout for PDF(All) - faster bulk processing (1s instead of 10s)
            const imageLoaded = await new Promise((resolve) => {
              img.onload = () => resolve(true);
              img.onerror = () => resolve(false);
              img.src = imageUrl;
              setTimeout(() => resolve(false), 1000); // Reduced to 1s for faster processing
            });
            
            if (imageLoaded && img.complete && img.naturalWidth > 0 && img.naturalHeight > 0) {
              const canvas = document.createElement('canvas');
              canvas.width = img.naturalWidth;
              canvas.height = img.naturalHeight;
              const ctx = canvas.getContext('2d');
              ctx.drawImage(img, 0, 0);
              
              const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
              let format = 'JPEG';
              if (imageUrl.toLowerCase().endsWith('.png')) {
                const pngDataUrl = canvas.toDataURL('image/png');
                format = 'PNG';
                doc.addImage(pngDataUrl, format, imageX, imageY, imageWidth, imageSize);
              } else {
                doc.addImage(dataUrl, format, imageX, imageY, imageWidth, imageSize);
              }
              
              imagesLoaded++;
              imageY += imageSize + imageSpacing;
            }
          } catch (error) {
            console.error(`Failed to load image ${imageUrl}:`, error);
          }
        }
        imagesEndY = imageY;
        rightSideTextStartY = imageY + 5;
      }

      if (imagesLoaded === 0 && imgs.length === 0) {
        rightSideTextStartY = margin + 10;
      }

      // Render data columns
      doc.setFontSize(10);
      let dataY = yPos;

      allColumns.forEach(columnName => {
        if (columnName === 'IMAGES') {
          return;
        }
        
        const value = getColumnValue(row, columnName);
        const displayValue = value || 'N/A';
        const lineHeight = 5;
        const isFullNarrative = columnName === 'FULL NARATIVE';
        
        if (dataY + lineHeight > pageHeight - bottomMargin) {
          doc.addPage();
          currentPageNumber++;
          dataY = margin;
        }
        
        if (isFullNarrative) {
          doc.setFont(undefined, 'bold');
          doc.setTextColor(0, 0, 0);
          const columnNameText = `${columnName}:`;
          doc.text(columnNameText, margin, dataY);
          dataY += lineHeight;
          
          doc.setFont(undefined, 'normal');
          doc.setTextColor(44, 62, 80);
          
          let remainingText = displayValue;
          const valueX = margin + 5;
          
          while (remainingText && remainingText.trim().length > 0) {
            const isOnFirstPage = currentPageNumber === imagesPageNumber;
            const isPastImageArea = isOnFirstPage && dataY >= imagesEndY;
            const useFullWidth = imagesLoaded === 0 || !isOnFirstPage || isPastImageArea;
            const availableWidth = useFullWidth ? (pageWidth - (margin * 2) - 5) : (leftWidth - 5);
            
            if (dataY + lineHeight > pageHeight - bottomMargin) {
              doc.addPage();
              currentPageNumber++;
              dataY = margin;
              const availableWidthNewPage = pageWidth - (margin * 2) - 5;
              const valueLinesNewPage = doc.splitTextToSize(remainingText, availableWidthNewPage);
              
              for (let j = 0; j < valueLinesNewPage.length; j++) {
                if (dataY + lineHeight > pageHeight - bottomMargin) {
                  doc.addPage();
                  currentPageNumber++;
                  dataY = margin;
                }
                doc.text(valueLinesNewPage[j], valueX, dataY);
                dataY += lineHeight;
              }
              break;
            }
            
            const valueLines = doc.splitTextToSize(remainingText, availableWidth);
            
            if (valueLines.length === 0) {
              break;
            }
            
            let needRecalculate = false;
            let newRemainingText = '';
            
            for (let i = 0; i < valueLines.length; i++) {
              if (dataY + lineHeight > pageHeight - bottomMargin) {
                doc.addPage();
                currentPageNumber++;
                dataY = margin;
                newRemainingText = valueLines.slice(i).join(' ');
                needRecalculate = true;
                break;
              }
              
              if (isOnFirstPage && imagesLoaded > 0 && dataY >= imagesEndY && i < valueLines.length - 1) {
                doc.text(valueLines[i], valueX, dataY);
                dataY += lineHeight;
                newRemainingText = valueLines.slice(i + 1).join(' ');
                needRecalculate = true;
                break;
              }
              
              doc.text(valueLines[i], valueX, dataY);
              dataY += lineHeight;
            }
            
            if (needRecalculate) {
              remainingText = newRemainingText;
              continue;
            }
            
            break;
          }
        } else {
          doc.setFont(undefined, 'bold');
          doc.setTextColor(0, 0, 0);
          const columnNameText = `${columnName}:`;
          const spaceWidth = doc.getTextWidth(' ');
          const columnNameWidth = doc.getTextWidth(columnNameText);
          
          const isOnFirstPage = currentPageNumber === imagesPageNumber;
          const isPastImageArea = isOnFirstPage && dataY >= imagesEndY;
          const useFullWidth = imagesLoaded === 0 || !isOnFirstPage || isPastImageArea;
          const totalAvailableWidth = useFullWidth ? (pageWidth - (margin * 2)) : leftWidth;
          const valueWidth = totalAvailableWidth - columnNameWidth - spaceWidth;
          const valueX = margin + columnNameWidth + spaceWidth;
          
          doc.setFont(undefined, 'normal');
          doc.setTextColor(44, 62, 80);
          const valueLines = doc.splitTextToSize(displayValue, valueWidth);
          
          if (valueLines.length > 0) {
            doc.setFont(undefined, 'bold');
            doc.setTextColor(0, 0, 0);
            doc.text(columnNameText, margin, dataY);
            
            doc.setFont(undefined, 'normal');
            doc.setTextColor(44, 62, 80);
            doc.text(valueLines[0], valueX, dataY);
            dataY += lineHeight;
            
            for (let i = 1; i < valueLines.length; i++) {
              if (dataY + lineHeight > pageHeight - bottomMargin) {
                doc.addPage();
                currentPageNumber++;
                dataY = margin;
                const availableWidthNewPage = pageWidth - (margin * 2);
                const remainingText = valueLines.slice(i).join(' ');
                const valueLinesNewPage = doc.splitTextToSize(remainingText, availableWidthNewPage);
                
                for (let j = 0; j < valueLinesNewPage.length; j++) {
                  if (dataY + lineHeight > pageHeight - bottomMargin) {
                    doc.addPage();
                    currentPageNumber++;
                    dataY = margin;
                  }
                  doc.text(valueLinesNewPage[j], margin, dataY);
                  dataY += lineHeight;
                }
                break;
              }
              
              const isOnFirstPageForLine = currentPageNumber === imagesPageNumber;
              const isPastImageAreaForLine = isOnFirstPageForLine && dataY >= imagesEndY;
              const useFullWidthForLine = imagesLoaded === 0 || !isOnFirstPageForLine || isPastImageAreaForLine;
              const availableWidthForLine = useFullWidthForLine ? (pageWidth - (margin * 2)) : leftWidth;
              
              if (useFullWidthForLine !== useFullWidth && i < valueLines.length - 1) {
                const remainingText = valueLines.slice(i).join(' ');
                const valueLinesRecalc = doc.splitTextToSize(remainingText, availableWidthForLine);
                
                for (let j = 0; j < valueLinesRecalc.length; j++) {
                  if (dataY + lineHeight > pageHeight - bottomMargin) {
                    doc.addPage();
                    currentPageNumber++;
                    dataY = margin;
                  }
                  doc.text(valueLinesRecalc[j], margin, dataY);
                  dataY += lineHeight;
                }
                break;
              }
              
              doc.text(valueLines[i], valueX, dataY);
              dataY += lineHeight;
            }
          } else {
            doc.setFont(undefined, 'bold');
            doc.setTextColor(0, 0, 0);
            doc.text(columnNameText, margin, dataY);
            dataY += lineHeight;
          }
        }
        
        dataY += 2;
      });

      // Add spacing before next apple
      if (appleIndex < rows.length - 1) {
        if (dataY + 20 > pageHeight - bottomMargin) {
          doc.addPage();
        } else {
          dataY += 20;
        }
      }
    }

    // Download the single PDF
    console.log("PDF(All): Generating PDF blob...");
    const pdfBlob = doc.output('blob');
    console.log("PDF(All): PDF blob created, size:", (pdfBlob.size / 1024 / 1024).toFixed(2), "MB");
    
    // Use a more reliable download method
    const url = window.URL.createObjectURL(pdfBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `appleverse_all_${rows.length}_apples.pdf`;
    link.style.display = 'none';
    document.body.appendChild(link);
    console.log("PDF(All): Triggering download...");
    
    // Use setTimeout to ensure the link is ready
    setTimeout(() => {
      link.click();
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);
    }, 100);

    const successMsg = `Downloaded PDF with all ${rows.length} apples.`;
    console.log("PDF(All):", successMsg);
    if (setErrorMessage) {
      setErrorMessage(successMsg);
      setTimeout(() => setErrorMessage(null), 5000);
    } else {
      alert(successMsg);
    }
  } catch (error) {
    console.error("PDF(All) export error:", error);
    console.error("PDF(All) error stack:", error.stack);
    const errorMsg = `Failed to generate PDF(All): ${error.message || 'Unknown error'}`;
    if (setErrorMessage) {
      setErrorMessage(errorMsg);
      setTimeout(() => setErrorMessage(null), 5000);
    } else {
      alert(errorMsg);
    }
  }
}