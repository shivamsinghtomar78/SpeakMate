'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Mic, MicOff, ArrowLeft, MessageSquare, X, Volume2 } from 'lucide-react'
import Link from 'next/link'
import { useVoiceAgent } from '@/hooks/useVoiceAgent'
import { useAuth } from '@/contexts/AuthContext'
import { ProtectedRoute } from '@/components/ProtectedRoute'

function ChatContent() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const level = searchParams.get('level') || 'intermediate'
    const topic = searchParams.get('topic') || 'free_talk'

    const { user } = useAuth()
    const [showFeedback, setShowFeedback] = useState(false)
    const {
        isConnected,
        isListening,
        transcript,
        feedback,
        sessionId,
        error,
        isAISpeaking,
        audioData,
        connect,
        disconnect,
        startListening,
        stopListening,
    } = useVoiceAgent()

    // Calculate volume for visualization
    const averageFrequency = audioData.length > 0
        ? Array.from(audioData).reduce((a, b) => a + b, 0) / audioData.length
        : 0
    const volumeBoost = isListening ? (averageFrequency / 128) * 0.5 : 0

    // Connect on mount
    useEffect(() => {
        connect(level, topic, user?.uid)
        return () => disconnect()
    }, [level, topic, user?.uid])

    const toggleListening = useCallback(() => {
        if (isListening) {
            stopListening()
        } else {
            startListening()
        }
    }, [isListening, startListening, stopListening])

    const latestFeedback = feedback[feedback.length - 1]
    const latestTranscript = transcript.filter(t => t.type === 'final').slice(-3)

    return (
        <main className="h-screen bg-gradient-to-br from-[#0a0a0f] via-[#0f0f1a] to-[#1a1025] flex flex-col overflow-hidden">
            {/* Background Effects */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/3 left-1/3 w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-3xl transition-all duration-1000"
                    style={{ transform: `scale(${1 + volumeBoost * 2})`, opacity: isListening ? 0.3 + volumeBoost : 0.1 }} />
                <div className="absolute bottom-1/3 right-1/3 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-3xl transition-all duration-1000"
                    style={{ transform: `scale(${1 + volumeBoost * 1.5})`, opacity: isListening ? 0.3 + volumeBoost : 0.1 }} />
            </div>

            {/* Top Bar */}
            <header className="relative z-20 flex items-center justify-between px-6 py-4 border-b border-white/5">
                <Link
                    href="/setup"
                    className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                    <span className="hidden md:inline">Back</span>
                </Link>

                <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full bg-white/5 text-xs text-gray-400 capitalize">
                        {level}
                    </span>
                    <span className="px-3 py-1 rounded-full bg-white/5 text-xs text-gray-400 capitalize">
                        {topic.replace('_', ' ')}
                    </span>
                </div>

                <button
                    onClick={() => setShowFeedback(!showFeedback)}
                    className={`p-2 rounded-lg transition-colors ${showFeedback ? 'bg-indigo-500 text-white' : 'text-gray-400 hover:text-white'}`}
                >
                    <MessageSquare className="w-5 h-5" />
                </button>
            </header>

            {/* Main Content */}
            <div className="flex-1 flex relative z-10">
                {/* Center Area - Orb and Controls */}
                <div className="flex-1 flex flex-col items-center justify-center px-4">
                    {/* 3D Animated Orb */}
                    <div className="relative mb-8">
                        <motion.div
                            className={`relative w-48 h-48 md:w-64 md:h-64 transition-all duration-150`}
                            animate={{
                                scale: isListening ? 1 + volumeBoost : 1,
                            }}
                        >
                            {/* Outer rings when listening */}
                            {isListening && (
                                <>
                                    <motion.div
                                        className="absolute inset-0 rounded-full border-2 border-indigo-500/30"
                                        animate={{
                                            scale: [1, 1.2 + volumeBoost],
                                            opacity: [0.5, 0],
                                            borderWidth: [2, 0]
                                        }}
                                        transition={{ duration: 1.5, repeat: Infinity }}
                                    />
                                    <motion.div
                                        className="absolute inset-0 rounded-full border-2 border-purple-500/30"
                                        animate={{
                                            scale: [1, 1.3 + volumeBoost],
                                            opacity: [0.5, 0],
                                            borderWidth: [2, 0]
                                        }}
                                        transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
                                    />
                                </>
                            )}

                            {/* Glow */}
                            <div className={`absolute inset-0 rounded-full blur-3xl transition-all duration-300 ${isListening
                                ? 'bg-gradient-to-br from-indigo-500/50 to-purple-600/50'
                                : 'bg-gradient-to-br from-indigo-500/20 to-purple-600/20'
                                }`}
                                style={{ transform: `scale(${1 + volumeBoost})` }}
                            />

                            {/* Main Orb */}
                            <motion.div
                                className="absolute inset-4 rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 shadow-2xl shadow-purple-500/50 overflow-hidden"
                                animate={{
                                    boxShadow: isListening
                                        ? [`0 25px ${50 + volumeBoost * 100}px -12px rgba(168, 85, 247, ${0.5 + volumeBoost})`, `0 25px ${50 + volumeBoost * 100}px -12px rgba(99, 102, 241, ${0.5 + volumeBoost})`]
                                        : '0 25px 50px -12px rgba(168, 85, 247, 0.25)'
                                }}
                                transition={{ duration: 0.5, repeat: Infinity, repeatType: 'reverse' }}
                            >
                                {/* Inner gradient */}
                                <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/20" />

                                {/* Highlight */}
                                <div className="absolute inset-8 rounded-full bg-gradient-to-br from-white/30 to-transparent" />

                                {/* Audio visualization bars */}
                                {isListening && (
                                    <div className="absolute inset-0 flex items-center justify-center gap-1 px-8">
                                        {[...Array(8)].map((_, i) => {
                                            const freqIndex = Math.floor((i / 8) * audioData.length)
                                            const freqValue = audioData[freqIndex] || 0
                                            const height = 10 + (freqValue / 255) * 60

                                            return (
                                                <motion.div
                                                    key={i}
                                                    className="w-1.5 md:w-2 bg-white/80 rounded-full"
                                                    style={{ height: `${height}%` }}
                                                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                                                />
                                            )
                                        })}
                                    </div>
                                )}

                                {/* AI Speaking indicator */}
                                {isAISpeaking && (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <Volume2 className="w-12 h-12 text-white animate-pulse" />
                                    </div>
                                )}
                            </motion.div>
                        </motion.div>
                    </div>

                    {/* Status Text */}
                    <motion.p
                        key={isListening ? 'listening' : 'ready'}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-lg text-gray-400 mb-8"
                    >
                        {!isConnected ? 'Connecting...' : isListening ? "I'm listening..." : 'Tap to speak'}
                    </motion.p>

                    {/* Mic Button */}
                    <motion.button
                        onClick={toggleListening}
                        disabled={!isConnected}
                        className={`
                            relative w-16 h-16 rounded-full flex items-center justify-center
                            transition-all duration-300 disabled:opacity-50
                            ${isListening
                                ? 'bg-red-500 hover:bg-red-600'
                                : 'bg-white/10 hover:bg-white/20 border border-white/20'
                            }
                        `}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        {isListening ? (
                            <MicOff className="w-6 h-6 text-white" />
                        ) : (
                            <Mic className="w-6 h-6 text-white" />
                        )}
                    </motion.button>

                    {/* Recent Transcript */}
                    <div className="mt-8 max-w-md w-full space-y-2">
                        <AnimatePresence mode="popLayout">
                            {latestTranscript.map((item, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    className="px-4 py-3 rounded-xl bg-white/5 border border-white/10"
                                >
                                    <p className="text-white text-sm">{item.text}</p>
                                    {item.confidence && (
                                        <p className="text-xs text-gray-500 mt-1">
                                            {Math.round(item.confidence * 100)}% confidence
                                        </p>
                                    )}
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Feedback Sidebar */}
                <AnimatePresence>
                    {showFeedback && (
                        <motion.aside
                            initial={{ x: '100%', opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: '100%', opacity: 0 }}
                            transition={{ type: 'spring', damping: 20 }}
                            className="w-80 md:w-96 h-full bg-black/40 backdrop-blur-xl border-l border-white/10 overflow-y-auto"
                        >
                            <div className="p-4 border-b border-white/10 flex items-center justify-between">
                                <h2 className="font-semibold text-white">AI Feedback</h2>
                                <button
                                    onClick={() => setShowFeedback(false)}
                                    className="p-1 text-gray-400 hover:text-white"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="p-4 space-y-4">
                                {feedback.length === 0 ? (
                                    <p className="text-gray-500 text-center py-8">
                                        Start speaking to get feedback...
                                    </p>
                                ) : (
                                    feedback.slice(-5).map((item, index) => (
                                        <div key={index} className="space-y-2">
                                            <div className="p-3 rounded-lg bg-indigo-500/20 border border-indigo-500/30">
                                                <p className="text-white text-sm">{item.text}</p>
                                            </div>

                                            {item.grammar_corrections?.length > 0 && (
                                                <div className="p-2 rounded bg-yellow-500/10 border border-yellow-500/20">
                                                    <p className="text-xs text-yellow-400 font-medium mb-1">Grammar</p>
                                                    {item.grammar_corrections.map((c, i) => (
                                                        <p key={i} className="text-xs text-gray-300">
                                                            <span className="line-through text-red-400">{c.original}</span>
                                                            {' → '}
                                                            <span className="text-green-400">{c.corrected}</span>
                                                        </p>
                                                    ))}
                                                </div>
                                            )}

                                            {item.follow_up_question && (
                                                <div className="p-2 rounded bg-purple-500/10 border border-purple-500/20">
                                                    <p className="text-xs text-purple-400">💬 {item.follow_up_question}</p>
                                                </div>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </motion.aside>
                    )}
                </AnimatePresence>
            </div>

            {/* Error Toast */}
            <AnimatePresence>
                {error && (
                    <motion.div
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 100, opacity: 0 }}
                        className="fixed bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 text-sm"
                    >
                        {error}
                    </motion.div>
                )}
            </AnimatePresence>
        </main>
    )
}

export default function ChatPage() {
    return (
        <ProtectedRoute>
            <Suspense fallback={
                <div className="h-screen bg-[#0a0a0f] flex items-center justify-center">
                    <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                </div>
            }>
                <ChatContent />
            </Suspense>
        </ProtectedRoute>
    )
}
