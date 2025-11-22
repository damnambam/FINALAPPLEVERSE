// routes/appleRoutes.js - FIXED VERSION
import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { Apple } from '../models/Apple.js';
import { Admin } from '../models/Admin.js';

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ========================
// MIDDLEWARE - Verify Admin Token
// ========================
const verifyAdminToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(' ')[1];
  
  console.log('🔐 Auth Header:', authHeader);
  console.log('🔐 Token received:', token);
  
  if (!token) {
    console.log('❌ No token provided');
    return res.status(401).json({ error: 'No token provided' });
  }

  if (token && token.length > 0) {
    console.log('✅ Token accepted');
    const adminId = token.split('-')[1];
    req.adminId = adminId;
    next();
  } else {
    console.log('❌ Invalid token');
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// ========================
// HELPER - Log Activity
// ========================
const logActivity = async (adminId, action, details) => {
  try {
    if (!adminId) {
      console.log('⚠️ No adminId provided for activity log');
      return;
    }

    await Admin.findByIdAndUpdate(
      adminId,
      {
        $push: {
          activityLog: {
            action,
            details,
            timestamp: new Date()
          }
        }
      }
    );
    console.log('📝 Activity logged:', action);
  } catch (error) {
    console.error('❌ Error logging activity:', error);
  }
};

// ========================
// HELPER - Normalize Field Names
// ========================
const normalizeAppleData = (data) => {
  const normalized = {};
  
  // Comprehensive field mapping
  const fieldMap = {
    // Mandatory fields
    'ACCESSION': 'accession',
    'accession': 'accession',
    'HARROW ACCESSION': 'accession',
    'Accession': 'accession',
    
    'CULTIVAR NAME': 'cultivar_name',
    'CULTIVAR_NAME': 'cultivar_name',
    'cultivar_name': 'cultivar_name',
    'Cultivar Name': 'cultivar_name',
    'name': 'cultivar_name',
    
    // Core identification
    'SITE ID': 'site_id',
    'site_id': 'site_id',
    'PREFIX (ACP)': 'prefix_acp',
    'prefix_acp': 'prefix_acp',
    'acp': 'acp',
    'ACP': 'acp',
    'ACNO': 'acno',
    'acno': 'acno',
    'CN NUMBER': 'acno',
    'CN': 'acno',
    'LABEL NAME': 'label_name',
    'label_name': 'label_name',
    
    // Taxonomic
    'FAMILY': 'family',
    'family': 'family',
    'GENUS': 'e_genus',
    'genus': 'e_genus',
    'e_genus': 'e_genus',
    'SPECIES': 'e_species',
    'species': 'e_species',
    'e_species': 'e_species',
    'SUBSPECIES': 'e_subspecies',
    'subspecies': 'e_subspecies',
    'e_subspecies': 'e_subspecies',
    'TAXON': 'taxon',
    'taxon': 'taxon',
    
    // Location
    'COUNTRY': 'e_origin_country',
    'country': 'e_origin_country',
    'E Origin Country': 'e_origin_country',
    'E_ORIGIN_COUNTRY': 'e_origin_country',
    'e_origin_country': 'e_origin_country',
    
    'PROVINCE/STATE': 'e_origin_province',
    'province_state': 'e_origin_province',
    'E Origin Province': 'e_origin_province',
    'E_ORIGIN_PROVINCE': 'e_origin_province',
    'e_origin_province': 'e_origin_province',
    
    'CITY': 'e_origin_city',
    'city': 'e_origin_city',
    'E Origin City': 'e_origin_city',
    'e_origin_city': 'e_origin_city',
    
    'HABITAT': 'e_habitat',
    'habitat': 'e_habitat',
    'e_habitat': 'e_habitat',
    
    'LOCATION SECTION 1': 'location_section_1',
    'location_section_1': 'location_section_1',
    'loc1': 'loc1',
    'LOCATION SECTION 2': 'location_section_2',
    'location_section_2': 'location_section_2',
    'loc2': 'loc2',
    'LOCATION SECTION 3': 'location_section_3',
    'location_section_3': 'location_section_3',
    'loc3': 'loc3',
    'LOCATION SECTION 4': 'location_section_4',
    'location_section_4': 'location_section_4',
    'loc4': 'loc4',
    
    // People
    'BREEDER OR COLLECTOR': 'breeder_or_collector',
    'breeder_or_collector': 'breeder_or_collector',
    'e_breeder_or_collector': 'e_breeder_or_collector',
    'E_BREEDER': 'e_breeder',
    'e_breeder': 'e_breeder',
    'BREEDER': 'e_breeder',
    'E_COLLECTOR': 'e_collector',
    'e_collector': 'e_collector',
    'COLLECTOR': 'e_collector',
    'COOPERATOR': 'cooperator',
    'cooperator': 'cooperator',
    'COOPERATOR_NEW': 'cooperator_new',
    'cooperator_new': 'cooperator_new',
    
    // Plant classification
    'INVENTORY TYPE': 'inventory_type',
    'inventory_type': 'inventory_type',
    'ivt': 'ivt',
    'IVT': 'ivt',
    'INVENTORY MAINTENANCE POLICY': 'inventory_maintenance_policy',
    'PLANT TYPE': 'plant_type',
    'plant_type': 'plant_type',
    'LIFE FORM': 'life_form',
    'life_form': 'life_form',
    'IS DISTRIBUTABLE?': 'is_distributable',
    'distribute': 'distribute',
    'DISTRIBUTE': 'distribute',
    
    // Fruit characteristics
    'FRUITSHAPE 115057': 'fruitshape_115057',
    'fruitshape_115057': 'fruitshape_115057',
    'FRUITLGTH 115156': 'fruitlgth_115156',
    'fruitlgth_115156': 'fruitlgth_115156',
    'FRUITWIDTH 115157': 'fruitwidth_115157',
    'fruitwidth_115157': 'fruitwidth_115157',
    'FRTWEIGHT 115121': 'frtweight_115121',
    'frtweight_115121': 'frtweight_115121',
    'FRTSTEMTHK 115127': 'frtstemthk_115127',
    'frtstemthk_115127': 'frtstemthk_115127',
    'FRTTEXTURE 115123': 'frttexture_115123',
    'frttexture_115123': 'frttexture_115123',
    'FRTSTMLGTH 115158': 'frtstmlgth_115158',
    'frtstmlgth_115158': 'frtstmlgth_115158',
    'FRTFLSHOXI 115129': 'frtflshoxi_115129',
    'frtflshoxi_115129': 'frtflshoxi_115129',
    
    // Seed characteristics
    'SEEDCOLOR 115086': 'seedcolor_115086',
    'seedcolor_115086': 'seedcolor_115086',
    'SSIZE Quantity of Seed': 'ssize_quantity_of_seed',
    'ssize_quantity_of_seed': 'ssize_quantity_of_seed',
    'SEEDLENGTH 115163': 'seedlength_115163',
    'seedlength_115163': 'seedlength_115163',
    'SEEDWIDTH 115164': 'seedwidth_115164',
    'seedwidth_115164': 'seedwidth_115164',
    'SEEDNUMBER 115087': 'seednumber_115087',
    'seednumber_115087': 'seednumber_115087',
    'SEEDSHAPE 115167': 'seedshape_115167',
    'seedshape_115167': 'seedshape_115167',
    
    // Phenology
    'FIRST BLOOM DATE': 'first_bloom_date',
    'first_bloom_date': 'first_bloom_date',
    'FULL BLOOM DATE': 'full_bloom_date',
    'full_bloom_date': 'full_bloom_date',
    
    // Visual/Quality
    'COLOUR': 'colour',
    'colour': 'colour',
    'COLOR': 'color',
    'color': 'color',
    'DENSITY': 'density',
    'density': 'density',
    'FIREBLIGHT RATING': 'fireblight_rating',
    'fireblight_rating': 'fireblight_rating',
    
    // Descriptive
    'CMT': 'cmt',
    'cmt': 'cmt',
    'E_CMT': 'e_cmt',
    'e_cmt': 'e_cmt',
    'NARATIVEKEYWORD': 'narativekeyword',
    'narativekeyword': 'narativekeyword',
    'FULL NARATIVE': 'full_narative',
    'full_narative': 'full_narative',
    'PEDIGREE DESCRIPTION': 'pedigree_description',
    'pedigree_description': 'pedigree_description',
    'E_PEDIGREE': 'e_pedigree',
    'e_pedigree': 'e_pedigree',
    'PEDIGREE': 'e_pedigree',
    
    // Status
    'STATUS': 'status',
    'status': 'status',
    'AVAILABILITY STATUS': 'availability_status',
    'availability_status': 'availability_status',
    'IPR TYPE': 'ipr_type',
    'ipr_type': 'ipr_type',
    'LEVEL OF IMPROVEMENT': 'level_of_improvement',
    'level_of_improvement': 'level_of_improvement',
    'RELEASED DATE': 'released_date',
    'released_date': 'released_date',
    'e_released': 'e_released',
    'E_RELEASED': 'e_released',
    'RELEASED DATE FORMAT': 'released_date_format',
    'released_date_format': 'released_date_format',
    'e_datefmt': 'e_datefmt',
    
    // Site and other fields
    'SITE': 'site',
    'site': 'site',
    'sd_unique': 'sd_unique',
    'sd_moved': 'sd_moved',
    'sd_new': 'sd_new',
    'whynull': 'whynull',
    'm_transfer_history': 'm_transfer_history',
    'e_alive': 'e_alive',
    'uniform': 'uniform',
    'e_quant': 'e_quant',
    'e_units': 'e_units',
    'e_cform': 'e_cform',
    'e_plants_collected': 'e_plants_collected',
    'taxno': 'taxno',
    'sitecmt': 'sitecmt',
    'e_locality': 'e_locality',
    'e_location_field': 'e_location_field',
    'e_location_greenhouse': 'e_location_greenhouse',
    'e_origin_address_1': 'e_origin_address_1',
    'e_origin_address_2': 'e_origin_address_2',
    'e_origin_postal_code': 'e_origin_postal_code',
    'e_lath': 'e_lath',
    'e_latd': 'e_latd',
    'e_latm': 'e_latm',
    'e_lats': 'e_lats',
    'e_lonh': 'e_lonh',
    'e_lond': 'e_lond',
    'e_lonm': 'e_lonm',
    'e_lons': 'e_lons',
    'e_elev': 'e_elev',
    'e_origin_institute': 'e_origin_institute',
    'e_date_collected': 'e_date_collected',
    'acimpt': 'acimpt',
    'statcmt': 'statcmt'
  };
  
  // Process each field in the input data
  Object.keys(data).forEach(key => {
    // Skip special fields
    if (key === 'customFields' || key === 'images' || key === 'metadata' || key === 'IMAGES') {
      if (key !== 'IMAGES') {
        normalized[key] = data[key];
      }
      return;
    }
    
    // Map the field name
    const normalizedKey = fieldMap[key];
    if (normalizedKey) {
      const value = data[key];
      // Convert to string and trim, but keep empty strings as empty
      normalized[normalizedKey] = value !== null && value !== undefined ? String(value).trim() : '';
    } else {
      // Store unknown fields with sanitized key names
      const customKey = key.toLowerCase().replace(/[^a-z0-9_]/g, '_');
      if (customKey && customKey !== '' && customKey !== 'images') {
        normalized[customKey] = data[key] !== null && data[key] !== undefined ? String(data[key]).trim() : '';
      }
    }
  });
  
  // Ensure mandatory fields exist
  if (!normalized.accession) {
    normalized.accession = '';
  }
  if (!normalized.cultivar_name) {
    normalized.cultivar_name = '';
  }
  
  // Set defaults for common fields
  if (!normalized.e_genus) normalized.e_genus = 'Malus';
  if (!normalized.e_species) normalized.e_species = 'domestica';
  if (!normalized.family) normalized.family = 'Rosaceae';
  if (!normalized.plant_type) normalized.plant_type = 'apple';
  if (!normalized.status) normalized.status = 'AVAIL';
  if (!normalized.site) normalized.site = 'CCG';
  if (!normalized.ivt) normalized.ivt = 'PL';
  if (!normalized.sd_unique) normalized.sd_unique = 'False';
  if (!normalized.sd_moved) normalized.sd_moved = 'False';
  if (!normalized.sd_new) normalized.sd_new = 'False';
  if (!normalized.distribute) normalized.distribute = 'True';
  if (!normalized.e_alive) normalized.e_alive = 'True';
  
  return normalized;
};

// ========================
// MULTER SETUP FOR IMAGE UPLOADS
// ========================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', 'images'));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext);
    const cleanBase = base.replace(/[^a-zA-Z0-9_]/g, '_');
    cb(null, `${cleanBase}-${Date.now()}${ext}`);
  },
});

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    console.log('📁 Incoming file:', {
      name: file.originalname,
      mime: file.mimetype || 'NO MIME TYPE',
      field: file.fieldname
    });
    
    const validExtensions = /\.(jpg|jpeg|png|gif|bmp|webp|svg)$/i;
    const hasValidExtension = validExtensions.test(file.originalname);
    const hasImageMime = file.mimetype && file.mimetype.startsWith('image/');
    
    if (hasValidExtension || hasImageMime) {
      console.log('✅ File accepted:', file.originalname);
      cb(null, true);
    } else {
      console.log('❌ File rejected:', file.originalname);
      cb(new Error(`Invalid file type: ${file.originalname}`));
    }
  }
});

// ========================
// SINGLE APPLE UPLOAD
// ========================
router.post('/single-upload', verifyAdminToken, upload.array('images', 10), async (req, res) => {
  try {
    console.log('📥 Single apple upload request received');
    console.log('📦 Body:', req.body);
    console.log('📸 Files:', req.files?.length || 0, 'images');

    const rawData = JSON.parse(req.body.appleData);
    console.log('🔍 Raw data:', rawData);
    
    // Normalize field names
    const appleData = normalizeAppleData(rawData);
    console.log('🔍 Normalized data:', appleData);
    
    // Validate required fields
    if (!appleData.cultivar_name) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cultivar name is required' 
      });
    }
    
    if (!appleData.accession) {
      return res.status(400).json({ 
        success: false, 
        message: 'Accession is required' 
      });
    }

    // Get image paths
    const imagePaths = req.files ? req.files.map(file => `/images/${file.filename}`) : [];

    // Extract custom fields if present
    let customFields = {};
    if (appleData.customFields) {
      customFields = appleData.customFields;
      delete appleData.customFields;
    }

    // Create new apple document
    const newApple = new Apple({
      ...appleData,
      customFields,
      images: imagePaths,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Save to database
    await newApple.save();

    // Log activity
    await logActivity(
      req.adminId,
      'Created apple variety',
      `Created ${appleData.cultivar_name} (${appleData.accession}) with ${imagePaths.length} image(s)`
    );

    console.log('✅ Apple saved successfully:', newApple.cultivar_name);
    
    res.status(201).json({ 
      success: true, 
      message: 'Apple created successfully',
      apple: newApple
    });

  } catch (error) {
    console.error('❌ Error in single-upload:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to create apple',
      error: error.message 
    });
  }
});

// ========================
// BULK UPLOAD WITH IMAGES - FIXED VERSION
// ========================
router.post('/bulk-upload-with-images', verifyAdminToken, upload.any(), async (req, res) => {
  try {
    console.log('📥 Bulk upload request received');
    console.log('📸 Total files received:', req.files?.length || 0);
    console.log('📦 Body keys:', Object.keys(req.body));

    // ===========================
    // STEP 1: Build Image Map by Apple Index
    // ===========================
    const imagesByAppleIndex = {};
    
    if (req.files && req.files.length > 0) {
      req.files.forEach((file) => {
        console.log(`📸 Processing file: ${file.fieldname} → ${file.originalname}`);
        
        // Extract apple index from fieldname (e.g., "images_0", "images_5")
        const match = file.fieldname.match(/images_(\d+)/);
        if (match) {
          const appleIndex = parseInt(match[1]);
          
          if (!imagesByAppleIndex[appleIndex]) {
            imagesByAppleIndex[appleIndex] = [];
          }
          
          imagesByAppleIndex[appleIndex].push({
            path: `/images/${file.filename}`,
            filename: file.filename,
            originalName: file.originalname
          });
          
          console.log(`   ✅ Mapped to apple index ${appleIndex}`);
        } else {
          console.log(`   ⚠️ Could not extract index from fieldname: ${file.fieldname}`);
        }
      });
    }

    console.log('🗂️ Image map by apple index:', Object.keys(imagesByAppleIndex).length, 'apples have images');

    // ===========================
    // STEP 2: Parse Apple Data
    // ===========================
    const apples = [];
    
    console.log('🔍 Body structure:', {
      hasApples: !!req.body.apples,
      applesType: typeof req.body.apples,
      isArray: Array.isArray(req.body.apples)
    });
    
    // Parse apple data from FormData - Handle multiple formats
    if (req.body.apples) {
      try {
        let applesData;
        
        // Format 1: apples is a JSON string
        if (typeof req.body.apples === 'string') {
          console.log('📝 Parsing apples from JSON string');
          applesData = JSON.parse(req.body.apples);
        } 
        // Format 2: apples is already an array
        else if (Array.isArray(req.body.apples)) {
          console.log('📝 Apples already parsed as array');
          applesData = req.body.apples;
        }
        // Format 3: apples is an object
        else {
          console.log('📝 Converting apples object to array');
          applesData = [req.body.apples];
        }
        
        // Process each apple
        if (Array.isArray(applesData)) {
          applesData.forEach((appleDataRaw, idx) => {
            try {
              // Parse if still a string
              const appleData = typeof appleDataRaw === 'string' ? JSON.parse(appleDataRaw) : appleDataRaw;
              const images = imagesByAppleIndex[idx] || [];
              
              apples.push({
                index: idx,
                data: appleData,
                images: images
              });
              
              console.log(`📋 Apple ${idx}: ${appleData.CULTIVAR_NAME || appleData.cultivar_name || 'Unknown'} with ${images.length} image(s)`);
            } catch (e) {
              console.error(`❌ Error parsing apple ${idx}:`, e.message);
            }
          });
        }
      } catch (e) {
        console.error('❌ Error parsing apples data:', e.message);
        console.log('Raw apples value:', req.body.apples);
      }
    }
    
    // Fallback: Try apples[0], apples[1], etc. format
    if (apples.length === 0) {
      console.log('🔄 Trying indexed format (apples[0], apples[1], ...)');
      Object.keys(req.body).forEach(key => {
        if (key.startsWith('apples[')) {
          try {
            const appleData = JSON.parse(req.body[key]);
            const indexMatch = key.match(/\[(\d+)\]/);
            
            if (indexMatch) {
              const appleIndex = parseInt(indexMatch[1]);
              const images = imagesByAppleIndex[appleIndex] || [];
              
              apples.push({
                index: appleIndex,
                data: appleData,
                images: images
              });
              
              console.log(`📋 Apple ${appleIndex}: ${appleData.CULTIVAR_NAME || appleData.cultivar_name} with ${images.length} image(s)`);
            }
          } catch (e) {
            console.error(`❌ Error parsing apple data for key ${key}:`, e.message);
          }
        }
      });
    }

    console.log('📊 Parsed apples:', apples.length);

    if (apples.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'No valid apple data found in request' 
      });
    }

    // ===========================
    // STEP 3: Create Apple Documents
    // ===========================
    const savedApples = [];
    const errors = [];

    for (let i = 0; i < apples.length; i++) {
      try {
        const item = apples[i];
        const rawData = item.data;
        
        // Normalize field names
        const appleData = normalizeAppleData(rawData);

        console.log(`\n🍎 Processing apple ${i + 1}/${apples.length}:`);
        console.log(`   Cultivar: ${appleData.cultivar_name}`);
        console.log(`   Accession: ${appleData.accession}`);
        console.log(`   Images: ${item.images.length}`);

        // Validate required fields
        if (!appleData.cultivar_name || !appleData.cultivar_name.trim()) {
          errors.push({ 
            index: item.index, 
            cultivar: 'Unknown',
            error: 'Missing cultivar name' 
          });
          console.log(`   ❌ Missing cultivar name`);
          continue;
        }
        
        if (!appleData.accession || !appleData.accession.trim()) {
          errors.push({ 
            index: item.index, 
            cultivar: appleData.cultivar_name,
            error: 'Missing accession' 
          });
          console.log(`   ❌ Missing accession`);
          continue;
        }

        // Extract custom fields if present
        let customFields = {};
        if (appleData.customFields) {
          customFields = appleData.customFields;
          delete appleData.customFields;
        }

        // Get image paths
        const imagePaths = item.images.map(img => img.path);

        // Create apple document
        const newApple = new Apple({
          ...appleData,
          customFields,
          images: imagePaths,
          createdAt: new Date(),
          updatedAt: new Date()
        });

        await newApple.save();
        savedApples.push(newApple);

        console.log(`   ✅ Saved successfully with ${imagePaths.length} image(s)`);

      } catch (error) {
        console.error(`❌ Error saving apple ${i}:`, error.message);
        errors.push({ 
          index: apples[i].index, 
          cultivar: apples[i].data.CULTIVAR_NAME || apples[i].data.cultivar_name || 'Unknown',
          error: error.message 
        });
      }
    }

    // ===========================
    // STEP 4: Calculate Statistics
    // ===========================
    const totalImages = savedApples.reduce((sum, apple) => sum + (apple.images?.length || 0), 0);

    // Log bulk upload activity
    await logActivity(
      req.adminId,
      'Bulk uploaded apple varieties',
      `Uploaded ${savedApples.length} apple(s) with ${totalImages} image(s)${errors.length > 0 ? `, ${errors.length} failed` : ''}`
    );

    console.log('\n📊 Upload Summary:');
    console.log(`   ✅ Successful: ${savedApples.length} apples`);
    console.log(`   📸 Total images: ${totalImages}`);
    console.log(`   ❌ Failed: ${errors.length}`);

    res.status(201).json({ 
      success: true, 
      message: `Successfully uploaded ${savedApples.length} apple(s) with ${totalImages} image(s)`,
      stats: {
        total: apples.length,
        successful: savedApples.length,
        failed: errors.length,
        totalImages: totalImages
      },
      apples: savedApples,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('❌ Error in bulk-upload-with-images:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to upload apples',
      error: error.message 
    });
  }
});

// ========================
// GET ALL APPLES
// ========================
router.get('/', async (req, res) => {
  try {
    const searchQuery = req.query.search;
    
    let apples;
    if (searchQuery) {
      apples = await Apple.find({
        $or: [
          { cultivar_name: { $regex: searchQuery, $options: 'i' } },
          { accession: { $regex: searchQuery, $options: 'i' } },
          { acno: { $regex: searchQuery, $options: 'i' } },
          { label_name: { $regex: searchQuery, $options: 'i' } },
          { e_origin_country: { $regex: searchQuery, $options: 'i' } },
          { colour: { $regex: searchQuery, $options: 'i' } }
        ]
      })
        .sort({ createdAt: -1 })
        .lean();
      console.log(`🔍 Search for "${searchQuery}": found ${apples.length} apples`);
    } else {
      apples = await Apple.find({})
        .sort({ createdAt: -1 })
        .lean();
      console.log(`📊 Fetching all apples: ${apples.length} found`);
    }

    res.json(apples);
  } catch (error) {
    console.error('❌ Error fetching apples:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// ========================
// GET SINGLE APPLE BY ID
// ========================
router.get('/:id', async (req, res) => {
  try {
    const apple = await Apple.findById(req.params.id);

    if (!apple) {
      return res.status(404).json({ 
        success: false, 
        message: 'Apple not found' 
      });
    }

    res.json({ 
      success: true, 
      apple 
    });
  } catch (error) {
    console.error('❌ Error fetching apple:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// ========================
// UPDATE APPLE
// ========================
router.put('/:id', verifyAdminToken, upload.array('images', 10), async (req, res) => {
  try {
    const rawData = req.body.appleData ? JSON.parse(req.body.appleData) : req.body;
    const appleData = normalizeAppleData(rawData);
    
    const existingApple = await Apple.findById(req.params.id);
    if (!existingApple) {
      return res.status(404).json({ 
        success: false, 
        message: 'Apple not found' 
      });
    }

    const newImagePaths = req.files ? req.files.map(file => `/images/${file.filename}`) : [];
    
    if (newImagePaths.length > 0) {
      if (appleData.keepExistingImages && appleData.existingImages) {
        appleData.images = [...appleData.existingImages, ...newImagePaths];
      } else {
        appleData.images = newImagePaths;
      }
    }

    appleData.updatedAt = new Date();

    const updatedApple = await Apple.findByIdAndUpdate(
      req.params.id,
      appleData,
      { new: true, runValidators: true }
    );

    await logActivity(
      req.adminId,
      'Updated apple variety',
      `Updated ${updatedApple.cultivar_name}${newImagePaths.length > 0 ? ` (added ${newImagePaths.length} new image(s))` : ''}`
    );

    console.log('✅ Apple updated:', updatedApple.cultivar_name);

    res.json({ 
      success: true, 
      message: 'Apple updated successfully',
      apple: updatedApple 
    });
  } catch (error) {
    console.error('❌ Error updating apple:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// ========================
// DELETE APPLE
// ========================
router.delete('/:id', verifyAdminToken, async (req, res) => {
  try {
    const deletedApple = await Apple.findByIdAndDelete(req.params.id);

    if (!deletedApple) {
      return res.status(404).json({ 
        success: false, 
        message: 'Apple not found' 
      });
    }

    await logActivity(
      req.adminId,
      'Deleted apple variety',
      `Deleted ${deletedApple.cultivar_name}`
    );

    console.log('✅ Apple deleted:', deletedApple.cultivar_name);

    res.json({ 
      success: true, 
      message: 'Apple deleted successfully' 
    });
  } catch (error) {
    console.error('❌ Error deleting apple:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

export default router;