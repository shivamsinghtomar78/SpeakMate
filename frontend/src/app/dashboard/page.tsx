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

interface Stats {
    totalSessions: number
    totalMinutes: number
    currentStreak: number
    longestStreak: number
}

export default function DashboardPage() {
    const { user } = useAuth()
    const router = useRouter()
    const [stats, setStats] = useState<Stats>({
        totalSessions: 0,
        totalMinutes: 0,
        currentStreak: 0,
        longestStreak: 0,
    })
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // TODO: Fetch user stats from backend
        // For now, mock data
        setTimeout(() => {
            setStats({
                totalSessions: 12,
                totalMinutes: 240,
                currentStreak: 3,
                longestStreak: 7,
            })
            setLoading(false)
        }, 500)
    }, [])

    const statsCards = [
        {
            icon: Target,
            label: 'Total Sessions',
            value: stats.totalSessions,
            color: 'from-indigo-500 to-blue-500',
        },
        {
            icon: Clock,
            label: 'Practice Time',
            value: `${Math.floor(stats.totalMinutes / 60)}h ${stats.totalMinutes % 60}m`,
            color: 'from-purple-500 to-pink-500',
        },
        {
            icon: Flame,
            label: 'Current Streak',
            value: `${stats.currentStreak} days`,
            color: 'from-orange-500 to-red-500',
        },
        {
            icon: TrendingUp,
            label: 'Longest Streak',
            value: `${stats.longestStreak} days`,
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
                                                <p className="text-2xl font-bold text-white">
                                                    {loading ? '...' : stat.value}
                                                </p>
                                            </div>
                                        </div>
                                    </Card>
                                </motion.div>
                            )
                        })}
                    </div>

                    {/* Recent Activity */}
                    <Card>
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
                        ) : stats.totalSessions === 0 ? (
                            <div className="text-center py-12">
                                <Calendar className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                                <p className="text-gray-400 mb-4">No practice sessions yet</p>
                                <Button variant="primary" onClick={() => router.push('/setup')}>
                                    Start Your First Session
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {/* Mock recent sessions */}
                                <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="w-2 h-2 rounded-full bg-green-400" />
                                        <div>
                                            <p className="text-white font-medium">Intermediate - Free Talk</p>
                                            <p className="text-sm text-gray-400">2 hours ago</p>
                                        </div>
                                    </div>
                                    <span className="text-gray-400">15 min</span>
                                </div>
                                <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="w-2 h-2 rounded-full bg-blue-400" />
                                        <div>
                                            <p className="text-white font-medium">Beginner - Travel</p>
                                            <p className="text-sm text-gray-400">Yesterday</p>
                                        </div>
                                    </div>
                                    <span className="text-gray-400">20 min</span>
                                </div>
                                <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="w-2 h-2 rounded-full bg-purple-400" />
                                        <div>
                                            <p className="text-white font-medium">Advanced - Business</p>
                                            <p className="text-sm text-gray-400">2 days ago</p>
                                        </div>
                                    </div>
                                    <span className="text-gray-400">25 min</span>
                                </div>
                            </div>
                        )}
                    </Card>
                </main>
            </div>
        </ProtectedRoute>
    )
}
