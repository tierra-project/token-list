import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import * as fs from 'fs';
import * as path from 'path';
import { TokenList } from './types';

// Initialize Ajv with formats
const ajv = new Ajv({ allErrors: true });
addFormats(ajv);

// Read schema and token list
const schemaPath = path.join(__dirname, '../schemas/tokens.schema.json');
const tokenListPath = path.join(__dirname, '../tokens/80094.json');

const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
const tokenList = JSON.parse(fs.readFileSync(tokenListPath, 'utf8')) as TokenList;

if (!tokenList.tokens) {
  console.error('❌ Token list is missing tokens property');
  process.exit(1);
}

// Compile schema
const validate = ajv.compile(schema);

// Validate token list
const valid = validate(tokenList);

if (!valid) {
  console.error('❌ Token list validation failed:');
  console.error(JSON.stringify(validate.errors, null, 2));
  process.exit(1);
}

// Additional validations
console.log('🔍 Running additional validations...');

// Check for duplicate addresses
const addresses = new Set<string>();
const duplicates = new Set<string>();

tokenList.tokens.forEach((token: any) => {
  if (addresses.has(token.address)) {
    duplicates.add(token.address);
  }
  addresses.add(token.address);
});

if (duplicates.size > 0) {
  console.error('❌ Found duplicate token addresses:');
  duplicates.forEach((addr) => {
    console.error(`  ${addr}`);
  });
  process.exit(1);
}

// Check for valid chain ID
const validChainId = 80094;
const invalidChainIds = tokenList.tokens.filter((token: any) => token.chainId !== validChainId);
if (invalidChainIds.length > 0) {
  console.error('❌ Found tokens with invalid chain ID:');
  invalidChainIds.forEach((token: any) => {
    console.error(`  ${token.symbol} (${token.address}): ${token.chainId}`);
  });
  process.exit(1);
}

// Check for valid decimals
const invalidDecimals = tokenList.tokens.filter(
  (token: any) => token.decimals < 0 || token.decimals > 18
);
if (invalidDecimals.length > 0) {
  console.error('❌ Found tokens with invalid decimals:');
  invalidDecimals.forEach((token: any) => {
    console.error(`  ${token.symbol} (${token.address}): ${token.decimals}`);
  });
  process.exit(1);
}

// Check for valid logo URIs
const invalidLogos = tokenList.tokens.filter(
  (token: any) => token.logoURI && !token.logoURI.startsWith('http')
);
if (invalidLogos.length > 0) {
  console.error('❌ Found tokens with invalid logo URIs:');
  invalidLogos.forEach((token: any) => {
    console.error(`  ${token.symbol} (${token.address}): ${token.logoURI}`);
  });
  process.exit(1);
}

console.log('✅ Token list validation passed!');
console.log(`📊 Total tokens: ${tokenList.tokens.length}`);
console.log(`🔗 Chain ID: ${validChainId}`);
