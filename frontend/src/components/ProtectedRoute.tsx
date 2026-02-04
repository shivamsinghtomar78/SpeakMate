'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { motion } from 'framer-motion'

interface ProtectedRouteProps {
    children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
    const { user, loading } = useAuth()
    const router = useRouter()

    useEffect(() => {
        if (!loading && !user) {
            router.replace('/login')
        }
    }, [user, loading, router])

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
                <div className="relative group">
                    {/* Animated Glow */}
                    <div className="absolute inset-0 rounded-full bg-indigo-500/20 blur-2xl animate-pulse group-hover:bg-indigo-500/30 transition-all duration-1000" />

                    <div className="relative flex flex-col items-center">
                        <motion.div
                            animate={{
                                rotate: 360,
                                scale: [1, 1.1, 1],
                            }}
                            transition={{
                                rotate: { duration: 2, repeat: Infinity, ease: "linear" },
                                scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
                            }}
                            className="w-16 h-16 border-t-2 border-r-2 border-indigo-500 rounded-full mb-6"
                        />
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-indigo-400 font-medium tracking-widest uppercase text-xs"
                        >
                            Authenticating
                        </motion.p>
                    </div>
                </div>
            </div>
        )
    }

    if (!user) {
        return null
    }

    return <>{children}</>
}
