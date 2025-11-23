// models/Apple.js
import mongoose from 'mongoose';

const appleSchema = new mongoose.Schema({
  // Basic Information
  cultivar_name: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  acno: {
    type: String,
    trim: true,
    default: ''
  },
  accession: {
    type: String,
    trim: true,
    default: ''
  },
  
  // Origin Information
  e_origin_country: {
    type: String,
    trim: true,
    default: ''
  },
  e_origin_province: {
    type: String,
    trim: true,
    default: ''
  },
  e_origin_city: {
    type: String,
    trim: true,
    default: ''
  },
  
  // Botanical Information
  e_genus: {
    type: String,
    trim: true,
    default: 'Malus'
  },
  e_species: {
    type: String,
    trim: true,
    default: 'domestica'
  },
  e_pedigree: {
    type: String,
    trim: true,
    default: ''
  },
  e_breeder: {
    type: String,
    trim: true,
    default: ''
  },
  e_collector: {
    type: String,
    trim: true,
    default: ''
  },
  
      
  // Images
  images: {
    type: [String],
    default: []
  },
  
  // Status
  status: {
    type: String,
    enum: ['Active', 'Inactive', 'Archived'],
    default: 'Active'
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
  },
  
  // Excel row index to preserve original order
  excelRowIndex: {
    type: Number,
    default: 0,
    index: true
  }
}, {
  timestamps: true,
  collection: 'apples'
});

// Indexes for better query performance
appleSchema.index({ cultivar_name: 'text', description: 'text' });
appleSchema.index({ status: 1, createdAt: -1 });
appleSchema.index({ e_origin_country: 1 });

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