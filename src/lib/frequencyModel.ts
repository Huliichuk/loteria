/**
 * Frequency Model - Analyzes historical draws for number frequency patterns
 */

export interface Draw {
    date: string;
    numbers: number[];
    stars: number[];
}

export interface FrequencyData {
    number: number;
    count: number;
    percentage: number;
    lastSeen: number; // draws ago
}

export interface FrequencyAnalysis {
    numberFrequency: FrequencyData[];
    starFrequency: FrequencyData[];
    mostCommonNumbers: number[];
    mostCommonStars: number[];
    leastCommonNumbers: number[];
    leastCommonStars: number[];
    recentPatterns: {
        consecutiveNumbers: number;
        evenOddRatio: string;
        lowHighRatio: string;
    };
}

/**
 * Calculate frequency of each number in draws
 */
export function calculateNumberFrequency(draws: Draw[]): FrequencyData[] {
    const frequency: Map<number, { count: number; lastIndex: number }> = new Map();

    // Initialize all numbers 1-50
    for (let i = 1; i <= 50; i++) {
        frequency.set(i, { count: 0, lastIndex: -1 });
    }

    // Count occurrences
    draws.forEach((draw, index) => {
        draw.numbers.forEach((num) => {
            const current = frequency.get(num)!;
            current.count++;
            if (current.lastIndex === -1) {
                current.lastIndex = index;
            }
        });
    });

    // Convert to array with percentages
    const total = draws.length;
    return Array.from(frequency.entries())
        .map(([number, data]) => ({
            number,
            count: data.count,
            percentage: total > 0 ? (data.count / total) * 100 : 0,
            lastSeen: data.lastIndex === -1 ? total : data.lastIndex,
        }))
        .sort((a, b) => b.count - a.count);
}

/**
 * Calculate frequency of each star in draws
 */
export function calculateStarFrequency(draws: Draw[]): FrequencyData[] {
    const frequency: Map<number, { count: number; lastIndex: number }> = new Map();

    // Initialize all stars 1-12
    for (let i = 1; i <= 12; i++) {
        frequency.set(i, { count: 0, lastIndex: -1 });
    }

    // Count occurrences
    draws.forEach((draw, index) => {
        draw.stars.forEach((star) => {
            const current = frequency.get(star)!;
            current.count++;
            if (current.lastIndex === -1) {
                current.lastIndex = index;
            }
        });
    });

    // Convert to array with percentages
    const total = draws.length;
    return Array.from(frequency.entries())
        .map(([number, data]) => ({
            number,
            count: data.count,
            percentage: total > 0 ? (data.count / total) * 100 : 0,
            lastSeen: data.lastIndex === -1 ? total : data.lastIndex,
        }))
        .sort((a, b) => b.count - a.count);
}

/**
 * Analyze patterns in recent draws
 */
export function analyzeRecentPatterns(draws: Draw[]): FrequencyAnalysis["recentPatterns"] {
    if (draws.length === 0) {
        return { consecutiveNumbers: 0, evenOddRatio: "0:0", lowHighRatio: "0:0" };
    }

    // Analyze last 10 draws
    const recentDraws = draws.slice(0, 10);

    let consecutiveCount = 0;
    let evenCount = 0;
    let oddCount = 0;
    let lowCount = 0; // 1-25
    let highCount = 0; // 26-50

    recentDraws.forEach((draw) => {
        const sortedNumbers = [...draw.numbers].sort((a, b) => a - b);

        // Check for consecutive numbers
        for (let i = 0; i < sortedNumbers.length - 1; i++) {
            if (sortedNumbers[i + 1] - sortedNumbers[i] === 1) {
                consecutiveCount++;
            }
        }

        // Count even/odd
        draw.numbers.forEach((n) => {
            if (n % 2 === 0) evenCount++;
            else oddCount++;
        });

        // Count low/high
        draw.numbers.forEach((n) => {
            if (n <= 25) lowCount++;
            else highCount++;
        });
    });

    return {
        consecutiveNumbers: consecutiveCount,
        evenOddRatio: `${evenCount}:${oddCount}`,
        lowHighRatio: `${lowCount}:${highCount}`,
    };
}

/**
 * Full frequency analysis
 */
export function analyzeFrequency(draws: Draw[]): FrequencyAnalysis {
    const numberFrequency = calculateNumberFrequency(draws);
    const starFrequency = calculateStarFrequency(draws);
    const recentPatterns = analyzeRecentPatterns(draws);

    return {
        numberFrequency,
        starFrequency,
        mostCommonNumbers: numberFrequency.slice(0, 10).map((f) => f.number),
        mostCommonStars: starFrequency.slice(0, 4).map((f) => f.number),
        leastCommonNumbers: numberFrequency.slice(-10).map((f) => f.number),
        leastCommonStars: starFrequency.slice(-4).map((f) => f.number),
        recentPatterns,
    };
}

/**
 * Generate prediction based on frequency
 */
export function generateFrequencyBasedPrediction(draws: Draw[]): { numbers: number[]; stars: number[] } {
    const analysis = analyzeFrequency(draws);

    // Mix of hot and due numbers
    const hotNumbers = analysis.mostCommonNumbers.slice(0, 3);
    const dueNumbers = analysis.numberFrequency
        .filter((f) => f.lastSeen > 5) // Not seen in last 5 draws
        .slice(0, 5)
        .map((f) => f.number);

    // Combine and pick 5 unique
    const candidateNumbers = [...new Set([...hotNumbers, ...dueNumbers])];
    const selectedNumbers = candidateNumbers.slice(0, 5);

    // Fill remaining with random from top 20
    while (selectedNumbers.length < 5) {
        const topNumbers = analysis.mostCommonNumbers.slice(0, 20);
        const remaining = topNumbers.filter((n) => !selectedNumbers.includes(n));
        if (remaining.length > 0) {
            selectedNumbers.push(remaining[Math.floor(Math.random() * remaining.length)]);
        }
    }

    // Stars - mix of hot and due
    const hotStars = analysis.mostCommonStars.slice(0, 1);
    const dueStars = analysis.starFrequency
        .filter((f) => f.lastSeen > 3)
        .slice(0, 2)
        .map((f) => f.number);

    const candidateStars = [...new Set([...hotStars, ...dueStars])];
    const selectedStars = candidateStars.slice(0, 2);

    while (selectedStars.length < 2) {
        const topStars = analysis.mostCommonStars;
        const remaining = topStars.filter((s) => !selectedStars.includes(s));
        if (remaining.length > 0) {
            selectedStars.push(remaining[Math.floor(Math.random() * remaining.length)]);
        }
    }

    return {
        numbers: selectedNumbers.sort((a, b) => a - b),
        stars: selectedStars.sort((a, b) => a - b),
    };
}
