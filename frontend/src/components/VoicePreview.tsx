'use client'

import { useState, useRef } from 'react'
import { Play, Square, Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'

interface VoicePreviewProps {
    voiceId: string
    label: string
}

export function VoicePreview({ voiceId, label }: VoicePreviewProps) {
    const [isPlaying, setIsPlaying] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const audioRef = useRef<HTMLAudioElement | null>(null)

    const handlePreview = async (e: React.MouseEvent) => {
        e.stopPropagation()

        if (isPlaying) {
            audioRef.current?.pause()
            setIsPlaying(false)
            return
        }

        setIsLoading(true)
        try {
            // In a real app, this would call a backend endpoint that returns a sample 
            // or uses a static sample URL. For now, we'll use a placeholder logic 
            // with browser synthesis as a fallback or a mock delay.

            // Mock delay for feel
            await new Promise(resolve => setTimeout(resolve, 800))

            const utterance = new SpeechSynthesisUtterance("Hello! I'm your English practice partner. Let's have a great conversation.")
            // Try to match gender roughly for preview feel
            const voices = window.speechSynthesis.getVoices()
            if (voiceId.includes('thalia') || voiceId.includes('athena') || voiceId.includes('stella')) {
                utterance.voice = voices.find(v => v.name.includes('Female')) || null
            } else {
                utterance.voice = voices.find(v => v.name.includes('Male')) || null
            }

            utterance.onend = () => setIsPlaying(false)
            utterance.onstart = () => {
                setIsLoading(false)
                setIsPlaying(true)
            }
            window.speechSynthesis.speak(utterance)

        } catch (error) {
            console.error('Preview failed:', error)
            setIsLoading(false)
        }
    }

    return (
        <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handlePreview}
            className={`
                p-2 rounded-full transition-all duration-300
                ${isPlaying ? 'bg-indigo-500 text-white' : 'bg-white/10 text-gray-400 hover:bg-white/20 hover:text-white'}
            `}
        >
            {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
            ) : isPlaying ? (
                <Square className="w-4 h-4" />
            ) : (
                <Play className="w-4 h-4 translate-x-0.5" />
            )}
        </motion.button>
    )
}
