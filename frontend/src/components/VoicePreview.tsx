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
    const audioUrlRef = useRef<string | null>(null)

    const handlePreview = async (e: React.MouseEvent) => {
        e.stopPropagation()

        if (isPlaying) {
            audioRef.current?.pause()
            setIsPlaying(false)
            if (audioUrlRef.current) {
                URL.revokeObjectURL(audioUrlRef.current)
                audioUrlRef.current = null
            }
            return
        }

        setIsLoading(true)
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/voice/preview`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.NEXT_PUBLIC_AUTH_TOKEN || 'aura-2-tha'}`
                },
                body: JSON.stringify({
                    voice_id: voiceId,
                    text: `Hello! I'm ${label}. I'm excited to practice English with you!`
                })
            })

            if (!response.ok) throw new Error('Failed to fetch preview')
            const data = await response.json()

            // Cleanup previous preview
            if (audioUrlRef.current) {
                URL.revokeObjectURL(audioUrlRef.current)
            }

            // Create audio from base64
            const audioBlob = await (await fetch(`data:audio/wav;base64,${data.audio}`)).blob()
            const audioUrl = URL.createObjectURL(audioBlob)
            audioUrlRef.current = audioUrl

            if (audioRef.current) {
                audioRef.current.src = audioUrl
            } else {
                audioRef.current = new Audio(audioUrl)
            }

            audioRef.current.onended = () => {
                setIsPlaying(false)
                if (audioUrlRef.current === audioUrl) {
                    URL.revokeObjectURL(audioUrl)
                    audioUrlRef.current = null
                }
            }

            await audioRef.current.play()
            setIsLoading(false)
            setIsPlaying(true)

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
