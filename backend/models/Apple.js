// models/Apple.js
import mongoose from 'mongoose';

const appleSchema = new mongoose.Schema({
  // ==========================================
  // MANDATORY FIELDS
  // ==========================================
  cultivar_name: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  accession: {
    type: String,
    required: true,
    trim: true,
    index: true
  },

  // ==========================================
  // EXISTING FIELDS (Your Current Structure)
  // ==========================================
  acno: { type: String, trim: true, default: '' },
  acp: { type: String, trim: true, default: '' },
  sd_unique: { type: String, default: 'False' },
  ivt: { type: String, default: 'PL' },
  sd_moved: { type: String, default: 'False' },
  sd_new: { type: String, default: 'False' },
  whynull: { type: String, default: '' },
  m_transfer_history: { type: String, default: '' },
  acimpt: { type: String, default: '' },
  
  // Location - Existing
  e_locality: { type: String, default: '' },
  loc1: { type: String, default: '' },
  loc2: { type: String, default: '' },
  loc3: { type: String, default: '' },
  loc4: { type: String, default: '' },
  e_location_field: { type: String, default: '' },
  e_location_greenhouse: { type: String, default: '' },
  
  // Origin - Existing
  e_origin_country: { type: String, default: '' },
  e_origin_province: { type: String, default: '' },
  e_origin_city: { type: String, default: '' },
  e_origin_address_1: { type: String, default: '' },
  e_origin_address_2: { type: String, default: '' },
  e_origin_postal_code: { type: String, default: '' },
  
  // Coordinates - Existing
  e_lath: { type: String, default: '' },
  e_latd: { type: String, default: '' },
  e_latm: { type: String, default: '' },
  e_lats: { type: String, default: '' },
  e_lonh: { type: String, default: '' },
  e_lond: { type: String, default: '' },
  e_lonm: { type: String, default: '' },
  e_lons: { type: String, default: '' },
  e_elev: { type: String, default: '' },
  e_habitat: { type: String, default: '' },
  
  // Site Info - Existing
  site: { type: String, default: 'CCG' },
  taxno: { type: String, default: '' },
  sitecmt: { type: String, default: '' },
  
  // Taxonomy - Existing
  e_genus: { type: String, default: 'Malus' },
  e_species: { type: String, default: 'domestica' },
  e_subspecies: { type: String, default: '' },
  plant_type: { type: String, default: 'apple' },
  family: { type: String, default: 'Rosaceae' },
  e_pedigree: { type: String, default: '' },
  
  // People - Existing
  e_collector: { type: String, default: '' },
  e_breeder: { type: String, default: '' },
  e_breeder_or_collector: { type: String, default: '' },
  e_origin_institute: { type: String, default: '' },
  
  // Status - Existing
  distribute: { type: String, default: 'True' },
  status: { type: String, default: 'AVAIL' },
  e_alive: { type: String, default: 'True' },
  statcmt: { type: String, default: '' },
  uniform: { type: String, default: '' },
  
  // Dates - Existing
  e_released: { type: String, default: '' },
  e_datefmt: { type: String, default: '' },
  e_date_collected: { type: String, default: '' },
  
  // Collection - Existing
  e_quant: { type: String, default: '' },
  e_units: { type: String, default: '' },
  e_cform: { type: String, default: '' },
  e_plants_collected: { type: String, default: '' },
  
  // Comments - Existing
  cmt: { type: String, default: '' },
  e_cmt: { type: String, default: '' },

  // ==========================================
  // NEW TEMPLATE FIELDS
  // ==========================================
  
  // Core Identification
  site_id: { type: String, default: '' },
  prefix_acp: { type: String, default: '' },
  label_name: { type: String, default: '' },
  
  // Taxonomic
  taxon: { type: String, default: '' },
  
  // Location (New Template)
  country: { type: String, default: '' },
  province_state: { type: String, default: '' },
  habitat: { type: String, default: '' },
  location_section_1: { type: String, default: '' },
  location_section_2: { type: String, default: '' },
  location_section_3: { type: String, default: '' },
  location_section_4: { type: String, default: '' },
  
  // People (New Template)
  breeder_or_collector: { type: String, default: '' },
  cooperator: { type: String, default: '' },
  cooperator_new: { type: String, default: '' },
  
  // Plant Classification
  inventory_type: { type: String, default: '' },
  inventory_maintenance_policy: { type: String, default: '' },
  life_form: { type: String, default: '' },
  is_distributable: { type: String, default: '' },
  
  // Fruit Characteristics
  fruitshape_115057: { type: String, default: '' },
  fruitlgth_115156: { type: String, default: '' },
  fruitwidth_115157: { type: String, default: '' },
  frtweight_115121: { type: String, default: '' },
  frtstemthk_115127: { type: String, default: '' },
  frttexture_115123: { type: String, default: '' },
  frtstmlgth_115158: { type: String, default: '' },
  frtflshoxi_115129: { type: String, default: '' },
  
  // Seed Characteristics
  seedcolor_115086: { type: String, default: '' },
  ssize_quantity_of_seed: { type: String, default: '' },
  seedlength_115163: { type: String, default: '' },
  seedwidth_115164: { type: String, default: '' },
  seednumber_115087: { type: String, default: '' },
  seedshape_115167: { type: String, default: '' },
  
  // Phenology
  first_bloom_date: { type: String, default: '' },
  full_bloom_date: { type: String, default: '' },
  
  // Visual/Quality
  colour: { type: String, default: '' },
  color: { type: String, default: '' },  // Alias for colour
  density: { type: String, default: '' },
  fireblight_rating: { type: String, default: '' },
  
  // Descriptive
  narativekeyword: { type: String, default: '' },
  full_narative: { type: String, default: '' },
  pedigree_description: { type: String, default: '' },
  
  // Status (New Template)
  availability_status: { type: String, default: '' },
  ipr_type: { type: String, default: '' },
  level_of_improvement: { type: String, default: '' },
  released_date: { type: String, default: '' },
  released_date_format: { type: String, default: '' },
  
  // ==========================================
  // SYSTEM FIELDS
  // ==========================================
  
  // Images
  images: {
    type: [String],
    default: []
  },

  images_count: {
  type: Number,
  default: 0,
  description: 'Auto-populated: number of images uploaded for this apple'
},
  
  // Custom Fields - allows for user-defined fields
  customFields: {
    type: Map,
    of: String,
    default: new Map()
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  
  // Additional metadata
  metadata: {
    type: Map,
    of: String,
    default: {}
  }
}, {
  timestamps: true,
  collection: 'apples',
  strict: false  // Allow additional fields not defined in schema
});

// Indexes for better query performance
appleSchema.index({ cultivar_name: 'text', accession: 'text', label_name: 'text' });
appleSchema.index({ status: 1, createdAt: -1 });
appleSchema.index({ e_origin_country: 1, country: 1 });
appleSchema.index({ acno: 1 });

// Virtual for full name
appleSchema.virtual('fullName').get(function() {
  return `${this.e_genus} ${this.e_species} '${this.cultivar_name}'`;
});

// Method to get primary image
appleSchema.methods.getPrimaryImage = function() {
  return this.images && this.images.length > 0 ? this.images[0] : null;
};

// Static method to find by cultivar name
appleSchema.statics.findByCultivarName = function(name) {
  return this.findOne({ cultivar_name: new RegExp(name, 'i') });
};

// Pre-save middleware
appleSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const Apple = mongoose.model('Apple', appleSchema);

export { Apple };
export default Apple;