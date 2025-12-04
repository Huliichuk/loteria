import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

const DRAWS_FILE = path.join(process.cwd(), "data", "draws.json");

interface Draw {
    id: string;
    date: string;
    numbers: number[];
    stars: number[];
    source: "api" | "manual";
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

// Read draws from file
async function readDraws(): Promise<Draw[]> {
    try {
        const data = await fs.readFile(DRAWS_FILE, "utf-8");
        return JSON.parse(data);
    } catch {
        return [];
    }
}

// Write draws to file
async function writeDraws(draws: Draw[]): Promise<void> {
    await ensureDataDir();
    await fs.writeFile(DRAWS_FILE, JSON.stringify(draws, null, 2));
}

// GET - Retrieve all draws (local history)
export async function GET() {
    try {
        const draws = await readDraws();
        return NextResponse.json({ draws });
    } catch (error) {
        console.error("Error reading draws:", error);
        return NextResponse.json(
            { error: "Failed to retrieve draws" },
            { status: 500 }
        );
    }
}

// POST - Store a draw (from API or manual entry)
export async function POST(req: Request) {
    try {
        const { date, numbers, stars, source = "manual" } = await req.json();

        // Validation
        if (!date) {
            return NextResponse.json(
                { error: "Date is required" },
                { status: 400 }
            );
        }

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

        const draws = await readDraws();

        // Check if draw for this date already exists
        const existingIndex = draws.findIndex((d) => d.date === date);

        const newDraw: Draw = {
            id: crypto.randomUUID(),
            date,
            numbers: numbers.map((n: number) => n).sort((a: number, b: number) => a - b),
            stars: stars.map((s: number) => s).sort((a: number, b: number) => a - b),
            source: source as "api" | "manual",
            createdAt: new Date().toISOString(),
        };

        if (existingIndex >= 0) {
            // Update existing draw
            draws[existingIndex] = { ...draws[existingIndex], ...newDraw, id: draws[existingIndex].id };
        } else {
            // Add new draw
            draws.push(newDraw);
        }

        // Sort by date descending
        draws.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        await writeDraws(draws);

        return NextResponse.json({
            draw: existingIndex >= 0 ? draws[existingIndex] : newDraw,
            message: existingIndex >= 0 ? "Draw updated" : "Draw stored successfully"
        });
    } catch (error) {
        console.error("Error storing draw:", error);
        return NextResponse.json(
            { error: "Failed to store draw" },
            { status: 500 }
        );
    }
}

// PUT - Sync draws from external API
export async function PUT() {
    try {
        // Fetch latest draws from API
        const res = await fetch("https://euromillions.api.pedromealha.dev/v1/draws?order=desc&limit=50");

        if (!res.ok) {
            throw new Error("Failed to fetch from external API");
        }

        const apiDraws = await res.json();
        const localDraws = await readDraws();

        let added = 0;
        let updated = 0;

        for (const apiDraw of apiDraws) {
            const existingIndex = localDraws.findIndex((d) => d.date === apiDraw.date);

            const draw: Draw = {
                id: existingIndex >= 0 ? localDraws[existingIndex].id : crypto.randomUUID(),
                date: apiDraw.date,
                numbers: apiDraw.numbers.map((n: string) => parseInt(n, 10)).sort((a: number, b: number) => a - b),
                stars: apiDraw.stars.map((s: string) => parseInt(s, 10)).sort((a: number, b: number) => a - b),
                source: "api",
                createdAt: new Date().toISOString(),
            };

            if (existingIndex >= 0) {
                localDraws[existingIndex] = draw;
                updated++;
            } else {
                localDraws.push(draw);
                added++;
            }
        }

        // Sort by date descending
        localDraws.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        await writeDraws(localDraws);

        return NextResponse.json({
            message: `Synced successfully. Added: ${added}, Updated: ${updated}`,
            total: localDraws.length
        });
    } catch (error) {
        console.error("Error syncing draws:", error);
        return NextResponse.json(
            { error: "Failed to sync draws from API" },
            { status: 500 }
        );
    }
}
