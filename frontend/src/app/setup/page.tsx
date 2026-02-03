'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ChevronRight, BookOpen, Briefcase, Plane, GraduationCap, MessageCircle, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { ProtectedRoute } from '@/components/ProtectedRoute'

const levels = [
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

const topics = [
    { id: 'free_talk', label: 'Free Talk', icon: MessageCircle, description: 'Open conversation' },
    { id: 'daily_life', label: 'Daily Life', icon: BookOpen, description: 'Everyday situations' },
    { id: 'business', label: 'Business', icon: Briefcase, description: 'Professional context' },
    { id: 'travel', label: 'Travel', icon: Plane, description: 'Travel scenarios' },
    { id: 'academic', label: 'Academic', icon: GraduationCap, description: 'Educational topics' },
];

const voices = [
    { id: 'aura-2-thalia-en', label: 'Ishani', gender: 'Female', description: 'Kind and encouraging' },
    { id: 'aura-2-athena-en', label: 'Aditi', gender: 'Female', description: 'Professional and clear' },
    { id: 'aura-2-stella-en', label: 'Kavya', gender: 'Female', description: 'Warm and upbeat' },
    { id: 'aura-2-hermes-en', label: 'Arjun', gender: 'Male', description: 'Friendly and conversational' },
    { id: 'aura-2-zeus-en', label: 'Kabir', gender: 'Male', description: 'Deep and authoritative' },
];

export default function SetupPage() {
    const router = useRouter()
    const [level, setLevel] = useState<string>('intermediate')
    const [topic, setTopic] = useState<string>('free_talk')
    const [voice, setVoice] = useState<string>('aura-2-thalia-en')
    const [step, setStep] = useState<1 | 2 | 3>(1)

    const handleContinue = () => {
        if (step === 1) {
            setStep(2)
        } else if (step === 2) {
            setStep(3)
        } else {
            // Navigate to chat with selected options
            router.push(`/chat?level=${level}&topic=${topic}&voice=${voice}`)
        }
    };

    return (
        <ProtectedRoute>
            <main className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#0f0f1a] to-[#1a1025]">
                {/* Background Effects */}
                <div className="fixed inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
                    <div className="absolute bottom-0 left-0 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl" />
                </div>

                {/* Navigation */}
                <nav className="relative z-10 flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
                    <Link href="/dashboard" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                        <span>Back</span>
                    </Link>

                    {/* Progress indicator */}
                    <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${step >= 1 ? 'bg-indigo-500' : 'bg-gray-600'}`} />
                        <div className={`w-8 h-0.5 ${step >= 2 ? 'bg-indigo-500' : 'bg-gray-600'}`} />
                        <div className={`w-3 h-3 rounded-full ${step >= 2 ? 'bg-indigo-500' : 'bg-gray-600'}`} />
                        <div className={`w-8 h-0.5 ${step >= 3 ? 'bg-indigo-500' : 'bg-gray-600'}`} />
                        <div className={`w-3 h-3 rounded-full ${step >= 3 ? 'bg-indigo-500' : 'bg-gray-600'}`} />
                    </div>
                </nav>

                {/* Content */}
                <div className="relative z-10 max-w-4xl mx-auto px-4 py-12">
                    {step === 1 ? (
                        <motion.div
                            key="step1"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                        >
                            <h1 className="text-3xl md:text-4xl font-bold text-white text-center mb-4">
                                What's your English level?
                            </h1>
                            <p className="text-gray-400 text-center mb-12">
                                We'll adjust the conversation complexity for you
                            </p>

                            <div className="grid gap-4 md:grid-cols-3">
                                {levels.map((lvl, index) => (
                                    <motion.button
                                        key={lvl.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        onClick={() => setLevel(lvl.id)}
                                        className={`
                                        relative p-6 rounded-2xl text-left transition-all duration-300
                                        ${level === lvl.id
                                                ? 'bg-white/10 border-2 border-indigo-500 shadow-lg shadow-indigo-500/20'
                                                : 'bg-white/5 border-2 border-transparent hover:bg-white/10 hover:border-white/20'
                                            }
                                    `}
                                    >
                                        {/* Gradient accent */}
                                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${lvl.color} flex items-center justify-center mb-4`}>
                                            <span className="text-xl font-bold text-white">
                                                {lvl.label[0]}
                                            </span>
                                        </div>

                                        <h3 className="text-xl font-semibold text-white mb-2">
                                            {lvl.label}
                                        </h3>
                                        <p className="text-sm text-gray-400">
                                            {lvl.description}
                                        </p>

                                        {/* Selected indicator */}
                                        {level === lvl.id && (
                                            <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center">
                                                <ChevronRight className="w-4 h-4 text-white" />
                                            </div>
                                        )}
                                    </motion.button>
                                ))}
                            </div>
                        </motion.div>
                    ) : step === 2 ? (
                        <motion.div
                            key="step2"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                        >
                            <h1 className="text-3xl md:text-4xl font-bold text-white text-center mb-4">
                                What would you like to discuss?
                            </h1>
                            <p className="text-gray-400 text-center mb-12">
                                Pick a conversation topic
                            </p>

                            <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
                                {topics.map((t, index) => {
                                    const Icon = t.icon
                                    return (
                                        <motion.button
                                            key={t.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                            onClick={() => setTopic(t.id)}
                                            className={`
                                            relative p-6 rounded-2xl text-center transition-all duration-300
                                            ${topic === t.id
                                                    ? 'bg-white/10 border-2 border-indigo-500 shadow-lg shadow-indigo-500/20'
                                                    : 'bg-white/5 border-2 border-transparent hover:bg-white/10 hover:border-white/20'
                                                }
                                        `}
                                        >
                                            <div className={`
                                            w-12 h-12 rounded-xl mx-auto mb-4 flex items-center justify-center
                                            ${topic === t.id ? 'bg-indigo-500' : 'bg-white/10'}
                                        `}>
                                                <Icon className={`w-6 h-6 ${topic === t.id ? 'text-white' : 'text-gray-400'}`} />
                                            </div>

                                            <h3 className="font-semibold text-white mb-1">
                                                {t.label}
                                            </h3>
                                            <p className="text-xs text-gray-500">
                                                {t.description}
                                            </p>
                                        </motion.button>
                                    )
                                })}
                            </div>

                            {/* Back button */}
                            <button
                                onClick={() => setStep(1)}
                                className="mt-8 text-gray-400 hover:text-white transition-colors"
                            >
                                ← Change level
                            </button>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="step3"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                        >
                            <h1 className="text-3xl md:text-4xl font-bold text-white text-center mb-4">
                                Choose your partner&apos;s voice
                            </h1>
                            <p className="text-gray-400 text-center mb-12">
                                Select a tone that makes you comfortable
                            </p>

                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {voices.map((v, index) => (
                                    <motion.button
                                        key={v.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        onClick={() => setVoice(v.id)}
                                        className={`
                                            relative p-6 rounded-2xl text-left transition-all duration-500 group
                                            ${voice === v.id
                                                ? 'bg-white/15 border-2 border-indigo-500 shadow-2xl shadow-indigo-500/30 scale-[1.02]'
                                                : 'bg-white/5 border-2 border-transparent hover:bg-white/10 hover:border-indigo-500/50 hover:scale-[1.01]'
                                            }
                                        `}
                                    >
                                        <div className="flex items-center justify-between mb-4">
                                            <div className={`
                                                w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300
                                                ${voice === v.id
                                                    ? 'bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/40'
                                                    : 'bg-white/10 group-hover:bg-white/20'
                                                }
                                            `}>
                                                <span className="text-white text-lg font-bold">{v.gender[0]}</span>
                                            </div>
                                            {voice === v.id && (
                                                <motion.div
                                                    initial={{ scale: 0 }}
                                                    animate={{ scale: 1 }}
                                                    className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center"
                                                >
                                                    <div className="w-2.5 h-2.5 rounded-full bg-white shadow-sm" />
                                                </motion.div>
                                            )}
                                        </div>

                                        <h3 className="text-xl font-bold text-white mb-1 group-hover:text-indigo-400 transition-colors">
                                            {v.label}
                                        </h3>
                                        <div className="flex items-center gap-2 mb-3">
                                            <span className={`
                                                px-2 py-0.5 rounded-md text-[10px] uppercase tracking-widest font-bold
                                                ${v.gender === 'Female' ? 'bg-pink-500/20 text-pink-400' : 'bg-blue-500/20 text-blue-400'}
                                            `}>
                                                {v.gender}
                                            </span>
                                            <span className="w-1 h-1 rounded-full bg-gray-600" />
                                            <span className="text-xs text-gray-500 font-medium">Aura V2</span>
                                        </div>
                                        <p className="text-sm text-gray-400 leading-relaxed">
                                            {v.description}
                                        </p>

                                        {/* Hover Glow */}
                                        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-500/0 via-transparent to-purple-500/0 group-hover:from-indigo-500/5 group-hover:to-purple-500/5 pointer-events-none transition-all duration-500" />
                                    </motion.button>
                                ))}
                            </div>

                            {/* Back button */}
                            <button
                                onClick={() => setStep(2)}
                                className="mt-8 text-gray-400 hover:text-white transition-colors"
                            >
                                ← Change topic
                            </button>
                        </motion.div>
                    )}

                    {/* Continue Button */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="flex justify-center mt-12"
                    >
                        <button
                            onClick={handleContinue}
                            className="group inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full text-white font-semibold text-lg transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/30 hover:scale-105"
                        >
                            {step < 3 ? 'Continue' : 'Start Practicing'}
                            <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </motion.div>
                </div>
            </main>
        </ProtectedRoute>
    )
}
