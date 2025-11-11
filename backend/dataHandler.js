import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import XLSX from 'xlsx';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DATA_DIR = path.join(__dirname, 'data');
const IMAGES_DIR = path.join(__dirname, 'images');

// Inline CSV parser
function parseCSV(text) {
  const lines = [];
  let current = [];
  let inQuotes = false;
  let field = '';

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        field += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      current.push(field.trim());
      field = '';
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      if (field || current.length > 0) {
        current.push(field.trim());
        if (current.some(f => f)) lines.push(current);
        current = [];
        field = '';
      }
    } else {
      field += char;
    }
  }

  if (field || current.length > 0) {
    current.push(field.trim());
    if (current.some(f => f)) lines.push(current);
  }

  if (lines.length === 0) return [];

  const headers = lines[0].map(h => h.trim());
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const row = {};
    headers.forEach((header, idx) => {
      row[header] = lines[i][idx] || '';
    });
    rows.push(row);
  }

  return rows;
}

function normalize(row) {
  // Handle Excel column variations - updated for apple_details.xlsx structure
  const acno = row.ACNO || row.acno || row.AC_NO || row['accession_number_ part2'] || row['CN NUMBER'] || row.CN || row['CN Text'] || '';
  const accession = row.ACCESSION || row.accession || row['HARROW ACCESSION'] || '';
  const cultivar = row.CULTIVAR_NAME || row['CULTIVAR NAME'] || row.cultivar_name || row['Cultivar Name'] || row['CULTIVAR'] || row['LABEL NAME'] || row['E CULTIVAR'] || row.name || '';
  const country = row.E_ORIGIN_COUNTRY || row['E Origin Country'] || row['E_ORIGIN_COUNTRY'] || row.origin_country || row.E_Origin_Country || row.Geography || '';
  const province = row.E_ORIGIN_PROVINCE || row['E Origin Province'] || row['E_ORIGIN_PROVINCE'] || row.origin_province || row.E_Origin_Province || '';
  const city = row.E_ORIGIN_CITY || row['E Origin City'] || row['E_ORIGIN_CITY'] || row.origin_city || row.E_Origin_City || '';
  const pedigree = row.E_PEDIGREE || row['E pedigree'] || row.pedigree || row.E_Pedigree || row['Pedigree Description'] || '';
  const genus = row.E_GENUS || row['E GENUS'] || row.genus || row.GENUS || row.E_Genus || (row.Taxon ? row.Taxon.split(' ')[0] : 'Malus') || 'Malus';
  const species = row.E_SPECIES || row['E SPECIES'] || row.species || row.E_Species || (row.Taxon ? row.Taxon.split(' ').slice(1).join(' ') : '') || '';
  
  return {
    ACNO: String(acno || '').trim(),
    ACCESSION: String(accession || '').trim(),
    CULTIVAR_NAME: String(cultivar || '').trim(),
    E_ORIGIN_COUNTRY: String(country || '').trim(),
    E_ORIGIN_PROVINCE: String(province || '').trim(),
    E_ORIGIN_CITY: String(city || '').trim(),
    E_PEDIGREE: String(pedigree || '').trim(),
    E_GENUS: String(genus || '').trim() || 'Malus',
    E_SPECIES: String(species || '').trim(),
    images: row.images || []
  };
}

function matchImageToRecord(imageName, imageUrl, records) {
  const lowerName = imageName.toLowerCase().replace(/\.(jpg|jpeg|png|webp|gif)$/i, '');
  let matched = false;
  
  for (const record of records) {
    const acc = String(record.ACCESSION || '').toLowerCase();
    const cultivar = String(record.CULTIVAR_NAME || '').toLowerCase();
    const acno = String(record.ACNO || '').toLowerCase();
    
    let found = false;
    
    // Match by ACCESSION (e.g., MAL0100, MAL0622)
    // Handles: "MAL0100.jpg", "8915 MAL0622-2.jpg", "Adams MAL0481.JPG"
    if (acc && acc.length > 0 && lowerName.includes(acc)) {
      found = true;
    }
    
    // Match by cultivar name (e.g., "Adams MAL0481", "King MAL0101")
    if (!found && cultivar && cultivar.length > 2) {
      const cultivarClean = cultivar.replace(/[^a-z0-9]/g, '');
      const nameWithCultivar = lowerName.replace(/[^a-z0-9]/g, '');
      if (nameWithCultivar.includes(cultivarClean)) {
        found = true;
      }
    }
    
    // Match by ACNO (e.g., "8915 MAL0622" contains acno if present)
    if (!found && acno && acno.length > 0 && lowerName.includes(acno)) {
      found = true;
    }
    
    // Add image to record if matched
    if (found) {
      if (!record.images) record.images = [];
      if (!record.images.includes(imageUrl)) {
        record.images.push(imageUrl);
        matched = true;
      }
    }
  }
  return matched;
}

export function collectLocalData() {
  const allRecords = [];
  const allImages = [];

  try {
    // Check if data directory exists
    if (!fs.existsSync(DATA_DIR)) {
      console.warn(`⚠️  Data directory not found: ${DATA_DIR}`);
      console.log(`ℹ️  Creating data directory. Please add your CSV/JSON files here.`);
      fs.mkdirSync(DATA_DIR, { recursive: true });
      return [];
    }

    // Collect images from images directory
    if (fs.existsSync(IMAGES_DIR)) {
      const imageFiles = fs.readdirSync(IMAGES_DIR);
      for (const file of imageFiles) {
        const filePath = path.join(IMAGES_DIR, file);
        const stat = fs.statSync(filePath);
        if (stat.isFile() && ['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(path.extname(file).toLowerCase())) {
          const imagePath = `/images/${file}`;
          allImages.push({ name: file, path: imagePath });
        }
      }
    }

    // Read all files from data directory
    const files = fs.readdirSync(DATA_DIR);

    for (const file of files) {
      const filePath = path.join(DATA_DIR, file);
      const stat = fs.statSync(filePath);

      // Skip directories and non-data files
      if (stat.isDirectory() || file.startsWith('.')) continue;
      if (file.endsWith('.ppt') || file.endsWith('.pptx')) continue;

      const ext = path.extname(file).toLowerCase();

      try {
        if (ext === '.csv') {
          // Read and parse CSV
          const text = fs.readFileSync(filePath, 'utf8');
          const parsed = parseCSV(text);
          allRecords.push(...parsed.map(normalize));
        } else if (ext === '.json') {
          // Read and parse JSON
          const text = fs.readFileSync(filePath, 'utf8');
          const jsonData = JSON.parse(text);
          const parsed = Array.isArray(jsonData) ? jsonData : [jsonData];
          allRecords.push(...parsed.map(normalize));
        } else if (ext === '.xlsx' || ext === '.xls') {
          // Read and parse Excel files
          const workbook = XLSX.readFile(filePath);
          // Prioritize sheets with main data: Accession, Pedigree, Descriptors
          const prioritySheets = ['Accession', 'Pedigree', 'Descriptors', 'Accession Source'];
          const otherSheets = workbook.SheetNames.filter(s => !prioritySheets.includes(s));
          const orderedSheets = [...prioritySheets.filter(s => workbook.SheetNames.includes(s)), ...otherSheets];
          
          orderedSheets.forEach(sheetName => {
            const worksheet = workbook.Sheets[sheetName];
            const parsed = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
            // Filter out header rows and empty rows
            const validRows = parsed.filter(row => {
              // Skip if all values are empty
              const vals = Object.values(row);
              if (!vals.some(v => v !== '' && v !== null && v !== undefined)) return false;
              // Skip header-like rows (all values are strings and look like headers)
              if (sheetName === 'Accession' && row.SYNCHRONIZATION === 'SYNCHRONIZATION') return false;
              if (sheetName === 'Pedigree' && row.Accession === 'Accession') return false;
              return true;
            });
            if (validRows.length > 0) {
              allRecords.push(...validRows.map(normalize));
            }
          });
        } else if (['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext)) {
          // Store image reference (relative path for serving) - images in data folder
          const imagePath = `/data/${file}`;
          allImages.push({ name: file, path: imagePath });
        }
      } catch (e) {
        console.error(`Error processing file ${file}:`, e.message);
      }
    }

    // Match images to records
    let matchedCount = 0;
    for (const img of allImages) {
      const matched = matchImageToRecord(img.name, img.path, allRecords);
      if (matched) matchedCount++;
    }

    const recordsWithImages = allRecords.filter(r => r.images && r.images.length > 0).length;
    console.log(`Collected ${allRecords.length} records and ${allImages.length} images`);
    console.log(`   📸 Matched ${matchedCount} images to ${recordsWithImages} records`);
    return allRecords;
  } catch (error) {
    console.error('Error collecting local data:', error);
    return [];
  }
}

