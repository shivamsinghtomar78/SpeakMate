'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Mail, Lock, User, LogIn, UserPlus, Chrome } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

interface AuthModalProps {
    isOpen: boolean
    onClose: () => void
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
    const [isLogin, setIsLogin] = useState(true)
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const { signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth()

    if (!isOpen) return null

    const handleEmailSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            if (isLogin) {
                await signInWithEmail(email, password)
            } else {
                await signUpWithEmail(email, password)
            }
            onClose()
        } catch (err: any) {
            console.error('Email authentication error:', err)
            if (err.code === 'auth/unauthorized-domain') {
                setError('Error: This domain is not authorized in your Firebase Console. Please add your current domain to the "Authorized domains" list in the Firebase Authentication settings.')
            } else {
                setError(err.message || 'Authentication failed')
            }
        } finally {
            setLoading(false)
        }
    }

    const handleGoogleSignIn = async () => {
        setError('')
        setLoading(true)

        try {
            await signInWithGoogle()
            onClose()
        } catch (err: any) {
            console.error('Google sign-in error:', err)
            if (err.code === 'auth/unauthorized-domain') {
                setError('Error: This domain is not authorized in your Firebase Console. Please add your current domain to the "Authorized domains" list in the Firebase Authentication settings.')
            } else {
                setError(err.message || 'Google sign-in failed')
            }
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative z-10 w-full max-w-md p-8 bg-[#1a1a2e] rounded-2xl border border-[#2a2a45] shadow-2xl"
            >
                <h2 className="text-2xl font-bold text-center gradient-text mb-2">
                    {isLogin ? 'Welcome Back' : 'Create Account'}
                </h2>
                <p className="text-gray-400 text-center mb-6">
                    {isLogin
                        ? 'Sign in to continue your English practice'
                        : 'Join us to start improving your English'
                    }
                </p>

                {/* Google Sign In */}
                <button
                    onClick={handleGoogleSignIn}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white hover:bg-gray-100 text-gray-800 font-medium rounded-lg transition-colors mb-4"
                >
                    <Chrome className="w-5 h-5" />
                    Continue with Google
                </button>

                <div className="flex items-center gap-4 my-4">
                    <div className="flex-1 h-px bg-gray-700" />
                    <span className="text-gray-500 text-sm">or</span>
                    <div className="flex-1 h-px bg-gray-700" />
                </div>

                {/* Email Form */}
                <form onSubmit={handleEmailSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm text-gray-400 mb-1">Email</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@example.com"
                                className="input w-full pl-10"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm text-gray-400 mb-1">Password</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="input w-full pl-10"
                                required
                                minLength={6}
                            />
                        </div>
                    </div>

                    {error && (
                        <p className="text-red-400 text-sm">{error}</p>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full btn-primary py-3 flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <>
                                {isLogin ? <LogIn className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
                                {isLogin ? 'Sign In' : 'Create Account'}
                            </>
                        )}
                    </button>
                </form>

                {/* Toggle */}
                <p className="text-center text-gray-400 mt-6">
                    {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
                    <button
                        onClick={() => setIsLogin(!isLogin)}
                        className="text-primary-400 hover:text-primary-300 font-medium"
                    >
                        {isLogin ? 'Sign up' : 'Sign in'}
                    </button>
                </p>
            </motion.div>
        </div>
    )
}
