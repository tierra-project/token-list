# Tierra Token List

This repository contains the official token list for [Tierra](https://tierra.live). The token list follows the [Uniswap Token List Standard](https://github.com/Uniswap/token-lists).

## Structure

The token list is stored in `tokens/80094.json` and contains verified tokens on the Berachain network.

## Adding Tokens

There are two ways to add a token to the list:

### Option 1: Using the CLI Tool

1. Fork this repository
2. Create a new branch for your token submission
3. Add your token using the `add-token` script:
   ```bash
   pnpm run add-token -- \
     --address=0x... \
     --name="Token Name" \
     --symbol=TKN \
     --decimals=18 \
     --logo=https://... \
     --tags=stablecoin,featured \
     --coingeckoId=token-id \
     --pythPriceId=price-feed-id
   ```
4. Create a pull request
   - The PR description will be automatically generated with your token information
   - Review the generated description to ensure all information is correct

### Option 2: Manual Submission

1. Fork this repository
2. Create a new branch for your token submission
3. Add your token to `tokens/80094.json` manually following this format:
   ```json
   {
     "chainId": 80094,
     "address": "0x...",
     "name": "Token Name",
     "symbol": "TKN",
     "decimals": 18,
     "logoURI": "https://...",
     "tags": ["tag1", "tag2"],
     "extensions": {
       "coingeckoId": "token-id",
       "pythPriceId": "price-feed-id"
     }
   }
   ```
4. Create a pull request
   - The PR description will be automatically generated with your token information
   - Review the generated description to ensure all information is correct

### Token Submission Requirements

- Token must be deployed on Berachain (Chain ID: 80094)
- Token contract must be verified on Berachain block explorer
- Token must not be a scam or malicious token
- All required fields must be filled out correctly
- Token must not already exist in the list
- Logo URI must be accessible and follow our guidelines

### Required Fields

- Token address (must be a valid Ethereum address)
- Token name
- Token symbol
- Decimals (must be between 0 and 18)

### Optional Fields

- Logo URI (must be a valid HTTP(S) URL)
- Tags (array of strings)
- Extensions:
  - CoinGecko ID
  - Pyth Price Feed ID

## Chain ID

Berachain Chain ID: 80094

## Development

To set up the development environment:

```bash
# Install dependencies
pnpm install

# Validate token list
pnpm run validate
```

## License

MIT
