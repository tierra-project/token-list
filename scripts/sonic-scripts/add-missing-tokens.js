const fs = require('fs');
const path = require('path');

// Read both token lists
const tokenListPath = path.join(__dirname, '../../tokens/146.json');
const sonicTokenListPath = path.join(__dirname, '../../sonic_tokenlist.json');

const tokenList = JSON.parse(fs.readFileSync(tokenListPath, 'utf8'));
const sonicList = JSON.parse(fs.readFileSync(sonicTokenListPath, 'utf8'));

// Create a map of our existing tokens
const existingTokens = new Map();
tokenList.tokens.forEach(token => {
  existingTokens.set(token.address.toLowerCase(), token);
});

// Find missing tokens
const missingTokens = sonicList.tokens[0].filter(token => {
  return !existingTokens.has(token.address.toLowerCase());
});

// Add missing tokens to our list
missingTokens.forEach(token => {
  console.log(`Adding missing token: ${token.symbol} (${token.address})`);
  tokenList.tokens.push({
    chainId: 146,
    address: token.address,
    symbol: token.symbol,
    name: token.name,
    decimals: token.decimals,
    logoURI: `https://raw.githubusercontent.com/tierra-project/token-list/main/logos/146/${token.symbol}.png`
  });
});

// Write the updated token list back to the file
fs.writeFileSync(tokenListPath, JSON.stringify(tokenList, null, 2));

console.log(`\nUpdate complete!`);
console.log(`Added ${missingTokens.length} missing tokens`);
console.log(`New total token count: ${tokenList.tokens.length}`); 