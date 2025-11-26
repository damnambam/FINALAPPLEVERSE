// FIXED: Complete appleRoutes.js with user-controlled duplicate handling
// - Flexible field detection (CULTIVAR_NAME, CULTIVAR NAME, etc.)
// - Sets required top-level schema fields (accession, cultivar_name)
// - Two-pass duplicate handling: detect first, then let user decide

import express from 'express';
import Apple from '../models/Apple.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import XLSX from 'xlsx';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// ===========================
// File Upload Configuration
// ===========================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '..', 'images');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    // FIXED: Keep original filename to preserve MAL numbers and cultivar names
    // Just sanitize special characters and add small random suffix to avoid exact duplicates
    const originalName = file.originalname;
    const ext = path.extname(originalName);
    const baseName = path.basename(originalName, ext);
    
    // Sanitize: replace problematic characters but keep spaces, underscores, hyphens
    const sanitized = baseName.replace(/[^a-zA-Z0-9\s_-]/g, '');
    
    // Add small random suffix to prevent overwriting files with same name
    const suffix = Math.round(Math.random() * 999);
    
    // Final filename: "King of Pippins MAL0979_123.jpg"
    cb(null, `${sanitized}_${suffix}${ext}`);
  }
});

const upload = multer({
  storage: storage,
  limits: { 
    fileSize: 50 * 1024 * 1024, // 50MB per file
    files: 2000 // Max 2000 files
  },
  fileFilter: (req, file, cb) => {
  if (file.fieldname === 'excelFile') {
    const allowedExcelTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv'
    ];
    if (allowedExcelTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only Excel and CSV files allowed for excelFile'));
    }
  } else if (file.fieldname === 'images' || file.fieldname === 'image') {  // ← ADD THIS
    const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedImageTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (JPEG, PNG, GIF, WEBP) allowed for images'));
    }
  } else {
    cb(new Error('Unexpected field'));
  }
}
});

// ===========================
// Helper: Flexible Field Detection
// ===========================
const findField = (headers, patterns) => {
  return headers.find(key => {
    const normalized = key.toLowerCase().replace(/[^a-z0-9]/g, '');
    return patterns.some(pattern => {
      if (typeof pattern === 'function') {
        return pattern(normalized);
      }
      return normalized === pattern || normalized.includes(pattern);
    });
  });
};

// ===========================
// GET: All apples with pagination
// ===========================
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;
    
    console.log(`📊 Query params: page=${page}, limit=${limit}, search="${req.query.search || 'none'}"`);

    let query = {};
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      query = {
        $or: [
          { accession: searchRegex },
          { cultivar_name: searchRegex },
          { 'metadata.ACCESSION': searchRegex },
          { 'metadata.CULTIVAR_NAME': searchRegex },
          { 'metadata.CULTIVAR NAME': searchRegex },
          { 'metadata.TAXON': searchRegex },
          { 'metadata.NARATIVEKEYWORD': searchRegex },
          { 'metadata.COUNTRY': searchRegex },
          { 'metadata.PROVINCE/STATE': searchRegex }
        ]
      };
    }

    const startTime = Date.now();
    
    const apples = await Apple.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
    
    // Convert metadata Map to plain object if needed
    const processedApples = apples.map(apple => {
      if (apple.metadata) {
        if (apple.metadata instanceof Map || (apple.metadata.$type === 'Map')) {
          const metadataObj = {};
          if (apple.metadata instanceof Map) {
            apple.metadata.forEach((value, key) => {
              metadataObj[key] = value;
            });
          } else if (apple.metadata._doc) {
            Object.assign(metadataObj, apple.metadata._doc);
          } else {
            Object.assign(metadataObj, apple.metadata);
          }
          apple.metadata = metadataObj;
        }
      }
      return apple;
    });
    
    const total = await Apple.countDocuments(query);
    
    const queryTime = Date.now() - startTime;
    console.log(`Apple Query: ${queryTime}ms`);
    console.log(`✅ Returned ${processedApples.length} apples (page ${page}/${Math.ceil(total / limit)})`);

    res.json({
      apples: processedApples,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + processedApples.length < total,
        hasLess: page > 1
      }
    });
  } catch (err) {
    console.error('❌ Error fetching apples:', err);
    res.status(500).json({ error: err.message });
  }
});

// ===========================
// GET: Single apple by ID
// ===========================
router.get('/:id', async (req, res) => {
  try {
    const apple = await Apple.findById(req.params.id);
    if (!apple) return res.status(404).json({ error: 'Apple not found' });
    res.json(apple);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===========================
// GET: Find image by accession
// ===========================
router.get('/find-image/:accession', async (req, res) => {
  try {
    const accession = req.params.accession;
    const imagesDir = path.join(__dirname, '..', 'images');
    
    if (!fs.existsSync(imagesDir)) {
      return res.json({ success: false, message: 'Images directory not found', images: [] });
    }
    
    const files = fs.readdirSync(imagesDir);
    const matchingFiles = files.filter(file => 
      file.toUpperCase().includes(accession.toUpperCase())
    );
    
    if (matchingFiles.length === 0) {
      return res.json({ success: false, message: 'No matching images found', images: [] });
    }
    
    const imagePaths = matchingFiles.map(file => `/images/${file}`);
    res.json({ success: true, images: imagePaths });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message, images: [] });
  }
});

// ===========================
// POST: Batch find images
// ===========================
router.post('/find-images-batch', async (req, res) => {
  try {
    const { accessions } = req.body;
    
    if (!accessions || !Array.isArray(accessions)) {
      return res.status(400).json({ success: false, error: 'accessions array required' });
    }
    
    const imagesDir = path.join(__dirname, '..', 'images');
    
    if (!fs.existsSync(imagesDir)) {
      return res.json({ success: false, message: 'Images directory not found', results: {} });
    }
    
    const files = fs.readdirSync(imagesDir);
    const results = {};
    let found = 0;
    
    for (const accession of accessions) {
      const matchingFiles = files.filter(file => 
        file.toUpperCase().includes(accession.toUpperCase())
      );
      
      if (matchingFiles.length > 0) {
        results[accession] = matchingFiles.map(file => `/images/${file}`);
        found++;
      }
    }
    
    res.json({ 
      success: true, 
      results, 
      found, 
      total: accessions.length 
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message, results: {} });
  }
});

// ===========================
// POST: Upload single image for an apple
// ===========================
router.post('/upload-image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No image file provided' });
    }
    
    const imagePath = `/images/${req.file.filename}`;
    
    res.json({ 
      success: true, 
      imagePath: imagePath,
      message: 'Image uploaded successfully' 
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ===========================
// POST: Bulk upload with images
// FIXED: User-controlled duplicate handling
// ===========================
router.post('/bulk-upload-with-images', upload.fields([
  { name: 'excelFile', maxCount: 1 },
  { name: 'images', maxCount: 2000 }
]), async (req, res) => {
  let excelFilePath = null;
  
  try {
    if (!req.files || !req.files.excelFile) {
      return res.status(400).json({ error: 'No Excel file uploaded' });
    }

    const excelFile = req.files.excelFile[0];
    excelFilePath = excelFile.path;
    const uploadedImages = req.files.images || [];
    
    // Parse Excel/CSV file
    const workbook = XLSX.readFile(excelFile.path);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
      raw: false,
      defval: '',
      blankrows: false
    });

    if (!jsonData || jsonData.length === 0) {
      fs.unlinkSync(excelFilePath);
      return res.status(400).json({ error: 'Excel file is empty or invalid' });
    }

    console.log(`📋 Parsed ${jsonData.length} rows from file`);

    // ===== FLEXIBLE FIELD DETECTION =====
    const headers = Object.keys(jsonData[0]);
    console.log(`📋 Headers found: ${headers.join(', ')}`);
    
    // Find ACCESSION field
    const accessionField = findField(headers, [
      'accession',
      (n) => n.includes('accession'),
      'harrowaccession'
    ]);
    
    // Find CULTIVAR NAME field (handles CULTIVAR_NAME, CULTIVAR NAME, etc.)
    const cultivarField = findField(headers, [
      'cultivarname',
      (n) => n.includes('cultivar') && n.includes('name'),
      'name'
    ]);

    console.log(`📋 Detected fields - Accession: "${accessionField}", Cultivar: "${cultivarField}"`);

    if (!accessionField) {
      fs.unlinkSync(excelFilePath);
      return res.status(400).json({ 
        error: `Missing ACCESSION column. Found headers: ${headers.slice(0, 10).join(', ')}${headers.length > 10 ? '...' : ''}`
      });
    }
    
    if (!cultivarField) {
      fs.unlinkSync(excelFilePath);
      return res.status(400).json({ 
        error: `Missing CULTIVAR NAME column. Found headers: ${headers.slice(0, 10).join(', ')}${headers.length > 10 ? '...' : ''}`
      });
    }

    // Get duplicate handling mode
    const handleDuplicates = req.body.handleDuplicates || 'detect';
    let duplicateResolutions = {};
    
    if (req.body.duplicateResolutions) {
      try {
        duplicateResolutions = JSON.parse(req.body.duplicateResolutions);
      } catch (e) {
        console.log('⚠️ Could not parse duplicateResolutions:', e.message);
      }
    }

    console.log(`🔄 Mode: ${handleDuplicates}, Resolutions provided: ${Object.keys(duplicateResolutions).length}`);

    // ===== BUILD IMAGE MAP =====
    const imageMap = new Map();
    uploadedImages.forEach(file => {
      const filename = file.originalname;
      // Match MAL followed by digits (e.g., MAL0001, MAL1234)
      const matches = filename.match(/MAL\d+/gi);
      if (matches && matches.length > 0) {
        matches.forEach(accessionMatch => {
          const acc = accessionMatch.toUpperCase();
          if (!imageMap.has(acc)) imageMap.set(acc, []);
          imageMap.get(acc).push(`/images/${file.filename}`);
        });
      }
    });
    
    console.log(`🖼️ Image map built: ${imageMap.size} accessions with images`);

    // ===== FIRST PASS: DETECT DUPLICATES =====
    if (handleDuplicates === 'detect') {
      console.log('🔍 First pass: Detecting duplicates...');
      const duplicatesFound = [];
      
      for (let i = 0; i < jsonData.length; i++) {
        const row = jsonData[i];
        const accession = row[accessionField]?.toString().trim() || '';
        const cultivarName = row[cultivarField]?.toString().trim() || '';
        
        if (!accession || !cultivarName) continue;

        const existingApple = await Apple.findOne({
          $or: [
            { accession: accession },
            { 'metadata.ACCESSION': accession },
            { 'metadata.accession': accession }
          ]
        });

        if (existingApple) {
          duplicatesFound.push({
            index: i,
            row: i + 2,
            accession: accession,
            cultivar_name: cultivarName,
            existingId: existingApple._id.toString()
          });
        }
      }

      // If duplicates found, return them for user decision
      if (duplicatesFound.length > 0) {
        console.log(`⚠️ Found ${duplicatesFound.length} duplicates - returning for user decision`);
        
        // Keep the uploaded images but clean up excel file
        fs.unlinkSync(excelFilePath);
        
        return res.json({
          success: false,
          needsResolution: true,
          duplicates: duplicatesFound,
          totalRows: jsonData.length,
          message: `Found ${duplicatesFound.length} duplicate(s). Please decide how to handle each one.`
        });
      }
      
      console.log('✅ No duplicates found, proceeding with insert...');
    }

    // ===== SECOND PASS: PROCESS ALL ROWS =====
    console.log('📝 Processing rows...');
    
    const results = {
      total: jsonData.length,
      inserted: 0,
      updated: 0,
      skipped: 0,
      duplicates: 0,
      errors: []
    };

    for (let i = 0; i < jsonData.length; i++) {
      const row = jsonData[i];
      
      try {
        // Extract required fields using detected column names
        const accession = row[accessionField]?.toString().trim() || '';
        const cultivarName = row[cultivarField]?.toString().trim() || '';
        
        // Validate required fields
        if (!accession) {
          results.errors.push({ 
            row: i + 2, 
            error: 'Missing ACCESSION',
            accession: '(empty)',
            cultivar: cultivarName || '(empty)'
          });
          results.skipped++;
          continue;
        }

        if (!cultivarName) {
          results.errors.push({ 
            row: i + 2, 
            error: 'Missing CULTIVAR NAME',
            accession: accession,
            cultivar: '(empty)'
          });
          results.skipped++;
          continue;
        }

        // Check for existing apple
        const existingApple = await Apple.findOne({
          $or: [
            { accession: accession },
            { 'metadata.ACCESSION': accession },
            { 'metadata.accession': accession }
          ]
        });

        // Get images for this accession
        let imagePaths = [];
        if (imageMap.has(accession.toUpperCase())) {
          imagePaths = imageMap.get(accession.toUpperCase());
        }
        
        // Add image paths to row data
        row['IMAGES'] = imagePaths.join(', ');

        if (existingApple) {
          results.duplicates++;
          
          // Get user's decision for this duplicate (by index)
          const resolution = duplicateResolutions[i] || duplicateResolutions[i.toString()] || 'skip';
          
          console.log(`🔄 Row ${i + 2}: Duplicate "${accession}" - User chose: ${resolution}`);
          
          if (resolution === 'replace') {
            // Update existing apple
            existingApple.accession = accession;
            existingApple.cultivar_name = cultivarName;
            existingApple.metadata = row;
            existingApple.updatedAt = new Date();
            
            if (imagePaths.length > 0) {
              existingApple.images = imagePaths;
              existingApple.images_count = imagePaths.length;
            }
            
            await existingApple.save();
            results.updated++;
            console.log(`   ✅ Replaced existing entry`);
            
          } else if (resolution === 'duplicate') {
            // Create new entry (allow duplicate)
            const newApple = new Apple({
              accession: accession,
              cultivar_name: cultivarName,
              metadata: row,
              images: imagePaths,
              images_count: imagePaths.length,
              excelRowIndex: i + 2
            });
            
            await newApple.save();
            results.inserted++;
            console.log(`   ✅ Created as new entry (duplicate allowed)`);
            
          } else {
            // Skip this duplicate
            results.skipped++;
            console.log(`   ⏭️ Skipped`);
          }
          
        } else {
          // New apple - insert it
          const newApple = new Apple({
            accession: accession,
            cultivar_name: cultivarName,
            metadata: row,
            images: imagePaths,
            images_count: imagePaths.length,
            excelRowIndex: i + 2
          });
          
          await newApple.save();
          results.inserted++;
          console.log(`✅ Row ${i + 2}: Inserted "${accession}" - "${cultivarName}"`);
        }
        
      } catch (err) {
        console.error(`❌ Row ${i + 2} error:`, err.message);
        results.errors.push({ 
          row: i + 2, 
          error: err.message,
          accession: row[accessionField] || '(unknown)',
          cultivar: row[cultivarField] || '(unknown)'
        });
        results.skipped++;
      }
    }

    // Clean up excel file
    if (fs.existsSync(excelFilePath)) {
      fs.unlinkSync(excelFilePath);
    }

    console.log('📊 ===== FINAL RESULTS =====');
    console.log(`   Total rows: ${results.total}`);
    console.log(`   Inserted: ${results.inserted}`);
    console.log(`   Updated: ${results.updated}`);
    console.log(`   Skipped: ${results.skipped}`);
    console.log(`   Duplicates found: ${results.duplicates}`);
    console.log(`   Errors: ${results.errors.length}`);
    
    if (results.errors.length > 0) {
      console.log('   Error details:', results.errors.slice(0, 5));
    }

    res.json({
      success: true,
      message: 'Bulk upload completed',
      results
    });
    
  } catch (err) {
    console.error('❌ Bulk upload error:', err);
    
    // Clean up file on error
    if (excelFilePath && fs.existsSync(excelFilePath)) {
      try { fs.unlinkSync(excelFilePath); } catch(e) {}
    }
    
    res.status(500).json({ error: err.message });
  }
});

// ===========================
// PUT: Update apple
// ===========================
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };
    
    // Handle images array if provided
    if (updateData.images && Array.isArray(updateData.images)) {
      console.log(`📸 Updating images for apple ${id}: ${updateData.images.length} images`);
    }
    
    // Update the apple record
    const updatedApple = await Apple.findByIdAndUpdate(
      id,
      { 
        ...updateData,
        images: updateData.images,  // Save the images array
        images_count: updateData.images ? updateData.images.length : 0,
        updatedAt: new Date() 
      },
      { new: true, runValidators: true }
    );
    
    if (!updatedApple) {
      return res.status(404).json({ error: 'Apple not found' });
    }
    
    console.log(`✅ Apple ${id} updated successfully with ${updatedApple.images?.length || 0} images`);
    
    res.json({
      success: true,
      message: 'Apple updated successfully',
      apple: updatedApple
    });
  } catch (err) {
    console.error('❌ Update error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ===========================
// DELETE: Delete apple
// ===========================
router.delete('/:id', async (req, res) => {
  try {
    const deletedApple = await Apple.findByIdAndDelete(req.params.id);
    
    if (!deletedApple) {
      return res.status(404).json({ error: 'Apple not found' });
    }
    
    res.json({
      success: true,
      message: 'Apple deleted successfully',
      apple: deletedApple
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===========================
// DELETE: Remove image file from disk
// ===========================
router.delete('/image/:filename', async (req, res) => {
  try {
    const filename = req.params.filename;
    const imagePath = path.join(__dirname, '..', 'images', filename);
    
    // Security check: make sure it's actually in the images folder
    if (!imagePath.startsWith(path.join(__dirname, '..', 'images'))) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid file path' 
      });
    }
    
    // Check if file exists
    if (!fs.existsSync(imagePath)) {
      return res.status(404).json({ 
        success: false, 
        error: 'Image file not found' 
      });
    }
    
    // Delete the file
    fs.unlinkSync(imagePath);
    console.log(`🗑️ Deleted image: ${filename}`);
    
    res.json({ 
      success: true, 
      message: 'Image deleted successfully' 
    });
  } catch (err) {
    console.error('❌ Error deleting image:', err);
    res.status(500).json({ 
      success: false, 
      error: err.message 
    });
  }
});

export default router;