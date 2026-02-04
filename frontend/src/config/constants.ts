import { Mic, BookOpen, Briefcase, Plane, GraduationCap, MessageCircle } from 'lucide-react'

export const LEVELS = [
    {
        id: 'beginner',
        label: 'Beginner',
        description: 'Simple vocabulary and basic sentences',
        color: 'from-green-500 to-emerald-600'
    },
    {
        id: 'intermediate',
        label: 'Intermediate',
        description: 'Everyday conversations and expressions',
        color: 'from-blue-500 to-indigo-600'
    },
    {
        id: 'advanced',
        label: 'Advanced',
        description: 'Complex topics, idioms, and nuances',
        color: 'from-purple-500 to-pink-600'
    },
];

export const TOPICS = [
    { id: 'free_talk', label: 'Free Talk', icon: MessageCircle, description: 'Open conversation' },
    { id: 'daily_life', label: 'Daily Life', icon: BookOpen, description: 'Everyday situations' },
    { id: 'business', label: 'Business', icon: Briefcase, description: 'Professional context' },
    { id: 'travel', label: 'Travel', icon: Plane, description: 'Travel scenarios' },
    { id: 'academic', label: 'Academic', icon: GraduationCap, description: 'Educational topics' },
];

export const VOICES = [
    { id: 'aura-2-thalia-en', label: 'Ishani', gender: 'Female', description: 'Kind and encouraging' },
    { id: 'aura-2-athena-en', label: 'Aditi', gender: 'Female', description: 'Professional and clear' },
    { id: 'aura-2-stella-en', label: 'Kavya', gender: 'Female', description: 'Warm and upbeat' },
    { id: 'aura-2-hermes-en', label: 'Arjun', gender: 'Male', description: 'Friendly and conversational' },
    { id: 'aura-2-zeus-en', label: 'Kabir', gender: 'Male', description: 'Deep and authoritative' },
];
