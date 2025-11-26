import React, { useEffect, useMemo, useRef, useState, useDeferredValue } from "react";
import FilterSidebar from "../components/FilterSidebar";
import SearchBar from "../components/SearchBar";
import { ChevronDown, Trash2, X, ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import "../styles/LibraryV2.css";

// OPTIMIZED: AppleImage component WITHOUT individual API calls
const AppleImage = ({ imageUrl, accession, title, apiBase }) => {
  const [currentSrc, setCurrentSrc] = useState(null);
  const [errorCount, setErrorCount] = useState(0);
  const [showPlaceholder, setShowPlaceholder] = useState(false);
  
  // Generate fallback URLs based on accession and title
  const getFallbackUrls = (acc, titleName) => {
    if (!acc) return [];
    const accUpper = acc.toUpperCase();
    const accLower = acc.toLowerCase();
    const cleanTitle = titleName ? titleName.replace(/[^a-zA-Z0-9\s]/g, '').trim() : '';
    
    const urls = [];
    
    if (cleanTitle) {
      const titleWords = cleanTitle.split(/\s+/).filter(w => w.length > 2);
      if (titleWords.length > 0) {
        urls.push(`${apiBase}/images/${titleWords[0]} ${accUpper}.jpg`);
        urls.push(`${apiBase}/images/${titleWords[0]} ${accUpper}.JPG`);
        urls.push(`${apiBase}/images/${titleWords[0]} ${accUpper}.png`);
        urls.push(`${apiBase}/images/${titleWords[0]} ${accUpper}.PNG`);
      }
      if (titleWords.length > 1) {
        urls.push(`${apiBase}/images/${titleWords[0]} ${titleWords[1]} ${accUpper}.jpg`);
        urls.push(`${apiBase}/images/${titleWords[0]} ${titleWords[1]} ${accUpper}.JPG`);
      }
    }
    
    const accNumber = accUpper.match(/MAL(\d+)/);
    if (accNumber) {
      urls.push(`${apiBase}/images/${accNumber[1]} ${accUpper}.jpg`);
      urls.push(`${apiBase}/images/${accNumber[1]} ${accUpper}.JPG`);
    }
    
    urls.push(`${apiBase}/images/${accUpper}.jpg`);
    urls.push(`${apiBase}/images/${accUpper}.JPG`);
    urls.push(`${apiBase}/images/${accUpper}.png`);
    urls.push(`${apiBase}/images/${accUpper}.PNG`);
    urls.push(`${apiBase}/images/${accLower}.jpg`);
    urls.push(`${apiBase}/images/${accLower}.png`);
    urls.push(`${apiBase}/images/${accUpper}-2.jpg`);
    urls.push(`${apiBase}/images/${accUpper}-2.JPG`);
    
    return urls;
  };
  
  const fallbacks = useMemo(() => getFallbackUrls(accession, title), [accession, title, apiBase]);
  const allUrls = useMemo(() => imageUrl ? [imageUrl, ...fallbacks] : fallbacks, [imageUrl, fallbacks]);
  
  useEffect(() => {
    const initialSrc = allUrls.length > 0 ? allUrls[0] : null;
    setCurrentSrc(initialSrc);
    setErrorCount(0);
    setShowPlaceholder(!initialSrc);
  }, [imageUrl, accession, allUrls]);
  
  const handleError = () => {
    if (allUrls.length > 0 && errorCount < allUrls.length - 1) {
      const nextIndex = errorCount + 1;
      setErrorCount(nextIndex);
      setCurrentSrc(allUrls[nextIndex]);
    } else {
      setShowPlaceholder(true);
    }
  };
  
  const handleLoad = () => {
    setShowPlaceholder(false);
  };
  
  if (!currentSrc || showPlaceholder) {
  return (
    <img 
      src={`${apiBase}/images/sadapple.png`}
      alt="No image available" 
      loading="lazy"
      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
      onError={(e) => {
        // If sadapple.jpg also fails, show text fallback
        e.target.style.display = 'none';
        e.target.parentElement.innerHTML = '<div class="av-noimg" style="display: flex; align-items: center; justify-content: center; height: 100%; background: #f3f4f6; color: #6b7280;">No Image</div>';
      }}
    />
  );
}
  
  return (
    <img 
      key={currentSrc}
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
  const columnOrder = [
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

  const navigate = useNavigate();
  const [apples, setApples] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("table");
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [filters, setFilters] = useState({
    acno: "", accession: "", country: "", province: "", city: "", pedigree: "", taxon: ""
  });
  const [sortBy, setSortBy] = useState({ field: "", order: "" });
  const [selectedRecords, setSelectedRecords] = useState(new Set());
  const [showDownloadDropdown, setShowDownloadDropdown] = useState(false);
  const downloadDropdownRef = useRef(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [showSuggest, setShowSuggest] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const searchBoxRef = useRef(null);
  const inputRef = useRef(null);
  const manuallyClosedRef = useRef(false);
  const allDataRef = useRef([]);

  // OPTIMIZATION: Pagination state
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
    hasMore: false,
    hasLess: false
  });

  // OPTIMIZATION: Batch image loading state
  const [imagesLoaded, setImagesLoaded] = useState(false);

  const getRecordId = (record, index) => {
    if (record._id) return record._id;
    if (record.id) return record.id;
    const acno = record.acno ?? "";
    const accession = record.accession ?? "";
    if (acno || accession) return `${acno}_${accession}`;
    return `record_${index}`;
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 100);
    return () => clearTimeout(timer);
  }, [query]);

  const isAccessionMode = useMemo(() => /^mal/i.test(query.trim()), [query]);

  const normalizeColumnName = (name) => {
    return String(name || '').toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
  };

  const getFieldValueForSearch = (record, excelColumnName) => {
    if (record.metadata) {
      const metadataValue = record.metadata[excelColumnName];
      if (metadataValue !== undefined && metadataValue !== null && metadataValue !== '') {
        return metadataValue;
      }
      const trimmedColumnName = excelColumnName.trim();
      if (trimmedColumnName !== excelColumnName) {
        const trimmedValue = record.metadata[trimmedColumnName];
        if (trimmedValue !== undefined && trimmedValue !== null && trimmedValue !== '') {
          return trimmedValue;
        }
      }
    }
    const directValue = record[excelColumnName];
    if (directValue !== undefined && directValue !== null && directValue !== '') {
      return directValue;
    }
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

  const deferredQuery = useDeferredValue(query);
  
  const suggestions = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();
    if (!q || q.length < 1) return [];

    const dataSource = allDataRef.current.length > 0 ? allDataRef.current : apples;
    if (!dataSource || dataSource.length === 0) return [];
    
    const maxRecordsToSearch = Math.min(500, dataSource.length);
    const searchColumns = ['ACCESSION', 'CULTIVAR NAME', 'FRUITLGTH 115156', 'FRUITWIDTH 115157', 'NARATIVEKEYWORD', 'TAXON'];
    const seen = new Set();
    const filtered = [];
    const maxResults = 10;
    const qLength = q.length;
    
    const getFieldValue = (record, columnName) => {
      if (record.metadata) {
        const metadataValue = record.metadata[columnName] || record.metadata[columnName.trim()];
        if (metadataValue !== undefined && metadataValue !== null && metadataValue !== '') {
          return String(metadataValue).trim();
        }
      }
      if (record[columnName] !== undefined && record[columnName] !== null && record[columnName] !== '') {
        return String(record[columnName]).trim();
      }
      if (columnName === 'TAXON') {
        if (record.taxon !== undefined && record.taxon !== null && record.taxon !== '') {
          return String(record.taxon).trim();
        }
      }
      return null;
    };
    
    outerLoop: for (let i = 0; i < maxRecordsToSearch && filtered.length < maxResults; i++) {
      const record = dataSource[i];
      for (let j = 0; j < searchColumns.length && filtered.length < maxResults; j++) {
        const column = searchColumns[j];
        const value = getFieldValue(record, column);
        if (value && value.length >= qLength) {
          const lower = value.toLowerCase();
          if (lower.includes(q)) {
            if (!seen.has(lower)) {
              seen.add(lower);
              filtered.push(value);
              if (filtered.length >= maxResults) break outerLoop;
            }
          }
        }
      }
    }
    return filtered.sort();
  }, [deferredQuery, apples]);

  const findMatchingField = (excelCol, record) => {
    if (record[excelCol] !== undefined && record[excelCol] !== null && record[excelCol] !== '') {
      return excelCol;
    }
    if (record.metadata && record.metadata[excelCol] !== undefined && record.metadata[excelCol] !== null && record.metadata[excelCol] !== '') {
      return excelCol;
    }
    const normalizedExcel = normalizeColumnName(excelCol);
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
    };
    if (fieldMappings[excelCol]) {
      for (const variation of fieldMappings[excelCol]) {
        if (record[variation] !== undefined && record[variation] !== null && record[variation] !== '') {
          return variation;
        }
        if (record.metadata && record.metadata[variation] !== undefined && record.metadata[variation] !== null && record.metadata[variation] !== '') {
          return variation;
        }
      }
    }
    if (record.metadata) {
      if (record.metadata[excelCol] !== undefined) {
        return excelCol;
      }
      for (const key of Object.keys(record.metadata)) {
        if (normalizeColumnName(key) === normalizedExcel) {
          return key;
        }
      }
    }
    return excelCol;
  };

  const getAllColumns = useMemo(() => {
    return columnOrder;
  }, []);

  const getFieldValue = (record, excelColumnName) => {
    const dbField = findMatchingField(excelColumnName, record);
    if (dbField && dbField !== excelColumnName) {
      if (record[dbField] !== undefined && record[dbField] !== null && record[dbField] !== '') {
        return record[dbField];
      }
      if (record.metadata && record.metadata[dbField] !== undefined && record.metadata[dbField] !== null && record.metadata[dbField] !== '') {
        return record.metadata[dbField];
      }
    }
    if (record[excelColumnName] !== undefined && record[excelColumnName] !== null && record[excelColumnName] !== '') {
      return record[excelColumnName];
    }
    if (record.metadata && record.metadata[excelColumnName] !== undefined && record.metadata[excelColumnName] !== null && record.metadata[excelColumnName] !== '') {
      return record.metadata[excelColumnName];
    }
    const trimmedColumnName = excelColumnName.trim();
    if (trimmedColumnName !== excelColumnName) {
      if (record.metadata && record.metadata[trimmedColumnName] !== undefined && record.metadata[trimmedColumnName] !== null && record.metadata[trimmedColumnName] !== '') {
        return record.metadata[trimmedColumnName];
      }
    }
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

  const renderCell = (value, columnName) => {
    const text = value === null || value === undefined ? "" : String(value);
    const longTextColumns = ["CMT", "NARATIVEKEYWORD", "FULL NARATIVE", "COOPERATOR", "PEDIGREE DESCRIPTION", "COOPERATOR_NEW", "AVAILABILITY STATUS "];
    const shouldTruncate = longTextColumns.includes(columnName);
    const centerAlignedColumns = ["ACNO"];
    const shouldCenterAlign = centerAlignedColumns.includes(columnName);
    const maxLength = 50;
    const displayText = shouldTruncate && text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
    
    return (
      <td
        key={columnName}
        className="av-td"
        data-full-text={text}
        title={shouldTruncate && text.length > maxLength ? text : text}
        style={{
          maxWidth: shouldTruncate ? '180px' : undefined,
          minWidth: shouldTruncate ? '120px' : undefined,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          textAlign: shouldCenterAlign ? 'center' : 'left'
        }}
      >
        {displayText}
      </td>
    );
  };

  // OPTIMIZATION: Fetch data with pagination
  const fetchData = async (searchTerm = "", page = 1) => {
    try {
      setLoading(true);
      const url = `${API_BASE}/api/apples?page=${page}&limit=50${searchTerm ? `&search=${encodeURIComponent(searchTerm)}` : ''}`;
      console.log("🔍 Fetching data from:", url);

      const res = await fetch(url, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      }).catch(err => {
        console.error("❌ Network error:", err);
        throw new Error(`Cannot connect to backend server at ${API_BASE}`);
      });

      console.log("📡 Response status:", res.status, res.statusText);

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      console.log("📦 Data received:", data);

      // Handle both old and new response formats
      let newApples = [];
      let paginationData = {};
      
      if (Array.isArray(data)) {
        // Old format: direct array
        console.log("⚠️ Old format detected - using direct array");
        newApples = data;
        paginationData = {
          page: 1,
          limit: data.length,
          total: data.length,
          totalPages: 1,
          hasMore: false,
          hasLess: false
        };
      } else if (data.apples) {
        // New format: { apples: [], pagination: {} }
        console.log("✅ New format detected - using pagination");
        newApples = data.apples || [];
        paginationData = data.pagination || {
          page: 1,
          limit: 50,
          total: newApples.length,
          totalPages: 1,
          hasMore: false,
          hasLess: false
        };
      } else {
        console.error("❌ Unexpected response format:", data);
        newApples = [];
        paginationData = {
          page: 1,
          limit: 50,
          total: 0,
          totalPages: 0,
          hasMore: false,
          hasLess: false
        };
      }
      
      console.log("✅ Setting apples state:", newApples.length, "records");
      
      if (newApples.length > 0) {
        const firstRecord = newApples[0];
        const firstCultivar = firstRecord.cultivar_name || firstRecord['CULTIVAR NAME'] || 'Unknown';
        console.log("📋 First record in response:", firstCultivar);
      }

      setApples(newApples || []);
      setPagination({
        page: paginationData.page || 1,
        limit: paginationData.limit || 50,
        total: paginationData.total || 0,
        totalPages: paginationData.totalPages || 1,
        hasMore: paginationData.hasMore || false,
        hasLess: paginationData.hasLess || false
      });

      // Cache full dataset only on initial load (page 1, no search)
      if (page === 1 && !searchTerm) {
        allDataRef.current = newApples;
      }

      // OPTIMIZATION: Batch load images for apples without images
      if (!imagesLoaded && newApples.length > 0) {
        fetchMissingImages(newApples);
      }

    } catch (e) {
      console.error("❌ Failed to load apples:", e);
      setApples([]);
      setErrorMessage(e.message || "Failed to fetch data");
      setTimeout(() => setErrorMessage(null), 5000);
    } finally {
      setLoading(false);
    }
  };

  // OPTIMIZATION: Batch fetch missing images
  const fetchMissingImages = async (applesData) => {
    try {
      console.log("🖼️ Checking for missing images...");
      
      // Get accessions for apples that have no images in database
      const missingImageAccessions = applesData
        .filter(a => !a.images || a.images.length === 0)
        .map(a => a.accession || a.ACCESSION)
        .filter(Boolean);
      
      if (missingImageAccessions.length === 0) {
        console.log("✅ All apples have images in database");
        setImagesLoaded(true);
        return;
      }
      
      console.log(`🔍 Fetching images for ${missingImageAccessions.length} apples...`);
      
      const response = await fetch(`${API_BASE}/api/apples/find-images-batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessions: missingImageAccessions })
      });
      
      const data = await response.json();
      
      if (data.success && data.results) {
        console.log(`✅ Found images for ${data.found}/${data.total} apples`);
        
        // Update apples with found images
        setApples(prevApples => 
          prevApples.map(apple => {
            const accession = apple.accession || apple.ACCESSION;
            if (data.results[accession]) {
              return { ...apple, images: data.results[accession] };
            }
            return apple;
          })
        );
        
        // Update cached data too
        if (allDataRef.current.length > 0) {
          allDataRef.current = allDataRef.current.map(apple => {
            const accession = apple.accession || apple.ACCESSION;
            if (data.results[accession]) {
              return { ...apple, images: data.results[accession] };
            }
            return apple;
          });
        }
      }
      
      setImagesLoaded(true);
    } catch (error) {
      console.error("❌ Error fetching missing images:", error);
      setImagesLoaded(true); // Don't block on error
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    setActiveIndex(-1);
    manuallyClosedRef.current = false;
    
    if (!query.trim()) {
      setShowSuggest(false);
      // Don't automatically reset data - let user explicitly clear
      return;
    }
    
    if (manuallyClosedRef.current) {
      manuallyClosedRef.current = false;
      return;
    }
    const shouldShow = Boolean(query.trim() && suggestions.length > 0);
    setShowSuggest(shouldShow);
  }, [query, suggestions]);

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

  const runSearch = async (term) => {
    manuallyClosedRef.current = true;
    setShowSuggest(false);
    
    // If term is empty, reset to original data
    if (!term || !term.trim()) {
      setQuery("");
      await fetchData("", 1);
      return;
    }
    
    // Call API with search term
    await fetchData(term.trim(), 1);
  };

  const handleClearSearch = async () => {
    setQuery("");
    setShowSuggest(false);
    await fetchData("", 1);
  };

  const handlePick = async (value) => {
    manuallyClosedRef.current = true;
    setQuery(value);
    setShowSuggest(false);
    setActiveIndex(-1);
    inputRef.current?.blur();
    
    // Call API with selected value
    if (value && value.trim()) {
      await fetchData(value.trim(), 1);
    } else {
      await fetchData("", 1);
    }
  };

  const onInputChange = (e) => {
    setQuery(e.target.value);
  };

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

  // Track if we did a server-side search (to avoid double-filtering)
  const [serverSearchActive, setServerSearchActive] = useState(false);

  // OPTIMIZATION: Client-side filtering with proper field access
  const filtered = useMemo(() => {
    if (!apples || apples.length === 0) {
      return [];
    }

    const getField = (row, fieldNames) => {
      for (const field of fieldNames) {
        // Check direct field first
        let value = row?.[field];
        if (value !== undefined && value !== null && value !== '') {
          return String(value).trim();
        }
        // Check metadata field - handle both Map and plain Object
        if (row?.metadata) {
          // If metadata is a Map (has .get method)
          if (typeof row.metadata.get === 'function') {
            value = row.metadata.get(field);
          } else {
            // Plain object
            value = row.metadata[field];
          }
          if (value !== undefined && value !== null && value !== '') {
            return String(value).trim();
          }
        }
      }
      return '';
    };

    // Only apply sidebar filters, NOT search query (server already filtered by query)
    const filteredData = apples.filter((row) => {
      // Get values for comparison - using ACTUAL field names from data
      const rowAcno = getField(row, ['acno', 'ACNO']);
      const rowAccession = getField(row, ['accession', 'ACCESSION']);
      const rowCountry = getField(row, ['e_origin_country', 'country', 'COUNTRY']);
      const rowProvince = getField(row, ['e_origin_province', 'province_state', 'PROVINCE/STATE']);
      const rowPedigree = getField(row, ['pedigree_description', 'e_pedigree', 'PEDIGREE DESCRIPTION']);
      const rowTaxon = getField(row, ['taxon', 'TAXON']);

      const match =
        (!filters.acno || filters.acno === "" || rowAcno === filters.acno) &&
        (!filters.accession || filters.accession === "" || rowAccession === filters.accession) &&
        (!filters.country || filters.country === "" || rowCountry === filters.country) &&
        (!filters.province || filters.province === "" || rowProvince === filters.province) &&
        (!filters.pedigree || filters.pedigree === "" || rowPedigree === filters.pedigree) &&
        (!filters.taxon || filters.taxon === "" || rowTaxon === filters.taxon);

      return match;
    });

    let sortedData = [...filteredData];
    if (sortBy.field && sortBy.order) {
      sortedData.sort((a, b) => {
        if (sortBy.order === "latest") {
          const getTimestamp = (record) => {
            if (record.createdAt) return new Date(record.createdAt).getTime();
            if (record.updatedAt) return new Date(record.updatedAt).getTime();
            return record.excelRowIndex || 0;
          };
          const timeA = getTimestamp(a);
          const timeB = getTimestamp(b);
          return timeB - timeA;
        } else {
          let getFieldVal;
          if (sortBy.field === "ACCESSION") {
            getFieldVal = (record) => getField(record, ['ACCESSION', 'accession']) || '';
          } else if (sortBy.field === "CULTIVAR NAME") {
            getFieldVal = (record) => getField(record, ['CULTIVAR NAME', 'cultivar_name', 'cultivar', 'name']) || '';
          } else {
            return 0;
          }
          
          const valueA = getFieldVal(a).toLowerCase();
          const valueB = getFieldVal(b).toLowerCase();
          
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
  }, [apples, filters, sortBy]);

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

    if (deletedIds.size > 0) {
      setApples(prev => prev.filter(record => {
        const recordId = record._id || record.id;
        return !deletedIds.has(recordId);
      }));

      if (allDataRef.current.length > 0) {
        allDataRef.current = allDataRef.current.filter(record => {
          const recordId = record._id || record.id;
          return !deletedIds.has(recordId);
        });
      }
    }

    setSelectedRecords(new Set());

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

  const handleDeleteRecord = async (recordId) => {
    const adminToken = localStorage.getItem('adminToken');
    if (!adminToken) {
      alert('Admin authentication required to delete records. Please log in as admin.');
      return;
    }

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

  // OPTIMIZATION: Pagination handlers
  const handleNextPage = () => {
    if (pagination.hasMore) {
      fetchData(query, pagination.page + 1);
    }
  };

  const handlePrevPage = () => {
    if (pagination.hasLess) {
      fetchData(query, pagination.page - 1);
    }
  };

  // Long text columns for truncation
  const longTextColumns = ["CMT", "NARATIVEKEYWORD", "FULL NARATIVE", "COOPERATOR", "PEDIGREE DESCRIPTION", "COOPERATOR_NEW", "AVAILABILITY STATUS "];

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
                        zIndex: 9999,
                        minWidth: '220px',
                        overflow: 'hidden'
                      }}>
                        {/* CSV Export */}
                        <button
                          onClick={() => {
                            const dataToExport = filtered.length > 0 ? filtered : apples;
                            exportCSV(dataToExport, selectedRecords.size > 0 ? selectedRecords : null, setErrorMessage, getRecordId);
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
                          <div style={{ fontWeight: '500' }}>CSV (Data Only)</div>
                          <div style={{ fontSize: '11px', color: '#6b7280' }}>Export selected as spreadsheet</div>
                        </button>
                        
                        {/* PDF Combined */}
                        <button
                          onClick={async () => {
                            setShowDownloadDropdown(false);
                            const selectedCount = selectedRecords.size;
                            
                            if (selectedCount === 0) {
                              setErrorMessage("To download PDF, select apples using checkboxes first");
                              setTimeout(() => setErrorMessage(null), 5000);
                              return;
                            }
                            
                            const dataToExport = filtered.length > 0 ? filtered : apples;
                            setErrorMessage(`Generating combined PDF for ${selectedCount} apple(s)... Please wait.`);
                            
                            try {
                              await exportPDF(dataToExport, selectedRecords, API_BASE, setErrorMessage, getRecordId);
                            } catch (error) {
                              console.error("PDF error:", error);
                              setErrorMessage("Failed to generate PDF. Check console for details.");
                              setTimeout(() => setErrorMessage(null), 5000);
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
                          <div style={{ fontWeight: '500' }}>PDF (Combined)</div>
                          <div style={{ fontSize: '11px', color: '#6b7280' }}>All selected in one PDF with images</div>
                        </button>
                        
                        {/* PDF Separate (ZIP) */}
                        <button
                          onClick={async () => {
                            setShowDownloadDropdown(false);
                            const selectedCount = selectedRecords.size;
                            
                            if (selectedCount === 0) {
                              setErrorMessage("To download PDFs, select apples using checkboxes first");
                              setTimeout(() => setErrorMessage(null), 5000);
                              return;
                            }
                            
                            // Get selected rows from filtered data
                            const dataToExport = filtered.length > 0 ? filtered : apples;
                            const selectedRows = dataToExport.filter((row, index) => {
                              const recordId = getRecordId(row, index);
                              return selectedRecords.has(recordId);
                            });
                            
                            setErrorMessage(`Generating ${selectedRows.length} separate PDFs... Please wait.`);
                            
                            try {
                              await exportPDFAll(selectedRows, API_BASE, setErrorMessage);
                            } catch (error) {
                              console.error("PDF(All) error:", error);
                              setErrorMessage("Failed to generate PDFs. Check console for details.");
                              setTimeout(() => setErrorMessage(null), 5000);
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
                          <div style={{ fontWeight: '500' }}>PDF (Separate ZIP)</div>
                          <div style={{ fontSize: '11px', color: '#6b7280' }}>Each apple as its own PDF in ZIP</div>
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
                {/* Pagination controls */}
                <div style={{ 
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px 12px', 
                  backgroundColor: '#f8fafc', 
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#1e293b',
                  flexShrink: 0
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span>
                      Showing {filtered.length} of {pagination.total} records | Page {pagination.page} of {pagination.totalPages}
                    </span>
                    {query && (
                      <span style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '8px',
                        backgroundColor: '#dbeafe',
                        color: '#1e40af',
                        padding: '4px 12px',
                        borderRadius: '16px',
                        fontSize: '13px'
                      }}>
                        Search: "{query}"
                        <button
                          onClick={handleClearSearch}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '0',
                            display: 'flex',
                            alignItems: 'center'
                          }}
                          title="Clear search"
                        >
                          <X size={14} />
                        </button>
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <button
                      onClick={handlePrevPage}
                      disabled={!pagination.hasLess}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '6px 12px',
                        backgroundColor: pagination.hasLess ? '#667eea' : '#cbd5e1',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: pagination.hasLess ? 'pointer' : 'not-allowed',
                        fontSize: '13px',
                        fontWeight: '500'
                      }}
                    >
                      <ChevronLeft size={16} />
                      Previous
                    </button>
                    <button
                      onClick={handleNextPage}
                      disabled={!pagination.hasMore}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '6px 12px',
                        backgroundColor: pagination.hasMore ? '#667eea' : '#cbd5e1',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: pagination.hasMore ? 'pointer' : 'not-allowed',
                        fontSize: '13px',
                        fontWeight: '500'
                      }}
                    >
                      Next
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
                
                {/* Simple scrollable table (no react-window) */}
                <div className="av-table-card" style={{ flex: 1, minHeight: 0, overflow: 'auto', maxHeight: '600px' }}>
                  <table className="av-table" style={{ minWidth: '100%', tableLayout: 'auto' }}>
                    <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                      <tr>
                        <th style={{ width: '60px', textAlign: 'center', backgroundColor: '#0f172a', padding: '12px 4px' }}>
                          <input
                            type="checkbox"
                            checked={isAllSelected}
                            ref={input => {
                              if (input) input.indeterminate = isIndeterminate;
                            }}
                            onChange={handleSelectAll}
                            title="Select All"
                          />
                        </th>
                        {getAllColumns.map((excelCol) => {
                          const shouldConstrain = longTextColumns.includes(excelCol);
                          const centerAlignedColumns = ["ACNO"];
                          const shouldCenterAlign = centerAlignedColumns.includes(excelCol);
                          
                          return (
                            <th 
                              key={excelCol} 
                              style={{ 
                                minWidth: '120px',
                                maxWidth: shouldConstrain ? '180px' : undefined,
                                whiteSpace: 'nowrap',
                                padding: '12px 10px',
                                fontSize: '12px',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                textAlign: shouldCenterAlign ? 'center' : 'left',
                                backgroundColor: '#0f172a',
                                color: 'white'
                              }}
                            >
                              {excelCol}
                            </th>
                          );
                        })}
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((a, index) => {
                        const recordId = getRecordId(a, index);
                        const isSelected = selectedRecords.has(recordId);
                        
                        return (
                          <tr 
                            key={recordId}
                            style={{ 
                              backgroundColor: isSelected ? 'rgba(0, 123, 255, 0.1)' : (index % 2 === 0 ? '#fff' : '#f9fafb'),
                              cursor: 'pointer' 
                            }}
                            onClick={(e) => {
                              if (e.target.closest('input[type="checkbox"]') || e.target.closest('[data-icon="trash"]')) {
                                return;
                              }
                              navigate(`/apple-detail/${recordId}`, { state: { apple: a } });
                            }}
                          >
                            <td style={{ textAlign: 'center', padding: '10px 4px' }} onClick={(e) => e.stopPropagation()}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => handleSelectRecord(recordId)}
                                  style={{ cursor: 'pointer' }}
                                />
                                <Trash2 
                                  size={16} 
                                  style={{ color: '#dc3545', cursor: 'pointer' }} 
                                  data-icon="trash" 
                                  onClick={() => handleDeleteRecord(recordId)} 
                                />
                              </div>
                            </td>
                            {getAllColumns.map((col) => renderCell(getFieldValue(a, col), col))}
                          </tr>
                        );
                      })}
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
                        const title = getFieldValue(a, 'CULTIVAR NAME') || (a.cultivar_name ?? a['CULTIVAR NAME'] ?? a.name ?? 'Unknown');
                        const acc = getFieldValue(a, 'ACCESSION') || (a.accession ?? a.ACCESSION ?? '');
                        
                        let imgs = [];
                        if (a.metadata && a.metadata['IMAGES']) {
                          const metadataImages = a.metadata['IMAGES'];
                          if (Array.isArray(metadataImages)) {
                            imgs = metadataImages;
                          } else if (typeof metadataImages === 'string') {
                            try {
                              const parsed = JSON.parse(metadataImages);
                              if (Array.isArray(parsed)) {
                                imgs = parsed;
                              }
                            } catch {
                              imgs = metadataImages.split(',').map(img => img.trim()).filter(img => img);
                            }
                          }
                        }
                        
                        if (imgs.length === 0) {
                          imgs = (a.images && Array.isArray(a.images)) ? a.images :
                                (a.Images && Array.isArray(a.Images)) ? a.Images :
                                (a.IMAGE && Array.isArray(a.IMAGE)) ? a.IMAGE :
                                (a['images'] && Array.isArray(a['images'])) ? a['images'] : [];
                        }
                        
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
                    
                    {/* Pagination for pictures view */}
                    <div style={{ 
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      gap: '12px',
                      marginTop: '24px',
                      padding: '16px'
                    }}>
                      <button
                        onClick={handlePrevPage}
                        disabled={!pagination.hasLess}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '10px 20px',
                          backgroundColor: pagination.hasLess ? '#667eea' : '#cbd5e1',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: pagination.hasLess ? 'pointer' : 'not-allowed',
                          fontSize: '14px',
                          fontWeight: '500'
                        }}
                      >
                        <ChevronLeft size={18} />
                        Previous
                      </button>
                      <span style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>
                        Page {pagination.page} of {pagination.totalPages}
                      </span>
                      <button
                        onClick={handleNextPage}
                        disabled={!pagination.hasMore}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '10px 20px',
                          backgroundColor: pagination.hasMore ? '#667eea' : '#cbd5e1',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: pagination.hasMore ? 'pointer' : 'not-allowed',
                          fontSize: '14px',
                          fontWeight: '500'
                        }}
                      >
                        Next
                        <ChevronRight size={18} />
                      </button>
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
            backgroundColor: errorMessage.includes('success') || errorMessage.includes('Downloaded') ? '#28a745' : '#dc3545',
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

// ============================================================================
// EXPORT FUNCTIONS
// ============================================================================

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

function getFieldValueForExport(record, excelColumnName) {
  if (record.metadata && record.metadata[excelColumnName] !== undefined && record.metadata[excelColumnName] !== null && record.metadata[excelColumnName] !== '') {
    return record.metadata[excelColumnName];
  }
  
  const trimmedColumnName = excelColumnName.trim();
  if (trimmedColumnName !== excelColumnName) {
    if (record.metadata && record.metadata[trimmedColumnName] !== undefined && record.metadata[trimmedColumnName] !== null && record.metadata[trimmedColumnName] !== '') {
      return record.metadata[trimmedColumnName];
    }
  }
  
  if (record[excelColumnName] !== undefined && record[excelColumnName] !== null && record[excelColumnName] !== '') {
    return record[excelColumnName];
  }
  
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

function transformRecordToExcelFormat(record, columnOrder) {
  const transformed = {};
  
  columnOrder.forEach(columnName => {
    const value = getFieldValueForExport(record, columnName);
    transformed[columnName] = value !== null && value !== undefined ? String(value) : '';
  });
  
  return transformed;
}

async function exportCSV(rows, selectedIds = null, setErrorMessage = null, getRecordIdFn = null) {
  if (!rows?.length) {
    if (setErrorMessage) {
      setErrorMessage("No rows to export.");
      setTimeout(() => setErrorMessage(null), 5000);
    }
    return;
  }

  if (!selectedIds || selectedIds.size === 0) {
    if (setErrorMessage) {
      setErrorMessage("To download, select the apples first by clicking the checkboxes");
      setTimeout(() => setErrorMessage(null), 5000);
    }
    return;
  }

  // Use provided function or fallback to direct matching
  let rowsToExport;
  if (getRecordIdFn) {
    rowsToExport = rows.filter((row, index) => {
      const recordId = getRecordIdFn(row, index);
      return selectedIds.has(recordId);
    });
  } else {
    // Fallback: Match by _id directly since that's what selectedRecords contains
    rowsToExport = rows.filter((row) => {
      if (row._id && selectedIds.has(row._id)) return true;
      if (row.id && selectedIds.has(row.id)) return true;
      
      const acno = row.acno ?? '';
      const accession = row.accession ?? '';
      if (acno || accession) {
        const compositeId = `${acno}_${accession}`;
        if (selectedIds.has(compositeId)) return true;
      }
      
      return false;
    });
  }

  console.log(`📊 CSV Export: ${rowsToExport.length} selected from ${rows.length} filtered rows`);

  if (rowsToExport.length === 0) {
    if (setErrorMessage) {
      setErrorMessage("No selected records found in current view.");
      setTimeout(() => setErrorMessage(null), 5000);
    }
    return;
  }

  const columnOrder = [
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

  const transformedRows = rowsToExport.map(record => transformRecordToExcelFormat(record, columnOrder));

  const escapeCSVValue = (value) => {
    if (value === null || value === undefined || value === '') {
      return '""';
    }
    const stringValue = String(value);
    return `"${stringValue.replace(/"/g, '""')}"`;
  };

  const csvHeader = columnOrder.map(col => escapeCSVValue(col)).join(',');
  const csvRows = transformedRows.map(row => {
    return columnOrder.map(col => escapeCSVValue(row[col] || '')).join(',');
  });
  
  const csvContent = [csvHeader, ...csvRows].join('\n');
  const BOM = '\uFEFF';
  const csvWithBOM = BOM + csvContent;
  
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
  
  if (setErrorMessage) {
    setErrorMessage(`Successfully exported ${rowsToExport.length} records to CSV`);
    setTimeout(() => setErrorMessage(null), 3000);
  }
}

async function exportPDF(rows, selectedIds = null, apiBase, setErrorMessage = null, getRecordIdFn = null) {
  if (!rows?.length || !selectedIds || selectedIds.size === 0) {
    if (setErrorMessage) {
      setErrorMessage("To download PDF, select the apples first");
      setTimeout(() => setErrorMessage(null), 5000);
    }
    return;
  }

  // Filter selected rows using provided function or fallback
  let selectedRows;
  if (getRecordIdFn) {
    selectedRows = rows.filter((row, index) => {
      const recordId = getRecordIdFn(row, index);
      return selectedIds.has(recordId);
    });
  } else {
    selectedRows = rows.filter((row) => {
      if (row._id && selectedIds.has(row._id)) return true;
      if (row.id && selectedIds.has(row.id)) return true;
      const acno = row.acno ?? '';
      const accession = row.accession ?? '';
      if (acno || accession) {
        const compositeId = `${acno}_${accession}`;
        if (selectedIds.has(compositeId)) return true;
      }
      return false;
    });
  }

  console.log(`📄 PDF Export: ${selectedRows.length} selected from ${rows.length} filtered rows`);

  if (selectedRows.length === 0) {
    if (setErrorMessage) {
      setErrorMessage("No selected records found in current view.");
      setTimeout(() => setErrorMessage(null), 5000);
    }
    return;
  }

  try {
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF();
    
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.height;
    const margin = 20;
    const lineHeight = 7;

    // Helper function to add section
    const addSection = (doc, title, data, yPos) => {
      const nonEmptyData = Object.entries(data).filter(([key, value]) => 
        value && value !== 'N/A' && value.toString().trim() !== ''
      );
      
      if (nonEmptyData.length === 0) return yPos;
      
      if (yPos > pageHeight - 40) {
        doc.addPage();
        yPos = 20;
      }
      
      doc.setFontSize(14);
      doc.setTextColor(44, 62, 80);
      doc.text(title, margin, yPos);
      yPos += lineHeight;
      
      doc.setFontSize(10);
      doc.setTextColor(85, 85, 85);
      
      nonEmptyData.forEach(([key, value]) => {
        if (yPos > pageHeight - 20) {
          doc.addPage();
          yPos = 20;
        }
        const formattedKey = key.replace(/_/g, ' ').toUpperCase();
        const text = `${formattedKey}: ${value || 'N/A'}`;
        
        const splitText = doc.splitTextToSize(text, pageWidth - 2 * margin - 10);
        splitText.forEach(line => {
          if (yPos > pageHeight - 20) {
            doc.addPage();
            yPos = 20;
          }
          doc.text(line, margin + 5, yPos);
          yPos += lineHeight;
        });
      });
      
      return yPos + 5;
    };

    // Helper to add apple data to PDF
    const addAppleToPDF = async (doc, apple, startNewPage = false) => {
      if (startNewPage) {
        doc.addPage();
      }
      
      let yPosition = 20;
      
      // Title
      doc.setFontSize(20);
      doc.setTextColor(231, 111, 81);
      doc.text(`Apple: ${apple.cultivar_name || apple.name || 'Unknown'}`, margin, yPosition);
      yPosition += 10;
      
      // Accession
      doc.setFontSize(12);
      doc.setTextColor(52, 73, 94);
      const accession = apple.accession || '';
      doc.text(`Accession: ${accession}`, margin, yPosition);
      yPosition += 8;
      
      // Line
      doc.setDrawColor(231, 111, 81);
      doc.setLineWidth(0.5);
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 10;

      // Add sections
      yPosition = addSection(doc, 'IDENTITY & INVENTORY', {
        'Accession Number': apple.acno || '',
        'Accession': accession,
        'Cultivar Name': apple.cultivar_name || '',
        'Site ID': apple.site_id || '',
        'Prefix (ACP)': apple.prefix_acp || '',
        'Label Name': apple.label_name || ''
      }, yPosition);

      yPosition = addSection(doc, 'TAXONOMY', {
        'Family': apple.family || '',
        'Genus': apple.e_genus || '',
        'Species': apple.e_species || '',
        'Taxon': apple.taxon || '',
        'Plant Type': apple.plant_type || '',
        'Life Form': apple.life_form || ''
      }, yPosition);

      yPosition = addSection(doc, 'GEOGRAPHY & ORIGIN', {
        'Country': apple.e_origin_country || apple.country || '',
        'Province/State': apple.e_origin_province || apple.province_state || '',
        'Habitat': apple.habitat || '',
        'Location 1': apple.location_section_1 || '',
        'Location 2': apple.location_section_2 || '',
        'Location 3': apple.location_section_3 || '',
        'Location 4': apple.location_section_4 || ''
      }, yPosition);

      yPosition = addSection(doc, 'PEOPLE & ORGANIZATIONS', {
        'Breeder or Collector': apple.breeder_or_collector || '',
        'Cooperator': apple.cooperator || '',
        'Cooperator New': apple.cooperator_new || ''
      }, yPosition);

      yPosition = addSection(doc, 'FRUIT CHARACTERISTICS', {
        'Fruit Shape': apple.fruitshape_115057 || '',
        'Fruit Length': apple.fruitlgth_115156 || '',
        'Fruit Width': apple.fruitwidth_115157 || '',
        'Fruit Weight': apple.frtweight_115121 || '',
        'Fruit Texture': apple.frttexture_115123 || '',
        'Colour': apple.colour || '',
        'Density': apple.density || ''
      }, yPosition);

      yPosition = addSection(doc, 'SEED CHARACTERISTICS', {
        'Seed Color': apple.seedcolor_115086 || '',
        'Seed Size': apple.ssize_quantity_of_seed || '',
        'Seed Length': apple.seedlength_115163 || '',
        'Seed Width': apple.seedwidth_115164 || '',
        'Seed Number': apple.seednumber_115087 || '',
        'Seed Shape': apple.seedshape_115167 || ''
      }, yPosition);

      yPosition = addSection(doc, 'DESCRIPTIVE INFORMATION', {
        'Comments': apple.cmt || '',
        'Narrative Keyword': apple.narativekeyword || '',
        'Pedigree Description': apple.pedigree_description || ''
      }, yPosition);

      yPosition = addSection(doc, 'STATUS & RELEASE', {
        'Availability Status': apple.availability_status || '',
        'Level of Improvement': apple.level_of_improvement || '',
        'Released Date': apple.released_date || ''
      }, yPosition);

      // Add images if available
      const images = apple.images || [];
      if (images.length > 0) {
        if (yPosition > pageHeight - 60) {
          doc.addPage();
          yPosition = 20;
        }
        
        doc.setFontSize(14);
        doc.setTextColor(44, 62, 80);
        doc.text('Images', margin, yPosition);
        yPosition += 15;

        for (let i = 0; i < Math.min(images.length, 4); i++) {
          try {
            let imgUrl = images[i];
            if (imgUrl.startsWith('/')) {
              imgUrl = `${apiBase}${imgUrl}`;
            }

            // Load image
            const img = new Image();
            img.crossOrigin = 'anonymous';
            
            await new Promise((resolve, reject) => {
              img.onload = resolve;
              img.onerror = reject;
              img.src = imgUrl;
            });

            const maxWidth = (pageWidth - 2 * margin - 10) / 2;
            const maxHeight = 80;
            
            let imgWidth = img.width;
            let imgHeight = img.height;
            
            if (imgWidth > maxWidth) {
              const ratio = maxWidth / imgWidth;
              imgWidth = maxWidth;
              imgHeight = imgHeight * ratio;
            }
            if (imgHeight > maxHeight) {
              const ratio = maxHeight / imgHeight;
              imgHeight = maxHeight;
              imgWidth = imgWidth * ratio;
            }

            if (yPosition + imgHeight > pageHeight - 20) {
              doc.addPage();
              yPosition = 20;
            }

            // Convert to base64
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.7);

            doc.addImage(dataUrl, 'JPEG', margin + (i % 2) * (maxWidth + 5), yPosition, imgWidth, imgHeight);
            
            if (i % 2 === 1 || i === images.length - 1) {
              yPosition += imgHeight + 10;
            }
          } catch (imgError) {
            console.warn('Could not load image:', images[i]);
          }
        }
      }

      return yPosition;
    };

    // Process all selected apples
    for (let i = 0; i < selectedRows.length; i++) {
      await addAppleToPDF(doc, selectedRows[i], i > 0);
      
      if (setErrorMessage && selectedRows.length > 5) {
        setErrorMessage(`Processing ${i + 1}/${selectedRows.length} apples...`);
      }
    }

    // Save the combined PDF
    doc.save(`appleverse_${selectedRows.length}_apples.pdf`);

    if (setErrorMessage) {
      setErrorMessage(`Successfully exported ${selectedRows.length} apples to PDF`);
      setTimeout(() => setErrorMessage(null), 3000);
    }
  } catch (error) {
    console.error('PDF export error:', error);
    if (setErrorMessage) {
      setErrorMessage(`PDF export failed: ${error.message}`);
      setTimeout(() => setErrorMessage(null), 5000);
    }
  }
}

// Helper to get field value with multiple fallbacks
function getAppleField(apple, ...fieldNames) {
  for (const field of fieldNames) {
    // Check direct field
    if (apple[field] !== undefined && apple[field] !== null && apple[field] !== '') {
      return String(apple[field]).trim();
    }
    // Check metadata
    if (apple.metadata) {
      const value = apple.metadata[field];
      if (value !== undefined && value !== null && value !== '') {
        return String(value).trim();
      }
    }
  }
  return '';
}

// Export separate PDFs (one per apple) as a ZIP file
async function exportPDFAll(rows, apiBase, setErrorMessage = null) {
  if (!rows?.length) {
    if (setErrorMessage) {
      setErrorMessage("No rows to export.");
      setTimeout(() => setErrorMessage(null), 5000);
    }
    return;
  }

  console.log(`📦 PDF(All) Export: Generating ${rows.length} separate PDFs`);

  try {
    const { jsPDF } = await import('jspdf');
    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();

    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 20;
    const lineHeight = 7;

    // Helper function to add section
    const addSection = (doc, title, data, yPos) => {
      const nonEmptyData = Object.entries(data).filter(([key, value]) => 
        value && value !== 'N/A' && value.toString().trim() !== ''
      );
      
      if (nonEmptyData.length === 0) return yPos;
      
      if (yPos > pageHeight - 40) {
        doc.addPage();
        yPos = 20;
      }
      
      doc.setFontSize(14);
      doc.setTextColor(44, 62, 80);
      doc.text(title, margin, yPos);
      yPos += lineHeight;
      
      doc.setFontSize(10);
      doc.setTextColor(85, 85, 85);
      
      nonEmptyData.forEach(([key, value]) => {
        if (yPos > pageHeight - 20) {
          doc.addPage();
          yPos = 20;
        }
        const formattedKey = key.replace(/_/g, ' ').toUpperCase();
        const text = `${formattedKey}: ${value || 'N/A'}`;
        
        const splitText = doc.splitTextToSize(text, pageWidth - 2 * margin - 10);
        splitText.forEach(line => {
          if (yPos > pageHeight - 20) {
            doc.addPage();
            yPos = 20;
          }
          doc.text(line, margin + 5, yPos);
          yPos += lineHeight;
        });
      });
      
      return yPos + 5;
    };

    for (let i = 0; i < rows.length; i++) {
      const apple = rows[i];
      const doc = new jsPDF();
      
      let yPosition = 20;
      
      // Get cultivar name and accession with fallbacks
      const cultivarName = getAppleField(apple, 'CULTIVAR NAME', 'cultivar_name', 'name') || 'Unknown';
      const accession = getAppleField(apple, 'ACCESSION', 'accession') || 'N/A';
      
      // Title
      doc.setFontSize(20);
      doc.setTextColor(231, 111, 81);
      doc.text(`Apple: ${cultivarName}`, margin, yPosition);
      yPosition += 10;
      
      // Accession
      doc.setFontSize(12);
      doc.setTextColor(52, 73, 94);
      doc.text(`Accession: ${accession}`, margin, yPosition);
      yPosition += 8;
      
      // Line
      doc.setDrawColor(231, 111, 81);
      doc.setLineWidth(0.5);
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 10;

      // Add all sections with proper field access
      yPosition = addSection(doc, 'IDENTITY & INVENTORY', {
        'Accession Number': getAppleField(apple, 'ACNO', 'acno'),
        'Accession': accession,
        'Cultivar Name': cultivarName,
        'Site ID': getAppleField(apple, 'SITE ID', 'site_id'),
        'Prefix': getAppleField(apple, 'PREFIX (ACP)', 'prefix_acp'),
        'Label Name': getAppleField(apple, 'LABEL NAME', 'label_name')
      }, yPosition);

      yPosition = addSection(doc, 'TAXONOMY', {
        'Family': getAppleField(apple, 'FAMILY', 'family'),
        'Genus': getAppleField(apple, 'GENUS', 'E GENUS', 'e_genus', 'e genus'),
        'Species': getAppleField(apple, 'SPECIES', 'E SPECIES', 'e_species', 'e species'),
        'Taxon': getAppleField(apple, 'TAXON', 'taxon', 'taxno'),
        'Plant Type': getAppleField(apple, 'PLANT TYPE', 'plant_type'),
        'Life Form': getAppleField(apple, 'LIFE FORM', 'life_form')
      }, yPosition);

      yPosition = addSection(doc, 'GEOGRAPHY & ORIGIN', {
        'Country': getAppleField(apple, 'COUNTRY', 'E Origin Country', 'e_origin_country', 'e origin country'),
        'Province/State': getAppleField(apple, 'PROVINCE/STATE', 'E Origin Province', 'e_origin_province', 'e origin province'),
        'Habitat': getAppleField(apple, 'HABITAT', 'habitat', 'e_habitat', 'e habitat'),
        'Location 1': getAppleField(apple, 'LOCATION SECTION 1', 'location_section_1'),
        'Location 2': getAppleField(apple, 'LOCATION SECTION 2', 'location_section_2'),
        'Location 3': getAppleField(apple, 'LOCATION SECTION 3', 'location_section_3'),
        'Location 4': getAppleField(apple, 'LOCATION SECTION 4', 'location_section_4')
      }, yPosition);

      yPosition = addSection(doc, 'PEOPLE & ORGANIZATIONS', {
        'Breeder or Collector': getAppleField(apple, 'BREEDER OR COLLECTOR', 'breeder_or_collector', 'e_breeder', 'e breeder'),
        'Cooperator': getAppleField(apple, 'COOPERATOR', 'cooperator'),
        'Cooperator New': getAppleField(apple, 'COOPERATOR_NEW', 'cooperator_new')
      }, yPosition);

      yPosition = addSection(doc, 'FRUIT CHARACTERISTICS', {
        'Fruit Shape': getAppleField(apple, 'FRUITSHAPE 115057', 'fruitshape_115057'),
        'Fruit Length': getAppleField(apple, 'FRUITLGTH 115156', 'fruitlgth_115156'),
        'Fruit Width': getAppleField(apple, 'FRUITWIDTH 115157', 'fruitwidth_115157'),
        'Fruit Weight': getAppleField(apple, 'FRTWEIGHT 115121', 'frtweight_115121'),
        'Stem Thickness': getAppleField(apple, 'FRTSTEMTHK 115127', 'frtstemthk_115127'),
        'Stem Length': getAppleField(apple, 'FRTSTMLGTH 115158', 'frtstmlgth_115158'),
        'Texture': getAppleField(apple, 'FRTTEXTURE 115123', 'frttexture_115123'),
        'Colour': getAppleField(apple, 'COLOUR', 'colour', 'color'),
        'Density': getAppleField(apple, 'DENSITY', 'density')
      }, yPosition);

      yPosition = addSection(doc, 'SEED CHARACTERISTICS', {
        'Seed Color': getAppleField(apple, 'SEEDCOLOR 115086', 'seedcolor_115086'),
        'Seed Size': getAppleField(apple, 'SSIZE Quantity of Seed', 'ssize_quantity_of_seed'),
        'Seed Length': getAppleField(apple, 'SEEDLENGTH 115163', 'seedlength_115163'),
        'Seed Width': getAppleField(apple, 'SEEDWIDTH 115164', 'seedwidth_115164'),
        'Seed Number': getAppleField(apple, 'SEEDNUMBER 115087', 'seednumber_115087'),
        'Seed Shape': getAppleField(apple, 'SEEDSHAPE 115167', 'seedshape_115167')
      }, yPosition);

      yPosition = addSection(doc, 'BLOOM & GROWTH', {
        'First Bloom': getAppleField(apple, 'FIRST BLOOM DATE', 'first_bloom_date'),
        'Full Bloom': getAppleField(apple, 'FULL BLOOM DATE', 'full_bloom_date'),
        'Fireblight Rating': getAppleField(apple, 'FIREBLIGHT RATING', 'fireblight_rating')
      }, yPosition);

      yPosition = addSection(doc, 'DESCRIPTIVE INFORMATION', {
        'Comments': getAppleField(apple, 'CMT', 'cmt'),
        'Narrative Keyword': getAppleField(apple, 'NARATIVEKEYWORD', 'narativekeyword'),
        'Full Narrative': getAppleField(apple, 'FULL NARATIVE', 'full_narative'),
        'Pedigree Description': getAppleField(apple, 'PEDIGREE DESCRIPTION', 'pedigree_description', 'e_pedigree', 'e pedigree')
      }, yPosition);

      yPosition = addSection(doc, 'STATUS & DISTRIBUTION', {
        'Availability Status': getAppleField(apple, 'AVAILABILITY STATUS ', 'availability_status'),
        'Is Distributable': getAppleField(apple, 'IS DISTRIBUTABLE?', 'is_distributable'),
        'Inventory Type': getAppleField(apple, 'INVENTORY TYPE', 'inventory_type'),
        'Inventory Policy': getAppleField(apple, 'INVENTORY MAINTENANCE POLICY', 'inventory_maintenance_policy'),
        'Level of Improvement': getAppleField(apple, 'LEVEL OF IMPROVEMENT', 'level_of_improvement'),
        'IPR Type': getAppleField(apple, 'IPR TYPE', 'ipr_type'),
        'Released Date': getAppleField(apple, 'RELEASED DATE', 'released_date')
      }, yPosition);

      // Add images with better error handling
      let images = [];
      
      // Try multiple ways to get images
      if (apple.metadata && apple.metadata['IMAGES']) {
        const metadataImages = apple.metadata['IMAGES'];
        if (Array.isArray(metadataImages)) {
          images = metadataImages;
        } else if (typeof metadataImages === 'string') {
          try {
            const parsed = JSON.parse(metadataImages);
            if (Array.isArray(parsed)) {
              images = parsed;
            } else {
              images = metadataImages.split(',').map(img => img.trim()).filter(img => img);
            }
          } catch {
            images = metadataImages.split(',').map(img => img.trim()).filter(img => img);
          }
        }
      }
      
      if (images.length === 0) {
        images = (apple.images && Array.isArray(apple.images)) ? apple.images :
                (apple.Images && Array.isArray(apple.Images)) ? apple.Images :
                (apple.IMAGE && Array.isArray(apple.IMAGE)) ? apple.IMAGE : [];
      }
      
      if (images.length > 0) {
        doc.addPage();
        yPosition = 20;
        
        doc.setFontSize(14);
        doc.setTextColor(44, 62, 80);
        doc.text('Images', margin, yPosition);
        yPosition += 15;

        let successfulImages = 0;
        for (let j = 0; j < images.length && successfulImages < 6; j++) {
          try {
            let imgUrl = String(images[j]).trim();
            
            // Construct proper URL
            if (imgUrl.startsWith('/images/') || imgUrl.startsWith('/data/')) {
              imgUrl = `${apiBase}${imgUrl}`;
            } else if (!imgUrl.startsWith('http://') && !imgUrl.startsWith('https://')) {
              if (imgUrl.startsWith('images/') || imgUrl.startsWith('data/')) {
                imgUrl = `${apiBase}/${imgUrl}`;
              } else {
                imgUrl = `${apiBase}/images/${imgUrl}`;
              }
            }

            const img = new Image();
            img.crossOrigin = 'anonymous';
            
            await new Promise((resolve, reject) => {
              const timeout = setTimeout(() => reject(new Error('timeout')), 10000);
              img.onload = () => { clearTimeout(timeout); resolve(); };
              img.onerror = () => { clearTimeout(timeout); reject(new Error('load failed')); };
              img.src = imgUrl;
            });

            const maxWidth = 80;
            const maxHeight = 60;
            
            let imgWidth = img.width;
            let imgHeight = img.height;
            
            if (imgWidth > maxWidth) {
              const ratio = maxWidth / imgWidth;
              imgWidth = maxWidth;
              imgHeight = imgHeight * ratio;
            }
            if (imgHeight > maxHeight) {
              const ratio = maxHeight / imgHeight;
              imgHeight = maxHeight;
              imgWidth = imgWidth * ratio;
            }

            const col = successfulImages % 2;
            const row = Math.floor(successfulImages / 2);
            const xPos = margin + col * (maxWidth + 10);
            const yPos = yPosition + row * (maxHeight + 10);

            if (yPos + imgHeight > pageHeight - 20) {
              doc.addPage();
              yPosition = 20;
            }

            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.8);

            doc.addImage(dataUrl, 'JPEG', xPos, yPos, imgWidth, imgHeight);
            successfulImages++;
          } catch (imgError) {
            console.warn(`Failed to load image ${j + 1} for ${cultivarName}:`, imgError.message);
          }
        }
      }

      // Add PDF to ZIP with safe filename
      const pdfBlob = doc.output('blob');
      const safeFileName = `${cultivarName}_${accession}`.replace(/[^a-zA-Z0-9_.-]/g, '_').substring(0, 100);
      const fileName = `${safeFileName || `apple_${i + 1}`}.pdf`;
      zip.file(fileName, pdfBlob);

      if (setErrorMessage && (i + 1) % 5 === 0) {
        setErrorMessage(`Creating PDF ${i + 1}/${rows.length}...`);
      }
    }

    // Generate and download ZIP
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(zipBlob);
    link.download = `appleverse_${rows.length}_pdfs.zip`;
    link.click();
    URL.revokeObjectURL(link.href);

    if (setErrorMessage) {
      setErrorMessage(`Successfully exported ${rows.length} PDFs as ZIP`);
      setTimeout(() => setErrorMessage(null), 3000);
    }
  } catch (error) {
    console.error('PDF(All) export error:', error);
    if (setErrorMessage) {
      setErrorMessage(`PDF export failed: ${error.message}`);
      setTimeout(() => setErrorMessage(null), 5000);
    }
  }
}