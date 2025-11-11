// scripts/linkImagesToApples.js - CORRECTED VERSION
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Fix __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Connect to MongoDB directly
mongoose.connect('mongodb://localhost:27017/appleverse', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ Connected to MongoDB'))
.catch(err => {
  console.error('❌ MongoDB connection error:', err);
  process.exit(1);
});

// Main function to link images
async function linkImagesToApples() {
  try {
    const db = mongoose.connection;
    const applesCollection = db.collection('apples');
    
    const imagesDir = path.join(__dirname, '..', 'images');
    
    console.log(`\n📁 Scanning images directory: ${imagesDir}`);
    
    // Read all files in images folder
    const files = fs.readdirSync(imagesDir);
    const imageFiles = files.filter(f => /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(f));
    
    console.log(`📸 Found ${imageFiles.length} image files\n`);
    
    let linked = 0;
    let notFound = 0;
    const imagesByAccession = {};
    
    // Group images by accession number
    for (const file of imageFiles) {
      // Extract accession from filename
      // Pattern: "name MAL0622.jpg" or "name MAL0622-2.jpg"
      const match = file.match(/MAL(\d{4,})/i);
      
      if (match) {
        const accession = `mal${match[1]}`.toLowerCase();
        
        if (!imagesByAccession[accession]) {
          imagesByAccession[accession] = [];
        }
        
        imagesByAccession[accession].push(`/images/${file}`);
        console.log(`🔗 Matched: ${file} → ${accession}`);
      } else {
        console.log(`⚠️ Could not extract accession from: ${file}`);
      }
    }
    
    console.log(`\n📊 Accessions found in images: ${Object.keys(imagesByAccession).length}\n`);
    
    // Update MongoDB records using direct collection methods
    for (const [accession, imagePaths] of Object.entries(imagesByAccession)) {
      try {
        const result = await applesCollection.findOneAndUpdate(
          { accession: accession },
          { $set: { images: imagePaths } },
          { returnDocument: 'after' }
        );
        
        if (result.value) {
          linked++;
          const cultivarName = result.value.cultivar_name || 'Unknown';
          console.log(`✅ Linked ${imagePaths.length} image(s) to ${accession}: ${cultivarName}`);
        } else {
          notFound++;
          console.log(`❌ No apple found with accession: ${accession}`);
        }
      } catch (err) {
        console.error(`❌ Error updating ${accession}:`, err.message);
      }
    }
    
    console.log(`\n📈 Summary:`);
    console.log(`   ✅ Successfully linked: ${linked}`);
    console.log(`   ❌ Not found in database: ${notFound}`);
    console.log(`   📸 Total images processed: ${imageFiles.length}`);
    
    console.log(`\n✨ Image linking complete!`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📴 MongoDB disconnected');
    process.exit(0);
  }
}

// Run the script
linkImagesToApples();