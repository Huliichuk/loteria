"use client";

import { useEffect, useState } from "react";
import { Calendar, RefreshCw, Trophy } from "lucide-react";
import { format } from "date-fns";

interface DrawResult {
    date: string;
    numbers: number[];
    stars: number[];
}

export default function ResultsSection() {
    const [result, setResult] = useState<DrawResult | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchLatestResult = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/latest");
            if (res.ok) {
                const data = await res.json();
                setResult(data);
            }
        } catch (error) {
            console.error("Failed to fetch results", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLatestResult();
    }, []);

    return (
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 shadow-2xl border border-white/10">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/20 rounded-xl">
                        <Trophy className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white">Latest Draw</h2>
                        <p className="text-sm text-gray-400">Most recent results</p>
                    </div>
                </div>
                <button
                    onClick={fetchLatestResult}
                    disabled={loading}
                    className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 
                     transition-all disabled:opacity-50"
                >
                    <RefreshCw className={`w-4 h-4 text-gray-400 ${loading ? "animate-spin" : ""}`} />
                </button>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-12">
                    <div className="w-10 h-10 border-3 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                    <p className="text-gray-500 text-sm mt-4">Loading results...</p>
                </div>
            ) : result ? (
                <div className="space-y-6">
                    {/* Date */}
                    <div className="flex items-center gap-2 text-gray-400">
                        <Calendar className="w-4 h-4" />
                        <span className="text-sm font-medium">
                            {format(new Date(result.date), "EEEE, d MMMM yyyy")}
                        </span>
                    </div>

                    {/* Numbers Display */}
                    <div className="space-y-4">
                        {/* Main Numbers */}
                        <div>
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Numbers</p>
                            <div className="flex flex-wrap gap-2">
                                {result.numbers.map((n, idx) => (
                                    <div
                                        key={idx}
                                        className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 
                               flex items-center justify-center text-lg font-bold text-white 
                               shadow-lg shadow-blue-500/30"
                                    >
                                        {n}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Stars */}
                        <div>
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Stars</p>
                            <div className="flex gap-2">
                                {result.stars.map((s, idx) => (
                                    <div
                                        key={idx}
                                        className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 
                               flex items-center justify-center text-lg font-bold text-white 
                               shadow-lg shadow-yellow-500/30"
                                    >
                                        {s}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="text-center py-12">
                    <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Trophy className="w-8 h-8 text-red-400" />
                    </div>
                    <p className="text-gray-400 font-medium">Failed to load results</p>
                    <p className="text-gray-600 text-sm mt-1">Click refresh to try again</p>
                </div>
            )}
        </div>
    );
}
