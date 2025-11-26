import React, { useState, useEffect, useRef } from 'react';
import './createApple.css';
import axios from 'axios';
import * as XLSX from 'xlsx';
import JSZip from 'jszip';
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Upload, FileSpreadsheet, FileImage, CheckCircle, AlertCircle, RefreshCw, Copy, XCircle, Search, ArrowUp, ArrowDown } from 'lucide-react';

// ===========================
// SearchableDropdown Component
// ===========================
const SearchableDropdown = ({ images, value, onChange, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredImages = images.filter(img =>
    img.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedImage = images.find(img => img.name === value);

  return (
    <div ref={dropdownRef} style={{ position: 'relative', width: '100%' }}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        style={{
          padding: '10px',
          border: '2px solid #d1d5db',
          borderRadius: '6px',
          cursor: 'pointer',
          background: 'white',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <span style={{ color: value ? '#111827' : '#9ca3af' }}>
          {value ? selectedImage?.name || value : placeholder}
        </span>
        <span style={{ fontSize: '12px', color: '#6b7280' }}>▼</span>
      </div>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            marginTop: '4px',
            background: 'white',
            border: '2px solid #d1d5db',
            borderRadius: '6px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            zIndex: 1000,
            maxHeight: '300px',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <div style={{ padding: '8px', borderBottom: '1px solid #e5e7eb' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px', background: '#f3f4f6', borderRadius: '4px' }}>
              <Search size={16} color="#6b7280" />
              <input
                type="text"
                placeholder="Search images..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                style={{
                  border: 'none',
                  background: 'transparent',
                  outline: 'none',
                  width: '100%',
                  fontSize: '14px'
                }}
                autoFocus
              />
            </div>
          </div>

          <div style={{ overflowY: 'auto', maxHeight: '240px' }}>
            <div
              onClick={() => {
                onChange('');
                setIsOpen(false);
                setSearchTerm('');
              }}
              style={{
                padding: '10px',
                cursor: 'pointer',
                borderBottom: '1px solid #f3f4f6',
                color: '#6b7280',
                fontSize: '14px',
                background: !value ? '#f9fafb' : 'white'
              }}
              onMouseEnter={(e) => e.target.style.background = '#f3f4f6'}
              onMouseLeave={(e) => e.target.style.background = !value ? '#f9fafb' : 'white'}
            >
              -- No Image (Skip) --
            </div>

            {filteredImages.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: '#9ca3af', fontSize: '14px' }}>
                No images found
              </div>
            ) : (
              filteredImages.map((img, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    onChange(img.name);
                    setIsOpen(false);
                    setSearchTerm('');
                  }}
                  style={{
                    padding: '10px',
                    cursor: 'pointer',
                    borderBottom: idx < filteredImages.length - 1 ? '1px solid #f3f4f6' : 'none',
                    fontSize: '14px',
                    background: value === img.name ? '#eff6ff' : 'white',
                    color: value === img.name ? '#2563eb' : '#111827'
                  }}
                  onMouseEnter={(e) => e.target.style.background = '#f3f4f6'}
                  onMouseLeave={(e) => e.target.style.background = value === img.name ? '#eff6ff' : 'white'}
                >
                  {img.name}
                </div>
              ))
            )}
          </div>

          {filteredImages.length > 0 && (
            <div style={{ padding: '6px 8px', borderTop: '1px solid #e5e7eb', fontSize: '12px', color: '#6b7280', background: '#f9fafb' }}>
              {filteredImages.length} image{filteredImages.length !== 1 ? 's' : ''} {searchTerm ? 'found' : 'available'}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ===========================
// Scroll Buttons Component
// ===========================
const ScrollButtons = () => {
  const [showButtons, setShowButtons] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowButtons(window.scrollY > 200);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToBottom = () => {
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  };

  if (!showButtons) return null;

  return (
    <div style={{
      position: 'fixed',
      right: '24px',
      bottom: '24px',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      zIndex: 1000
    }}>
      <button
        onClick={scrollToTop}
        style={{
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          border: 'none',
          color: 'white',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          transition: 'transform 0.2s'
        }}
        onMouseEnter={(e) => e.target.style.transform = 'scale(1.1)'}
        onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
        title="Scroll to top"
      >
        <ArrowUp size={24} />
      </button>
      <button
        onClick={scrollToBottom}
        style={{
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          border: 'none',
          color: 'white',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          transition: 'transform 0.2s'
        }}
        onMouseEnter={(e) => e.target.style.transform = 'scale(1.1)'}
        onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
        title="Scroll to bottom"
      >
        <ArrowDown size={24} />
      </button>
    </div>
  );
};

export default function CreateApple() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [csvFile, setCsvFile] = useState(null);
  const [csvData, setCsvData] = useState([]);
  const [imagesZip, setImagesZip] = useState(null);
  const [extractedImages, setExtractedImages] = useState([]);
  const [matchedData, setMatchedData] = useState([]);
  const [unmatchedImages, setUnmatchedImages] = useState([]);
  const [unmatchedApples, setUnmatchedApples] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [manualMatches, setManualMatches] = useState({});
  const [duplicates, setDuplicates] = useState([]);
  const [duplicateResolutions, setDuplicateResolutions] = useState({});

  const [stats, setStats] = useState({
    matched: 0,
    unmatchedImages: 0,
    unmatchedApples: 0
  });

  const handleBackToStart = () => {
    setStep(0);
    setCsvFile(null);
    setCsvData([]);
    setImagesZip(null);
    setExtractedImages([]);
    setMatchedData([]);
    setUnmatchedImages([]);
    setUnmatchedApples([]);
    setError('');
    setManualMatches({});
    setDuplicates([]);
    setDuplicateResolutions({});
    setStats({ matched: 0, unmatchedImages: 0, unmatchedApples: 0 });
  };

  const handleCsvChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith('.csv') && !fileName.endsWith('.xlsx') && !fileName.endsWith('.xls')) {
      setError('Only CSV or Excel files are allowed.');
      setCsvFile(null);
      return;
    }

    setError('');
    setCsvFile(file);
  };

  const handleCsvUpload = async () => {
    if (!csvFile) {
      setError('Please select a CSV or Excel file to upload.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      let parsedData = [];
      const fileName = csvFile.name.toLowerCase();

      if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
        const arrayBuffer = await csvFile.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        parsedData = XLSX.utils.sheet_to_json(firstSheet, { 
          defval: '',
          raw: false
        });
      } else if (fileName.endsWith('.csv')) {
        const text = await csvFile.text();
        const workbook = XLSX.read(text, { type: 'string' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        parsedData = XLSX.utils.sheet_to_json(firstSheet, { 
          defval: '',
          raw: false
        });
      }

      if (!parsedData || parsedData.length === 0) {
        setError('❌ The file is empty. Please upload a file that contains apple data.');
        setLoading(false);
        return;
      }

      const firstRow = parsedData[0];
      const headers = Object.keys(firstRow);
      
      const cultivarField = headers.find(key => {
        const normalized = key.toLowerCase().replace(/[^a-z0-9]/g, '');
        return (
          (normalized.includes('cultivar') && normalized.includes('name')) ||
          normalized === 'name' ||
          normalized === 'cultivarname' ||
          normalized === 'cultivar'
        );
      });
      
      const accessionField = headers.find(key => {
        const normalized = key.toLowerCase().replace(/[^a-z0-9]/g, '');
        return (
          normalized.includes('accession') ||
          normalized === 'harrowaccession'
        );
      });

      if (!cultivarField) {
        setError('❌ File must contain a "CULTIVAR NAME" or "CULTIVAR_NAME" column. This is a required field.');
        setLoading(false);
        return;
      }
      
      if (!accessionField) {
        setError('❌ File must contain an "ACCESSION" column. This is a required field.');
        setLoading(false);
        return;
      }

      const validationErrors = [];
      
      parsedData.forEach((row, index) => {
        const rowNumber = index + 2;
        const cultivarValue = row[cultivarField];
        const accessionValue = row[accessionField];
        
        const errors = [];
        
        if (!cultivarValue || !cultivarValue.toString().trim()) {
          errors.push('Missing CULTIVAR NAME');
        }
        if (!accessionValue || !accessionValue.toString().trim()) {
          errors.push('Missing ACCESSION');
        }
        
        if (errors.length > 0) {
          validationErrors.push({
            row: rowNumber,
            cultivar: cultivarValue || '(empty)',
            accession: accessionValue || '(empty)',
            errors: errors
          });
        }
      });
      
      if (validationErrors.length > 0) {
        const errorList = validationErrors.slice(0, 10).map(item => 
          `Row ${item.row}: ${item.errors.join(', ')}`
        ).join('\n');
        
        const remaining = validationErrors.length - 10;
        const summary = validationErrors.length > 10 
          ? `\n...and ${remaining} more row(s) with errors.`
          : '';
        
        setError(
          `❌ Found ${validationErrors.length} row(s) with missing mandatory fields:\n\n${errorList}${summary}\n\nBoth ACCESSION and CULTIVAR NAME are required for every row.`
        );
        setLoading(false);
        return;
      }

      const seen = new Set();
      const duplicatesInFile = [];
     
      parsedData.forEach((row, index) => {
        const identifier = `${row[accessionField]}_${row[cultivarField]}`.toLowerCase().trim();
       
        if (seen.has(identifier)) {
          duplicatesInFile.push({ 
            row: index + 2, 
            accession: row[accessionField],
            name: row[cultivarField] 
          });
        }
        seen.add(identifier);
      });

      if (duplicatesInFile.length > 0) {
        const dupeList = duplicatesInFile.slice(0, 5).map(d => 
          `Row ${d.row}: ${d.accession} - ${d.name}`
        ).join('\n');
        const remaining = duplicatesInFile.length - 5;
        const summary = remaining > 0 ? `\n...and ${remaining} more duplicate(s).` : '';
        
        setError(
          `❌ Found ${duplicatesInFile.length} duplicate entries in your file:\n\n${dupeList}${summary}\n\nPlease remove duplicates and try again.`
        );
        setLoading(false);
        return;
      }

      parsedData.forEach(row => {
        Object.keys(row).forEach(key => {
          if (key.toLowerCase().replace(/[^a-z]/g, '') === 'images') {
            delete row[key];
          }
        });
      });

      setCsvData(parsedData);
      console.log('✅ File parsed:', parsedData.length, 'rows');
     
      setStep(2);
    } catch (err) {
      console.error('❌ Parse error:', err);
      setError('Failed to parse file: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleZipChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.zip')) {
      setError('Only ZIP files are allowed for image upload.');
      setImagesZip(null);
      return;
    }

    setError('');
    setImagesZip(file);
  };

  const handleMatchImages = async () => {
    if (!imagesZip) {
      setError('Please select a ZIP file containing images.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      console.time('ZIP Extraction');
      const zip = new JSZip();
      const contents = await zip.loadAsync(imagesZip);
     
      // Helper to get MIME type from extension
      const getMimeType = (filename) => {
        const ext = filename.toLowerCase().split('.').pop();
        const mimeTypes = {
          'jpg': 'image/jpeg',
          'jpeg': 'image/jpeg',
          'png': 'image/png',
          'gif': 'image/gif',
          'webp': 'image/webp',
          'bmp': 'image/bmp'
        };
        return mimeTypes[ext] || 'image/jpeg';
      };

      const imageFiles = [];
      for (const [filename, file] of Object.entries(contents.files)) {
        if (!file.dir && /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(filename)) {
          const arrayBuffer = await file.async('arraybuffer');
          const cleanFilename = filename.split('/').pop();
          const mimeType = getMimeType(cleanFilename);
          
          // Create blob with correct MIME type
          const blob = new Blob([arrayBuffer], { type: mimeType });
          
          imageFiles.push({
            name: cleanFilename,
            blob: blob,
            url: URL.createObjectURL(blob)
          });
        }
      }
      console.timeEnd('ZIP Extraction');

      if (imageFiles.length === 0) {
        setError('No valid image files found in the ZIP.');
        setLoading(false);
        return;
      }

      console.log('✅ Extracted images:', imageFiles.length);
      setExtractedImages(imageFiles);

      console.time('Image Matching');
      performMatching(imageFiles);
      console.timeEnd('Image Matching');
     
      setStep(3);
    } catch (err) {
      console.error('❌ ZIP extraction error:', err);
      setError('Failed to extract ZIP file: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const performMatching = (images) => {
    const matched = [];
    const unmatchedImgs = [];
    const unmatchedApps = [];

    const firstRow = csvData[0];
    const headers = Object.keys(firstRow);
    
    const cultivarField = headers.find(key => {
      const normalized = key.toLowerCase().replace(/[^a-z0-9]/g, '');
      return (
        (normalized.includes('cultivar') && normalized.includes('name')) ||
        normalized === 'name' ||
        normalized === 'cultivarname'
      );
    });
   
    const accessionField = headers.find(key => {
      const normalized = key.toLowerCase().replace(/[^a-z0-9]/g, '');
      return (
        normalized.includes('accession') ||
        normalized === 'harrowaccession'
      );
    });

    const matchedImageNames = new Set();

    csvData.forEach((apple, appleIndex) => {
      const cultivarName = apple[cultivarField];
      const accessionNumber = apple[accessionField];
     
      if (!cultivarName || !accessionNumber) return;

      const createSearchPattern = (text) => {
        if (!text) return '';
        return text.toLowerCase().replace(/[^a-z0-9]/g, '');
      };

      const accessionPattern = createSearchPattern(accessionNumber);
      const cultivarPattern = createSearchPattern(cultivarName);
      
      const appleImages = [];
      
      for (const img of images) {
        if (matchedImageNames.has(img.name)) continue;
        
        const cleanImgName = createSearchPattern(img.name);
       
        const isMatch = 
          (accessionPattern.length > 0 && cleanImgName.includes(accessionPattern)) ||
          (cultivarPattern.length > 3 && cleanImgName.includes(cultivarPattern)) ||
          (accessionPattern.length > 0 && cleanImgName.startsWith(accessionPattern));

        if (isMatch) {
          appleImages.push(img);
          matchedImageNames.add(img.name);
        }
      }

      if (appleImages.length > 0) {
        matched.push({
          appleIndex: appleIndex,
          apple: apple,
          images: appleImages,
          cultivarName: cultivarName,
          accessionNumber: accessionNumber,
          imageCount: appleImages.length
        });
      } else {
        unmatchedApps.push({
          appleIndex: appleIndex,
          apple: apple,
          cultivarName: cultivarName,
          accessionNumber: accessionNumber
        });
      }
    });

    unmatchedImgs.push(...images.filter(img => !matchedImageNames.has(img.name)));

    setMatchedData(matched);
    setUnmatchedImages(unmatchedImgs);
    setUnmatchedApples(unmatchedApps);

    setStats({
      matched: matched.length,
      unmatchedImages: unmatchedImgs.length,
      unmatchedApples: unmatchedApps.length
    });

    console.log('📊 Matching complete:', {
      matched: matched.length,
      unmatchedImages: unmatchedImgs.length,
      unmatchedApples: unmatchedApps.length
    });
  };

  const handleManualMatch = (appleIndex, imageName) => {
    const newMatches = { ...manualMatches };
    newMatches[appleIndex] = imageName;
    setManualMatches(newMatches);

    const manualMatchCount = Object.keys(newMatches).filter(k => newMatches[k]).length;
    setStats(prev => ({
      ...prev,
      unmatchedApples: unmatchedApples.length - manualMatchCount
    }));
  };

  const handleDuplicateResolution = (index, action) => {
    const newResolutions = { ...duplicateResolutions };
    newResolutions[index] = action;
    setDuplicateResolutions(newResolutions);
  };

  // ===========================
  // FIXED: Send actual Excel file and use correct 'images' field name
  // ===========================
  const handleSaveToDatabase = async () => {
    setLoading(true);

    try {
      // Combine matched and unmatched data
      const finalData = [...matchedData];
     
      unmatchedApples.forEach((item) => {
        if (manualMatches[item.appleIndex]) {
          const selectedImage = extractedImages.find(img => img.name === manualMatches[item.appleIndex]);
          if (selectedImage) {
            finalData.push({
              appleIndex: item.appleIndex,
              apple: item.apple,
              images: [selectedImage],
              cultivarName: item.cultivarName,
              accessionNumber: item.accessionNumber,
              imageCount: 1
            });
          }
        } else {
          finalData.push({
            appleIndex: item.appleIndex,
            apple: item.apple,
            images: [],
            cultivarName: item.cultivarName,
            accessionNumber: item.accessionNumber,
            imageCount: 0
          });
        }
      });

      console.log('💾 Preparing to save:', finalData.length, 'entries');

      const formData = new FormData();
      
      // FIXED: Send the actual CSV/Excel file that was uploaded
      formData.append('excelFile', csvFile);
      
      // FIXED: Use 'images' field name (what multer expects)
      // Add all images - backend matches by accession in filename
      finalData.forEach((item) => {
        if (item.images && item.images.length > 0) {
          item.images.forEach((img) => {
            // Keep original filename - backend extracts MAL#### pattern
            formData.append('images', img.blob, img.name);
          });
        }
      });
      
      // Add duplicate handling preference
      formData.append('handleDuplicates', 'detect');

      const adminToken = localStorage.getItem('adminToken');

      if (!adminToken) {
        setLoading(false);
        alert('❌ You must be logged in as admin to upload apples.');
        navigate('/signup-login');
        return;
      }

      console.log('🔍 Uploading to database...');
      
      const response = await axios.post(
        'http://localhost:5000/api/apples/bulk-upload-with-images', 
        formData, 
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${adminToken}`
          },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            console.log(`Upload progress: ${percentCompleted}%`);
          }
        }
      );

      console.log('✅ Upload response:', response.data);
      
      if (response.data.duplicates && response.data.duplicates.length > 0) {
        setDuplicates(response.data.duplicates);
        setLoading(false);
        return;
      }
      
      if (response.data.results) {
        const { inserted, updated, skipped, duplicates: dupCount, errors } = response.data.results;
        alert(`🎉 Upload Complete!\n\n✅ Inserted: ${inserted}\n🔄 Updated: ${updated}\n⏭️ Skipped: ${skipped}\n🔁 Duplicates: ${dupCount}\n❌ Errors: ${errors?.length || 0}`);
      } else if (response.data.stats) {
        if (response.data.stats.failed > 0) {
          alert(`⚠️ Upload completed with warnings:\n✅ ${response.data.stats.successful} apple(s) uploaded\n❌ ${response.data.stats.failed} failed`);
        } else {
          alert(`🎉 Successfully uploaded ${response.data.stats.successful} apple(s)!`);
        }
      } else {
        alert('🎉 Upload completed successfully!');
      }
     
      handleBackToStart();
     
    } catch (err) {
      console.error('❌ Save error:', err);
     
      if (err.response?.status === 401) {
        alert('❌ Authentication failed. Please log in again as admin.');
        navigate('/signup-login');
      } else if (err.response?.status === 400) {
        const errorMsg = err.response?.data?.message || err.response?.data?.error || 'Validation error';
        alert(`❌ Validation Error:\n${errorMsg}`);
      } else {
        alert(`❌ Error: ${err.response?.data?.message || err.response?.data?.error || err.message || 'Save failed'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResolveDuplicates = async () => {
    setLoading(true);

    try {
      const unresolvedCount = duplicates.filter(
        (_, index) => !duplicateResolutions[index]
      ).length;

      if (unresolvedCount > 0) {
        alert(`⚠️ Please make a decision for all ${unresolvedCount} duplicate(s) before proceeding.`);
        setLoading(false);
        return;
      }

      const finalData = [...matchedData];
      unmatchedApples.forEach((item) => {
        if (manualMatches[item.appleIndex]) {
          const selectedImage = extractedImages.find(img => img.name === manualMatches[item.appleIndex]);
          if (selectedImage) {
            finalData.push({
              appleIndex: item.appleIndex,
              apple: item.apple,
              images: [selectedImage],
              cultivarName: item.cultivarName,
              accessionNumber: item.accessionNumber,
              imageCount: 1
            });
          }
        } else {
          finalData.push({
            appleIndex: item.appleIndex,
            apple: item.apple,
            images: [],
            cultivarName: item.cultivarName,
            accessionNumber: item.accessionNumber,
            imageCount: 0
          });
        }
      });

      const formData = new FormData();
      
      // FIXED: Send the actual CSV/Excel file
      formData.append('excelFile', csvFile);
      
      // Add duplicate resolutions
      formData.append('duplicateResolutions', JSON.stringify(duplicateResolutions));
      formData.append('handleDuplicates', 'resolve');
      
      // FIXED: Use 'images' field name
      finalData.forEach((item) => {
        if (item.images && item.images.length > 0) {
          item.images.forEach((img) => {
            formData.append('images', img.blob, img.name);
          });
        }
      });

      const adminToken = localStorage.getItem('adminToken');

      const response = await axios.post(
        'http://localhost:5000/api/apples/bulk-upload-with-images', 
        formData, 
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${adminToken}`
          }
        }
      );

      console.log('✅ Final upload response:', response.data);
      
      alert(`🎉 Successfully processed entries!\n\nCheck console for details.`);
     
      handleBackToStart();
     
    } catch (err) {
      console.error('❌ Resolution error:', err);
      alert(`❌ Error: ${err.response?.data?.message || err.message || 'Failed to process duplicates'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-apple-container">
      <h1 className="page-title">Create New Apple Resource 🍎</h1>

      <ScrollButtons />

      {/* Timeline */}
      <div className="timeline">
        {['Choose Method', 'Upload File', 'Upload Images', 'Review & Save'].map((label, idx) => (
          <div key={idx} className={`timeline-step ${step === idx ? 'active' : ''} ${step > idx ? 'completed' : ''}`}>
            <div className="circle">{step > idx ? '✓' : idx + 1}</div>
            <span>{label}</span>
          </div>
        ))}
      </div>

      {/* Step Content */}
      <div className="step-content-card">
       
        {/* STEP 0: CHOOSE METHOD */}
        {step === 0 && (
          <div className="step">
            <h2>Choose Upload Method</h2>
            <div className="instructions-card">
              <h3>Upload Options</h3>
             
              <div className="instruction-item">
                <strong>1. Single Upload</strong>
                <p>Manually enter details for one apple at a time.</p>
              </div>
             
              <div className="instruction-item">
                <strong>2. Multiple Upload (Bulk)</strong>
                <p>Upload multiple apple entries using CSV or Excel files. <strong>Required: ACCESSION and CULTIVAR NAME</strong>.</p>
              </div>
             
              <div className="instruction-item">
                <strong>3. Template Creator</strong>
                <p>Download the Excel template with all standardized fields.</p>
              </div>
            </div>

            <div className="upload-options">
              <button className="upload-btn single" onClick={() => navigate('/single-apple')}>
                Single Upload
              </button>
              <button className="upload-btn multiple" onClick={() => setStep(1)}>
                Multiple Upload
              </button>
              <button className="upload-btn template" onClick={() => navigate('/template-creator')}>
                Download Template
              </button>
            </div>

            <div style={{ textAlign: 'center', marginTop: '30px' }}>
              <button onClick={() => navigate('/dashboard')} className="btn-secondary">
                <ArrowLeft size={18} />
                Back to Dashboard
              </button>
            </div>
          </div>
        )}

        {/* STEP 1: UPLOAD CSV/EXCEL */}
        {step === 1 && (
          <div className="step">
            <h2><FileSpreadsheet size={28} /> Upload Your CSV or Excel File</h2>
            <div className="instructions-card">
              <h3>File Requirements</h3>
             
              <div className="instruction-item">
                <strong>✓ Accepted Formats:</strong>
                <p>CSV (.csv), Excel (.xlsx, .xls)</p>
              </div>

              <div className="instruction-item">
                <strong>✓ Mandatory Columns:</strong>
                <p><strong>ACCESSION</strong> - Unique identifier</p>
                <p><strong>CULTIVAR NAME</strong> - Apple variety name</p>
                <p className="error-text">⚠️ Both required for every row!</p>
              </div>
            </div>

            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleCsvChange}
            />

            {csvFile && (
              <div className="file-selected-box">
                <p>✓ Selected: {csvFile.name} ({(csvFile.size / 1024).toFixed(2)} KB)</p>
              </div>
            )}

            {error && <div className="error-box" style={{ whiteSpace: 'pre-line' }}><p>{error}</p></div>}

            <div className="navigation-buttons">
              <button className="btn-secondary" onClick={handleBackToStart}>
                <ArrowLeft size={18} /> Back
              </button>
              <button
                className="btn-primary"
                onClick={handleCsvUpload}
                disabled={!csvFile || loading}
              >
                {loading ? '⏳ Processing...' : <><Upload size={18} /> Upload File</>}
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: UPLOAD IMAGES */}
        {step === 2 && (
          <div className="step">
            <h2><FileImage size={28} /> Upload Your Images</h2>
            <div className="instructions-card">
              <h3>Image Naming Convention</h3>
             
              <div className="instruction-item">
                <strong>✓ Recommended - Use ACCESSION:</strong>
                <p><code>MAL0100.jpg</code> or <code>MAL0100_1.jpg</code></p>
              </div>
            </div>

            <div className="info-box">
              <p>✓ File uploaded: {csvData.length} cultivars loaded</p>
            </div>

            <input type="file" accept=".zip" onChange={handleZipChange} />

            {imagesZip && (
              <div className="file-selected-box">
                <p>✓ Selected: {imagesZip.name} ({(imagesZip.size / 1024).toFixed(2)} KB)</p>
              </div>
            )}

            {error && <div className="error-box"><p>{error}</p></div>}

            <div className="navigation-buttons">
              <button className="btn-secondary" onClick={() => setStep(1)}>
                <ArrowLeft size={18} /> Back
              </button>
              <button
                className="btn-primary"
                onClick={handleMatchImages}
                disabled={!imagesZip || loading}
              >
                {loading ? '⏳ Processing...' : <>🔍 Match Images</>}
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: REVIEW & SAVE */}
        {step === 3 && (
          <div className="step">
            {duplicates.length > 0 ? (
              <div>
                <h2><AlertCircle size={28} style={{ color: '#f59e0b' }} /> Duplicates Found</h2>
                
                <div className="info-box" style={{ background: '#fef3c7', borderColor: '#f59e0b', marginBottom: '20px' }}>
                  <p><strong>⚠️ Found {duplicates.length} apple(s) that already exist in the database.</strong></p>
                </div>

                <div className="duplicates-list">
                  {duplicates.map((dup, index) => (
                    <div key={index} className="duplicate-item" style={{ 
                      border: '1px solid #d1d5db', 
                      borderRadius: '8px', 
                      padding: '16px', 
                      marginBottom: '12px',
                      background: '#f9fafb'
                    }}>
                      <div style={{ marginBottom: '12px' }}>
                        <strong>{dup.accession} - {dup.cultivar_name}</strong>
                      </div>
                      
                      <div className="duplicate-actions" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <button
                          onClick={() => handleDuplicateResolution(index, 'replace')}
                          style={{
                            padding: '8px 16px',
                            border: '2px solid',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            background: duplicateResolutions[index] === 'replace' ? '#3b82f6' : 'white',
                            borderColor: duplicateResolutions[index] === 'replace' ? '#3b82f6' : '#d1d5db',
                            color: duplicateResolutions[index] === 'replace' ? 'white' : '#374151',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                        >
                          <RefreshCw size={16} />
                          Replace
                        </button>
                        
                        <button
                          onClick={() => handleDuplicateResolution(index, 'duplicate')}
                          style={{
                            padding: '8px 16px',
                            border: '2px solid',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            background: duplicateResolutions[index] === 'duplicate' ? '#10b981' : 'white',
                            borderColor: duplicateResolutions[index] === 'duplicate' ? '#10b981' : '#d1d5db',
                            color: duplicateResolutions[index] === 'duplicate' ? 'white' : '#374151',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                        >
                          <Copy size={16} />
                          Create Duplicate
                        </button>
                        
                        <button
                          onClick={() => handleDuplicateResolution(index, 'skip')}
                          style={{
                            padding: '8px 16px',
                            border: '2px solid',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            background: duplicateResolutions[index] === 'skip' ? '#6b7280' : 'white',
                            borderColor: duplicateResolutions[index] === 'skip' ? '#6b7280' : '#d1d5db',
                            color: duplicateResolutions[index] === 'skip' ? 'white' : '#374151',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                        >
                          <XCircle size={16} />
                          Skip
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="navigation-buttons" style={{ marginTop: '24px' }}>
                  <button className="btn-secondary" onClick={handleBackToStart}>
                    <ArrowLeft size={18} /> Cancel
                  </button>
                  <button
                    className="btn-primary"
                    onClick={handleResolveDuplicates}
                    disabled={loading}
                  >
                    {loading ? '⏳ Processing...' : <>✓ Proceed</>}
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <h2><CheckCircle size={28} /> Review and Save</h2>
           
                <div className="stats-grid">
                  <div className="stat-card success">
                    <div className="stat-number">{stats.matched}</div>
                    <div className="stat-label">✓ Matched</div>
                  </div>
                  <div className="stat-card warning">
                    <div className="stat-number">{stats.unmatchedImages}</div>
                    <div className="stat-label">⚠ Unmatched Images</div>
                  </div>
                  <div className="stat-card error">
                    <div className="stat-number">{unmatchedApples.length - Object.keys(manualMatches).filter(k => manualMatches[k]).length}</div>
                    <div className="stat-label">⚠ Unmatched Apples</div>
                  </div>
                </div>

                {unmatchedApples.length > 0 && (
                  <div className="manual-matching-section">
                    <h3><AlertCircle size={20} /> Manual Matching ({unmatchedApples.length} items)</h3>
               
                    {unmatchedApples.map((item) => (
                      <div key={item.appleIndex} className="match-item" style={{ marginBottom: '16px' }}>
                        <strong style={{ display: 'block', marginBottom: '8px' }}>
                          {item.accessionNumber} - {item.cultivarName}
                        </strong>
                        <SearchableDropdown
                          images={unmatchedImages}
                          value={manualMatches[item.appleIndex] || ''}
                          onChange={(value) => handleManualMatch(item.appleIndex, value)}
                          placeholder="Search for image..."
                        />
                      </div>
                    ))}
                  </div>
                )}

                {matchedData.length > 0 && (
                  <div className="matched-preview">
                    <h3>✓ Successfully Matched ({matchedData.length})</h3>
                    <div className="preview-grid">
                      {matchedData.slice(0, 6).map((item, index) => (
                        <div key={index} className="preview-item">
                          <img src={item.images[0].url} alt={item.cultivarName} />
                          <div className="preview-name">
                            {item.accessionNumber} - {item.cultivarName}
                            <br/>
                            <small>{item.imageCount} image(s)</small>
                          </div>
                        </div>
                      ))}
                      {matchedData.length > 6 && (
                        <div className="preview-more">
                          +{matchedData.length - 6} more
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="navigation-buttons">
                  <button className="btn-secondary" onClick={handleBackToStart}>
                    <ArrowLeft size={18} /> Start Over
                  </button>
                  <button
                    className="btn-primary"
                    onClick={handleSaveToDatabase}
                    disabled={loading}
                  >
                    {loading ? '⏳ Saving...' : <>💾 Save to Database</>}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}