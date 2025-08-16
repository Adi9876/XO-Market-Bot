import { NextResponse } from "next/server";
import { chatbot } from "@/lib/chatbot";

export async function GET() {
  try {
    // This will trigger the live data fetch
    const response = await chatbot.ask("What are the current active markets?");

    return NextResponse.json({
      markets: response.marketData || [],
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Markets API Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch market data" },
      { status: 500 }
    );
  }
}
