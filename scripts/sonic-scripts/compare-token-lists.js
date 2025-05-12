const fs = require('fs');
const path = require('path');

// Paths
const CURRENT_LIST_PATH = path.join(__dirname, '../../tokens/146.json');
const BACKUP_DIR = path.join(__dirname, '../../tokens');

// Find the most recent backup
function findLatestBackup() {
    const files = fs.readdirSync(BACKUP_DIR)
        .filter(file => file.startsWith('146.backup.') && file.endsWith('.json'))
        .sort()
        .reverse();
    
    if (files.length === 0) {
        throw new Error('No backup files found');
    }
    
    return path.join(BACKUP_DIR, files[0]);
}

// Compare two token lists
function compareTokenLists(current, backup) {
    const changes = {
        added: [],
        removed: [],
        modified: []
    };

    // Create maps for easier comparison
    const currentMap = new Map(current.tokens.map(t => [t.address, t]));
    const backupMap = new Map(backup.tokens.map(t => [t.address, t]));

    // Find added and modified tokens
    for (const [address, currentToken] of currentMap) {
        const backupToken = backupMap.get(address);
        if (!backupToken) {
            changes.added.push(currentToken);
        } else if (JSON.stringify(currentToken) !== JSON.stringify(backupToken)) {
            changes.modified.push({
                address,
                current: currentToken,
                backup: backupToken
            });
        }
    }

    // Find removed tokens
    for (const [address, backupToken] of backupMap) {
        if (!currentMap.has(address)) {
            changes.removed.push(backupToken);
        }
    }

    return changes;
}

// Main execution
console.log('=== Comparing Token Lists ===\n');

try {
    // Read current and backup files
    const currentList = JSON.parse(fs.readFileSync(CURRENT_LIST_PATH, 'utf8'));
    const backupPath = findLatestBackup();
    const backupList = JSON.parse(fs.readFileSync(backupPath, 'utf8'));

    console.log(`Current list: ${CURRENT_LIST_PATH}`);
    console.log(`Backup list: ${backupPath}\n`);

    // Compare the lists
    const changes = compareTokenLists(currentList, backupList);

    // Print results
    console.log('=== Changes Found ===\n');

    if (changes.added.length > 0) {
        console.log('Added Tokens:');
        changes.added.forEach(token => {
            console.log(`  - ${token.symbol} (${token.address})`);
        });
        console.log();
    }

    if (changes.removed.length > 0) {
        console.log('Removed Tokens:');
        changes.removed.forEach(token => {
            console.log(`  - ${token.symbol} (${token.address})`);
        });
        console.log();
    }

    if (changes.modified.length > 0) {
        console.log('Modified Tokens:');
        changes.modified.forEach(({ address, current, backup }) => {
            console.log(`  - ${current.symbol} (${address})`);
            
            // Compare extensions
            if (JSON.stringify(current.extensions) !== JSON.stringify(backup.extensions)) {
                console.log('    Extensions:');
                if (current.extensions.coingeckoId !== backup.extensions.coingeckoId) {
                    console.log(`      CoinGecko ID: ${backup.extensions.coingeckoId || 'none'} -> ${current.extensions.coingeckoId || 'none'}`);
                }
                if (current.extensions.pythPriceId !== backup.extensions.pythPriceId) {
                    console.log(`      Pyth Price ID: ${backup.extensions.pythPriceId || 'none'} -> ${current.extensions.pythPriceId || 'none'}`);
                }
            }
            
            // Compare other fields
            const fields = ['name', 'symbol', 'decimals', 'logoURI', 'tags'];
            fields.forEach(field => {
                if (JSON.stringify(current[field]) !== JSON.stringify(backup[field])) {
                    console.log(`    ${field}: ${JSON.stringify(backup[field])} -> ${JSON.stringify(current[field])}`);
                }
            });
            console.log();
        });
    }

    if (changes.added.length === 0 && changes.removed.length === 0 && changes.modified.length === 0) {
        console.log('No changes found between the lists.');
    }

    console.log('\n=== Comparison Complete ===');

} catch (error) {
    console.error('\nError during comparison:', error.message);
    process.exit(1);
} 