import { Pinecone, RecordMetadata } from "@pinecone-database/pinecone";
import { OpenAIEmbeddings } from "@langchain/openai";
import { OllamaEmbeddings } from "@langchain/community/embeddings/ollama";
import { PineconeStore } from "@langchain/pinecone";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { Document } from "@langchain/core/documents";
import * as fs from "fs";
import * as path from "path";
import dotenv from "dotenv";

dotenv.config();

// XO Market documentation sources
const DOCS_SOURCES = {
  litepaper: {
    title: "XO Market Litepaper",
    content: `
# XO Market Litepaper

## Overview
XO Market is a decentralized prediction market platform built on blockchain technology. It enables users to create, trade, and settle prediction markets on any real-world event.

## Key Features

### 1. Decentralized Prediction Markets
XO Market allows anyone to create prediction markets on any topic. Users can bet on outcomes of real-world events, from sports and politics to cryptocurrency prices and weather.

### 2. Automated Market Making
The platform uses automated market making (AMM) algorithms to provide liquidity and ensure fair pricing. This eliminates the need for traditional market makers and reduces trading fees.

### 3. Binary and Multi-Outcome Markets
XO Market supports both binary (yes/no) and multi-outcome markets. Binary markets have two possible outcomes, while multi-outcome markets can have multiple possible results.

### 4. Real-Time Settlement
Markets are settled automatically based on predetermined conditions and oracle data. This ensures transparency and eliminates the need for manual intervention.

### 5. NFT Integration
Market creators receive unique NFTs representing their market. These NFTs can be traded, sold, or used for governance purposes.

## Technical Architecture

### Smart Contracts
XO Market is built on Ethereum-compatible blockchains using smart contracts for:
- Market creation and management
- Trading and liquidity provision
- Settlement and dispute resolution
- NFT minting and management

### Oracle Integration
The platform integrates with multiple oracle providers to ensure accurate and reliable data for market settlement. This includes:
- Chainlink oracles for price feeds
- Custom oracle solutions for specific data types
- Community-driven oracle networks

### Gas Optimization
XO Market implements various gas optimization techniques to reduce transaction costs:
- Batch processing for multiple operations
- Efficient data structures and algorithms
- Layer 2 scaling solutions

## Tokenomics

### XO Token
The XO token is the native utility token of the XO Market platform. It serves multiple purposes:
- Governance: Token holders can vote on platform proposals
- Staking: Users can stake tokens to earn rewards
- Fee discounts: Token holders receive reduced trading fees
- Liquidity mining: Rewards for providing liquidity to markets

### Fee Structure
- Market creation fee: 0.1% of total market volume
- Trading fee: 0.3% per trade
- Settlement fee: 0.05% of market volume
- NFT minting fee: 0.01 ETH

## Market Types

### Binary Markets
Binary markets have two possible outcomes (e.g., "Will Bitcoin reach $100,000 by end of year?"). Users can bet on either outcome, and the market settles to 100% for the correct outcome and 0% for the incorrect outcome.

### Multi-Outcome Markets
Multi-outcome markets have more than two possible results (e.g., "Who will win the 2024 US Presidential Election?"). Each outcome has its own probability, and users can bet on any combination of outcomes.

### Conditional Markets
Conditional markets depend on specific conditions being met (e.g., "If Bitcoin reaches $100,000, will Ethereum reach $10,000?"). These markets only activate if the condition is satisfied.

## Risk Management

### Liquidity Pools
Each market has its own liquidity pool that ensures there's always someone to trade against. The AMM algorithm automatically adjusts prices based on supply and demand.

### Collateral Requirements
Market creators must provide collateral to ensure they have skin in the game. This collateral is used to cover potential losses and incentivize accurate market creation.

### Dispute Resolution
In case of disputes over market settlement, a decentralized dispute resolution system allows community members to vote on the correct outcome.

## Security Features

### Multi-Signature Wallets
Platform funds are held in multi-signature wallets requiring multiple approvals for large transactions.

### Time-Locks
Critical functions have time-locks to prevent sudden changes that could harm users.

### Audits
All smart contracts undergo rigorous security audits by reputable firms before deployment.

## Roadmap

### Phase 1: Core Platform (Q1 2024)
- Basic market creation and trading
- Binary and multi-outcome markets
- Automated market making
- Basic oracle integration

### Phase 2: Advanced Features (Q2 2024)
- Conditional markets
- Advanced oracle networks
- Mobile application
- API for third-party integrations

### Phase 3: Ecosystem Expansion (Q3 2024)
- Cross-chain compatibility
- Advanced analytics and tools
- Institutional features
- Governance implementation

### Phase 4: Scale and Optimize (Q4 2024)
- Layer 2 scaling solutions
- Advanced risk management
- Global expansion
- Enterprise partnerships

## Conclusion
XO Market represents the future of decentralized prediction markets, combining the power of blockchain technology with innovative market making algorithms. By providing a secure, transparent, and efficient platform for prediction markets, XO Market aims to democratize access to financial instruments and create new opportunities for users worldwide.
    `,
    source: "litepaper.md",
  },
  docs: {
    title: "XO Market Documentation",
    content: `
# XO Market Documentation

## Getting Started

### What is XO Market?
XO Market is a decentralized prediction market platform where users can create and trade on the outcomes of real-world events.

### How to Create a Market
1. Connect your wallet to the platform
2. Click "Create Market" 
3. Define the market question and possible outcomes
4. Set the end date and settlement conditions
5. Provide initial liquidity
6. Pay the creation fee

### How to Trade
1. Browse available markets
2. Select a market you want to trade on
3. Choose your position (buy/sell)
4. Enter the amount you want to trade
5. Confirm the transaction

### How Markets Settle
Markets settle automatically based on:
- Oracle data feeds
- Community consensus
- Predetermined conditions
- External data sources

## Market Types

### Binary Markets
Markets with exactly two outcomes (e.g., Yes/No questions).

### Multi-Outcome Markets  
Markets with more than two possible outcomes.

### Conditional Markets
Markets that only activate if certain conditions are met.

## Fees and Economics

### Trading Fees
- 0.3% fee on all trades
- Reduced fees for XO token holders
- Volume-based fee discounts

### Liquidity Provision
- Earn fees by providing liquidity
- Impermanent loss protection
- Automated rebalancing

### Staking Rewards
- Stake XO tokens to earn rewards
- Participate in governance
- Access premium features

## Technical Details

### Smart Contracts
- MarketFactory: Creates new markets
- Market: Individual market contracts
- Oracle: Data feed integration
- Treasury: Fee collection and distribution

### Gas Optimization
- Batch operations
- Efficient data structures
- Layer 2 scaling

### Security
- Multi-sig wallets
- Time-locks
- Regular audits
- Bug bounty program

## API Reference

### Market Creation
\`\`\`javascript
const market = await createMarket({
  question: "Will Bitcoin reach $100k?",
  outcomes: ["Yes", "No"],
  endDate: "2024-12-31",
  oracle: "chainlink-btc-price"
});
\`\`\`

### Trading
\`\`\`javascript
const trade = await tradeMarket({
  marketId: "0x123...",
  outcome: "Yes",
  amount: "1000",
  side: "buy"
});
\`\`\`

### Market Data
\`\`\`javascript
const marketData = await getMarketData("0x123...");
console.log(marketData.outcomes, marketData.liquidity);
\`\`\`

## Troubleshooting

### Common Issues
1. **Transaction fails**: Check gas limits and wallet balance
2. **Market not settling**: Verify oracle data and conditions
3. **High fees**: Consider using Layer 2 or staking XO tokens

### Support
- Discord: discord.gg/xomarket
- Email: support@xo.market
- Documentation: docs.xo.market
    `,
    source: "docs.md",
  },
  faq: {
    title: "XO Market FAQ",
    content: `
# XO Market FAQ

## General Questions

### What is XO Market?
XO Market is a decentralized prediction market platform built on blockchain technology. Users can create and trade on the outcomes of real-world events.

### How does XO Market work?
1. Users create markets by defining questions and possible outcomes
2. Traders buy and sell positions on these outcomes
3. Markets settle automatically based on real-world data
4. Winners receive payouts based on their positions

### Is XO Market decentralized?
Yes, XO Market is fully decentralized. All market operations are executed through smart contracts on the blockchain, with no central authority controlling the platform.

### What blockchain does XO Market use?
XO Market is built on Ethereum and compatible Layer 2 networks. The platform supports multiple chains for better scalability and lower fees.

## Market Creation

### Who can create markets?
Anyone can create markets on XO Market. There are no restrictions on who can create markets, but market creators must provide collateral.

### How much does it cost to create a market?
Market creation costs vary based on the market type and complexity. Basic binary markets cost around 0.01 ETH, while complex multi-outcome markets may cost more.

### What types of markets can I create?
You can create:
- Binary markets (Yes/No questions)
- Multi-outcome markets (Multiple possible results)
- Conditional markets (Dependent on other events)

### How do I ensure my market will settle correctly?
Use reliable oracle data sources and clearly define settlement conditions. The platform supports multiple oracle providers including Chainlink and custom solutions.

## Trading

### How do I start trading?
1. Connect your wallet to the platform
2. Browse available markets
3. Select a market and choose your position
4. Enter the amount you want to trade
5. Confirm the transaction

### What are the trading fees?
Trading fees are 0.3% per trade. XO token holders receive reduced fees, and high-volume traders can earn additional discounts.

### Can I trade on mobile?
Yes, XO Market has a mobile-optimized interface. You can access the platform through any web browser on your mobile device.

### How do I know if I'm getting a good price?
The platform uses automated market making (AMM) algorithms that ensure fair pricing based on supply and demand. You can view the current odds and liquidity for each outcome.

## Liquidity and Staking

### How can I provide liquidity?
You can provide liquidity to any market by depositing funds into the liquidity pool. Liquidity providers earn a portion of the trading fees.

### What is impermanent loss?
Impermanent loss occurs when the price of assets in a liquidity pool changes. XO Market implements protection mechanisms to minimize this risk.

### How do I stake XO tokens?
Connect your wallet and navigate to the staking section. Choose the amount of XO tokens you want to stake and confirm the transaction.

### What are the staking rewards?
Staking rewards vary based on platform performance and total staked amount. Rewards are distributed in XO tokens and additional benefits.

## Technical Questions

### What wallets are supported?
XO Market supports all major Ethereum wallets including MetaMask, WalletConnect, Coinbase Wallet, and hardware wallets.

### How do I connect my wallet?
Click the "Connect Wallet" button and select your preferred wallet. Follow the prompts to authorize the connection.

### What if my transaction fails?
Check your gas settings and wallet balance. You can adjust gas limits in your wallet settings. If problems persist, contact support.

### How do I view my transaction history?
Your transaction history is available in your wallet and on the blockchain explorer. The platform also provides a transaction history page.

## Security

### Is XO Market secure?
Yes, XO Market implements multiple security measures including:
- Smart contract audits
- Multi-signature wallets
- Time-locks on critical functions
- Bug bounty programs

### What happens if there's a bug?
XO Market has a comprehensive bug bounty program and insurance mechanisms. In case of critical issues, the community can vote on emergency measures.

### How do I report a security issue?
Report security issues to security@xo.market or through the bug bounty program. All reports are taken seriously and investigated promptly.

## Support

### Where can I get help?
- Discord: discord.gg/xomarket
- Email: support@xo.market
- Documentation: docs.xo.market
- Community forum: forum.xo.market

### How do I report a bug?
Use the bug report form on the platform or contact support directly. Include detailed information about the issue and steps to reproduce.

### Can I suggest new features?
Yes, feature suggestions are welcome! Submit your ideas through the community forum or Discord channel.
    `,
    source: "faq.md",
  },
  discord: {
    title: "Selected Discord Threads",
    content: `
# Selected Discord Threads - XO Market

## Thread 1: Market Creation Best Practices

**User**: "What's the best way to create a market that will attract traders?"

**XO Team**: "Great question! Here are some key tips for creating successful markets:

1. **Clear and Specific Questions**: Avoid ambiguous language. Instead of 'Will crypto go up?' use 'Will Bitcoin reach $100,000 by December 31, 2024?'

2. **Reliable Data Sources**: Choose markets that can be settled with reliable oracle data. Markets based on official statistics, sports results, or major news events work well.

3. **Appropriate Timeframes**: Markets should be long enough for meaningful trading but not so long that interest wanes. 1-6 months is often optimal.

4. **Reasonable Liquidity**: Start with sufficient liquidity to attract traders. We recommend at least 1 ETH equivalent for popular markets.

5. **Community Interest**: Create markets on topics that the community cares about. Check our trending topics channel for ideas.

Remember, successful markets often become templates for future markets!"

**User**: "What about market resolution? How do I ensure my market settles correctly?"

**XO Team**: "Excellent follow-up! Market resolution is crucial:

- **Use Multiple Oracles**: For important markets, we recommend using multiple oracle sources to ensure accuracy.

- **Clear Settlement Criteria**: Define exactly what constitutes a 'Yes' or 'No' answer. Include specific thresholds and data sources.

- **Community Oversight**: For complex markets, consider adding a community review period before final settlement.

- **Dispute Resolution**: Have a clear process for handling edge cases. Our dispute resolution system allows community voting on unclear outcomes.

Pro tip: Test your settlement criteria with friends before creating the market!"

## Thread 2: Trading Strategies

**User**: "What are some effective trading strategies on XO Market?"

**Community Member**: "Here are some strategies I've found successful:

1. **Arbitrage**: Look for price differences between markets on the same event across different platforms.

2. **Information Edge**: If you have access to information before others, you can profit from the price movement when it becomes public.

3. **Liquidity Provision**: Provide liquidity to earn fees. Focus on markets with high trading volume.

4. **Portfolio Diversification**: Don't put all your funds in one market. Spread risk across multiple markets and outcomes.

5. **Timing**: Markets often have predictable patterns. Prices tend to move toward 50/50 as settlement approaches, unless there's new information."

**XO Team**: "Great strategies! A few additional tips:

- **Risk Management**: Never invest more than you can afford to lose. Prediction markets are inherently risky.

- **Research**: Do your homework before trading. Understand the underlying event and potential outcomes.

- **Community Engagement**: Join our trading channels to discuss strategies and get insights from other traders.

- **Tools**: Use our analytics dashboard to track your performance and identify profitable patterns."

## Thread 3: Technical Issues

**User**: "My transaction keeps failing. What should I do?"

**XO Support**: "Let's troubleshoot this step by step:

1. **Check Gas Settings**: Increase your gas limit. Complex transactions need more gas than simple transfers.

2. **Wallet Balance**: Ensure you have enough ETH for gas fees plus the transaction amount.

3. **Network Congestion**: During high traffic periods, transactions may fail. Try again during off-peak hours.

4. **Wallet Connection**: Disconnect and reconnect your wallet. Sometimes the connection gets stale.

5. **Browser Issues**: Try clearing your browser cache or using a different browser.

If the problem persists, please share:
- Your wallet type
- Error message
- Transaction hash
- Steps you took

We'll help you resolve it!"

**User**: "How do I know if my market is properly funded?"

**XO Support**: "You can check your market's funding status in several ways:

1. **Market Dashboard**: Each market has a dashboard showing total liquidity, trading volume, and funding status.

2. **Smart Contract**: You can directly query the smart contract to see the exact funding amounts.

3. **Explorer**: Use our blockchain explorer to view the market contract and its balance.

4. **API**: Developers can use our API to programmatically check funding status.

If your market shows insufficient funding, you can add more liquidity at any time before trading begins."

## Thread 4: Platform Updates

**XO Team**: "🚀 Major Update: Conditional Markets Now Live!

We're excited to announce that conditional markets are now available on XO Market! Here's what's new:

**Conditional Markets**: Create markets that only activate if certain conditions are met. For example: 'If Bitcoin reaches $100k, will Ethereum reach $10k?'

**Enhanced Oracle Integration**: We've added support for more oracle providers, including custom oracle solutions.

**Improved UI**: The interface has been redesigned for better user experience and mobile compatibility.

**Gas Optimization**: Transactions now use 30% less gas on average.

**New Analytics**: Advanced charts and trading analytics to help you make better decisions.

Try out the new features and let us know what you think! 🎉"

**Community Response**: "This is amazing! The conditional markets feature is exactly what I was looking for. Great work team!"

## Thread 5: Community Governance

**XO Team**: "🗳️ Governance Proposal: Fee Structure Update

We're proposing to update our fee structure to better align with user needs:

**Current Fees**:
- Trading: 0.3%
- Market Creation: 0.1%
- Settlement: 0.05%

**Proposed Changes**:
- Trading: 0.25% (reduced)
- Market Creation: 0.08% (reduced)
- Settlement: 0.03% (reduced)
- New: Liquidity Mining Rewards

**Benefits**:
- Lower costs for active traders
- Better incentives for liquidity providers
- More competitive pricing
- Sustainable tokenomics

Vote now in our governance portal! Voting ends in 7 days."

**Community Discussion**: "I support this proposal. The reduced fees will make the platform more competitive and the liquidity mining rewards will encourage more participation."

## Thread 6: Security and Audits

**XO Team**: "🔒 Security Update: Smart Contract Audit Complete

We're pleased to announce that our latest smart contracts have completed a comprehensive security audit by [Audit Firm Name]. 

**Key Findings**:
- ✅ No critical vulnerabilities found
- ✅ All major functions properly secured
- ✅ Gas optimization implemented
- ✅ Emergency pause functionality tested

**Audit Report**: Available in our documentation

**Next Steps**:
- Contracts will be deployed to mainnet in 2 weeks
- Community testing period begins tomorrow
- Bug bounty program active with increased rewards

Security is our top priority. Thank you to our community for your patience and support! 🛡️"

**Community Response**: "Great to see the commitment to security. The audit report looks thorough. Ready for mainnet deployment!"
    `,
    source: "discord-threads.md",
  },
};

// const urls = [
//   "https://docs.xo.market",
//   "https://faq.xo.market",
//   "https://discord.gg/xomarket",
//   "https://forum.xo.market",
// ];

async function ingestDocuments() {
  console.log("🚀 Starting XO Market documentation ingestion...");

  // Initialize Pinecone
  const pinecone = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY!,
  });

  const indexName = process.env.PINECONE_INDEX_NAME || "xo-market-docs";

  // Check if index exists, create if not
  // const indexes = await pinecone.listIndexes();
  // console.log(indexes);
  // if (!indexes.some((index) => index.name === indexName)) {
  //   console.log(`Creating Pinecone index: ${indexName}`);
  //   await pinecone.createIndex({
  //     name: indexName,
  //     dimension: 1024, // Using 1024 dimensions for llama-text-embed-v2
  //     metric: "cosine",
  //   });

  //   // Wait for index to be ready
  //   console.log("Waiting for index to be ready...");
  //   await new Promise((resolve) => setTimeout(resolve, 60000));
  // }

  const indexes = await pinecone.listIndexes();
  console.log(indexes);

  // const index = pinecone.index(indexName);
  const index = pinecone.Index<RecordMetadata>("botmarkets");
  console.log(index);

  // Initialize embeddings - Choose between OpenAI and local Ollama
  // Comment/uncomment the appropriate section to switch between them

  // Option 1: OpenAI Embeddings (default)
  // const embeddings = new OpenAIEmbeddings({
  //   openAIApiKey: process.env.OPENAI_API_KEY,
  //   modelName: "text-embedding-ada-002", // This will be converted to 1024 dimensions
  // });

  // Option 2: Local Ollama with nomic-embed-text (uncomment to use)
  const embeddings = new OllamaEmbeddings({
    model: "nomic-embed-text",
    baseUrl: "http://localhost:11434", // Default Ollama URL
  });

  const embedding = await embeddings.embedQuery("test");
  console.log("Embedding length:", embedding.length);

  const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
  });

  console.log("📚 Processing documentation sources...");

  const documents: Document[] = [];

  for (const [key, source] of Object.entries(DOCS_SOURCES)) {
    console.log(`Processing ${source.title}...`);

    const chunks = await textSplitter.splitText(source.content);

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      documents.push(
        new Document({
          pageContent: chunk,
          metadata: {
            source: source.source,
            title: source.title,
            chunk: i + 1,
            totalChunks: chunks.length,
            type: key,
          },
        })
      );
    }
  }

  console.log(`📝 Created ${documents.length} document chunks`);

  console.log("💾 Storing documents in Pinecone...");
  const vectorStore = await PineconeStore.fromDocuments(documents, embeddings, {
    pineconeIndex: index as any,
    namespace: "xo-market-docs",
  });

  console.log("✅ Document ingestion complete!");
  console.log(`📊 Summary:`);
  console.log(
    `   - Total documents processed: ${Object.keys(DOCS_SOURCES).length}`
  );
  console.log(`   - Total chunks created: ${documents.length}`);
  console.log(`   - Index name: ${indexName}`);
  console.log(`   - Namespace: xo-market-docs`);

  return vectorStore;
}

async function testOllamaConnection() {
  console.log("🔍 Testing Ollama connection...");

  try {
    const ollamaEmbeddings = new OllamaEmbeddings({
      model: "nomic-embed-text",
      baseUrl: "http://localhost:11434",
    });

    const testText = "Hello, this is a test of the nomic-embed-text model.";
    const embeddings = await ollamaEmbeddings.embedQuery(testText);

    console.log("✅ Ollama connection successful!");
    console.log(`📏 Embedding dimensions: ${embeddings.length}`);
    console.log(
      `🔢 Sample embedding values: [${embeddings.slice(0, 5).join(", ")}...]`
    );

    return true;
  } catch (error) {
    console.error("❌ Ollama connection failed:", error);
    console.log(
      "💡 Make sure Ollama is running and nomic-embed-text model is installed:"
    );
    console.log("   ollama run nomic-embed-text");
    return false;
  }
}

if (require.main === module) {
  // Uncomment the next line to test Ollama connection first
  // testOllamaConnection().then(() => process.exit(0));

  ingestDocuments()
    .then(() => {
      console.log("🎉 Ingestion completed successfully!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Ingestion failed:", error);
      process.exit(1);
    });
}

export { ingestDocuments, testOllamaConnection };
