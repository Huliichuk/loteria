"use client";

import { useState } from "react";
import { Sparkles, Brain, Target, Lightbulb, TrendingUp, Flame, Snowflake } from "lucide-react";

interface Bet {
    id: string;
    numbers: number[];
    stars: number[];
}

interface AIAnalysisProps {
    userBets: Bet[];
}

interface Prediction {
    numbers: number[];
    stars: number[];
    confidence: string;
}

interface AnalysisResult {
    closest_user_bet: string;
    probability_score: number;
    prediction_of_day: number[];
    predictions?: Prediction[];
    hot_numbers?: number[];
    cold_numbers?: number[];
    why: string;
}

export default function AIAnalysisSection({ userBets }: AIAnalysisProps) {
    const [analyzing, setAnalyzing] = useState(false);
    const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
    const [combinationCount, setCombinationCount] = useState(3);

    const runAnalysis = async () => {
        if (userBets.length === 0) {
            alert("Please add some bets first!");
            return;
        }

        setAnalyzing(true);
        try {
            const res = await fetch("/api/ai-analyze", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userBets, combinationCount }),
            });

            if (res.ok) {
                const data = await res.json();
                setAnalysis(data);

                if (data.probability_score > 0.8) {
                    alert("⚠️ High probability bet detected! Check the analysis details.");
                }
            }
        } catch (error) {
            console.error("Analysis failed", error);
        } finally {
            setAnalyzing(false);
        }
    };

    return (
        <div className="bg-gradient-to-br from-purple-900/40 to-indigo-900/40 backdrop-blur-xl rounded-2xl p-6 shadow-2xl border border-purple-500/20">
            {/* Header */}
            <div className="flex flex-col gap-4 mb-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-purple-500/20 rounded-xl">
                            <Brain className="w-6 h-6 text-purple-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">AI Analysis</h2>
                            <p className="text-sm text-gray-400">GPT-4 powered predictions</p>
                        </div>
                    </div>
                    <button
                        onClick={runAnalysis}
                        disabled={analyzing || userBets.length === 0}
                        className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500
                       rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2 
                       transition-all shadow-lg shadow-purple-500/25 disabled:opacity-50 disabled:cursor-not-allowed
                       active:scale-[0.98]"
                    >
                        <Sparkles className="w-4 h-4" />
                        {analyzing ? "Analyzing..." : "Run Analysis"}
                    </button>
                </div>

                {/* Combination Count Selector */}
                <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/10">
                    <label className="text-sm font-medium text-gray-300 whitespace-nowrap">
                        Generate predictions:
                    </label>
                    <div className="flex items-center gap-2 flex-1">
                        <input
                            type="range"
                            min="1"
                            max="10"
                            value={combinationCount}
                            onChange={(e) => setCombinationCount(parseInt(e.target.value))}
                            className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                        />
                        <span className="w-8 text-center font-bold text-purple-400">{combinationCount}</span>
                    </div>
                </div>
            </div>

            {/* Analysis Results */}
            {analysis ? (
                <div className="space-y-6">
                    {/* Closest Bet Card */}
                    <div className="bg-white/5 rounded-xl p-5 border border-white/10">
                        <div className="flex items-start gap-3 mb-4">
                            <div className="p-2 bg-orange-500/20 rounded-lg mt-0.5">
                                <Target className="w-4 h-4 text-orange-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="text-sm font-semibold text-orange-300 mb-1">Closest Match</h3>
                                <p className="text-white font-medium leading-relaxed">{analysis.closest_user_bet}</p>
                            </div>
                        </div>

                        {/* Probability Bar */}
                        <div className="mt-4">
                            <div className="flex items-center justify-between text-xs mb-2">
                                <span className="text-gray-400">Match Score</span>
                                <span className="text-white font-semibold">
                                    {(analysis.probability_score * 100).toFixed(0)}%
                                </span>
                            </div>
                            <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full transition-all duration-1000"
                                    style={{ width: `${analysis.probability_score * 100}%` }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Hot/Cold Numbers */}
                    {(analysis.hot_numbers || analysis.cold_numbers) && (
                        <div className="grid grid-cols-2 gap-4">
                            {analysis.hot_numbers && analysis.hot_numbers.length > 0 && (
                                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Flame className="w-4 h-4 text-red-400" />
                                        <h3 className="text-sm font-semibold text-red-300">Hot Numbers</h3>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {analysis.hot_numbers.slice(0, 6).map((n, idx) => (
                                            <span key={idx} className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center text-xs font-bold text-red-300">
                                                {n}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {analysis.cold_numbers && analysis.cold_numbers.length > 0 && (
                                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Snowflake className="w-4 h-4 text-blue-400" />
                                        <h3 className="text-sm font-semibold text-blue-300">Cold Numbers</h3>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {analysis.cold_numbers.slice(0, 6).map((n, idx) => (
                                            <span key={idx} className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center text-xs font-bold text-blue-300">
                                                {n}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Predictions */}
                    <div className="bg-white/5 rounded-xl p-5 border border-white/10">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-yellow-500/20 rounded-lg">
                                <TrendingUp className="w-4 h-4 text-yellow-400" />
                            </div>
                            <h3 className="text-sm font-semibold text-yellow-300">
                                AI Predictions ({analysis.predictions?.length || 1})
                            </h3>
                        </div>

                        <div className="space-y-3">
                            {analysis.predictions && analysis.predictions.length > 0 ? (
                                analysis.predictions.map((pred, i) => (
                                    <div key={i} className="flex flex-wrap items-center gap-3 p-3 bg-white/5 rounded-lg">
                                        <span className="text-xs font-medium text-gray-500 w-6">#{i + 1}</span>

                                        {/* Numbers */}
                                        <div className="flex gap-1.5">
                                            {pred.numbers.map((n, idx) => (
                                                <span
                                                    key={idx}
                                                    className="w-9 h-9 rounded-lg bg-purple-600/50 border border-purple-500/30
                                     flex items-center justify-center font-bold text-white text-sm"
                                                >
                                                    {n}
                                                </span>
                                            ))}
                                        </div>

                                        <div className="w-px h-6 bg-white/10" />

                                        {/* Stars */}
                                        <div className="flex gap-1.5">
                                            {pred.stars.map((s, idx) => (
                                                <span
                                                    key={idx}
                                                    className="w-9 h-9 rounded-lg bg-yellow-500/50 border border-yellow-500/30
                                     flex items-center justify-center font-bold text-white text-sm"
                                                >
                                                    {s}
                                                </span>
                                            ))}
                                        </div>

                                        <span className="ml-auto text-xs font-medium text-gray-400">
                                            {(parseFloat(pred.confidence) * 100).toFixed(0)}%
                                        </span>
                                    </div>
                                ))
                            ) : analysis.prediction_of_day && (
                                <div className="flex flex-wrap items-center gap-3">
                                    <div className="flex gap-1.5">
                                        {analysis.prediction_of_day.slice(0, 5).map((n, idx) => (
                                            <span
                                                key={idx}
                                                className="w-10 h-10 rounded-xl bg-purple-600/50 border border-purple-500/30
                                   flex items-center justify-center font-bold text-white text-sm"
                                            >
                                                {n}
                                            </span>
                                        ))}
                                    </div>
                                    <div className="w-px h-8 bg-white/10" />
                                    <div className="flex gap-1.5">
                                        {analysis.prediction_of_day.slice(5).map((s, idx) => (
                                            <span
                                                key={idx}
                                                className="w-10 h-10 rounded-xl bg-yellow-500/50 border border-yellow-500/30
                                   flex items-center justify-center font-bold text-white text-sm"
                                            >
                                                {s}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Reasoning Card */}
                    <div className="bg-white/5 rounded-xl p-5 border border-white/10">
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-blue-500/20 rounded-lg mt-0.5">
                                <Lightbulb className="w-4 h-4 text-blue-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="text-sm font-semibold text-blue-300 mb-2">AI Reasoning</h3>
                                <p className="text-gray-300 text-sm leading-relaxed">{analysis.why}</p>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                /* Empty State */
                <div className="text-center py-16">
                    <div className="w-20 h-20 bg-purple-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Sparkles className="w-10 h-10 text-purple-400/50" />
                    </div>
                    <h3 className="text-white font-semibold mb-2">Ready to Analyze</h3>
                    <p className="text-gray-400 text-sm max-w-xs mx-auto leading-relaxed">
                        {userBets.length === 0
                            ? "Add some bets first, then run AI analysis to get predictions"
                            : "Click 'Run Analysis' to get AI-powered predictions based on historical data"
                        }
                    </p>
                </div>
            )}
        </div>
    );
}
