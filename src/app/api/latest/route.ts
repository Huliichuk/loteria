import { NextResponse } from "next/server";

export async function GET() {
    try {
        // Use correct v1 API endpoint with descending order to get the latest draw
        const res = await fetch("https://euromillions.api.pedromealha.dev/v1/draws?order=desc&limit=1", {
            next: { revalidate: 3600 }, // Cache for 1 hour
            headers: {
                "Accept": "application/json",
            },
        });

        if (!res.ok) {
            throw new Error(`Failed to fetch data: ${res.status}`);
        }

        const data = await res.json();

        if (!data || data.length === 0) {
            throw new Error("No draw data available");
        }

        const latestDraw = data[0];

        // Transform data: API returns numbers and stars as strings
        return NextResponse.json({
            date: latestDraw.date,
            numbers: latestDraw.numbers.map((n: string) => parseInt(n, 10)),
            stars: latestDraw.stars.map((s: string) => parseInt(s, 10)),
        });
    } catch (error) {
        console.error("API Error:", error);
        return NextResponse.json(
            { error: "Failed to fetch latest results" },
            { status: 500 }
        );
    }
}
