import React, { useState } from 'react';
import './createApple.css';
import axios from 'axios';
import * as XLSX from 'xlsx';
import JSZip from 'jszip';
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Upload, FileSpreadsheet, FileImage, CheckCircle, AlertCircle } from 'lucide-react';

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

  // Statistics
  const [stats, setStats] = useState({
    matched: 0,
    unmatchedImages: 0,
    unmatchedApples: 0
  });

  // Back to start
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
    setStats({ matched: 0, unmatchedImages: 0, unmatchedApples: 0 });
  };

  // STEP 1: Handle CSV/Excel Upload
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

  // ===========================
  // FIXED: Proper Excel/CSV Parsing
  // ===========================
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

      // Handle Excel files (.xlsx, .xls)
      if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
        const arrayBuffer = await csvFile.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        parsedData = XLSX.utils.sheet_to_json(firstSheet, { 
          defval: '',
          raw: false  // Convert dates/numbers to strings
        });
      } 
      // Handle CSV files
      else if (fileName.endsWith('.csv')) {
        const text = await csvFile.text();
        const workbook = XLSX.read(text, { type: 'string' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        parsedData = XLSX.utils.sheet_to_json(firstSheet, { 
          defval: '',
          raw: false
        });
      }

      // Check if file is empty
      if (!parsedData || parsedData.length === 0) {
        setError('❌ The file is empty. Please upload a file that contains apple data.');
        setLoading(false);
        return;
      }

      // Validate mandatory columns
      const firstRow = parsedData[0];
      const headers = Object.keys(firstRow);
      
      // Check for cultivar name column
      const hasCultivarName = headers.some(key => {
        const normalized = key.toLowerCase().replace(/[^a-z0-9]/g, '');
        return (
          normalized.includes('cultivar') && normalized.includes('name') ||
          normalized === 'name' ||
          normalized === 'cultivarname' ||
          normalized === 'cultivar'
        );
      });
      
      // Check for accession column
      const hasAccession = headers.some(key => {
        const normalized = key.toLowerCase().replace(/[^a-z0-9]/g, '');
        return (
          normalized.includes('accession') ||
          normalized === 'harrowaccession'
        );
      });

      if (!hasCultivarName) {
        setError('❌ CSV must contain a "CULTIVAR_NAME" or "CULTIVAR NAME" column. This is a required field.');
        setLoading(false);
        return;
      }
      
      if (!hasAccession) {
        setError('❌ CSV must contain an "ACCESSION" column. This is a required field.');
        setLoading(false);
        return;
      }

      // Find the actual column names
      const cultivarField = headers.find(key => {
        const normalized = key.toLowerCase().replace(/[^a-z0-9]/g, '');
        return (
          normalized.includes('cultivar') && normalized.includes('name') ||
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

      // Check for empty mandatory fields in data rows
      const rowsWithMissingData = [];
      parsedData.forEach((row, index) => {
        const cultivarValue = row[cultivarField];
        const accessionValue = row[accessionField];
        
        if (!cultivarValue || !cultivarValue.toString().trim()) {
          rowsWithMissingData.push({ row: index + 2, field: 'Cultivar Name', value: cultivarValue });
        }
        if (!accessionValue || !accessionValue.toString().trim()) {
          rowsWithMissingData.push({ row: index + 2, field: 'Accession', value: accessionValue });
        }
      });
      
      if (rowsWithMissingData.length > 0) {
        const errorMessages = rowsWithMissingData.slice(0, 5).map(item => 
          `Row ${item.row}: Missing ${item.field}`
        ).join(', ');
        const remaining = rowsWithMissingData.length - 5;
        setError(`❌ Found rows with missing mandatory fields: ${errorMessages}${remaining > 0 ? ` and ${remaining} more` : ''}. Both ACCESSION and CULTIVAR_NAME are required for every row.`);
        setLoading(false);
        return;
      }

      // Check for duplicate entries
      const seen = new Set();
      const duplicates = [];
     
      parsedData.forEach((row, index) => {
        const identifier = `${row[accessionField]}_${row[cultivarField]}`.toLowerCase();
       
        if (seen.has(identifier)) {
          duplicates.push({ 
            row: index + 2, 
            accession: row[accessionField],
            name: row[cultivarField] 
          });
        }
        seen.add(identifier);
      });

      if (duplicates.length > 0) {
        const dupeList = duplicates.slice(0, 3).map(d => 
          `${d.accession} - ${d.name} (row ${d.row})`
        ).join(', ');
        const remaining = duplicates.length - 3;
        setError(`❌ Duplicate entries found: ${dupeList}${remaining > 0 ? ` and ${remaining} more` : ''}. Please remove duplicates and try again.`);
        setLoading(false);
        return;
      }

      setCsvData(parsedData);
      console.log('✅ File parsed:', parsedData.length, 'rows');
      console.log('✅ Sample row:', parsedData[0]);
     
      // Automatically move to Step 2
      setStep(2);
    } catch (err) {
      console.error('❌ Parse error:', err);
      setError('Failed to parse file: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // STEP 2: Handle ZIP Upload
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

  // ===========================
  // FIXED: Better Image Matching with IMAGES Column Support
  // ===========================
  const handleMatchImages = async () => {
    if (!imagesZip) {
      setError('Please select a ZIP file containing images.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const zip = new JSZip();
      const contents = await zip.loadAsync(imagesZip);
     
      const imageFiles = [];
      for (const [filename, file] of Object.entries(contents.files)) {
        if (!file.dir && /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(filename)) {
          const blob = await file.async('blob');
          const cleanFilename = filename.split('/').pop();
          imageFiles.push({
            name: cleanFilename,
            blob: blob,
            url: URL.createObjectURL(blob)
          });
        }
      }

      if (imageFiles.length === 0) {
        setError('No valid image files found in the ZIP.');
        setLoading(false);
        return;
      }

      console.log('✅ Extracted images:', imageFiles.length);
      setExtractedImages(imageFiles);

      // Match images to apples
      performMatching(imageFiles);
     
      // Move to Step 3
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

    // Get field names
    const firstRow = csvData[0];
    const headers = Object.keys(firstRow);
    
    const cultivarField = headers.find(key => {
      const normalized = key.toLowerCase().replace(/[^a-z0-9]/g, '');
      return (
        normalized.includes('cultivar') && normalized.includes('name') ||
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

    // Find IMAGES column (to track how many images expected per apple)
    const imagesField = headers.find(key => 
      key.toLowerCase().replace(/[^a-z]/g, '') === 'images'
    );

    // Track which images have been matched
    const matchedImageNames = new Set();

    csvData.forEach((apple, appleIndex) => {
      const cultivarName = apple[cultivarField];
      const accessionNumber = apple[accessionField];
      const expectedImageCount = imagesField ? parseInt(apple[imagesField]) || 1 : 1;
     
      if (!cultivarName || !accessionNumber) return;

      // Create search patterns
      const patterns = [
        accessionNumber.toLowerCase().replace(/[^a-z0-9]/g, ''),
        cultivarName.toLowerCase().replace(/[^a-z0-9]/g, ''),
        `${accessionNumber}_${cultivarName}`.toLowerCase().replace(/[^a-z0-9]/g, '')
      ];
     
      // Find matching images
      const appleImages = [];
      
      for (const img of images) {
        if (matchedImageNames.has(img.name)) continue; // Skip already matched
        
        const cleanImgName = img.name.toLowerCase()
          .replace(/\.(jpg|jpeg|png|gif|bmp|webp)$/i, '')
          .replace(/[^a-z0-9]/g, '');
       
        const isMatch = patterns.some(pattern => 
          cleanImgName.includes(pattern) || 
          pattern.includes(cleanImgName) ||
          cleanImgName.startsWith(pattern)
        );

        if (isMatch) {
          appleImages.push(img);
          matchedImageNames.add(img.name);
          
          // Stop if we've matched the expected number of images
          if (appleImages.length >= expectedImageCount) break;
        }
      }

      if (appleImages.length > 0) {
        matched.push({
          appleIndex: appleIndex,
          apple: apple,
          images: appleImages,
          cultivarName: cultivarName,
          accessionNumber: accessionNumber,
          expectedCount: expectedImageCount,
          actualCount: appleImages.length
        });
      } else {
        unmatchedApps.push({
          appleIndex: appleIndex,
          apple: apple,
          cultivarName: cultivarName,
          accessionNumber: accessionNumber,
          expectedCount: expectedImageCount
        });
      }
    });

    // Find unmatched images
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

  // Handle manual matching
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

  // ===========================
  // FIXED: Proper Image-to-Apple Association
  // ===========================
  const handleSaveToDatabase = async () => {
    setLoading(true);

    try {
      // Combine matched data with manual matches
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
              expectedCount: item.expectedCount,
              actualCount: 1
            });
          }
        } else {
          // Include apples without images
          finalData.push({
            appleIndex: item.appleIndex,
            apple: item.apple,
            images: [],
            cultivarName: item.cultivarName,
            accessionNumber: item.accessionNumber,
            expectedCount: item.expectedCount,
            actualCount: 0
          });
        }
      });

      console.log('💾 Saving to database:', finalData.length, 'entries');

      // Create FormData for upload
      const formData = new FormData();
     
      console.log('📦 Preparing to send:', {
        totalApples: finalData.length,
        applesWithImages: finalData.filter(item => item.images && item.images.length > 0).length,
        totalImages: finalData.reduce((sum, item) => sum + (item.images?.length || 0), 0)
      });
     
      // FIXED: Associate images with correct apple indices
      finalData.forEach((item) => {
        // Add apple data
        formData.append(`apples[${item.appleIndex}]`, JSON.stringify(item.apple));
        console.log(`   📝 Added apple[${item.appleIndex}]: ${item.cultivarName}`);
       
        // Add image blobs with index mapping
        if (item.images && item.images.length > 0) {
          item.images.forEach((img) => {
            formData.append(`images_${item.appleIndex}`, img.blob, img.name);
            console.log(`   📸 Added image for apple[${item.appleIndex}]: ${img.name}`);
          });
        }
      });

      console.log('📋 FormData prepared with', finalData.length, 'apples');

      // Get admin token
      const adminToken = localStorage.getItem('adminToken');

      if (!adminToken) {
        setLoading(false);
        alert('❌ You must be logged in as admin to upload apples.');
        navigate('/signup-login');
        return;
      }

      // Send to backend
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

      console.log('✅ Upload response:', response.data);
      
      if (response.data.stats.failed > 0) {
        alert(`⚠️ Upload completed with warnings:\n✅ ${response.data.stats.successful} apple(s) uploaded\n❌ ${response.data.stats.failed} failed\n\nCheck console for details.`);
        console.log('Failed items:', response.data.errors);
      } else {
        alert(`🎉 Successfully uploaded ${response.data.stats.successful} apple(s)!`);
      }
     
      handleBackToStart();
     
    } catch (err) {
      console.error('❌ Save error:', err);
     
      if (err.response?.status === 401) {
        alert('❌ Authentication failed. Please log in again as admin.');
        navigate('/signup-login');
      } else if (err.response?.status === 400) {
        const errorMsg = err.response?.data?.message || 'Validation error';
        alert(`❌ Validation Error:\n${errorMsg}`);
      } else {
        alert(`❌ Error: ${err.response?.data?.message || err.message || 'Save failed'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-apple-container">
      <h1 className="page-title">Create New Apple Resource 🍎</h1>

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
                <p>Manually enter details for one apple at a time using the standardized template with 54 fields.</p>
              </div>
             
              <div className="instruction-item">
                <strong>2. Multiple Upload (Bulk)</strong>
                <p>Upload multiple apple entries using CSV or Excel files. <strong>Required: ACCESSION and CULTIVAR_NAME</strong>.</p>
              </div>
             
              <div className="instruction-item">
                <strong>3. Template Creator</strong>
                <p>Download the Excel template with all 54 standardized fields.</p>
              </div>

              <div className="note-box">
                <strong>📝 Template Structure:</strong>
                <ul>
                  <li><strong>Mandatory:</strong> ACCESSION, CULTIVAR_NAME</li>
                  <li><strong>Optional:</strong> 52 additional standardized fields</li>
                  <li><strong>IMAGES column:</strong> Specify how many images per apple (e.g., "2" or "4")</li>
                </ul>
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
                <p><strong>CULTIVAR_NAME</strong> - Apple variety name</p>
                <p className="error-text">⚠️ Both required for every row!</p>
              </div>

              <div className="instruction-item">
                <strong>✓ IMAGES Column (Optional):</strong>
                <p>Specify expected image count per apple (e.g., enter "2" if you have 2 images for that apple)</p>
              </div>

              <div className="instruction-item">
                <strong>✓ No Duplicates:</strong>
                <p>Each apple must be unique (ACCESSION + CULTIVAR_NAME combination)</p>
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

            {error && <div className="error-box"><p>{error}</p></div>}

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
                <strong>✓ Recommended Format:</strong>
                <p><code>AccessionNumber_CultivarName.jpg</code></p>
                <p>Example: <code>MAL0100_Honeycrisp.jpg</code></p>
              </div>

              <div className="instruction-item">
                <strong>✓ Alternative Formats:</strong>
                <p><code>MAL0100.jpg</code> or <code>Honeycrisp.jpg</code></p>
              </div>

              <div className="instruction-item">
                <strong>✓ Multiple Images:</strong>
                <p>Add numbers: <code>MAL0100_1.jpg</code>, <code>MAL0100_2.jpg</code></p>
              </div>

              <div className="instruction-item">
                <strong>✓ Supported Formats:</strong>
                <p>JPG, JPEG, PNG, GIF, BMP, WEBP</p>
              </div>
            </div>

            <div className="info-box">
              <p>✓ File uploaded: {csvData.length} cultivars loaded</p>
              <p>✓ All mandatory fields validated</p>
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
            <h2><CheckCircle size={28} /> Review and Save</h2>
           
            {/* Statistics */}
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

            {/* Manual Matching */}
            {unmatchedApples.length > 0 && (
              <div className="manual-matching-section">
                <h3><AlertCircle size={20} /> Manual Matching</h3>
                <p>Select images for these cultivars (or leave blank):</p>
               
                {unmatchedApples.map((item) => (
                  <div key={item.appleIndex} className="match-item">
                    <strong>{item.accessionNumber} - {item.cultivarName}</strong>
                    {item.expectedCount > 1 && (
                      <span className="expected-count"> (expects {item.expectedCount} images)</span>
                    )}
                    <select
                      value={manualMatches[item.appleIndex] || ''}
                      onChange={(e) => handleManualMatch(item.appleIndex, e.target.value)}
                      className="match-select"
                    >
                      <option value="">-- No Image (Skip) --</option>
                      {unmatchedImages.map((img, imgIndex) => (
                        <option key={imgIndex} value={img.name}>{img.name}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            )}

            {/* Matched Preview */}
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
                        <small>Images: {item.actualCount}/{item.expectedCount}</small>
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
            
            <div className="info-box" style={{ marginTop: '20px' }}>
              <p><strong>ℹ️ Ready to save:</strong></p>
              <p>• {matchedData.reduce((sum, item) => sum + item.actualCount, 0)} total images matched</p>
              <p>• {matchedData.length + unmatchedApples.length} total apples</p>
            </div>

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
    </div>
  );
}