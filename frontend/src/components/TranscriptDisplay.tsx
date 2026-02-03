'use client'

import { useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface TranscriptItem {
    type: 'interim' | 'final'
    text: string
    confidence?: number
    words?: { word: string; confidence: number }[]
    timestamp: Date
}

interface TranscriptDisplayProps {
    transcript: TranscriptItem[]
    isListening: boolean
}

export default function TranscriptDisplay({
    transcript,
    isListening,
}: TranscriptDisplayProps) {
    const scrollRef = useRef<HTMLDivElement>(null)

    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [transcript])

    const getConfidenceColor = (confidence: number) => {
        if (confidence >= 0.9) return 'confidence-high'
        if (confidence >= 0.7) return 'confidence-medium'
        return 'confidence-low'
    }

    return (
        <div className="card">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-300">Your Speech</h2>
                {isListening && (
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                        <span className="text-sm text-red-400">Recording</span>
                    </div>
                )}
            </div>

            <div
                ref={scrollRef}
                className="h-48 overflow-y-auto pr-2 space-y-3"
            >
                <AnimatePresence mode="popLayout">
                    {transcript.length === 0 && !isListening ? (
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-gray-500 text-center py-8"
                        >
                            Your words will appear here as you speak...
                        </motion.p>
                    ) : (
                        transcript.map((item, index) => (
                            <motion.div
                                key={`${index}-${item.type}`}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className={`
                  p-3 rounded-lg
                  ${item.type === 'interim'
                                        ? 'bg-gray-700/50 border border-dashed border-gray-600'
                                        : 'bg-primary-900/30 border border-primary-500/30'
                                    }
                `}
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <p className={`
                    flex-1
                    ${item.type === 'interim' ? 'text-gray-400 italic' : 'text-white'}
                  `}>
                                        {item.text}
                                        {item.type === 'interim' && (
                                            <span className="inline-flex ml-2">
                                                <span className="typing-dot w-1 h-1 bg-gray-400 rounded-full"></span>
                                                <span className="typing-dot w-1 h-1 bg-gray-400 rounded-full mx-1"></span>
                                                <span className="typing-dot w-1 h-1 bg-gray-400 rounded-full"></span>
                                            </span>
                                        )}
                                    </p>

                                    {item.type === 'final' && item.confidence !== undefined && (
                                        <span className={`
                      text-sm font-medium shrink-0
                      ${getConfidenceColor(item.confidence)}
                    `}>
                                            {Math.round(item.confidence * 100)}%
                                        </span>
                                    )}
                                </div>

                                {/* Word-level confidence display */}
                                {item.type === 'final' && item.words && item.words.length > 0 && (
                                    <div className="mt-3 pt-3 border-t border-gray-700">
                                        <p className="text-xs text-gray-500 mb-2">Word confidence:</p>
                                        <div className="flex flex-wrap gap-2">
                                            {item.words.map((word, wordIndex) => (
                                                <span
                                                    key={wordIndex}
                                                    className={`
                            text-sm px-2 py-0.5 rounded
                            ${word.confidence >= 0.9
                                                            ? 'bg-green-900/30 text-green-400'
                                                            : word.confidence >= 0.7
                                                                ? 'bg-yellow-900/30 text-yellow-400'
                                                                : 'bg-red-900/30 text-red-400'
                                                        }
                          `}
                                                    title={`${Math.round(word.confidence * 100)}% confidence`}
                                                >
                                                    {word.word}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        ))
                    )}
                </AnimatePresence>

                {/* Typing indicator when listening */}
                {isListening && transcript.filter(t => t.type === 'interim').length === 0 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex items-center justify-center py-4"
                    >
                        <div className="flex gap-1">
                            <span className="typing-dot w-2 h-2 bg-primary-500 rounded-full"></span>
                            <span className="typing-dot w-2 h-2 bg-primary-500 rounded-full"></span>
                            <span className="typing-dot w-2 h-2 bg-primary-500 rounded-full"></span>
                        </div>
                        <span className="text-gray-500 ml-3 text-sm">Listening...</span>
                    </motion.div>
                )}
            </div>
        </div>
    )
}
