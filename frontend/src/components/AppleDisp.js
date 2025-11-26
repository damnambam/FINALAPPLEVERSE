import React, { useState, useEffect } from 'react';
import { Download, Upload, X, Save, Edit2 } from 'lucide-react';
import './AppleDisp.css';

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";

const AppleDisp = ({ appleData, onClose, isEditing: initialIsEditing = false, isAdmin = false, onSave }) => {
  const [apple, setApple] = useState(appleData || {});
  const [images, setImages] = useState([]);
  const [isEditing, setIsEditing] = useState(initialIsEditing);
  const [imageErrors, setImageErrors] = useState({});
  const [activeTab, setActiveTab] = useState('all');

  // ===========================
  // Helper to get field value from multiple sources
  // ===========================
  const getFieldValue = (fieldKey) => {
    if (!apple) return '';
    
    // 1. Check top-level field directly
    if (apple[fieldKey] !== undefined && apple[fieldKey] !== null && apple[fieldKey] !== '') {
      return apple[fieldKey];
    }
    
    // 2. Check metadata object
    const metadata = apple.metadata || {};
    let metadataObj = metadata;
    if (metadata instanceof Map) {
      metadataObj = Object.fromEntries(metadata);
    } else if (metadata._doc) {
      metadataObj = metadata._doc;
    }
    
    // Special mappings for common field name mismatches
    const specialMappings = {
      'cultivar_name': ['CULTIVAR_NAME', 'CULTIVAR NAME', 'Cultivar Name', 'name', 'NAME'],
      'accession': ['ACCESSION', 'Accession', 'accession'],
      'site_id': ['SITE ID', 'SITE_ID', 'Site ID'],
      'prefix_acp': ['PREFIX (ACP)', 'PREFIX_ACP', 'PREFIX ACP'],
      'acno': ['ACNO', 'Acno', 'AC NO'],
      'label_name': ['LABEL NAME', 'LABEL_NAME', 'Label Name'],
      'family': ['FAMILY', 'Family'],
      'genus': ['GENUS', 'Genus', 'e_genus'],
      'species': ['SPECIES', 'Species', 'e_species'],
      'taxon': ['TAXON', 'Taxon'],
      'plant_type': ['PLANT TYPE', 'PLANT_TYPE', 'Plant Type'],
      'life_form': ['LIFE FORM', 'LIFE_FORM', 'Life Form'],
      'pedigree_description': ['PEDIGREE DESCRIPTION', 'PEDIGREE_DESCRIPTION'],
      'country': ['COUNTRY', 'Country', 'e_origin_country'],
      'province_state': ['PROVINCE/STATE', 'PROVINCE_STATE', 'Province/State'],
      'habitat': ['HABITAT', 'Habitat'],
      'location_section_1': ['LOCATION SECTION 1', 'LOCATION_SECTION_1'],
      'location_section_2': ['LOCATION SECTION 2', 'LOCATION_SECTION_2'],
      'location_section_3': ['LOCATION SECTION 3', 'LOCATION_SECTION_3'],
      'location_section_4': ['LOCATION SECTION 4', 'LOCATION_SECTION_4'],
      'breeder_or_collector': ['BREEDER OR COLLECTOR', 'BREEDER_OR_COLLECTOR'],
      'cooperator': ['COOPERATOR', 'Cooperator'],
      'cooperator_new': ['COOPERATOR_NEW', 'COOPERATOR NEW'],
      'inventory_type': ['INVENTORY TYPE', 'INVENTORY_TYPE'],
      'inventory_maintenance_policy': ['INVENTORY MAINTENANCE POLICY', 'INVENTORY_MAINTENANCE_POLICY'],
      'is_distributable': ['IS DISTRIBUTABLE?', 'IS_DISTRIBUTABLE'],
      'availability_status': ['AVAILABILITY STATUS', 'AVAILABILITY_STATUS'],
      'ipr_type': ['IPR TYPE', 'IPR_TYPE'],
      'level_of_improvement': ['LEVEL OF IMPROVEMENT', 'LEVEL_OF_IMPROVEMENT'],
      'released_date': ['RELEASED DATE', 'RELEASED_DATE'],
      'released_date_format': ['RELEASED DATE FORMAT', 'RELEASED_DATE_FORMAT'],
      'fruitshape_115057': ['FRUITSHAPE 115057', 'FRUITSHAPE_115057', 'Fruit Shape'],
      'fruitlgth_115156': ['FRUITLGTH 115156', 'FRUITLGTH_115156'],
      'fruitwidth_115157': ['FRUITWIDTH 115157', 'FRUITWIDTH_115157'],
      'frtweight_115121': ['FRTWEIGHT 115121', 'FRTWEIGHT_115121'],
      'frtstemthk_115127': ['FRTSTEMTHK 115127', 'FRTSTEMTHK_115127'],
      'frttexture_115123': ['FRTTEXTURE 115123', 'FRTTEXTURE_115123'],
      'frtstmlgth_115158': ['FRTSTMLGTH 115158', 'FRTSTMLGTH_115158'],
      'frtflshoxi_115129': ['FRTFLSHOXI 115129', 'FRTFLSHOXI_115129'],
      'colour': ['COLOUR', 'Colour', 'COLOR', 'Color'],
      'density': ['DENSITY', 'Density'],
      'seedcolor_115086': ['SEEDCOLOR 115086', 'SEEDCOLOR_115086'],
      'ssize_quantity_of_seed': ['SSIZE Quantity of Seed', 'SSIZE_QUANTITY_OF_SEED'],
      'seedlength_115163': ['SEEDLENGTH 115163', 'SEEDLENGTH_115163'],
      'seedwidth_115164': ['SEEDWIDTH 115164', 'SEEDWIDTH_115164'],
      'seednumber_115087': ['SEEDNUMBER 115087', 'SEEDNUMBER_115087'],
      'seedshape_115167': ['SEEDSHAPE 115167', 'SEEDSHAPE_115167'],
      'first_bloom_date': ['FIRST BLOOM DATE', 'FIRST_BLOOM_DATE'],
      'full_bloom_date': ['FULL BLOOM DATE', 'FULL_BLOOM_DATE'],
      'fireblight_rating': ['FIREBLIGHT RATING', 'FIREBLIGHT_RATING'],
      'cmt': ['CMT', 'Cmt', 'Comments', 'COMMENTS'],
      'narativekeyword': ['NARATIVEKEYWORD', 'NarativeKeyword', 'NARRATIVE KEYWORD'],
      'full_narative': ['FULL NARATIVE', 'FULL_NARATIVE', 'FULL NARRATIVE'],
    };
    
    // Try special mappings first
    if (specialMappings[fieldKey]) {
      for (const variant of specialMappings[fieldKey]) {
        if (metadataObj[variant] !== undefined && metadataObj[variant] !== null && metadataObj[variant] !== '') {
          return metadataObj[variant];
        }
      }
    }
    
    // Try case-insensitive search
    const lowerFieldKey = fieldKey.toLowerCase().replace(/[^a-z0-9]/g, '');
    for (const [key, value] of Object.entries(metadataObj)) {
      const normalizedKey = key.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (normalizedKey === lowerFieldKey && value !== undefined && value !== null && value !== '') {
        return value;
      }
    }
    
    return '';
  };

  // ===========================
  // FIXED: Properly encode image URLs with spaces
  // ===========================
  const encodeImageUrl = (imgPath) => {
    // If already a full URL with http, handle it
    if (imgPath.startsWith('http://') || imgPath.startsWith('https://')) {
      return imgPath;
    }
    
    // Split into path parts
    const parts = imgPath.split('/').filter(p => p);
    
    // Encode each part (especially the filename which may have spaces)
    const encodedParts = parts.map((part, index) => {
      // Only encode the filename (last part), keep 'images' as-is
      if (index === parts.length - 1) {
        return encodeURIComponent(part);
      }
      return part;
    });
    
    return `${API_BASE}/${encodedParts.join('/')}`;
  };

  // Normalize for deduplication
  const normalizeForDedup = (url) => {
    try {
      let decoded = decodeURIComponent(url);
      return decoded.toLowerCase().split('/').pop().replace(/[^a-z0-9.]/g, '');
    } catch {
      return url.toLowerCase().split('/').pop().replace(/[^a-z0-9.]/g, '');
    }
  };

  // ===========================
  // Load images when appleData changes
  // ===========================
  useEffect(() => {
    if (!appleData) return;
    
    setApple(appleData);
    setImageErrors({});
    
    const loadImages = async () => {
      const accession = getFieldValue('accession');
      
      if (!accession) {
        console.log('No accession found, cannot load images');
        setImages([]);
        return;
      }
      
      console.log(`🔍 Fetching images for accession: ${accession}`);
      
      try {
        const response = await fetch(`${API_BASE}/api/apples/find-image/${encodeURIComponent(accession)}`);
        const data = await response.json();
        
        console.log('📷 API Response:', data);
        
        if (data.success && data.images && data.images.length > 0) {
          // Encode URLs and deduplicate
          const seen = new Set();
          const uniqueImages = [];
          
          data.images.forEach(imgPath => {
            const encodedUrl = encodeImageUrl(imgPath);
            const normalized = normalizeForDedup(imgPath);
            
            if (!seen.has(normalized)) {
              seen.add(normalized);
              uniqueImages.push(encodedUrl);
            }
          });
          
          console.log(`✅ Loaded ${uniqueImages.length} unique images`);
          setImages(uniqueImages);
        } else {
          console.log('No images found for this accession');
          setImages([]);
        }
      } catch (error) {
        console.error('❌ Error fetching images:', error);
        setImages([]);
      }
    };
    
    loadImages();
  }, [appleData]);

  // Handle field change
  const handleFieldChange = (field, value) => {
    setApple(prev => ({ ...prev, [field]: value }));
  };

  // Handle image upload - PROPER FILE UPLOAD
const handleImageUpload = async (e) => {
  const files = Array.from(e.target.files);
  
  for (const file of files) {
    const formData = new FormData();
    formData.append('image', file);
    
    try {
      console.log(`📤 Uploading: ${file.name}`);
      
      const response = await fetch(`${API_BASE}/api/apples/upload-image`, {
        method: 'POST',
        body: formData // Don't set Content-Type header - browser does it automatically
      });
      
      const data = await response.json();
      
      if (data.success) {
        setImages(prev => [...prev, data.imagePath]);
        console.log('✅ Image uploaded:', data.imagePath);
      } else {
        alert('Failed to upload image: ' + data.error);
      }
    } catch (error) {
      console.error('❌ Upload failed:', error);
      alert('Failed to upload image: ' + error.message);
    }
  }
};
  // Remove image
const removeImage = async (index) => {
  const imageToRemove = images[index];
  
  // Confirm deletion
  if (!window.confirm('Are you sure you want to delete this image? This cannot be undone.')) {
    return;
  }
  
  try {
    // Extract filename from path (e.g., "/images/Ambrosia_MAL0001.jpg" → "Ambrosia_MAL0001.jpg")
    const filename = imageToRemove.split('/').pop();
    
    // Call backend to delete the physical file
    const response = await fetch(`${API_BASE}/api/apples/image/${encodeURIComponent(filename)}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
      }
    });
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to delete image');
    }
    
    // Remove from local state
    setImages(prev => prev.filter((_, i) => i !== index));
    console.log(`✅ Deleted image: ${filename}`);
    
  } catch (error) {
    console.error('❌ Error deleting image:', error);
    alert(`Failed to delete image: ${error.message}`);
  }
};

 // Handle save
const handleSave = async () => {
  try {
    const appleId = apple._id || apple.id;
    
    if (!appleId) {
      alert('Cannot save: Apple record has no ID');
      return;
    }

    console.log('💾 Saving apple with images:', images.length);

    // Include the updated images in the apple object
    const updatedApple = {
      ...apple,
      images: images,  // ← Add the images array
      images_count: images.length
    };

    // Send to backend
    const response = await fetch(`${API_BASE}/api/apples/${appleId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
      },
      body: JSON.stringify(updatedApple)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to save changes');
    }

    const savedApple = await response.json();
    console.log('✅ Save successful:', savedApple);
    
    // Update parent component
    if (onSave) onSave(savedApple.apple || savedApple);
    
    setIsEditing(false);
    alert('Changes saved successfully!');
  } catch (error) {
    console.error('❌ Save error:', error);
    alert(`Failed to save: ${error.message}`);
  }
};

  // Category data for display
  const categoryData = {
    identity: {
      title: 'Identity',
      fields: [
        { label: 'Site ID', key: 'site_id' },
        { label: 'Prefix (ACP)', key: 'prefix_acp' },
        { label: 'ACNO', key: 'acno' },
        { label: 'Accession', key: 'accession' },
        { label: 'Cultivar Name', key: 'cultivar_name' },
        { label: 'Label Name', key: 'label_name' }
      ]
    },
    taxonomy: {
      title: 'Taxonomy',
      fields: [
        { label: 'Family', key: 'family' },
        { label: 'Genus', key: 'genus' },
        { label: 'Species', key: 'species' },
        { label: 'Taxon', key: 'taxon' },
        { label: 'Plant Type', key: 'plant_type' },
        { label: 'Life Form', key: 'life_form' },
        { label: 'Pedigree Description', key: 'pedigree_description' }
      ]
    },
    geography: {
      title: 'Geography',
      fields: [
        { label: 'Country', key: 'country' },
        { label: 'Province/State', key: 'province_state' },
        { label: 'Habitat', key: 'habitat' },
        { label: 'Location Section 1', key: 'location_section_1' },
        { label: 'Location Section 2', key: 'location_section_2' },
        { label: 'Location Section 3', key: 'location_section_3' },
        { label: 'Location Section 4', key: 'location_section_4' }
      ]
    },
    people: {
      title: 'People',
      fields: [
        { label: 'Breeder or Collector', key: 'breeder_or_collector' },
        { label: 'Cooperator', key: 'cooperator' },
        { label: 'Cooperator New', key: 'cooperator_new' }
      ]
    },
    inventory: {
      title: 'Inventory',
      fields: [
        { label: 'Inventory Type', key: 'inventory_type' },
        { label: 'Inventory Maintenance Policy', key: 'inventory_maintenance_policy' },
        { label: 'Is Distributable?', key: 'is_distributable' }
      ]
    },
    status: {
      title: 'Status',
      fields: [
        { label: 'Availability Status', key: 'availability_status' },
        { label: 'IPR Type', key: 'ipr_type' },
        { label: 'Level of Improvement', key: 'level_of_improvement' },
        { label: 'Released Date', key: 'released_date' },
        { label: 'Released Date Format', key: 'released_date_format' }
      ]
    },
    fruit: {
      title: 'Fruit',
      fields: [
        { label: 'Fruit Shape', key: 'fruitshape_115057' },
        { label: 'Fruit Length', key: 'fruitlgth_115156' },
        { label: 'Fruit Width', key: 'fruitwidth_115157' },
        { label: 'Fruit Weight', key: 'frtweight_115121' },
        { label: 'Fruit Stem Thickness', key: 'frtstemthk_115127' },
        { label: 'Fruit Texture', key: 'frttexture_115123' },
        { label: 'Fruit Stem Length', key: 'frtstmlgth_115158' },
        { label: 'Fruit Flesh Oxidation', key: 'frtflshoxi_115129' },
        { label: 'Colour', key: 'colour' },
        { label: 'Density', key: 'density' }
      ]
    },
    seed: {
      title: 'Seed',
      fields: [
        { label: 'Seed Color', key: 'seedcolor_115086' },
        { label: 'Seed Size', key: 'ssize_quantity_of_seed' },
        { label: 'Seed Length', key: 'seedlength_115163' },
        { label: 'Seed Width', key: 'seedwidth_115164' },
        { label: 'Seed Number', key: 'seednumber_115087' },
        { label: 'Seed Shape', key: 'seedshape_115167' }
      ]
    },
    phenology: {
      title: 'Phenology',
      fields: [
        { label: 'First Bloom Date', key: 'first_bloom_date' },
        { label: 'Full Bloom Date', key: 'full_bloom_date' },
        { label: 'Fireblight Rating', key: 'fireblight_rating' }
      ]
    },
    descriptive: {
      title: 'Descriptive',
      fields: [
        { label: 'Comments', key: 'cmt', multiline: true },
        { label: 'Narrative Keyword', key: 'narativekeyword', multiline: true },
        { label: 'Full Narrative', key: 'full_narative', multiline: true }
      ]
    }
  };

  // ===========================
  // Download PDF with embedded images
  // ===========================
  const handleDownloadPDF = async () => {
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF();
    
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.height;
    const margin = 20;
    const lineHeight = 7;
    
    let yPosition = 20;
    
    // Title
    doc.setFontSize(20);
    doc.setTextColor(231, 111, 81);
    doc.text(`Apple Variety: ${getFieldValue('cultivar_name') || 'Unknown'}`, margin, yPosition);
    yPosition += 10;
    
    doc.setFontSize(12);
    doc.setTextColor(52, 73, 94);
    doc.text(`Accession: ${getFieldValue('accession')}`, margin, yPosition);
    yPosition += 8;
    
    doc.setDrawColor(231, 111, 81);
    doc.setLineWidth(0.5);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 10;
    
    // Add section helper
    const addSection = (title, fields) => {
      const nonEmptyFields = fields.filter(f => {
        const value = getFieldValue(f.key);
        return value && value !== 'N/A' && String(value).trim() !== '';
      });
      
      if (nonEmptyFields.length === 0) return;
      
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
      
      nonEmptyFields.forEach(field => {
        if (yPosition > pageHeight - 20) {
          doc.addPage();
          yPosition = 20;
        }
        const value = getFieldValue(field.key);
        const text = `${field.label}: ${value}`;
        const splitText = doc.splitTextToSize(text, pageWidth - 2 * margin - 10);
        splitText.forEach(line => {
          if (yPosition > pageHeight - 20) {
            doc.addPage();
            yPosition = 20;
          }
          doc.text(line, margin + 5, yPosition);
          yPosition += lineHeight;
        });
      });
      yPosition += 5;
    };
    
    // Add all sections
    Object.values(categoryData).forEach(category => {
      addSection(category.title, category.fields);
    });
    
    // ===== Add images =====
    if (images && images.length > 0) {
      doc.addPage();
      yPosition = 20;
      
      doc.setFontSize(14);
      doc.setTextColor(44, 62, 80);
      doc.text('Images', margin, yPosition);
      yPosition += 15;
      
      // Fetch and embed each image
      const loadImageAsBase64 = (imgUrl) => {
        return new Promise((resolve) => {
          if (imgUrl.startsWith('data:')) {
            resolve({ success: true, data: imgUrl, width: 400, height: 300 });
            return;
          }
          
          fetch(imgUrl, { mode: 'cors' })
            .then(res => res.blob())
            .then(blob => {
              const reader = new FileReader();
              reader.onloadend = () => {
                const img = new Image();
                img.onload = () => {
                  resolve({
                    success: true,
                    data: reader.result,
                    width: img.naturalWidth || 400,
                    height: img.naturalHeight || 300
                  });
                };
                img.onerror = () => {
                  resolve({ success: true, data: reader.result, width: 400, height: 300 });
                };
                img.src = reader.result;
              };
              reader.readAsDataURL(blob);
            })
            .catch(() => resolve({ success: false }));
        });
      };
      
      let imageCount = 0;
      const maxWidth = pageWidth - 2 * margin;
      const maxHeight = 100;
      
      for (let i = 0; i < Math.min(images.length, 20); i++) {
        const result = await loadImageAsBase64(images[i]);
        
        if (!result.success) continue;
        
        imageCount++;
        
        let imgWidth = result.width;
        let imgHeight = result.height;
        
        if (imgWidth > maxWidth) {
          imgHeight = imgHeight * (maxWidth / imgWidth);
          imgWidth = maxWidth;
        }
        if (imgHeight > maxHeight) {
          imgWidth = imgWidth * (maxHeight / imgHeight);
          imgHeight = maxHeight;
        }
        
        if (yPosition + imgHeight + 20 > pageHeight - 20) {
          doc.addPage();
          yPosition = 20;
        }
        
        try {
          doc.addImage(result.data, 'JPEG', margin, yPosition, imgWidth, imgHeight);
          yPosition += imgHeight + 5;
          doc.setFontSize(9);
          doc.setTextColor(100, 100, 100);
          doc.text(`Image ${imageCount}`, margin, yPosition);
          yPosition += 12;
        } catch (e) {
          console.error('Error adding image to PDF:', e);
        }
      }
    }
    
    const filename = `${getFieldValue('cultivar_name') || 'apple'}_${getFieldValue('accession') || 'unknown'}.pdf`;
    doc.save(filename.replace(/[^a-zA-Z0-9_-]/g, '_'));
  };

  const tabs = [
    { id: 'all', label: 'All' },
    ...Object.entries(categoryData).map(([key, data]) => ({
      id: key,
      label: data.title
    }))
  ];

  const renderFields = (fields) => (
    <table className="details-table">
      <tbody>
        {fields.map(field => {
          const value = getFieldValue(field.key);
          return (
            <tr key={field.key}>
              <td className="field-name">{field.label}</td>
              <td className="field-value">
                {isEditing ? (
                  field.multiline ? (
                    <textarea
                      value={value || ''}
                      onChange={(e) => handleFieldChange(field.key, e.target.value)}
                      rows={4}
                      className="edit-textarea"
                    />
                  ) : (
                    <input
                      type="text"
                      value={value || ''}
                      onChange={(e) => handleFieldChange(field.key, e.target.value)}
                      className="edit-input"
                    />
                  )
                ) : (
                  value || 'N/A'
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );

  return (
    <div className="apple-disp-overlay">
      <div className="apple-disp-container">
        {/* Header */}
        <div className="apple-disp-header">
          <h1>{getFieldValue('cultivar_name') || 'Unknown Apple'}</h1>
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

        {/* Tabs */}
        <div className="apple-tabs">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="tab-label">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="apple-disp-content">
          <div className="details-section">
            {activeTab === 'all' ? (
              Object.entries(categoryData).map(([key, category]) => (
                <div key={key} className="detail-section">
                  <h2 className="section-title">{category.title}</h2>
                  {renderFields(category.fields)}
                </div>
              ))
            ) : (
              <div className="detail-section">
                <h2 className="section-title">{categoryData[activeTab].title}</h2>
                {renderFields(categoryData[activeTab].fields)}
              </div>
            )}
          </div>

          {/* Images Section */}
          <div className="images-section">
            <h2 className="section-title">Images ({images.length})</h2>
            
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
              {images.map((img, idx) => (
                <div key={`img-${idx}`} className="image-card">
                  <img 
                    src={img}
                    alt={`Apple ${idx + 1}`}
                    onError={(e) => {
                      console.error(`Failed to load image: ${img}`);
                      e.target.style.display = 'none';
                    }}
                    onLoad={() => console.log(`✅ Loaded: ${img}`)}
                  />
                  {isEditing && (
                    <button className="remove-img-btn" onClick={() => removeImage(idx)}>
                      <X size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {images.length === 0 && (
              <div className="no-images">
                <p>No images found for this apple</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="apple-disp-footer">
          {isEditing && (
            <div className="edit-actions">
              <button className="cancel-btn" onClick={() => setIsEditing(false)}>
                Cancel
              </button>
              <button className="save-btn" onClick={handleSave}>
                <Save size={20} />
                Save Changes
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AppleDisp;