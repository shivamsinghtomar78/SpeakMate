import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
    title: 'SpeakMate - AI English Speaking Partner',
    description: 'Practice speaking English with AI-powered real-time feedback on grammar, pronunciation, and fluency',
    keywords: 'English, speaking, practice, AI, language learning, pronunciation, fluency',
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en">
            <body className={`${inter.className} antialiased`}>
                <AuthProvider>
                    {children}
                </AuthProvider>
            </body>
        </html>
    )
}
