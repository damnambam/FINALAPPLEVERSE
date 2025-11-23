import React, { useState, useEffect } from 'react';
import { Download, Upload, X, Save, Edit2 } from 'lucide-react';
import './AppleDisp.css';

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";

const AppleDisp = ({ appleData, onClose, isEditing: initialIsEditing = false, isAdmin = false, onSave }) => {
  const [apple, setApple] = useState(appleData || {});
  const [images, setImages] = useState([]);
  const [isEditing, setIsEditing] = useState(initialIsEditing);
  const [imageErrors, setImageErrors] = useState({}); // Track which images failed
  
  // Helper function to normalize image URLs for duplicate detection (shared across component)
  const normalizeImageUrl = (url) => {
    try {
      // Remove API_BASE and any protocol/domain
      let normalized = url.replace(API_BASE, '').replace(/^https?:\/\/[^\/]+/, '');
      
      // Decode URL encoding multiple times to handle double encoding
      try {
        normalized = decodeURIComponent(normalized);
        // Try decoding again in case of double encoding
        if (normalized.includes('%')) {
          normalized = decodeURIComponent(normalized);
        }
      } catch (e) {
        // If decoding fails, continue with encoded version
      }
      
      // Normalize path separators
      normalized = normalized.replace(/\\/g, '/').replace(/\/+/g, '/');
      
      // Extract just the filename for comparison (case-insensitive)
      const filename = normalized.split('/').pop() || '';
      
      // Remove any query parameters or fragments
      const cleanFilename = filename.split('?')[0].split('#')[0];
      
      // Return normalized filename (case-insensitive, trimmed)
      return cleanFilename.toLowerCase().trim();
    } catch (e) {
      // Fallback: try to extract filename from URL string
      const match = url.match(/\/([^\/\?]+\.(jpg|jpeg|png|gif|bmp|webp))$/i);
      if (match) {
        return match[1].toLowerCase().trim();
      }
      return url.toLowerCase();
    }
  };
  
  // Deduplicate images array using normalized filenames
  const deduplicateImages = (imageArray) => {
    const seen = new Set();
    const unique = [];
    
    imageArray.forEach(img => {
      const normalized = normalizeImageUrl(img);
      if (!seen.has(normalized)) {
        seen.add(normalized);
        unique.push(img);
      }
    });
    
    return unique;
  };

  // Initialize images from appleData
  useEffect(() => {
    if (appleData) {
      setApple(appleData);
      setImageErrors({}); // Reset image errors when appleData changes
      
      
      // Get images from the apple data - check multiple field name formats
      let formattedImages = [];
      const imagesArray = appleData.images || appleData.Images || appleData.IMAGE || appleData['images'] || [];
      
      if (Array.isArray(imagesArray) && imagesArray.length > 0) {
        const imageMap = new Map(); // Use Map to track unique images by normalized filename
        imagesArray.forEach(img => {
          const imgPath = String(img).trim();
          let fullUrl = '';
          // If it's a path, prepend API_BASE
          if (imgPath.startsWith('/images/') || imgPath.startsWith('/data/')) {
            fullUrl = `${API_BASE}${imgPath}`;
          } else if (imgPath.startsWith('http://') || imgPath.startsWith('https://')) {
            fullUrl = imgPath;
          } else if (imgPath.startsWith('images/') || imgPath.startsWith('data/')) {
            fullUrl = `${API_BASE}/${imgPath}`;
          } else {
            fullUrl = `${API_BASE}/images/${imgPath}`;
          }
          
          // Check for duplicates using normalized filename
          const normalized = normalizeImageUrl(fullUrl);
          if (!imageMap.has(normalized)) {
            imageMap.set(normalized, fullUrl);
          }
        });
        formattedImages = Array.from(imageMap.values());
      }
      
      // Always try to find additional images by accession, even if we have some from database
      const fetchAdditionalImages = async () => {
        try {
          // Try multiple field name formats for accession
          const accession = appleData.accession || appleData.ACCESSION || appleData['Accession'] || appleData['ACCESSION'] || '';
          if (accession) {
            const response = await fetch(`${API_BASE}/api/apples/find-image/${encodeURIComponent(accession)}`);
            const data = await response.json();
            if (data.success && data.images && data.images.length > 0) {
              // Get all images from API - construct full URLs
              // The backend returns paths like "/images/King MAL0101.JPG"
              // We need to construct the full URL, encoding spaces properly
              const apiImages = data.images.map(img => {
                // Manually encode the filename part to ensure consistent encoding
                const pathParts = img.split('/');
                if (pathParts.length > 0) {
                  const filename = pathParts[pathParts.length - 1];
                  // Encode the filename but keep the path structure
                  const encodedFilename = encodeURIComponent(filename);
                  pathParts[pathParts.length - 1] = encodedFilename;
                  return `${API_BASE}${pathParts.join('/')}`;
                }
                return `${API_BASE}${img}`;
              });
              
              // Combine with database images, avoiding duplicates using normalized filenames
              const imageMap = new Map();
              
              // Add database images first
              formattedImages.forEach(img => {
                const normalized = normalizeImageUrl(img);
                if (!imageMap.has(normalized)) {
                  imageMap.set(normalized, img);
                }
              });
              
              // Add API images, avoiding duplicates
              apiImages.forEach(apiImg => {
                const normalized = normalizeImageUrl(apiImg);
                if (!imageMap.has(normalized)) {
                  imageMap.set(normalized, apiImg);
                }
              });
              
              // Final deduplication: convert to array and remove any remaining duplicates
              const uniqueImages = Array.from(imageMap.values());
              const finalDeduplicated = deduplicateImages(uniqueImages);
              
              setImages(finalDeduplicated);
              return;
            }
          }
        } catch (error) {
          console.error('Error fetching image:', error);
        }
        
        // If API call fails or returns no results, use database images or try fallback patterns
        if (formattedImages.length > 0) {
          // Final deduplication check for database images
          const finalDeduplicated = deduplicateImages(formattedImages);
          setImages(finalDeduplicated);
        } else {
          // Try fallback patterns
          const accession = appleData.accession || appleData.ACCESSION || appleData['Accession'] || appleData['ACCESSION'] || '';
          const title = appleData.cultivar_name || appleData['CULTIVAR NAME'] || appleData.name || '';
          if (accession) {
            const accUpper = accession.toUpperCase();
            const cleanTitle = title ? title.replace(/[^a-zA-Z0-9\s]/g, '').trim() : '';
            const fallbackUrls = [];
            
            // Try patterns with title + accession
            if (cleanTitle) {
              const titleWords = cleanTitle.split(/\s+/).filter(w => w.length > 2);
              if (titleWords.length > 0) {
                fallbackUrls.push(`${API_BASE}/images/${titleWords[0]} ${accUpper}.jpg`);
                fallbackUrls.push(`${API_BASE}/images/${titleWords[0]} ${accUpper}.JPG`);
              }
            }
            
            // Try patterns with numbers + accession
            const accNumber = accUpper.match(/MAL(\d+)/);
            if (accNumber) {
              fallbackUrls.push(`${API_BASE}/images/${accNumber[1]} ${accUpper}.jpg`);
              fallbackUrls.push(`${API_BASE}/images/${accNumber[1]} ${accUpper}.JPG`);
            }
            
            // Try patterns with just accession
            fallbackUrls.push(`${API_BASE}/images/${accUpper}.jpg`);
            fallbackUrls.push(`${API_BASE}/images/${accUpper}.JPG`);
            
            // Try all fallback URLs - we'll let the image error handling try each one
            if (fallbackUrls.length > 0) {
              setImages(fallbackUrls);
            } else {
              setImages([]);
            }
          } else {
            setImages([]);
          }
        }
      };
      
      fetchAdditionalImages();
    }
  }, [appleData]);

  // Handle field change
  const handleFieldChange = (field, value) => {
    setApple(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle image upload
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImages(prev => [...prev, event.target.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  // Remove image
  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  // Handle save
  const handleSave = () => {
    if (onSave) {
      onSave(apple);
    }
    setIsEditing(false);
  };

  // Download PDF
  const handleDownloadPDF = async () => {
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF();
    
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const leftWidth = pageWidth * 0.45;
    const rightWidth = pageWidth * 0.45;
    const rightStart = pageWidth * 0.52;
    
    let yPosition = 20;
    const lineHeight = 7;
    
    // Title
    doc.setFontSize(20);
    doc.setTextColor(231, 111, 81);
    doc.text(`Apple Variety: ${apple.cultivar_name || apple.name}`, margin, yPosition);
    yPosition += 10;
    
    // Accession
    doc.setFontSize(12);
    doc.setTextColor(52, 73, 94);
    const accession = apple.accession || apple.ACCESSION || '';
    doc.text(`Accession: ${accession}`, margin, yPosition);
    yPosition += 8;
    
    // Add a line
    doc.setDrawColor(231, 111, 81);
    doc.setLineWidth(0.5);
    doc.line(margin, yPosition, leftWidth + margin, yPosition);
    yPosition += 10;
    
    // Helper function to add section
    const addSection = (title, data) => {
      if (yPosition > pageHeight - 40) {
        doc.addPage();
        yPosition = 20;
      }
      
      doc.setFontSize(14);
      doc.setTextColor(44, 62, 80);
      doc.text(title, margin, yPosition);
      yPosition += lineHeight;
      
      doc.setFontSize(10);
      doc.setTextColor(85, 85, 85);
      
      Object.entries(data).forEach(([key, value]) => {
        if (yPosition > pageHeight - 20) {
          doc.addPage();
          yPosition = 20;
        }
        const formattedKey = key.replace(/_/g, ' ').toUpperCase();
        const text = `${formattedKey}: ${value || 'N/A'}`;
        const lines = doc.splitTextToSize(text, leftWidth);
        lines.forEach(line => {
          doc.text(line, margin + 5, yPosition);
        yPosition += lineHeight;
        });
      });
      
      yPosition += 5;
    };
    
    // Add sections
    addSection('IDENTITY & INVENTORY', {
      'Accession Number': apple.acno || apple.ACNO || '',
      'Accession': accession,
      'Cultivar Name': apple.cultivar_name || apple.name || ''
    });
    
    addSection('GEOGRAPHY & ORIGIN', {
      'Country': apple['e origin country'] || apple['E Origin Country'] || '',
      'Province/State': apple['e origin province'] || apple['E Origin Province'] || '',
      'City': apple['e origin city'] || apple['E Origin City'] || ''
    });

    addSection('BIOLOGY & TAXONOMY', {
      'Genus': apple['e genus'] || apple['E Genus'] || '',
      'Species': apple['e species'] || apple['E Species'] || '',
      'Pedigree': apple['e pedigree'] || apple['E pedigree'] || ''
    });
    
    addSection('ADDITIONAL INFORMATION', {
      'Description': apple.description || '',
      'Taste': apple.taste || '',
      'Texture': apple.texture || '',
      'Uses': apple.uses || '',
      'Harvest Season': apple.harvestSeason || '',
      'Hardiness': apple.hardiness || '',
      'Storage': apple.storage || ''
    });
    
    // Add images section
    let imageY = 30;
    const imageSize = 45;
    const imageSpacing = 8;
    const imageWidth = rightWidth * (2 / 3);
    const imageX = rightStart + rightWidth - imageWidth;
    
    if (images.length === 0) {
      doc.setFontSize(12);
      doc.setTextColor(150, 150, 150);
      const noImagesText = 'No images';
      const textWidth = doc.getTextWidth(noImagesText);
      const centerX = rightStart + (rightWidth / 2) - (textWidth / 2);
      doc.text(noImagesText, centerX, imageY);
    } else {
      let imagesLoaded = 0;
      for (let i = 0; i < Math.min(images.length, 4); i++) {
        const imageUrl = images[i];
        
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
            if (imageUrl.toLowerCase().endsWith('.png')) {
              const pngDataUrl = canvas.toDataURL('image/png');
              format = 'PNG';
              doc.addImage(pngDataUrl, format, imageX, imageY, imageWidth, imageSize);
            } else {
              doc.addImage(dataUrl, format, imageX, imageY, imageWidth, imageSize);
            }
            
            imagesLoaded++;
            imageY += imageSize + imageSpacing;
            
            if (i < images.length - 1 && imageY + imageSize > pageHeight - margin) {
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
        doc.text(noImagesText, centerX, 30);
      }
    }
    
    // Save the PDF
    doc.save(`${apple.cultivar_name || apple.name}_${accession || 'unknown'}.pdf`);
  };

  // Organize data by sections
  const sections = [
    {
      title: 'Identity & Inventory',
      fields: [
        { label: 'Accession Number', key: 'acno' },
        { label: 'Accession', key: 'accession' },
        { label: 'Cultivar Name', key: 'cultivar_name' }
      ]
    },
    {
      title: 'Geography & Origin',
      fields: [
        { label: 'Country', key: 'e origin country' },
        { label: 'Province/State', key: 'e origin province' },
        { label: 'City', key: 'e origin city' }
      ]
    },
    {
      title: 'Biology & Taxonomy',
      fields: [
        { label: 'Genus', key: 'e genus' },
        { label: 'Species', key: 'e species' },
        { label: 'Pedigree', key: 'e pedigree' }
      ]
    },
    {
      title: 'People & Custodians',
      fields: [
        { label: 'Breeder', key: 'e breeder' },
        { label: 'Collector', key: 'e collector' }
      ]
    },
    {
      title: 'Additional Information',
      fields: [
        { label: 'Description', key: 'description', multiline: true },
        { label: 'Taste', key: 'taste' },
        { label: 'Texture', key: 'texture' },
        { label: 'Uses', key: 'uses' },
        { label: 'Harvest Season', key: 'harvestSeason' },
        { label: 'Hardiness Zone', key: 'hardiness' },
        { label: 'Storage Period', key: 'storage' }
      ]
    }
  ];

  return (
    <div className="apple-disp-overlay">
      <div className="apple-disp-container">
        <div className="apple-disp-header">
          <h1>🍎 {apple.cultivar_name || apple.name}</h1>
          <div className="header-actions">
            {!isEditing && (
              <button className="download-pdf-btn-header" onClick={handleDownloadPDF} title="Download as PDF">
                <Download size={20} />
              </button>
            )}
            {isAdmin && !isEditing && (
              <button className="edit-mode-btn" onClick={() => setIsEditing(true)}>
                <Edit2 size={20} />
                Edit Mode
              </button>
            )}
            <button className="close-btn" onClick={onClose}>
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="apple-disp-content">
          {/* Left side - Details */}
          <div className="details-section">
            {sections.map((section, idx) => (
              <div key={idx} className="detail-section">
                <h2 className="section-title">{section.title}</h2>
                <table className="details-table">
                  <tbody>
                    {section.fields.map(field => (
                      <tr key={field.key}>
                        <td className="field-name">{field.label}</td>
                        <td className="field-value">
                          {isEditing ? (
                            field.multiline ? (
                              <textarea
                                value={apple[field.key] || ''}
                                onChange={(e) => handleFieldChange(field.key, e.target.value)}
                                rows={3}
                                className="edit-textarea"
                              />
                            ) : (
                              <input
                                type="text"
                                value={apple[field.key] || ''}
                                onChange={(e) => handleFieldChange(field.key, e.target.value)}
                                className="edit-input"
                              />
                            )
                          ) : (
                            apple[field.key] || 'N/A'
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>

          {/* Right side - Images */}
          <div className="images-section">
            <h2 className="section-title">Images</h2>
            
            {isEditing && (
              <div className="image-upload">
                <label htmlFor="image-upload" className="upload-btn">
                  <Upload size={18} />
                  Upload Images
                </label>
                <input
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  style={{ display: 'none' }}
                />
              </div>
            )}

            <div className="images-grid">
              {(() => {
                // Deduplicate images right before rendering as final safety check
                const renderedImages = deduplicateImages(images);
                return renderedImages.map((img, idx) => {
                  // Use the image URL directly - it's already properly formatted
                  const errorCount = imageErrors[idx] || 0;
                
                  return (
                    <div key={`img-${idx}-${img}`} className="image-card">
                      <img 
                        key={`${idx}-${errorCount}-${img}`}
                        src={img}
                        alt={`Apple ${idx + 1}`}
                        onError={(e) => {
                          // If image fails to load, hide it after trying once
                          if (errorCount === 0) {
                            setImageErrors(prev => ({ ...prev, [idx]: 1 }));
                          } else {
                            // Hide image if it fails after retry
                            e.target.style.display = 'none';
                          }
                        }}
                        onLoad={() => {
                          // Clear error count on successful load
                          if (imageErrors[idx]) {
                            setImageErrors(prev => {
                              const newErrors = { ...prev };
                              delete newErrors[idx];
                              return newErrors;
                            });
                          }
                        }}
                      />
                      {isEditing && (
                        <button 
                          className="remove-img-btn"
                          onClick={() => removeImage(idx)}
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>
                  );
                });
              })()}
            </div>

            {images.length === 0 && (
              <div className="no-images">
                <p>No images uploaded yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer with action buttons */}
        <div className="apple-disp-footer">
          {isEditing ? (
            <div className="edit-actions">
              <button className="cancel-btn" onClick={() => setIsEditing(false)}>
                Cancel
              </button>
              <button className="save-btn" onClick={handleSave}>
                <Save size={20} />
                Save Changes
              </button>
            </div>
          ) : (
            <div></div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AppleDisp;