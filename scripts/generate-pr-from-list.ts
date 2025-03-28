import * as fs from 'fs';
import * as path from 'path';
import { TokenList } from './types';

function getNewTokens(originalList: TokenList, updatedList: TokenList): TokenList['tokens'] {
  const originalAddresses = new Set(originalList.tokens.map(t => t.address.toLowerCase()));
  return updatedList.tokens.filter(token => !originalAddresses.has(token.address.toLowerCase()));
}

function generatePRDescription(token: TokenList['tokens'][0]): string {
  const template = fs.readFileSync(
    path.join(__dirname, '../.github/pull_request_template.md'),
    'utf8'
  );

  // Replace token information
  let description = template
    .replace('`0x...` <!-- Required -->', `\`${token.address}\``)
    .replace('**Token Name**: <!-- Required -->', `**Token Name**: ${token.name}`)
    .replace('**Token Symbol**: <!-- Required -->', `**Token Symbol**: ${token.symbol}`)
    .replace('**Decimals**: <!-- Required, must be between 0 and 18 -->', `**Decimals**: ${token.decimals}`);

  // Add optional fields if they exist
  if (token.logoURI) {
    description = description.replace(
      '**Logo URI**: <!-- Optional, must be a valid HTTP(S) URL -->',
      `**Logo URI**: ${token.logoURI}`
    );
  }

  if (token.tags && token.tags.length > 0) {
    description = description.replace(
      '**Tags**: <!-- Optional, comma-separated list of tags -->',
      `**Tags**: ${token.tags.join(', ')}`
    );
  }

  if (token.extensions?.coingeckoId) {
    description = description.replace(
      '**CoinGecko ID**: <!-- Optional -->',
      `**CoinGecko ID**: ${token.extensions.coingeckoId}`
    );
  }

  if (token.extensions?.pythPriceId) {
    description = description.replace(
      '**Pyth Price Feed ID**: <!-- Optional -->',
      `**Pyth Price Feed ID**: ${token.extensions.pythPriceId}`
    );
  }

  return description;
}

if (require.main === module) {
  if (process.argv.length < 4) {
    console.error('Usage: ts-node generate-pr-from-list.ts <original-list-path> <updated-list-path>');
    process.exit(1);
  }

  const originalListPath = process.argv[2];
  const updatedListPath = process.argv[3];

  if (!fs.existsSync(originalListPath)) {
    console.error(`Original list file not found: ${originalListPath}`);
    process.exit(1);
  }

  if (!fs.existsSync(updatedListPath)) {
    console.error(`Updated list file not found: ${updatedListPath}`);
    process.exit(1);
  }

  const originalList = JSON.parse(fs.readFileSync(originalListPath, 'utf8')) as TokenList;
  const updatedList = JSON.parse(fs.readFileSync(updatedListPath, 'utf8')) as TokenList;

  const newTokens = getNewTokens(originalList, updatedList);

  if (newTokens.length === 0) {
    console.error('No new tokens found in the updated list');
    process.exit(1);
  }

  // Generate PR description for each new token
  newTokens.forEach((token, index) => {
    console.log(`\n## Token ${index + 1}\n`);
    console.log(generatePRDescription(token));
  });
} 