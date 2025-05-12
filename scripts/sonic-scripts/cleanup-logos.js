const fs = require('fs');
const path = require('path');

// Paths
const TOKEN_LIST_PATH = path.join(__dirname, '../../tokens/146.json');
const LOGOS_DIR = path.join(__dirname, '../../logos/146');

// Read token list
const tokenList = JSON.parse(fs.readFileSync(TOKEN_LIST_PATH, 'utf8'));

// Get all logo URIs from token list
const validLogos = new Set(
    tokenList.tokens
        .map(token => token.logoURI)
        .filter(uri => uri && uri.includes('/logos/146/'))
        .map(uri => {
            const parts = uri.split('/');
            return parts[parts.length - 1]; // Get filename
        })
);

// Create backup of logos directory
function createBackup() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(__dirname, '../../logos/146.backup.' + timestamp);
    
    if (fs.existsSync(LOGOS_DIR)) {
        fs.mkdirSync(backupDir, { recursive: true });
        const files = fs.readdirSync(LOGOS_DIR);
        
        files.forEach(file => {
            const sourcePath = path.join(LOGOS_DIR, file);
            const destPath = path.join(backupDir, file);
            fs.copyFileSync(sourcePath, destPath);
        });
        
        console.log(`Created backup of logos at: ${backupDir}`);
    }
}

// Clean up unused logos
function cleanupLogos() {
    if (!fs.existsSync(LOGOS_DIR)) {
        console.log('Logos directory does not exist.');
        return;
    }

    const files = fs.readdirSync(LOGOS_DIR);
    let removedCount = 0;

    files.forEach(file => {
        if (!validLogos.has(file)) {
            const filePath = path.join(LOGOS_DIR, file);
            fs.unlinkSync(filePath);
            removedCount++;
            console.log(`Removed unused logo: ${file}`);
        }
    });

    console.log(`\nCleanup complete!`);
    console.log(`Total files removed: ${removedCount}`);
    console.log(`Total valid logos: ${validLogos.size}`);
}

// Main execution
console.log('=== Starting Logo Cleanup ===\n');

try {
    // Create backup first
    createBackup();
    
    // Perform cleanup
    cleanupLogos();
    
    console.log('\n=== Logo Cleanup Complete ===');
} catch (error) {
    console.error('\nError during cleanup process:', error.message);
    process.exit(1);
} 