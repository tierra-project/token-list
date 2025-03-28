# Berachain Token List

This repository contains the official token list for Berachain. The token list follows the [Uniswap Token List Standard](https://github.com/Uniswap/token-lists).

## Structure

The token list is stored in `tokens/80094.json` and contains verified tokens on the Berachain network.

## Adding Tokens

To add a new token to the list, please follow these steps:

1. Fork this repository
2. Create a new branch for your token submission
3. Add your token to `tokens/80094.json` using the `add-token` script:
   ```bash
   npm run add-token -- \
     --address=0x... \
     --name="Token Name" \
     --symbol=TKN \
     --decimals=18 \
     --logo=https://... \
     --tags=stablecoin,featured \
     --coingecko=token-id \
     --pyth=price-feed-id
   ```
4. Generate a PR description using the same parameters:
   ```bash
   npm run generate-pr -- \
     --address=0x... \
     --name="Token Name" \
     --symbol=TKN \
     --decimals=18 \
     --logo=https://... \
     --tags=stablecoin,featured \
     --coingecko=token-id \
     --pyth=price-feed-id
   ```
5. Create a pull request and paste the generated description
6. Ensure all verification and checklist boxes are checked
7. Wait for review and approval

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
- Tags (comma-separated list)
- CoinGecko ID
- Pyth Price Feed ID

## Chain ID

Berachain Chain ID: 80094

## License

MIT
