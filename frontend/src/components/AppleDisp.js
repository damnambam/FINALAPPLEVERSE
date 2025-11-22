import React, { useState, useEffect } from 'react';
import { Download, Upload, X, Save, Edit2 } from 'lucide-react';
import './AppleDisp.css';

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";

const AppleDisp = ({ appleData, onClose, isEditing: initialIsEditing = false, isAdmin = false, onSave }) => {
  const [apple, setApple] = useState(appleData || {});
  const [images, setImages] = useState([]);
  const [isEditing, setIsEditing] = useState(initialIsEditing);
  const [activeTab, setActiveTab] = useState('all');

  // Initialize images from appleData
  useEffect(() => {
    if (appleData) {
      setApple(appleData);
      
      // Get images from the apple data
      if (appleData.images && Array.isArray(appleData.images)) {
        const formattedImages = appleData.images.map(img => {
          // If it's a path, prepend API_BASE
          if (img.startsWith('/images/') || img.startsWith('/data/')) {
            return `${API_BASE}${img}`;
          }
          // Otherwise assume it's a full URL
          return img;
        });
        setImages(formattedImages);
      } else {
        setImages([]); // Empty array if no images
      }
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
    
    let yPosition = 20;
    const lineHeight = 7;
    const pageHeight = doc.internal.pageSize.height;
    const pageWidth = doc.internal.pageSize.width;
    
    // Title
    doc.setFontSize(20);
    doc.setTextColor(231, 111, 81);
    doc.text(`Apple Variety: ${apple.cultivar_name || apple.name}`, 20, yPosition);
    yPosition += 15;
    
    // Add a line
    doc.setDrawColor(231, 111, 81);
    doc.setLineWidth(0.5);
    doc.line(20, yPosition, 190, yPosition);
    yPosition += 10;
    
    // Helper function to add section
    const addSection = (title, data) => {
      // Filter out empty values
      const nonEmptyData = Object.entries(data).filter(([key, value]) => 
        value && value !== 'N/A' && value.toString().trim() !== ''
      );
      
      // Skip section if no data
      if (nonEmptyData.length === 0) return;
      
      if (yPosition > pageHeight - 40) {
        doc.addPage();
        yPosition = 20;
      }
      
      doc.setFontSize(14);
      doc.setTextColor(44, 62, 80);
      doc.text(title, 20, yPosition);
      yPosition += lineHeight;
      
      doc.setFontSize(10);
      doc.setTextColor(85, 85, 85);
      
      nonEmptyData.forEach(([key, value]) => {
        if (yPosition > pageHeight - 20) {
          doc.addPage();
          yPosition = 20;
        }
        const formattedKey = key.replace(/_/g, ' ').toUpperCase();
        const text = `${formattedKey}: ${value}`;
        
        // Handle long text with wrapping
        const splitText = doc.splitTextToSize(text, pageWidth - 45);
        splitText.forEach(line => {
          if (yPosition > pageHeight - 20) {
            doc.addPage();
            yPosition = 20;
          }
          doc.text(line, 25, yPosition);
          yPosition += lineHeight;
        });
      });
      
      yPosition += 5;
    };
    
    // Add all sections
    Object.values(categoryData).forEach(category => {
      const data = {};
      category.fields.forEach(field => {
        const value = apple[field.key];
        if (value && value !== 'N/A' && value.toString().trim() !== '') {
          data[field.label] = value;
        }
      });
      addSection(category.title, data);
    });
    
    // Add images section
    if (images && images.length > 0) {
      doc.addPage();
      yPosition = 20;
      
      doc.setFontSize(14);
      doc.setTextColor(44, 62, 80);
      doc.text('Images', 20, yPosition);
      yPosition += 15;
      
      for (let i = 0; i < images.length; i++) {
        try {
          const img = images[i];
          
          // Create a temporary image element to get original dimensions
          const tempImg = new Image();
          tempImg.src = img;
          
          await new Promise((resolve) => {
            tempImg.onload = () => resolve();
            tempImg.onerror = () => resolve(); // Continue even if image fails
          });
          
          const originalWidth = tempImg.width;
          const originalHeight = tempImg.height;
          
          // Calculate dimensions to fit within page (max width: 170, maintain aspect ratio)
          const maxWidth = pageWidth - 40; // Leave margins
          const maxHeight = 200; // Maximum height for images
          
          let imgWidth = originalWidth;
          let imgHeight = originalHeight;
          
          // Scale down if too wide
          if (imgWidth > maxWidth) {
            const ratio = maxWidth / imgWidth;
            imgWidth = maxWidth;
            imgHeight = imgHeight * ratio;
          }
          
          // Scale down if too tall
          if (imgHeight > maxHeight) {
            const ratio = maxHeight / imgHeight;
            imgHeight = maxHeight;
            imgWidth = imgWidth * ratio;
          }
          
          // Check if we need a new page
          if (yPosition + imgHeight > pageHeight - 20) {
            doc.addPage();
            yPosition = 20;
          }
          
          // Add image
          doc.addImage(img, 'JPEG', 20, yPosition, imgWidth, imgHeight);
          yPosition += imgHeight + 10;
          
          // Add caption
          doc.setFontSize(10);
          doc.setTextColor(85, 85, 85);
          doc.text(`Image ${i + 1}`, 20, yPosition);
          yPosition += 15;
        } catch (error) {
          console.error('Error adding image to PDF:', error);
        }
      }
    }
    
    // Save the PDF
    doc.save(`${apple.cultivar_name || apple.name}_Details_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  // Define categories matching Template Creator
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
        { label: 'Genus', key: 'e genus' },
        { label: 'Species', key: 'e species' },
        { label: 'Taxon', key: 'taxon' },
        { label: 'Plant Type', key: 'plant_type' },
        { label: 'Life Form', key: 'life_form' },
        { label: 'Pedigree Description', key: 'e pedigree' }
      ]
    },
    geography: {
      title: 'Geography',
      fields: [
        { label: 'Country', key: 'e origin country' },
        { label: 'Province/State', key: 'e origin province' },
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
        { label: 'Breeder or Collector', key: 'e breeder' },
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
    metadata: {
      title: 'Metadata',
      fields: [
        { label: 'Comments', key: 'cmt', multiline: true },
        { label: 'Narrative Keyword', key: 'narativekeyword', multiline: true },
        { label: 'Full Narrative', key: 'full_narative', multiline: true },
        { label: 'Images', key: 'images_field' }
      ]
    }
  };

  // Tabs configuration
  const tabs = [
    { id: 'all', label: 'All' },
    ...Object.entries(categoryData).map(([key, data]) => ({
      id: key,
      label: data.title
    }))
  ];

  // Render fields for a category
  const renderFields = (fields) => (
    <table className="details-table">
      <tbody>
        {fields.map(field => {
          const value = apple[field.key];
          
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
          <h1>{apple.cultivar_name || apple.name}</h1>
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
              // Show all categories
              Object.entries(categoryData).map(([key, category]) => (
                <div key={key} className="detail-section">
                  <h2 className="section-title">{category.title}</h2>
                  {renderFields(category.fields)}
                </div>
              ))
            ) : (
              // Show selected category
              <div className="detail-section">
                <h2 className="section-title">{categoryData[activeTab].title}</h2>
                {renderFields(categoryData[activeTab].fields)}
              </div>
            )}
          </div>

          {/* Images Section - Always visible */}
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
              {images.map((img, idx) => (
                <div key={idx} className="image-card">
                  <img src={img} alt={`Apple ${idx + 1}`} />
                  {isEditing && (
                    <button 
                      className="remove-img-btn"
                      onClick={() => removeImage(idx)}
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {images.length === 0 && (
              <div className="no-images">
                <p>No images uploaded yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
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