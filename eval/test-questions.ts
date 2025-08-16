import { chatbot } from "../lib/chatbot";
import * as fs from "fs";
import * as path from "path";

interface TestQuestion {
  id: number;
  question: string;
  category: string;
  expectedSources: string[];
  needsLiveData: boolean;
}

interface TestResult {
  question: TestQuestion;
  response: string;
  sources: Array<{
    title: string;
    source: string;
    chunk: number;
  }>;
  responseTime: number;
  hasCorrectSources: boolean;
  sourceAccuracy: number;
  timestamp: string;
}

const TEST_QUESTIONS: TestQuestion[] = [
  // Basic Platform Questions
  {
    id: 1,
    question: "What is XO Market?",
    category: "Basic Platform",
    expectedSources: [
      "XO Market Litepaper",
      "XO Market Documentation",
      "XO Market FAQ",
    ],
    needsLiveData: false,
  },
  {
    id: 2,
    question: "How does XO Market work?",
    category: "Basic Platform",
    expectedSources: ["XO Market Litepaper", "XO Market Documentation"],
    needsLiveData: false,
  },
  {
    id: 3,
    question: "What blockchain does XO Market use?",
    category: "Technical",
    expectedSources: ["XO Market FAQ", "XO Market Documentation"],
    needsLiveData: false,
  },

  // Market Creation Questions
  {
    id: 4,
    question: "How do I create a market on XO Market?",
    category: "Market Creation",
    expectedSources: ["XO Market Documentation", "Selected Discord Threads"],
    needsLiveData: false,
  },
  {
    id: 5,
    question: "What types of markets can I create?",
    category: "Market Creation",
    expectedSources: ["XO Market Litepaper", "XO Market Documentation"],
    needsLiveData: false,
  },
  {
    id: 6,
    question: "How much does it cost to create a market?",
    category: "Market Creation",
    expectedSources: ["XO Market FAQ", "XO Market Litepaper"],
    needsLiveData: false,
  },

  // Trading Questions
  {
    id: 7,
    question: "How do I start trading on XO Market?",
    category: "Trading",
    expectedSources: ["XO Market Documentation", "XO Market FAQ"],
    needsLiveData: false,
  },
  {
    id: 8,
    question: "What are the trading fees?",
    category: "Trading",
    expectedSources: [
      "XO Market Litepaper",
      "XO Market FAQ",
      "Selected Discord Threads",
    ],
    needsLiveData: false,
  },
  {
    id: 9,
    question: "What are some effective trading strategies?",
    category: "Trading",
    expectedSources: ["Selected Discord Threads"],
    needsLiveData: false,
  },

  // Technical Questions
  {
    id: 10,
    question: "What wallets are supported by XO Market?",
    category: "Technical",
    expectedSources: ["XO Market FAQ"],
    needsLiveData: false,
  },
  {
    id: 11,
    question: "What if my transaction fails?",
    category: "Technical",
    expectedSources: ["XO Market FAQ", "Selected Discord Threads"],
    needsLiveData: false,
  },
  {
    id: 12,
    question: "How do markets settle on XO Market?",
    category: "Technical",
    expectedSources: ["XO Market Documentation", "XO Market Litepaper"],
    needsLiveData: false,
  },

  // Security Questions
  {
    id: 13,
    question: "Is XO Market secure?",
    category: "Security",
    expectedSources: ["XO Market FAQ", "XO Market Litepaper"],
    needsLiveData: false,
  },
  {
    id: 14,
    question: "What security measures does XO Market have?",
    category: "Security",
    expectedSources: ["XO Market Litepaper", "Selected Discord Threads"],
    needsLiveData: false,
  },

  // Live Data Questions
  {
    id: 15,
    question: "What are the current active markets?",
    category: "Live Data",
    expectedSources: [],
    needsLiveData: true,
  },
  {
    id: 16,
    question: "Show me the current market data",
    category: "Live Data",
    expectedSources: [],
    needsLiveData: true,
  },
  {
    id: 17,
    question: "What markets are available on the testnet?",
    category: "Live Data",
    expectedSources: [],
    needsLiveData: true,
  },

  // Advanced Questions
  {
    id: 18,
    question: "How does the automated market making work?",
    category: "Advanced",
    expectedSources: ["XO Market Litepaper"],
    needsLiveData: false,
  },
  {
    id: 19,
    question: "What are the best practices for creating successful markets?",
    category: "Advanced",
    expectedSources: ["Selected Discord Threads"],
    needsLiveData: false,
  },
  {
    id: 20,
    question: "How does the dispute resolution system work?",
    category: "Advanced",
    expectedSources: ["XO Market Litepaper", "XO Market Documentation"],
    needsLiveData: false,
  },
];

function calculateSourceAccuracy(
  sources: any[],
  expectedSources: string[]
): number {
  if (expectedSources.length === 0) return 1.0; // Live data questions

  const sourceTitles = sources.map((s) => s.title);
  let correctSources = 0;

  for (const expected of expectedSources) {
    if (sourceTitles.some((title) => title.includes(expected))) {
      correctSources++;
    }
  }

  return correctSources / expectedSources.length;
}

function hasCorrectSources(sources: any[], expectedSources: string[]): boolean {
  if (expectedSources.length === 0) return true; // Live data questions
  return calculateSourceAccuracy(sources, expectedSources) >= 0.5;
}

async function runEvaluation(): Promise<TestResult[]> {
  console.log("🧪 Starting XO Market Expert evaluation...");
  console.log(`📝 Testing ${TEST_QUESTIONS.length} questions...\n`);

  const results: TestResult[] = [];
  let totalResponseTime = 0;
  let correctCitations = 0;

  for (const question of TEST_QUESTIONS) {
    console.log(`Question ${question.id}: ${question.question}`);

    try {
      const startTime = Date.now();
      const response = await chatbot.ask(question.question);
      const responseTime = Date.now() - startTime;

      totalResponseTime += responseTime;

      const hasCorrect = hasCorrectSources(
        response.sources,
        question.expectedSources
      );
      const sourceAccuracy = calculateSourceAccuracy(
        response.sources,
        question.expectedSources
      );

      if (hasCorrect) {
        correctCitations++;
      }

      const result: TestResult = {
        question,
        response: response.answer,
        sources: response.sources.map((s) => ({
          title: s.title,
          source: s.source,
          chunk: s.chunk,
        })),
        responseTime,
        hasCorrectSources: hasCorrect,
        sourceAccuracy,
        timestamp: new Date().toISOString(),
      };

      results.push(result);

      console.log(`  ✅ Response time: ${responseTime}ms`);
      console.log(`  📚 Sources: ${response.sources.length} found`);
      console.log(
        `  🎯 Citation accuracy: ${(sourceAccuracy * 100).toFixed(1)}%`
      );
      console.log(
        `  ${hasCorrect ? "✅" : "❌"} Correct citations: ${
          hasCorrect ? "Yes" : "No"
        }\n`
      );

      // Small delay between questions
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`  ❌ Error processing question ${question.id}:`, error);

      const result: TestResult = {
        question,
        response: "Error processing question",
        sources: [],
        responseTime: 0,
        hasCorrectSources: false,
        sourceAccuracy: 0,
        timestamp: new Date().toISOString(),
      };

      results.push(result);
    }
  }

  return results;
}

function generateReport(results: TestResult[]): string {
  const totalQuestions = results.length;
  const successfulQuestions = results.filter((r) => r.responseTime > 0).length;
  const totalResponseTime = results.reduce((sum, r) => sum + r.responseTime, 0);
  const averageResponseTime = totalResponseTime / successfulQuestions;
  const correctCitations = results.filter((r) => r.hasCorrectSources).length;
  const citationAccuracy = (correctCitations / totalQuestions) * 100;

  const averageSourceAccuracy =
    results.reduce((sum, r) => sum + r.sourceAccuracy, 0) / totalQuestions;

  // Categorize results
  const categoryResults = TEST_QUESTIONS.reduce((acc, q) => {
    const result = results.find((r) => r.question.id === q.id);
    if (!acc[q.category]) {
      acc[q.category] = { total: 0, correct: 0, avgTime: 0, times: [] };
    }
    acc[q.category].total++;
    if (result && result.hasCorrectSources) {
      acc[q.category].correct++;
    }
    if (result && result.responseTime > 0) {
      acc[q.category].times.push(result.responseTime);
    }
    return acc;
  }, {} as Record<string, { total: number; correct: number; avgTime: number; times: number[] }>);

  // Calculate average times per category
  Object.keys(categoryResults).forEach((category) => {
    const times = categoryResults[category].times;
    categoryResults[category].avgTime =
      times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0;
  });

  let report = `# XO Market Expert Evaluation Results

## Summary
- **Total Questions Tested**: ${totalQuestions}
- **Successful Responses**: ${successfulQuestions}
- **Average Response Time**: ${averageResponseTime.toFixed(0)}ms
- **Citation Accuracy**: ${citationAccuracy.toFixed(1)}%
- **Average Source Accuracy**: ${(averageSourceAccuracy * 100).toFixed(1)}%

## Performance by Category

`;

  Object.entries(categoryResults).forEach(([category, stats]) => {
    const accuracy = (stats.correct / stats.total) * 100;
    report += `### ${category}
- **Questions**: ${stats.total}
- **Correct Citations**: ${stats.correct}/${stats.total} (${accuracy.toFixed(
      1
    )}%)
- **Average Response Time**: ${stats.avgTime.toFixed(0)}ms

`;
  });

  report += `## Detailed Results

`;

  results.forEach((result) => {
    report += `### Question ${result.question.id}: ${result.question.question}
- **Category**: ${result.question.category}
- **Response Time**: ${result.responseTime}ms
- **Sources Found**: ${result.sources.length}
- **Citation Accuracy**: ${(result.sourceAccuracy * 100).toFixed(1)}%
- **Correct Citations**: ${result.hasCorrectSources ? "✅ Yes" : "❌ No"}
- **Timestamp**: ${result.timestamp}

**Response**: ${result.response.substring(0, 200)}${
      result.response.length > 200 ? "..." : ""
    }

**Sources**:
${result.sources.map((s) => `- ${s.title} (${s.source})`).join("\n")}

---
`;
  });

  return report;
}

async function main() {
  try {
    // Wait for chatbot to initialize
    console.log("⏳ Waiting for chatbot initialization...");
    await new Promise((resolve) => setTimeout(resolve, 5000));

    const results = await runEvaluation();

    // Generate report
    const report = generateReport(results);

    // Save results
    const evalDir = path.join(__dirname, "..", "eval");
    if (!fs.existsSync(evalDir)) {
      fs.mkdirSync(evalDir, { recursive: true });
    }

    const reportPath = path.join(evalDir, "results.md");
    fs.writeFileSync(reportPath, report);

    console.log("\n📊 Evaluation complete!");
    console.log(`📄 Report saved to: ${reportPath}`);

    // Print summary
    const totalQuestions = results.length;
    const successfulQuestions = results.filter(
      (r) => r.responseTime > 0
    ).length;
    const totalResponseTime = results.reduce(
      (sum, r) => sum + r.responseTime,
      0
    );
    const averageResponseTime = totalResponseTime / successfulQuestions;
    const correctCitations = results.filter((r) => r.hasCorrectSources).length;
    const citationAccuracy = (correctCitations / totalQuestions) * 100;

    console.log("\n📈 Summary:");
    console.log(`- Questions tested: ${totalQuestions}`);
    console.log(`- Successful responses: ${successfulQuestions}`);
    console.log(`- Average response time: ${averageResponseTime.toFixed(0)}ms`);
    console.log(`- Citation accuracy: ${citationAccuracy.toFixed(1)}%`);
  } catch (error) {
    console.error("❌ Evaluation failed:", error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { runEvaluation, generateReport, TEST_QUESTIONS };
