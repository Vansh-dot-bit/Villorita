import { Header } from "@/components/layout/header"
import { Card, CardContent } from "@/components/ui/card"
import { MessageSquare, HelpCircle } from "lucide-react"
import dbConnect from "@/lib/mongodb"
import Content from "@/models/Content"

async function getContent(key: string) {
    await dbConnect();
    const content = await Content.findOne({ key });
    return content || { title: 'Frequently Asked Questions', content: '<p>FAQs coming soon...</p>' };
}

export default async function FAQPage() {
  const data = await getContent('faq');

  return (
    <div className="min-h-screen bg-secondary/30">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-4xl">
         <div className="text-center mb-10 space-y-4">
             <div className="inline-flex h-16 w-16 rounded-full bg-purple-100 items-center justify-center text-purple-600 mb-4">
                 <HelpCircle className="h-8 w-8" />
             </div>
             <h1 className="text-4xl font-bold tracking-tight">{data.title}</h1>
             <p className="text-muted-foreground text-lg text-center max-w-2xl mx-auto">
                 Find answers to common questions about our services, delivery, and more.
             </p>
         </div>
         
         <Card className="border-none shadow-lg">
             <CardContent className="p-8">
                 {/* 
                    Tip for Admins: 
                    The HTML content should use <details> and <summary> for accordion effect manually,
                    OR we just style standard <h3> and <p> nicely.
                    Let's assume standard headings for now but giving it good spacing.
                 */}
                 <div className="prose prose-purple max-w-none prose-h3:text-xl prose-h3:font-semibold prose-h3:mt-8 prose-p:text-muted-foreground" dangerouslySetInnerHTML={{ __html: data.content }} />
             </CardContent>
         </Card>

         <div className="mt-8 text-center">
             <p className="text-muted-foreground">Still have questions?</p>
             <a href="/support" className="text-primary font-semibold hover:underline mt-2 inline-block">
                 Contact our Support Team &rarr;
             </a>
         </div>
      </main>
    </div>
  )
}

export const dynamic = 'force-dynamic';
