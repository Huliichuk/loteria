"use client";

import { useState, useEffect, useCallback } from "react";
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

    const stableOnBetsChange = useCallback(onBetsChange, []);

    // Load bets from localStorage on mount
    useEffect(() => {
        const savedBets = localStorage.getItem("userBets");
        if (savedBets) {
            try {
                const parsed = JSON.parse(savedBets);
                setBets(parsed);
                stableOnBetsChange(parsed);
            } catch (e) {
                console.error("Failed to parse bets", e);
            }
        }
    }, [stableOnBetsChange]);

    // Save bets to localStorage whenever they change
    useEffect(() => {
        localStorage.setItem("userBets", JSON.stringify(bets));
        stableOnBetsChange(bets);
    }, [bets, stableOnBetsChange]);

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
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 shadow-2xl border border-white/10">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-yellow-500/20 rounded-xl">
                    <Ticket className="w-6 h-6 text-yellow-400" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-white">Your Bets</h2>
                    <p className="text-sm text-gray-400">Add your lucky numbers</p>
                </div>
            </div>

            {/* Input Section */}
            <div className="space-y-5 mb-6">
                {/* Numbers Input */}
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-3">
                        Numbers (1-50)
                    </label>
                    <div className="grid grid-cols-5 gap-2">
                        {currentNumbers.map((num, i) => (
                            <input
                                key={`num-${i}`}
                                type="number"
                                min="1"
                                max="50"
                                value={num}
                                onChange={(e) => handleNumberChange(i, e.target.value)}
                                className="w-full h-12 rounded-xl bg-white/5 border border-white/10 text-center text-white text-lg font-semibold 
                           focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all
                           placeholder:text-gray-600"
                                placeholder={`${i + 1}`}
                            />
                        ))}
                    </div>
                </div>

                {/* Stars Input */}
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-3">
                        Stars (1-12)
                    </label>
                    <div className="grid grid-cols-2 gap-2 max-w-[200px]">
                        {currentStars.map((star, i) => (
                            <input
                                key={`star-${i}`}
                                type="number"
                                min="1"
                                max="12"
                                value={star}
                                onChange={(e) => handleStarChange(i, e.target.value)}
                                className="w-full h-12 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-center text-yellow-400 text-lg font-bold 
                           focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20 focus:outline-none transition-all
                           placeholder:text-yellow-600/50"
                                placeholder={`★${i + 1}`}
                            />
                        ))}
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl">
                        <p className="text-red-400 text-sm font-medium">{error}</p>
                    </div>
                )}

                {/* Add Button */}
                <button
                    onClick={addBet}
                    className="w-full py-3.5 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl text-black font-bold text-base
                     flex items-center justify-center gap-2 hover:from-yellow-400 hover:to-orange-400 
                     transition-all shadow-lg shadow-orange-500/25 active:scale-[0.98]"
                >
                    <Plus className="w-5 h-5" />
                    Add Bet
                </button>
            </div>

            {/* Bets List */}
            <div className="space-y-3">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-400">
                        Active Bets ({bets.length})
                    </span>
                </div>

                {bets.length > 0 ? (
                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                        {bets.map((bet, index) => (
                            <div
                                key={bet.id}
                                className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10 
                           hover:bg-white/10 transition-colors group"
                            >
                                <div className="flex items-center gap-4">
                                    <span className="text-xs font-medium text-gray-500 w-6">#{index + 1}</span>
                                    <div className="flex items-center gap-3">
                                        {/* Numbers */}
                                        <div className="flex gap-1.5">
                                            {bet.numbers.map((n, idx) => (
                                                <span
                                                    key={idx}
                                                    className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center 
                                     text-sm font-bold text-blue-300"
                                                >
                                                    {n}
                                                </span>
                                            ))}
                                        </div>
                                        {/* Separator */}
                                        <div className="w-px h-6 bg-white/10" />
                                        {/* Stars */}
                                        <div className="flex gap-1.5">
                                            {bet.stars.map((s, idx) => (
                                                <span
                                                    key={idx}
                                                    className="w-8 h-8 rounded-lg bg-yellow-500/20 flex items-center justify-center 
                                     text-sm font-bold text-yellow-400"
                                                >
                                                    {s}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => removeBet(bet.id)}
                                    className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all 
                             opacity-0 group-hover:opacity-100"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8 border-2 border-dashed border-white/10 rounded-xl">
                        <Ticket className="w-10 h-10 text-gray-600 mx-auto mb-2" />
                        <p className="text-gray-500 text-sm">No bets added yet</p>
                        <p className="text-gray-600 text-xs mt-1">Enter your numbers above</p>
                    </div>
                )}
            </div>
        </div>
    );
}
