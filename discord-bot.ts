// src/bot.ts (or index.ts)

import { Client, GatewayIntentBits, Message } from "discord.js";
import dotenv from "dotenv";
import { chatbot } from "./lib/chatbot";

dotenv.config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const BOT_PREFIX = "!xo";
const MAX_MESSAGE_LENGTH = 2000;

interface ConversationState {
  history: string[];
  lastActivity: number;
}

const conversations = new Map<string, ConversationState>();

function truncateMessage(message: string): string {
  if (message.length <= MAX_MESSAGE_LENGTH) {
    return message;
  }
  const truncated = message.substring(0, MAX_MESSAGE_LENGTH - 3);
  const lastPeriod = truncated.lastIndexOf(".");
  const lastNewline = truncated.lastIndexOf("\n");
  const cutPoint = Math.max(lastPeriod, lastNewline);

  if (cutPoint > MAX_MESSAGE_LENGTH * 0.8) {
    return truncated.substring(0, cutPoint + 1) + "...";
  }
  return truncated + "...";
}

function formatSources(sources: any[]): string {
  if (!sources.length) return "";
  let formatted = "\n\n**Sources:**\n";
  sources.forEach((source, idx) => {
    formatted += `${idx + 1}. ${source.title} (${source.source})\n`;
  });
  return formatted;
}

function formatMarketData(marketData: any[]): string {
  if (!marketData.length) return "";
  let formatted = "\n\n**Live Market Data:**\n";
  marketData.forEach((market, idx) => {
    formatted += `\n**Market ${idx + 1}:** ${market.question}\n`;
    formatted += `- Outcomes: ${market.outcomes.join(", ")}\n`;
    formatted += `- End Time: ${new Date(market.endTime * 1000).toLocaleString()}\n`;
    formatted += `- Status: ${market.settled ? "Settled" : "Active"}\n`;
    if (market.settled && market.winningOutcome) {
      formatted += `- Winning Outcome: ${market.winningOutcome}\n`;
    }
    formatted += `- Liquidity: ${market.liquidity} ETH\n`;
    formatted += `- Volume: ${market.volume} ETH\n`;
  });
  return formatted;
}

async function handleMessage(message: Message) {
  if (message.author.bot || !message.content.startsWith(BOT_PREFIX)) return;

  const question = message.content.slice(BOT_PREFIX.length).trim();
  if (!question) {
    await message.reply(
      "Hello! I'm the XO Market Expert. Ask me anything about XO Market! Use `!xo <your question>` to get started."
    );
    return;
  }

  const channelId = message.channel.id;
  let conversation = conversations.get(channelId);
  if (!conversation) {
    conversation = { history: [], lastActivity: Date.now() };
    conversations.set(channelId, conversation);
  }

  // Clean old conversation history older than 1 hour
  if (conversation.lastActivity < Date.now() - 60 * 60 * 1000) {
    conversation.history = [];
  }
  conversation.lastActivity = Date.now();

  try {
    if ("sendTyping" in message.channel && typeof message.channel.sendTyping === "function") {
      await message.channel.sendTyping();
    }

    console.log(`🤖 Discord: Processing question from ${message.author.username}: ${question}`);

    const response = await chatbot.ask(question, conversation.history);

    conversation.history.push(`Human: ${question}`);
    conversation.history.push(`Assistant: ${response.answer}`);
    if (conversation.history.length > 20) {
      conversation.history = conversation.history.slice(-20);
    }

    let fullResponse = response.answer;
    if (response.sources?.length) fullResponse += formatSources(response.sources);
    if (response.marketData?.length) fullResponse += formatMarketData(response.marketData);
    fullResponse += `\n\n*Response time: ${response.responseTime}ms*`;

    const truncated = truncateMessage(fullResponse);
    await message.reply(truncated);
  } catch (error) {
    console.error("Discord bot error:", error);
    await message.reply(
      "Sorry, I encountered an error while processing your question. Please try again later."
    );
  }
}

client.once("ready", () => {
  console.log(`🤖 Discord bot logged in as ${client.user?.tag}`);
  console.log(`📊 Serving ${client.guilds.cache.size} guilds`);
});

client.on("messageCreate", handleMessage);

client.on("error", (error) => {
  console.error("Discord client error:", error);
});

setInterval(() => {
  const oneHourAgo = Date.now() - 60 * 60 * 1000;
  for (const [channelId, conversation] of conversations.entries()) {
    if (conversation.lastActivity < oneHourAgo) {
      conversations.delete(channelId);
    }
  }
}, 30 * 60 * 1000);

if (process.env.DISCORD_BOT_TOKEN) {
  client.login(process.env.DISCORD_BOT_TOKEN);
} else {
  console.error("❌ DISCORD_BOT_TOKEN not found in environment variables");
  process.exit(1);
}
