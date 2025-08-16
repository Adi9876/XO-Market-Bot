#!/bin/bash

echo "🚀 Starting XO Market Expert..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ .env file not found!"
    echo "Please copy env.example to .env and fill in your API keys"
    exit 1
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Check if documentation has been ingested
echo "🔍 Checking if documentation has been ingested..."
if ! npm run ingest > /dev/null 2>&1; then
    echo "📚 Ingesting documentation..."
    npm run ingest
else
    echo "✅ Documentation already ingested"
fi

# Start the development server
echo "🌐 Starting web interface..."
echo "📱 Web interface will be available at: http://localhost:3000"
echo "🤖 Discord bot will start automatically if DISCORD_BOT_TOKEN is set"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Start both the web server and Discord bot
npm run dev &
WEB_PID=$!

# Wait for web server to start
sleep 5

# Start Discord bot if token is available
if [ ! -z "$DISCORD_BOT_TOKEN" ]; then
    echo "🤖 Starting Discord bot..."
    node discord-bot.ts &
    DISCORD_PID=$!
else
    echo "⚠️  DISCORD_BOT_TOKEN not set, skipping Discord bot"
fi

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down services..."
    kill $WEB_PID 2>/dev/null
    if [ ! -z "$DISCORD_PID" ]; then
        kill $DISCORD_PID 2>/dev/null
    fi
    exit 0
}

# Trap Ctrl+C and call cleanup
trap cleanup SIGINT

# Wait for background processes
wait 