'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { User, Mail, Calendar, Settings, LogOut, Camera, Target, Flame } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import Header from '@/components/Header'
import Card from '@/components/Card'
import Button from '@/components/Button'

export default function ProfilePage() {
    const { user, logout } = useAuth()
    const [sessions, setSessions] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // TODO: Fetch user's session history from backend
        // Mock data
        setTimeout(() => {
            setSessions([
                {
                    id: '1',
                    date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
                    level: 'intermediate',
                    topic: 'free_talk',
                    duration: 15,
                },
                {
                    id: '2',
                    date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
                    level: 'beginner',
                    topic: 'travel',
                    duration: 20,
                },
                {
                    id: '3',
                    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
                    level: 'advanced',
                    topic: 'business',
                    duration: 25,
                },
            ])
            setLoading(false)
        }, 500)
    }, [])

    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        const now = new Date()
        const diffMs = now.getTime() - date.getTime()
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60))

        if (diffHours < 24) {
            return `${diffHours} hours ago`
        }
        const diffDays = Math.floor(diffHours / 24)
        if (diffDays === 1) return 'Yesterday'
        if (diffDays < 7) return `${diffDays} days ago`
        return date.toLocaleDateString()
    }

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#0f0f1a] to-[#1a1025]">
                <Header />

                {/* Background Effects */}
                <div className="fixed inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-1/3 left-1/3 w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-3xl" />
                    <div className="absolute bottom-1/3 right-1/3 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-3xl" />
                </div>

                <main className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Profile Header */}
                    <Card className="mb-8">
                        <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                            {/* Avatar */}
                            <div className="relative group">
                                {user?.photoURL ? (
                                    <img
                                        src={user.photoURL}
                                        alt={user.displayName || 'User'}
                                        className="w-24 h-24 rounded-full border-4 border-white/20"
                                    />
                                ) : (
                                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center border-4 border-white/20">
                                        <User className="w-12 h-12 text-white" />
                                    </div>
                                )}
                                <button className="absolute bottom-0 right-0 p-2 rounded-full bg-indigo-500 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Camera className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Info */}
                            <div className="flex-1 text-center md:text-left">
                                <h1 className="text-2xl font-bold text-white mb-1">
                                    {user?.displayName || 'User'}
                                </h1>
                                <div className="flex flex-col md:flex-row items-center gap-4 text-gray-400 text-sm mb-4">
                                    <div className="flex items-center gap-2">
                                        <Mail className="w-4 h-4" />
                                        {user?.email}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-4 h-4" />
                                        Joined {user?.metadata.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString() : 'recently'}
                                    </div>
                                </div>
                                {/* <Button variant="secondary" size="sm" leftIcon={<Settings className="w-4 h-4" />}>
                                    Edit Profile
                                </Button> */}
                            </div>
                        </div>
                    </Card>

                    {/* Learning Progress Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                        <Card>
                            <h2 className="text-xl font-bold text-white mb-6">Learning Progress</h2>
                            <div className="space-y-6">
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-sm text-gray-400">Overall Proficiency</span>
                                        <span className="text-sm font-bold text-indigo-400">65%</span>
                                    </div>
                                    <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: '65%' }}
                                            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                                        <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Consistency</p>
                                        <p className="text-lg font-bold text-white">8/10</p>
                                    </div>
                                    <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                                        <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Vocabulary</p>
                                        <p className="text-lg font-bold text-white">B2</p>
                                    </div>
                                </div>
                            </div>
                        </Card>

                        <Card>
                            <h2 className="text-xl font-bold text-white mb-6">Recommended Focus</h2>
                            <div className="space-y-4">
                                <div className="flex items-start gap-3 p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                                    <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
                                        <Target className="w-4 h-4 text-indigo-400" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-white mb-1">Sentence Complexity</p>
                                        <p className="text-xs text-gray-400">Try using more relative clauses and conjunctions in your speech.</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3 p-3 rounded-xl bg-purple-500/10 border border-purple-500/20">
                                    <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                                        <Flame className="w-4 h-4 text-purple-400" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-white mb-1">Pronunciation</p>
                                        <p className="text-xs text-gray-400">Focus on the 'th' sounds and intonation in questions.</p>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* Session History */}
                    <Card>
                        <h2 className="text-xl font-bold text-white mb-6">Session History</h2>

                        {loading ? (
                            <div className="space-y-4">
                                {[...Array(3)].map((_, i) => (
                                    <div key={i} className="h-20 bg-white/5 rounded-lg animate-pulse" />
                                ))}
                            </div>
                        ) : sessions.length === 0 ? (
                            <div className="text-center py-12">
                                <p className="text-gray-400 mb-4">No practice sessions yet</p>
                                <Button variant="primary" onClick={() => (window.location.href = '/setup')}>
                                    Start Your First Session
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {sessions.map((session, index) => (
                                    <motion.div
                                        key={session.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        className="p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-400 text-xs font-medium capitalize">
                                                        {session.level}
                                                    </span>
                                                    <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-400 text-xs font-medium capitalize">
                                                        {session.topic.replace('_', ' ')}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-400">{formatDate(session.date)}</p>
                                            </div>
                                            <span className="text-white font-medium">{session.duration} min</span>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </Card>

                    {/* Danger Zone */}
                    <Card className="mt-8 border-red-500/20">
                        <h2 className="text-xl font-bold text-white mb-4">Danger Zone</h2>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div>
                                <p className="text-white font-medium mb-1">Delete Account</p>
                                <p className="text-sm text-gray-400">
                                    Permanently delete your account and all data
                                </p>
                            </div>
                            <Button variant="danger" size="sm">
                                Delete Account
                            </Button>
                        </div>
                    </Card>
                </main>
            </div>
        </ProtectedRoute>
    )
}
