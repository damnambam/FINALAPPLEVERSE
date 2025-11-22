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
  // Comprehensive field mapping for both old and new formats
  const fieldMap = {
    // Mandatory fields
    'ACCESSION': 'accession',
    'accession': 'accession',
    'HARROW ACCESSION': 'accession',
    'Accession': 'accession',
    'CULTIVAR NAME': 'cultivar_name',
    'cultivar_name': 'cultivar_name',
    'CULTIVAR_NAME': 'cultivar_name',
    'Cultivar Name': 'cultivar_name',
    'name': 'cultivar_name',
    
    // Core identification
    'SITE ID': 'site_id',
    'PREFIX (ACP)': 'prefix_acp',
    'acp': 'acp',
    'ACP': 'acp',
    'ACNO': 'acno',
    'acno': 'acno',
    'CN NUMBER': 'acno',
    'CN': 'acno',
    'LABEL NAME': 'label_name',
    
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
    'e_subspecies': 'e_subspecies',
    'TAXON': 'taxon',
    'taxon': 'taxon',
    
    // Location - Map both old and new formats to old format for consistency
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
    
    'LOCATION SECTION 1': 'loc1',
    'location_section_1': 'loc1',
    'loc1': 'loc1',
    'LOCATION SECTION 2': 'loc2',
    'location_section_2': 'loc2',
    'loc2': 'loc2',
    'LOCATION SECTION 3': 'loc3',
    'location_section_3': 'loc3',
    'loc3': 'loc3',
    'LOCATION SECTION 4': 'loc4',
    'location_section_4': 'loc4',
    'loc4': 'loc4',
    
    // People - Handle both formats
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
    'INVENTORY TYPE': 'ivt',
    'inventory_type': 'ivt',
    'ivt': 'ivt',
    'IVT': 'ivt',
    'INVENTORY MAINTENANCE POLICY': 'inventory_maintenance_policy',
    'PLANT TYPE': 'plant_type',
    'plant_type': 'plant_type',
    'LIFE FORM': 'life_form',
    'IS DISTRIBUTABLE?': 'distribute',
    'distribute': 'distribute',
    'DISTRIBUTE': 'distribute',
    
    // Fruit characteristics
    'FRUITSHAPE 115057': 'fruitshape_115057',
    'FRUITLGTH 115156': 'fruitlgth_115156',
    'FRUITWIDTH 115157': 'fruitwidth_115157',
    'FRTWEIGHT 115121': 'frtweight_115121',
    'FRTSTEMTHK 115127': 'frtstemthk_115127',
    'FRTTEXTURE 115123': 'frttexture_115123',
    'FRTSTMLGTH 115158': 'frtstmlgth_115158',
    'FRTFLSHOXI 115129': 'frtflshoxi_115129',
    
    // Seed characteristics
    'SEEDCOLOR 115086': 'seedcolor_115086',
    'SSIZE Quantity of Seed': 'ssize_quantity_of_seed',
    'SEEDLENGTH 115163': 'seedlength_115163',
    'SEEDWIDTH 115164': 'seedwidth_115164',
    'SEEDNUMBER 115087': 'seednumber_115087',
    'SEEDSHAPE 115167': 'seedshape_115167',
    
    // Phenology
    'FIRST BLOOM DATE': 'first_bloom_date',
    'FULL BLOOM DATE': 'full_bloom_date',
    
    // Visual/Quality
    'COLOUR': 'colour',
    'colour': 'colour',
    'COLOR': 'color',
    'color': 'color',
    'DENSITY': 'density',
    'FIREBLIGHT RATING': 'fireblight_rating',
    
    // Descriptive
    'CMT': 'cmt',
    'cmt': 'cmt',
    'E_CMT': 'e_cmt',
    'e_cmt': 'e_cmt',
    'NARATIVEKEYWORD': 'narativekeyword',
    'FULL NARATIVE': 'full_narative',
    'PEDIGREE DESCRIPTION': 'e_pedigree',
    'E_PEDIGREE': 'e_pedigree',
    'e_pedigree': 'e_pedigree',
    'PEDIGREE': 'e_pedigree',
    
    // Status
    'STATUS': 'status',
    'status': 'status',
    'AVAILABILITY STATUS': 'availability_status',
    'IPR TYPE': 'ipr_type',
    'LEVEL OF IMPROVEMENT': 'level_of_improvement',
    'RELEASED DATE': 'e_released',
    'e_released': 'e_released',
    'E_RELEASED': 'e_released',
    'RELEASED DATE FORMAT': 'e_datefmt',
    'e_datefmt': 'e_datefmt',
    
    // Site and inventory fields
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

  const normalized = { images: row.images || [] };
  
  // Process each field in the row
  Object.keys(row).forEach(key => {
    if (key === 'images') {
      // Skip, already handled
      return;
    }
    
    const normalizedKey = fieldMap[key];
    if (normalizedKey) {
      normalized[normalizedKey] = String(row[key] || '').trim();
    } else {
      // Store unknown fields with sanitized key names
      const customKey = key.toLowerCase().replace(/[^a-z0-9_]/g, '_');
      if (customKey && customKey !== '') {
        normalized[customKey] = String(row[key] || '').trim();
      }
    }
  });

  // Ensure mandatory fields exist
  if (!normalized.accession) {
    normalized.accession = normalized.ACCESSION || '';
  }
  if (!normalized.cultivar_name) {
    normalized.cultivar_name = normalized.name || normalized.CULTIVAR_NAME || '';
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
}

function matchImageToRecord(imageName, imageUrl, records) {
  const lowerName = imageName.toLowerCase().replace(/\.(jpg|jpeg|png|webp|gif)$/i, '');
  let matched = false;
  
  for (const record of records) {
    const acc = String(record.accession || '').toLowerCase();
    const cultivar = String(record.cultivar_name || '').toLowerCase();
    const acno = String(record.acno || '').toLowerCase();
    const labelName = String(record.label_name || '').toLowerCase();
    
    let found = false;
    
    // Match by ACCESSION (e.g., MAL0100, MAL0622)
    if (acc && acc.length > 0 && lowerName.includes(acc)) {
      found = true;
    }
    
    // Match by cultivar name
    if (!found && cultivar && cultivar.length > 2) {
      const cultivarClean = cultivar.replace(/[^a-z0-9]/g, '');
      const nameWithCultivar = lowerName.replace(/[^a-z0-9]/g, '');
      if (nameWithCultivar.includes(cultivarClean)) {
        found = true;
      }
    }
    
    // Match by ACNO
    if (!found && acno && acno.length > 0 && lowerName.includes(acno)) {
      found = true;
    }
    
    // Match by label name
    if (!found && labelName && labelName.length > 2) {
      const labelClean = labelName.replace(/[^a-z0-9]/g, '');
      const nameWithLabel = lowerName.replace(/[^a-z0-9]/g, '');
      if (nameWithLabel.includes(labelClean)) {
        found = true;
      }
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
          const prioritySheets = ['Accession', 'Pedigree', 'Descriptors', 'Accession Source'];
          const otherSheets = workbook.SheetNames.filter(s => !prioritySheets.includes(s));
          const orderedSheets = [...prioritySheets.filter(s => workbook.SheetNames.includes(s)), ...otherSheets];
          
          orderedSheets.forEach(sheetName => {
            const worksheet = workbook.Sheets[sheetName];
            const parsed = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
            // Filter out empty rows and header rows
            const validRows = parsed.filter(row => {
              const vals = Object.values(row);
              if (!vals.some(v => v !== '' && v !== null && v !== undefined)) return false;
              // Skip rows where all values look like headers
              const allHeaders = vals.every(v => 
                typeof v === 'string' && (
                  v.toUpperCase() === v || 
                  v.includes('ACCESSION') || 
                  v.includes('CULTIVAR')
                )
              );
              return !allHeaders;
            });
            if (validRows.length > 0) {
              allRecords.push(...validRows.map(normalize));
            }
          });
        } else if (['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext)) {
          // Store image reference (relative path for serving)
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