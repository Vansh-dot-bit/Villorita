
// Force rebuild
import { Header } from "@/components/layout/header"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Shield, RefreshCcw } from "lucide-react"
import dbConnect from "@/lib/mongodb"
import Content from "@/models/Content"

export const dynamic = 'force-dynamic';

async function getContent(key: string) {
    await dbConnect();
    const content = await Content.findOne({ key });
    return content || { title: 'Refund Policy', content: '<p>Content coming soon...</p>' };
}

export default async function RefundPolicyPage() {
  const data = await getContent('refund');

  return (
    <div className="min-h-screen bg-secondary/30">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-4xl">
         <div className="flex items-center gap-4 mb-8">
             <div className="h-12 w-12 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600">
                 <RefreshCcw className="h-6 w-6" />
             </div>
             <div>
                 <h1 className="text-3xl font-bold tracking-tight">{data.title}</h1>
                 <p className="text-muted-foreground">Read our policy regarding refunds and returns.</p>
             </div>
         </div>

         <Card className="border-none shadow-lg">
             <CardHeader className="bg-gray-50/50 border-b pb-4">
                 <div className="flex items-center gap-2 text-sm text-purple-600 font-medium">
                     <Shield className="h-4 w-4" />
                     <span>Transparent and Fair Policy</span>
                 </div>
             </CardHeader>
             <CardContent className="p-8">
                 <div className="prose prose-purple max-w-none prose-headings:font-bold prose-headings:text-primary" dangerouslySetInnerHTML={{ __html: data.content }} />
             </CardContent>
         </Card>
      </main>
    </div>
  )
}
