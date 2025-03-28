export interface TokenList {
    name: string;
    logoURI?: string;
    keywords?: string[];
    tags?: {
      [key: string]: {
        name: string;
        description: string;
      };
    };
    version?: {
      major: number;
      minor: number;
      patch: number;
    };
    tokens: Token[];
  }
  
  export interface Token {
    chainId: number;
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