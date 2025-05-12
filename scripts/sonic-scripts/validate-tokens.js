const fs = require('fs');
const path = require('path');

// Read both token lists
const tokenListPath = path.join(__dirname, '../../tokens/146.json');
const sonicTokenListPath = path.join(__dirname, '../../sonic_tokenlist.json');
const logosPath = path.join(__dirname, '../../logos/146');

const tokenList = JSON.parse(fs.readFileSync(tokenListPath, 'utf8'));
const sonicList = JSON.parse(fs.readFileSync(sonicTokenListPath, 'utf8'));

// Create a map of valid tokens from sonic_tokenlist.json
const validTokens = new Map();
sonicList.tokens[0].forEach(token => {
  const key = `${token.address.toLowerCase()}-${token.symbol.toLowerCase()}`;
  validTokens.set(key, token);
});

// Check for missing logos
const missingLogos = [];
tokenList.tokens.forEach(token => {
  if (token.symbol === 'SONIC') return; // Skip SONIC token
  
  const logoPath = path.join(logosPath, `${token.symbol}.png`);
  if (!fs.existsSync(logoPath)) {
    missingLogos.push(token.symbol);
  }
});

// Filter out invalid tokens
const filteredTokens = tokenList.tokens.filter(token => {
  // Skip validation for SONIC token
  if (token.symbol === 'SONIC') {
    return true;
  }

  const key = `${token.address.toLowerCase()}-${token.symbol.toLowerCase()}`;
  const isValid = validTokens.has(key);
  
  if (!isValid) {
    console.log(`Removing invalid token: ${token.symbol} (${token.address})`);
    console.log(`  Expected symbol: ${validTokens.get(token.address.toLowerCase())?.symbol || 'not found'}`);
  }
  
  return isValid;
});

// Update the token list with only valid tokens
tokenList.tokens = filteredTokens;

// Write the updated token list back to the file
fs.writeFileSync(tokenListPath, JSON.stringify(tokenList, null, 2));

// Count tokens excluding SONIC
const sonicListCount = sonicList.tokens[0].length;
const ourListCount = tokenList.tokens.filter(t => t.symbol !== 'SONIC').length;

console.log(`\nValidation complete!`);
console.log(`Original token count: ${tokenList.tokens.length + (tokenList.tokens.length - filteredTokens.length)}`);
console.log(`Valid token count: ${filteredTokens.length}`);
console.log(`Removed ${tokenList.tokens.length - filteredTokens.length} invalid tokens`);
console.log(`\nLength comparison (excluding SONIC token):`);
console.log(`Official list length: ${sonicListCount}`);
console.log(`Our list length: ${ourListCount}`);
console.log(`Difference: ${Math.abs(sonicListCount - ourListCount)} tokens`);

if (missingLogos.length > 0) {
  console.log(`\nMissing logos (${missingLogos.length}):`);
  missingLogos.forEach(symbol => {
    console.log(`- ${symbol}.png`);
  });
} else {
  console.log(`\nAll logos are present!`);
} 