const fs = require('fs');
const path = require('path');

// Read token list
const tokenListPath = path.join(__dirname, '../../tokens/146.json');
const tokenList = JSON.parse(fs.readFileSync(tokenListPath, 'utf8'));

// Update logoURIs
tokenList.tokens = tokenList.tokens.map(token => {
  if (token.logoURI && token.logoURI.startsWith('logos/146/')) {
    const symbol = token.logoURI.split('/').pop();
    token.logoURI = `https://raw.githubusercontent.com/tierra-project/token-list/main/logos/146/${symbol}`;
  }
  return token;
});

// Write the updated file
fs.writeFileSync(tokenListPath, JSON.stringify(tokenList, null, 2));
console.log('Updated logoURIs in tokens/146.json'); 