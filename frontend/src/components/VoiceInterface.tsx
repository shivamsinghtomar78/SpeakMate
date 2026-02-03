'use client'

import { Mic, MicOff, Square, Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'

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
        <div className="card text-center">
            <h2 className="text-lg font-semibold mb-6 text-gray-300">
                {isListening ? "I'm listening..." : "Press to speak"}
            </h2>

            <div className="flex flex-col items-center gap-6">
                {/* Audio visualization */}
                {isListening && (
                    <div className="flex items-center justify-center gap-1 h-12">
                        {[...Array(5)].map((_, i) => (
                            <motion.div
                                key={i}
                                className="w-2 bg-primary-500 rounded-full audio-bar"
                                initial={{ height: 8 }}
                                animate={{
                                    height: [8, 24, 8],
                                }}
                                transition={{
                                    duration: 0.5,
                                    repeat: Infinity,
                                    delay: i * 0.1,
                                }}
                            />
                        ))}
                    </div>
                )}

                {/* Main microphone button */}
                <motion.button
                    onClick={isListening ? onStopListening : onStartListening}
                    disabled={!isConnected}
                    className={`
            relative w-24 h-24 rounded-full flex items-center justify-center
            transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed
            ${isListening
                            ? 'bg-red-500 hover:bg-red-600 glow-accent recording-pulse'
                            : 'bg-primary-600 hover:bg-primary-700 glow-primary'
                        }
          `}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                >
                    {!isConnected ? (
                        <Loader2 className="w-10 h-10 text-white animate-spin" />
                    ) : isListening ? (
                        <MicOff className="w-10 h-10 text-white" />
                    ) : (
                        <Mic className="w-10 h-10 text-white" />
                    )}

                    {/* Pulse effect when listening */}
                    {isListening && (
                        <>
                            <span className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-25" />
                            <span className="absolute inset-0 rounded-full bg-red-500 animate-pulse opacity-25" />
                        </>
                    )}
                </motion.button>

                <p className="text-sm text-gray-400">
                    {!isConnected
                        ? 'Connecting...'
                        : isListening
                            ? 'Click to stop speaking'
                            : 'Click to start speaking'
                    }
                </p>

                {/* Control buttons */}
                <div className="flex gap-4 mt-4">
                    <button
                        onClick={onEndSession}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-gray-300 transition-colors"
                    >
                        <Square className="w-4 h-4" />
                        End Session
                    </button>
                </div>
            </div>
        </div>
    )
}
