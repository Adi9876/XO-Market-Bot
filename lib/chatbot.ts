import { Pinecone } from "@pinecone-database/pinecone";
import { OpenAIEmbeddings } from "@langchain/openai";
import { PineconeStore } from "@langchain/pinecone";
import { ChatOpenAI } from "@langchain/openai";
import { ConversationalRetrievalQAChain } from "langchain/chains";
import { ChatOllama } from "@langchain/community/chat_models/ollama";
import { ethers } from "ethers";
import dotenv from "dotenv";
import { OllamaEmbeddings } from "@langchain/community/embeddings/ollama";
import abi from "../abi.json";

dotenv.config();

// XO Market Contract ABI
const XO_MARKET_ABI = abi;

interface Market {
  id: Number;
  winningOutcome: Number;
  resolver: string;
  expiresAt: Number;
  startsAt: Number;
  creatorFeeBps: Number;
  collateralToken: string;
  createdAt: Number;
  resolvedAt: Number;
  alpha: Number;
  outcomeCount: Number;
  status: Number;
  outcomeTokenStartIndex: Number;
  pausedAt: Number;
  collateralAmount: Number;
  redeemableAmountPerShare: Number;
}

interface MarketData {
  address: string;
  question?: string;
  outcomes: string[];
  endTime: number;
  settled: boolean;
  winningOutcome?: string;
  liquidity: string;
  volume: string;
  id: number;
  creator: string;
  collateralToken: string;
  alpha: string;
  fee: number;
  outcomeCount: number;
  metadataURI: string;
  resolverFee: number;
  status: string;
  resolution?: string;
  outcomePrices: number[];
  protocolFee: number;
  lmsrNote: string;
  resolutionNote: string;
  freshness: string;
}

interface ChatResponse {
  answer: string;
  sources: Array<{
    title: string;
    source: string;
    chunk: number;
    content: string;
  }>;
  marketData?: MarketData[];
  responseTime: number;
}

class XOMarketChatbot {
  private vectorStore: PineconeStore | null = null;
  private chain: ConversationalRetrievalQAChain | null = null;
  private provider: ethers.JsonRpcProvider | null = null;
  private marketContract: ethers.Contract | null = null;
  private isInitialized: boolean = false;
  private initializationPromise: Promise<void> | null = null;

  constructor() {
    this.initializationPromise = this.initialize();
  }

  private async initialize() {
    try {
      console.log(" Initializing XO Market Chatbot...");
      
      // Initialize Pinecone
      console.log(" Initializing vector store...");
      const pinecone = new Pinecone({
        apiKey: process.env.PINECONE_API_KEY!,
      });

      const index = pinecone.index(
        process.env.PINECONE_INDEX_NAME || "xo-market-docs"
      );

      // Initialize embeddings
      const embeddings = new OllamaEmbeddings({
        model: "nomic-embed-text",
        baseUrl: "http://localhost:11434",
      });

      // Initialize vector store
      this.vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
        pineconeIndex: index as any,
        namespace: "xo-market-docs",
      });
      console.log(" Vector store initialized");

      // Initialize LLM
      console.log(" Initializing LLM...");
      const useLocal = process.env.USE_LOCAL_OLLAMA === "true";
      const model = useLocal
        ? new ChatOllama({
            model: process.env.OLLAMA_MODEL || "llama3",
            temperature: 0.1,
          })
        : new ChatOpenAI({
            openAIApiKey: process.env.OPENAI_API_KEY,
            modelName: "gpt-4",
            temperature: 0.1,
          });

      // Initialize chain
      this.chain = ConversationalRetrievalQAChain.fromLLM(
        model,
        this.vectorStore.asRetriever({ k: 5 }),
        {
          returnSourceDocuments: true,
          verbose: false,
        }
      );
      console.log(" LLM chain initialized");

      // Initialize blockchain connection (non-blocking)
      await this.initializeBlockchain();
      
      this.isInitialized = true;
      console.log(" XO Market Chatbot initialized successfully");
      
    } catch (error) {
      console.error("Failed to initialize chatbot:", error);
      this.isInitialized = false;
      throw new Error(`Chatbot initialization failed: ${error}`);
    }
  }

  private async initializeBlockchain() {
    if (!process.env.XO_RPC_URL || !process.env.XO_MARKET_CONTRACT) {
      console.warn(" Blockchain configuration missing. On-chain data will not be available.");
      console.warn("Required: XO_RPC_URL and XO_MARKET_CONTRACT environment variables");
      return;
    }

    try {
      console.log("Initializing blockchain connection...");
      console.log("RPC URL:", process.env.XO_RPC_URL);
      console.log("Contract:", process.env.XO_MARKET_CONTRACT);

      // Add connection timeout
      const timeout = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Blockchain connection timeout')), 10000)
      );

      const connectPromise = (async () => {
        this.provider = new ethers.JsonRpcProvider(process.env.XO_RPC_URL);
        
        // Test connection with timeout
        const network = await this.provider.getNetwork();
        console.log(" Connected to network:", network.name || 'unknown', "Chain ID:", network.chainId.toString());

        // Initialize contract
        const abiToUse = XO_MARKET_ABI.abi || XO_MARKET_ABI;
        this.marketContract = new ethers.Contract(
          process.env.XO_MARKET_CONTRACT as any,
          abiToUse,
          this.provider
        );

        // Test contract connection
        const marketAddress = await this.marketContract.XO_MARKETS();
        console.log(" Contract connected. XO_MARKETS address:", marketAddress);
      })();

      await Promise.race([connectPromise, timeout]);
      
    } catch (error) {
      console.error("Failed to initialize blockchain connection:", error);
      console.error("Blockchain features will be disabled. Vector store responses will still work.");
      this.provider = null;
      this.marketContract = null;
      // Don't throw - allow chatbot to work without blockchain
    }
  }

  private async getLLMResponse(inputPrompt: string, query: string): Promise<string> {
    const useLocal = process.env.USE_LOCAL_OLLAMA === "true";

    const model = useLocal
      ? new ChatOllama({
          model: process.env.OLLAMA_MODEL || "llama3",
          temperature: 0.1,
        })
      : new ChatOpenAI({
          openAIApiKey: process.env.OPENAI_API_KEY,
          modelName: "gpt-4",
          temperature: 0.1,
        });

    const prompt = `${inputPrompt}\n\nQuery: "${query}"`;
    const response = await model.invoke(prompt);
    return response.content?.toString().trim() || "";
  }

  private async getMarketCount(): Promise<number> {
    if (!this.marketContract) {
      return 0;
    }

    try {
      // Try different methods to get market count
      if (this.marketContract.getMarketCount) {
        return await this.marketContract.getMarketCount();
      }
      
      // If no getMarketCount method, try to find the highest market ID
      // by attempting to fetch markets until we get an error
      let count = 0;
      for (let i = 1; i <= 100; i++) { // reasonable upper limit
        try {
          await this.marketContract.getMarket(i);
          count = i;
        } catch {
          break;
        }
      }
      return count;
    } catch (error) {
      console.warn("Could not determine market count, using default range");
      return 10; // Default fallback
    }
  }

  private async fetchMarketData(query: string): Promise<MarketData[]> {
    console.log(" Fetching market data from blockchain...");
    
    if (!this.marketContract || !this.provider) {
      console.log("No blockchain connection available");
      return [];
    }

    try {
      const markets: MarketData[] = [];
      
      // Get market count or use intelligent range based on query
      let startId = 1;
      console.log(await this.getMarketCount());
      let endId = 16;
      
      // Use LLM to determine if user wants specific markets
      try {
        const specificMarketResponse = await this.getLLMResponse(
          "If the user is asking for a specific market ID or number, return just that number. If they want all markets or recent markets, return 'ALL'. If they want a specific range, return 'START-END' format.",
          query
        );
        
        if (specificMarketResponse !== 'ALL' && specificMarketResponse.includes('-')) {
          const [start, end] = specificMarketResponse.split('-').map(n => parseInt(n.trim()));
          if (!isNaN(start) && !isNaN(end)) {
            startId = start;
            endId = end;
          }
        } else if (specificMarketResponse !== 'ALL' && !isNaN(parseInt(specificMarketResponse))) {
          startId = parseInt(specificMarketResponse);
          endId = startId;
        }
      } catch (error) {
        console.log("Using default market range");
      }

      console.log(` Fetching markets ${startId} to ${endId}`);

      for (let id = startId; id <= endId; id++) {
        try {
          console.log(`Fetching market ${id}...`);
          
          // Fetch basic market data
          const market = await this.marketContract.getMarket(id);
          console.log(` Market ${id} basic data:`, {
            id: market.id?.toString(),
            creator: market.creator,
            outcomeCount: market.outcomeCount?.toString()
          });
          
          // Fetch extended market data
          const extended = await this.marketContract.getExtendedMarket(id);
          console.log(` Market ${id} extended data:`, {
            status: extended.status?.toString(),
            resolution: extended.resolution?.toString()
          });
          
          // Check if resolved
          const resolved = await this.marketContract.isMarketResolved(id);
          
          // Get liquidity
          const liquidity = await this.marketContract.getMarketCollateral(id);
          
          // Get prices (with error handling)
          let prices: bigint[] = [];
          try {
            prices = await this.marketContract.getPrices(id);
          } catch (error) {
            console.warn(`Could not fetch prices for market ${id}`);
            // Create default prices based on outcome count
            const outcomeCount = Number(market.outcomeCount) || 2;
            prices = Array(outcomeCount).fill(ethers.parseEther("0.5")); // 50% each
          }
          
          // Get outcome token amounts
          let totalVolume = BigInt(0);
          try {
            for (let outcome = 0; outcome < Number(market.outcomeCount); outcome++) {
              const amount = await this.marketContract.getMarketOutcomeTokenAmount(id, outcome);
              totalVolume += amount;
            }
          } catch (error) {
            console.warn(`Could not fetch outcome amounts for market ${id}`);
          }

          // Get fees
          let protocolFee = 0;
          try {
            protocolFee = await this.marketContract.getProtocolFee();
          } catch (error) {
            console.warn(`Could not fetch protocol fee`);
          }

          // Process timestamps
          const expiry = Number(market.expiryTime);
          const createdAt = Number(market.creationTime);
          const isClosed = expiry * 1000 < Date.now();
          const status = resolved ? "Resolved" : isClosed ? "Closed" : "Active";

          // Convert prices to probabilities
          const outcomePrices = Array.isArray(prices)
            ? prices.map((p: bigint) => Number(ethers.formatEther(p)))
            : [];

          // Create outcome labels
          const outcomes = outcomePrices.map((price, idx) => 
            `Outcome ${idx}: ${(price * 100).toFixed(1)}%`
          );

          // Resolve metadata if it's a URI
          let question = market.metadataURI || `Market ${id}`;
          if (question.startsWith('http') || question.startsWith('ipfs://')) {
            question = `Market ${id} (${question.substring(0, 50)}...)`;
          }

          const marketData: MarketData = {
            id: Number(market.id || id),
            address: process.env.XO_MARKET_CONTRACT || "",
            question,
            outcomes,
            endTime: expiry,
            settled: resolved,
            winningOutcome: resolved ? extended.resolution?.toString() : undefined,
            liquidity: ethers.formatEther(liquidity),
            volume: ethers.formatEther(totalVolume),
            creator: market.creator,
            collateralToken: market.collateralToken,
            alpha: market.alpha?.toString() || "0",
            fee: Number(market.fee || 0),
            outcomeCount: Number(market.outcomeCount),
            metadataURI: market.metadataURI,
            resolverFee: Number(extended.resolverFee || 0),
            status,
            resolution: resolved ? extended.resolution?.toString() : undefined,
            outcomePrices,
            protocolFee: Number(protocolFee),
            lmsrNote: "Prices follow LS-LMSR curve: buying increases price of that outcome while decreasing others. Large orders have higher price impact.",
            resolutionNote: resolved 
              ? `Resolved to outcome ${extended.resolution?.toString()}`
              : isClosed 
                ? "Awaiting resolution by resolver"
                : "Open for trading",
            freshness: new Date().toISOString(),
          };

          markets.push(marketData);
          console.log(` Successfully processed market ${id}`);
          
        } catch (error) {
          console.warn(`Failed to fetch data for market ${id}:`, error);
          continue;
        }
      }

      console.log(` Successfully fetched ${markets.length} markets`);
      return markets.sort((a, b) => a.endTime - b.endTime);
      
    } catch (error) {
      console.error("Failed to fetch market data:", error);
      return [];
    }
  }

  private async needsLiveData(question: string): Promise<boolean> {
    console.log(" Analyzing if query needs live data...");
    
    try {
      const useLocal = process.env.USE_LOCAL_OLLAMA === "true";
      const model = useLocal
        ? new ChatOllama({
            model: process.env.OLLAMA_MODEL || "llama3",
            temperature: 0.1,
          })
        : new ChatOpenAI({
            openAIApiKey: process.env.OPENAI_API_KEY,
            modelName: "gpt-4",
            temperature: 0.1,
          });

      const prompt = `You are a classifier for a prediction market chatbot.
Determine if the following user query requires fetching live on-chain market data.

Examples that need live data:
- "What are the current market prices?"
- "Show me active markets"
- "What's the liquidity in market 5?"
- "Are there any resolved markets?"
- "What markets are available now?"

Examples that don't need live data:
- "How does XO Market work?"
- "What is LMSR?"
- "How do I create a market?"
- "What are the fees?"

Answer with only "YES" or "NO".

Query: "${question}"`;

      const response = await model.invoke(prompt);
      const answer = response.content?.toString().trim().toUpperCase();
      const needsData = answer === "YES";
      
      console.log(` Query needs live data: ${needsData}`);
      return needsData;
      
    } catch (error) {
      console.error("LLM classification failed, using fallback:", error);
      
      // Fallback to keyword matching
      const liveDataKeywords = [
        "current", "live", "now", "today", "active", "available",
        "markets", "price", "prices", "volume", "liquidity", "settled",
        "winning", "outcome", "market", "trading", "resolved", "status"
      ];

      const lowerQuestion = question.toLowerCase();
      return liveDataKeywords.some(keyword => lowerQuestion.includes(keyword));
    }
  }

  private formatSources(sourceDocuments: any[]): Array<{
    title: string;
    source: string;
    chunk: number;
    content: string;
  }> {
    return sourceDocuments.map((doc) => ({
      title: doc.metadata.title || "Unknown Document",
      source: doc.metadata.source || "Unknown Source",
      chunk: doc.metadata.chunk || 0,
      content: doc.pageContent.substring(0, 200) + "...",
    }));
  }

  private createEnhancedAnswer(answer: string, marketData: MarketData[]): string {
    if (marketData.length === 0) {
      return answer;
    }

    let enhancedAnswer = answer + "\n\n##  Live Market Data\n";
    
    marketData.forEach((market, index) => {
      enhancedAnswer += `\n### Market ${market.id}: ${market.question}\n`;
      enhancedAnswer += `**Status:** ${market.status} | **End Time:** ${new Date(market.endTime * 1000).toLocaleString()}\n`;
      enhancedAnswer += `**Liquidity:** ${parseFloat(market.liquidity).toFixed(4)} ETH | **Volume:** ${parseFloat(market.volume).toFixed(4)} ETH\n`;
      
      if (market.outcomePrices.length > 0) {
        enhancedAnswer += `**Current Prices:**\n`;
        market.outcomes.forEach(outcome => {
          enhancedAnswer += `  • ${outcome}\n`;
        });
      }
      
      if (market.settled && market.winningOutcome) {
        enhancedAnswer += `** Winning Outcome:** ${market.winningOutcome}\n`;
      }
      
      enhancedAnswer += `**${market.resolutionNote}**\n`;
      
      if (index < marketData.length - 1) {
        enhancedAnswer += "\n---\n";
      }
    });

    enhancedAnswer += `\n*Data fetched at: ${new Date().toLocaleString()}*`;
    return enhancedAnswer;
  }

  // Helper method to ensure initialization is complete
  private async ensureInitialized(): Promise<void> {
    if (this.initializationPromise) {
      console.log("⏳ Waiting for chatbot initialization to complete...");
      await this.initializationPromise;
      this.initializationPromise = null;
    }
    
    if (!this.isInitialized || !this.chain) {
      throw new Error("Chatbot failed to initialize properly. Check your environment variables and dependencies.");
    }
  }

  async ask(question: string, conversationHistory: string[] = []): Promise<ChatResponse> {
    const startTime = Date.now();

    try {
      // Ensure initialization is complete
      await this.ensureInitialized();

      console.log(` Processing question: "${question}"`);

      // Check if question needs live data
      const needsLive = await this.needsLiveData(question);
      let marketData: MarketData[] = [];

      if (needsLive) {
        console.log(" Fetching live market data...");
        marketData = await this.fetchMarketData(question);
        console.log(`Retrieved ${marketData.length} markets`);
      }

      // Create conversation context
      const conversationContext = conversationHistory.length > 0
        ? `Previous conversation:\n${conversationHistory.join("\n")}\n\nCurrent question: ${question}`
        : question;

      // Add market data to context if available
      let contextWithMarketData = conversationContext;
      if (marketData.length > 0) {
        contextWithMarketData += `\n\nCurrent Live Market Data:\n${JSON.stringify(marketData, null, 2)}`;
      }

      // Get response from chain
      console.log(" Generating response...");
      const response = await this.chain?.call({
        question: contextWithMarketData,
        chat_history: conversationHistory,
      });

      const answer = response?.text;
      const sourceDocuments = response?.sourceDocuments || [];

      // Format sources
      const sources = this.formatSources(sourceDocuments);

      // Create enhanced answer with live data
      const enhancedAnswer = this.createEnhancedAnswer(answer, marketData);

      const responseTime = Date.now() - startTime;
      console.log(` Response generated in ${responseTime}ms`);

      return {
        answer: enhancedAnswer,
        sources,
        marketData: marketData.length > 0 ? marketData : undefined,
        responseTime,
      };
      
    } catch (error) {
      console.error("Error in chatbot response:", error);

      const responseTime = Date.now() - startTime;
      return {
        answer: `I apologize, but I encountered an error while processing your question: ${error}. Please try again or contact support if the issue persists.`,
        sources: [],
        responseTime,
      };
    }
  }

  async getHealthStatus(): Promise<{
    vectorStore: boolean;
    chain: boolean;
    blockchain: boolean;
    initialized: boolean;
  }> {
    // Wait for initialization if still in progress
    try {
      await this.ensureInitialized();
    } catch {
      // If initialization failed, still return status
    }

    return {
      vectorStore: !!this.vectorStore,
      chain: !!this.chain,
      blockchain: !!(this.provider && this.marketContract),
      initialized: this.isInitialized,
    };
  }

  // Test blockchain connection
  async testBlockchainConnection(): Promise<{
    connected: boolean;
    networkInfo?: any;
    contractInfo?: any;
    error?: string;
  }> {
    try {
      // Wait for initialization if still in progress
      try {
        await this.ensureInitialized();
      } catch (error) {
        return {
          connected: false,
          error: `Initialization failed: ${error}`
        };
      }

      if (!this.provider || !this.marketContract) {
        return {
          connected: false,
          error: "Provider or contract not initialized"
        };
      }

      const network = await this.provider.getNetwork();
      const marketAddress = await this.marketContract.XO_MARKETS();
      
      return {
        connected: true,
        networkInfo: {
          name: network.name || 'unknown',
          chainId: network.chainId.toString()
        },
        contractInfo: {
          marketAddress,
          contractAddress: process.env.XO_MARKET_CONTRACT
        }
      };
    } catch (error) {
      return {
        connected: false,
        error: error as any
      };
    }
  }
}

// Export singleton instance
export const chatbot = new XOMarketChatbot();
export type { ChatResponse, MarketData };