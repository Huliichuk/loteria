import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

const BETS_FILE = path.join(process.cwd(), "data", "bets.json");

interface Bet {
    id: string;
    numbers: number[];
    stars: number[];
    createdAt: string;
}

// Ensure data directory exists
async function ensureDataDir() {
    const dataDir = path.join(process.cwd(), "data");
    try {
        await fs.access(dataDir);
    } catch {
        await fs.mkdir(dataDir, { recursive: true });
    }
}

// Read bets from file
async function readBets(): Promise<Bet[]> {
    try {
        const data = await fs.readFile(BETS_FILE, "utf-8");
        return JSON.parse(data);
    } catch {
        return [];
    }
}

// Write bets to file
async function writeBets(bets: Bet[]): Promise<void> {
    await ensureDataDir();
    await fs.writeFile(BETS_FILE, JSON.stringify(bets, null, 2));
}

// GET - Retrieve all bets
export async function GET() {
    try {
        const bets = await readBets();
        return NextResponse.json({ bets });
    } catch (error) {
        console.error("Error reading bets:", error);
        return NextResponse.json(
            { error: "Failed to retrieve bets" },
            { status: 500 }
        );
    }
}

// POST - Store a new bet
export async function POST(req: Request) {
    try {
        const { numbers, stars } = await req.json();

        // Validation
        if (!numbers || !Array.isArray(numbers) || numbers.length !== 5) {
            return NextResponse.json(
                { error: "Must provide exactly 5 numbers" },
                { status: 400 }
            );
        }

        if (!stars || !Array.isArray(stars) || stars.length !== 2) {
            return NextResponse.json(
                { error: "Must provide exactly 2 stars" },
                { status: 400 }
            );
        }

        if (numbers.some((n: number) => n < 1 || n > 50)) {
            return NextResponse.json(
                { error: "Numbers must be between 1 and 50" },
                { status: 400 }
            );
        }

        if (stars.some((s: number) => s < 1 || s > 12)) {
            return NextResponse.json(
                { error: "Stars must be between 1 and 12" },
                { status: 400 }
            );
        }

        const newBet: Bet = {
            id: crypto.randomUUID(),
            numbers: numbers.sort((a: number, b: number) => a - b),
            stars: stars.sort((a: number, b: number) => a - b),
            createdAt: new Date().toISOString(),
        };

        const bets = await readBets();
        bets.push(newBet);
        await writeBets(bets);

        return NextResponse.json({ bet: newBet, message: "Bet stored successfully" });
    } catch (error) {
        console.error("Error storing bet:", error);
        return NextResponse.json(
            { error: "Failed to store bet" },
            { status: 500 }
        );
    }
}

// DELETE - Remove a bet by ID
export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json(
                { error: "Bet ID is required" },
                { status: 400 }
            );
        }

        const bets = await readBets();
        const filteredBets = bets.filter((b) => b.id !== id);

        if (bets.length === filteredBets.length) {
            return NextResponse.json(
                { error: "Bet not found" },
                { status: 404 }
            );
        }

        await writeBets(filteredBets);

        return NextResponse.json({ message: "Bet deleted successfully" });
    } catch (error) {
        console.error("Error deleting bet:", error);
        return NextResponse.json(
            { error: "Failed to delete bet" },
            { status: 500 }
        );
    }
}
