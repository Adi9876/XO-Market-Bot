# XO Market Expert - Deployment Guide

This guide will help you deploy the XO Market Expert chatbot with all its features.

## Prerequisites

Before deploying, ensure you have:

1. **Node.js 18+** installed
2. **OpenAI API key** (for GPT-4 access)
3. **Pinecone API key** (for vector storage)
4. **Discord bot token** (optional, for Discord integration)

## Quick Setup

### 1. Clone and Install

```bash
git clone <repository-url>
cd xo-market-expert
npm install
```

### 2. Environment Configuration

```bash
cp env.example .env
```

Edit `.env` with your API keys:

```env
# Required
OPENAI_API_KEY=sk-your-openai-key-here
PINECONE_API_KEY=your-pinecone-api-key
PINECONE_ENVIRONMENT=your-pinecone-environment

# Optional
DISCORD_BOT_TOKEN=your-discord-bot-token
XO_RPC_URL=https://testnet-rpc-1.xo.market/
XO_MARKET_CONTRACT=0x3cf19D0C88a14477DCaA0A45f4AF149a4C917523
```

### 3. Ingest Documentation

```bash
npm run ingest
```

This processes all XO Market documentation and stores it in Pinecone.

### 4. Start the Application

#### Option A: Quick Start Script
```bash
./start.sh
```

```bash
I have tried running it with local llms so please un-comment the ollama part with openApi to switch between in ingest.ts and page.ts file 
```


#### Option B: Manual Start
```bash
# Start web interface
npm run dev

# In another terminal, start Discord bot (if token is set)
ts-node --project tsconfig.bot.json discord-bot.ts
```

#### Option C: Docker
```bash
docker-compose up -d
```

## API Keys Setup

### OpenAI API Key

1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Create an account or sign in
3. Navigate to API Keys section
4. Create a new API key
5. Add to your `.env` file

### Pinecone API Key

1. Go to [Pinecone Console](https://app.pinecone.io/)
2. Create an account or sign in
3. Create a new project
4. Get your API key and environment
5. Add to your `.env` file

### Discord Bot Token (Optional)

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create a new application
3. Go to Bot section
4. Create a bot and copy the token
5. Add to your `.env` file
6. Invite bot to your server with appropriate permissions

## Testing the Deployment

### 1. Web Interface Test

Visit `http://localhost:3000` and try these questions:

- "What is XO Market?"
- "How do I create a market?"
- "What are the current active markets?"

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

### 4. Discord Bot Test (if configured)

In your Discord server:
```
!xo What is XO Market?
!xo How do I create a market?
```

## Production Deployment

### Vercel (Recommended)

1. Connect your repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push

### Docker Production

```bash
# Build production image
docker build -t xo-market-expert .

# Run with environment variables
docker run -d \
  -p 3000:3000 \
  --env-file .env \
  --name xo-market-expert \
  xo-market-expert
```

### Manual Production

```bash
# Build the application
npm run build

# Start production server
npm start
```

## Monitoring and Maintenance

### Health Checks

The application includes health checks at `/api/chat` (GET).

### Logs

Monitor logs for:
- API response times
- Error rates
- Discord bot activity
- Blockchain connection status

### Performance Metrics

Run the evaluation system periodically:

```bash
npm run eval
```

This generates a report in `eval/results.md` with:
- Response time metrics
- Citation accuracy
- Source relevance scores

## Troubleshooting

### Common Issues

1. **"Chatbot not initialized"**
   - Check environment variables
   - Ensure Pinecone index exists
   - Verify OpenAI API key

2. **"Failed to fetch market data"**
   - Check XO RPC URL
   - Verify contract address
   - Ensure network connectivity

3. **Discord bot not responding**
   - Verify bot token
   - Check bot permissions
   - Ensure bot is online

4. **Slow response times**
   - Check OpenAI API limits
   - Monitor Pinecone performance
   - Consider upgrading API tiers

### Debug Mode

Enable debug logging by setting:

```env
DEBUG=true
NODE_ENV=development
```

### Support

For issues:
1. Check the logs
2. Run health checks
3. Verify environment variables
4. Test individual components
5. Open an issue on GitHub

## Security Considerations

1. **API Keys**: Never commit `.env` files
2. **Rate Limiting**: Implement rate limiting for production
3. **CORS**: Configure CORS for web interface
4. **Input Validation**: All inputs are validated
5. **Error Handling**: Sensitive errors are not exposed

## Scaling

For high-traffic deployments:

1. **Load Balancing**: Use multiple instances
2. **Caching**: Implement Redis for conversation history
3. **Database**: Consider PostgreSQL for persistent storage
4. **CDN**: Use CDN for static assets
5. **Monitoring**: Implement comprehensive monitoring

## Backup and Recovery

1. **Pinecone Index**: Export vector embeddings
2. **Environment**: Backup `.env` files
3. **Logs**: Archive application logs
4. **Configuration**: Version control configuration files

---

For additional support, check the main README.md or open an issue on GitHub. 