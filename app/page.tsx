import Link from "next/link";
import { QrCode, Smartphone, Zap, Shield, ArrowRight } from "lucide-react";
import Button from "@/components/ui/Button";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            {/* Logo/Icon */}
            <div className="inline-flex items-center justify-center w-20 h-20 bg-primary/10 rounded-3xl mb-8 animate-pulse">
              <QrCode className="h-12 w-12 text-primary" />
            </div>

            {/* Main Heading */}
            <h1 className="text-6xl md:text-7xl font-bold text-gray-900 mb-6 tracking-tight">
              MenuQR
            </h1>
            <p className="text-2xl md:text-3xl text-gray-600 mb-4 font-light">
              Digital Menu System
            </p>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto mb-12">
              {`  Transform your restaurant's dining experience with QR code-powered
              digital menus. No app downloads, no table numbers needed—just scan
              and order.`}
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
              <Link href="/auth/login">
                <Button
                  variant="primary"
                  size="lg"
                  className="rounded-full px-8"
                >
                  Get Started
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
              </Link>
              <Link href="/auth/signup">
                <Button
                  variant="secondary"
                  size="lg"
                  className="rounded-full px-8"
                >
                  Create Account
                </Button>
              </Link>
            </div>

            {/* Features Grid */}
            <div className="grid md:grid-cols-3 gap-8 mt-20 max-w-5xl mx-auto">
              <div className="bg-white rounded-2xl border border-gray-200 p-8 hover:border-primary transition-all duration-300">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <QrCode className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  One QR Code
                </h3>
                <p className="text-gray-600">
                  Single QR code for your entire business. Works across all
                  branches seamlessly.
                </p>
              </div>

              <div className="bg-white rounded-2xl border border-gray-200 p-8 hover:border-primary transition-all duration-300">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Smartphone className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Mobile First
                </h3>
                <p className="text-gray-600">
                  Beautiful, responsive menus that work perfectly on any device.
                  No app required.
                </p>
              </div>

              <div className="bg-white rounded-2xl border border-gray-200 p-8 hover:border-primary transition-all duration-300">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Zap className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Lightning Fast
                </h3>
                <p className="text-gray-600">
                  Instant menu updates. Change prices, add items, or update
                  descriptions in real-time.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
