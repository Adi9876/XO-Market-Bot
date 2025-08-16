import { Pinecone } from "@pinecone-database/pinecone";
import { OpenAIEmbeddings } from "@langchain/openai";
import { PineconeStore } from "@langchain/pinecone";
import { ChatOpenAI } from "@langchain/openai";
import { ConversationalRetrievalQAChain } from "langchain/chains";
import { ChatOllama } from "@langchain/community/chat_models/ollama";
import { ethers } from "ethers";
import dotenv from "dotenv";
import { OllamaEmbeddings } from "@langchain/community/embeddings/ollama";

dotenv.config();

// XO Market Contract ABI (simplified for basic market data)
const XO_MARKET_ABI = [
  "function getMarkets() external view returns (address[] memory)",
  "function getMarketData(address market) external view returns (string question, string[] outcomes, uint256 endTime, bool settled, string winningOutcome)",
  "function getMarketLiquidity(address market) external view returns (uint256)",
  "function getMarketVolume(address market) external view returns (uint256)",
];

interface MarketData {
  address: string;
  question: string;
  outcomes: string[];
  endTime: number;
  settled: boolean;
  winningOutcome?: string;
  liquidity: string;
  volume: string;
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

  constructor() {
    this.initialize();
  }

  private async initialize() {
    try {
      // Initialize Pinecone
      const pinecone = new Pinecone({
        apiKey: process.env.PINECONE_API_KEY!,
      });

      const index = pinecone.index(
        process.env.PINECONE_INDEX_NAME || "xo-market-docs"
      );

      // Initialize embeddings - using OpenAI embeddings but will be converted to 1024 dimensions
      // const embeddings = new OpenAIEmbeddings({
      //   openAIApiKey: process.env.OPENAI_API_KEY,
      //   modelName: "text-embedding-ada-002", // This will be converted to 1024 dimensions
      // });
      const embeddings = new OllamaEmbeddings({
        model: "nomic-embed-text",
        baseUrl: "http://localhost:11434", // Default Ollama URL
      });

      // Initialize vector store
      this.vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
        pineconeIndex: index as any,
        namespace: "xo-market-docs",
      });

      // Initialize LLM
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

      // Initialize blockchain connection
      if (process.env.XO_RPC_URL && process.env.XO_MARKET_CONTRACT) {
        this.provider = new ethers.JsonRpcProvider(process.env.XO_RPC_URL);
        this.marketContract = new ethers.Contract(
          process.env.XO_MARKET_CONTRACT,
          XO_MARKET_ABI,
          this.provider
        );
      }

      console.log("✅ XO Market Chatbot initialized successfully");
    } catch (error) {
      console.error("❌ Failed to initialize chatbot:", error);
    }
  }

  private async fetchMarketData(): Promise<MarketData[]> {
    if (!this.marketContract || !this.provider) {
      return [];
    }

    try {
      const marketAddresses = await this.marketContract.getMarkets();
      const markets: MarketData[] = [];

      for (const address of marketAddresses) {
        try {
          const [question, outcomes, endTime, settled, winningOutcome] =
            await this.marketContract.getMarketData(address);

          const liquidity = await this.marketContract.getMarketLiquidity(
            address
          );
          const volume = await this.marketContract.getMarketVolume(address);

          markets.push({
            address,
            question,
            outcomes,
            endTime: Number(endTime),
            settled,
            winningOutcome: settled ? winningOutcome : undefined,
            liquidity: ethers.formatEther(liquidity),
            volume: ethers.formatEther(volume),
          });
        } catch (error) {
          console.warn(`Failed to fetch data for market ${address}:`, error);
        }
      }

      return markets;
    } catch (error) {
      console.error("Failed to fetch market data:", error);
      return [];
    }
  }

  private needsLiveData(question: string): boolean {
    const liveDataKeywords = [
      "current",
      "live",
      "now",
      "today",
      "active",
      "available",
      "markets",
      "price",
      "volume",
      "liquidity",
      "settled",
      "winning",
      "outcome",
      "testnet",
      "contract",
      "blockchain",
      "on-chain",
    ];

    const lowerQuestion = question.toLowerCase();
    return liveDataKeywords.some((keyword) => lowerQuestion.includes(keyword));
  }

  private formatSources(sourceDocuments: any[]): Array<{
    title: string;
    source: string;
    chunk: number;
    content: string;
  }> {
    return sourceDocuments.map((doc) => ({
      title: doc.metadata.title,
      source: doc.metadata.source,
      chunk: doc.metadata.chunk,
      content: doc.pageContent.substring(0, 200) + "...",
    }));
  }

  private createSystemPrompt(): string {
    return `You are the XO Market Expert, a specialized AI assistant for the XO Market decentralized prediction market platform. 

Your role is to help users understand XO Market's features, functionality, and current state. Always provide accurate, helpful information based on the official documentation and community resources.

Key guidelines:
1. Be clear and concise in your explanations
2. Always cite your sources when providing information
3. If asked about current market data, mention that you can provide live on-chain information
4. Use a friendly, professional tone
5. If you're unsure about something, say so rather than guessing
6. Focus on XO Market-specific information rather than general blockchain concepts

When citing sources, format them as: [Source: Document Title - Section]

Remember: XO Market is a decentralized prediction market platform where users can create and trade on real-world events.`;
  }

  async ask(
    question: string,
    conversationHistory: string[] = []
  ): Promise<ChatResponse> {
    const startTime = Date.now();

    try {
      if (!this.chain) {
        throw new Error("Chatbot not initialized");
      }

      // Check if question needs live data
      const needsLive = this.needsLiveData(question);
      let marketData: MarketData[] = [];

      if (needsLive) {
        console.log("🔗 Fetching live market data...");
        marketData = await this.fetchMarketData();
      }

      // Create conversation context
      const conversationContext =
        conversationHistory.length > 0
          ? `Previous conversation:\n${conversationHistory.join(
              "\n"
            )}\n\nCurrent question: ${question}`
          : question;

      // Get response from chain
      const response = await this.chain.call({
        question: conversationContext,
        chat_history: conversationHistory,
      });

      const answer = response.text;
      const sourceDocuments = response.sourceDocuments || [];

      // Format sources
      const sources = this.formatSources(sourceDocuments);

      // Add live data to response if available
      let enhancedAnswer = answer;
      if (marketData.length > 0) {
        enhancedAnswer += "\n\n**Live Market Data:**\n";
        marketData.forEach((market, index) => {
          enhancedAnswer += `\n**Market ${index + 1}:** ${market.question}\n`;
          enhancedAnswer += `- Outcomes: ${market.outcomes.join(", ")}\n`;
          enhancedAnswer += `- End Time: ${new Date(
            market.endTime * 1000
          ).toLocaleString()}\n`;
          enhancedAnswer += `- Status: ${
            market.settled ? "Settled" : "Active"
          }\n`;
          if (market.settled && market.winningOutcome) {
            enhancedAnswer += `- Winning Outcome: ${market.winningOutcome}\n`;
          }
          enhancedAnswer += `- Liquidity: ${market.liquidity} ETH\n`;
          enhancedAnswer += `- Volume: ${market.volume} ETH\n`;
        });
      }

      const responseTime = Date.now() - startTime;

      return {
        answer: enhancedAnswer,
        sources,
        marketData: marketData.length > 0 ? marketData : undefined,
        responseTime,
      };
    } catch (error) {
      console.error("Error in chatbot response:", error);

      return {
        answer:
          "I apologize, but I encountered an error while processing your question. Please try again or contact support if the issue persists.",
        sources: [],
        responseTime: Date.now() - startTime,
      };
    }
  }

  async getHealthStatus(): Promise<{
    vectorStore: boolean;
    chain: boolean;
    blockchain: boolean;
  }> {
    return {
      vectorStore: !!this.vectorStore,
      chain: !!this.chain,
      blockchain: !!(this.provider && this.marketContract),
    };
  }
}

// Export singleton instance
export const chatbot = new XOMarketChatbot();
export type { ChatResponse, MarketData };
