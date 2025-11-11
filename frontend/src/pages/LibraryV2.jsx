import React, { useEffect, useMemo, useRef, useState } from "react";
import FilterSidebar from "../components/FilterSidebar";
import SearchBar from "../components/SearchBar";
import AppleDisp from "../components/AppleDisp";
import { ChevronDown, Trash2, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import "../styles/LibraryV2.css";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";

export default function LibraryV2() {
  const navigate = useNavigate();
  const [apples, setApples] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("table"); // 'table' | 'pictures'
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState({
    acno: "",
    accession: "",
    country: "",
    province: "",
    city: "",
    pedigree: ""
  });

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

  // Decide suggestion mode based on query
  const isAccessionMode = useMemo(() => /^mal/i.test(query.trim()), [query]);
  const suggestionKey = isAccessionMode ? "accession" : "cultivar_name";

  // Generate suggestions from local data
  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    const vals = (allDataRef.current || [])
      .map(a => {
        const val = isAccessionMode ? a.accession : a.cultivar_name;
        return val ? String(val) : "";
      })
      .filter(Boolean);

    const seen = new Set();
    const filtered = [];
    for (const v of vals) {
      const lower = v.toLowerCase();
      if (lower.startsWith(q) && !seen.has(lower)) {
        seen.add(lower);
        filtered.push(v);
        if (filtered.length >= 10) break;
      }
    }
    return filtered;
  }, [query, isAccessionMode]);

  // Helper to render a cell with truncation + tooltip
  const renderCell = (value) => {
    const text = value === null || value === undefined ? "" : String(value);
    return (
      <td
        className="av-td"
        data-full-text={text} // used by CSS ::after
        title={text} // native tooltip fallback
      >
        {text}
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

      setApples(normalized);

      // Cache full dataset when fetching all data (not a search)
      if (!searchTerm) {
        allDataRef.current = normalized;
      }

    } catch (e) {
      console.error("❌ Failed to load apples:", e);
      if (allDataRef.current.length > 0) {
        console.log("⚠️ Using cached data after fetch error");
        setApples(allDataRef.current);
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

  // Update showSuggest based on query
  useEffect(() => {
    if (manuallyClosedRef.current) {
      manuallyClosedRef.current = false;
      return;
    }
    setShowSuggest(Boolean(query.trim() && suggestions.length > 0));
  }, [query, suggestions]);

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
    runSearch(value);
  };

  // Input change handler
  const onInputChange = (e) => {
    const v = e.target.value;
    setQuery(v);
    setActiveIndex(-1);
    if (!v.trim()) {
      setShowSuggest(false);
      if (allDataRef.current.length > 0) {
        setApples(allDataRef.current);
      } else if (apples.length === 0) {
        fetchData();
      }
    }
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

  // UPDATED FILTERED LOGIC WITH CORRECT FIELD NAMES
  const filtered = useMemo(() => {
    if (!apples || apples.length === 0) {
      return [];
    }

    const q = query.trim().toLowerCase();
    const filteredData = apples.filter((row) => {
      const cultivarName = row.cultivar_name || '';
      const accession = row.accession || '';
      const acno = row.acno || '';

      const byQuery = !q ? true :
        cultivarName.toLowerCase().includes(q) ||
        accession.toLowerCase().includes(q) ||
        String(acno).toLowerCase().includes(q);

      const match =
        (!filters.acno || filters.acno === "" || String(row?.acno || "") === String(filters.acno)) &&
        (!filters.accession || filters.accession === "" || (row?.accession || "") === filters.accession) &&
        (!filters.country || filters.country === "" || (row?.['e origin country'] || "") === filters.country) &&
        (!filters.province || filters.province === "" || (row?.['e origin province'] || "") === filters.province) &&
        (!filters.city || filters.city === "" || (row?.['e origin city'] || "") === filters.city) &&
        (!filters.pedigree || filters.pedigree === "" || (row?.['e pedigree'] || "") === filters.pedigree);

      return byQuery && match;
    });

    if (apples.length > 0 && filteredData.length === 0) {
      console.log("⚠️ All data filtered out:", { applesCount: apples.length, query: q, filters });
    }

    return filteredData;
  }, [apples, query, filters]);

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

  const handleDeleteSelected = () => {
    if (selectedRecords.size === 0) return;

    const recordsToDelete = filtered.filter((record, index) => {
      const recordId = getRecordId(record, index);
      return selectedRecords.has(recordId);
    });

    setApples(prev => {
      return prev.filter(record => {
        return !recordsToDelete.some(toDelete => {
          if ((toDelete._id || toDelete.id) && (record._id || record.id)) {
            return (toDelete._id || toDelete.id) === (record._id || record.id);
          }
          const toDeleteACNO = toDelete.acno ?? '';
          const toDeleteACCESSION = toDelete.accession ?? '';
          const recordACNO = record.acno ?? '';
          const recordACCESSION = record.accession ?? '';
          return toDeleteACNO === recordACNO && toDeleteACCESSION === recordACCESSION;
        });
      });
    });

    if (allDataRef.current.length > 0) {
      allDataRef.current = allDataRef.current.filter(record => {
        return !recordsToDelete.some(toDelete => {
          if ((toDelete._id || toDelete.id) && (record._id || record.id)) {
            return (toDelete._id || toDelete.id) === (record._id || record.id);
          }
          const toDeleteACNO = toDelete.acno ?? '';
          const toDeleteACCESSION = toDelete.accession ?? '';
          const recordACNO = record.acno ?? '';
          const recordACCESSION = record.accession ?? '';
          return toDeleteACNO === recordACNO && toDeleteACCESSION === recordACCESSION;
        });
      });
    }

    setSelectedRecords(new Set());
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
  const handleDeleteRecord = (recordId) => {
    // try to find the record by id and remove it (local only)
    setApples(prev => prev.filter((r, idx) => getRecordId(r, idx) !== recordId));
    if (allDataRef.current.length > 0) {
      allDataRef.current = allDataRef.current.filter((r, idx) => getRecordId(r, idx) !== recordId);
    }
    // Remove from selectedRecords if present
    setSelectedRecords(prev => {
      const s = new Set(prev);
      s.delete(recordId);
      return s;
    });
  };

  return (
    <div className="libv2-page">
      <aside className="libv2-sidebar">
        <FilterSidebar
          data={apples}
          value={filters}
          onChange={setFilters}
          onReset={() => setFilters({ acno: "", accession: "", country: "", province: "", city: "", pedigree: "" })}
        />
      </aside>

      <main className="libv2-main">
        <div className="libv2-search-section">
          <div className="libv2-searchRow">
            <div ref={searchBoxRef} className="av-searchbox av-autocomplete" style={{ position: "relative", width: "100%" }}>
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
                <div className="av-chip-group">
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
                          onClick={() => {
                            const dataToExport = allDataRef.current.length > 0 ? allDataRef.current : apples;
                            exportPDF(dataToExport, selectedRecords.size > 0 ? selectedRecords : null, API_BASE, setErrorMessage);
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
                            color: '#1f2937',
                            borderTop: '1px solid #e5e7eb'
                          }}
                          onMouseEnter={(e) => e.target.style.backgroundColor = '#f3f4f6'}
                          onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                        >
                          PDF
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
                  <button
                    type="button"
                    className={`pill ${viewMode === 'table' ? 'pill-active' : ''}`}
                    onClick={() => setViewMode('table')}
                  >
                    Table
                  </button>
                  <button
                    type="button"
                    className={`pill ${viewMode === 'pictures' ? 'pill-active' : ''}`}
                    onClick={() => setViewMode('pictures')}
                  >
                    Pictures
                  </button>
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
                    overflowY: "auto",
                    background: "white",
                    border: "1px solid rgba(0,0,0,0.08)",
                    borderRadius: "8px",
                    boxShadow: "0 10px 20px rgba(0,0,0,0.08)"
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
                        background: i === activeIndex ? "rgba(0,0,0,0.05)" : "transparent",
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
            : !apples || apples.length === 0 ? (
              <div className="av-empty-state" style={{ padding: "40px", textAlign: "center", color: "#666" }}>
                <p>No data available. Please ensure the backend server is running on {API_BASE}</p>
                <button
                  onClick={() => fetchData()}
                  style={{ marginTop: "16px", padding: "8px 16px", cursor: "pointer" }}
                >
                  Retry
                </button>
              </div>
            ) : viewMode === 'table' ? (
              <div className="av-table-card">
                <table className="av-table">
                  <thead>
                    <tr>
                      <th style={{ width: '80px', textAlign: 'center' }}>
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
                      <th>ACNO</th>
                      <th>ACCESSION</th>
                      <th style={{ lineHeight: '1.4' }}>
                        <div style={{ display: 'block' }}>CULTIVAR</div>
                        <div style={{ display: 'block' }}>NAME</div>
                      </th>
                      <th style={{ lineHeight: '1.4' }}>
                        <div style={{ display: 'block' }}>E ORIGIN</div>
                        <div style={{ display: 'block' }}>COUNTRY</div>
                      </th>
                      <th style={{ lineHeight: '1.4' }}>
                        <div style={{ display: 'block' }}>E ORIGIN</div>
                        <div style={{ display: 'block' }}>PROVINCE</div>
                      </th>
                      <th style={{ lineHeight: '1.4' }}>
                        <div style={{ display: 'block' }}>E ORIGIN</div>
                        <div style={{ display: 'block' }}>CITY</div>
                      </th>
                      <th>E PEDIGREE</th>
                      <th>E GENUS</th>
                      <th>E SPECIES</th>
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
                          <td style={{ textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                            onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleSelectRecord(recordId)}
                              style={{ cursor: 'pointer' }}
                            />
                            <Trash2 size={16} style={{ color: '#dc3545', cursor: 'pointer' }} data-icon="trash" onClick={() => handleDeleteRecord(recordId)} />
                          </td>
                          {renderCell(a.acno ?? '')}
                          {renderCell(a.accession ?? '')}
                          {renderCell(a.cultivar_name ?? a.name ?? '')}
                          {renderCell(a['e origin country'] ?? '')}
                          {renderCell(a['e origin province'] ?? '')}
                          {renderCell(a['e origin city'] ?? '')}
                          {renderCell(a['e pedigree'] ?? '')}
                          {renderCell(a['e genus'] ?? 'Malus')}
                          {renderCell(a['e species'] ?? '')}
                        </tr>
                      );
                    }) : (
                      <tr>
                        <td className="av-empty" colSpan={10}>No results.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
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
                        const title = a.cultivar_name ?? a.name ?? 'Unknown';
                        const acc = a.accession ?? '';
                        const imgs = (a.images && Array.isArray(a.images)) ? a.images : [];
                        const first = imgs.length > 0 ? imgs[0] : null;
                        const imageUrl = first ?
                          (first.startsWith('/images/') || first.startsWith('/data/') ? `${API_BASE}${first}` : first) :
                          null;

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
                              {imageUrl ? (
                                <img src={imageUrl} alt={title} loading="lazy" onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
                              ) : null}
                              <div className="av-noimg" style={{ display: imageUrl ? 'none' : 'flex' }}>No Image</div>
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

  const { utils, writeFile } = await import("xlsx");
  const sheet = utils.json_to_sheet(rowsToExport);
  const book = utils.book_new();
  utils.book_append_sheet(book, sheet, "Varieties");
  const filename = `appleverse_selected_${rowsToExport.length}_records.csv`;
  writeFile(book, filename);
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

    for (const row of rowsToExport) {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 15;
      const leftWidth = pageWidth * 0.45;
      const rightWidth = pageWidth * 0.45;
      const rightStart = pageWidth * 0.52;

      let yPos = margin;

      doc.setFontSize(18);
      doc.setTextColor(231, 76, 60);
      const cultivarName = row.cultivar_name ?? row.name ?? 'Unknown';
      doc.text(cultivarName, margin, yPos);
      yPos += 10;

      doc.setFontSize(12);
      doc.setTextColor(52, 73, 94);
      const accession = row.accession ?? '';
      doc.text(`Accession: ${accession}`, margin, yPos);
      yPos += 8;

      doc.setDrawColor(231, 76, 60);
      doc.setLineWidth(0.5);
      doc.line(margin, yPos, leftWidth + margin, yPos);
      yPos += 8;

      doc.setFontSize(10);
      doc.setTextColor(44, 62, 80);
      const dataFields = [
        { label: 'ACNO', value: row.acno ?? '' },
        { label: 'Origin Country', value: row['e origin country'] ?? '' },
        { label: 'Origin Province', value: row['e origin province'] ?? '' },
        { label: 'Origin City', value: row['e origin city'] ?? '' },
        { label: 'Pedigree', value: row['e pedigree'] ?? '' },
        { label: 'Genus', value: row['e genus'] ?? 'Malus' },
        { label: 'Species', value: row['e species'] ?? '' },
      ];

      let dataY = yPos;
      dataFields.forEach(field => {
        if (field.value) {
          const text = `${field.label}: ${field.value}`;
          const lines = doc.splitTextToSize(text, leftWidth);
          const lineHeight = 5;
          const totalHeight = lines.length * lineHeight + 2;
          if (dataY + totalHeight > pageHeight - margin) {
            doc.addPage();
            dataY = margin;
          }
          doc.text(lines, margin, dataY);
          dataY += lines.length * lineHeight + 2;
        }
      });

      const imgs = (row.images && Array.isArray(row.images)) ? row.images : [];
      let imageY = yPos;
      const imageSize = 45;
      const imageSpacing = 8;
      const imageWidth = rightWidth * (2 / 3);
      const imageX = rightStart + rightWidth - imageWidth;

      if (imgs.length === 0) {
        doc.setFontSize(12);
        doc.setTextColor(150, 150, 150);
        const noImagesText = 'No images';
        const textWidth = doc.getTextWidth(noImagesText);
        const centerX = rightStart + (rightWidth / 2) - (textWidth / 2);
        doc.text(noImagesText, centerX, imageY);
      } else {
        let imagesLoaded = 0;
        for (let i = 0; i < Math.min(imgs.length, 4); i++) {
          const imgPath = imgs[i];
          const imageUrl = imgPath.startsWith('/images/') || imgPath.startsWith('/data/')
            ? `${apiBase}${imgPath}`
            : imgPath;

          try {
            const img = new Image();
            img.crossOrigin = 'anonymous';

            const imageLoaded = await new Promise((resolve) => {
              img.onload = () => resolve(true);
              img.onerror = () => resolve(false);
              img.src = imageUrl;
              setTimeout(() => resolve(false), 5000);
            });

            if (imageLoaded && img.complete && img.naturalWidth > 0) {
              const canvas = document.createElement('canvas');
              canvas.width = img.naturalWidth;
              canvas.height = img.naturalHeight;
              const ctx = canvas.getContext('2d');
              ctx.drawImage(img, 0, 0);

              const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
              let format = 'JPEG';
              if (imgPath.toLowerCase().endsWith('.png')) {
                const pngDataUrl = canvas.toDataURL('image/png');
                format = 'PNG';
                doc.addImage(pngDataUrl, format, imageX, imageY, imageWidth, imageSize);
              } else {
                doc.addImage(dataUrl, format, imageX, imageY, imageWidth, imageSize);
              }

              imagesLoaded++;
              imageY += imageSize + imageSpacing;

              if (i < imgs.length - 1 && imageY + imageSize > pageHeight - margin) {
                doc.addPage();
                imageY = margin;
              }
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

        if (imagesLoaded === 0) {
          doc.setFontSize(12);
          doc.setTextColor(150, 150, 150);
          const noImagesText = 'No images';
          const textWidth = doc.getTextWidth(noImagesText);
          const centerX = rightStart + (rightWidth / 2) - (textWidth / 2);
          doc.text(noImagesText, centerX, yPos);
        }
      }

      const pdfBlob = doc.output('blob');
      const cultivarNameSafe = cultivarName.replace(/[^a-zA-Z0-9]/g, '_');
      pdfs.push({ blob: pdfBlob, filename: `${cultivarNameSafe}_${accession || 'unknown'}.pdf` });
    }

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

      alert(`Downloaded ZIP file with ${pdfs.length} PDF files.`);
    } else {
      const url = window.URL.createObjectURL(pdfs[0].blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = pdfs[0].filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    }
  } catch (error) {
    console.error("PDF export error:", error);
    alert("Failed to generate PDF. Please try again.");
  }
}
