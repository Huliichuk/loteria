"use client";

import { useState } from "react";
import BettingSection from "@/components/BettingSection";
import ResultsSection from "@/components/ResultsSection";
import AIAnalysisSection from "@/components/AIAnalysisSection";

interface Bet {
  id: string;
  numbers: number[];
  stars: number[];
}

export default function Home() {
  const [userBets, setUserBets] = useState<Bet[]>([]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-black text-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 mb-4">
            Euromillions AI Predictor
          </h1>
          <p className="text-gray-400 text-lg">
            Maximize your winning chances with AI-powered analysis
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-8">
            <ResultsSection />
            <BettingSection onBetsChange={setUserBets} />
          </div>

          <div className="lg:sticky lg:top-8 h-fit">
            <AIAnalysisSection userBets={userBets} />
          </div>
        </div>
      </div>
    </main>
  );
}
