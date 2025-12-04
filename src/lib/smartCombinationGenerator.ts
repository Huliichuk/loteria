/**
 * Smart Combination Generator - Generates lottery combinations with highest winning probability
 */

import {
    getAllNumberProbabilities,
    scoreCombination,
    type Draw,
    type CombinationScore,
    type NumberProbability
} from './probabilityScoring';

export interface GeneratedCombination extends CombinationScore {
    rank: number;
    confidence: string;
}

/**
 * Generate top N combinations based on probability scores
 */
export function generateTopCombinations(
    draws: Draw[],
    count: number = 5
): GeneratedCombination[] {
    const numCount = Math.min(10, Math.max(1, count));

    // Get probability scores for all numbers and stars
    const numberProbs = getAllNumberProbabilities(draws, 'numbers');
    const starProbs = getAllNumberProbabilities(draws, 'stars');

    const combinations: GeneratedCombination[] = [];

    // Strategy: Generate diverse combinations using different approaches
    for (let i = 0; i < numCount; i++) {
        let numbers: number[];
        let stars: number[];

        if (i === 0) {
            // Best combination: Top scored numbers
            numbers = selectBestNumbers(numberProbs, draws);
            stars = selectBestStars(starProbs, draws);
        } else if (i === 1) {
            // Balanced combination: Mix of hot and overdue
            numbers = selectBalancedNumbers(numberProbs, draws);
            stars = selectBalancedStars(starProbs, draws);
        } else if (i === 2) {
            // Pattern-based: Good even/odd and low/high balance
            numbers = selectPatternNumbers(numberProbs, draws);
            stars = selectBestStars(starProbs, draws);
        } else {
            // Diversified combinations: Weighted random from top candidates
            numbers = selectWeightedRandomNumbers(numberProbs, i);
            stars = selectWeightedRandomStars(starProbs, i);
        }

        const score = scoreCombination(numbers, stars, draws);
        const confidence = calculateConfidence(score.probabilityScore, i);

        combinations.push({
            ...score,
            rank: i + 1,
            confidence,
        });
    }

    // Sort by probability score
    return combinations.sort((a, b) => b.probabilityScore - a.probabilityScore)
        .map((combo, index) => ({ ...combo, rank: index + 1 }));
}

/**
 * Select best numbers based on highest total scores
 */
function selectBestNumbers(numberProbs: NumberProbability[], draws: Draw[]): number[] {
    const selected: number[] = [];
    const topCandidates = numberProbs.slice(0, 15);

    // Pick top 5 with some diversity
    for (const candidate of topCandidates) {
        if (selected.length >= 5) break;

        // Avoid too many consecutive numbers
        const hasConsecutive = selected.some(n => Math.abs(n - candidate.number) === 1);
        if (selected.length >= 3 && hasConsecutive) continue;

        selected.push(candidate.number);
    }

    // Fill remaining if needed
    while (selected.length < 5) {
        const remaining = topCandidates.filter(c => !selected.includes(c.number));
        if (remaining.length > 0) {
            selected.push(remaining[0].number);
        } else break;
    }

    return selected.sort((a, b) => a - b);
}

/**
 * Select best stars based on highest total scores
 */
function selectBestStars(starProbs: NumberProbability[], draws: Draw[]): number[] {
    return starProbs.slice(0, 2).map(s => s.number).sort((a, b) => a - b);
}

/**
 * Select balanced numbers (mix of hot and overdue)
 */
function selectBalancedNumbers(numberProbs: NumberProbability[], draws: Draw[]): number[] {
    const selected: number[] = [];

    // Get hot numbers (high hot/cold score)
    const hotNumbers = [...numberProbs]
        .sort((a, b) => b.hotColdScore - a.hotColdScore)
        .slice(0, 10);

    // Get overdue numbers (high overdue score)
    const overdueNumbers = [...numberProbs]
        .sort((a, b) => b.overdueScore - a.overdueScore)
        .slice(0, 10);

    // Pick 2-3 hot numbers
    for (let i = 0; i < 3 && i < hotNumbers.length; i++) {
        if (!selected.includes(hotNumbers[i].number)) {
            selected.push(hotNumbers[i].number);
        }
    }

    // Pick 2 overdue numbers
    for (let i = 0; i < overdueNumbers.length && selected.length < 5; i++) {
        if (!selected.includes(overdueNumbers[i].number)) {
            selected.push(overdueNumbers[i].number);
        }
    }

    // Fill remaining from top candidates
    while (selected.length < 5) {
        const candidate = numberProbs.find(n => !selected.includes(n.number));
        if (candidate) selected.push(candidate.number);
        else break;
    }

    return selected.sort((a, b) => a - b);
}

/**
 * Select balanced stars (mix of hot and overdue)
 */
function selectBalancedStars(starProbs: NumberProbability[], draws: Draw[]): number[] {
    const hotStars = [...starProbs].sort((a, b) => b.hotColdScore - a.hotColdScore);
    const overdueStars = [...starProbs].sort((a, b) => b.overdueScore - a.overdueScore);

    const selected: number[] = [];

    // Pick 1 hot star
    if (hotStars.length > 0) selected.push(hotStars[0].number);

    // Pick 1 overdue star
    for (const star of overdueStars) {
        if (!selected.includes(star.number)) {
            selected.push(star.number);
            break;
        }
    }

    // Fill if needed
    while (selected.length < 2) {
        const candidate = starProbs.find(s => !selected.includes(s.number));
        if (candidate) selected.push(candidate.number);
        else break;
    }

    return selected.sort((a, b) => a - b);
}

/**
 * Select numbers with good pattern balance
 */
function selectPatternNumbers(numberProbs: NumberProbability[], draws: Draw[]): number[] {
    const selected: number[] = [];
    const topCandidates = numberProbs.slice(0, 20);

    let evenCount = 0;
    let oddCount = 0;
    let lowCount = 0;
    let highCount = 0;

    for (const candidate of topCandidates) {
        if (selected.length >= 5) break;

        const isEven = candidate.number % 2 === 0;
        const isLow = candidate.number <= 25;

        // Try to maintain balance
        if (isEven && evenCount >= 3) continue;
        if (!isEven && oddCount >= 3) continue;
        if (isLow && lowCount >= 3) continue;
        if (!isLow && highCount >= 3) continue;

        selected.push(candidate.number);
        if (isEven) evenCount++;
        else oddCount++;
        if (isLow) lowCount++;
        else highCount++;
    }

    // Fill remaining
    while (selected.length < 5) {
        const candidate = topCandidates.find(c => !selected.includes(c.number));
        if (candidate) selected.push(candidate.number);
        else break;
    }

    return selected.sort((a, b) => a - b);
}

/**
 * Select weighted random numbers from top candidates
 */
function selectWeightedRandomNumbers(numberProbs: NumberProbability[], seed: number): number[] {
    const selected: number[] = [];
    const topCandidates = numberProbs.slice(0, 25);

    // Use seed for deterministic randomness
    const random = (index: number) => {
        const x = Math.sin(seed * 12345 + index * 67890) * 10000;
        return x - Math.floor(x);
    };

    // Weighted selection based on scores
    const weights = topCandidates.map(c => c.totalScore);
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);

    for (let i = 0; i < 5; i++) {
        let randomValue = random(i) * totalWeight;
        let cumulativeWeight = 0;

        for (let j = 0; j < topCandidates.length; j++) {
            if (selected.includes(topCandidates[j].number)) continue;

            cumulativeWeight += weights[j];
            if (randomValue <= cumulativeWeight) {
                selected.push(topCandidates[j].number);
                break;
            }
        }

        // Fallback if nothing selected
        if (selected.length === i) {
            const candidate = topCandidates.find(c => !selected.includes(c.number));
            if (candidate) selected.push(candidate.number);
        }
    }

    return selected.sort((a, b) => a - b);
}

/**
 * Select weighted random stars from top candidates
 */
function selectWeightedRandomStars(starProbs: NumberProbability[], seed: number): number[] {
    const selected: number[] = [];
    const topCandidates = starProbs.slice(0, 6);

    const random = (index: number) => {
        const x = Math.sin(seed * 54321 + index * 98760) * 10000;
        return x - Math.floor(x);
    };

    const weights = topCandidates.map(c => c.totalScore);
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);

    for (let i = 0; i < 2; i++) {
        let randomValue = random(i) * totalWeight;
        let cumulativeWeight = 0;

        for (let j = 0; j < topCandidates.length; j++) {
            if (selected.includes(topCandidates[j].number)) continue;

            cumulativeWeight += weights[j];
            if (randomValue <= cumulativeWeight) {
                selected.push(topCandidates[j].number);
                break;
            }
        }

        if (selected.length === i) {
            const candidate = topCandidates.find(c => !selected.includes(c.number));
            if (candidate) selected.push(candidate.number);
        }
    }

    return selected.sort((a, b) => a - b);
}

/**
 * Calculate confidence score (0.00-1.00)
 */
function calculateConfidence(probabilityScore: number, rank: number): string {
    // Base confidence from probability score
    let confidence = probabilityScore / 100;

    // Decrease confidence for lower ranked combinations
    confidence *= Math.max(0.5, 1 - (rank * 0.05));

    return confidence.toFixed(2);
}

/**
 * Rank existing combinations by their probability scores
 */
export function rankCombinations(
    combinations: Array<{ numbers: number[]; stars: number[] }>,
    draws: Draw[]
): GeneratedCombination[] {
    return combinations
        .map((combo, index) => {
            const score = scoreCombination(combo.numbers, combo.stars, draws);
            const confidence = calculateConfidence(score.probabilityScore, index);

            return {
                ...score,
                rank: index + 1,
                confidence,
            };
        })
        .sort((a, b) => b.probabilityScore - a.probabilityScore)
        .map((combo, index) => ({ ...combo, rank: index + 1 }));
}
