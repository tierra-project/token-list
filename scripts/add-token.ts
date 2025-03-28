import * as fs from 'fs';
import * as path from 'path';
import { Token, TokenList } from './types';

const TOKEN_LIST_PATH = path.join(__dirname, '../tokens/80094.json');

interface NewTokenInput {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  logoURI?: string;
  tags?: string[];
  extensions?: {
    coingeckoId?: string;
    pythPriceId?: string;
  };
}

function validateAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

function validateDecimals(decimals: number): boolean {
  return decimals >= 0 && decimals <= 18;
}

function validateLogoURI(uri?: string): boolean {
  if (!uri) return true;
  return uri.startsWith('http');
}

function validateToken(token: NewTokenInput): string[] {
  const errors: string[] = [];

  if (!validateAddress(token.address)) {
    errors.push('Invalid token address format');
  }

  if (!token.name || token.name.trim().length === 0) {
    errors.push('Token name is required');
  }

  if (!token.symbol || token.symbol.trim().length === 0) {
    errors.push('Token symbol is required');
  }

  if (!validateDecimals(token.decimals)) {
    errors.push('Decimals must be between 0 and 18');
  }

  if (!validateLogoURI(token.logoURI)) {
    errors.push('Logo URI must start with http');
  }

  return errors;
}

function addToken(newToken: NewTokenInput): void {
  // Read existing token list
  const tokenListContent = fs.readFileSync(TOKEN_LIST_PATH, 'utf8');
  const tokenList: TokenList = JSON.parse(tokenListContent);

  // Validate new token
  const errors = validateToken(newToken);
  if (errors.length > 0) {
    console.error('❌ Token validation failed:');
    errors.forEach(error => console.error(`  - ${error}`));
    process.exit(1);
  }

  // Check for duplicate address
  const isDuplicate = tokenList.tokens.some(
    token => token.address.toLowerCase() === newToken.address.toLowerCase()
  );

  if (isDuplicate) {
    console.error('❌ Token address already exists in the list');
    process.exit(1);
  }

  // Create new token entry
  const token: Token = {
    chainId: 80094,
    address: newToken.address,
    name: newToken.name,
    symbol: newToken.symbol,
    decimals: newToken.decimals,
    ...(newToken.logoURI && { logoURI: newToken.logoURI }),
    ...(newToken.tags && { tags: newToken.tags }),
    ...(newToken.extensions && { extensions: newToken.extensions }),
  };

  // Add token to list
  tokenList.tokens.push(token);

  // Sort tokens by address
  tokenList.tokens.sort((a, b) => a.address.toLowerCase().localeCompare(b.address.toLowerCase()));

  // Write updated token list
  fs.writeFileSync(TOKEN_LIST_PATH, JSON.stringify(tokenList, null, 2));

  console.log('✅ Token added successfully!');
  console.log(`📝 Token details:`);
  console.log(`   Name: ${token.name}`);
  console.log(`   Symbol: ${token.symbol}`);
  console.log(`   Address: ${token.address}`);
  console.log(`   Decimals: ${token.decimals}`);
}

// Example usage:
// npm run add-token -- --address 0x... --name "Token Name" --symbol "TKN" --decimals 18
if (require.main === module) {
  const args = process.argv.slice(2);
  const newToken: NewTokenInput = {
    address: args.find(arg => arg.startsWith('--address='))?.split('=')[1] || '',
    name: args.find(arg => arg.startsWith('--name='))?.split('=')[1] || '',
    symbol: args.find(arg => arg.startsWith('--symbol='))?.split('=')[1] || '',
    decimals: parseInt(args.find(arg => arg.startsWith('--decimals='))?.split('=')[1] || '0'),
    logoURI: args.find(arg => arg.startsWith('--logo='))?.split('=')[1],
    tags: args.find(arg => arg.startsWith('--tags='))?.split('=')[1]?.split(','),
    extensions: {
      coingeckoId: args.find(arg => arg.startsWith('--coingecko='))?.split('=')[1],
      pythPriceId: args.find(arg => arg.startsWith('--pyth='))?.split('=')[1],
    },
  };

  addToken(newToken);
} 