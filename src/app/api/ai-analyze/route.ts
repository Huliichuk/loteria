import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || "dummy-key-for-build",
});

export async function POST(req: Request) {
    try {
        const { userBets } = await req.json();

        if (!process.env.OPENAI_API_KEY) {
            // Return mock data if no API key is present (for development/demo)
            return NextResponse.json({
                closest_user_bet: "Simulation: Bet #1 (2 numbers match)",
                probability_score: 0.75,
                prediction_of_day: [5, 12, 23, 34, 45, 2, 8],
                why: "Simulation mode: OpenAI API Key is missing. Please add OPENAI_API_KEY to your .env.local file to get real AI predictions.",
            });
        }

        // Fetch recent history for context
        const historyRes = await fetch("https://euromillions.api.pedromealha.dev/draws?limit=20");
        const historyData = await historyRes.json();
        const drawHistory = historyData.map((d: any) => ({
            date: d.date,
            numbers: d.numbers,
            stars: d.stars,
        }));

        const completion = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [
                {
                    role: "system",
                    content: "You are an expert in lottery prediction using probability theory, pattern analysis and historical results. Output strict JSON."
                },
                {
                    role: "user",
                    content: `Here are the last 20 draws: ${JSON.stringify(drawHistory)}. 
          Here are the current user bets: ${JSON.stringify(userBets)}. 
          Suggest the single most likely winning combination for the next draw and analyze if any of the user’s bets are within probable proximity of a win.
          
          Return JSON format:
          {
            "closest_user_bet": "Description of closest bet",
            "probability_score": 0.0 to 1.0,
            "prediction_of_day": [n1, n2, n3, n4, n5, s1, s2],
            "why": "Explanation string"
          }`
                }
            ],
            temperature: 0.7,
        });

        const content = completion.choices[0].message.content;
        if (!content) throw new Error("No content from OpenAI");

        // Parse JSON from response (handle potential markdown code blocks)
        const jsonString = content.replace(/```json\n|\n```/g, "").trim();
        const result = JSON.parse(jsonString);

        return NextResponse.json(result);

    } catch (error) {
        console.error("AI Analysis Error:", error);
        return NextResponse.json(
            { error: "Failed to perform AI analysis" },
            { status: 500 }
        );
    }
}
