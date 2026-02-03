'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Mail, Lock, Chrome, AlertCircle, Mic, User } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import Button from '@/components/Button'
import Card from '@/components/Card'

export default function SignupPage() {
    const router = useRouter()
    const { signUpWithEmail, signInWithGoogle, user } = useAuth()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    // Redirect if already logged in
    useEffect(() => {
        if (user) {
            router.replace('/dashboard')
        }
    }, [user, router])

    const validatePassword = () => {
        if (password.length < 6) {
            return 'Password must be at least 6 characters'
        }
        if (password !== confirmPassword) {
            return 'Passwords do not match'
        }
        return null
    }

    const handleEmailSignup = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        const passwordError = validatePassword()
        if (passwordError) {
            setError(passwordError)
            return
        }

        setLoading(true)

        try {
            await signUpWithEmail(email, password)
            router.push('/dashboard')
        } catch (err: any) {
            if (err.code === 'auth/email-already-in-use') {
                setError('Email already in use')
            } else {
                setError(err.message || 'Failed to create account')
            }
        } finally {
            setLoading(false)
        }
    }

    const handleGoogleSignup = async () => {
        setError('')
        setLoading(true)

        try {
            await signInWithGoogle()
            router.push('/dashboard')
        } catch (err: any) {
            setError(err.message || 'Failed to sign up with Google')
        } finally {
            setLoading(false)
        }
    }

    const getPasswordStrength = () => {
        if (!password) return { strength: 0, label: '', color: '' }
        if (password.length < 6) return { strength: 1, label: 'Weak', color: 'text-red-400' }
        if (password.length < 10) return { strength: 2, label: 'Medium', color: 'text-yellow-400' }
        return { strength: 3, label: 'Strong', color: 'text-green-400' }
    }

    const passwordStrength = getPasswordStrength()

    return (
        <main className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#0f0f1a] to-[#1a1025] flex items-center justify-center p-4">
            {/* Background Effects */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 right-1/4 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 left-1/4 w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-3xl" />
            </div>

            <div className="w-full max-w-md relative z-10">
                {/* Logo */}
                <Link href="/" className="flex items-center justify-center gap-2 mb-8 group">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center transition-transform group-hover:scale-105">
                        <Mic className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-2xl font-bold text-white">SpeakMate</span>
                </Link>

                <Card>
                    <div className="text-center mb-6">
                        <h1 className="text-2xl font-bold text-white mb-2">Create Account</h1>
                        <p className="text-gray-400">Start your English learning journey</p>
                    </div>

                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-2"
                        >
                            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-red-400">{error}</p>
                        </motion.div>
                    )}

                    <form onSubmit={handleEmailSignup} className="space-y-4 mb-6">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                                Email
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    placeholder="you@example.com"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                                Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    placeholder="••••••••"
                                />
                            </div>
                            {password && (
                                <div className="mt-2">
                                    <div className="flex items-center gap-2">
                                        <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full transition-all ${passwordStrength.strength === 1
                                                    ? 'w-1/3 bg-red-400'
                                                    : passwordStrength.strength === 2
                                                        ? 'w-2/3 bg-yellow-400'
                                                        : 'w-full bg-green-400'
                                                    }`}
                                            />
                                        </div>
                                        <span className={`text-xs ${passwordStrength.color}`}>
                                            {passwordStrength.label}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
                                Confirm Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    id="confirmPassword"
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <Button type="submit" variant="primary" fullWidth loading={loading}>
                            Create Account
                        </Button>
                    </form>

                    <div className="relative mb-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-white/10" />
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-[#0a0a0f]/50 text-gray-400">Or continue with</span>
                        </div>
                    </div>

                    <Button
                        type="button"
                        variant="secondary"
                        fullWidth
                        onClick={handleGoogleSignup}
                        disabled={loading}
                        leftIcon={<Chrome className="w-5 h-5" />}
                    >
                        Google
                    </Button>

                    <p className="mt-6 text-center text-sm text-gray-400">
                        Already have an account?{' '}
                        <Link href="/login" className="text-indigo-400 hover:text-indigo-300 font-medium">
                            Sign in
                        </Link>
                    </p>
                </Card>
            </div>
        </main>
    )
}
