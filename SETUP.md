# XO Market Expert - Setup Guide for botmarket Index

This guide will help you set up the XO Market Expert chatbot using your existing Pinecone "botmarket" index.

## Your Pinecone Configuration

Based on your Pinecone setup, here are the details:

- **Index Name**: `botmarket`
- **Environment**: `aped-4627-b74a`
- **Dimensions**: 1024
- **Metric**: cosine
- **Model**: llama-text-embed-v2
- **Host**: `https://botmarket-2rrnbmn.svc.aped-4627-b74a.pinecone.io`

## Quick Setup

### 1. Environment Variables

Create a `.env` file in the project root with the following configuration:

```env
# Required
OPENAI_API_KEY=your_openai_api_key_here
PINECONE_API_KEY=your_pinecone_api_key_here
PINECONE_ENVIRONMENT=aped-4627-b74a
PINECONE_INDEX_NAME=botmarket

# Optional
DISCORD_BOT_TOKEN=your_discord_bot_token_here
XO_RPC_URL=https://testnet-rpc-1.xo.market/
XO_MARKET_CONTRACT=0x3cf19D0C88a14477DCaA0A45f4AF149a4C917523
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Ingest Documentation

```bash
npm run ingest
```

This will:
- Process XO Market documentation
- Split into 1000-character chunks
- Store in your `botmarket` index
- Use 768-dimensional embeddings

### 4. Start the Application

```bash
# Start web interface
npm run dev

# Or use the quick start script
./start.sh
```

## Technical Details

### Embedding Configuration

The system is configured to work with your Pinecone setup:

- **Embedding Model**: OpenAI text-embedding-ada-002 (1536 dimensions)
- **Pinecone Model**: llama-text-embed-v2 (1024 dimensions)
- **Conversion**: Pinecone automatically converts embeddings to 1024 dimensions
- **Metric**: Cosine similarity for vector search

### Index Structure

Your `botmarkets` index will contain:

- **Namespace**: `xo-market-docs`
- **Metadata**: Source, title, chunk numbers
- **Content**: XO Market documentation chunks
- **Search**: Semantic similarity search

### Data Sources

The ingestion process includes:

1. **XO Market Litepaper** - Comprehensive platform overview
2. **Documentation** - User guides and technical details
3. **FAQ** - Common questions and answers
4. **Discord Threads** - Community insights and best practices

## Testing

### 1. Web Interface

Visit `http://localhost:3000` and try:

- "What is XO Market?"
- "How do I create a market?"
- "What are the trading fees?"

### 2. API Test

```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"question": "What is XO Market?"}'
```

### 3. Health Check

```bash
curl http://localhost:3000/api/chat
```

## Troubleshooting

### Common Issues

1. **"Pinecone index not found"**
   - Verify index name is `botmarket`
   - Check environment is `aped-4627-b74a`
   - Ensure API key has access to the index

2. **"Embedding dimension mismatch"**
   - The system automatically handles dimension conversion
   - No manual configuration needed

3. **"Rate limit exceeded"**
   - Check your Pinecone plan limits
   - Consider upgrading if needed

### Verification

To verify your setup:

1. Check Pinecone console for index activity
2. Monitor ingestion logs for success messages
3. Test with simple questions first
4. Verify API responses include sources

## Next Steps

After successful setup:

1. **Customize**: Add your own documentation sources
2. **Train**: Run the evaluation system (`npm run eval`)
3. **Deploy**: Use Docker or Vercel for production
4. **Monitor**: Check response times and accuracy

---

Your `botmarket` index is now ready to power the XO Market Expert chatbot! 🚀 