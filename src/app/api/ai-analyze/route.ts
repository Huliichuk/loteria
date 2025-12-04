import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || "dummy-key-for-build",
});

export async function POST(req: Request) {
    try {
        const { userBets, combinationCount = 1 } = await req.json();

        // Validate combination count (1-10)
        const numCombinations = Math.min(10, Math.max(1, parseInt(combinationCount) || 1));

        if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === "dummy-key-for-build") {
            // Return mock data if no API key is present
            const mockPredictions = Array.from({ length: numCombinations }, (_, i) => ({
                numbers: [5 + i, 12 + i, 23 + i, 34 + i, 45].map(n => Math.min(50, n)),
                stars: [2 + i, 8].map(s => Math.min(12, s)),
                confidence: (0.75 - i * 0.05).toFixed(2),
            }));

            return NextResponse.json({
                closest_user_bet: "Simulation: Bet #1 (2 numbers match)",
                probability_score: 0.75,
                predictions: mockPredictions,
                why: "Simulation mode: OpenAI API Key is missing. Please add OPENAI_API_KEY to your .env.local file to get real AI predictions.",
            });
        }

        // Fetch recent history for context - try API first, then fallback to local
        let drawHistory: Array<{ date: string; numbers: number[]; stars: number[] }> = [];

        try {
            const historyRes = await fetch("https://euromillions.api.pedromealha.dev/v1/draws?order=desc&limit=20", {
                next: { revalidate: 3600 },
            });

            if (historyRes.ok) {
                const historyData = await historyRes.json();
                drawHistory = historyData.map((d: any) => ({
                    date: d.date,
                    numbers: d.numbers.map((n: string) => parseInt(n, 10)),
                    stars: d.stars.map((s: string) => parseInt(s, 10)),
                }));
            }
        } catch {
            console.log("External API failed, trying local draws...");
        }

        // Fallback: try local draws
        if (drawHistory.length === 0) {
            try {
                const localRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/store-draw`);
                if (localRes.ok) {
                    const localData = await localRes.json();
                    drawHistory = (localData.draws || []).slice(0, 20).map((d: any) => ({
                        date: d.date,
                        numbers: d.numbers,
                        stars: d.stars,
                    }));
                }
            } catch {
                console.log("Local draws also unavailable");
            }
        }

        // If still no history, use mock
        if (drawHistory.length === 0) {
            return NextResponse.json({
                closest_user_bet: "Unable to fetch draw history",
                probability_score: 0.5,
                predictions: [{ numbers: [7, 14, 21, 35, 42], stars: [3, 11], confidence: "0.50" }],
                why: "Draw history unavailable. Mock prediction generated.",
            });
        }

        const completion = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [
                {
                    role: "system",
                    content: `You are an expert in lottery prediction using probability theory, pattern analysis and historical results. 
You analyze frequency distributions, hot/cold numbers, patterns, and mathematical proximity. 
Always output valid JSON only, no markdown code blocks.`
                },
                {
                    role: "user",
                    content: `Analyze the following Euromillions data:

LAST 20 DRAWS:
${JSON.stringify(drawHistory, null, 2)}

USER BETS:
${JSON.stringify(userBets, null, 2)}

TASK:
1. Analyze which user bet is closest to historical patterns
2. Generate ${numCombinations} most probable winning combination(s) for the next draw
3. Explain your reasoning based on frequency analysis, hot numbers, and pattern detection

IMPORTANT RULES:
- Numbers must be between 1-50 (5 unique numbers)
- Stars must be between 1-12 (2 unique stars)
- Base predictions on actual frequency analysis from the provided history
- Confidence should decrease for each subsequent prediction

Return this exact JSON structure:
{
  "closest_user_bet": "Description of which bet is closest and why (e.g., 'Bet #1: 3 numbers and 1 star match recent patterns')",
  "probability_score": 0.0 to 1.0,
  "predictions": [
    {"numbers": [n1, n2, n3, n4, n5], "stars": [s1, s2], "confidence": "0.XX"}
  ],
  "hot_numbers": [list of frequently appearing numbers],
  "cold_numbers": [list of rarely appearing numbers],
  "why": "Detailed explanation of pattern analysis and prediction rationale"
}`
                }
            ],
            temperature: 0.7,
        });

        const content = completion.choices[0].message.content;
        if (!content) throw new Error("No content from OpenAI");

        // Parse JSON from response (handle potential markdown code blocks)
        let jsonString = content.trim();
        if (jsonString.startsWith("```")) {
            jsonString = jsonString.replace(/```json\n?|\n?```/g, "").trim();
        }

        const result = JSON.parse(jsonString);

        // Transform for backward compatibility
        return NextResponse.json({
            closest_user_bet: result.closest_user_bet,
            probability_score: result.probability_score,
            prediction_of_day: result.predictions?.[0]
                ? [...result.predictions[0].numbers, ...result.predictions[0].stars]
                : [],
            predictions: result.predictions,
            hot_numbers: result.hot_numbers,
            cold_numbers: result.cold_numbers,
            why: result.why,
        });

    } catch (error) {
        console.error("AI Analysis Error:", error);
        return NextResponse.json(
            { error: "Failed to perform AI analysis", details: String(error) },
            { status: 500 }
        );
    }
}
