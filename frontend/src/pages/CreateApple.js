import React, { useState } from 'react';
import './createApple.css';
import axios from 'axios';
import Papa from 'papaparse';
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
  const [duplicateApples, setDuplicateApples] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [manualMatches, setManualMatches] = useState({});
  const [duplicateResolutions, setDuplicateResolutions] = useState({});
 
  // Statistics
  const [stats, setStats] = useState({
    matched: 0,
    unmatchedImages: 0,
    unmatchedApples: 0,
    duplicates: 0
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
    setDuplicateApples([]);
    setError('');
    setManualMatches({});
    setDuplicateResolutions({});
    setStats({ matched: 0, unmatchedImages: 0, unmatchedApples: 0, duplicates: 0 });
  };
 
  // STEP 1: Handle CSV Upload
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
      const text = await csvFile.text();
      const parsed = Papa.parse(text, { header: true, skipEmptyLines: true });
 
      // Check if file is empty
      if (!parsed.data || parsed.data.length === 0) {
        setError('❌ The file is empty. Please upload a file that contains apple data.');
        setLoading(false);
        return;
      }
 
      // Validate that there's at least a cultivar name column
      const firstRow = parsed.data[0];
      const hasCultivarName = Object.keys(firstRow).some(key =>
        key.toLowerCase().includes('cultivar') ||
        key.toLowerCase().includes('name')
      );
 
      if (!hasCultivarName) {
        setError('CSV must contain a cultivar name column (e.g., "cultivar_name", "name")');
        setLoading(false);
        return;
      }
 
      // Check for duplicate entries in CSV
      const cultivarField = Object.keys(firstRow).find(key =>
        key.toLowerCase().includes('cultivar') ||
        key.toLowerCase().includes('name')
      );
     
      const accessionField = Object.keys(firstRow).find(key =>
        key.toLowerCase().includes('accession')
      );
 
      const seen = new Set();
      const duplicates = [];
     
      parsed.data.forEach((row, index) => {
        const identifier = accessionField ?
          `${row[accessionField]}_${row[cultivarField]}` :
          row[cultivarField];
       
        if (seen.has(identifier)) {
          duplicates.push({ row: index + 2, name: row[cultivarField] }); // +2 for header and 0-index
        }
        seen.add(identifier);
      });
 
      if (duplicates.length > 0) {
        setError(`❌ Duplicate entries found in CSV: ${duplicates.map(d => `${d.name} (row ${d.row})`).join(', ')}. Please remove duplicates and try again.`);
        setLoading(false);
        return;
      }
 
      setCsvData(parsed.data);
      console.log('✅ CSV parsed:', parsed.data.length, 'rows');
     
      // Automatically move to Step 2
      setStep(2);
    } catch (err) {
      console.error('❌ CSV parse error:', err);
      setError('Failed to parse CSV file: ' + err.message);
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
        if (!file.dir && /\.(jpg|jpeg|png|gif|bmp)$/i.test(filename)) {
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
 
    // Get cultivar name field and accession field
    const firstRow = csvData[0];
    const cultivarField = Object.keys(firstRow).find(key =>
      key.toLowerCase().includes('cultivar') ||
      key.toLowerCase().includes('name')
    );
   
    const accessionField = Object.keys(firstRow).find(key =>
      key.toLowerCase().includes('accession')
    );
 
    csvData.forEach(apple => {
      const cultivarName = apple[cultivarField];
      const accessionNumber = accessionField ? apple[accessionField] : '';
     
      if (!cultivarName) return;
 
      // Create expected image name pattern: accessionNumber_cultivarName
      const expectedPattern = accessionNumber ?
        `${accessionNumber}_${cultivarName}`.toLowerCase().replace(/[^a-z0-9_]/g, '') :
        cultivarName.toLowerCase().replace(/[^a-z0-9]/g, '');
     
      // Find all matching images (could be multiple)
      const matchedImages = images.filter(img => {
        const cleanImgName = img.name.toLowerCase()
          .replace(/\.(jpg|jpeg|png|gif|bmp)$/i, '')
          .replace(/[^a-z0-9_]/g, '');
       
        return cleanImgName.includes(expectedPattern) ||
               expectedPattern.includes(cleanImgName) ||
               cleanImgName.startsWith(expectedPattern);
      });
 
      if (matchedImages.length > 0) {
        // Add all matched images for this apple
        matchedImages.forEach(img => {
          matched.push({
            apple: apple,
            image: img,
            cultivarName: cultivarName,
            accessionNumber: accessionNumber
          });
        });
      } else {
        unmatchedApps.push({
          apple: apple,
          cultivarName: cultivarName,
          accessionNumber: accessionNumber
        });
      }
    });
 
    // Find unmatched images
    const matchedImageNames = matched.map(m => m.image.name);
    unmatchedImgs.push(...images.filter(img => !matchedImageNames.includes(img.name)));
 
    setMatchedData(matched);
    setUnmatchedImages(unmatchedImgs);
    setUnmatchedApples(unmatchedApps);
 
    setStats({
      matched: matched.length,
      unmatchedImages: unmatchedImgs.length,
      unmatchedApples: unmatchedApps.length,
      duplicates: 0
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
 
    // Update stats
    const manualMatchCount = Object.keys(newMatches).filter(k => newMatches[k]).length;
    setStats(prev => ({
      ...prev,
      unmatchedApples: unmatchedApples.length - manualMatchCount
    }));
  };
 
  // STEP 3: Save to Database
const handleSaveToDatabase = async () => {
  setLoading(true);
 
  try {
    // Combine matched data with manual matches
    const finalData = [...matchedData];
   
    unmatchedApples.forEach((item, index) => {
      if (manualMatches[index]) {
        const selectedImage = extractedImages.find(img => img.name === manualMatches[index]);
        if (selectedImage) {
          finalData.push({
            apple: item.apple,
            image: selectedImage,
            cultivarName: item.cultivarName,
            accessionNumber: item.accessionNumber
          });
        }
      }
    });
 
    console.log('💾 Saving to database:', finalData.length, 'entries');
    console.log('🔍 DEBUG: finalData structure:', finalData);
    console.log('🔍 DEBUG: First item:', finalData[0]);
 
    // Create FormData for upload
    const formData = new FormData();
   
    finalData.forEach((item, index) => {
      // Add apple data with index notation
      formData.append(`apples[${index}]`, JSON.stringify(item.apple));
     
      // Add image blob (all use same field name 'images')
      if (item.image && item.image.blob) {
        formData.append('images', item.image.blob, item.image.name);
      }
    });
 
    // Debug: Check FormData contents
    console.log('📋 FormData contents:');
    for (let pair of formData.entries()) {
      if (pair[0].startsWith('apples')) {
        console.log('🍎', pair[0], ':', pair[1].substring(0, 100) + '...');
      }
      if (pair[0] === 'images') {
        console.log('📸', pair[0], ':', pair[1] instanceof Blob ? `Blob: ${pair[1].size} bytes` : pair[1]);
      }
    }
 
    console.log('📤 Sending to backend:', finalData.length, 'items');
 
     // Get admin token from localStorage
    const adminToken = localStorage.getItem('adminToken');
 
    if (!adminToken) {
      setLoading(false);
      alert('❌ You must be logged in as admin to upload apples.');
      navigate('/signup-login');
      return;
    }
 
    console.log('🔐 Using admin token for upload');
 
    // Send to backend with authentication
    const response = await axios.post('http://localhost:5000/api/apples/bulk-upload-with-images', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': `Bearer ${adminToken}`
      }
    });
 
    console.log('✅ Upload response:', response.data);
    alert(`🎉 Successfully uploaded ${response.data.stats.successful} apple(s) with images!`);
   
    // Reset and go back to start
    handleBackToStart();
   
   } catch (err) {
    console.error('❌ Save error:', err);
    console.error('❌ Error response:', err.response?.data);
    console.error('❌ Status code:', err.response?.status);
   
    if (err.response?.status === 401) {
      alert('❌ Authentication failed. Please log in again as admin.');
      navigate('/signup-login');
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
        {['Choose Method', 'Upload CSV', 'Upload Images', 'Review & Save'].map((label, idx) => (
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
                <p>Manually enter details for one apple at a time. You can upload images and fill in all information individually. If you need to make specific changes to an existing apple entry later, you can edit it directly from the library.</p>
              </div>
             
              <div className="instruction-item">
                <strong>2. Multiple Upload (Bulk)</strong>
                <p>Upload multiple apple entries at once using a CSV or Excel file along with their images. This is faster for adding many apples. Your file must follow the template format.</p>
              </div>
             
              <div className="instruction-item">
                <strong>3. Template Creator</strong>
                <p>Download the Excel template that shows the required format for bulk uploads. Your CSV/Excel file must follow this template structure.</p>
              </div>
 
              <div className="note-box">
                <strong>📝 Note:</strong> If you upload an apple that already exists in the database, you'll be asked in the review phase whether to keep the old information, replace it with new data, or make specific edits directly in the library.
              </div>
            </div>
 
            <div className="upload-options">
              <button
                className="upload-btn single"
                onClick={() => navigate('/single-apple')}
              >
                Single Upload
              </button>
 
              <button
                className="upload-btn multiple"
                onClick={() => setStep(1)}
              >
                Multiple Upload
              </button>
 
              <button
                className="upload-btn template"
                onClick={() => navigate('/template-creator')}
              >
                Download Template
              </button>
            </div>
 
            <div style={{ textAlign: 'center', marginTop: '30px' }}>
              <button
                onClick={() => navigate('/dashboard')}
                className="btn-secondary"
              >
                <ArrowLeft size={18} />
                Back to Dashboard
              </button>
            </div>
          </div>
        )}
 
        {/* STEP 1: UPLOAD CSV */}
        {step === 1 && (
          <div className="step">
            <h2><FileSpreadsheet size={28} /> Upload Your CSV or Excel File</h2>
            <div className="instructions-card">
              <h3>File Requirements</h3>
             
              <div className="instruction-item">
                <strong>✓ Accepted Formats:</strong>
                <p>Only CSV (.csv) or Excel (.xlsx, .xls) files are accepted.</p>
              </div>
 
              <div className="instruction-item">
                <strong>✓ File Must Not Be Empty:</strong>
                <p>Your file must contain apple data. Empty files will be rejected.</p>
              </div>
 
              <div className="instruction-item">
                <strong>✓ No Duplicate Entries:</strong>
                <p>Each apple entry must be unique. If duplicates are found, you'll need to remove them before uploading.</p>
              </div>
 
              <div className="instruction-item">
                <strong>✓ Required Columns:</strong>
                <p>Your file must include cultivar name and follow the template format. Download the template from the Template Creator if you haven't already.</p>
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
 
            {error && (
              <div className="error-box">
                <p>{error}</p>
              </div>
            )}
 
            <div className="navigation-buttons">
              <button className="btn-secondary" onClick={handleBackToStart}>
                <ArrowLeft size={18} />
                Back
              </button>
              <button
                className="btn-primary"
                onClick={handleCsvUpload}
                disabled={!csvFile || loading}
              >
                {loading ? '⏳ Processing...' : <><Upload size={18} /> Upload CSV</>}
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
                <strong>✓ File Format:</strong>
                <p>Upload a ZIP file containing all your apple images.</p>
              </div>
 
              <div className="instruction-item">
                <strong>✓ Image Name Format:</strong>
                <p><code>AccessionNumber_CultivarName</code></p>
                <p>Example: <code>12345_Honeycrisp.jpg</code></p>
              </div>
 
              <div className="instruction-item">
                <strong>✓ Cross-Section Images:</strong>
                <p>If you have cross-section images, add <code>_crosssection</code> to the name:</p>
                <p>Example: <code>12345_Honeycrisp_crosssection.jpg</code></p>
              </div>
 
              <div className="instruction-item">
                <strong>✓ Multiple Images Per Apple:</strong>
                <p>If you have multiple images for the same apple, add numbers (1, 2, 3) at the end:</p>
                <p>Examples: <code>12345_Honeycrisp_1.jpg</code>, <code>12345_Honeycrisp_2.jpg</code></p>
              </div>
 
              <div className="instruction-item">
                <strong>✓ Supported Formats:</strong>
                <p>JPG, JPEG, PNG, GIF, BMP</p>
              </div>
 
              <div className="note-box">
                <strong>📝 Note:</strong> If there are duplicate image names or naming conflicts, you'll be able to resolve them in the review phase.
              </div>
            </div>
 
            <div className="info-box">
              <p>✓ CSV Uploaded: {csvData.length} cultivars loaded</p>
            </div>
 
            <input
              type="file"
              accept=".zip"
              onChange={handleZipChange}
            />
 
            {imagesZip && (
              <div className="file-selected-box">
                <p>✓ Selected: {imagesZip.name} ({(imagesZip.size / 1024).toFixed(2)} KB)</p>
              </div>
            )}
 
            {error && (
              <div className="error-box">
                <p>{error}</p>
              </div>
            )}
 
            <div className="navigation-buttons">
              <button className="btn-secondary" onClick={() => setStep(1)}>
                <ArrowLeft size={18} />
                Back
              </button>
              <button
                className="btn-primary"
                onClick={handleMatchImages}
                disabled={!imagesZip || loading}
                style={{ background: 'linear-gradient(135deg, #4caf50, #66bb6a)' }}
              >
                {loading ? '⏳ Processing...' : <>🔍 Match Images to Apples</>}
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
 
            {/* Manual Matching Section */}
            {unmatchedApples.length > 0 && (
              <div className="manual-matching-section">
                <h3>
                  <AlertCircle size={20} />
                  Manual Matching Required
                </h3>
                <p>The following cultivars need images. Please select from unmatched images:</p>
               
                {unmatchedApples.map((item, index) => (
                  <div key={index} className="match-item">
                    <strong>{item.accessionNumber ? `${item.accessionNumber} - ` : ''}{item.cultivarName}</strong>
                    <select
                      value={manualMatches[index] || ''}
                      onChange={(e) => handleManualMatch(index, e.target.value)}
                      className="match-select"
                    >
                      <option value="">-- Select Image --</option>
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
                      <img src={item.image.url} alt={item.cultivarName} />
                      <div className="preview-name">{item.accessionNumber ? `${item.accessionNumber} - ` : ''}{item.cultivarName}</div>
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
                <ArrowLeft size={18} />
                Start Over
              </button>
              <button
                className="btn-primary"
                onClick={handleSaveToDatabase}
                disabled={loading}
                style={{ background: 'linear-gradient(135deg, #4caf50, #66bb6a)' }}
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