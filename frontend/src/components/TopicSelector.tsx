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
                <label className="block text-sm font-medium text-gray-400 mb-3">
                    Your English Level
                </label>
                <div className="grid grid-cols-3 gap-3">
                    {levels.map((lvl) => (
                        <motion.button
                            key={lvl.id}
                            onClick={() => onLevelChange(lvl.id)}
                            className={`
                p-3 rounded-lg border transition-all duration-200 text-left
                ${level === lvl.id
                                    ? 'border-primary-500 bg-primary-900/30 text-white'
                                    : 'border-gray-700 bg-gray-800/50 text-gray-400 hover:border-gray-600'
                                }
              `}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <p className="font-medium text-sm">{lvl.label}</p>
                            <p className="text-xs mt-1 opacity-70">{lvl.description}</p>
                        </motion.button>
                    ))}
                </div>
            </div>

            {/* Topic Selection */}
            <div>
                <label className="block text-sm font-medium text-gray-400 mb-3">
                    Conversation Topic
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
                  p-4 rounded-lg border transition-all duration-200 flex flex-col items-center gap-2
                  ${isSelected
                                        ? 'border-primary-500 bg-primary-900/30 text-white'
                                        : 'border-gray-700 bg-gray-800/50 text-gray-400 hover:border-gray-600'
                                    }
                `}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <Icon className={`w-6 h-6 ${isSelected ? 'text-primary-400' : ''}`} />
                                <span className="text-sm font-medium">{t.label}</span>
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
