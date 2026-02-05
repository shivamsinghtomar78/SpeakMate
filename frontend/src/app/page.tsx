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
        <main className="min-h-screen bg-[#0A0A0B] text-white selection:bg-primary/30 selection:text-white">
            {/* Ambient Background Glows */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 rounded-full blur-[120px] animate-pulse delay-1000" />
            </div>

            {/* Header */}
            <header className="relative z-50 flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.4)]">
                        <Mic className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-xl font-bold tracking-tight">SpeakMate</span>
                </div>

                <div className="hidden md:flex items-center gap-8">
                    <Link href="#features" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">Features</Link>
                    <Link href="#" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">Pricing</Link>
                    <Link href="#" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">FAQ</Link>
                </div>

                <Link
                    href="/setup"
                    className="px-6 py-2.5 rounded-full bg-white/5 border border-white/10 text-sm font-semibold hover:bg-white/10 transition-all duration-300"
                >
                    Get Started
                </Link>
            </header>

            {/* Hero Section */}
            <section className="relative z-10 pt-20 pb-32 px-4 text-center">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 1 }}
                >
                    <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter mb-8 leading-[1.1]">
                        Master English Speaking <br />
                        <span className="text-primary italic">with your AI Buddy.</span>
                    </h1>

                    <p className="text-lg md:text-xl text-gray-400 mb-12 max-w-2xl mx-auto leading-relaxed">
                        Real-time feedback, natural conversations, and personalized learning paths. <br className="hidden md:block" />
                        Experience the high-end way to learn English.
                    </p>

                    <Link
                        href="/setup"
                        className="group relative inline-flex items-center gap-3 px-10 py-5 bg-primary rounded-full text-white font-bold text-lg transition-all duration-500 hover:scale-105 hover:shadow-[0_0_40px_rgba(99,102,241,0.5)]"
                    >
                        Start Practicing for Free
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        <div className="absolute inset-0 rounded-full bg-primary/40 blur-xl opacity-0 group-hover:opacity-100 transition-opacity -z-10" />
                    </Link>
                </motion.div>

                {/* Social Proof */}
                <div className="mt-24 pt-12 border-t border-white/5 max-w-5xl mx-auto">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500 mb-8">
                        Trusted by 50,000+ learners worldwide
                    </p>
                    <div className="flex flex-wrap justify-center items-center gap-12 opacity-30 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-700">
                        {/* Minimalist Logo Placeholders */}
                        <div className="text-xl font-black">GOOGLE</div>
                        <div className="text-xl font-black">META</div>
                        <div className="text-xl font-black">NETFLIX</div>
                        <div className="text-xl font-black">AIRBNB</div>
                    </div>
                </div>
            </section>

            {/* Feature Grid */}
            <section id="features" className="relative z-10 py-32 px-8 max-w-7xl mx-auto">
                <div className="grid md:grid-cols-3 gap-8">
                    {[
                        {
                            title: "Real-time Feedback",
                            desc: "Get instant grammar and pronunciation corrections as you speak.",
                            icon: MessageCircle
                        },
                        {
                            title: "Natural Conversations",
                            desc: "Talk to an AI that sounds and feels like a native speaker.",
                            icon: Headphones
                        },
                        {
                            title: "Progress Tracking",
                            desc: "Monitor your improvement with detailed session analytics.",
                            icon: TrendingUp
                        }
                    ].map((feature, i) => (
                        <motion.div
                            key={feature.title}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                            className="card group hover:border-primary/50"
                        >
                            <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-6 group-hover:bg-primary transition-colors duration-500">
                                <feature.icon className="w-6 h-6 text-primary group-hover:text-white transition-colors" />
                            </div>
                            <h3 className="text-xl font-bold mb-3 tracking-tight">{feature.title}</h3>
                            <p className="text-gray-400 leading-relaxed text-sm">{feature.desc}</p>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* Footer */}
            <footer className="relative z-10 py-20 px-8 border-t border-white/5 bg-[#050505]">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                            <Mic className="w-4 h-4 text-primary" />
                        </div>
                        <span className="font-bold">SpeakMate</span>
                    </div>
                    <div className="flex gap-12 text-sm font-medium text-gray-500">
                        <Link href="#" className="hover:text-white transition-colors">Privacy</Link>
                        <Link href="#" className="hover:text-white transition-colors">Terms</Link>
                        <Link href="#" className="hover:text-white transition-colors">Twitter</Link>
                    </div>
                    <p className="text-sm text-gray-600">© 2026 SpeakMate. AI partner for English.</p>
                </div>
            </footer>
        </main>
    )
}
