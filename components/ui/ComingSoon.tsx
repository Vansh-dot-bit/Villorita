'use client';

import { useState } from "react"
import { motion } from "framer-motion"
import { Clock, Instagram, ArrowRight, ShieldCheck } from "lucide-react"
import { Button } from "./button"
import Image from "next/image"
import { AuthModal } from "@/components/auth/auth-modal"

interface ComingSoonProps {
    message?: string;
}

export function ComingSoon({ message }: ComingSoonProps) {
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

    return (
        <div className="min-h-screen bg-[#0f0f0f] text-white flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Animated Background Gradients */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/20 blur-[120px] rounded-full animate-pulse" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/20 blur-[120px] rounded-full animate-pulse decoration-1000" />
            
            {/* Floating Elements (Decorative) */}
            <motion.div 
                animate={{ y: [0, -20, 0], opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-1/4 right-1/4 h-24 w-24 border border-white/5 rounded-3xl rotate-12"
            />
            <motion.div 
                animate={{ y: [0, 20, 0], opacity: [0.2, 0.5, 0.2] }}
                transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
                className="absolute bottom-1/4 left-1/4 h-32 w-32 border border-white/5 rounded-full"
            />

            <div className="max-w-4xl w-full z-10 text-center space-y-12">
                {/* Logo Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="flex justify-center"
                >
                    <div className="relative h-20 w-64">
                         <Image 
                            src="/logo.png" 
                            alt="Villorita" 
                            fill 
                            className="object-contain brightness-0 invert"
                        />
                    </div>
                </motion.div>

                {/* Main Heading */}
                <div className="space-y-6">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 1, delay: 0.2 }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-purple-400 text-xs font-black uppercase tracking-[0.3em]"
                    >
                        <Clock className="h-4 w-4" />
                        Launching Soon
                    </motion.div>
                    
                    <motion.h1 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.4 }}
                        className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter"
                    >
                        Something <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-500">Exceptional</span> is Brewing.
                    </motion.h1>
                    
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 1, delay: 0.6 }}
                        className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto font-medium"
                    >
                        {message || "We're currently perfecting our slice of heaven. Our store is undergoing maintenance to bring you a sweeter experience."}
                    </motion.p>
                </div>

                {/* Notify Form */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.8 }}
                    className="max-w-md mx-auto"
                >
                    <div className="p-1 rounded-2xl bg-white/5 border border-white/10 flex items-center shadow-2xl backdrop-blur-xl">
                        <input 
                            type="email" 
                            placeholder="your@email.com" 
                            className="bg-transparent border-none focus:ring-0 flex-1 px-4 text-sm outline-none"
                        />
                        <Button className="rounded-xl px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-90 transition-opacity">
                            Notify Me <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </div>
                    <p className="text-[10px] text-gray-500 mt-3 font-medium">Join 2,400+ people waiting for our return.</p>
                </motion.div>

                {/* Social Links */}
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 1, delay: 1 }}
                    className="flex flex-col items-center gap-8 pt-10"
                >
                    <div className="flex justify-center gap-6">
                        {[
                            { icon: Instagram, href: "https://www.instagram.com/vill.orita?igsh=ZGk3MzZtMDU4NjZs" },
                        ].map((item, i) => (
                            <a 
                                key={i} 
                                href={item.href} 
                                target="_blank"
                                rel="noopener noreferrer"
                                className="h-12 w-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 hover:border-white/20 transition-all group"
                            >
                                <item.icon className="h-5 w-5 text-gray-400 group-hover:text-white group-hover:scale-110 transition-all" />
                            </a>
                        ))}
                    </div>

                    <button 
                        onClick={() => setIsAuthModalOpen(true)}
                        className="text-[10px] text-gray-600 hover:text-gray-400 transition-colors flex items-center gap-1.5 font-black uppercase tracking-widest"
                    >
                        <ShieldCheck className="h-3 w-3" />
                        Admin Access
                    </button>
                </motion.div>
            </div>

            {/* Bottom Tagline */}
            <div className="absolute bottom-10 left-0 right-0 text-center">
                <p className="text-[10px] text-gray-600 uppercase tracking-widest font-black">Powered by Villorita Cloud</p>
            </div>

            <AuthModal 
                isOpen={isAuthModalOpen} 
                onClose={() => setIsAuthModalOpen(false)} 
                initialMode="login"
            />
        </div>
    )
}
