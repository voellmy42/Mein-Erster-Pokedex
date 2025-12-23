import React from 'react';
import { TeamAnalysisResult as LLMTeamAnalysis } from '../services/geminiService';
import { TypeBadge } from './TypeBadge';

interface TeamAnalysisResultProps {
    analysis: LLMTeamAnalysis | null;
}

export const TeamAnalysisResult: React.FC<TeamAnalysisResultProps> = ({ analysis }) => {
    if (!analysis) {
        return (
            <div className="bg-white/80 backdrop-blur-md rounded-3xl p-8 text-center border border-gray-100 shadow-sm">
                <p className="text-gray-400 font-bold mb-2">Noch keine Analyse vorhanden.</p>
                <p className="text-sm text-gray-400">Klicke auf "Team Analysieren" um einen Bericht zu erhalten.</p>
            </div>
        );
    }

    const getScoreColor = (score: number) => {
        if (score >= 8) return 'bg-green-500';
        if (score >= 5) return 'bg-yellow-500';
        return 'bg-red-500';
    };

    return (
        <div className="bg-white/80 backdrop-blur-md rounded-3xl p-5 shadow-sm border border-white animate-fade-in space-y-6">

            {/* Header with Score */}
            <div className="flex items-start justify-between">
                <div>
                    <h3 className="text-lg font-black text-gray-800 flex items-center gap-2">
                        <span className="text-2xl">🧠</span> KI-Analyse
                    </h3>
                    <p className="text-sm text-gray-500 font-medium">Strategischer Bericht</p>
                </div>
                <div className={`w-12 h-12 rounded-2xl ${getScoreColor(analysis.score)} text-white flex flex-col items-center justify-center shadow-md`}>
                    <span className="font-black text-xl leading-none">{analysis.score}</span>
                    <span className="text-[8px] font-bold uppercase opacity-80">Score</span>
                </div>
            </div>

            {/* Summary */}
            <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100">
                <p className="text-gray-700 leading-relaxed font-medium text-sm">
                    {analysis.summary}
                </p>
            </div>

            {/* Recommendation / Suggestion */}
            {analysis.suggestion && (
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-4 rounded-2xl border border-indigo-100 relative overflow-hidden group">
                    {/* Decorative Sparkles */}
                    <div className="absolute top-0 right-0 -mr-4 -mt-4 w-16 h-16 bg-yellow-300 rounded-full blur-2xl opacity-20 group-hover:opacity-40 transition-opacity"></div>

                    <h4 className="text-xs font-black text-indigo-600 uppercase tracking-widest mb-3 flex items-center gap-2 relative z-10">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                        Top-Empfehlung
                    </h4>

                    <div className="flex items-center gap-4 mb-3 relative z-10">
                        {/* OUT */}
                        <div className="flex-1 bg-white/60 p-2 rounded-xl border border-red-100 flex flex-col items-center gap-1">
                            <span className="text-[10px] font-black text-red-400 uppercase">Raus</span>
                            <span className="font-bold text-gray-700 text-sm md:text-base">{analysis.suggestion.out}</span>
                        </div>

                        {/* Arrow */}
                        <div className="text-gray-400">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                        </div>

                        {/* IN */}
                        <div className="flex-1 bg-white/80 p-2 rounded-xl border border-green-100 flex flex-col items-center gap-1 shadow-sm">
                            <span className="text-[10px] font-black text-green-500 uppercase">Rein</span>
                            <span className="font-bold text-gray-800 text-sm md:text-base">{analysis.suggestion.in}</span>
                        </div>
                    </div>

                    <p className="text-xs text-indigo-800 font-medium leading-relaxed relative z-10">
                        <span className="font-bold">Grund:</span> {analysis.suggestion.reason}
                    </p>
                </div>
            )}

            {/* Strengths */}
            <div>
                <h4 className="text-xs font-black text-green-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                    Stärken
                </h4>
                <div className="space-y-3">
                    {analysis.strengths.map((item, idx) => (
                        <div key={idx} className="flex gap-3 bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                            <div className="shrink-0">
                                <TypeBadge type={item.type} size="sm" />
                            </div>
                            <p className="text-xs font-medium text-gray-600 self-center">{item.reason}</p>
                        </div>
                    ))}
                    {analysis.strengths.length === 0 && <p className="text-gray-400 text-sm italic">Keine besonderen Stärken erkannt.</p>}
                </div>
            </div>

            {/* Weaknesses */}
            <div>
                <h4 className="text-xs font-black text-red-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    Risiken
                </h4>
                <div className="space-y-3">
                    {analysis.weaknesses.map((item, idx) => (
                        <div key={idx} className="flex gap-3 bg-red-50 p-3 rounded-xl border border-red-100">
                            <div className="shrink-0">
                                <TypeBadge type={item.type} size="sm" />
                            </div>
                            <p className="text-xs font-medium text-red-800 self-center">{item.reason}</p>
                        </div>
                    ))}
                    {analysis.weaknesses.length === 0 && <p className="text-gray-400 text-sm italic">Keine offensichtlichen Schwächen.</p>}
                </div>
            </div>

        </div>
    );
};
