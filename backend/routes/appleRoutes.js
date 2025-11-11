// routes/appleRoutes.js
import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { Apple } from '../models/Apple.js';
import { Admin } from '../models/Admin.js';

const router = express.Router();

// Fix __dirname for ES Modules
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

  // Accept any token that exists (for development)
  if (token && token.length > 0) {
    console.log('✅ Token accepted');
    // Extract admin ID from token (format: admin-{id}-{timestamp})
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
// MULTER SETUP FOR IMAGE UPLOADS
// ========================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Save images to 'images' folder in project root
    cb(null, path.join(__dirname, '..', 'images'));
  },
  filename: (req, file, cb) => {
    // Create unique filename: originalname-timestamp.ext
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext);
    const cleanBase = base.replace(/[^a-zA-Z0-9]/g, '_'); // Remove special chars
    cb(null, `${cleanBase}-${Date.now()}${ext}`);
  },
});

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit per file
  fileFilter: (req, file, cb) => {
    console.log('📁 Incoming file:', {
      name: file.originalname,
      mime: file.mimetype || 'NO MIME TYPE',
      field: file.fieldname
    });
    
    // Check file extension (more reliable for Blobs from ZIP)
    const validExtensions = /\.(jpg|jpeg|png|gif|bmp|webp|svg)$/i;
    const hasValidExtension = validExtensions.test(file.originalname);
    
    // Also check MIME if available
    const hasImageMime = file.mimetype && file.mimetype.startsWith('image/');
    
    // Accept if either condition is true
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

    // Parse apple data from JSON string
    const appleData = JSON.parse(req.body.appleData);
    
    // Validate required field
    if (!appleData.cultivar_name) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cultivar name is required' 
      });
    }

    // Get image paths
    const imagePaths = req.files ? req.files.map(file => `/images/${file.filename}`) : [];

    // Create new apple document
    const newApple = new Apple({
      cultivar_name: appleData.cultivar_name,
      acno: appleData.acno || '',
      accession: appleData.accession || '',
      e_origin_country: appleData.e_origin_country || '',
      e_origin_province: appleData.e_origin_province || '',
      e_origin_city: appleData.e_origin_city || '',
      e_genus: appleData.e_genus || 'Malus',
      e_species: appleData.e_species || 'domestica',
      e_pedigree: appleData.e_pedigree || '',
      e_breeder: appleData.e_breeder || '',
      e_collector: appleData.e_collector || '',
      description: appleData.description || '',
      taste: appleData.taste || '',
      texture: appleData.texture || '',
      uses: appleData.uses || '',
      harvestSeason: appleData.harvestSeason || '',
      hardiness: appleData.hardiness || '',
      storage: appleData.storage || '',
      color: appleData.color || '',
      images: imagePaths,
      status: 'Active',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Save to database
    await newApple.save();

    // Log activity
    await logActivity(
      req.adminId,
      'Created apple variety',
      `Created ${appleData.cultivar_name} with ${imagePaths.length} image(s)`
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
// BULK UPLOAD WITH IMAGES
// ========================
router.post('/bulk-upload-with-images', verifyAdminToken, upload.any(), async (req, res) => {
  try {
    console.log('📥 Bulk upload request received');
    console.log('📸 Total files received:', req.files?.length || 0);
    console.log('📦 Body keys:', Object.keys(req.body));

    // Parse apple data from FormData
    const apples = [];
    const imageMap = {}; // Map image indices to file info
    
    // Build image map - simpler approach
    if (req.files) {
      req.files.forEach((file, index) => {
        imageMap[index] = {
          path: `/images/${file.filename}`,
          filename: file.filename,
          originalName: file.originalname
        };
        console.log(`📸 Image ${index}:`, file.originalname, '→', file.filename);
      });
    }

    // Parse apple data from body - handle both formats
    console.log('🔍 DEBUG: req.body structure:', JSON.stringify(Object.keys(req.body)));
    console.log('🔍 DEBUG: req.body.apples type:', typeof req.body.apples);
    
    // Check if apples is already an array (parsed by body parser)
    if (req.body.apples && Array.isArray(req.body.apples)) {
      console.log('📦 Apples received as array, length:', req.body.apples.length);
      req.body.apples.forEach((appleDataStr, index) => {
        const appleData = typeof appleDataStr === 'string' ? JSON.parse(appleDataStr) : appleDataStr;
        const imageInfo = imageMap[index];
        
        apples.push({
          data: appleData,
          image: imageInfo ? imageInfo.path : null
        });

        console.log(`🍎 Apple ${index}:`, appleData.cultivar_name || appleData.name, '→ Image:', imageInfo?.originalName || 'No image');
      });
    } 
    // Check if it's a stringified array
    else if (req.body.apples && typeof req.body.apples === 'string') {
      console.log('📦 Apples received as string, parsing...');
      const parsedApples = JSON.parse(req.body.apples);
      if (Array.isArray(parsedApples)) {
        parsedApples.forEach((appleData, index) => {
          const imageInfo = imageMap[index];
          
          apples.push({
            data: appleData,
            image: imageInfo ? imageInfo.path : null
          });

          console.log(`🍎 Apple ${index}:`, appleData.cultivar_name || appleData.name, '→ Image:', imageInfo?.originalName || 'No image');
        });
      }
    }
    // Handle indexed keys format: apples[0], apples[1], etc.
    else {
      console.log('📦 Looking for indexed apples[n] keys');
      Object.keys(req.body).forEach(key => {
        if (key.startsWith('apples[')) {
          const appleData = JSON.parse(req.body[key]);
          const index = parseInt(key.match(/\[(\d+)\]/)[1]); // Extract index as number
          
          // Get corresponding image using numeric index
          const imageInfo = imageMap[index];
          
          apples.push({
            data: appleData,
            image: imageInfo ? imageInfo.path : null
          });

          console.log(`🍎 Apple ${index}:`, appleData.cultivar_name || appleData.name, '→ Image:', imageInfo?.originalName || 'No image');
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

    // Create apple documents
    const savedApples = [];
    const errors = [];

    for (let i = 0; i < apples.length; i++) {
      try {
        const item = apples[i];
        const appleData = item.data;

        // Validate required field
        if (!appleData.cultivar_name && !appleData.name) {
          errors.push({ index: i, error: 'Missing cultivar name' });
          continue;
        }

        // Get cultivar name from various possible fields
        const cultivarName = appleData.cultivar_name || 
                            appleData.name || 
                            appleData.cultivar || 
                            appleData.variety;

        const newApple = new Apple({
          cultivar_name: cultivarName,
          acno: appleData.acno || appleData.accessionNumber || '',
          accession: appleData.accession || '',
          e_origin_country: appleData.e_origin_country || appleData.country || '',
          e_origin_province: appleData.e_origin_province || appleData.province || appleData.state || '',
          e_origin_city: appleData.e_origin_city || appleData.city || '',
          e_genus: appleData.e_genus || 'Malus',
          e_species: appleData.e_species || 'domestica',
          e_pedigree: appleData.e_pedigree || appleData.pedigree || '',
          e_breeder: appleData.e_breeder || appleData.breeder || '',
          e_collector: appleData.e_collector || appleData.collector || '',
          description: appleData.description || '',
          taste: appleData.taste || '',
          texture: appleData.texture || '',
          uses: appleData.uses || '',
          harvestSeason: appleData.harvestSeason || appleData.harvest_season || '',
          hardiness: appleData.hardiness || '',
          storage: appleData.storage || '',
          color: appleData.color || '',
          images: item.image ? [item.image] : [],
          status: 'Active',
          createdAt: new Date(),
          updatedAt: new Date()
        });

        await newApple.save();
        savedApples.push(newApple);

        console.log(`✅ Saved apple ${i + 1}/${apples.length}:`, cultivarName);

      } catch (error) {
        console.error(`❌ Error saving apple ${i}:`, error.message);
        errors.push({ index: i, error: error.message });
      }
    }

    // Log bulk upload activity
    await logActivity(
      req.adminId,
      'Bulk uploaded apple varieties',
      `Uploaded ${savedApples.length} apple(s) successfully${errors.length > 0 ? `, ${errors.length} failed` : ''}`
    );

    console.log('📊 Upload complete:');
    console.log('   ✅ Successful:', savedApples.length);
    console.log('   ❌ Failed:', errors.length);

    res.status(201).json({ 
      success: true, 
      message: `Successfully uploaded ${savedApples.length} apple(s)`,
      stats: {
        total: apples.length,
        successful: savedApples.length,
        failed: errors.length
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
// GET ALL APPLES (Root path - for LibraryV2)
// ========================
router.get('/', async (req, res) => {
  try {
    // Support search query parameter
    const searchQuery = req.query.search;
    
    let apples;
    if (searchQuery) {
      // If search query provided, search apples
      apples = await Apple.find({
        $or: [
          { cultivar_name: { $regex: searchQuery, $options: 'i' } },
          { accession: { $regex: searchQuery, $options: 'i' } },
          { acno: { $regex: searchQuery, $options: 'i' } },
          { description: { $regex: searchQuery, $options: 'i' } },
          { color: { $regex: searchQuery, $options: 'i' } },
          { taste: { $regex: searchQuery, $options: 'i' } }
        ]
      })
        .sort({ createdAt: -1 })
        .lean();
      console.log(`🔍 Search for "${searchQuery}": found ${apples.length} apples`);
    } else {
      // Return all apples
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
// GET ALL APPLES (/all alias)
// ========================
router.get('/all', async (req, res) => {
  try {
    const apples = await Apple.find({})
      .sort({ createdAt: -1 })
      .lean();

    res.json({ 
      success: true, 
      count: apples.length,
      apples 
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
    const appleData = req.body.appleData ? JSON.parse(req.body.appleData) : req.body;
    
    // Get the apple name before updating
    const existingApple = await Apple.findById(req.params.id);
    if (!existingApple) {
      return res.status(404).json({ 
        success: false, 
        message: 'Apple not found' 
      });
    }

    // Get new image paths if uploaded
    const newImagePaths = req.files ? req.files.map(file => `/images/${file.filename}`) : [];
    
    // Combine with existing images if keepExisting flag is set
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

    // Log activity
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

    // Log activity
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
    }).limit(50);

    res.json({ 
      success: true, 
      count: apples.length,
      apples 
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
    
    // Get unique values for each filter field using actual field names with spaces
    const [acnoValues, accessionValues, countryValues, provinceValues, cityValues, pedigreeValues] = await Promise.all([
      applesCollection.distinct('acno'),
      applesCollection.distinct('accession'),
      applesCollection.distinct('e origin country'),
      applesCollection.distinct('e origin province'),
      applesCollection.distinct('e origin city'),
      applesCollection.distinct('e pedigree')
    ]);

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
export default router;