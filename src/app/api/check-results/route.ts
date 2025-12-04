import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { checkAllBets, findClosestBet, hasHighPotential, type MatchResult } from "@/lib/drawChecker";

const BETS_FILE = path.join(process.cwd(), "data", "bets.json");
const DRAWS_FILE = path.join(process.cwd(), "data", "draws.json");

interface Bet {
    id: string;
    numbers: number[];
    stars: number[];
}

interface Draw {
    id: string;
    date: string;
    numbers: number[];
    stars: number[];
}

interface CheckResults {
    draw: Draw | null;
    results: MatchResult[];
    closestBet: MatchResult | null;
    winners: MatchResult[];
    highPotential: MatchResult[];
    summary: {
        totalBets: number;
        winningBets: number;
        highPotentialCount: number;
    };
}

async function readBets(): Promise<Bet[]> {
    try {
        const data = await fs.readFile(BETS_FILE, "utf-8");
        return JSON.parse(data);
    } catch {
        return [];
    }
}

async function readDraws(): Promise<Draw[]> {
    try {
        const data = await fs.readFile(DRAWS_FILE, "utf-8");
        return JSON.parse(data);
    } catch {
        return [];
    }
}

// POST - Check bets against a specific draw or latest
export async function POST(req: Request) {
    try {
        const { drawDate, bets: providedBets } = await req.json();

        // Get bets (from request or from storage)
        let bets: Bet[];
        if (providedBets && Array.isArray(providedBets)) {
            bets = providedBets;
        } else {
            bets = await readBets();
        }

        if (bets.length === 0) {
            return NextResponse.json({
                error: "No bets to check",
                summary: { totalBets: 0, winningBets: 0, highPotentialCount: 0 }
            });
        }

        // Get draw (from storage or fetch from API)
        let draw: Draw | null = null;
        const draws = await readDraws();

        if (drawDate) {
            draw = draws.find((d) => d.date === drawDate) || null;
        } else if (draws.length > 0) {
            draw = draws[0]; // Latest draw
        }

        // If no local draw, fetch from API
        if (!draw) {
            try {
                const res = await fetch("https://euromillions.api.pedromealha.dev/v1/draws?order=desc&limit=1");
                if (res.ok) {
                    const apiData = await res.json();
                    if (apiData && apiData.length > 0) {
                        draw = {
                            id: "api-latest",
                            date: apiData[0].date,
                            numbers: apiData[0].numbers.map((n: string) => parseInt(n, 10)),
                            stars: apiData[0].stars.map((s: string) => parseInt(s, 10)),
                        };
                    }
                }
            } catch (e) {
                console.error("Failed to fetch from API:", e);
            }
        }

        if (!draw) {
            return NextResponse.json({
                error: "No draw results available to check against",
                summary: { totalBets: 0, winningBets: 0, highPotentialCount: 0 }
            });
        }

        // Check all bets
        const results = checkAllBets(bets, draw);
        const closestBet = findClosestBet(bets, draw);
        const winners = results.filter((r) => r.isWinner);
        const highPotential = results.filter((r) => hasHighPotential(r));

        const response: CheckResults = {
            draw,
            results,
            closestBet,
            winners,
            highPotential,
            summary: {
                totalBets: bets.length,
                winningBets: winners.length,
                highPotentialCount: highPotential.length,
            },
        };

        return NextResponse.json(response);

    } catch (error) {
        console.error("Check results error:", error);
        return NextResponse.json(
            { error: "Failed to check results" },
            { status: 500 }
        );
    }
}

// GET - Quick check against latest draw
export async function GET() {
    try {
        const bets = await readBets();

        if (bets.length === 0) {
            return NextResponse.json({
                message: "No bets stored",
                summary: { totalBets: 0, winningBets: 0, highPotentialCount: 0 }
            });
        }

        // Fetch latest draw from API
        const res = await fetch("https://euromillions.api.pedromealha.dev/v1/draws?order=desc&limit=1");

        if (!res.ok) {
            throw new Error("Failed to fetch draw");
        }

        const apiData = await res.json();

        if (!apiData || apiData.length === 0) {
            return NextResponse.json({ error: "No draw data available" });
        }

        const draw = {
            id: "api-latest",
            date: apiData[0].date,
            numbers: apiData[0].numbers.map((n: string) => parseInt(n, 10)),
            stars: apiData[0].stars.map((s: string) => parseInt(s, 10)),
        };

        const results = checkAllBets(bets, draw);
        const winners = results.filter((r) => r.isWinner);
        const highPotential = results.filter((r) => hasHighPotential(r));

        return NextResponse.json({
            draw,
            closestBet: findClosestBet(bets, draw),
            winners,
            highPotential,
            summary: {
                totalBets: bets.length,
                winningBets: winners.length,
                highPotentialCount: highPotential.length,
            },
            alert: highPotential.length > 0
                ? "⚠️ You have high potential bets! Check details below."
                : null,
        });

    } catch (error) {
        console.error("Check results error:", error);
        return NextResponse.json(
            { error: "Failed to check results" },
            { status: 500 }
        );
    }
}
