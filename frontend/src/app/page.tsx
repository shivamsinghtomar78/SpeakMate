'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Mic, Headphones, MessageCircle, TrendingUp, ArrowRight } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import Button from '@/components/Button'
import { motion } from 'framer-motion'

export default function LandingPage() {
    const { user, loading } = useAuth()
    const router = useRouter()

    useEffect(() => {
        if (!loading && user) {
            router.replace('/dashboard')
        }
    }, [user, loading, router])

    if (loading || user) return null

    return (
        <main className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#0f0f1a] to-[#1a1025] overflow-hidden">
            {/* Animated Background Orbs */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-3xl" />
            </div>

            {/* Navigation */}
            <nav className="relative z-10 flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
                <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                        <Mic className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-xl font-bold text-white">SpeakMate</span>
                </div>

                <Link
                    href="/setup"
                    className="px-4 py-2 text-sm font-medium text-indigo-300 hover:text-white transition-colors"
                >
                    Get Started
                </Link>
            </nav>

            {/* Hero Section */}
            <section className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-100px)] px-4 text-center">
                {/* 3D Animated Orb */}
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="relative mb-12"
                >
                    <div className="relative w-48 h-48 md:w-64 md:h-64">
                        {/* Outer glow */}
                        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-indigo-500/30 to-purple-600/30 blur-2xl animate-pulse" />

                        {/* Main orb */}
                        <div className="absolute inset-4 rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 shadow-2xl shadow-purple-500/50">
                            <div className="absolute inset-0 rounded-full bg-gradient-to-t from-transparent to-white/20" />
                        </div>

                        {/* Inner highlight */}
                        <div className="absolute inset-8 rounded-full bg-gradient-to-br from-white/30 to-transparent" />

                        {/* Rotating ring */}
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                            className="absolute inset-0"
                        >
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-white/80 blur-sm" />
                        </motion.div>
                    </div>
                </motion.div>

                {/* Headline */}
                <motion.h1
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3, duration: 0.8 }}
                    className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 max-w-4xl"
                >
                    Speak English{' '}
                    <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                        Fluently
                    </span>
                </motion.h1>

                {/* Subheadline */}
                <motion.p
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.5, duration: 0.8 }}
                    className="text-lg md:text-xl text-gray-400 mb-12 max-w-2xl"
                >
                    Practice speaking with AI. Get instant feedback on grammar, pronunciation, and fluency.
                </motion.p>

                {/* CTA Button */}
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.7, duration: 0.8 }}
                >
                    <Link
                        href="/setup"
                        className="group relative inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full text-white font-semibold text-lg transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/30 hover:scale-105"
                    >
                        Start Practicing
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />

                        {/* Glow effect */}
                        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 blur-xl opacity-50 group-hover:opacity-70 transition-opacity -z-10" />
                    </Link>
                </motion.div>

                {/* Feature badges */}
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.9, duration: 0.8 }}
                    className="flex flex-wrap justify-center gap-4 mt-16"
                >
                    {['Real-time Feedback', 'AI Powered', 'All Levels'].map((badge, i) => (
                        <span
                            key={badge}
                            className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm text-gray-400"
                        >
                            {badge}
                        </span>
                    ))}
                </motion.div>
            </section>
        </main>
    )
}
