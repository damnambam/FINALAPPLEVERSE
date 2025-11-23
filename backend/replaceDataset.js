import mongoose from 'mongoose';
import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { Apple } from './models/Apple.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/appleverse";

// Comprehensive field mapping - handles all known field name variations
function mapFields(row, allColumns) {
  const getField = (variations, defaultValue = '') => {
    for (const field of variations) {
      // Try exact match first
      if (row[field] !== undefined && row[field] !== null && row[field] !== '') {
        const value = String(row[field]).trim();
        if (value) return value;
      }
      // Try case-insensitive match
      for (const col of allColumns) {
        if (col.toLowerCase().replace(/\s+/g, '_') === field.toLowerCase().replace(/\s+/g, '_')) {
          const value = String(row[col] || '').trim();
          if (value) return value;
        }
      }
    }
    return defaultValue;
  };
  
  // Map to schema fields (these are stored directly in the document)
  const mapped = {
    cultivar_name: getField(['CULTIVAR NAME', 'CULTIVAR_NAME', 'cultivar_name', 'Cultivar Name', 'CULTIVAR', 'cultivar', 'LABEL NAME', 'name', 'Name', 'Cultivar']),
    acno: getField(['ACNO', 'acno', 'AC_NO', 'accession_number_ part2', 'CN NUMBER', 'CN', 'CN Text', 'AC Number']),
    accession: getField(['ACCESSION', 'accession', 'HARROW ACCESSION', 'Accession', 'ACCESSION NUMBER']),
    e_origin_country: getField(['E Origin Country', 'E_ORIGIN_COUNTRY', 'e_origin_country', 'origin_country', 'Country', 'country', 'E Origin Country', 'Geography']),
    e_origin_province: getField(['E Origin Province', 'E_ORIGIN_PROVINCE', 'e_origin_province', 'origin_province', 'Province', 'province', 'STATE', 'state', 'E Origin Province']),
    e_origin_city: getField(['E Origin City', 'E_ORIGIN_CITY', 'e_origin_city', 'origin_city', 'City', 'city', 'E Origin City']),
    e_genus: getField(['E GENUS', 'E_GENUS', 'e_genus', 'genus', 'GENUS', 'E Genus'], 'Malus'),
    e_species: getField(['E SPECIES', 'E_SPECIES', 'e_species', 'species', 'SPECIES', 'E Species'], 'domestica'),
    e_pedigree: getField(['E pedigree', 'E_PEDIGREE', 'e_pedigree', 'pedigree', 'PEDIGREE', 'E Pedigree', 'Pedigree Description']),
    e_breeder: getField(['E Breeder', 'E_BREEDER', 'e_breeder', 'breeder', 'BREEDER', 'E Breeder']),
    e_collector: getField(['E Collector', 'E_COLLECTOR', 'e_collector', 'collector', 'COLLECTOR', 'E Collector']),
    images: Array.isArray(row.images) ? row.images : []
  };
  
  // List of all schema fields (to exclude from metadata)
  const schemaFields = [
    'cultivar_name', 'acno', 'accession', 'e_origin_country', 'e_origin_province', 
    'e_origin_city', 'e_genus', 'e_species', 'e_pedigree', 'e_breeder', 'e_collector', 
    'images', 'status', 'createdAt', 'updatedAt', '_id', '__v'
  ];
  
  // Store ALL Excel columns in metadata (preserve exact Excel column names)
  // This ensures frontend can access all columns using their exact Excel names
  const metadataFields = {};
  Object.keys(row).forEach(key => {
    // Skip internal fields
    if (key === '__excelRowNumber' || key === '__excelRowIndex') {
      return;
    }
    
    // Skip if empty or null
    if (row[key] === undefined || row[key] === null || row[key] === '') {
      return;
    }
    
    // Store ALL Excel columns in metadata using their exact Excel column names
    // This allows frontend to access columns by their exact Excel names
    // Even if a field is also stored in a direct schema field, we still store it in metadata
    // so the frontend can find it using the Excel column name
    const value = String(row[key]).trim();
    if (value) {
      metadataFields[key] = value;
    }
  });
  
  // Add metadata if there are any additional fields
  if (Object.keys(metadataFields).length > 0) {
    mapped.metadata = metadataFields;
  }
  
  return mapped;
}

async function replaceDataset(filePath) {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const ext = path.extname(filePath).toLowerCase();
    let records = [];
    let allColumns = [];

    console.log(`\n📂 Reading file: ${filePath}`);
    
    if (ext === '.xlsx' || ext === '.xls') {
      const workbook = XLSX.readFile(filePath);
      console.log(`📋 Found ${workbook.SheetNames.length} sheet(s): ${workbook.SheetNames.join(', ')}`);
      
      // Use first sheet by default, or look for a sheet with data
      let worksheet = workbook.Sheets[workbook.SheetNames[0]];
      let sheetName = workbook.SheetNames[0];
      
      // Try to find a sheet with the most data
      for (const name of workbook.SheetNames) {
        const sheet = workbook.Sheets[name];
        const data = XLSX.utils.sheet_to_json(sheet, { defval: '', header: 1 });
        if (data.length > records.length) {
          records = data;
          worksheet = sheet;
          sheetName = name;
        }
      }
      
      console.log(`📊 Using sheet: "${sheetName}"`);
      
      // Get column headers from first row - read as array to preserve EXACT Excel order
      // This ensures we get all 54 columns in the exact sequence from Excel
      // header: 1 means return as array of arrays (not objects)
      // We want the first row (index 0) which contains the column headers
      const allRows = XLSX.utils.sheet_to_json(worksheet, { defval: '', header: 1 });
      const firstRowArray = allRows[0]; // First row is the header row
      
      if (!firstRowArray || firstRowArray.length === 0) {
        throw new Error('Could not read column headers from first row');
      }
      
      // Use the first row array directly to preserve exact Excel column order
      // Map to strings and trim, but preserve all columns including empty ones
      allColumns = firstRowArray.map((col, idx) => {
        if (col === null || col === undefined || col === '') {
          return `Column_${idx + 1}`;
        }
        return String(col).trim();
      });
      
      // Parse all records and preserve original Excel row order
      const rawRecords = XLSX.utils.sheet_to_json(worksheet, { defval: '', raw: false });
      
      // Add Excel row index to each record BEFORE filtering
      // Excel row 1 = header, so first data row is row 2
      records = rawRecords.map((row, index) => {
        // Store original position (1-based, matching Excel row numbers)
        // index 0 in array = Excel row 2 (after header)
        return { ...row, __excelRowNumber: index + 2 };
      });
      
      // Filter out completely empty rows (preserving row numbers)
      records = records.filter(row => {
        const values = Object.values(row);
        // Check if row has any meaningful data (excluding __excelRowNumber)
        const dataKeys = Object.keys(row).filter(k => k !== '__excelRowNumber');
        return dataKeys.some(key => {
          const val = row[key];
          return val !== '' && val !== null && val !== undefined;
        });
      });
      
    } else if (ext === '.csv') {
      const text = fs.readFileSync(filePath, 'utf8');
      const lines = text.split('\n').filter(line => line.trim());
      
      // Parse CSV with proper handling of quoted fields
      const parseCSVLine = (line) => {
        const result = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === '"') {
            if (inQuotes && line[i + 1] === '"') {
              current += '"';
              i++;
            } else {
              inQuotes = !inQuotes;
            }
          } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
          } else {
            current += char;
          }
        }
        result.push(current.trim());
        return result;
      };
      
      const headers = parseCSVLine(lines[0]);
      allColumns = headers;
      
      records = lines.slice(1).map((line, index) => {
        const values = parseCSVLine(line);
        const row = {};
        headers.forEach((header, idx) => {
          row[header] = values[idx] || '';
        });
        // CSV row number = index + 2 (1 for header + 1 for 1-based)
        row.__excelRowNumber = index + 2;
        return row;
      }).filter(row => {
        const values = Object.values(row);
        const dataKeys = Object.keys(row).filter(k => k !== '__excelRowNumber');
        return dataKeys.some(key => {
          const val = row[key];
          return val !== '' && val !== null && val !== undefined;
        });
      });
    } else {
      throw new Error(`Unsupported format: ${ext}. Please use .xlsx, .xls, or .csv`);
    }

    console.log(`\n📊 Dataset Analysis:`);
    console.log(`   Total columns: ${allColumns.length}`);
    console.log(`   Total records: ${records.length}`);
    console.log(`   Column names: ${allColumns.slice(0, 10).join(', ')}${allColumns.length > 10 ? '...' : ''}`);

    if (records.length === 0) {
      console.error('❌ No records found in file!');
      await mongoose.disconnect();
      process.exit(1);
    }

    console.log('\n🗑️  Deleting all existing apples...');
    const deleted = await Apple.deleteMany({});
    console.log(`✅ Deleted ${deleted.deletedCount} existing records`);

    console.log('\n📥 Importing new dataset...');
    let imported = 0;
    let skipped = 0;
    let errors = [];
    const startTime = Date.now();

    // Process in batches for better performance
    const batchSize = 50;
    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      const batchPromises = batch.map(async (row, batchIndex) => {
        const globalIndex = i + batchIndex;
        try {
          const mapped = mapFields(row, allColumns);
          
          // Skip if no cultivar name (required field)
          if (!mapped.cultivar_name) {
            skipped++;
            return null;
          }

          // Use the Excel row number from __excelRowNumber (set before filtering)
          // This preserves the original Excel row position
          const excelRowNum = row.__excelRowNumber;
          
          if (!excelRowNum) {
            console.warn(`⚠️  Record "${mapped.cultivar_name}" missing __excelRowNumber, using fallback`);
          }

          const newApple = new Apple({
            ...mapped,
            status: 'Active',
            excelRowIndex: excelRowNum, // Preserve Excel row order (1-based, from actual Excel file)
            createdAt: new Date(),
            updatedAt: new Date()
          });
          
          await newApple.save();
          imported++;
          return newApple;
        } catch (error) {
          errors.push({ 
            row: globalIndex + 1, 
            cultivar: row.cultivar_name || row['CULTIVAR NAME'] || 'Unknown',
            error: error.message 
          });
          return null;
        }
      });

      await Promise.all(batchPromises);
      
      // Progress update
      if ((i + batchSize) % 500 === 0 || i + batchSize >= records.length) {
        const progress = Math.min(i + batchSize, records.length);
        const percent = ((progress / records.length) * 100).toFixed(1);
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        console.log(`   ⏳ Processed ${progress}/${records.length} (${percent}%) - ${elapsed}s elapsed`);
      }
    }

    const finalCount = await Apple.countDocuments();
    const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
    
    console.log(`\n✅ Import Complete!`);
    console.log(`   📥 Imported: ${imported} records`);
    console.log(`   ⏭️  Skipped: ${skipped} records (no cultivar name)`);
    console.log(`   ❌ Errors: ${errors.length} records`);
    console.log(`   📊 Total in database: ${finalCount}`);
    console.log(`   ⏱️  Time taken: ${totalTime}s`);
    console.log(`   ⚡ Average: ${(imported / totalTime).toFixed(1)} records/second`);

    if (errors.length > 0) {
      console.log(`\n⚠️  Error Details (first 10):`);
      errors.slice(0, 10).forEach(err => {
        console.log(`   Row ${err.row} (${err.cultivar}): ${err.error}`);
      });
      if (errors.length > 10) {
        console.log(`   ... and ${errors.length - 10} more errors`);
      }
    }

    // Show sample of imported data
    if (imported > 0) {
      const sample = await Apple.findOne().lean();
      if (sample) {
        console.log(`\n📋 Sample Record:`);
        console.log(`   Cultivar: ${sample.cultivar_name || 'N/A'}`);
        console.log(`   Accession: ${sample.accession || 'N/A'}`);
        console.log(`   ACNO: ${sample.acno || 'N/A'}`);
        const metadataCount = sample.metadata ? Object.keys(sample.metadata).length : 0;
        console.log(`   Additional fields in metadata: ${metadataCount}`);
      }
    }

    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('\n❌ Error:', error);
    if (error.stack) {
      console.error('Stack:', error.stack);
    }
    try {
      await mongoose.disconnect();
    } catch (e) {
      // Ignore disconnect errors
    }
    process.exit(1);
  }
}

// Get file path from command line or use default
// Looks for "final dataset" files (any variation)
function findDatasetFile() {
  const dataDir = path.join(__dirname, 'data');
  
  // If path provided via command line, use it
  if (process.argv[2]) {
    return process.argv[2];
  }
  
  // Try specific known names first
  const possibleNames = [
    'FINAL_DATASET_APPLEVERSE.xlsx',
    'FINAL_DATASET_APPLEVERSE.xls',
    'FINAL_DATASET_APPLEVERSE.csv',
    'final dataset.xlsx',
    'final dataset.xls',
    'final dataset.csv',
    'final_dataset.xlsx',
    'final_dataset.xls',
    'final_dataset.csv',
    'Final_Dataset.xlsx',
    'Final_Dataset.xls',
    'Final_Dataset.csv'
  ];
  
  // Try exact matches first
  for (const name of possibleNames) {
    const fullPath = path.join(dataDir, name);
    if (fs.existsSync(fullPath)) {
      return fullPath;
    }
  }
  
  // If not found, search for any file containing "final" and "dataset" (case-insensitive)
  try {
    const files = fs.readdirSync(dataDir);
    for (const file of files) {
      const lowerFile = file.toLowerCase();
      if ((lowerFile.includes('final') && lowerFile.includes('dataset')) && 
          (file.endsWith('.xlsx') || file.endsWith('.xls') || file.endsWith('.csv'))) {
        return path.join(dataDir, file);
      }
    }
  } catch (error) {
    // If directory read fails, continue to error message
  }
  
  // If not found, return a default path for error message
  return path.join(dataDir, 'FINAL_DATASET_APPLEVERSE.xlsx');
}

const filePath = findDatasetFile();

if (!fs.existsSync(filePath)) {
  console.error(`❌ File not found: ${filePath}`);
  console.log('\nUsage: node replaceDataset.js [path-to-file]');
  console.log('   Expected file in backend/data/: FINAL_DATASET_APPLEVERSE.xlsx (or any file with "final" and "dataset" in name)');
  console.log('   Or provide full path: node replaceDataset.js /path/to/your-file.xlsx');
  console.log('\n   Current files in data directory:');
  try {
    const dataDir = path.join(__dirname, 'data');
    const files = fs.readdirSync(dataDir).filter(f => 
      f.endsWith('.xlsx') || f.endsWith('.xls') || f.endsWith('.csv')
    );
    if (files.length > 0) {
      files.forEach(f => console.log(`      - ${f}`));
    } else {
      console.log('      (no Excel/CSV files found)');
    }
  } catch (e) {
    console.log('      (could not read directory)');
  }
  process.exit(1);
}

console.log('🍎 Appleverse Dataset Replacement Tool');
console.log('=====================================\n');

replaceDataset(filePath);


