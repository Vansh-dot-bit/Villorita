import { Header } from "@/components/layout/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Star, Award } from "lucide-react"
import dbConnect from "@/lib/mongodb"
import Content from "@/models/Content"

async function getContent(key: string) {
    await dbConnect();
    const content = await Content.findOne({ key });
    return content || { title: 'About Purple Bite', content: '<p>Content coming soon...</p>' };
}

export default async function AboutUsPage() {
  const data = await getContent('about');

  return (
    <div className="min-h-screen bg-secondary/30">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-5xl">
         {/* Hero Section */}
         <div className="text-center mb-10 space-y-4">
             <h1 className="text-4xl font-bold tracking-tight text-primary">{data.title}</h1>
             <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                 Discover the story behind the taste. Crafted with passion, delivered with love.
             </p>
         </div>

         {/* Main Content Card */}
         <Card className="border-none shadow-lg overflow-hidden">
             <div className="h-2 bg-gradient-to-r from-primary to-purple-400" />
             <CardContent className="p-8 md:p-12">
                 <div className="prose prose-purple prose-lg max-w-none text-gray-700" dangerouslySetInnerHTML={{ __html: data.content }} />
             </CardContent>
         </Card>

         {/* Features Grid (Static Enhancement) */}
         <div className="grid md:grid-cols-3 gap-6 mt-12">
             <Card className="border-none shadow-sm bg-white/50 hover:bg-white transition-colors">
                 <CardContent className="p-6 flex flex-col items-center text-center space-y-3">
                     <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                         <Star className="h-6 w-6" />
                     </div>
                     <h3 className="font-bold text-lg">Premium Quality</h3>
                     <p className="text-sm text-muted-foreground">Only the finest ingredients make it to your plate.</p>
                 </CardContent>
             </Card>
             <Card className="border-none shadow-sm bg-white/50 hover:bg-white transition-colors">
                 <CardContent className="p-6 flex flex-col items-center text-center space-y-3">
                     <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                         <Users className="h-6 w-6" />
                     </div>
                     <h3 className="font-bold text-lg">Customer First</h3>
                     <p className="text-sm text-muted-foreground">Your satisfaction is our top priority, always.</p>
                 </CardContent>
             </Card>
             <Card className="border-none shadow-sm bg-white/50 hover:bg-white transition-colors">
                 <CardContent className="p-6 flex flex-col items-center text-center space-y-3">
                     <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                         <Award className="h-6 w-6" />
                     </div>
                     <h3 className="font-bold text-lg">Authentic Taste</h3>
                     <p className="text-sm text-muted-foreground">Recipes passed down and perfected over time.</p>
                 </CardContent>
             </Card>
         </div>
      </main>
    </div>
  )
}

export const dynamic = 'force-dynamic';
