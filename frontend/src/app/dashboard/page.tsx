'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Clock, Target, Flame, TrendingUp, Play, Calendar } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import Header from '@/components/Header'
import Card from '@/components/Card'
import Button from '@/components/Button'

interface SessionStat {
    date: string
    confidence: number
}

interface Analytics {
    total_sessions: number
    total_practice_time: string
    total_words_spoken: number
    avg_confidence: number
    confidence_trend: string
    recent_scores: number[]
    common_improvement_areas: string[]
    improvement_score: number
}

export default function DashboardPage() {
    const { user } = useAuth()
    const router = useRouter()
    const [analytics, setAnalytics] = useState<Analytics | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchAnalytics = async () => {
            if (!user?.uid) return
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/user/${user.uid}/analytics`)
                if (response.ok) {
                    const data = await response.json()
                    setAnalytics(data)
                }
            } catch (error) {
                console.error('Failed to fetch analytics:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchAnalytics()
    }, [user])

    const statsCards = [
        {
            icon: Target,
            label: 'Total Sessions',
            value: analytics?.total_sessions ?? 0,
            color: 'from-indigo-500 to-blue-500',
        },
        {
            icon: Clock,
            label: 'Practice Time',
            value: analytics?.total_practice_time ?? '0m',
            color: 'from-purple-500 to-pink-500',
        },
        {
            icon: Flame,
            label: 'Common Mistakes',
            value: analytics?.common_improvement_areas?.[0] || 'None',
            color: 'from-orange-500 to-red-500',
        },
        {
            icon: TrendingUp,
            label: 'Improvement Score',
            value: `${analytics?.improvement_score ?? 0}%`,
            color: 'from-green-500 to-emerald-500',
        },
    ]

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#0f0f1a] to-[#1a1025]">
                <Header />

                {/* Background Effects */}
                <div className="fixed inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-1/3 left-1/3 w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-3xl" />
                    <div className="absolute bottom-1/3 right-1/3 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-3xl" />
                </div>

                <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Welcome Section */}
                    <div className="mb-8">
                        <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                            Welcome back, {user?.displayName?.split(' ')[0] || 'there'}! 👋
                        </h1>
                        <p className="text-gray-400">Ready to practice some English?</p>
                    </div>

                    {/* Quick Start */}
                    <Card className="mb-8 bg-gradient-to-r from-indigo-500/20 to-purple-600/20 border-indigo-500/30">
                        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                            <div>
                                <h2 className="text-xl font-bold text-white mb-1">Start Practicing Now</h2>
                                <p className="text-gray-300">Jump right into a conversation</p>
                            </div>
                            <Button
                                variant="primary"
                                size="lg"
                                onClick={() => router.push('/setup')}
                                leftIcon={<Play className="w-5 h-5" />}
                            >
                                Quick Start
                            </Button>
                        </div>
                    </Card>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        {statsCards.map((stat, index) => {
                            const Icon = stat.icon
                            return (
                                <motion.div
                                    key={stat.label}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                >
                                    <Card hover>
                                        <div className="flex items-start gap-4">
                                            <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.color}`}>
                                                <Icon className="w-6 h-6 text-white" />
                                            </div>
                                            <div>
                                                <p className="text-gray-400 text-sm mb-1">{stat.label}</p>
                                                <div className="flex items-end gap-2">
                                                    <p className="text-2xl font-bold text-white">
                                                        {loading ? '...' : stat.value}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </Card>
                                </motion.div>
                            )
                        })}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Performance Report */}
                        <div className="lg:col-span-2">
                            <Card className="h-full">
                                <div className="flex items-center justify-between mb-8">
                                    <h2 className="text-xl font-bold text-white">Performance Report</h2>
                                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 text-green-400 text-xs font-medium">
                                        <TrendingUp className="w-3 h-3" />
                                        {analytics?.confidence_trend || 'Stable'}
                                    </div>
                                </div>

                                <div className="space-y-8">
                                    {/* Confidence Chart */}
                                    <div>
                                        <p className="text-gray-400 text-sm mb-4">Confidence Score Trend</p>
                                        <div className="h-48 flex items-end gap-2 px-2">
                                            {analytics?.recent_scores?.length ? analytics.recent_scores.map((score, i) => (
                                                <motion.div
                                                    key={i}
                                                    initial={{ height: 0 }}
                                                    animate={{ height: `${score}%` }}
                                                    className="flex-1 bg-gradient-to-t from-indigo-500 to-purple-500 rounded-t-sm relative group"
                                                >
                                                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/80 text-white text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                                        {score}%
                                                    </div>
                                                </motion.div>
                                            )) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-500 text-sm italic">
                                                    Complete more sessions to see your trend
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex justify-between mt-2 text-[10px] text-gray-500">
                                            <span>Oldest</span>
                                            <span>Most Recent</span>
                                        </div>
                                    </div>

                                    {/* Improvement Areas */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <p className="text-gray-400 text-sm mb-3">Improvement Areas</p>
                                            <div className="flex flex-wrap gap-2">
                                                {analytics?.common_improvement_areas?.length ? analytics.common_improvement_areas.map((area, i) => (
                                                    <span key={i} className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-gray-300 text-xs capitalize">
                                                        {area.replace('_', ' ')}
                                                    </span>
                                                )) : (
                                                    <p className="text-gray-500 text-xs italic">No data yet</p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                                            <p className="text-white text-sm font-medium mb-1">Learning Tip</p>
                                            <p className="text-gray-400 text-xs leading-relaxed">
                                                {analytics?.common_improvement_areas?.includes('grammar')
                                                    ? 'Focus on using diverse sentence structures in your next session.'
                                                    : 'Great job! Try to incorporate more idiomatic expressions to sound more natural.'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </div>

                        {/* Recent Activity */}
                        <Card className="h-full">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-white">Recent Sessions</h2>
                                <button
                                    onClick={() => router.push('/profile')}
                                    className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
                                >
                                    View All
                                </button>
                            </div>

                            {loading ? (
                                <div className="space-y-4">
                                    {[...Array(3)].map((_, i) => (
                                        <div key={i} className="h-16 bg-white/5 rounded-lg animate-pulse" />
                                    ))}
                                </div>
                            ) : analytics?.total_sessions === 0 ? (
                                <div className="text-center py-12">
                                    <Calendar className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                                    <p className="text-gray-400 mb-4">No practice sessions yet</p>
                                    <Button variant="primary" onClick={() => router.push('/setup')}>
                                        Start Your First Session
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {/* Here you would ideally fetch and map actual sessions */}
                                    {/* Mock for now as the analytics endpoint doesn't return full sessions */}
                                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="w-2 h-2 rounded-full bg-green-400" />
                                            <div>
                                                <p className="text-white font-medium text-sm">Last Session</p>
                                                <p className="text-xs text-gray-400">Total Avg: {analytics?.avg_confidence}%</p>
                                            </div>
                                        </div>
                                        <span className="text-gray-400 text-sm">Score: {analytics?.recent_scores?.[0] ?? 0}%</span>
                                    </div>
                                </div>
                            )}
                        </Card>
                    </div>
                </main>
            </div>
        </ProtectedRoute>
    )
}
