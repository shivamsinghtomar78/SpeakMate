'use client'

import { motion } from 'framer-motion'
import { BookOpen, Briefcase, Plane, GraduationCap, MessageCircle } from 'lucide-react'

interface TopicSelectorProps {
    level: 'beginner' | 'intermediate' | 'advanced'
    topic: string
    onLevelChange: (level: 'beginner' | 'intermediate' | 'advanced') => void
    onTopicChange: (topic: string) => void
}

const levels = [
    { id: 'beginner', label: 'Beginner', description: 'Simple vocabulary and sentences' },
    { id: 'intermediate', label: 'Intermediate', description: 'Everyday conversations' },
    { id: 'advanced', label: 'Advanced', description: 'Complex topics and idioms' },
] as const

const topics = [
    { id: 'free_talk', label: 'Free Talk', icon: MessageCircle, color: 'primary' },
    { id: 'daily_life', label: 'Daily Life', icon: BookOpen, color: 'green' },
    { id: 'business', label: 'Business', icon: Briefcase, color: 'blue' },
    { id: 'travel', label: 'Travel', icon: Plane, color: 'amber' },
    { id: 'academic', label: 'Academic', icon: GraduationCap, color: 'purple' },
]

export default function TopicSelector({
    level,
    topic,
    onLevelChange,
    onTopicChange,
}: TopicSelectorProps) {
    return (
        <div className="space-y-6">
            {/* Level Selection */}
            <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-4">
                    Proficiency Level
                </label>
                <div className="grid grid-cols-3 gap-3">
                    {levels.map((lvl) => (
                        <motion.button
                            key={lvl.id}
                            onClick={() => onLevelChange(lvl.id)}
                            className={`
                                p-4 rounded-2xl border transition-all duration-300 text-left
                                ${level === lvl.id
                                    ? 'border-primary bg-primary/10 text-white shadow-[0_0_20px_rgba(99,102,241,0.2)]'
                                    : 'border-white/5 bg-white/[0.02] text-gray-400 hover:border-white/10 hover:bg-white/[0.04]'
                                }
                            `}
                            whileHover={{ y: -2 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <p className="font-semibold text-sm tracking-tight">{lvl.label}</p>
                            <p className="text-[10px] mt-1.5 opacity-60 leading-relaxed uppercase font-bold tracking-tighter">{lvl.description}</p>
                        </motion.button>
                    ))}
                </div>
            </div>

            {/* Topic Selection */}
            <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-4">
                    Select Topic
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {topics.map((t) => {
                        const Icon = t.icon
                        const isSelected = topic === t.id

                        return (
                            <motion.button
                                key={t.id}
                                onClick={() => onTopicChange(t.id)}
                                className={`
                                    p-5 rounded-2xl border transition-all duration-300 flex flex-col items-center gap-3
                                    ${isSelected
                                        ? 'border-primary bg-primary/10 text-white shadow-[0_0_20px_rgba(99,102,241,0.2)]'
                                        : 'border-white/5 bg-white/[0.02] text-gray-400 hover:border-white/10 hover:bg-white/[0.04]'
                                    }
                                `}
                                whileHover={{ y: -2 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <div className={`p-3 rounded-xl ${isSelected ? 'bg-primary text-white shadow-[0_0_20px_rgba(99,102,241,0.4)]' : 'bg-white/5'}`}>
                                    <Icon className="w-6 h-6" />
                                </div>
                                <span className="text-sm font-semibold tracking-tight">{t.label}</span>
                            </motion.button>
                        )
                    })}
                </div>
            </div>

            {/* Selected Summary */}
            <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                <p className="text-sm text-gray-400">
                    You selected <span className="text-white font-medium">{levels.find(l => l.id === level)?.label}</span> level
                    with <span className="text-white font-medium">{topics.find(t => t.id === topic)?.label}</span> topic.
                </p>
            </div>
        </div>
    )
}
