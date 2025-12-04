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
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-yellow-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8 md:px-6 lg:px-8">
        {/* Header */}
        <header className="text-center mb-12 pt-8">
          <div className="inline-block mb-4">
            <span className="text-6xl">🎰</span>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight mb-4">
            <span className="bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 bg-clip-text text-transparent">
              Euromillions
            </span>
            <br />
            <span className="text-white text-3xl md:text-4xl lg:text-5xl font-bold">
              AI Predictor
            </span>
          </h1>
          <p className="text-gray-400 text-base md:text-lg max-w-xl mx-auto leading-relaxed">
            Maximize your winning chances with AI-powered analysis and pattern recognition
          </p>
        </header>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 lg:gap-8">
          {/* Left Column - Results & Betting */}
          <div className="xl:col-span-5 space-y-6">
            <ResultsSection />
            <BettingSection onBetsChange={setUserBets} />
          </div>

          {/* Right Column - AI Analysis */}
          <div className="xl:col-span-7">
            <div className="xl:sticky xl:top-8">
              <AIAnalysisSection userBets={userBets} />
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-16 pb-8 text-center">
          <p className="text-gray-500 text-sm">
            Powered by OpenAI GPT-4 • Data from Euromillions API
          </p>
        </footer>
      </div>
    </main>
  );
}
