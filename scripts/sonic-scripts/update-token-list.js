const { execSync } = require('child_process');
const path = require('path');
const https = require('https');
const fs = require('fs');

const TOKEN_LIST_URL = 'https://raw.githubusercontent.com/Shadow-Exchange/shadow-assets/main/blockchains/sonic/tokenlist.json';
const TOKEN_LIST_PATH = path.join(__dirname, '../../sonic_tokenlist.json');
const SCRIPTS_DIR = __dirname;
const FINAL_TOKEN_LIST_PATH = path.join(__dirname, '../../tokens/146.json');

// Function to create backup of the token list
function createBackup() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(__dirname, '../../tokens/146.backup.' + timestamp + '.json');
    
    if (fs.existsSync(FINAL_TOKEN_LIST_PATH)) {
        const tokenList = JSON.parse(fs.readFileSync(FINAL_TOKEN_LIST_PATH, 'utf8'));
        fs.writeFileSync(backupPath, JSON.stringify(tokenList, null, 2));
        console.log(`Created backup at: ${backupPath}`);
    } else {
        console.log('No existing token list to backup.');
    }
}

// Function to download the latest token list
function downloadLatestTokenList() {
    return new Promise((resolve, reject) => {
        console.log('Downloading latest token list from Shadow Exchange...');
        https.get(TOKEN_LIST_URL, (response) => {
            if (response.statusCode === 200) {
                const file = fs.createWriteStream(TOKEN_LIST_PATH);
                response.pipe(file);
                file.on('finish', () => {
                    file.close();
                    console.log('✓ Downloaded latest token list');
                    resolve();
                });
            } else {
                reject(`Failed to download token list: ${response.statusCode}`);
            }
        }).on('error', (err) => {
            reject(`Error downloading token list: ${err.message}`);
        });
    });
}

console.log('=== Starting Token List Update ===\n');

async function updateTokenList() {
    try {
        // Step 0: Create backup of current token list
        console.log('\nStep 0: Creating backup of current token list...');
        createBackup();
        
        // Step 1: Download latest token list
        await downloadLatestTokenList();
        
        // Step 2: Validate current state
        console.log('\nStep 2: Validating current token list...');
        execSync(`node ${path.join(SCRIPTS_DIR, 'validate-tokens.js')}`, { stdio: 'inherit' });
        
        // Step 3: Add missing tokens
        console.log('\nStep 3: Adding missing tokens...');
        execSync(`node ${path.join(SCRIPTS_DIR, 'add-missing-tokens.js')}`, { stdio: 'inherit' });
        
        // Step 4: Download missing logos
        console.log('\nStep 4: Downloading missing logos...');
        execSync(`node ${path.join(SCRIPTS_DIR, 'download-logos.js')}`, { stdio: 'inherit' });
        
        // Step 5: Update logo URIs
        console.log('\nStep 5: Updating logo URIs...');
        execSync(`node ${path.join(SCRIPTS_DIR, 'update-logo-uris.js')}`, { stdio: 'inherit' });
        
        // Step 6: Final validation
        console.log('\nStep 6: Final validation...');
        execSync(`node ${path.join(SCRIPTS_DIR, 'validate-tokens.js')}`, { stdio: 'inherit' });
        
        // Step 7: Remove temp files
        console.log('\nStep 7: Cleaning up temp files...');
        if (fs.existsSync(TOKEN_LIST_PATH)) {
            fs.unlinkSync(TOKEN_LIST_PATH);
            console.log('✓ Removed temp file sonic_tokenlist.json');
        } else {
            console.log('No temp files to remove.');
        }
        
        console.log('\n=== Token List Update Complete ===');
        console.log('Please review the changes and commit them to your repository.');
        
    } catch (error) {
        console.error('\nError during update process:', error.message);
        process.exit(1);
    }
}

// Run the update process
updateTokenList(); 