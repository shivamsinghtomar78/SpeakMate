'use client'

import { Mic, MicOff, Square, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface VoiceInterfaceProps {
    isConnected: boolean
    isListening: boolean
    onStartListening: () => void
    onStopListening: () => void
    onEndSession: () => void
}

export default function VoiceInterface({
    isConnected,
    isListening,
    onStartListening,
    onStopListening,
    onEndSession,
}: VoiceInterfaceProps) {
    return (
        <div className="card text-center flex flex-col items-center justify-center p-12 relative overflow-hidden">
            {/* Background Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/20 rounded-full blur-[80px] pointer-events-none" />

            <h2 className="text-xl font-medium mb-12 text-gray-200 tracking-tight">
                {isListening ? "I'm listening..." : "Ready to talk?"}
            </h2>

            <div className="flex flex-col items-center gap-12 relative z-10">
                {/* Premium Voice Orb */}
                <div className="relative">
                    {/* Multi-layered glow */}
                    <AnimatePresence>
                        {isListening && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                className="absolute -inset-8 rounded-full bg-primary/20 blur-2xl animate-pulse"
                            />
                        )}
                    </AnimatePresence>

                    <motion.button
                        onClick={isListening ? onStopListening : onStartListening}
                        disabled={!isConnected}
                        className={`
                            relative w-32 h-32 rounded-full flex items-center justify-center
                            transition-all duration-500 disabled:opacity-50 disabled:cursor-not-allowed
                            ${isListening
                                ? 'bg-error scale-110 shadow-[0_0_50px_rgba(239,68,68,0.4)]'
                                : 'bg-primary shadow-[0_0_40px_rgba(99,102,241,0.4)] hover:shadow-[0_0_60px_rgba(99,102,241,0.6)]'
                            }
                        `}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        {!isConnected ? (
                            <Loader2 className="w-12 h-12 text-white animate-spin" />
                        ) : isListening ? (
                            <MicOff className="w-12 h-12 text-white" />
                        ) : (
                            <Mic className="w-12 h-12 text-white" />
                        )}

                        {/* Outer rotating ring */}
                        {isListening && (
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                                className="absolute -inset-2 rounded-full border-2 border-dashed border-white/20"
                            />
                        )}
                    </motion.button>
                </div>

                <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-400">
                        {!isConnected
                            ? 'Establishing connection...'
                            : isListening
                                ? 'Recording your voice'
                                : 'Tap to start practicing'
                        }
                    </p>
                    {isListening && (
                        <div className="flex items-center justify-center gap-1.5 h-6">
                            {[...Array(6)].map((_, i) => (
                                <motion.div
                                    key={i}
                                    className="w-1 bg-white/60 rounded-full"
                                    animate={{
                                        height: [4, 16, 4],
                                    }}
                                    transition={{
                                        duration: 0.6,
                                        repeat: Infinity,
                                        delay: i * 0.1,
                                    }}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* Pill-shaped Control buttons */}
                <div className="flex gap-4 mt-4">
                    <button
                        onClick={onEndSession}
                        className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-sm font-medium text-gray-300 transition-all duration-300"
                    >
                        <Square className="w-4 h-4" />
                        End Session
                    </button>
                </div>
            </div>
        </div>
    )
}
