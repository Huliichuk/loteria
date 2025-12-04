/**
 * Draw Checker - Compares user bets against draw results
 */

export interface Bet {
    id: string;
    numbers: number[];
    stars: number[];
}

export interface Draw {
    date: string;
    numbers: number[];
    stars: number[];
}

export interface MatchResult {
    betId: string;
    numbers: number[];
    stars: number[];
    matchedNumbers: number[];
    matchedStars: number[];
    numberMatchCount: number;
    starMatchCount: number;
    matchCode: string; // e.g., "3+2", "5+1"
    isWinner: boolean;
    prize: string;
}

// Prize tiers based on matches
const PRIZE_TIERS: Record<string, string> = {
    "5+2": "🏆 JACKPOT!",
    "5+1": "€300,000+",
    "5+0": "€50,000+",
    "4+2": "€3,000+",
    "4+1": "€150+",
    "4+0": "€50+",
    "3+2": "€30+",
    "3+1": "€12+",
    "2+2": "€8+",
    "3+0": "€10+",
    "1+2": "€7+",
    "2+1": "€5+",
};

/**
 * Check a single bet against a draw
 */
export function checkBet(bet: Bet, draw: Draw): MatchResult {
    const matchedNumbers = bet.numbers.filter((n) => draw.numbers.includes(n));
    const matchedStars = bet.stars.filter((s) => draw.stars.includes(s));

    const numberMatchCount = matchedNumbers.length;
    const starMatchCount = matchedStars.length;
    const matchCode = `${numberMatchCount}+${starMatchCount}`;

    const prize = PRIZE_TIERS[matchCode] || "No prize";
    const isWinner = prize !== "No prize";

    return {
        betId: bet.id,
        numbers: bet.numbers,
        stars: bet.stars,
        matchedNumbers,
        matchedStars,
        numberMatchCount,
        starMatchCount,
        matchCode,
        isWinner,
        prize,
    };
}

/**
 * Check all bets against a single draw
 */
export function checkAllBets(bets: Bet[], draw: Draw): MatchResult[] {
    return bets.map((bet) => checkBet(bet, draw));
}

/**
 * Find the closest bet to a draw (most matches)
 */
export function findClosestBet(bets: Bet[], draw: Draw): MatchResult | null {
    if (bets.length === 0) return null;

    const results = checkAllBets(bets, draw);

    // Sort by total matches (numbers + stars)
    results.sort((a, b) => {
        const totalA = a.numberMatchCount * 10 + a.starMatchCount;
        const totalB = b.numberMatchCount * 10 + b.starMatchCount;
        return totalB - totalA;
    });

    return results[0];
}

/**
 * Get match summary for UI display
 */
export function getMatchSummary(result: MatchResult): string {
    if (result.isWinner) {
        return `🎉 ${result.matchCode} - ${result.prize}`;
    }

    if (result.numberMatchCount > 0 || result.starMatchCount > 0) {
        return `${result.matchCode} match`;
    }

    return "No matches";
}

/**
 * Check if a bet has high potential (close to winning)
 */
export function hasHighPotential(result: MatchResult): boolean {
    // 4+1, 3+2, or better
    return (
        result.numberMatchCount >= 4 ||
        (result.numberMatchCount >= 3 && result.starMatchCount >= 2)
    );
}
