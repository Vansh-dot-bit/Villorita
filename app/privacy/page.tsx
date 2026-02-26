import { Header } from "@/components/layout/header"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Shield, Lock } from "lucide-react"
import dbConnect from "@/lib/mongodb"
import Content from "@/models/Content"

async function getContent(key: string) {
    await dbConnect();
    const content = await Content.findOne({ key });
    return content || { title: 'Privacy Policy', content: '<p>Content coming soon...</p>' };
}

export default async function PrivacyPage() {
  const data = await getContent('privacy');

  return (
    <div className="min-h-screen bg-secondary/30">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-4xl">
         <div className="flex items-center gap-4 mb-8">
             <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
                 <Shield className="h-6 w-6" />
             </div>
             <div>
                 <h1 className="text-3xl font-bold tracking-tight">{data.title}</h1>
                 <p className="text-muted-foreground">We are committed to protecting your personal information.</p>
             </div>
         </div>

         <Card className="border-none shadow-lg">
             <CardHeader className="bg-gray-50/50 border-b pb-4">
                 <div className="flex items-center gap-2 text-sm text-green-600 font-medium">
                     <Lock className="h-4 w-4" />
                     <span>Your data is encrypted and secure</span>
                 </div>
             </CardHeader>
             <CardContent className="p-8">
                 <div className="prose prose-blue max-w-none prose-headings:font-bold prose-headings:text-primary" dangerouslySetInnerHTML={{ __html: data.content }} />
             </CardContent>
         </Card>
      </main>
    </div>
  )
}

export const dynamic = 'force-dynamic';
