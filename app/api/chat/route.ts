import { NextRequest, NextResponse } from "next/server";
import { chatbot } from "@/lib/chatbot";

export async function POST(request: NextRequest) {
  try {
    const { question, conversationHistory = [] } = await request.json();

    if (!question || typeof question !== "string") {
      return NextResponse.json(
        { error: "Question is required and must be a string" },
        { status: 400 }
      );
    }

    console.log(`🤖 Processing question: ${question.substring(0, 100)}...`);

    const response = await chatbot.ask(question, conversationHistory);

    return NextResponse.json(response);
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const health = await chatbot.getHealthStatus();
    return NextResponse.json({ status: "ok", health });
  } catch (error) {
    console.error("Health check error:", error);
    return NextResponse.json(
      { status: "error", error: "Health check failed" },
      { status: 500 }
    );
  }
}
