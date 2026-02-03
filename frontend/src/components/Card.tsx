'use client'

import { ReactNode } from 'react'
import { motion, HTMLMotionProps } from 'framer-motion'

interface CardProps extends HTMLMotionProps<'div'> {
    children: ReactNode
    hover?: boolean
    padding?: 'none' | 'sm' | 'md' | 'lg'
}

export default function Card({ children, hover = false, padding = 'md', className = '', ...props }: CardProps) {
    const paddingClasses = {
        none: '',
        sm: 'p-4',
        md: 'p-6',
        lg: 'p-8'
    }

    return (
        <motion.div
            className={`
                bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl
                ${paddingClasses[padding]}
                ${hover ? 'transition-all hover:bg-white/10 hover:border-white/20' : ''}
                ${className}
            `}
            whileHover={hover ? { y: -4 } : {}}
            {...props}
        >
            {children}
        </motion.div>
    )
}
