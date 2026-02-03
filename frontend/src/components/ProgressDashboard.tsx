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
                <div className="bg-gray-800/50 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
                        <Clock className="w-4 h-4" />
                        Duration
                    </div>
                    <p className="text-2xl font-bold text-white">
                        {formatDuration(stats.duration)}
                    </p>
                </div>

                {/* Turns */}
                <div className="bg-gray-800/50 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
                        <MessageSquare className="w-4 h-4" />
                        Exchanges
                    </div>
                    <p className="text-2xl font-bold text-white">
                        {stats.turns}
                    </p>
                </div>

                {/* Confidence */}
                <div className="bg-gray-800/50 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
                        <Target className="w-4 h-4" />
                        Avg. Confidence
                    </div>
                    <p className={`text-2xl font-bold ${getConfidenceColor(stats.avgConfidence)}`}>
                        {stats.avgConfidence}%
                    </p>
                </div>

                {/* Mistakes */}
                <div className="bg-gray-800/50 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
                        <AlertTriangle className="w-4 h-4" />
                        Corrections
                    </div>
                    <p className="text-2xl font-bold text-yellow-400">
                        {stats.grammarMistakes}
                    </p>
                </div>
            </div>

            {/* Confidence bar */}
            <div className="mt-4">
                <div className="flex justify-between text-sm text-gray-400 mb-1">
                    <span>Speaking Confidence</span>
                    <span>{stats.avgConfidence}%</span>
                </div>
                <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${stats.avgConfidence}%` }}
                        transition={{ duration: 0.5 }}
                        className={`h-full rounded-full ${stats.avgConfidence >= 80
                                ? 'bg-green-500'
                                : stats.avgConfidence >= 60
                                    ? 'bg-yellow-500'
                                    : 'bg-red-500'
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
