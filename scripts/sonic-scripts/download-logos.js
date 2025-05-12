const fs = require('fs');
const path = require('path');
const https = require('https');

// Read token list
const tokenListPath = path.join(__dirname, '../../tokens/146.json');
const logosPath = path.join(__dirname, '../../logos/146');
const tokenList = JSON.parse(fs.readFileSync(tokenListPath, 'utf8'));

// Create logos directory if it doesn't exist
if (!fs.existsSync(logosPath)) {
  fs.mkdirSync(logosPath, { recursive: true });
}

// Function to download a file
function downloadFile(url, filepath) {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      if (response.statusCode === 200) {
        const file = fs.createWriteStream(filepath);
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          resolve();
        });
      } else {
        reject(`Failed to download ${url}: ${response.statusCode}`);
      }
    }).on('error', (err) => {
      reject(`Error downloading ${url}: ${err.message}`);
    });
  });
}

// Check for missing logos and download them
async function downloadMissingLogos() {
  const missingLogos = [];
  const failedDownloads = [];

  // First, check which logos are missing
  for (const token of tokenList.tokens) {
    if (token.symbol === 'SONIC') continue; // Skip SONIC token
    
    const logoPath = path.join(logosPath, `${token.symbol}.png`);
    if (!fs.existsSync(logoPath)) {
      missingLogos.push(token);
    }
  }

  console.log(`Found ${missingLogos.length} missing logos\n`);

  // Download missing logos
  for (const token of missingLogos) {
    const logoUrl = `https://raw.githubusercontent.com/tierra-project/shadow-assets/main/blockchains/sonic/assets/${token.address}/logo.png`;
    const logoPath = path.join(logosPath, `${token.symbol}.png`);
    
    try {
      console.log(`Downloading ${token.symbol}.png...`);
      await downloadFile(logoUrl, logoPath);
      console.log(`✓ Downloaded ${token.symbol}.png`);
    } catch (error) {
      console.log(`✗ Failed to download ${token.symbol}.png: ${error}`);
      failedDownloads.push(token.symbol);
    }
  }

  // Print summary
  console.log('\nDownload Summary:');
  console.log(`Total missing logos: ${missingLogos.length}`);
  console.log(`Successfully downloaded: ${missingLogos.length - failedDownloads.length}`);
  console.log(`Failed downloads: ${failedDownloads.length}`);

  if (failedDownloads.length > 0) {
    console.log('\nFailed downloads:');
    failedDownloads.forEach(symbol => {
      console.log(`- ${symbol}.png`);
    });
  }
}

// Run the download process
downloadMissingLogos().catch(console.error); 