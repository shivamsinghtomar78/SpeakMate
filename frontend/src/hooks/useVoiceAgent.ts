'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { WSIncomingMessage, WSAudioMessage, WSInitMessage } from '@/types/websocket'

export type AgentState =
    | 'IDLE'
    | 'CONNECTING'
    | 'READY'
    | 'LISTENING'
    | 'SPEAKING'
    | 'ERROR'
    | 'DISCONNECTING';

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
    state: AgentState
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
    const [state, setState] = useState<AgentState>('IDLE')
    const [transcript, setTranscript] = useState<TranscriptItem[]>([])
    const [feedback, setFeedback] = useState<FeedbackItem[]>([])
    const [sessionId, setSessionId] = useState<string | null>(null)
    const [progress, setProgress] = useState<ProgressData | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [audioData, setAudioData] = useState<Uint8Array>(new Uint8Array(0))

    const wsRef = useRef<WebSocket | null>(null)
    const audioContextRef = useRef<AudioContext | null>(null)
    const workletNodeRef = useRef<AudioWorkletNode | null>(null)
    const mediaStreamRef = useRef<MediaStream | null>(null)
    const stateRef = useRef<AgentState>('IDLE')

    // Track state in ref for callbacks
    useEffect(() => {
        stateRef.current = state
    }, [state])

    // Backpressure settings
    const MAX_BUFFERED_AMOUNT = 1024 * 1024; // 1MB buffer limit
    const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000'

    // Playback logic refs
    const playbackContextRef = useRef<AudioContext | null>(null)
    const nextStartTimeRef = useRef<number>(0)
    const audioQueueRef = useRef<AudioBuffer[]>([])
    const isProcessingQueueRef = useRef<boolean>(false)

    // Handle incoming messages
    const handleMessage = useCallback((data: WSIncomingMessage) => {
        switch (data.type) {
            case 'session_started':
                setSessionId(data.session_id)
                setState('READY')
                setError(null)
                break

            case 'interim_transcript':
                setTranscript(prev => {
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
                    const items = prev.filter(t => t.type !== 'interim')
                    return [...items, {
                        type: 'final' as const,
                        text: data.text,
                        confidence: data.confidence,
                        words: (data as any).words,
                        timestamp: new Date(),
                    }]
                })
                break

            case 'feedback':
                setFeedback(prev => [...prev, {
                    text: data.text,
                    grammar_corrections: data.grammar_corrections || [],
                    vocabulary_suggestions: (data as any).vocabulary_suggestions || [],
                    pronunciation_tips: (data as any).pronunciation_tips || [],
                    follow_up_question: (data as any).follow_up_question,
                    timestamp: new Date(),
                }])
                break

            case 'audio':
                playAudio((data as WSAudioMessage).audio, (data as WSAudioMessage).sample_rate || 24000)
                break

            case 'error':
                setError(data.message)
                setState('ERROR')
                break

            case 'progress':
                setProgress({
                    duration: data.duration_seconds,
                    turns: data.turns_count,
                    avgConfidence: data.avg_confidence,
                    grammarMistakes: data.grammar_mistakes,
                })
                break
        }
    }, [])

    const stopAudioCapture = useCallback(() => {
        if (workletNodeRef.current) {
            workletNodeRef.current.disconnect()
            workletNodeRef.current = null
        }
        if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(track => track.stop())
            mediaStreamRef.current = null
        }
    }, [])

    const retryCountRef = useRef(0)
    const MAX_RETRIES = 5

    // Connect to WebSocket
    const connect = useCallback((level: string, topic: string, userId?: string, voiceId?: string) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) return

        setState('CONNECTING')

        // Connection timeout
        const timeoutId = setTimeout(() => {
            if (stateRef.current === 'CONNECTING') {
                console.error('WebSocket connection timed out')
                setError('Connection timed out')
                setState('ERROR')
                if (wsRef.current) wsRef.current.close()
            }
        }, 10000)

        try {
            const ws = new WebSocket(`${WS_URL}/ws/voice?token=${process.env.NEXT_PUBLIC_AUTH_TOKEN || 'aura-2-tha'}`) // Placeholder token
            wsRef.current = ws

            ws.onopen = () => {
                clearTimeout(timeoutId)
                const initMsg: WSInitMessage = {
                    type: 'init',
                    level,
                    topic,
                    user_id: userId,
                    voice_id: voiceId,
                }
                ws.send(JSON.stringify(initMsg))
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
                setState('ERROR')
            }

            ws.onclose = () => {
                const s = stateRef.current
                if (s !== 'DISCONNECTING' && s !== 'IDLE' && retryCountRef.current < MAX_RETRIES) {
                    const backoff = Math.pow(2, retryCountRef.current) * 1000
                    retryCountRef.current++
                    console.log(`Retrying connection in ${backoff}ms... (Attempt ${retryCountRef.current})`)
                    setTimeout(() => connect(level, topic, userId, voiceId), backoff)
                } else if (s !== 'DISCONNECTING' && s !== 'IDLE') {
                    setState('IDLE')
                    stateRef.current = 'IDLE'
                }
            }

        } catch (e) {
            console.error('Failed to connect:', e)
            setError('Failed to connect')
            setState('ERROR')
        }
    }, [WS_URL, handleMessage])

    // Disconnect
    const disconnect = useCallback(() => {
        stateRef.current = 'DISCONNECTING'
        setState('DISCONNECTING')

        if (wsRef.current) {
            if (wsRef.current.readyState === WebSocket.OPEN) {
                wsRef.current.send(JSON.stringify({ type: 'stop' }))
            }
            wsRef.current.close()
            wsRef.current = null
        }
        stopAudioCapture()
        setSessionId(null)
        setState('IDLE')
        stateRef.current = 'IDLE'
        retryCountRef.current = 0
    }, [stopAudioCapture])

    // Start audio capture with AudioWorklet
    const startListening = useCallback(async () => {
        if (stateRef.current !== 'READY' && stateRef.current !== 'SPEAKING') {
            return
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    sampleRate: 16000,
                    channelCount: 1,
                    echoCancellation: true,
                    noiseSuppression: true,
                }
            })
            mediaStreamRef.current = stream

            if (!audioContextRef.current) {
                audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({
                    sampleRate: 16000,
                })
            }
            const audioContext = audioContextRef.current

            // Load worklet
            await audioContext.audioWorklet.addModule('/worklets/capture-processor.js')

            const source = audioContext.createMediaStreamSource(stream)
            const workletNode = new AudioWorkletNode(audioContext, 'capture-processor')
            workletNodeRef.current = workletNode

            const analyser = audioContext.createAnalyser()
            analyser.fftSize = 256
            source.connect(analyser)

            // Audio visualization
            const dataArray = new Uint8Array(analyser.frequencyBinCount)
            const updateVisuals = () => {
                if (stateRef.current !== 'LISTENING') return
                analyser.getByteFrequencyData(dataArray)
                setAudioData(new Uint8Array(dataArray))
                requestAnimationFrame(updateVisuals)
            }

            workletNode.port.onmessage = (event) => {
                const ws = wsRef.current
                if (ws && ws.readyState === WebSocket.OPEN && stateRef.current === 'LISTENING') {
                    if (ws.bufferedAmount > MAX_BUFFERED_AMOUNT) {
                        return
                    }
                    ws.send(event.data)
                }
            }

            source.connect(workletNode)
            // Removed: workletNode.connect(audioContext.destination) to prevent echo

            setState('LISTENING')
            requestAnimationFrame(updateVisuals)

        } catch (e) {
            console.error('Failed to start AudioWorklet:', e)
            setError('Microphone access denied')
            setState('ERROR')
        }
    }, [])

    const stopListening = useCallback(() => {
        if (stateRef.current === 'LISTENING') {
            setState('READY')
            stopAudioCapture()
        }
    }, [stopAudioCapture])

    const sendTextMessage = useCallback((text: string) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type: 'text', text }))
            setTranscript(prev => [...prev, {
                type: 'final',
                text,
                confidence: 1.0,
                timestamp: new Date(),
            }])
        }
    }, [])

    const processAudioQueue = useCallback(async () => {
        if (isProcessingQueueRef.current || audioQueueRef.current.length === 0) return

        isProcessingQueueRef.current = true
        if (!playbackContextRef.current) {
            playbackContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
        }
        const audioContext = playbackContextRef.current

        while (audioQueueRef.current.length > 0) {
            const audioBuffer = audioQueueRef.current.shift()!
            const source = audioContext.createBufferSource()
            source.buffer = audioBuffer
            source.connect(audioContext.destination)

            let startTime = nextStartTimeRef.current
            const currentTime = audioContext.currentTime

            if (startTime < currentTime) {
                startTime = currentTime + 0.1
            }

            source.start(startTime)
            nextStartTimeRef.current = startTime + audioBuffer.duration
            setState('SPEAKING')

            source.onended = () => {
                if (audioContext.currentTime >= nextStartTimeRef.current - 0.05) {
                    setState(prev => prev === 'SPEAKING' ? 'READY' : prev)
                }
            }
        }
        isProcessingQueueRef.current = false
    }, [])

    const playAudio = useCallback(async (base64Audio: string, sampleRate: number) => {
        try {
            if (!playbackContextRef.current) {
                playbackContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
            }
            const audioContext = playbackContextRef.current

            const binaryString = atob(base64Audio)
            const bytes = new Uint8Array(binaryString.length)
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i)
            }

            const int16Array = new Int16Array(bytes.buffer)
            const audioBuffer = audioContext.createBuffer(1, int16Array.length, sampleRate)
            const channelData = audioBuffer.getChannelData(0)

            for (let i = 0; i < int16Array.length; i++) {
                channelData[i] = int16Array[i] / 32768.0
            }

            audioQueueRef.current.push(audioBuffer)
            processAudioQueue()
        } catch (e) {
            console.error('Failed to play audio:', e)
            setState('READY')
        }
    }, [processAudioQueue])

    useEffect(() => {
        return () => {
            disconnect()
        }
    }, [disconnect])

    return {
        state,
        isConnected: state !== 'IDLE' && state !== 'CONNECTING' && state !== 'ERROR',
        isListening: state === 'LISTENING',
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
        isAISpeaking: state === 'SPEAKING',
        audioData,
    }
}
