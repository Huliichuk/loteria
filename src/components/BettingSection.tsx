"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Ticket } from "lucide-react";

interface Bet {
    id: string;
    numbers: number[];
    stars: number[];
}

interface BettingSectionProps {
    onBetsChange: (bets: Bet[]) => void;
}

export default function BettingSection({ onBetsChange }: BettingSectionProps) {
    const [bets, setBets] = useState<Bet[]>([]);
    const [currentNumbers, setCurrentNumbers] = useState<string[]>(Array(5).fill(""));
    const [currentStars, setCurrentStars] = useState<string[]>(Array(2).fill(""));
    const [error, setError] = useState<string | null>(null);

    // Load bets from localStorage on mount
    useEffect(() => {
        const savedBets = localStorage.getItem("userBets");
        if (savedBets) {
            try {
                const parsed = JSON.parse(savedBets);
                setBets(parsed);
                onBetsChange(parsed);
            } catch (e) {
                console.error("Failed to parse bets", e);
            }
        }
    }, [onBetsChange]);

    // Save bets to localStorage whenever they change
    useEffect(() => {
        localStorage.setItem("userBets", JSON.stringify(bets));
        onBetsChange(bets);
    }, [bets, onBetsChange]);

    const handleNumberChange = (index: number, value: string) => {
        const newNumbers = [...currentNumbers];
        newNumbers[index] = value;
        setCurrentNumbers(newNumbers);
        setError(null);
    };

    const handleStarChange = (index: number, value: string) => {
        const newStars = [...currentStars];
        newStars[index] = value;
        setCurrentStars(newStars);
        setError(null);
    };

    const addBet = () => {
        // Validation
        const numbers = currentNumbers.map((n) => parseInt(n)).filter((n) => !isNaN(n));
        const stars = currentStars.map((n) => parseInt(n)).filter((n) => !isNaN(n));

        if (numbers.length !== 5 || stars.length !== 2) {
            setError("Please fill in all fields.");
            return;
        }

        if (numbers.some((n) => n < 1 || n > 50)) {
            setError("Numbers must be between 1 and 50.");
            return;
        }

        if (stars.some((n) => n < 1 || n > 12)) {
            setError("Stars must be between 1 and 12.");
            return;
        }

        if (new Set(numbers).size !== 5) {
            setError("Numbers must be unique.");
            return;
        }

        if (new Set(stars).size !== 2) {
            setError("Stars must be unique.");
            return;
        }

        const newBet: Bet = {
            id: crypto.randomUUID(),
            numbers: numbers.sort((a, b) => a - b),
            stars: stars.sort((a, b) => a - b),
        };

        setBets([...bets, newBet]);
        setCurrentNumbers(Array(5).fill(""));
        setCurrentStars(Array(2).fill(""));
        setError(null);
    };

    const removeBet = (id: string) => {
        setBets(bets.filter((b) => b.id !== id));
    };

    return (
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 shadow-xl border border-white/20">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2 text-white">
                <Ticket className="w-6 h-6 text-yellow-400" />
                Your Bets
            </h2>

            <div className="space-y-4 mb-6">
                <div className="flex flex-col gap-2">
                    <label className="text-sm text-gray-300">Numbers (1-50)</label>
                    <div className="flex gap-2">
                        {currentNumbers.map((num, i) => (
                            <input
                                key={`num-${i}`}
                                type="number"
                                min="1"
                                max="50"
                                value={num}
                                onChange={(e) => handleNumberChange(i, e.target.value)}
                                className="w-full h-12 rounded-lg bg-white/5 border border-white/10 text-center text-white focus:border-yellow-400 focus:outline-none transition-colors"
                                placeholder={(i + 1).toString()}
                            />
                        ))}
                    </div>
                </div>

                <div className="flex flex-col gap-2">
                    <label className="text-sm text-gray-300">Stars (1-12)</label>
                    <div className="flex gap-2">
                        {currentStars.map((star, i) => (
                            <input
                                key={`star-${i}`}
                                type="number"
                                min="1"
                                max="12"
                                value={star}
                                onChange={(e) => handleStarChange(i, e.target.value)}
                                className="w-full h-12 rounded-lg bg-white/5 border border-white/10 text-center text-yellow-400 font-bold focus:border-yellow-400 focus:outline-none transition-colors"
                                placeholder={`★${i + 1}`}
                            />
                        ))}
                    </div>
                </div>

                {error && <p className="text-red-400 text-sm">{error}</p>}

                <button
                    onClick={addBet}
                    className="w-full py-3 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg text-black font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                >
                    <Plus className="w-5 h-5" />
                    Add Bet
                </button>
            </div>

            <div className="space-y-3">
                {bets.map((bet) => (
                    <div
                        key={bet.id}
                        className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10"
                    >
                        <div className="flex items-center gap-4">
                            <div className="flex gap-2">
                                {bet.numbers.map((n) => (
                                    <span
                                        key={n}
                                        className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-sm font-medium text-white"
                                    >
                                        {n}
                                    </span>
                                ))}
                            </div>
                            <div className="w-px h-8 bg-white/10" />
                            <div className="flex gap-2">
                                {bet.stars.map((s) => (
                                    <span
                                        key={s}
                                        className="w-8 h-8 rounded-full bg-yellow-400/20 flex items-center justify-center text-sm font-bold text-yellow-400"
                                    >
                                        {s}
                                    </span>
                                ))}
                            </div>
                        </div>
                        <button
                            onClick={() => removeBet(bet.id)}
                            className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                        >
                            <Trash2 className="w-5 h-5" />
                        </button>
                    </div>
                ))}
                {bets.length === 0 && (
                    <p className="text-center text-gray-400 py-4">No bets added yet.</p>
                )}
            </div>
        </div>
    );
}
