# XO Market Expert 🤖

A specialized AI chatbot for XO Market that answers product/market/docs questions with citations and optional live on-chain lookups.

## Features

- **📚 Knowledge Base**: Comprehensive documentation from litepaper, docs, FAQs, and Discord threads
- **🔗 Live Data**: Real-time blockchain data from XO Market testnet
- **📖 Citations**: Always cites sources for transparency
- **💬 Multiple Interfaces**: Web UI and Discord bot
- **⚡ Fast Responses**: Optimized for quick, accurate answers
- **🎯 Specialized**: Focused specifically on XO Market ecosystem

## Quick Start

### Prerequisites

- Node.js 18+ 
- OpenAI API key
- Pinecone API key (optional, for vector storage)
- Discord bot token (optional, for Discord integration)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd xo-market-expert
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` with your API keys:
   ```env
   OPENAI_API_KEY=your_openai_api_key
   PINECONE_API_KEY=your_pinecone_api_key
   PINECONE_ENVIRONMENT=aped-4627-b74a
   PINECONE_INDEX_NAME=botmarket
   DISCORD_BOT_TOKEN=your_discord_bot_token
   ```

4. **Ingest documentation**
   ```bash
   npm run ingest
   ```

   **Optional: Use Local Ollama for Embeddings**
   
   You can use local Ollama with nomic-embed-text instead of OpenAI for embeddings:
   
   ```bash
   # Install Ollama (https://ollama.ai/)
   # Start Ollama
   ollama serve
   
   # Pull the embedding model
   ollama pull nomic-embed-text
   
   # Test Ollama connection
   npm run test-ollama
   
   # To switch to Ollama embeddings:
   npm run switch-ollama
   npm run ingest
   
   # To switch back to OpenAI embeddings:
   npm run switch-openai
   npm run ingest
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Visit the web interface**
   ```
   http://localhost:3000
   ```

## Usage

### Web Interface

The web interface provides a clean, modern chat experience:

- Ask questions about XO Market
- View live market data
- See source citations
- Track response times

### Discord Bot

Use the Discord bot with the `!xo` prefix:

```
!xo What is XO Market?
!xo How do I create a market?
!xo What are the current active markets?
```

### API Endpoints

- `POST /api/chat` - Send questions to the chatbot
- `GET /api/chat` - Health check
- `GET /api/markets` - Get live market data

## Architecture

### Core Components

1. **Documentation Ingestion** (`ingest.ts`)
   - Processes XO Market documentation
   - Splits into searchable chunks
   - Stores in Pinecone vector database
   - Supports both OpenAI and local Ollama embeddings

2. **Chatbot Engine** (`lib/chatbot.ts`)
   - Handles question processing
   - Retrieves relevant documentation
   - Fetches live blockchain data
   - Generates responses with citations

3. **Web Interface** (`app/page.tsx`)
   - React-based chat UI
   - Real-time conversation
   - Source display

4. **Discord Bot** (`discord-bot.ts`)
   - Discord.js integration
   - Conversation management
   - Message formatting

5. **Evaluation System** (`eval/test-questions.ts`)
   - 20 test questions
   - Performance metrics
   - Citation accuracy measurement

### Data Sources

- **Litepaper**: Comprehensive platform overview
- **Documentation**: User guides and technical details
- **FAQ**: Common questions and answers
- **Discord Threads**: Community insights and best practices

### Live Data Integration

- **RPC**: `https://testnet-rpc-1.xo.market/`
- **Explorer**: `http://explorer-testnet.xo.market/`
- **Contract**: `0x3cf19D0C88a14477DCaA0A45f4AF149a4C917523`
- **NFT**: `0x550318A123d222e841776a281F51B09e8909E144`

## Evaluation

Run the evaluation system to test performance:

```bash
npm run eval
```

This will:
- Test 20 predefined questions
- Measure response times
- Check citation accuracy
- Generate detailed report in `eval/results.md`

### Test Categories

- **Basic Platform**: What is XO Market, how it works
- **Market Creation**: Creating markets, types, costs
- **Trading**: How to trade, fees, strategies
- **Technical**: Wallets, transactions, settlement
- **Security**: Security measures, audits
- **Live Data**: Current markets, blockchain data
- **Advanced**: AMM, best practices, dispute resolution

## Development

### Project Structure

```
xo-market-expert/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   └── page.tsx           # Main web interface
├── lib/                   # Core library
│   └── chatbot.ts         # Main chatbot engine
├── eval/                  # Evaluation system
│   └── test-questions.ts  # Test questions and metrics
├── ingest.ts              # Documentation ingestion
├── discord-bot.ts         # Discord bot
└── package.json           # Dependencies and scripts
```

### Key Technologies

- **Next.js 14**: React framework with app router
- **OpenAI GPT-4**: Language model for responses
- **OpenAI text-embedding-ada-002**: Default embeddings for document search
- **Ollama + nomic-embed-text**: Local embedding alternative
- **Pinecone**: Vector database for document storage
- **LangChain**: LLM orchestration framework
- **Ethers.js**: Blockchain interaction
- **Discord.js**: Discord bot framework
- **TypeScript**: Type safety and development experience

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `OPENAI_API_KEY` | OpenAI API key for GPT-4 | Yes |
| `PINECONE_API_KEY` | Pinecone API key | Yes |
| `PINECONE_ENVIRONMENT` | Pinecone environment | Yes |
| `PINECONE_INDEX_NAME` | Pinecone index name | No (default: botmarket) |
| `DISCORD_BOT_TOKEN` | Discord bot token | No |
| `XO_RPC_URL` | XO Market RPC endpoint | No |
| `XO_MARKET_CONTRACT` | XO Market contract address | No |

## Deployment

### Vercel (Recommended)

1. Connect your repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push

### Docker

```bash
# Build image
docker build -t xo-market-expert .

# Run container
docker run -p 3000:3000 --env-file .env xo-market-expert
```

### Manual Deployment

1. Build the application:
   ```bash
   npm run build
   ```

2. Start the production server:
   ```bash
   npm start
   ```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

- **Documentation**: Check the code comments and README
- **Issues**: Open an issue on GitHub
- **Discord**: Join the XO Market Discord for community support

## Roadmap

- [ ] Add more documentation sources
- [ ] Implement conversation memory
- [ ] Add market prediction features
- [ ] Mobile app integration
- [ ] Multi-language support
- [ ] Advanced analytics dashboard

---

Built with ❤️ for the XO Market community 