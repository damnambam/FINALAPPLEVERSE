import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowUp, ArrowDown } from 'lucide-react';
import * as XLSX from 'xlsx';
import './TemplateCreator.css';

const TemplateCreator = () => {
  const navigate = useNavigate();
  const [selectedFields, setSelectedFields] = useState(new Set());
  const [activeCategory, setActiveCategory] = useState('identity');
  const isInitialMount = useRef(true);
  const topRef = useRef(null);
  const bottomRef = useRef(null);
  
  // Refs for each category section
  const categoryRefs = useRef({});

  // Category definitions with only the needed fields
  const categories = {
    identity: {
      title: '📋 IDENTITY & CORE',
      fields: [
        'SITE ID',
        'PREFIX (ACP)',
        'ACNO',
        'ACCESSION',
        'CULTIVAR NAME',
        'LABEL NAME'
      ]
    },
    taxonomy: {
      title: '🧬 TAXONOMY & CLASSIFICATION',
      fields: [
        'FAMILY',
        'GENUS',
        'SPECIES',
        'TAXON',
        'PLANT TYPE',
        'LIFE FORM',
        'PEDIGREE DESCRIPTION'
      ]
    },
    geography: {
      title: '🌍 GEOGRAPHY & LOCATION',
      fields: [
        'COUNTRY',
        'PROVINCE/STATE',
        'HABITAT',
        'LOCATION SECTION 1',
        'LOCATION SECTION 2',
        'LOCATION SECTION 3',
        'LOCATION SECTION 4'
      ]
    },
    people: {
      title: '👥 PEOPLE & INSTITUTIONS',
      fields: [
        'BREEDER OR COLLECTOR',
        'COOPERATOR',
        'COOPERATOR_NEW'
      ]
    },
    inventory: {
      title: '📦 INVENTORY & MANAGEMENT',
      fields: [
        'INVENTORY TYPE',
        'INVENTORY MAINTENANCE POLICY',
        'IS DISTRIBUTABLE?'
      ]
    },
    status: {
      title: '📅 STATUS & DATES',
      fields: [
        'AVAILABILITY STATUS',
        'IPR TYPE',
        'LEVEL OF IMPROVEMENT',
        'RELEASED DATE',
        'RELEASED DATE FORMAT'
      ]
    },
    fruit: {
      title: '🍎 FRUIT CHARACTERISTICS',
      fields: [
        'FRUITSHAPE 115057',
        'FRUITLGTH 115156',
        'FRUITWIDTH 115157',
        'FRTWEIGHT 115121',
        'FRTSTEMTHK 115127',
        'FRTTEXTURE 115123',
        'FRTSTMLGTH 115158',
        'FRTFLSHOXI 115129',
        'COLOUR',
        'DENSITY'
      ]
    },
    seed: {
      title: '🌱 SEED CHARACTERISTICS',
      fields: [
        'SEEDCOLOR 115086',
        'SSIZE Quantity of Seed',
        'SEEDLENGTH 115163',
        'SEEDWIDTH 115164',
        'SEEDNUMBER 115087',
        'SEEDSHAPE 115167'
      ]
    },
    phenology: {
      title: '🌸 PHENOLOGY & HEALTH',
      fields: [
        'FIRST BLOOM DATE',
        'FULL BLOOM DATE',
        'FIREBLIGHT RATING'
      ]
    },
    metadata: {
      title: '📝 DESCRIPTIVE METADATA',
      fields: [
        'CMT',
        'NARATIVEKEYWORD',
        'FULL NARATIVE',
        'IMAGES'
      ]
    }
  };

  // Default mandatory fields that cannot be unchecked
  const defaultFields = [
    'ACCESSION',
    'CULTIVAR NAME'
  ];

  // Initialize with default fields selected and scroll to top
  useEffect(() => {
    setSelectedFields(new Set(defaultFields));
    // Mark that initial mount is complete
    isInitialMount.current = false;
    
    // Scroll to top after component mounts
    setTimeout(() => {
      window.scrollTo(0, 0);
      if (topRef.current) {
        topRef.current.scrollIntoView({ block: 'start' });
      }
    }, 0);
  }, []);

  // Back to Create Apple handler
  const handleBackToCreateApple = () => {
    navigate('/create-apple');
  };

  // Scroll functions
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Scroll to category when clicked (but not on initial mount)
  const scrollToCategory = (categoryKey) => {
    setActiveCategory(categoryKey);
    
    // Only scroll if it's not the initial mount
    if (!isInitialMount.current) {
      categoryRefs.current[categoryKey]?.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start',
        inline: 'nearest'
      });
    }
  };

  const handleCheckboxChange = (field) => {
    // Prevent unchecking default fields
    if (defaultFields.includes(field)) {
      return;
    }

    const newSelected = new Set(selectedFields);
    if (newSelected.has(field)) {
      newSelected.delete(field);
    } else {
      newSelected.add(field);
    }
    setSelectedFields(newSelected);
  };

  const handleDownload = () => {
    if (selectedFields.size === 0) {
      alert('Please select at least one field!');
      return;
    }

    // Create array of selected fields in order
    const orderedFields = [];
    Object.values(categories).forEach(category => {
      category.fields.forEach(field => {
        if (selectedFields.has(field)) {
          orderedFields.push(field);
        }
      });
    });

    // Create workbook with headers
    const wb = XLSX.utils.book_new();
    const wsData = [orderedFields];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    
    // Download file
    const timestamp = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `AppleVerse_Template_${timestamp}.xlsx`);
  };

  return (
    <div className="template-creator" ref={topRef}>
      {/* Scroll Buttons */}
      <div className="scroll-buttons">
        <button className="scroll-btn" onClick={scrollToTop} title="Scroll to top">
          <ArrowUp size={20} />
        </button>
        <button className="scroll-btn" onClick={scrollToBottom} title="Scroll to bottom">
          <ArrowDown size={20} />
        </button>
      </div>

      <div className="template-header">
        {/* Back Button */}
        <button 
          className="back-to-create-btn"
          onClick={handleBackToCreateApple}
        >
          <ArrowLeft size={18} />
          Back to Create Apple
        </button>

        <div className="header-content">
          <h1>📋 Template Creator</h1>
          <div className="fields-counter">
            <span className="counter-number">{selectedFields.size}</span>
            <span className="counter-label">Fields Selected</span>
          </div>
        </div>
      </div>

      <div className="template-divider"></div>

      <div className="template-content">
        <div className="categories-sidebar">
          <div className="sidebar-header">
            <h3>📁 Categories</h3>
            <p className="sidebar-subtitle">Jump to section</p>
          </div>
          <div className="category-list">
            {Object.entries(categories).map(([key, category]) => {
              const fieldsInCategory = category.fields.filter(f => selectedFields.has(f)).length;
              const totalFields = category.fields.length;
              
              return (
                <div 
                  key={key} 
                  className={`category-label ${activeCategory === key ? 'active' : ''}`}
                  onClick={() => scrollToCategory(key)}
                >
                  <span className="category-name">{category.title}</span>
                  <span className="category-count">{fieldsInCategory}/{totalFields}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="fields-section">
          <div className="fields-header">
            <h3>🔍 Select Fields</h3>
            <div className="field-actions">
              <button 
                className="action-btn select-all"
                onClick={() => {
                  const allFields = new Set();
                  Object.values(categories).forEach(cat => {
                    cat.fields.forEach(field => allFields.add(field));
                  });
                  setSelectedFields(allFields);
                }}
              >
                ✓ Select All Fields
              </button>
              <button 
                className="action-btn clear-all"
                onClick={() => setSelectedFields(new Set(defaultFields))}
              >
                ⟲ Reset to Required
              </button>
            </div>
          </div>

          {Object.entries(categories).map(([key, category]) => (
            <div 
              key={key} 
              className="category-group"
              ref={el => categoryRefs.current[key] = el}
            >
              <div className="category-header-section">
                <div className="category-title">{category.title}</div>
                <div className="category-actions">
                  <div className="category-info">
                    {category.fields.filter(f => selectedFields.has(f)).length} of {category.fields.length} selected
                  </div>
                  <div className="category-buttons">
                    <button
                      className="category-action-btn select"
                      onClick={(e) => {
                        e.stopPropagation();
                        const newSelected = new Set(selectedFields);
                        category.fields.forEach(field => {
                          newSelected.add(field);
                        });
                        setSelectedFields(newSelected);
                      }}
                      title="Select all fields in this category"
                    >
                      ✓ Select All
                    </button>
                    <button
                      className="category-action-btn clear"
                      onClick={(e) => {
                        e.stopPropagation();
                        const newSelected = new Set(selectedFields);
                        category.fields.forEach(field => {
                          if (!defaultFields.includes(field)) {
                            newSelected.delete(field);
                          }
                        });
                        setSelectedFields(newSelected);
                      }}
                      title="Clear all fields in this category"
                    >
                      ✗ Clear
                    </button>
                  </div>
                </div>
              </div>
              <div className="checkbox-grid">
                {category.fields.map(field => {
                  const isDefault = defaultFields.includes(field);
                  const isChecked = selectedFields.has(field);
                  
                  return (
                    <label 
                      key={field} 
                      className={`checkbox-item ${isDefault ? 'default' : ''} ${isChecked ? 'checked' : ''}`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleCheckboxChange(field)}
                        disabled={isDefault}
                      />
                      <span className="checkbox-label">
                        <span className="field-name">{field}</span>
                        {isDefault && <span className="default-badge">REQUIRED</span>}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="template-footer" ref={bottomRef}>
        <button className="download-btn" onClick={handleDownload}>
          <span className="btn-icon">📥</span>
          <span className="btn-text">Download Template ({selectedFields.size} fields)</span>
        </button>
      </div>
    </div>
  );
};

export default TemplateCreator;