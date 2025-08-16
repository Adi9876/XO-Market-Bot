'use client';

import { useState, useRef, useEffect } from 'react';
import { ChatResponse } from '@/lib/chatbot';

interface Message {
    role: 'user' | 'assistant';
    content: string;
    sources?: Array<{
        title: string;
        source: string;
        chunk: number;
        content: string;
    }>;
    marketData?: any[];
    responseTime?: number;
}

export default function Home() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [conversationHistory, setConversationHistory] = useState<string[]>([]);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage = input.trim();
        setInput('');
        setIsLoading(true);

        // Add user message to chat
        setMessages(prev => [...prev, { role: 'user', content: userMessage }]);

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    question: userMessage,
                    conversationHistory,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to get response');
            }

            const data: ChatResponse = await response.json();

            // Add assistant response to chat
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: data.answer,
                sources: data.sources,
                marketData: data.marketData,
                responseTime: data.responseTime,
            }]);

            // Update conversation history
            setConversationHistory(prev => [...prev, `Human: ${userMessage}`, `Assistant: ${data.answer}`]);

            // Keep only last 10 messages to prevent context overflow
            if (conversationHistory.length > 20) {
                setConversationHistory(prev => prev.slice(-20));
            }

        } catch (error) {
            console.error('Error:', error);
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: 'Sorry, I encountered an error while processing your question. Please try again.',
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    const formatMarketData = (marketData: any[]) => {
        return (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold text-blue-800 mb-2">Live Market Data:</h4>
                {marketData.map((market, index) => (
                    <div key={index} className="mb-3 p-3 bg-white rounded border">
                        <p className="font-medium text-gray-800">{market.question}</p>
                        <p className="text-sm text-gray-600">Outcomes: {market.outcomes.join(', ')}</p>
                        <p className="text-sm text-gray-600">
                            End Time: {new Date(market.endTime * 1000).toLocaleString()}
                        </p>
                        <p className="text-sm text-gray-600">
                            Status: {market.settled ? 'Settled' : 'Active'}
                        </p>
                        {market.settled && market.winningOutcome && (
                            <p className="text-sm text-green-600">
                                Winning Outcome: {market.winningOutcome}
                            </p>
                        )}
                        <p className="text-sm text-gray-600">
                            Liquidity: {market.liquidity} ETH | Volume: {market.volume} ETH
                        </p>
                    </div>
                ))}
            </div>
        );
    };

    const formatSources = (sources: any[]) => {
        return (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-gray-800 mb-2">Sources:</h4>
                {sources.map((source, index) => (
                    <div key={index} className="mb-2">
                        <p className="text-sm font-medium text-gray-700">
                            {index + 1}. {source.title} ({source.source})
                        </p>
                        <p className="text-xs text-gray-500">{source.content}</p>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
            <div className="container mx-auto px-4 py-8 max-w-4xl">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-gray-800 mb-2">
                        XO Market Expert
                    </h1>
                    <p className="text-gray-600">
                        Your AI assistant for XO Market - Ask questions about features, markets, and get live data
                    </p>
                </div>

                {/* Chat Container */}
                <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                    {/* Messages */}
                    <div className="h-96 overflow-y-auto p-6">
                        {messages.length === 0 ? (
                            <div className="text-center text-gray-500 py-8">
                                <div className="text-6xl mb-4">🤖</div>
                                <p className="text-lg font-medium mb-2">Welcome to XO Market Expert!</p>
                                <p>Ask me anything about XO Market, from basic questions to live market data.</p>
                                <div className="mt-4 text-sm">
                                    <p>Try asking:</p>
                                    <ul className="mt-2 space-y-1">
                                        <li>• "What is XO Market?"</li>
                                        <li>• "How do I create a market?"</li>
                                        <li>• "What are the current active markets?"</li>
                                        <li>• "What are the trading fees?"</li>
                                    </ul>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {messages.map((message, index) => (
                                    <div
                                        key={index}
                                        className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div
                                            className={`max-w-3xl rounded-lg px-4 py-2 ${message.role === 'user'
                                                    ? 'bg-blue-500 text-white'
                                                    : 'bg-gray-100 text-gray-800'
                                                }`}
                                        >
                                            <div className="whitespace-pre-wrap">{message.content}</div>

                                            {message.sources && message.sources.length > 0 && formatSources(message.sources)}
                                            {message.marketData && message.marketData.length > 0 && formatMarketData(message.marketData)}

                                            {message.responseTime && (
                                                <div className="text-xs text-gray-500 mt-2">
                                                    Response time: {message.responseTime}ms
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}

                                {isLoading && (
                                    <div className="flex justify-start">
                                        <div className="bg-gray-100 rounded-lg px-4 py-2">
                                            <div className="flex items-center space-x-2">
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                                                <span className="text-gray-600">Thinking...</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Form */}
                    <div className="border-t bg-gray-50 p-4">
                        <form onSubmit={handleSubmit} className="flex space-x-4">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Ask about XO Market..."
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                disabled={isLoading}
                            />
                            <button
                                type="submit"
                                disabled={isLoading || !input.trim()}
                                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Send
                            </button>
                        </form>
                    </div>
                </div>

                {/* Footer */}
                <div className="text-center mt-8 text-sm text-gray-500">
                    <p>
                        Powered by AI • Live blockchain data •
                        <a href="https://xo.market" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline ml-1">
                            XO Market
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
} 