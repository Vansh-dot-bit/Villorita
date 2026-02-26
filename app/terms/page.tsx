import { Header } from "@/components/layout/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollText, FileText } from "lucide-react"
import dbConnect from "@/lib/mongodb"
import Content from "@/models/Content"

async function getContent(key: string) {
    await dbConnect();
    const content = await Content.findOne({ key });
    return content || { title: 'Terms & Conditions', content: '<p>Content coming soon...</p>' };
}

export default async function TermsPage() {
  const data = await getContent('terms');

  return (
    <div className="min-h-screen bg-secondary/30">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-4xl">
         <div className="flex items-center gap-4 mb-8">
             <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                 <ScrollText className="h-6 w-6" />
             </div>
             <div>
                 <h1 className="text-3xl font-bold tracking-tight">{data.title}</h1>
                 <p className="text-muted-foreground">Please read these terms carefully before using our services.</p>
             </div>
         </div>

         <Card className="border-none shadow-lg">
             <CardHeader className="bg-gray-50/50 border-b pb-4">
                 <div className="flex items-center justify-between text-sm text-muted-foreground">
                     <span>Last Updated</span>
                     <span>{new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
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

export const dynamic = 'force-dynamic';
