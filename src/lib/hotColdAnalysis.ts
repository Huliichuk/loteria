/**
 * Hot/Cold Analysis - Identifies trending and dormant numbers
 */

export interface Draw {
    date: string;
    numbers: number[];
    stars: number[];
}

export interface HotColdNumber {
    number: number;
    appearances: number;
    streakType: "hot" | "cold" | "neutral";
    streak: number; // consecutive appearances or absences
    trend: "rising" | "falling" | "stable";
}

export interface HotColdAnalysis {
    hotNumbers: HotColdNumber[];
    coldNumbers: HotColdNumber[];
    hotStars: HotColdNumber[];
    coldStars: HotColdNumber[];
    overdue: number[]; // Numbers not seen in a long time
    overdueStars: number[];
}

/**
 * Analyze number temperature (hot/cold status)
 */
function analyzeTemperature(
    allNumbers: number[],
    draws: Draw[],
    type: "numbers" | "stars",
    maxNumber: number
): HotColdNumber[] {
    const results: HotColdNumber[] = [];
    const recentDraws = draws.slice(0, 10); // Last 10 draws for recent analysis
    const midDraws = draws.slice(0, 20);    // Last 20 for trend

    for (let num = 1; num <= maxNumber; num++) {
        // Count appearances in recent draws
        const recentCount = recentDraws.filter((d) =>
            type === "numbers" ? d.numbers.includes(num) : d.stars.includes(num)
        ).length;

        // Count in mid-term
        const midCount = midDraws.filter((d) =>
            type === "numbers" ? d.numbers.includes(num) : d.stars.includes(num)
        ).length;

        // Calculate streak (consecutive presence or absence)
        let streak = 0;
        let lastSeen = -1;
        for (let i = 0; i < draws.length; i++) {
            const found = type === "numbers"
                ? draws[i].numbers.includes(num)
                : draws[i].stars.includes(num);

            if (found) {
                lastSeen = i;
                break;
            }
            streak++;
        }

        // Determine streak type
        let streakType: "hot" | "cold" | "neutral" = "neutral";
        if (recentCount >= (type === "numbers" ? 3 : 4)) {
            streakType = "hot";
        } else if (lastSeen > 7) {
            streakType = "cold";
        }

        // Determine trend
        const recentRate = recentCount / 10;
        const midRate = midCount / 20;
        let trend: "rising" | "falling" | "stable" = "stable";
        if (recentRate > midRate + 0.1) {
            trend = "rising";
        } else if (recentRate < midRate - 0.1) {
            trend = "falling";
        }

        results.push({
            number: num,
            appearances: recentCount,
            streakType,
            streak: lastSeen === -1 ? draws.length : lastSeen,
            trend,
        });
    }

    return results.sort((a, b) => b.appearances - a.appearances);
}

/**
 * Get hot numbers (frequently appearing)
 */
export function getHotNumbers(draws: Draw[]): HotColdNumber[] {
    const analysis = analyzeTemperature([], draws, "numbers", 50);
    return analysis.filter((n) => n.streakType === "hot" || n.appearances >= 3);
}

/**
 * Get cold numbers (rarely appearing)
 */
export function getColdNumbers(draws: Draw[]): HotColdNumber[] {
    const analysis = analyzeTemperature([], draws, "numbers", 50);
    return analysis.filter((n) => n.streakType === "cold" || n.streak > 5);
}

/**
 * Get hot stars
 */
export function getHotStars(draws: Draw[]): HotColdNumber[] {
    const analysis = analyzeTemperature([], draws, "stars", 12);
    return analysis.filter((n) => n.streakType === "hot" || n.appearances >= 4);
}

/**
 * Get cold stars
 */
export function getColdStars(draws: Draw[]): HotColdNumber[] {
    const analysis = analyzeTemperature([], draws, "stars", 12);
    return analysis.filter((n) => n.streakType === "cold" || n.streak > 3);
}

/**
 * Get overdue numbers (should appear soon based on average)
 */
export function getOverdueNumbers(draws: Draw[]): number[] {
    const analysis = analyzeTemperature([], draws, "numbers", 50);
    // Average expectation: each number should appear ~once every 10 draws
    return analysis.filter((n) => n.streak > 10).map((n) => n.number);
}

/**
 * Get overdue stars
 */
export function getOverdueStars(draws: Draw[]): number[] {
    const analysis = analyzeTemperature([], draws, "stars", 12);
    // Average expectation: each star should appear ~once every 6 draws
    return analysis.filter((n) => n.streak > 6).map((n) => n.number);
}

/**
 * Full hot/cold analysis
 */
export function analyzeHotCold(draws: Draw[]): HotColdAnalysis {
    return {
        hotNumbers: getHotNumbers(draws),
        coldNumbers: getColdNumbers(draws),
        hotStars: getHotStars(draws),
        coldStars: getColdStars(draws),
        overdue: getOverdueNumbers(draws),
        overdueStars: getOverdueStars(draws),
    };
}

/**
 * Get recommendation based on hot/cold analysis
 */
export function getHotColdRecommendation(draws: Draw[]): {
    useHot: number[];
    useOverdue: number[];
    avoidCold: number[];
    hotStarsToUse: number[];
} {
    const analysis = analyzeHotCold(draws);

    return {
        useHot: analysis.hotNumbers.slice(0, 5).map((n) => n.number),
        useOverdue: analysis.overdue.slice(0, 3),
        avoidCold: analysis.coldNumbers.slice(0, 5).map((n) => n.number),
        hotStarsToUse: analysis.hotStars.slice(0, 2).map((n) => n.number),
    };
}
