import { Header } from "@/components/layout/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Mail, Phone, Clock, MessageSquare } from "lucide-react"
import dbConnect from "@/lib/mongodb"
import Content from "@/models/Content"

async function getContent(key: string) {
    await dbConnect();
    const content = await Content.findOne({ key });
    // Default content if not found
    return content || { 
        title: 'Support & Contact', 
        content: '<p>We are here to help! Reach out to us through any of the channels below.</p>' 
    };
}

export default async function SupportPage() {
  const data = await getContent('support');
  const meta = data.meta || {};

  const phone = meta.phone || '+91 98765 43210';
  const email = meta.email || 'support@purplebite.com';
  const hours = (typeof meta.hours === 'string' ? meta.hours : '') || 'Mon - Sun: 9:00 AM - 10:00 PM';

  return (
    <div className="min-h-screen bg-secondary/30">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-4xl">
         <div className="text-center mb-10">
             <h1 className="text-4xl font-bold tracking-tight text-primary mb-4">{data.title}</h1>
             <p className="text-muted-foreground text-lg">We'd love to hear from you. Here's how you can reach us.</p>
         </div>
         
         <div className="grid gap-6 md:grid-cols-2 mb-10">
             <Card className="border-none shadow-md hover:shadow-lg transition-shadow bg-white">
                 <CardHeader className="flex flex-row items-center gap-4 pb-2">
                     <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                         <Phone className="h-6 w-6" />
                     </div>
                     <div>
                         <CardTitle className="text-lg">Phone Support</CardTitle>
                     </div>
                 </CardHeader>
                 <CardContent>
                     <p className="font-bold text-2xl text-gray-800">{phone}</p>
                     <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                        <Clock className="h-3 w-3" /> Available during operational hours
                     </p>
                 </CardContent>
             </Card>

             <Card className="border-none shadow-md hover:shadow-lg transition-shadow bg-white">
                 <CardHeader className="flex flex-row items-center gap-4 pb-2">
                     <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                         <Mail className="h-6 w-6" />
                     </div>
                     <div>
                         <CardTitle className="text-lg">Email Support</CardTitle>
                     </div>
                 </CardHeader>
                 <CardContent>
                     <p className="font-bold text-xl text-gray-800 break-all">{email}</p>
                     <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                        <MessageSquare className="h-3 w-3" /> Response within 24 hours
                     </p>
                 </CardContent>
             </Card>

             <Card className="border-none shadow-md md:col-span-2 bg-gradient-to-r from-purple-50 to-white">
                 <CardHeader>
                     <CardTitle className="flex items-center gap-2">
                         <Clock className="h-5 w-5 text-primary" />
                         Operation Hours
                     </CardTitle>
                 </CardHeader>
                 <CardContent>
                     <p className="font-bold text-lg text-gray-900">{hours}</p>
                 </CardContent>
             </Card>
         </div>

         {/* Dynamic Content Section */}
         <Card className="border-none shadow-lg">
            <CardContent className="p-8 md:p-10">
                <div className="prose prose-purple max-w-none prose-headings:text-primary" dangerouslySetInnerHTML={{ __html: data.content }} />
            </CardContent>
         </Card>
      </main>
    </div>
  )
}

export const dynamic = 'force-dynamic';
