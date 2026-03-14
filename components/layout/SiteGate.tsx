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
    // 2. If user is ADMIN or SUPERADMIN (Full access)
    // 3. If user is VENDOR and path is vendor dashboard or API
    // 4. If user is DELIVERY_AGENT and path is delivery dashboard or API
    // 5. If path is API or Login (Universal access)
    
    let canBypass = !settings?.isComingSoon;

    if (settings?.isComingSoon) {
        const isStaff = user?.role === 'admin' || user?.role === 'superadmin' || user?.role === 'vendor' || user?.role === 'delivery_agent';
        
        if (isStaff) {
            canBypass = true;
        } else if (pathname.startsWith('/api') || pathname.startsWith('/login')) {
            canBypass = true;
        }
    }

    if (!canBypass) {
        return <ComingSoon message={settings?.comingSoonMessage} />;
    }

    return <>{children}</>;
}
