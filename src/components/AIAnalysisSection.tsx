"use client";

import { useState } from "react";
import { Sparkles, Brain, AlertTriangle } from "lucide-react";

interface Bet {
    id: string;
    numbers: number[];
    stars: number[];
}

interface AIAnalysisProps {
    userBets: Bet[];
}

interface AnalysisResult {
    closest_user_bet: string;
    probability_score: number;
    prediction_of_day: number[];
    why: string;
}

export default function AIAnalysisSection({ userBets }: AIAnalysisProps) {
    const [analyzing, setAnalyzing] = useState(false);
    const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);

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
                body: JSON.stringify({ userBets }),
            });

            if (res.ok) {
                const data = await res.json();
                setAnalysis(data);

                // Check for high probability to show alert
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
        <div className="bg-gradient-to-br from-purple-900/50 to-indigo-900/50 backdrop-blur-md rounded-2xl p-6 shadow-xl border border-purple-500/30">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold flex items-center gap-2 text-white">
                    <Brain className="w-6 h-6 text-purple-400" />
                    AI Analysis
                </h2>
                <button
                    onClick={runAnalysis}
                    disabled={analyzing}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg text-white font-semibold flex items-center gap-2 transition-colors disabled:opacity-50"
                >
                    <Sparkles className="w-4 h-4" />
                    {analyzing ? "Analyzing..." : "Run Analysis"}
                </button>
            </div>

            {analysis && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                        <h3 className="text-purple-300 font-semibold mb-2 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4" />
                            Closest User Bet
                        </h3>
                        <p className="text-white text-lg">{analysis.closest_user_bet}</p>
                        <div className="mt-2 w-full bg-gray-700 rounded-full h-2">
                            <div
                                className="bg-gradient-to-r from-green-400 to-emerald-500 h-2 rounded-full transition-all duration-1000"
                                style={{ width: `${analysis.probability_score * 100}%` }}
                            />
                        </div>
                        <p className="text-right text-xs text-gray-400 mt-1">
                            Probability Score: {(analysis.probability_score * 100).toFixed(1)}%
                        </p>
                    </div>

                    <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                        <h3 className="text-yellow-300 font-semibold mb-3">Prediction of the Day</h3>
                        <div className="flex flex-wrap gap-2">
                            {analysis.prediction_of_day.slice(0, 5).map((n) => (
                                <span key={n} className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center font-bold text-white">
                                    {n}
                                </span>
                            ))}
                            <div className="w-px h-10 bg-white/20 mx-1" />
                            {analysis.prediction_of_day.slice(5).map((n) => (
                                <span key={n} className="w-10 h-10 rounded-full bg-yellow-500 flex items-center justify-center font-bold text-white">
                                    {n}
                                </span>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                        <h3 className="text-blue-300 font-semibold mb-2">AI Reasoning</h3>
                        <p className="text-gray-300 text-sm leading-relaxed">
                            {analysis.why}
                        </p>
                    </div>
                </div>
            )}

            {!analysis && !analyzing && (
                <div className="text-center text-gray-400 py-8">
                    <Sparkles className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p>Run AI analysis to get predictions and insights based on historical data.</p>
                </div>
            )}
        </div>
    );
}
