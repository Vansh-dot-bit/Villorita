'use client';

import { useState, useEffect } from "react"
import { useAuth } from "@/context/auth-context"
import { usePathname } from "next/navigation"
import { ComingSoon } from "@/components/ui/ComingSoon"

export function SiteGate({ children }: { children: React.ReactNode }) {
    const [settings, setSettings] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const { user, isLoading: authLoading } = useAuth()
    const pathname = usePathname()

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await fetch('/api/site-settings')
                const data = await res.json()
                if (data.success) {
                    setSettings(data.settings)
                }
            } catch (error) {
                console.error("Failed to fetch site settings", error)
            } finally {
                setLoading(false)
            }
        }
        fetchSettings()
    }, [])

    // Exclude certain paths from the gate
    const isExcludedPath = 
        pathname.startsWith('/admin') || 
        pathname.startsWith('/api') || 
        pathname.startsWith('/login') ||
        pathname.startsWith('/vendor') ||
        pathname.startsWith('/delivery-agent');

    // If still loading settings, show nothing (or a small loader) to prevent flicker
    if (loading || authLoading) {
        return <div className="min-h-screen bg-white" />;
    }

    // Bypass logic:
    // 1. If "Coming Soon" is OFF
    // 2. If user is ADMIN or SUPERADMIN
    // 3. If the current path is specifically excluded (like admin panel)
    const canBypass = 
        !settings?.isComingSoon || 
        (user && (user.role === 'admin' || user.role === 'superadmin')) ||
        isExcludedPath;

    if (!canBypass) {
        return <ComingSoon message={settings?.comingSoonMessage} />;
    }

    return <>{children}</>;
}
