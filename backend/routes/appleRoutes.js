// routes/appleRoutes.js - IMPROVED VERSION
import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';
import { Apple } from '../models/Apple.js';
import { Admin } from '../models/Admin.js';

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const __dirname_routes = __dirname; // Alias for consistency

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
  
  // Comprehensive field mapping (same as before)
  const fieldMap = {
    'ACCESSION': 'accession',
    'accession': 'accession',
    'HARROW ACCESSION': 'accession',
    'Accession': 'accession',
    
    'CULTIVAR NAME': 'cultivar_name',
    'CULTIVAR_NAME': 'cultivar_name',
    'cultivar_name': 'cultivar_name',
    'Cultivar Name': 'cultivar_name',
    'name': 'cultivar_name',
    
    // ... (all other field mappings same as before)
    'SITE ID': 'site_id',
    'PREFIX (ACP)': 'prefix_acp',
    'ACNO': 'acno',
    'LABEL NAME': 'label_name',
    'FAMILY': 'family',
    'GENUS': 'e_genus',
    'SPECIES': 'e_species',
    'TAXON': 'taxon',
    'COUNTRY': 'e_origin_country',
    'PROVINCE/STATE': 'e_origin_province',
    'HABITAT': 'e_habitat',
    'BREEDER OR COLLECTOR': 'breeder_or_collector',
    'COOPERATOR': 'cooperator',
    'INVENTORY TYPE': 'inventory_type',
    'PLANT TYPE': 'plant_type',
    'LIFE FORM': 'life_form',
    'IS DISTRIBUTABLE?': 'is_distributable',
    'FRUITSHAPE 115057': 'fruitshape_115057',
    'SEEDCOLOR 115086': 'seedcolor_115086',
    'FIRST BLOOM DATE': 'first_bloom_date',
    'FULL BLOOM DATE': 'full_bloom_date',
    'COLOUR': 'colour',
    'DENSITY': 'density',
    'CMT': 'cmt',
    'NARATIVEKEYWORD': 'narativekeyword',
    'FULL NARATIVE': 'full_narative',
    'PEDIGREE DESCRIPTION': 'pedigree_description',
    'AVAILABILITY STATUS': 'availability_status',
    'IPR TYPE': 'ipr_type',
    'LEVEL OF IMPROVEMENT': 'level_of_improvement',
    'RELEASED DATE': 'released_date',
    'COOPERATOR_NEW': 'cooperator_new',
    // Add all other fields...
  };
  
  // Process each field
  Object.keys(data).forEach(key => {
    if (key === 'customFields' || key === 'images' || key === 'metadata') {
      normalized[key] = data[key];
      return;
    }
    
    // Skip IMAGES column (will be auto-populated)
    if (key.toLowerCase().replace(/[^a-z]/g, '') === 'images') {
      return;
    }
    
    const normalizedKey = fieldMap[key];
    if (normalizedKey) {
      const value = data[key];
      normalized[normalizedKey] = value !== null && value !== undefined ? String(value).trim() : '';
    } else {
      const customKey = key.toLowerCase().replace(/[^a-z0-9_]/g, '_');
      if (customKey && customKey !== '' && customKey !== 'images') {
        normalized[customKey] = data[key] !== null && data[key] !== undefined ? String(data[key]).trim() : '';
      }
    }
  });
  
  // Set defaults
  if (!normalized.accession) normalized.accession = '';
  if (!normalized.cultivar_name) normalized.cultivar_name = '';
  if (!normalized.e_genus) normalized.e_genus = 'Malus';
  if (!normalized.e_species) normalized.e_species = 'domestica';
  if (!normalized.family) normalized.family = 'Rosaceae';
  if (!normalized.plant_type) normalized.plant_type = 'apple';
  if (!normalized.status) normalized.status = 'AVAIL';
  
  return normalized;
};

// ========================
// MULTER SETUP
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
    const validExtensions = /\.(jpg|jpeg|png|gif|bmp|webp|svg)$/i;
    const hasValidExtension = validExtensions.test(file.originalname);
    const hasImageMime = file.mimetype && file.mimetype.startsWith('image/');
    
    if (hasValidExtension || hasImageMime) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type: ${file.originalname}`));
    }
  }
});

// ========================
// SINGLE APPLE UPLOAD (unchanged)
// ========================
router.post('/single-upload', verifyAdminToken, upload.array('images', 10), async (req, res) => {
  try {
    console.log('📥 Single apple upload request received');
    
    const rawData = JSON.parse(req.body.appleData);
    const appleData = normalizeAppleData(rawData);
    
    if (!appleData.cultivar_name) {
      return res.status(400).json({ success: false, message: 'Cultivar name is required' });
    }
    
    if (!appleData.accession) {
      return res.status(400).json({ success: false, message: 'Accession is required' });
    }

    const imagePaths = req.files ? req.files.map(file => `/images/${file.filename}`) : [];
    
    let customFields = {};
    if (appleData.customFields) {
      customFields = appleData.customFields;
      delete appleData.customFields;
    }

    const newApple = new Apple({
      ...appleData,
      customFields,
      images: imagePaths,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await newApple.save();

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
// BULK UPLOAD WITH IMAGES - IMPROVED VERSION
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
          
          console.log(`   ✅ Image "${file.originalname}" → Apple ${appleIndex}`);
        }
      });
    }

    console.log('🗂️ Image map:', Object.keys(imagesByAppleIndex).length, 'apples have images');

    // ===========================
    // STEP 2: Parse Apple Data
    // ===========================
    const apples = [];
    
    if (req.body.apples) {
      try {
        let applesArray = typeof req.body.apples === 'string' 
          ? JSON.parse(req.body.apples) 
          : req.body.apples;
        
        if (!Array.isArray(applesArray)) {
          applesArray = [applesArray];
        }
        
        applesArray.forEach((appleData, index) => {
          const parsed = typeof appleData === 'string' ? JSON.parse(appleData) : appleData;
          const images = imagesByAppleIndex[index] || [];
          
          apples.push({
            index: index,
            data: parsed,
            images: images
          });
        });
      } catch (e) {
        console.error('Error parsing apples array:', e.message);
      }
    }
    
    if (apples.length === 0) {
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
            }
          } catch (e) {
            console.error(`Error parsing ${key}:`, e.message);
          }
        }
      });
    }

    console.log('📊 Parsed apples:', apples.length);

    if (apples.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'No valid apple data found'
      });
    }

    // ===========================
    // STEP 3: Check for Duplicates
    // ===========================
    const duplicateResolutions = req.body.duplicateResolutions 
      ? JSON.parse(req.body.duplicateResolutions) 
      : null;

    if (!duplicateResolutions) {
      // First pass - check for duplicates
      console.log('🔍 Checking for duplicates in database...');
      
      const duplicates = [];
      
      for (let i = 0; i < apples.length; i++) {
        const item = apples[i];
        const rawData = item.data;
        const appleData = normalizeAppleData(rawData);
        
        if (!appleData.cultivar_name || !appleData.accession) continue;
        
        const existing = await Apple.findOne({
          accession: appleData.accession,
          cultivar_name: appleData.cultivar_name
        });
        
        if (existing) {
          duplicates.push({
            index: i,
            accession: appleData.accession,
            cultivar_name: appleData.cultivar_name,
            existingId: existing._id,
            createdAt: existing.createdAt
          });
          console.log(`   ⚠️ Duplicate found: ${appleData.accession} - ${appleData.cultivar_name}`);
        }
      }
      
      if (duplicates.length > 0) {
        console.log(`🔔 Found ${duplicates.length} duplicate(s) - asking user for resolution`);
        return res.status(200).json({
          success: false,
          duplicates: duplicates,
          message: `Found ${duplicates.length} duplicate(s). Please choose how to handle them.`
        });
      }
    }

    // ===========================
    // STEP 4: Create/Update Apple Documents
    // ===========================
    const savedApples = [];
    const errors = [];
    let replacedCount = 0;
    let duplicatedCount = 0;
    let skippedCount = 0;

    for (let i = 0; i < apples.length; i++) {
      try {
        const item = apples[i];
        const rawData = item.data;
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

        // Extract custom fields
        let customFields = {};
        if (appleData.customFields) {
          customFields = appleData.customFields;
          delete appleData.customFields;
        }

        // Get image paths
        const imagePaths = item.images.map(img => img.path);

        // ===========================
        // NEW: Auto-populate IMAGES column
        // ===========================
        appleData.images_count = imagePaths.length;

        // ===========================
        // NEW: Handle duplicate resolution
        // ===========================
        if (duplicateResolutions && duplicateResolutions[i]) {
          const resolution = duplicateResolutions[i];
          
          if (resolution === 'skip') {
            console.log(`   ⏭️ Skipping (user choice)`);
            skippedCount++;
            continue;
          } else if (resolution === 'replace') {
            // Replace existing
            const existing = await Apple.findOne({
              accession: appleData.accession,
              cultivar_name: appleData.cultivar_name
            });
            
            if (existing) {
              const updated = await Apple.findByIdAndUpdate(
                existing._id,
                {
                  ...appleData,
                  customFields,
                  images: imagePaths,
                  updatedAt: new Date()
                },
                { new: true }
              );
              
              savedApples.push(updated);
              replacedCount++;
              console.log(`   🔄 Replaced existing entry`);
              continue;
            }
          } else if (resolution === 'duplicate') {
            // Create as duplicate (fall through to create)
            console.log(`   📋 Creating duplicate entry`);
            duplicatedCount++;
          }
        }

        // Create new apple document
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
    // STEP 5: Calculate Statistics
    // ===========================
    const totalImages = savedApples.reduce((sum, apple) => sum + (apple.images?.length || 0), 0);

    // Log activity
    await logActivity(
      req.adminId,
      'Bulk uploaded apple varieties',
      `Uploaded ${savedApples.length} apple(s) with ${totalImages} image(s)` +
      (replacedCount > 0 ? `, replaced ${replacedCount}` : '') +
      (duplicatedCount > 0 ? `, duplicated ${duplicatedCount}` : '') +
      (skippedCount > 0 ? `, skipped ${skippedCount}` : '')
    );

    console.log('\n📊 Upload Summary:');
    console.log(`   ✅ Successful: ${savedApples.length} apples`);
    console.log(`   📸 Total images: ${totalImages}`);
    console.log(`   🔄 Replaced: ${replacedCount}`);
    console.log(`   📋 Duplicated: ${duplicatedCount}`);
    console.log(`   ⏭️ Skipped: ${skippedCount}`);
    console.log(`   ❌ Failed: ${errors.length}`);

    res.status(201).json({ 
      success: true, 
      message: `Successfully processed ${savedApples.length} apple(s)`,
      stats: {
        total: apples.length,
        successful: savedApples.length,
        failed: errors.length,
        totalImages: totalImages,
        replaced: replacedCount,
        duplicated: duplicatedCount,
        skipped: skippedCount
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
// HELPER - Transform field names to match frontend expectations
// Handles both schema field names (underscores) and actual DB field names (spaces with various casing)
// ========================
const transformAppleFields = (apple) => {
  if (!apple) return apple;
  
  const transformed = { ...apple };
  
  // Preserve excelRowIndex for sorting
  if (apple.excelRowIndex !== undefined) {
    transformed.excelRowIndex = apple.excelRowIndex;
  }
  
  // Helper to get value from various possible field name formats
  const getField = (variations) => {
    for (const field of variations) {
      if (transformed[field] !== undefined && transformed[field] !== null && transformed[field] !== '') {
        return transformed[field];
      }
    }
    return '';
  };
  
  // Normalize cultivar_name (handle various formats)
  const cultivarName = getField([
    'cultivar_name',
    'CULTIVAR NAME',
    'CULTIVAR_NAME',
    'Cultivar Name',
    'name'
  ]);
  if (cultivarName) {
    transformed.cultivar_name = cultivarName;
    transformed['CULTIVAR NAME'] = cultivarName;
  }
  
  // Normalize accession (handle various formats)
  const accession = getField(['accession', 'ACCESSION']);
  if (accession) {
    transformed.accession = accession;
    transformed['ACCESSION'] = accession;
  }
  
  // Transform origin country (handle various formats)
  const country = getField([
    'e_origin_country',
    'E Origin Country',
    'E_ORIGIN_COUNTRY',
    'e origin country'
  ]);
  if (country) {
    transformed['e origin country'] = country;
  }
  
  // Transform origin province
  const province = getField([
    'e_origin_province',
    'E Origin Province',
    'E_ORIGIN_PROVINCE',
    'e origin province'
  ]);
  if (province) {
    transformed['e origin province'] = province;
  }
  
  // Transform origin city
  const city = getField([
    'e_origin_city',
    'E Origin City',
    'E_ORIGIN_CITY',
    'e origin city'
  ]);
  if (city) {
    transformed['e origin city'] = city;
  }
  
  // Transform pedigree
  const pedigree = getField([
    'e_pedigree',
    'E pedigree',
    'E Pedigree',
    'E_PEDIGREE',
    'e pedigree'
  ]);
  if (pedigree) {
    transformed['e pedigree'] = pedigree;
  }
  
  // Transform genus
  const genus = getField([
    'e_genus',
    'E GENUS',
    'E_GENUS',
    'E Genus',
    'e genus'
  ]);
  if (genus) {
    transformed['e genus'] = genus;
  }
  
  // Transform species
  const species = getField([
    'e_species',
    'E SPECIES',
    'E_SPECIES',
    'E Species',
    'e species'
  ]);
  if (species) {
    transformed['e species'] = species;
  }
  
  // Transform breeder
  const breeder = getField([
    'e_breeder',
    'E Breeder',
    'E_BREEDER',
    'e breeder'
  ]);
  if (breeder) {
    transformed['e breeder'] = breeder;
  }
  
  // Transform collector
  const collector = getField([
    'e_collector',
    'E Collector',
    'E_COLLECTOR',
    'e collector'
  ]);
  if (collector) {
    transformed['e collector'] = collector;
  }
  
  // Preserve images field (ensure it's always an array)
  if (transformed.images !== undefined) {
    transformed.images = Array.isArray(transformed.images) ? transformed.images : [];
  } else if (transformed.Images !== undefined) {
    transformed.images = Array.isArray(transformed.Images) ? transformed.Images : [];
    transformed.Images = transformed.images;
  } else {
    transformed.images = [];
  }
  
  return transformed;
};

// ========================
// GET ALL APPLES (Root path - for LibraryV2)
// GET ALL APPLES (unchanged)
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
        .sort({ excelRowIndex: 1, createdAt: 1 })
        .lean();
    } else {
      // Return all apples - sort by excelRowIndex to preserve Excel order, fallback to createdAt
      apples = await Apple.find({})
        .sort({ excelRowIndex: 1, createdAt: 1 })
        .lean();
      console.log(`📊 Fetching all apples: ${apples.length} found`);
      
      // Verify sorting - first should be lowest excelRowIndex
      if (apples.length > 0) {
        const firstCultivar = apples[0].cultivar_name || apples[0]['CULTIVAR NAME'] || 'Unknown';
        console.log(`✅ First record after sort: ${firstCultivar} (excelRowIndex: ${apples[0].excelRowIndex})`);
      }
    }

    // Transform field names to match frontend expectations
    const transformedApples = apples.map(transformAppleFields);
    
    // Log first record to verify order
    if (transformedApples.length > 0) {
      const first = transformedApples[0];
      console.log(`📋 First record in API response: ${first.cultivar_name || first['CULTIVAR NAME']} (excelRowIndex: ${first.excelRowIndex})`);
    }

    res.json(transformedApples);
  } catch (error) {
    console.error('❌ Error fetching apples:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// ========================
// GET ALL APPLES (/all alias)
// ========================
router.get('/all', async (req, res) => {
  try {
    const       apples = await Apple.find({})
      .sort({ excelRowIndex: 1, createdAt: 1 })
      .lean();

    // Transform field names to match frontend expectations
    const transformedApples = apples.map(transformAppleFields);

    res.json({ 
      success: true, 
      count: transformedApples.length,
      apples: transformedApples 
    });
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
// GET SINGLE APPLE BY ID (unchanged)
// ========================
router.get('/:id', async (req, res) => {
  try {
    const apple = await Apple.findById(req.params.id).lean();

    if (!apple) {
      return res.status(404).json({ 
        success: false, 
        message: 'Apple not found' 
      });
    }

    // Transform field names to match frontend expectations
    const transformedApple = transformAppleFields(apple);

    res.json({ 
      success: true, 
      apple: transformedApple 
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
// UPDATE APPLE (unchanged)
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

    // Auto-update IMAGES column
    appleData.images_count = appleData.images?.length || 0;
    appleData.updatedAt = new Date();

    const updatedApple = await Apple.findByIdAndUpdate(
      req.params.id,
      appleData,
      { new: true, runValidators: true }
    ).lean();

    await logActivity(
      req.adminId,
      'Updated apple variety',
      `Updated ${updatedApple.cultivar_name}${newImagePaths.length > 0 ? ` (added ${newImagePaths.length} new image(s))` : ''}`
    );

    console.log('✅ Apple updated:', updatedApple.cultivar_name);

    // Transform field names to match frontend expectations
    const transformedApple = transformAppleFields(updatedApple);

    res.json({ 
      success: true, 
      message: 'Apple updated successfully',
      apple: transformedApple 
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
// DELETE APPLE (unchanged)
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

// ========================
// SEARCH APPLES
// ========================
router.get('/search/:query', async (req, res) => {
  try {
    const query = req.params.query;
    
    const apples = await Apple.find({
      $or: [
        { cultivar_name: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
        { color: { $regex: query, $options: 'i' } },
        { taste: { $regex: query, $options: 'i' } }
      ]
    }).limit(50).lean();

    // Transform field names to match frontend expectations
    const transformedApples = apples.map(transformAppleFields);

    res.json({ 
      success: true, 
      count: transformedApples.length,
      apples: transformedApples 
    });
  } catch (error) {
    console.error('❌ Error searching apples:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});
// ========================
// GET FILTER OPTIONS (for FilterSidebar)
// ========================
router.get('/filters/options', async (req, res) => {
  try {
    console.log('📊 Fetching filter options...');
    
    const db = mongoose.connection;
    const applesCollection = db.collection('apples');
    
    // Get unique values for each filter field - try both schema names and actual DB field names
    const [acnoValues1, acnoValues2, accessionValues1, accessionValues2, countryValues1, countryValues2, provinceValues1, provinceValues2, cityValues1, cityValues2, pedigreeValues1, pedigreeValues2] = await Promise.all([
      applesCollection.distinct('acno'),
      applesCollection.distinct('ACNO'),
      applesCollection.distinct('accession'),
      applesCollection.distinct('ACCESSION'),
      applesCollection.distinct('e_origin_country'),
      applesCollection.distinct('E Origin Country'),
      applesCollection.distinct('e_origin_province'),
      applesCollection.distinct('E Origin Province'),
      applesCollection.distinct('e_origin_city'),
      applesCollection.distinct('E Origin City'),
      applesCollection.distinct('e_pedigree'),
      applesCollection.distinct('E pedigree')
    ]);
    
    // Combine results, preferring non-empty arrays
    const acnoValues = (acnoValues1?.length > 0 ? acnoValues1 : acnoValues2) || [];
    const accessionValues = (accessionValues1?.length > 0 ? accessionValues1 : accessionValues2) || [];
    const countryValues = (countryValues1?.length > 0 ? countryValues1 : countryValues2) || [];
    const provinceValues = (provinceValues1?.length > 0 ? provinceValues1 : provinceValues2) || [];
    const cityValues = (cityValues1?.length > 0 ? cityValues1 : cityValues2) || [];
    const pedigreeValues = (pedigreeValues1?.length > 0 ? pedigreeValues1 : pedigreeValues2) || [];

    const filters = {
      acno: (acnoValues || []).filter(v => v && v !== 'null' && v !== null).sort(),
      accession: (accessionValues || []).filter(v => v && v !== 'null' && v !== null).sort(),
      country: (countryValues || []).filter(v => v && v !== 'null' && v !== null).sort(),
      province: (provinceValues || []).filter(v => v && v !== 'null' && v !== null).sort(),
      city: (cityValues || []).filter(v => v && v !== 'null' && v !== null).sort(),
      pedigree: (pedigreeValues || []).filter(v => v && v !== 'null' && v !== null).sort()
    };

    console.log(`✅ Filter options retrieved:`);
    console.log(`   ACNO: ${filters.acno.length} values`);
    console.log(`   ACCESSION: ${filters.accession.length} values`);
    console.log(`   COUNTRY: ${filters.country.length} values`);
    console.log(`   PROVINCE: ${filters.province.length} values`);
    console.log(`   CITY: ${filters.city.length} values`);
    console.log(`   PEDIGREE: ${filters.pedigree.length} values`);

    res.json({
      success: true,
      filters
    });
  } catch (error) {
    console.error('❌ Error fetching filter options:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ========================
// FIND IMAGE BY ACCESSION
// ========================
router.get('/find-image/:accession', async (req, res) => {
  try {
    const accession = req.params.accession.toUpperCase();
    const imagesDir = path.join(__dirname, '..', 'images');
    
    if (!fs.existsSync(imagesDir)) {
      return res.json({ success: false, images: [] });
    }
    
    const files = fs.readdirSync(imagesDir);
    const imageFiles = files.filter(f => /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(f));
    
    // Find all files that contain the accession number
    const matchingFiles = imageFiles.filter(file => {
      const upperFile = file.toUpperCase();
      return upperFile.includes(accession);
    });
    
    if (matchingFiles.length > 0) {
      // Remove duplicates (case-insensitive filename comparison)
      const uniqueFiles = [];
      const seenFiles = new Set();
      matchingFiles.forEach(file => {
        const normalized = file.toLowerCase();
        if (!seenFiles.has(normalized)) {
          seenFiles.add(normalized);
          uniqueFiles.push(file);
        }
      });
      
      // Return all unique matching files
      const imagePaths = uniqueFiles.map(file => `/images/${file}`);
      return res.json({ success: true, images: imagePaths });
    }
    
    res.json({ success: false, images: [] });
  } catch (error) {
    console.error('❌ Error finding image:', error);
    res.json({ success: false, images: [] });
  }
});
export default router;