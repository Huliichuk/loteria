/**
 * Probability Scoring System - Calculates winning probability for numbers and combinations
 */

export interface Draw {
    date: string;
    numbers: number[];
    stars: number[];
}

export interface NumberProbability {
    number: number;
    frequencyScore: number;      // 0-40 points
    hotColdScore: number;         // 0-30 points
    patternScore: number;         // 0-20 points
    overdueScore: number;         // 0-10 points
    totalScore: number;           // 0-100 points
    winChance: number;            // Percentage 0-100
}

export interface CombinationScore {
    numbers: number[];
    stars: number[];
    probabilityScore: number;     // 0-100
    winChance: string;            // Formatted percentage
    breakdown: {
        frequencyScore: number;
        hotColdScore: number;
        patternScore: number;
        overdueScore: number;
    };
}

/**
 * Calculate frequency score (0-40 points)
 * Based on how often a number appears in historical draws
 */
function calculateFrequencyScore(number: number, draws: Draw[], type: 'numbers' | 'stars'): number {
    const maxNumber = type === 'numbers' ? 50 : 12;
    const expectedAppearances = type === 'numbers' ? draws.length * (5 / 50) : draws.length * (2 / 12);

    let appearances = 0;
    draws.forEach(draw => {
        const pool = type === 'numbers' ? draw.numbers : draw.stars;
        if (pool.includes(number)) appearances++;
    });

    // Score based on how close to expected frequency
    const ratio = expectedAppearances > 0 ? appearances / expectedAppearances : 0;

    // Optimal is around 0.8-1.2 times expected
    let score = 0;
    if (ratio >= 0.8 && ratio <= 1.2) {
        score = 40; // Perfect frequency
    } else if (ratio >= 0.6 && ratio < 0.8) {
        score = 30; // Slightly under
    } else if (ratio > 1.2 && ratio <= 1.5) {
        score = 35; // Slightly over (hot)
    } else if (ratio > 1.5) {
        score = 25; // Too frequent
    } else {
        score = 20; // Too rare
    }

    return score;
}

/**
 * Calculate hot/cold score (0-30 points)
 * Based on recent trends (last 10-20 draws)
 */
function calculateHotColdScore(number: number, draws: Draw[], type: 'numbers' | 'stars'): number {
    const recentDraws = draws.slice(0, 10);
    const midDraws = draws.slice(0, 20);

    let recentCount = 0;
    let midCount = 0;

    recentDraws.forEach(draw => {
        const pool = type === 'numbers' ? draw.numbers : draw.stars;
        if (pool.includes(number)) recentCount++;
    });

    midDraws.forEach(draw => {
        const pool = type === 'numbers' ? draw.numbers : draw.stars;
        if (pool.includes(number)) midCount++;
    });

    const recentRate = recentCount / 10;
    const midRate = midDraws.length > 0 ? midCount / 20 : 0;

    // Hot numbers (appearing frequently in recent draws)
    if (recentCount >= 3 && recentRate > midRate) {
        return 30; // Very hot
    } else if (recentCount >= 2) {
        return 25; // Hot
    } else if (recentCount === 1) {
        return 20; // Warm
    } else if (recentCount === 0 && midCount >= 2) {
        return 22; // Due to appear (was hot, now cooling)
    } else {
        return 15; // Cold
    }
}

/**
 * Calculate pattern score (0-20 points)
 * Bonus for numbers that create good patterns (even/odd, high/low balance)
 */
function calculatePatternScore(number: number, type: 'numbers' | 'stars'): number {
    if (type === 'stars') return 15; // Stars less affected by patterns

    let score = 10; // Base score

    // Prefer numbers in middle range (not too high, not too low)
    if (number >= 15 && number <= 35) {
        score += 5;
    }

    // Slight preference for odd numbers (statistically appear slightly more)
    if (number % 2 !== 0) {
        score += 3;
    }

    // Avoid multiples of 5 (less common in winning combinations)
    if (number % 5 === 0) {
        score -= 3;
    }

    return Math.max(0, Math.min(20, score));
}

/**
 * Calculate overdue score (0-10 points)
 * Bonus for numbers that haven't appeared in a while
 */
function calculateOverdueScore(number: number, draws: Draw[], type: 'numbers' | 'stars'): number {
    const expectedInterval = type === 'numbers' ? 10 : 6;

    let lastSeen = -1;
    for (let i = 0; i < draws.length; i++) {
        const pool = type === 'numbers' ? draws[i].numbers : draws[i].stars;
        if (pool.includes(number)) {
            lastSeen = i;
            break;
        }
    }

    if (lastSeen === -1) {
        return 10; // Never seen or very overdue
    } else if (lastSeen > expectedInterval * 2) {
        return 10; // Very overdue
    } else if (lastSeen > expectedInterval) {
        return 7; // Overdue
    } else if (lastSeen === 0) {
        return 2; // Just appeared
    } else {
        return 5; // Normal
    }
}

/**
 * Calculate probability for a single number
 */
export function calculateNumberProbability(
    number: number,
    draws: Draw[],
    type: 'numbers' | 'stars' = 'numbers'
): NumberProbability {
    const frequencyScore = calculateFrequencyScore(number, draws, type);
    const hotColdScore = calculateHotColdScore(number, draws, type);
    const patternScore = calculatePatternScore(number, type);
    const overdueScore = calculateOverdueScore(number, draws, type);

    const totalScore = frequencyScore + hotColdScore + patternScore + overdueScore;
    const winChance = (totalScore / 100) * 100; // Convert to percentage

    return {
        number,
        frequencyScore,
        hotColdScore,
        patternScore,
        overdueScore,
        totalScore,
        winChance,
    };
}

/**
 * Get all numbers with their probabilities, sorted by score
 */
export function getAllNumberProbabilities(draws: Draw[], type: 'numbers' | 'stars' = 'numbers'): NumberProbability[] {
    const maxNumber = type === 'numbers' ? 50 : 12;
    const probabilities: NumberProbability[] = [];

    for (let i = 1; i <= maxNumber; i++) {
        probabilities.push(calculateNumberProbability(i, draws, type));
    }

    return probabilities.sort((a, b) => b.totalScore - a.totalScore);
}

/**
 * Score a specific combination
 */
export function scoreCombination(
    numbers: number[],
    stars: number[],
    draws: Draw[]
): CombinationScore {
    // Calculate average score for numbers
    let totalFrequency = 0;
    let totalHotCold = 0;
    let totalPattern = 0;
    let totalOverdue = 0;

    numbers.forEach(num => {
        const prob = calculateNumberProbability(num, draws, 'numbers');
        totalFrequency += prob.frequencyScore;
        totalHotCold += prob.hotColdScore;
        totalPattern += prob.patternScore;
        totalOverdue += prob.overdueScore;
    });

    // Calculate average score for stars
    stars.forEach(star => {
        const prob = calculateNumberProbability(star, draws, 'stars');
        totalFrequency += prob.frequencyScore;
        totalHotCold += prob.hotColdScore;
        totalPattern += prob.patternScore;
        totalOverdue += prob.overdueScore;
    });

    const count = numbers.length + stars.length;
    const avgFrequency = totalFrequency / count;
    const avgHotCold = totalHotCold / count;
    const avgPattern = totalPattern / count;
    const avgOverdue = totalOverdue / count;

    // Check for good patterns in the combination
    const evenCount = numbers.filter(n => n % 2 === 0).length;
    const oddCount = numbers.length - evenCount;
    const lowCount = numbers.filter(n => n <= 25).length;
    const highCount = numbers.length - lowCount;

    // Bonus for balanced combinations
    let balanceBonus = 0;
    if (evenCount >= 2 && evenCount <= 3) balanceBonus += 3; // Good even/odd balance
    if (lowCount >= 2 && lowCount <= 3) balanceBonus += 3;   // Good low/high balance

    const probabilityScore = Math.min(100, avgFrequency + avgHotCold + avgPattern + avgOverdue + balanceBonus);
    const winChance = ((probabilityScore / 100) * 15).toFixed(2); // Realistic win chance (max ~15%)

    return {
        numbers,
        stars,
        probabilityScore: Math.round(probabilityScore * 10) / 10,
        winChance: `${winChance}%`,
        breakdown: {
            frequencyScore: Math.round(avgFrequency * 10) / 10,
            hotColdScore: Math.round(avgHotCold * 10) / 10,
            patternScore: Math.round((avgPattern + balanceBonus) * 10) / 10,
            overdueScore: Math.round(avgOverdue * 10) / 10,
        },
    };
}
