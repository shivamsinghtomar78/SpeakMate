export interface WSSessionStartedMessage {
    type: 'session_started'
    session_id: string
    level: string
    topic: string
}

export interface WSInterimTranscriptMessage {
    type: 'interim_transcript'
    text: string
    confidence: number
}

export interface WSFinalTranscriptMessage {
    type: 'final_transcript'
    text: string
    confidence: number
    words?: { word: string; confidence: number }[]
}

export interface WSFeedbackMessage {
    type: 'feedback'
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
}

export interface WSAudioMessage {
    type: 'audio'
    audio: string
    format: string
    sample_rate: number
}

export interface WSErrorMessage {
    type: 'error'
    message: string
}

export interface WSProgressMessage {
    type: 'progress'
    duration_seconds: number
    turns_count: number
    avg_confidence: number
    grammar_mistakes: number
}

export type WSIncomingMessage =
    | WSSessionStartedMessage
    | WSInterimTranscriptMessage
    | WSFinalTranscriptMessage
    | WSFeedbackMessage
    | WSAudioMessage
    | WSErrorMessage
    | WSProgressMessage

export interface WSInitMessage {
    type: 'init'
    level: string
    topic: string
    user_id?: string
    voice_id?: string
}

export interface WSTextMessage {
    type: 'text'
    text: string
}

export interface WSStopMessage {
    type: 'stop'
}

export type WSOutgoingMessage = WSInitMessage | WSTextMessage | WSStopMessage
