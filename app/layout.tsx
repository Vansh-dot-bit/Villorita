import type { Metadata } from "next";
import { ViewTransitions } from "next-view-transitions";
import { Outfit } from "next/font/google";
import { CartProvider } from "@/context/cart-context";
import { AuthProvider } from "@/context/auth-context";
import { Toaster } from "@/components/ui/sonner";
import { LocationProvider } from "@/context/location-context";
import { LocationModal } from "@/components/location/location-modal";
import { GpsProvider } from "@/context/gps-context";
import { SiteGate } from "@/components/layout/SiteGate";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Villorita",
  description: "Premium Cake E-commerce",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ViewTransitions>
      <html lang="en">
        <body className={`${outfit.variable} antialiased`}>
          <AuthProvider>
            <GpsProvider>
            <LocationProvider>
            <CartProvider>
              <SiteGate>
                {children}
              </SiteGate>
                <LocationModal />
                <Toaster />
            </CartProvider>
            </LocationProvider>
            </GpsProvider>
          </AuthProvider>
        </body>
      </html>
    </ViewTransitions>
  );
}
