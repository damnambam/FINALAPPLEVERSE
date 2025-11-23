import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Save, X, Image as ImageIcon } from 'lucide-react';
import './SingleApple.css';

export default function SingleApple() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  
  const [appleData, setAppleData] = useState({
    acno: '',
    accession: '',
    acp: '',
    sd_unique: 'False',
    ivt: 'PL',
    sd_moved: 'False',
    sd_new: 'False',
    whynull: '',
    m_transfer_history: '',
    acimpt: '',
    e_locality: '',
    loc1: '',
    loc2: '',
    loc3: '',
    loc4: '',
    e_location_field: '',
    e_location_greenhouse: '',
    e_origin_country: '',
    e_origin_province: '',
    e_origin_city: '',
    e_origin_address_1: '',
    e_origin_address_2: '',
    e_origin_postal_code: '',
    e_lath: '',
    e_latd: '',
    e_latm: '',
    e_lats: '',
    e_lonh: '',
    e_lond: '',
    e_lonm: '',
    e_lons: '',
    e_elev: '',
    e_habitat: '',
    site: 'CCG',
    taxno: '',
    sitecmt: '',
    cultivar_name: '',
    e_genus: 'Malus',
    e_species: 'domestica',
    e_subspecies: '',
    plant_type: 'apple',
    family: 'Rosaceae',
    e_pedigree: '',
    e_collector: '',
    e_breeder: '',
    e_breeder_or_collector: '',
    e_origin_institute: '',
    distribute: 'True',
    status: 'AVAIL',
    e_alive: 'True',
    statcmt: '',
    uniform: '',
    e_released: '',
    e_datefmt: '',
    e_date_collected: '',
    e_quant: '',
    e_units: '',
    e_cform: '',
    e_plants_collected: '',
    cmt: '',
    e_cmt: ''
  });

  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setAppleData(prevData => ({ 
      ...prevData, 
      [name]: value 
    }));
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    
    if ((images.length + files.length) > 10) {
      setError('Maximum 10 images allowed');
      e.target.value = '';
      return;
    }

    if (!appleData.accession) {
      setError('Please enter Accession Number first to upload images');
      e.target.value = '';
      return;
    }

    const startIndex = images.length;
    const renamedFiles = files.map((file, index) => {
      const extension = file.name.split('.').pop();
      const newName = `${appleData.accession}_${startIndex + index + 1}.${extension}`;
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
    
    if (!appleData.accession) {
      setError('Accession Number is required.');
      return;
    }
    if (!appleData.cultivar_name) {
      setError('Cultivar Name is required.');
      return;
    }

    setLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('appleData', JSON.stringify(appleData));
    
    images.forEach(image => {
      formData.append('images', image);
    });

    try {
      // Get admin token from localStorage
      const adminToken = localStorage.getItem('adminToken');
      
      if (!adminToken) {
        setError('You must be logged in as admin to create apples.');
        setLoading(false);
        navigate('/signup-login');
        return;
      }

      const response = await axios.post('http://localhost:5000/api/apples/single-upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${adminToken}`
        },
      });

      alert(`✅ Successfully created ${response.data.apple.cultivar_name}!`);
      imagePreviews.forEach(url => URL.revokeObjectURL(url));
      navigate('/dashboard');

    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to create apple.';
      setError(errorMessage);
      console.error('Single upload error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="single-apple-page">
      <div className="single-apple-card">
        <div className="single-apple-header">
          <button 
            className="back-btn-single"
            onClick={() => navigate('/create-apple')}
            type="button"
          >
            <ArrowLeft size={20} />
            Back
          </button>
          <h1>🍎 Create New Apple Variety</h1>
          <p className="subtitle">Enter details manually and upload images</p>
        </div>

        <form onSubmit={handleSubmit} className="single-apple-form">
          
          <div className="form-section-group">
            <h2 className="section-title">📋 Identity & Inventory</h2>
            
            <div className="form-row">
              <div className="form-field">
                <label htmlFor="accession">Accession Number *</label>
                <input
                  type="text"
                  id="accession"
                  name="accession"
                  value={appleData.accession}
                  onChange={handleChange}
                  className="single-apple-input"
                  required
                />
                <small>Used for image naming</small>
              </div>

              <div className="form-field">
                <label htmlFor="acno">AC Number</label>
                <input
                  type="text"
                  id="acno"
                  name="acno"
                  value={appleData.acno}
                  onChange={handleChange}
                  className="single-apple-input"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-field">
                <label htmlFor="acp">Accession Prefix</label>
                <input
                  type="text"
                  id="acp"
                  name="acp"
                  value={appleData.acp}
                  onChange={handleChange}
                  className="single-apple-input"
                />
              </div>

              <div className="form-field">
                <label htmlFor="ivt">Inventory Type</label>
                <select
                  id="ivt"
                  name="ivt"
                  value={appleData.ivt}
                  onChange={handleChange}
                  className="single-apple-input"
                >
                  <option value="PL">PL - Plant</option>
                  <option value="SE">SE - Seed</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-field">
                <label htmlFor="sd_unique">SD Unique</label>
                <select
                  id="sd_unique"
                  name="sd_unique"
                  value={appleData.sd_unique}
                  onChange={handleChange}
                  className="single-apple-input"
                >
                  <option value="False">False</option>
                  <option value="True">True</option>
                </select>
              </div>

              <div className="form-field">
                <label htmlFor="sd_moved">SD Moved</label>
                <select
                  id="sd_moved"
                  name="sd_moved"
                  value={appleData.sd_moved}
                  onChange={handleChange}
                  className="single-apple-input"
                >
                  <option value="False">False</option>
                  <option value="True">True</option>
                </select>
              </div>

              <div className="form-field">
                <label htmlFor="sd_new">SD New</label>
                <select
                  id="sd_new"
                  name="sd_new"
                  value={appleData.sd_new}
                  onChange={handleChange}
                  className="single-apple-input"
                >
                  <option value="False">False</option>
                  <option value="True">True</option>
                </select>
              </div>
            </div>

            <div className="form-field">
              <label htmlFor="m_transfer_history">Transfer History</label>
              <textarea
                id="m_transfer_history"
                name="m_transfer_history"
                value={appleData.m_transfer_history}
                onChange={handleChange}
                className="single-apple-input"
                rows="3"
              />
            </div>
          </div>

          <div className="form-section-group">
            <h2 className="section-title">🌍 Geography & Origin</h2>
            
            <div className="form-row">
              <div className="form-field">
                <label htmlFor="e_origin_country">Country</label>
                <input
                  type="text"
                  id="e_origin_country"
                  name="e_origin_country"
                  value={appleData.e_origin_country}
                  onChange={handleChange}
                  className="single-apple-input"
                  placeholder="e.g., CAN, USA"
                />
              </div>

              <div className="form-field">
                <label htmlFor="e_origin_province">Province/State</label>
                <input
                  type="text"
                  id="e_origin_province"
                  name="e_origin_province"
                  value={appleData.e_origin_province}
                  onChange={handleChange}
                  className="single-apple-input"
                />
              </div>

              <div className="form-field">
                <label htmlFor="e_origin_city">City</label>
                <input
                  type="text"
                  id="e_origin_city"
                  name="e_origin_city"
                  value={appleData.e_origin_city}
                  onChange={handleChange}
                  className="single-apple-input"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-field">
                <label htmlFor="e_origin_address_1">Address Line 1</label>
                <input
                  type="text"
                  id="e_origin_address_1"
                  name="e_origin_address_1"
                  value={appleData.e_origin_address_1}
                  onChange={handleChange}
                  className="single-apple-input"
                />
              </div>

              <div className="form-field">
                <label htmlFor="e_origin_address_2">Address Line 2</label>
                <input
                  type="text"
                  id="e_origin_address_2"
                  name="e_origin_address_2"
                  value={appleData.e_origin_address_2}
                  onChange={handleChange}
                  className="single-apple-input"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-field">
                <label htmlFor="e_origin_postal_code">Postal Code</label>
                <input
                  type="text"
                  id="e_origin_postal_code"
                  name="e_origin_postal_code"
                  value={appleData.e_origin_postal_code}
                  onChange={handleChange}
                  className="single-apple-input"
                />
              </div>

              <div className="form-field">
                <label htmlFor="e_locality">Locality</label>
                <input
                  type="text"
                  id="e_locality"
                  name="e_locality"
                  value={appleData.e_locality}
                  onChange={handleChange}
                  className="single-apple-input"
                />
              </div>
            </div>

            <h3 className="subsection-title">Location Details</h3>
            <div className="form-row">
              <div className="form-field">
                <label htmlFor="site">Site</label>
                <input
                  type="text"
                  id="site"
                  name="site"
                  value={appleData.site}
                  onChange={handleChange}
                  className="single-apple-input"
                />
              </div>

              <div className="form-field">
                <label htmlFor="e_location_field">Field Location</label>
                <input
                  type="text"
                  id="e_location_field"
                  name="e_location_field"
                  value={appleData.e_location_field}
                  onChange={handleChange}
                  className="single-apple-input"
                />
              </div>

              <div className="form-field">
                <label htmlFor="e_location_greenhouse">Greenhouse Location</label>
                <input
                  type="text"
                  id="e_location_greenhouse"
                  name="e_location_greenhouse"
                  value={appleData.e_location_greenhouse}
                  onChange={handleChange}
                  className="single-apple-input"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-field">
                <label htmlFor="loc1">Location 1</label>
                <input
                  type="text"
                  id="loc1"
                  name="loc1"
                  value={appleData.loc1}
                  onChange={handleChange}
                  className="single-apple-input"
                />
              </div>

              <div className="form-field">
                <label htmlFor="loc2">Location 2</label>
                <input
                  type="text"
                  id="loc2"
                  name="loc2"
                  value={appleData.loc2}
                  onChange={handleChange}
                  className="single-apple-input"
                />
              </div>

              <div className="form-field">
                <label htmlFor="loc3">Location 3</label>
                <input
                  type="text"
                  id="loc3"
                  name="loc3"
                  value={appleData.loc3}
                  onChange={handleChange}
                  className="single-apple-input"
                />
              </div>

              <div className="form-field">
                <label htmlFor="loc4">Location 4</label>
                <input
                  type="text"
                  id="loc4"
                  name="loc4"
                  value={appleData.loc4}
                  onChange={handleChange}
                  className="single-apple-input"
                />
              </div>
            </div>

            <h3 className="subsection-title">Coordinates</h3>
            <div className="form-row">
              <div className="form-field">
                <label htmlFor="e_lath">Latitude Hemisphere</label>
                <select
                  id="e_lath"
                  name="e_lath"
                  value={appleData.e_lath}
                  onChange={handleChange}
                  className="single-apple-input"
                >
                  <option value="">Select</option>
                  <option value="N">N - North</option>
                  <option value="S">S - South</option>
                </select>
              </div>

              <div className="form-field">
                <label htmlFor="e_latd">Latitude Degrees</label>
                <input
                  type="number"
                  id="e_latd"
                  name="e_latd"
                  value={appleData.e_latd}
                  onChange={handleChange}
                  className="single-apple-input"
                />
              </div>

              <div className="form-field">
                <label htmlFor="e_latm">Latitude Minutes</label>
                <input
                  type="number"
                  id="e_latm"
                  name="e_latm"
                  value={appleData.e_latm}
                  onChange={handleChange}
                  className="single-apple-input"
                />
              </div>

              <div className="form-field">
                <label htmlFor="e_lats">Latitude Seconds</label>
                <input
                  type="number"
                  id="e_lats"
                  name="e_lats"
                  value={appleData.e_lats}
                  onChange={handleChange}
                  className="single-apple-input"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-field">
                <label htmlFor="e_lonh">Longitude Hemisphere</label>
                <select
                  id="e_lonh"
                  name="e_lonh"
                  value={appleData.e_lonh}
                  onChange={handleChange}
                  className="single-apple-input"
                >
                  <option value="">Select</option>
                  <option value="E">E - East</option>
                  <option value="W">W - West</option>
                </select>
              </div>

              <div className="form-field">
                <label htmlFor="e_lond">Longitude Degrees</label>
                <input
                  type="number"
                  id="e_lond"
                  name="e_lond"
                  value={appleData.e_lond}
                  onChange={handleChange}
                  className="single-apple-input"
                />
              </div>

              <div className="form-field">
                <label htmlFor="e_lonm">Longitude Minutes</label>
                <input
                  type="number"
                  id="e_lonm"
                  name="e_lonm"
                  value={appleData.e_lonm}
                  onChange={handleChange}
                  className="single-apple-input"
                />
              </div>

              <div className="form-field">
                <label htmlFor="e_lons">Longitude Seconds</label>
                <input
                  type="number"
                  id="e_lons"
                  name="e_lons"
                  value={appleData.e_lons}
                  onChange={handleChange}
                  className="single-apple-input"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-field">
                <label htmlFor="e_elev">Elevation</label>
                <input
                  type="text"
                  id="e_elev"
                  name="e_elev"
                  value={appleData.e_elev}
                  onChange={handleChange}
                  className="single-apple-input"
                  placeholder="meters"
                />
              </div>

              <div className="form-field">
                <label htmlFor="e_habitat">Habitat</label>
                <input
                  type="text"
                  id="e_habitat"
                  name="e_habitat"
                  value={appleData.e_habitat}
                  onChange={handleChange}
                  className="single-apple-input"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-field">
                <label htmlFor="taxno">Tax Number</label>
                <input
                  type="text"
                  id="taxno"
                  name="taxno"
                  value={appleData.taxno}
                  onChange={handleChange}
                  className="single-apple-input"
                />
              </div>

              <div className="form-field">
                <label htmlFor="sitecmt">Site Comment</label>
                <input
                  type="text"
                  id="sitecmt"
                  name="sitecmt"
                  value={appleData.sitecmt}
                  onChange={handleChange}
                  className="single-apple-input"
                />
              </div>
            </div>
          </div>

          <div className="form-section-group">
            <h2 className="section-title">🧬 Biology & Taxonomy</h2>
            
            <div className="form-field">
              <label htmlFor="cultivar_name">Cultivar Name *</label>
              <input
                type="text"
                id="cultivar_name"
                name="cultivar_name"
                value={appleData.cultivar_name}
                onChange={handleChange}
                className="single-apple-input"
                required
              />
            </div>

            <div className="form-row">
              <div className="form-field">
                <label htmlFor="e_genus">Genus</label>
                <input
                  type="text"
                  id="e_genus"
                  name="e_genus"
                  value={appleData.e_genus}
                  onChange={handleChange}
                  className="single-apple-input"
                />
              </div>

              <div className="form-field">
                <label htmlFor="e_species">Species</label>
                <input
                  type="text"
                  id="e_species"
                  name="e_species"
                  value={appleData.e_species}
                  onChange={handleChange}
                  className="single-apple-input"
                />
              </div>

              <div className="form-field">
                <label htmlFor="e_subspecies">Subspecies</label>
                <input
                  type="text"
                  id="e_subspecies"
                  name="e_subspecies"
                  value={appleData.e_subspecies}
                  onChange={handleChange}
                  className="single-apple-input"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-field">
                <label htmlFor="family">Family</label>
                <input
                  type="text"
                  id="family"
                  name="family"
                  value={appleData.family}
                  onChange={handleChange}
                  className="single-apple-input"
                />
              </div>

              <div className="form-field">
                <label htmlFor="plant_type">Plant Type</label>
                <input
                  type="text"
                  id="plant_type"
                  name="plant_type"
                  value={appleData.plant_type}
                  onChange={handleChange}
                  className="single-apple-input"
                />
              </div>
            </div>

            <div className="form-field">
              <label htmlFor="e_pedigree">Pedigree</label>
              <textarea
                id="e_pedigree"
                name="e_pedigree"
                value={appleData.e_pedigree}
                onChange={handleChange}
                className="single-apple-input"
                rows="3"
                placeholder="Parentage and breeding history"
              />
            </div>
          </div>

          <div className="form-section-group">
            <h2 className="section-title">👥 People & Custodians</h2>
            
            <div className="form-row">
              <div className="form-field">
                <label htmlFor="e_breeder">Breeder</label>
                <input
                  type="text"
                  id="e_breeder"
                  name="e_breeder"
                  value={appleData.e_breeder}
                  onChange={handleChange}
                  className="single-apple-input"
                />
              </div>

              <div className="form-field">
                <label htmlFor="e_collector">Collector</label>
                <input
                  type="text"
                  id="e_collector"
                  name="e_collector"
                  value={appleData.e_collector}
                  onChange={handleChange}
                  className="single-apple-input"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-field">
                <label htmlFor="e_breeder_or_collector">Breeder or Collector</label>
                <select
                  id="e_breeder_or_collector"
                  name="e_breeder_or_collector"
                  value={appleData.e_breeder_or_collector}
                  onChange={handleChange}
                  className="single-apple-input"
                >
                  <option value="">Select</option>
                  <option value="B">B - Breeder</option>
                  <option value="C">C - Collector</option>
                </select>
              </div>

              <div className="form-field">
                <label htmlFor="e_origin_institute">Origin Institute</label>
                <input
                  type="text"
                  id="e_origin_institute"
                  name="e_origin_institute"
                  value={appleData.e_origin_institute}
                  onChange={handleChange}
                  className="single-apple-input"
                />
              </div>
            </div>
          </div>

          <div className="form-section-group">
            <h2 className="section-title">📅 Status & Dates</h2>
            
            <div className="form-row">
              <div className="form-field">
                <label htmlFor="status">Status</label>
                <select
                  id="status"
                  name="status"
                  value={appleData.status}
                  onChange={handleChange}
                  className="single-apple-input"
                >
                  <option value="AVAIL">AVAIL - Available</option>
                  <option value="UNAVAIL">UNAVAIL - Unavailable</option>
                  <option value="PEND">PEND - Pending</option>
                </select>
              </div>

              <div className="form-field">
                <label htmlFor="e_alive">Alive Status</label>
                <select
                  id="e_alive"
                  name="e_alive"
                  value={appleData.e_alive}
                  onChange={handleChange}
                  className="single-apple-input"
                >
                  <option value="True">True</option>
                  <option value="False">False</option>
                </select>
              </div>

              <div className="form-field">
                <label htmlFor="distribute">Distribute</label>
                <select
                  id="distribute"
                  name="distribute"
                  value={appleData.distribute}
                  onChange={handleChange}
                  className="single-apple-input"
                >
                  <option value="True">True</option>
                  <option value="False">False</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-field">
                <label htmlFor="e_released">Year Released</label>
                <input
                  type="text"
                  id="e_released"
                  name="e_released"
                  value={appleData.e_released}
                  onChange={handleChange}
                  className="single-apple-input"
                  placeholder="e.g., 1936"
                />
              </div>

              <div className="form-field">
                <label htmlFor="e_date_collected">Date Collected</label>
                <input
                  type="date"
                  id="e_date_collected"
                  name="e_date_collected"
                  value={appleData.e_date_collected}
                  onChange={handleChange}
                  className="single-apple-input"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-field">
                <label htmlFor="e_datefmt">Date Format</label>
                <input
                  type="text"
                  id="e_datefmt"
                  name="e_datefmt"
                  value={appleData.e_datefmt}
                  onChange={handleChange}
                  className="single-apple-input"
                  placeholder="e.g., YYYYMMDD"
                />
              </div>

              <div className="form-field">
                <label htmlFor="uniform">Uniform</label>
                <input
                  type="text"
                  id="uniform"
                  name="uniform"
                  value={appleData.uniform}
                  onChange={handleChange}
                  className="single-apple-input"
                />
              </div>
            </div>
          </div>

          <div className="form-section-group">
            <h2 className="section-title">📦 Collection Details</h2>
            
            <div className="form-row">
              <div className="form-field">
                <label htmlFor="e_quant">Quantity</label>
                <input
                  type="number"
                  id="e_quant"
                  name="e_quant"
                  value={appleData.e_quant}
                  onChange={handleChange}
                  className="single-apple-input"
                />
              </div>

              <div className="form-field">
                <label htmlFor="e_units">Units</label>
                <input
                  type="text"
                  id="e_units"
                  name="e_units"
                  value={appleData.e_units}
                  onChange={handleChange}
                  className="single-apple-input"
                  placeholder="e.g., plants, seeds"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-field">
                <label htmlFor="e_cform">Collection Form</label>
                <input
                  type="text"
                  id="e_cform"
                  name="e_cform"
                  value={appleData.e_cform}
                  onChange={handleChange}
                  className="single-apple-input"
                />
              </div>

              <div className="form-field">
                <label htmlFor="e_plants_collected">Plants Collected</label>
                <input
                  type="number"
                  id="e_plants_collected"
                  name="e_plants_collected"
                  value={appleData.e_plants_collected}
                  onChange={handleChange}
                  className="single-apple-input"
                />
              </div>
            </div>
          </div>

          <div className="form-section-group">
            <h2 className="section-title">📸 Images</h2>
            
            <div className="form-field">
              <label htmlFor="images">Upload Images (Max 10)</label>
              <small>Images will be renamed using the Accession Number (e.g., {appleData.accession || 'ACC-123'}_1.jpg)</small>
              <input
                type="file"
                id="images"
                name="images"
                onChange={handleImageChange}
                ref={fileInputRef}
                multiple
                accept="image/jpeg, image/png, image/webp"
                className="single-apple-input-file"
                disabled={!appleData.accession}
              />
              {!appleData.accession && (
                <small className="error-message-inline">Enter Accession Number in Identity section to enable upload.</small>
              )}
            </div>

            <div className="image-preview-grid">
              {imagePreviews.map((preview, index) => (
                <div key={index} className="image-preview-item">
                  <img src={preview} alt={`Preview ${index + 1}`} />
                  <button
                    type="button"
                    className="remove-image-btn"
                    onClick={() => removeImage(index)}
                  >
                    <X size={16} />
                  </button>
                  <span className="image-name-label">{images[index]?.name}</span>
                </div>
              ))}
              {imagePreviews.length === 0 && (
                <div className="image-preview-placeholder">
                  <ImageIcon size={48} />
                  <p>No images selected</p>
                </div>
              )}
            </div>
          </div>

          <div className="form-section-group">
            <h2 className="section-title">📝 Metadata</h2>
            
            <div className="form-field">
              <label htmlFor="cmt">Comment</label>
              <textarea
                id="cmt"
                name="cmt"
                value={appleData.cmt}
                onChange={handleChange}
                className="single-apple-input"
                rows="4"
              />
            </div>

            <div className="form-field">
              <label htmlFor="e_cmt">Electronic Comment</label>
              <textarea
                id="e_cmt"
                name="e_cmt"
                value={appleData.e_cmt}
                onChange={handleChange}
                className="single-apple-input"
                rows="4"
              />
            </div>
          </div>

          <div className="form-actions-footer">
            {error && <p className="error-message">{error}</p>}
            <button
              type="submit"
              className="btn-primary save-btn"
              disabled={loading}
            >
              {loading ? 'Saving...' : (
                <>
                  <Save size={18} /> Save New Apple
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}