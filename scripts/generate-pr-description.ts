import * as fs from 'fs';
import * as path from 'path';
import { Token } from './types';

interface TokenSubmission {
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

function generatePRDescription(token: TokenSubmission): string {
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
    description = description.replace('**Logo URI**: <!-- Optional, must be a valid HTTP(S) URL -->', `**Logo URI**: ${token.logoURI}`);
  }

  if (token.tags && token.tags.length > 0) {
    description = description.replace('**Tags**: <!-- Optional, comma-separated list of tags -->', `**Tags**: ${token.tags.join(', ')}`);
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

// Example usage:
// npm run generate-pr -- --address 0x... --name "Token Name" --symbol "TKN" --decimals 18
if (require.main === module) {
  const args = process.argv.slice(2);
  const token: TokenSubmission = {
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

  const description = generatePRDescription(token);
  console.log(description);
} 