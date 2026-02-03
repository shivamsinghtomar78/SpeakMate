'use client'

import { useState, useCallback, useRef, useEffect } from 'react'

interface TranscriptItem {
    type: 'interim' | 'final'
    text: string
    confidence?: number
    words?: { word: string; confidence: number }[]
    timestamp: Date
}

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

interface ProgressData {
    duration: number
    turns: number
    avgConfidence: number
    grammarMistakes: number
}

interface UseVoiceAgentReturn {
    isConnected: boolean
    isListening: boolean
    transcript: TranscriptItem[]
    feedback: FeedbackItem[]
    sessionId: string | null
    progress: ProgressData | null
    error: string | null
    connect: (level: string, topic: string, userId?: string, voiceId?: string) => void
    disconnect: () => void
    startListening: () => void
    stopListening: () => void
    sendTextMessage: (text: string) => void
    isAISpeaking: boolean
    audioData: Uint8Array
}

export function useVoiceAgent(): UseVoiceAgentReturn {
    const [isConnected, setIsConnected] = useState(false)
    const [isListening, setIsListening] = useState(false)
    const [transcript, setTranscript] = useState<TranscriptItem[]>([])
    const [feedback, setFeedback] = useState<FeedbackItem[]>([])
    const [sessionId, setSessionId] = useState<string | null>(null)
    const [progress, setProgress] = useState<ProgressData | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [isAISpeaking, setIsAISpeaking] = useState(false)
    const [audioData, setAudioData] = useState<Uint8Array>(new Uint8Array(0))

    const wsRef = useRef<WebSocket | null>(null)
    const audioContextRef = useRef<AudioContext | null>(null)
    const mediaStreamRef = useRef<MediaStream | null>(null)
    const processorRef = useRef<ScriptProcessorNode | null>(null)
    // Use ref to track listening state for the audio callback (avoids stale closure)
    const isListeningRef = useRef(false)

    const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000'

    // Connect to WebSocket
    const connect = useCallback((level: string, topic: string, userId?: string, voiceId?: string) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            return
        }

        try {
            const ws = new WebSocket(`${WS_URL}/ws/voice`)
            wsRef.current = ws

            ws.onopen = () => {
                console.log('WebSocket connected')

                // Send initialization message
                ws.send(JSON.stringify({
                    type: 'init',
                    level,
                    topic,
                    user_id: userId,
                    voice_id: voiceId,
                }))
            }

            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data)
                    handleMessage(data)
                } catch (e) {
                    console.error('Failed to parse message:', e)
                }
            }

            ws.onerror = (event) => {
                console.error('WebSocket error:', event)
                setError('Connection error')
            }

            ws.onclose = () => {
                console.log('WebSocket closed')
                setIsConnected(false)
                setIsListening(false)
                isListeningRef.current = false
                stopAudioCapture()
            }

        } catch (e) {
            console.error('Failed to connect:', e)
            setError('Failed to connect')
        }
    }, [WS_URL])

    // Handle incoming messages
    const handleMessage = useCallback((data: any) => {
        switch (data.type) {
            case 'session_started':
                setSessionId(data.session_id)
                setIsConnected(true)
                setError(null)
                break

            case 'interim_transcript':
                setTranscript(prev => {
                    // Update or add interim transcript
                    const items = prev.filter(t => t.type !== 'interim')
                    return [...items, {
                        type: 'interim' as const,
                        text: data.text,
                        confidence: data.confidence,
                        timestamp: new Date(),
                    }]
                })
                break

            case 'final_transcript':
                setTranscript(prev => {
                    // Remove interim and add final
                    const items = prev.filter(t => t.type !== 'interim')
                    return [...items, {
                        type: 'final' as const,
                        text: data.text,
                        confidence: data.confidence,
                        words: data.words,
                        timestamp: new Date(),
                    }]
                })
                break

            case 'feedback':
                setFeedback(prev => [...prev, {
                    text: data.text,
                    grammar_corrections: data.grammar_corrections || [],
                    vocabulary_suggestions: data.vocabulary_suggestions || [],
                    pronunciation_tips: data.pronunciation_tips || [],
                    follow_up_question: data.follow_up_question,
                    timestamp: new Date(),
                }])
                break

            case 'audio':
                // Play TTS audio
                playAudio(data.audio, data.sample_rate || 24000)
                break

            case 'error':
                setError(data.message)
                break

            case 'progress':
                setProgress(data)
                break
        }
    }, [])

    // Disconnect
    const disconnect = useCallback(() => {
        if (wsRef.current) {
            // Only send stop message if WebSocket is open
            if (wsRef.current.readyState === WebSocket.OPEN) {
                wsRef.current.send(JSON.stringify({ type: 'stop' }))
            }
            wsRef.current.close()
            wsRef.current = null
        }
        stopAudioCapture()
        setIsConnected(false)
        setIsListening(false)
        isListeningRef.current = false
        setSessionId(null)
    }, [])

    // Start audio capture
    const startListening = useCallback(async () => {
        if (!isConnected) {
            console.log('Cannot start listening - not connected')
            return
        }

        try {
            console.log('Requesting microphone access...')
            // Request microphone access
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    sampleRate: 16000,
                    channelCount: 1,
                    echoCancellation: true,
                    noiseSuppression: true,
                }
            })

            console.log('Microphone access granted')
            mediaStreamRef.current = stream

            // Create audio context
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({
                sampleRate: 16000,
            })

            const source = audioContextRef.current.createMediaStreamSource(stream)

            // Create analyser for visualization
            const analyser = audioContextRef.current.createAnalyser()
            analyser.fftSize = 256
            source.connect(analyser)

            const processor = audioContextRef.current.createScriptProcessor(4096, 1, 1)
            processorRef.current = processor

            // Update frequency data in a loop
            const bufferLength = analyser.frequencyBinCount
            const dataArray = new Uint8Array(bufferLength)

            const updateFrequencyData = () => {
                if (!isListeningRef.current) return
                analyser.getByteFrequencyData(dataArray)
                setAudioData(new Uint8Array(dataArray))
                requestAnimationFrame(updateFrequencyData)
            }
            updateFrequencyData()

            // Set listening state BEFORE creating the callback
            setIsListening(true)
            isListeningRef.current = true

            let chunkCount = 0

            processor.onaudioprocess = (e) => {
                // Use ref instead of state to avoid stale closure
                if (!isListeningRef.current || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
                    return
                }

                const inputData = e.inputBuffer.getChannelData(0)

                // Convert float32 to int16
                const int16Data = new Int16Array(inputData.length)
                for (let i = 0; i < inputData.length; i++) {
                    const s = Math.max(-1, Math.min(1, inputData[i]))
                    int16Data[i] = s < 0 ? s * 0x8000 : s * 0x7fff
                }

                // Send as binary
                wsRef.current.send(int16Data.buffer)

                chunkCount++
                if (chunkCount % 20 === 0) {
                    console.log(`Sent ${chunkCount} audio chunks (${chunkCount * 4096 * 2} bytes)`)
                }
            }

            source.connect(processor)
            processor.connect(audioContextRef.current.destination)

            console.log('Audio capture started - sending audio to backend')

        } catch (e) {
            console.error('Failed to start audio capture:', e)
            setError('Microphone access denied')
        }
    }, [isConnected])

    // Stop audio capture
    const stopAudioCapture = useCallback(() => {
        if (processorRef.current) {
            processorRef.current.disconnect()
            processorRef.current = null
        }

        if (audioContextRef.current) {
            audioContextRef.current.close()
            audioContextRef.current = null
        }

        if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(track => track.stop())
            mediaStreamRef.current = null
        }
    }, [])

    // Stop listening
    const stopListening = useCallback(() => {
        console.log('Stopping listening')
        setIsListening(false)
        isListeningRef.current = false
        stopAudioCapture()
    }, [stopAudioCapture])

    // Send text message
    const sendTextMessage = useCallback((text: string) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({
                type: 'text',
                text,
            }))

            // Add to transcript
            setTranscript(prev => [...prev, {
                type: 'final',
                text,
                confidence: 1.0,
                timestamp: new Date(),
            }])
        }
    }, [])

    // Play audio from base64
    const playbackContextRef = useRef<AudioContext | null>(null)

    const playAudio = useCallback(async (base64Audio: string, sampleRate: number) => {
        try {
            if (!playbackContextRef.current) {
                playbackContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
            }
            const audioContext = playbackContextRef.current

            // Decode base64 to array buffer
            const binaryString = atob(base64Audio)
            const bytes = new Uint8Array(binaryString.length)
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i)
            }

            // Create audio buffer from linear16 PCM
            const int16Array = new Int16Array(bytes.buffer)
            const audioBuffer = audioContext.createBuffer(1, int16Array.length, sampleRate)
            const channelData = audioBuffer.getChannelData(0)

            for (let i = 0; i < int16Array.length; i++) {
                channelData[i] = int16Array[i] / 32768.0
            }

            // Play the audio
            const source = audioContext.createBufferSource()
            source.buffer = audioBuffer
            source.connect(audioContext.destination)

            source.onended = () => {
                setIsAISpeaking(false)
            }

            setIsAISpeaking(true)
            source.start()

        } catch (e) {
            console.error('Failed to play audio:', e)
            setIsAISpeaking(false)
        }
    }, [])

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            disconnect()
        }
    }, [disconnect])

    return {
        isConnected,
        isListening,
        transcript,
        feedback,
        sessionId,
        progress,
        error,
        connect,
        disconnect,
        startListening,
        stopListening,
        sendTextMessage,
        isAISpeaking,
        audioData,
    }
}
