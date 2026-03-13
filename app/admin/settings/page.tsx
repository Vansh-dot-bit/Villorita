'use client';

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { Header } from "@/components/layout/header"
import { Settings as SettingsIcon, Save, Info, AlertTriangle } from "lucide-react"
import { useAuth } from "@/context/auth-context"

export default function AdminSettingsPage() {
    const [settings, setSettings] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [updating, setUpdating] = useState(false)
    const { token } = useAuth()

    const fetchSettings = async () => {
        try {
            const res = await fetch('/api/site-settings')
            const data = await res.json()
            if (data.success) {
                setSettings(data.settings)
            } else {
                toast.error(data.error || "Failed to fetch settings")
            }
        } catch (error) {
            toast.error("Error fetching settings")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchSettings()
    }, [])

    const handleUpdateSettings = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!settings) return

        setUpdating(true)
        try {
            const res = await fetch('/api/site-settings', {
                method: 'PATCH',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    isComingSoon: settings.isComingSoon,
                    comingSoonMessage: settings.comingSoonMessage
                })
            })
            const data = await res.json()
            
            if (data.success) {
                toast.success("Settings updated successfully")
                setSettings(data.settings)
            } else {
                toast.error(data.error || "Failed to update settings")
            }
        } catch (error) {
            toast.error("Something went wrong")
        } finally {
            setUpdating(false)
        }
    }

    if (loading) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
    )

    return (
        <div className="space-y-6 max-w-4xl mx-auto pb-20">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        <SettingsIcon className="h-8 w-8 text-primary" />
                        Site Settings
                    </h1>
                    <p className="text-muted-foreground mt-1">Manage global site configuration and visibility.</p>
                </div>
            </div>

            <form onSubmit={handleUpdateSettings} className="space-y-6">
                <Card className="border-none shadow-sm overflow-hidden bg-white">
                    <CardHeader className="border-b bg-gray-50/50">
                        <CardTitle className="text-xl">Visibility Control</CardTitle>
                        <CardDescription>Configure if the site is accessible to public users.</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-6">
                        <div className="flex items-center justify-between p-4 bg-purple-50 rounded-2xl border border-purple-100 transition-all">
                            <div className="space-y-1">
                                <Label htmlFor="coming-soon" className="text-base font-bold text-purple-900 cursor-pointer">
                                    Maintenance Mode / Coming Soon
                                </Label>
                                <p className="text-sm text-purple-700 max-w-md italic">
                                    When enabled, users will see a "Coming Soon" page. Admins can still bypass this to view the site.
                                </p>
                            </div>
                            <Switch 
                                id="coming-soon" 
                                checked={settings?.isComingSoon || false}
                                onCheckedChange={(val) => setSettings({...settings, isComingSoon: val})}
                            />
                        </div>

                        {settings?.isComingSoon && (
                            <div className="space-y-3 p-4 bg-amber-50 rounded-2xl border border-amber-100 animate-in fade-in slide-in-from-top-2 duration-300">
                                <div className="flex items-center gap-2 text-amber-800 font-semibold text-sm">
                                    <AlertTriangle className="h-4 w-4" />
                                    <span>Customize Coming Soon Message</span>
                                </div>
                                <Textarea 
                                    className="bg-white border-amber-200 focus-visible:ring-amber-300"
                                    placeholder="Enter message for users..."
                                    value={settings?.comingSoonMessage || ''}
                                    onChange={(e) => setSettings({...settings, comingSoonMessage: e.target.value})}
                                    rows={4}
                                />
                                <p className="text-xs text-amber-700/70">
                                    This message will be displayed prominently on the "Coming Soon" page.
                                </p>
                            </div>
                        )}

                        <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 flex gap-3">
                            <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                            <div className="text-sm text-blue-900">
                                <p className="font-semibold mb-1">How it works:</p>
                                <ul className="list-disc list-inside space-y-1 text-blue-800/80">
                                    <li>Regular visitors will see a distraction-free Coming Soon screen.</li>
                                    <li>Authenticated administrators will see the full site like normal.</li>
                                    <li>SEO bots may still crawl accessible content based on your robots.txt.</li>
                                </ul>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="flex justify-end pt-4">
                    <Button 
                        type="submit" 
                        size="lg" 
                        className="rounded-2xl px-8 shadow-lg shadow-purple-200"
                        disabled={updating}
                    >
                        {updating ? (
                            <>
                                <span className="animate-spin mr-2">◌</span>
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save className="mr-2 h-4 w-4" />
                                Save Global Settings
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </div>
    )
}
