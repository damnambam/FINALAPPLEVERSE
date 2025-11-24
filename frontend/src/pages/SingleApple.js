import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Save, X, Image as ImageIcon, Plus, Trash2, ChevronDown, ChevronUp, Info, CheckCircle2, AlertCircle } from 'lucide-react';
import './SingleApple.css';

export default function SingleApple() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // Mandatory fields
  const [accession, setAccession] = useState('');
  const [cultivarName, setCultivarName] = useState('');

  // Template fields
  const [appleData, setAppleData] = useState({
    // Core Identification
    site_id: '',
    prefix_acp: '',
    acno: '',
    label_name: '',
    // Taxonomic Information
    family: 'Rosaceae',
    genus: 'Malus',
    species: 'domestica',
    taxon: '',
    // Origin and Location
    country: '',
    province_state: '',
    habitat: '',
    location_section_1: '',
    location_section_2: '',
    location_section_3: '',
    location_section_4: '',
    // People and Organizations
    breeder_or_collector: '',
    cooperator: '',
    cooperator_new: '',
    // Plant Classification
    inventory_type: '',
    inventory_maintenance_policy: '',
    plant_type: 'apple',
    life_form: '',
    is_distributable: '',
    // Fruit Characteristics
    fruitshape_115057: '',
    fruitlgth_115156: '',
    fruitwidth_115157: '',
    frtweight_115121: '',
    frtstemthk_115127: '',
    frttexture_115123: '',
    frtstmlgth_115158: '',
    frtflshoxi_115129: '',
    // Seed Characteristics
    seedcolor_115086: '',
    ssize_quantity_of_seed: '',
    seedlength_115163: '',
    seedwidth_115164: '',
    seednumber_115087: '',
    seedshape_115167: '',
    // Phenology
    first_bloom_date: '',
    full_bloom_date: '',
    // Visual and Quality Traits
    colour: '',
    density: '',
    fireblight_rating: '',
    // Descriptive Information
    cmt: '',
    narativekeyword: '',
    full_narative: '',
    pedigree_description: '',
    // Status and Release Information
    availability_status: '',
    ipr_type: '',
    level_of_improvement: '',
    released_date: '',
    released_date_format: ''
  });

  // Custom fields
  const [customFields, setCustomFields] = useState([{ fieldName: '', fieldValue: '' }]);

  // Collapsible sections state
  const [expandedSections, setExpandedSections] = useState({
    mandatory: true,
    identification: false,
    taxonomic: false,
    location: false,
    people: false,
    classification: false,
    fruit: false,
    seed: false,
    phenology: false,
    quality: false,
    descriptive: false,
    status: false,
    custom: false,
    images: false
  });

  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Toggle section expansion
  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setAppleData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };

  // Add new custom field row
  const addCustomField = () => {
    setCustomFields([...customFields, { fieldName: '', fieldValue: '' }]);
  };

  // Remove custom field row
  const removeCustomField = (index) => {
    const updated = customFields.filter((_, i) => i !== index);
    setCustomFields(updated);
  };

  // Handle custom field changes
  const handleCustomFieldChange = (index, field, value) => {
    const updated = [...customFields];
    updated[index][field] = value;
    setCustomFields(updated);
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if ((images.length + files.length) > 10) {
      setError('Maximum 10 images allowed');
      e.target.value = '';
      return;
    }

    if (!accession) {
      setError('Please enter Accession Number first to upload images');
      e.target.value = '';
      return;
    }

    const startIndex = images.length;
    const renamedFiles = files.map((file, index) => {
      const extension = file.name.split('.').pop();
      const newName = `${accession}_${startIndex + index + 1}.${extension}`;
      return new File([file], newName, { type: file.type });
    });

    const newFiles = [...images, ...renamedFiles];
    setImages(newFiles);

    const newPreviews = files.map(file => URL.createObjectURL(file));
    setImagePreviews(prevPreviews => [...prevPreviews, ...newPreviews]);
    setError('');
    e.target.value = '';
  };

  const removeImage = (index) => {
    const newImages = images.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    URL.revokeObjectURL(imagePreviews[index]);
    setImages(newImages);
    setImagePreviews(newPreviews);
    if (newImages.length === 0 && fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!accession.trim()) {
      setError('❌ Accession is required');
      return;
    }

    if (!cultivarName.trim()) {
      setError('❌ Cultivar Name is required');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    const formData = new FormData();

    // Combine all data
    const submitData = {
      accession: accession.trim(),
      cultivar_name: cultivarName.trim(),
      ...appleData
    };

    // Add custom fields
    const validCustomFields = customFields.filter(
      cf => cf.fieldName.trim() && cf.fieldValue.trim()
    );

    if (validCustomFields.length > 0) {
      const customFieldsObj = {};
      validCustomFields.forEach(cf => {
        customFieldsObj[cf.fieldName.trim()] = cf.fieldValue.trim();
      });
      submitData.customFields = customFieldsObj;
    }

    formData.append('appleData', JSON.stringify(submitData));
    images.forEach(image => {
      formData.append('images', image);
    });

    try {
      // Get admin token from localStorage
      const adminToken = localStorage.getItem('adminToken');
      
      if (!adminToken) {
        setError('❌ You must be logged in as admin to upload apples.');
        setLoading(false);
        setTimeout(() => navigate('/signup-login'), 2000);
        return;
      }

      // Make the API call
      const response = await axios.post('http://localhost:5000/api/apples/single-upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${adminToken}`
        }
      });

      setSuccess(`✅ Successfully created ${response.data.apple.cultivar_name}!`);
      imagePreviews.forEach(url => URL.revokeObjectURL(url));
      
      setTimeout(() => {
        navigate('/library');
      }, 2000);

    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to create apple.';
      setError(`❌ ${errorMessage}`);
      console.error('Single upload error:', err);
      
    } finally {
      setLoading(false);
    }
  };

  // Section explanations
  const sectionInfo = {
    mandatory: "Required fields that must be filled for every apple entry. These serve as unique identifiers.",
    identification: "Core identification codes and labels used for cataloging and tracking apple varieties.",
    taxonomic: "Scientific classification information including family, genus, and species.",
    location: "Geographic origin and location details where the variety was discovered or cultivated.",
    people: "Information about breeders, collectors, and organizations involved with this variety.",
    classification: "Plant classification details including inventory type and distribution status.",
    fruit: "Detailed physical measurements and characteristics of the fruit.",
    seed: "Seed characteristics including color, size, shape, and quantity.",
    phenology: "Timing of biological events such as bloom dates throughout the growing season.",
    quality: "Visual appearance and quality traits including color, density, and disease resistance.",
    descriptive: "Narrative descriptions, comments, and pedigree information.",
    status: "Current status, availability, and release information for this variety.",
    custom: "Add your own custom fields with any heading and content you need.",
    images: "Upload high-quality images of the apple variety. Images are automatically renamed based on accession number."
  };

  return (
    <div className="single-apple-container-pro">
      <div className="single-apple-wrapper-pro">
        {/* Header */}
        <div className="header-pro">
          <button
            onClick={() => navigate('/create-apple')}
            type="button"
            className="back-btn-pro"
          >
            <ArrowLeft size={20} /> Back
          </button>
          <div className="header-content-pro">
            <h1 className="main-title-pro">🍎 Create New Apple Variety</h1>
            <p className="subtitle-pro">
              Complete the form below using the standardized template
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="form-pro">
          {/* Alert Messages */}
          {error && (
            <div className="alert-pro alert-error-pro">
              {error}
              <button
                type="button"
                onClick={() => setError('')}
                className="alert-close-pro"
              >
                <X size={18} />
              </button>
            </div>
          )}

          {success && (
            <div className="alert-pro alert-success-pro">
              {success}
            </div>
          )}

          {/* Progress Indicator */}
          <div className="progress-indicator-pro">
            <div className={`progress-step-pro ${accession && cultivarName ? 'active' : ''}`}>
              {accession && cultivarName ? <CheckCircle2 size={24} /> : '1'}
              Required Info
            </div>
            <div className={`progress-step-pro ${Object.values(appleData).some(v => v) ? 'active' : ''}`}>
              2
              Details
            </div>
            <div className={`progress-step-pro ${images.length > 0 ? 'active' : ''}`}>
              3
              Images
            </div>
          </div>

          {/* MANDATORY SECTION */}
          <div className="section-card-pro">
            <div
              className="section-header-pro"
              onClick={() => toggleSection('mandatory')}
            >
              <div className="section-title-wrapper-pro">
                <h2 className="section-title-pro">🔴 REQUIRED Mandatory Fields</h2>
                <button
                  type="button"
                  className="info-btn-pro"
                  onClick={(e) => {
                    e.stopPropagation();
                    alert(sectionInfo.mandatory);
                  }}
                >
                  <Info size={16} />
                </button>
              </div>
              {expandedSections.mandatory ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>

            {expandedSections.mandatory && (
              <div className="section-content-pro">
                <div className="form-grid-pro">
                  <div className="form-group-pro">
                    <label className="label-pro">Accession *</label>
                    <input
                      type="text"
                      value={accession}
                      onChange={(e) => setAccession(e.target.value)}
                      className="input-pro"
                      placeholder="e.g., MAL0100"
                      required
                    />
                    <small>Unique identifier for this apple variety</small>
                  </div>

                  <div className="form-group-pro">
                    <label className="label-pro">Cultivar Name *</label>
                    <input
                      type="text"
                      value={cultivarName}
                      onChange={(e) => setCultivarName(e.target.value)}
                      className="input-pro"
                      placeholder="e.g., Honeycrisp"
                      required
                    />
                    <small>Common name of the apple variety</small>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* CORE IDENTIFICATION */}
          <div className="section-card-pro">
            <div
              className="section-header-pro"
              onClick={() => toggleSection('identification')}
            >
              <div className="section-title-wrapper-pro">
                <h2 className="section-title-pro">📋 Core Identification</h2>
                <button
                  type="button"
                  className="info-btn-pro"
                  onClick={(e) => {
                    e.stopPropagation();
                    alert(sectionInfo.identification);
                  }}
                >
                  <Info size={16} />
                </button>
              </div>
              {expandedSections.identification ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>

            {expandedSections.identification && (
              <div className="section-content-pro">
                <div className="form-grid-pro">
                  <div className="form-group-pro">
                    <label className="label-pro">Site ID</label>
                    <input
                      type="text"
                      name="site_id"
                      value={appleData.site_id}
                      onChange={handleChange}
                      className="input-pro"
                      placeholder="Site ID"
                    />
                  </div>
                  <div className="form-group-pro">
                    <label className="label-pro">Prefix (ACP)</label>
                    <input
                      type="text"
                      name="prefix_acp"
                      value={appleData.prefix_acp}
                      onChange={handleChange}
                      className="input-pro"
                      placeholder="Prefix"
                    />
                  </div>
                  <div className="form-group-pro">
                    <label className="label-pro">ACNO</label>
                    <input
                      type="text"
                      name="acno"
                      value={appleData.acno}
                      onChange={handleChange}
                      className="input-pro"
                      placeholder="ACNO"
                    />
                  </div>
                  <div className="form-group-pro">
                    <label className="label-pro">Label Name</label>
                    <input
                      type="text"
                      name="label_name"
                      value={appleData.label_name}
                      onChange={handleChange}
                      className="input-pro"
                      placeholder="Label name"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* TAXONOMIC INFORMATION */}
          <div className="section-card-pro">
            <div
              className="section-header-pro"
              onClick={() => toggleSection('taxonomic')}
            >
              <div className="section-title-wrapper-pro">
                <h2 className="section-title-pro">🧬 Taxonomic Information</h2>
                <button
                  type="button"
                  className="info-btn-pro"
                  onClick={(e) => {
                    e.stopPropagation();
                    alert(sectionInfo.taxonomic);
                  }}
                >
                  <Info size={16} />
                </button>
              </div>
              {expandedSections.taxonomic ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>

            {expandedSections.taxonomic && (
              <div className="section-content-pro">
                <div className="form-grid-pro">
                  <div className="form-group-pro">
                    <label className="label-pro">Family</label>
                    <input
                      type="text"
                      name="family"
                      value={appleData.family}
                      onChange={handleChange}
                      className="input-pro"
                      placeholder="Rosaceae"
                    />
                  </div>
                  <div className="form-group-pro">
                    <label className="label-pro">Genus</label>
                    <input
                      type="text"
                      name="genus"
                      value={appleData.genus}
                      onChange={handleChange}
                      className="input-pro"
                      placeholder="Malus"
                    />
                  </div>
                  <div className="form-group-pro">
                    <label className="label-pro">Species</label>
                    <input
                      type="text"
                      name="species"
                      value={appleData.species}
                      onChange={handleChange}
                      className="input-pro"
                      placeholder="domestica"
                    />
                  </div>
                  <div className="form-group-pro">
                    <label className="label-pro">Taxon</label>
                    <input
                      type="text"
                      name="taxon"
                      value={appleData.taxon}
                      onChange={handleChange}
                      className="input-pro"
                      placeholder="Taxon"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ORIGIN AND LOCATION */}
          <div className="section-card-pro">
            <div
              className="section-header-pro"
              onClick={() => toggleSection('location')}
            >
              <div className="section-title-wrapper-pro">
                <h2 className="section-title-pro">🌍 Origin and Location</h2>
                <button
                  type="button"
                  className="info-btn-pro"
                  onClick={(e) => {
                    e.stopPropagation();
                    alert(sectionInfo.location);
                  }}
                >
                  <Info size={16} />
                </button>
              </div>
              {expandedSections.location ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>

            {expandedSections.location && (
              <div className="section-content-pro">
                <div className="form-grid-pro">
                  <div className="form-group-pro">
                    <label className="label-pro">Country</label>
                    <input
                      type="text"
                      name="country"
                      value={appleData.country}
                      onChange={handleChange}
                      className="input-pro"
                      placeholder="Country"
                    />
                  </div>
                  <div className="form-group-pro">
                    <label className="label-pro">Province/State</label>
                    <input
                      type="text"
                      name="province_state"
                      value={appleData.province_state}
                      onChange={handleChange}
                      className="input-pro"
                      placeholder="Province or State"
                    />
                  </div>
                  <div className="form-group-pro">
                    <label className="label-pro">Habitat</label>
                    <input
                      type="text"
                      name="habitat"
                      value={appleData.habitat}
                      onChange={handleChange}
                      className="input-pro"
                      placeholder="Habitat"
                    />
                  </div>
                  <div className="form-group-pro">
                    <label className="label-pro">Location Section 1</label>
                    <input
                      type="text"
                      name="location_section_1"
                      value={appleData.location_section_1}
                      onChange={handleChange}
                      className="input-pro"
                      placeholder="Location section 1"
                    />
                  </div>
                  <div className="form-group-pro">
                    <label className="label-pro">Location Section 2</label>
                    <input
                      type="text"
                      name="location_section_2"
                      value={appleData.location_section_2}
                      onChange={handleChange}
                      className="input-pro"
                      placeholder="Location section 2"
                    />
                  </div>
                  <div className="form-group-pro">
                    <label className="label-pro">Location Section 3</label>
                    <input
                      type="text"
                      name="location_section_3"
                      value={appleData.location_section_3}
                      onChange={handleChange}
                      className="input-pro"
                      placeholder="Location section 3"
                    />
                  </div>
                  <div className="form-group-pro">
                    <label className="label-pro">Location Section 4</label>
                    <input
                      type="text"
                      name="location_section_4"
                      value={appleData.location_section_4}
                      onChange={handleChange}
                      className="input-pro"
                      placeholder="Location section 4"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* PEOPLE AND ORGANIZATIONS */}
          <div className="section-card-pro">
            <div
              className="section-header-pro"
              onClick={() => toggleSection('people')}
            >
              <div className="section-title-wrapper-pro">
                <h2 className="section-title-pro">👥 People and Organizations</h2>
                <button
                  type="button"
                  className="info-btn-pro"
                  onClick={(e) => {
                    e.stopPropagation();
                    alert(sectionInfo.people);
                  }}
                >
                  <Info size={16} />
                </button>
              </div>
              {expandedSections.people ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>

            {expandedSections.people && (
              <div className="section-content-pro">
                <div className="form-grid-pro">
                  <div className="form-group-pro">
                    <label className="label-pro">Breeder or Collector</label>
                    <input
                      type="text"
                      name="breeder_or_collector"
                      value={appleData.breeder_or_collector}
                      onChange={handleChange}
                      className="input-pro"
                      placeholder="Name or organization"
                    />
                  </div>
                  <div className="form-group-pro">
                    <label className="label-pro">Cooperator</label>
                    <input
                      type="text"
                      name="cooperator"
                      value={appleData.cooperator}
                      onChange={handleChange}
                      className="input-pro"
                      placeholder="Cooperator name"
                    />
                  </div>
                  <div className="form-group-pro">
                    <label className="label-pro">Cooperator (New)</label>
                    <input
                      type="text"
                      name="cooperator_new"
                      value={appleData.cooperator_new}
                      onChange={handleChange}
                      className="input-pro"
                      placeholder="New cooperator"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* PLANT CLASSIFICATION */}
          <div className="section-card-pro">
            <div
              className="section-header-pro"
              onClick={() => toggleSection('classification')}
            >
              <div className="section-title-wrapper-pro">
                <h2 className="section-title-pro">🌱 Plant Classification</h2>
                <button
                  type="button"
                  className="info-btn-pro"
                  onClick={(e) => {
                    e.stopPropagation();
                    alert(sectionInfo.classification);
                  }}
                >
                  <Info size={16} />
                </button>
              </div>
              {expandedSections.classification ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>

            {expandedSections.classification && (
              <div className="section-content-pro">
                <div className="form-grid-pro">
                  <div className="form-group-pro">
                    <label className="label-pro">Inventory Type</label>
                    <input
                      type="text"
                      name="inventory_type"
                      value={appleData.inventory_type}
                      onChange={handleChange}
                      className="input-pro"
                      placeholder="Inventory type"
                    />
                  </div>
                  <div className="form-group-pro">
                    <label className="label-pro">Inventory Maintenance Policy</label>
                    <input
                      type="text"
                      name="inventory_maintenance_policy"
                      value={appleData.inventory_maintenance_policy}
                      onChange={handleChange}
                      className="input-pro"
                      placeholder="Maintenance policy"
                    />
                  </div>
                  <div className="form-group-pro">
                    <label className="label-pro">Plant Type</label>
                    <input
                      type="text"
                      name="plant_type"
                      value={appleData.plant_type}
                      onChange={handleChange}
                      className="input-pro"
                      placeholder="apple"
                    />
                  </div>
                  <div className="form-group-pro">
                    <label className="label-pro">Life Form</label>
                    <input
                      type="text"
                      name="life_form"
                      value={appleData.life_form}
                      onChange={handleChange}
                      className="input-pro"
                      placeholder="Life form"
                    />
                  </div>
                  <div className="form-group-pro">
                    <label className="label-pro">Is Distributable?</label>
                    <select
                      name="is_distributable"
                      value={appleData.is_distributable}
                      onChange={handleChange}
                      className="input-pro"
                    >
                      <option value="">Select...</option>
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* FRUIT CHARACTERISTICS */}
          <div className="section-card-pro">
            <div
              className="section-header-pro"
              onClick={() => toggleSection('fruit')}
            >
              <div className="section-title-wrapper-pro">
                <h2 className="section-title-pro">🍎 Fruit Characteristics</h2>
                <button
                  type="button"
                  className="info-btn-pro"
                  onClick={(e) => {
                    e.stopPropagation();
                    alert(sectionInfo.fruit);
                  }}
                >
                  <Info size={16} />
                </button>
              </div>
              {expandedSections.fruit ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>

            {expandedSections.fruit && (
              <div className="section-content-pro">
                <div className="form-grid-pro">
                  <div className="form-group-pro">
                    <label className="label-pro">Fruit Shape (115057)</label>
                    <input
                      type="text"
                      name="fruitshape_115057"
                      value={appleData.fruitshape_115057}
                      onChange={handleChange}
                      className="input-pro"
                      placeholder="Shape description"
                    />
                  </div>
                  <div className="form-group-pro">
                    <label className="label-pro">Fruit Length (115156)</label>
                    <input
                      type="text"
                      name="fruitlgth_115156"
                      value={appleData.fruitlgth_115156}
                      onChange={handleChange}
                      className="input-pro"
                      placeholder="Length (mm)"
                    />
                  </div>
                  <div className="form-group-pro">
                    <label className="label-pro">Fruit Width (115157)</label>
                    <input
                      type="text"
                      name="fruitwidth_115157"
                      value={appleData.fruitwidth_115157}
                      onChange={handleChange}
                      className="input-pro"
                      placeholder="Width (mm)"
                    />
                  </div>
                  <div className="form-group-pro">
                    <label className="label-pro">Fruit Weight (115121)</label>
                    <input
                      type="text"
                      name="frtweight_115121"
                      value={appleData.frtweight_115121}
                      onChange={handleChange}
                      className="input-pro"
                      placeholder="Weight (g)"
                    />
                  </div>
                  <div className="form-group-pro">
                    <label className="label-pro">Fruit Stem Thickness (115127)</label>
                    <input
                      type="text"
                      name="frtstemthk_115127"
                      value={appleData.frtstemthk_115127}
                      onChange={handleChange}
                      className="input-pro"
                      placeholder="Stem thickness"
                    />
                  </div>
                  <div className="form-group-pro">
                    <label className="label-pro">Fruit Texture (115123)</label>
                    <input
                      type="text"
                      name="frttexture_115123"
                      value={appleData.frttexture_115123}
                      onChange={handleChange}
                      className="input-pro"
                      placeholder="Texture description"
                    />
                  </div>
                  <div className="form-group-pro">
                    <label className="label-pro">Fruit Stem Length (115158)</label>
                    <input
                      type="text"
                      name="frtstmlgth_115158"
                      value={appleData.frtstmlgth_115158}
                      onChange={handleChange}
                      className="input-pro"
                      placeholder="Stem length (mm)"
                    />
                  </div>
                  <div className="form-group-pro">
                    <label className="label-pro">Fruit Flesh Oxidation (115129)</label>
                    <input
                      type="text"
                      name="frtflshoxi_115129"
                      value={appleData.frtflshoxi_115129}
                      onChange={handleChange}
                      className="input-pro"
                      placeholder="Oxidation level"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* SEED CHARACTERISTICS */}
          <div className="section-card-pro">
            <div
              className="section-header-pro"
              onClick={() => toggleSection('seed')}
            >
              <div className="section-title-wrapper-pro">
                <h2 className="section-title-pro">🌰 Seed Characteristics</h2>
                <button
                  type="button"
                  className="info-btn-pro"
                  onClick={(e) => {
                    e.stopPropagation();
                    alert(sectionInfo.seed);
                  }}
                >
                  <Info size={16} />
                </button>
              </div>
              {expandedSections.seed ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>

            {expandedSections.seed && (
              <div className="section-content-pro">
                <div className="form-grid-pro">
                  <div className="form-group-pro">
                    <label className="label-pro">Seed Color (115086)</label>
                    <input
                      type="text"
                      name="seedcolor_115086"
                      value={appleData.seedcolor_115086}
                      onChange={handleChange}
                      className="input-pro"
                      placeholder="Seed color"
                    />
                  </div>
                  <div className="form-group-pro">
                    <label className="label-pro">Seed Size / Quantity</label>
                    <input
                      type="text"
                      name="ssize_quantity_of_seed"
                      value={appleData.ssize_quantity_of_seed}
                      onChange={handleChange}
                      className="input-pro"
                      placeholder="Size and quantity"
                    />
                  </div>
                  <div className="form-group-pro">
                    <label className="label-pro">Seed Length (115163)</label>
                    <input
                      type="text"
                      name="seedlength_115163"
                      value={appleData.seedlength_115163}
                      onChange={handleChange}
                      className="input-pro"
                      placeholder="Length (mm)"
                    />
                  </div>
                  <div className="form-group-pro">
                    <label className="label-pro">Seed Width (115164)</label>
                    <input
                      type="text"
                      name="seedwidth_115164"
                      value={appleData.seedwidth_115164}
                      onChange={handleChange}
                      className="input-pro"
                      placeholder="Width (mm)"
                    />
                  </div>
                  <div className="form-group-pro">
                    <label className="label-pro">Seed Number (115087)</label>
                    <input
                      type="text"
                      name="seednumber_115087"
                      value={appleData.seednumber_115087}
                      onChange={handleChange}
                      className="input-pro"
                      placeholder="Number of seeds"
                    />
                  </div>
                  <div className="form-group-pro">
                    <label className="label-pro">Seed Shape (115167)</label>
                    <input
                      type="text"
                      name="seedshape_115167"
                      value={appleData.seedshape_115167}
                      onChange={handleChange}
                      className="input-pro"
                      placeholder="Shape description"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* PHENOLOGY */}
          <div className="section-card-pro">
            <div
              className="section-header-pro"
              onClick={() => toggleSection('phenology')}
            >
              <div className="section-title-wrapper-pro">
                <h2 className="section-title-pro">🌸 Phenology</h2>
                <button
                  type="button"
                  className="info-btn-pro"
                  onClick={(e) => {
                    e.stopPropagation();
                    alert(sectionInfo.phenology);
                  }}
                >
                  <Info size={16} />
                </button>
              </div>
              {expandedSections.phenology ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>

            {expandedSections.phenology && (
              <div className="section-content-pro">
                <div className="form-grid-pro">
                  <div className="form-group-pro">
                    <label className="label-pro">First Bloom Date</label>
                    <input
                      type="text"
                      name="first_bloom_date"
                      value={appleData.first_bloom_date}
                      onChange={handleChange}
                      className="input-pro"
                      placeholder="Date or month"
                    />
                  </div>
                  <div className="form-group-pro">
                    <label className="label-pro">Full Bloom Date</label>
                    <input
                      type="text"
                      name="full_bloom_date"
                      value={appleData.full_bloom_date}
                      onChange={handleChange}
                      className="input-pro"
                      placeholder="Date or month"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* VISUAL AND QUALITY TRAITS */}
          <div className="section-card-pro">
            <div
              className="section-header-pro"
              onClick={() => toggleSection('quality')}
            >
              <div className="section-title-wrapper-pro">
                <h2 className="section-title-pro">✨ Visual and Quality Traits</h2>
                <button
                  type="button"
                  className="info-btn-pro"
                  onClick={(e) => {
                    e.stopPropagation();
                    alert(sectionInfo.quality);
                  }}
                >
                  <Info size={16} />
                </button>
              </div>
              {expandedSections.quality ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>

            {expandedSections.quality && (
              <div className="section-content-pro">
                <div className="form-grid-pro">
                  <div className="form-group-pro">
                    <label className="label-pro">Colour</label>
                    <input
                      type="text"
                      name="colour"
                      value={appleData.colour}
                      onChange={handleChange}
                      className="input-pro"
                      placeholder="Color description"
                    />
                  </div>
                  <div className="form-group-pro">
                    <label className="label-pro">Density</label>
                    <input
                      type="text"
                      name="density"
                      value={appleData.density}
                      onChange={handleChange}
                      className="input-pro"
                      placeholder="Density level"
                    />
                  </div>
                  <div className="form-group-pro">
                    <label className="label-pro">Fireblight Rating</label>
                    <input
                      type="text"
                      name="fireblight_rating"
                      value={appleData.fireblight_rating}
                      onChange={handleChange}
                      className="input-pro"
                      placeholder="Rating or description"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* DESCRIPTIVE INFORMATION */}
          <div className="section-card-pro">
            <div
              className="section-header-pro"
              onClick={() => toggleSection('descriptive')}
            >
              <div className="section-title-wrapper-pro">
                <h2 className="section-title-pro">📝 Descriptive Information</h2>
                <button
                  type="button"
                  className="info-btn-pro"
                  onClick={(e) => {
                    e.stopPropagation();
                    alert(sectionInfo.descriptive);
                  }}
                >
                  <Info size={16} />
                </button>
              </div>
              {expandedSections.descriptive ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>

            {expandedSections.descriptive && (
              <div className="section-content-pro">
                <div className="form-grid-pro">
                  <div className="form-group-pro">
                    <label className="label-pro">Comments (CMT)</label>
                    <textarea
                      name="cmt"
                      value={appleData.cmt}
                      onChange={handleChange}
                      className="input-pro textarea-pro"
                      rows="3"
                      placeholder="Any additional comments"
                    />
                  </div>
                  <div className="form-group-pro">
                    <label className="label-pro">Narrative Keyword</label>
                    <input
                      type="text"
                      name="narativekeyword"
                      value={appleData.narativekeyword}
                      onChange={handleChange}
                      className="input-pro"
                      placeholder="Keywords for narrative"
                    />
                  </div>
                  <div className="form-group-pro">
                    <label className="label-pro">Full Narrative</label>
                    <textarea
                      name="full_narative"
                      value={appleData.full_narative}
                      onChange={handleChange}
                      className="input-pro textarea-pro"
                      rows="4"
                      placeholder="Complete narrative description"
                    />
                  </div>
                  <div className="form-group-pro">
                    <label className="label-pro">Pedigree Description</label>
                    <textarea
                      name="pedigree_description"
                      value={appleData.pedigree_description}
                      onChange={handleChange}
                      className="input-pro textarea-pro"
                      rows="3"
                      placeholder="Parentage and breeding history"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* STATUS AND RELEASE */}
          <div className="section-card-pro">
            <div
              className="section-header-pro"
              onClick={() => toggleSection('status')}
            >
              <div className="section-title-wrapper-pro">
                <h2 className="section-title-pro">📊 Status and Release Information</h2>
                <button
                  type="button"
                  className="info-btn-pro"
                  onClick={(e) => {
                    e.stopPropagation();
                    alert(sectionInfo.status);
                  }}
                >
                  <Info size={16} />
                </button>
              </div>
              {expandedSections.status ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>

            {expandedSections.status && (
              <div className="section-content-pro">
                <div className="form-grid-pro">
                  <div className="form-group-pro">
                    <label className="label-pro">Availability Status</label>
                    <input
                      type="text"
                      name="availability_status"
                      value={appleData.availability_status}
                      onChange={handleChange}
                      className="input-pro"
                      placeholder="e.g., Available, Limited"
                    />
                  </div>
                  <div className="form-group-pro">
                    <label className="label-pro">IPR Type</label>
                    <input
                      type="text"
                      name="ipr_type"
                      value={appleData.ipr_type}
                      onChange={handleChange}
                      className="input-pro"
                      placeholder="Intellectual property rights"
                    />
                  </div>
                  <div className="form-group-pro">
                    <label className="label-pro">Level of Improvement</label>
                    <input
                      type="text"
                      name="level_of_improvement"
                      value={appleData.level_of_improvement}
                      onChange={handleChange}
                      className="input-pro"
                      placeholder="Improvement level"
                    />
                  </div>
                  <div className="form-group-pro">
                    <label className="label-pro">Released Date</label>
                    <input
                      type="text"
                      name="released_date"
                      value={appleData.released_date}
                      onChange={handleChange}
                      className="input-pro"
                      placeholder="e.g., 2020"
                    />
                  </div>
                  <div className="form-group-pro">
                    <label className="label-pro">Released Date Format</label>
                    <input
                      type="text"
                      name="released_date_format"
                      value={appleData.released_date_format}
                      onChange={handleChange}
                      className="input-pro"
                      placeholder="e.g., YYYY"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* CUSTOM FIELDS */}
          <div className="section-card-pro custom-section-pro">
            <div
              className="section-header-pro"
              onClick={() => toggleSection('custom')}
            >
              <div className="section-title-wrapper-pro">
                <h2 className="section-title-pro">➕ Custom Fields</h2>
                <button
                  type="button"
                  className="info-btn-pro"
                  onClick={(e) => {
                    e.stopPropagation();
                    alert(sectionInfo.custom);
                  }}
                >
                  <Info size={16} />
                </button>
              </div>
              <div className="section-actions-pro">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    addCustomField();
                  }}
                  className="add-btn-pro"
                >
                  <Plus size={16} /> Add Field
                </button>
                {expandedSections.custom ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </div>
            </div>

            {expandedSections.custom && (
              <div className="section-content-pro">
                <p className="section-description-pro">
                  Add your own custom fields with any heading and content you need
                </p>
                {customFields.map((field, index) => (
                  <div key={index} className="custom-field-row-pro">
                    <input
                      type="text"
                      placeholder="Field Name (e.g., 'Taste Profile')"
                      value={field.fieldName}
                      onChange={(e) =>
                        handleCustomFieldChange(index, 'fieldName', e.target.value)
                      }
                      className="input-pro custom-name-pro"
                    />
                    <input
                      type="text"
                      placeholder="Field Value (e.g., 'Sweet and crisp')"
                      value={field.fieldValue}
                      onChange={(e) =>
                        handleCustomFieldChange(index, 'fieldValue', e.target.value)
                      }
                      className="input-pro custom-value-pro"
                    />
                    {customFields.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeCustomField(index)}
                        className="remove-btn-pro"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* IMAGES */}
          <div className="section-card-pro">
            <div
              className="section-header-pro"
              onClick={() => toggleSection('images')}
            >
              <div className="section-title-wrapper-pro">
                <h2 className="section-title-pro">📸 Images</h2>
                <button
                  type="button"
                  className="info-btn-pro"
                  onClick={(e) => {
                    e.stopPropagation();
                    alert(sectionInfo.images);
                  }}
                >
                  <Info size={16} />
                </button>
              </div>
              {expandedSections.images ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>

            {expandedSections.images && (
              <div className="section-content-pro">
                <div className="upload-area-pro">
                  <input
                    type="file"
                    id="images"
                    onChange={handleImageChange}
                    ref={fileInputRef}
                    multiple
                    accept="image/jpeg, image/png, image/webp"
                    className="upload-input-pro"
                    disabled={!accession}
                  />
                  <label
                    htmlFor="images"
                    className={`upload-label-pro ${!accession ? 'disabled' : ''}`}
                  >
                    <ImageIcon size={32} />
                    <span className="upload-text-pro">
                      {accession
                        ? 'Click to upload images or drag and drop'
                        : 'Enter Accession first to enable upload'}
                    </span>
                    <span className="upload-hint-pro">
                      PNG, JPG, WEBP up to 10MB (Max 10 files)
                    </span>
                  </label>
                </div>

                {imagePreviews.length > 0 && (
                  <div className="images-grid-pro">
                    {imagePreviews.map((preview, index) => (
                      <div key={index} className="image-card-pro">
                        <img
                          src={preview}
                          alt={`Preview ${index + 1}`}
                          className="preview-img-pro"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="remove-img-btn-pro"
                        >
                          <X size={16} />
                        </button>
                        <span className="image-name-pro">{images[index]?.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* SUBMIT BUTTON */}
          <div className="submit-section-pro">
            <button type="submit" className="submit-btn-pro" disabled={loading}>
              {loading ? (
                <>
                  <div className="spinner-pro"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save size={20} />
                  Save Apple Variety
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}