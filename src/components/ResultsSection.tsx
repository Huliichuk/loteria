"use client";

import { useEffect, useState } from "react";
import { Calendar, RefreshCw } from "lucide-react";
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
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 shadow-xl border border-white/20 h-full">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold flex items-center gap-2 text-white">
                    <Calendar className="w-6 h-6 text-blue-400" />
                    Latest Draw
                </h2>
                <button
                    onClick={fetchLatestResult}
                    className={`p-2 rounded-full hover:bg-white/10 transition-colors ${loading ? "animate-spin" : ""
                        }`}
                >
                    <RefreshCw className="w-5 h-5 text-gray-300" />
                </button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-40">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                </div>
            ) : result ? (
                <div className="space-y-6">
                    <div className="text-center">
                        <p className="text-gray-400 text-sm mb-1">Draw Date</p>
                        <p className="text-xl font-bold text-white">
                            {format(new Date(result.date), "EEEE, d MMMM yyyy")}
                        </p>
                    </div>

                    <div className="flex flex-col items-center gap-4">
                        <div className="flex flex-wrap justify-center gap-3">
                            {result.numbers.map((n) => (
                                <span
                                    key={n}
                                    className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-xl font-bold text-white shadow-lg shadow-blue-500/30"
                                >
                                    {n}
                                </span>
                            ))}
                        </div>
                        <div className="flex gap-3">
                            {result.stars.map((s) => (
                                <span
                                    key={s}
                                    className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-xl font-bold text-white shadow-lg shadow-yellow-500/30"
                                >
                                    {s}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="text-center text-gray-400 py-10">
                    Failed to load results.
                </div>
            )}
        </div>
    );
}
