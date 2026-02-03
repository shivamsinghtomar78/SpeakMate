'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Clock, Target, Flame, TrendingUp, Play, Calendar, ChevronRight } from 'lucide-react'
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

import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    Cell
} from 'recharts'

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

    // Prepare chart data
    const chartData = analytics?.recent_scores?.map((score, i) => ({
        name: `S${i + 1}`,
        score: score
    })) || []

    const statsCards = [
        {
            icon: Target,
            label: 'Total Sessions',
            value: analytics?.total_sessions ?? 0,
            color: 'from-indigo-500 to-blue-500',
            trend: '+12%',
        },
        {
            icon: Clock,
            label: 'Practice Time',
            value: analytics?.total_practice_time ?? '0m',
            color: 'from-purple-500 to-pink-500',
            trend: '+5m today',
        },
        {
            icon: Flame,
            label: 'Improvement',
            value: `${analytics?.improvement_score ?? 0}%`,
            color: 'from-orange-500 to-red-500',
            trend: 'Trending up',
        },
        {
            icon: TrendingUp,
            label: 'Avg. Confidence',
            value: `${analytics?.avg_confidence ?? 0}%`,
            color: 'from-green-500 to-emerald-500',
            trend: 'Excellent',
        },
    ]

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-[#020205] text-white selection:bg-indigo-500/30">
                <Header />

                {/* Animated Background Highlights */}
                <div className="fixed inset-0 overflow-hidden pointer-events-none">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/10 rounded-full blur-[120px]"
                    />
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 rounded-full blur-[120px]"
                    />
                </div>

                <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                    {/* Welcome Header */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                        <div>
                            <motion.h1
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="text-4xl md:text-5xl font-black tracking-tight mb-3"
                            >
                                Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">{user?.displayName?.split(' ')[0] || 'Partner'}</span>!
                            </motion.h1>
                            <p className="text-gray-400 text-lg">Your linguistic journey is looking great today.</p>
                        </div>

                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                        >
                            <Button
                                variant="primary"
                                size="lg"
                                onClick={() => router.push('/setup')}
                                leftIcon={<Play className="w-5 h-5 fill-current" />}
                                className="shadow-xl shadow-indigo-500/25 px-8"
                            >
                                Start Session
                            </Button>
                        </motion.div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                        {statsCards.map((stat, index) => {
                            const Icon = stat.icon
                            return (
                                <motion.div
                                    key={stat.label}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                >
                                    <div className="group p-6 rounded-3xl bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.06] hover:border-white/[0.15] transition-all duration-500">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className={`p-3 rounded-2xl bg-gradient-to-br ${stat.color} shadow-lg`}>
                                                <Icon className="w-6 h-6 text-white" />
                                            </div>
                                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{stat.trend}</span>
                                        </div>
                                        <div>
                                            <p className="text-gray-400 text-sm font-medium mb-1">{stat.label}</p>
                                            <p className="text-3xl font-black text-white group-hover:scale-105 origin-left transition-transform duration-500 leading-none">
                                                {loading ? <span className="inline-block w-12 h-6 bg-white/10 animate-pulse rounded" /> : stat.value}
                                            </p>
                                        </div>
                                    </div>
                                </motion.div>
                            )
                        })}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Interactive Performance Chart */}
                        <div className="lg:col-span-2">
                            <div className="h-full p-8 rounded-3xl bg-white/[0.02] border border-white/[0.05] backdrop-blur-sm">
                                <div className="flex items-center justify-between mb-10">
                                    <div>
                                        <h2 className="text-2xl font-bold text-white mb-1">Performance Report</h2>
                                        <p className="text-sm text-gray-400">Your confidence across recent interactions</p>
                                    </div>
                                    <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs font-bold">
                                        <TrendingUp className="w-4 h-4" />
                                        {analytics?.confidence_trend || 'Stable Trend'}
                                    </div>
                                </div>

                                <div className="h-[300px] w-full">
                                    {loading ? (
                                        <div className="w-full h-full bg-white/5 animate-pulse rounded-2xl" />
                                    ) : chartData.length > 0 ? (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={chartData}>
                                                <defs>
                                                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" vertical={false} />
                                                <XAxis
                                                    dataKey="name"
                                                    axisLine={false}
                                                    tickLine={false}
                                                    tick={{ fill: '#4b5563', fontSize: 12 }}
                                                    dy={10}
                                                />
                                                <YAxis
                                                    hide
                                                    domain={[0, 100]}
                                                />
                                                <Tooltip
                                                    contentStyle={{
                                                        backgroundColor: '#0f172a',
                                                        border: '1px solid #ffffff1a',
                                                        borderRadius: '12px',
                                                        fontSize: '12px'
                                                    }}
                                                    itemStyle={{ color: '#818cf8' }}
                                                />
                                                <Area
                                                    type="monotone"
                                                    dataKey="score"
                                                    stroke="#818cf8"
                                                    strokeWidth={3}
                                                    fillOpacity={1}
                                                    fill="url(#colorScore)"
                                                    animationDuration={2000}
                                                />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center text-gray-500 italic gap-2 bg-white/[0.02] rounded-2xl border border-dashed border-white/10">
                                            <Calendar className="w-8 h-8 opacity-20" />
                                            <span>Complete more sessions to unlock deep analytics</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Recent Activity & Tips */}
                        <div className="space-y-6">
                            {/* Learning Tip Card */}
                            <div className="p-6 rounded-3xl bg-gradient-to-br from-indigo-600/20 to-purple-700/20 border border-indigo-500/20">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 rounded-xl bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                                        <Target className="w-5 h-5 text-white" />
                                    </div>
                                    <h3 className="font-bold text-white">Daily Tip</h3>
                                </div>
                                <p className="text-indigo-100/80 leading-relaxed text-sm">
                                    {analytics?.common_improvement_areas?.includes('grammar')
                                        ? "I've noticed some tense inconsistencies. Try focusing on 'Past Continuous' for story-telling in your next session!"
                                        : analytics?.common_improvement_areas?.includes('vocabulary')
                                            ? "You're doing great! To reach Advanced, try using phrasal verbs like 'bring up' or 'get across' more naturally."
                                            : "Your confidence is surging! Keep the momentum by trying a difficult topic like 'Global Economics' or 'Modern Art'."}
                                </p>
                            </div>

                            {/* Recent Sessions */}
                            <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/[0.05] flex-1">
                                <h2 className="text-xl font-bold text-white mb-6">Experience</h2>
                                <div className="space-y-4">
                                    {loading ? (
                                        [...Array(3)].map((_, i) => (
                                            <div key={i} className="h-14 bg-white/5 rounded-2xl animate-pulse" />
                                        ))
                                    ) : analytics?.total_sessions === 0 ? (
                                        <p className="text-gray-500 text-sm italic text-center py-6">No sessions yet</p>
                                    ) : (
                                        <div className="flex flex-col gap-3">
                                            <div className="group flex items-center justify-between p-4 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-transparent hover:border-white/10 transition-all cursor-pointer">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                                                        <TrendingUp className="w-5 h-5 text-green-500" />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-sm text-white">Last Performance</p>
                                                        <p className="text-xs text-gray-500">{analytics?.avg_confidence}% consistency</p>
                                                    </div>
                                                </div>
                                                <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-white transition-colors" />
                                            </div>
                                            <div className="group flex items-center justify-between p-4 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-transparent hover:border-white/10 transition-all cursor-pointer">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                                                        <Clock className="w-5 h-5 text-purple-500" />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-sm text-white">Total Time</p>
                                                        <p className="text-xs text-gray-500">{analytics?.total_practice_time} practiced</p>
                                                    </div>
                                                </div>
                                                <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-white transition-colors" />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </ProtectedRoute>
    )
}
