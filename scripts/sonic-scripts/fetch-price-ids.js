const fs = require('fs');
const path = require('path');
const https = require('https');
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');

// Read token list
const tokenListPath = path.join(__dirname, '../../tokens/146.json');
const tokenList = JSON.parse(fs.readFileSync(tokenListPath, 'utf8'));

// API endpoints
const COINGECKO_API = 'api.coingecko.com';
const PYTH_API = 'hermes.pyth.network';

// Rate limiting for CoinGecko API
const RATE_LIMIT_DELAY = 1200; // 1.2 seconds between requests to stay under free tier limit
const MAX_WORKERS = 5; // Maximum number of concurrent workers

// Helper function to make API requests
function fetchFromAPI(hostname, path) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname,
            path,
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    reject(new Error(`Failed to parse response: ${e.message}`));
                }
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        req.end();
    });
}

// Helper function to delay execution
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

// Helper function to make API requests with retries
async function fetchFromAPIWithRetry(hostname, path, maxRetries = 3, retryDelay = 1000) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const response = await fetchFromAPI(hostname, path);
            if (!response) {
                throw new Error('Empty response received');
            }
            return response;
        } catch (error) {
            console.error(`Attempt ${attempt} failed for ${hostname}${path}: ${error.message}`);
            if (attempt === maxRetries) {
                throw error;
            }
            console.log(`Retrying in ${retryDelay}ms...`);
            await delay(retryDelay);
            retryDelay *= 2; // Exponential backoff
        }
    }
}

// Fetch CoinGecko ID by contract address
async function fetchCoinGeckoIdByAddress(address) {
    try {
        // Try to get by contract address first
        const data = await fetchFromAPIWithRetry(COINGECKO_API, `/api/v3/coins/sonic/contract/${address}`);
        if (data && data.id) {
            return data.id;
        }
        return null;
    } catch (error) {
        console.error(`Error fetching CoinGecko ID for address ${address}: ${error.message}`);
        return null;
    }
}

// Fetch Pyth Price ID by symbol
async function fetchPythPriceId(symbol) {
    try {
        // First try to get specific price feed by symbol
        const specificData = await fetchFromAPIWithRetry(PYTH_API, `/v2/price_feeds?query=${encodeURIComponent(symbol)}&asset_type=crypto`);
        if (specificData && Array.isArray(specificData) && specificData.length > 0) {
            return specificData[0].id;
        }

        // If no specific match, get all feeds and find match
        const allData = await fetchFromAPIWithRetry(PYTH_API, '/v2/price_feeds?asset_type=crypto');
        if (allData && Array.isArray(allData)) {
            const feed = allData.find(f => 
                f.attributes.base.toUpperCase() === symbol.toUpperCase() ||
                f.attributes.generic_symbol.toUpperCase() === `${symbol}USD`.toUpperCase()
            );
            return feed ? feed.id : null;
        }
        return null;
    } catch (error) {
        console.error(`Error fetching Pyth Price ID for ${symbol}: ${error.message}`);
        return null;
    }
}

// Worker thread function
async function processToken(token) {
    const result = { ...token };
    
    // Initialize extensions if not exists
    if (!result.extensions) {
        result.extensions = {};
    }

    // Fetch CoinGecko ID
    if (!result.extensions.coingeckoId) {
        const coingeckoId = await fetchCoinGeckoIdByAddress(result.address);
        if (coingeckoId) {
            result.extensions.coingeckoId = coingeckoId;
        }
        // Add delay to respect rate limits
        await delay(RATE_LIMIT_DELAY);
    }

    // Fetch Pyth Price ID
    if (!result.extensions.pythPriceId) {
        const pythPriceId = await fetchPythPriceId(result.symbol);
        if (pythPriceId) {
            result.extensions.pythPriceId = pythPriceId;
        }
    }

    return result;
}

// Worker thread code
if (!isMainThread) {
    const token = workerData;
    processToken(token).then(result => {
        parentPort.postMessage(result);
    }).catch(error => {
        parentPort.postMessage({ error: error.message });
    });
}

// Main thread code
if (isMainThread) {
    async function updatePriceIds() {
        console.log('Starting price ID update process...\n');
        
        // Create backup with timestamp
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupPath = path.join(__dirname, '../../tokens/146.backup.' + timestamp + '.json');
        fs.writeFileSync(backupPath, JSON.stringify(tokenList, null, 2));
        console.log(`Created backup at: ${backupPath}`);
        
        let updatedCount = 0;
        let coingeckoAdded = 0;
        let pythAdded = 0;
        
        // Process tokens in chunks to limit concurrent workers
        for (let i = 0; i < tokenList.tokens.length; i += MAX_WORKERS) {
            const chunk = tokenList.tokens.slice(i, i + MAX_WORKERS);
            const workers = chunk.map(token => {
                return new Promise((resolve, reject) => {
                    const worker = new Worker(__filename, {
                        workerData: token
                    });
                    
                    worker.on('message', result => {
                        if (result.error) {
                            console.error(`Error processing ${token.symbol}: ${result.error}`);
                            resolve(token); // Keep original token on error
                        } else {
                            if (result.extensions.coingeckoId && !token.extensions?.coingeckoId) {
                                coingeckoAdded++;
                            }
                            if (result.extensions.pythPriceId && !token.extensions?.pythPriceId) {
                                pythAdded++;
                            }
                            if (result.extensions.coingeckoId || result.extensions.pythPriceId) {
                                updatedCount++;
                            }
                            resolve(result);
                        }
                    });
                    
                    worker.on('error', reject);
                    worker.on('exit', code => {
                        if (code !== 0) {
                            reject(new Error(`Worker stopped with exit code ${code}`));
                        }
                    });
                });
            });
            
            // Wait for all workers in the chunk to complete
            const results = await Promise.all(workers);
            tokenList.tokens.splice(i, results.length, ...results);
            
            console.log(`Processed ${i + results.length}/${tokenList.tokens.length} tokens...`);
        }

        // Save updated token list with proper formatting
        const updatedTokenList = {
            ...tokenList,
            tokens: tokenList.tokens.map(token => ({
                chainId: token.chainId,
                address: token.address,
                name: token.name,
                symbol: token.symbol,
                decimals: token.decimals,
                logoURI: token.logoURI,
                tags: token.tags || [],
                extensions: token.extensions || {}
            }))
        };

        fs.writeFileSync(tokenListPath, JSON.stringify(updatedTokenList, null, 2));

        console.log('\nUpdate complete!');
        console.log(`Total tokens updated: ${updatedCount}`);
        console.log(`CoinGecko IDs added: ${coingeckoAdded}`);
        console.log(`Pyth Price IDs added: ${pythAdded}`);
        console.log(`Original file backed up to: ${backupPath}`);
    }

    // Run the update
    updatePriceIds().catch(console.error);
} 