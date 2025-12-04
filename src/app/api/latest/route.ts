import { NextResponse } from "next/server";

export async function GET() {
    try {
        const res = await fetch("https://euromillions.api.pedromealha.dev/draws/latest", {
            next: { revalidate: 3600 }, // Cache for 1 hour
        });

        if (!res.ok) {
            throw new Error("Failed to fetch data");
        }

        const data = await res.json();

        // Transform data to match our frontend interface if needed
        // The API returns: { id, date, numbers, stars, ... }
        // We need: { date, numbers, stars }

        return NextResponse.json({
            date: data.date,
            numbers: data.numbers,
            stars: data.stars,
        });
    } catch (error) {
        console.error("API Error:", error);
        return NextResponse.json(
            { error: "Failed to fetch latest results" },
            { status: 500 }
        );
    }
}
