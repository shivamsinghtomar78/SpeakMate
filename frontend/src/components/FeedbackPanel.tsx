'use client'

import { useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, BookOpen, Lightbulb, Volume2 } from 'lucide-react'

interface FeedbackItem {
    text: string
    grammar_corrections: {
        original: string
        corrected: string
        explanation: string
    }[]
    vocabulary_suggestions: {
        word: string
        definition: string
        usage_example: string
    }[]
    pronunciation_tips: {
        word: string
        phonetic: string
        tip: string
        confidence_score: number
    }[]
    follow_up_question?: string
    timestamp: Date
}

interface FeedbackPanelProps {
    feedback: FeedbackItem[]
}

export default function FeedbackPanel({ feedback }: FeedbackPanelProps) {
    const scrollRef = useRef<HTMLDivElement>(null)
    const latestFeedback = feedback[feedback.length - 1]

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [feedback])

    return (
        <div className="card max-h-[500px] flex flex-col">
            <h2 className="text-lg font-semibold text-gray-300 mb-4 flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-primary-400" />
                AI Feedback
            </h2>

            <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-4 pr-2">
                <AnimatePresence mode="popLayout">
                    {feedback.length === 0 ? (
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-gray-500 text-center py-8"
                        >
                            Start speaking to get feedback...
                        </motion.p>
                    ) : (
                        feedback.map((item, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.3 }}
                                className="space-y-3"
                            >
                                {/* Main feedback text */}
                                <div className="bg-gradient-to-r from-primary-900/50 to-accent-900/30 p-4 rounded-lg border border-primary-500/30">
                                    <p className="text-white leading-relaxed">{item.text}</p>
                                </div>

                                {/* Grammar Corrections */}
                                {item.grammar_corrections.length > 0 && (
                                    <div className="bg-yellow-900/20 p-3 rounded-lg border border-yellow-500/30">
                                        <div className="flex items-center gap-2 mb-2">
                                            <BookOpen className="w-4 h-4 text-yellow-400" />
                                            <span className="text-sm font-medium text-yellow-400">Grammar Tips</span>
                                        </div>
                                        {item.grammar_corrections.map((correction, i) => (
                                            <div key={i} className="text-sm space-y-1">
                                                <p className="text-gray-300">
                                                    <span className="line-through text-red-400">{correction.original}</span>
                                                    {' → '}
                                                    <span className="text-green-400">{correction.corrected}</span>
                                                </p>
                                                <p className="text-gray-500 text-xs">{correction.explanation}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Vocabulary Suggestions */}
                                {item.vocabulary_suggestions.length > 0 && (
                                    <div className="bg-blue-900/20 p-3 rounded-lg border border-blue-500/30">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Lightbulb className="w-4 h-4 text-blue-400" />
                                            <span className="text-sm font-medium text-blue-400">New Words</span>
                                        </div>
                                        {item.vocabulary_suggestions.map((vocab, i) => (
                                            <div key={i} className="text-sm mb-2">
                                                <p className="text-white font-medium">{vocab.word}</p>
                                                <p className="text-gray-400">{vocab.definition}</p>
                                                <p className="text-gray-500 italic text-xs">"{vocab.usage_example}"</p>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Pronunciation Tips */}
                                {item.pronunciation_tips.length > 0 && (
                                    <div className="bg-green-900/20 p-3 rounded-lg border border-green-500/30">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Volume2 className="w-4 h-4 text-green-400" />
                                            <span className="text-sm font-medium text-green-400">Pronunciation</span>
                                        </div>
                                        {item.pronunciation_tips.map((tip, i) => (
                                            <div key={i} className="text-sm mb-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-white font-medium">{tip.word}</span>
                                                    <span className="text-gray-400 font-mono text-xs">{tip.phonetic}</span>
                                                    <span className={`
                            text-xs px-1.5 py-0.5 rounded
                            ${tip.confidence_score >= 0.8
                                                            ? 'bg-green-800 text-green-300'
                                                            : tip.confidence_score >= 0.6
                                                                ? 'bg-yellow-800 text-yellow-300'
                                                                : 'bg-red-800 text-red-300'
                                                        }
                          `}>
                                                        {Math.round(tip.confidence_score * 100)}%
                                                    </span>
                                                </div>
                                                <p className="text-gray-500 text-xs">{tip.tip}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Follow-up Question */}
                                {item.follow_up_question && (
                                    <div className="p-3 bg-accent-900/20 rounded-lg border border-accent-500/30">
                                        <p className="text-sm text-accent-300 font-medium">
                                            💬 {item.follow_up_question}
                                        </p>
                                    </div>
                                )}

                                {index < feedback.length - 1 && (
                                    <hr className="border-gray-700" />
                                )}
                            </motion.div>
                        ))
                    )}
                </AnimatePresence>
            </div>
        </div>
    )
}
