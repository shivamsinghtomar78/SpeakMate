'use client'

import { TrendingUp, Clock, MessageSquare, Target, AlertTriangle } from 'lucide-react'
import { motion } from 'framer-motion'

interface ProgressData {
    duration: number
    turns: number
    avgConfidence: number
    grammarMistakes: number
}

interface ProgressDashboardProps {
    sessionId: string | null
    progress: ProgressData | null
}

export default function ProgressDashboard({
    sessionId,
    progress,
}: ProgressDashboardProps) {
    // Default values if no progress data
    const stats = {
        duration: progress?.duration || 0,
        turns: progress?.turns || 0,
        avgConfidence: progress?.avgConfidence || 0,
        grammarMistakes: progress?.grammarMistakes || 0,
    }

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    const getConfidenceColor = (confidence: number) => {
        if (confidence >= 80) return 'text-green-400'
        if (confidence >= 60) return 'text-yellow-400'
        return 'text-red-400'
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card"
        >
            <h2 className="text-lg font-semibold text-gray-300 mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary-400" />
                Session Progress
            </h2>

            <div className="grid grid-cols-2 gap-4">
                {/* Duration */}
                <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 transition-colors hover:bg-white/[0.04]">
                    <div className="flex items-center gap-2 text-gray-400 text-xs font-medium uppercase tracking-wider mb-2">
                        <Clock className="w-3.5 h-3.5" />
                        Duration
                    </div>
                    <p className="text-3xl font-bold text-white tracking-tight">
                        {formatDuration(stats.duration)}
                    </p>
                </div>

                {/* Turns */}
                <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 transition-colors hover:bg-white/[0.04]">
                    <div className="flex items-center gap-2 text-gray-400 text-xs font-medium uppercase tracking-wider mb-2">
                        <MessageSquare className="w-3.5 h-3.5" />
                        Exchanges
                    </div>
                    <p className="text-3xl font-bold text-white tracking-tight">
                        {stats.turns}
                    </p>
                </div>

                {/* Confidence */}
                <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 transition-colors hover:bg-white/[0.04]">
                    <div className="flex items-center gap-2 text-gray-400 text-xs font-medium uppercase tracking-wider mb-2">
                        <Target className="w-3.5 h-3.5" />
                        Avg. Confidence
                    </div>
                    <p className={`text-3xl font-bold tracking-tight ${getConfidenceColor(stats.avgConfidence)}`}>
                        {stats.avgConfidence}%
                    </p>
                </div>

                {/* Mistakes */}
                <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 transition-colors hover:bg-white/[0.04]">
                    <div className="flex items-center gap-2 text-gray-400 text-xs font-medium uppercase tracking-wider mb-2">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Corrections
                    </div>
                    <p className="text-3xl font-bold text-yellow-500 tracking-tight">
                        {stats.grammarMistakes}
                    </p>
                </div>
            </div>

            {/* Confidence bar */}
            <div className="mt-8">
                <div className="flex justify-between text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
                    <span>Performance index</span>
                    <span className={getConfidenceColor(stats.avgConfidence)}>{stats.avgConfidence}%</span>
                </div>
                <div className="h-2.5 bg-white/5 rounded-full overflow-hidden p-[2px]">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${stats.avgConfidence}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className={`h-full rounded-full relative ${stats.avgConfidence >= 80
                            ? 'bg-green-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]'
                            : stats.avgConfidence >= 60
                                ? 'bg-yellow-500 shadow-[0_0_15px_rgba(245,158,11,0.5)]'
                                : 'bg-error shadow-[0_0_15px_rgba(239,68,68,0.5)]'
                            }`}
                    />
                </div>
            </div>

            {/* Tips */}
            <div className="mt-4 p-3 bg-primary-900/20 rounded-lg border border-primary-500/20">
                <p className="text-xs text-primary-300">
                    💡 <strong>Tip:</strong> Speak clearly and at a natural pace for better transcription accuracy.
                </p>
            </div>
        </motion.div>
    )
}
