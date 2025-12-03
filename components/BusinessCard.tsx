"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Building2, QrCode, MapPin, Utensils, TrendingUp } from "lucide-react";

interface Business {
  id: string;
  name: string;
  description: string | null;
  logoUrl: string | null;
  qrCodeUrl: string | null;
  _count: {
    menus: number;
    branches: number;
    qrScans: number;
  };
}

interface BusinessCardProps {
  business: Business;
}

export default function BusinessCard({ business }: BusinessCardProps) {
  const router = useRouter();

  return (
    <>
      <div
        className="bg-white rounded-2xl border border-gray-200 p-6 hover:border-gray-300 transition-all duration-300 relative cursor-pointer"
        onClick={() => router.push(`/owner/businesses/${business.id}`)}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3 flex-1">
            {business.logoUrl ? (
              <div className="relative w-12 h-12 rounded-full overflow-hidden border border-gray-200 flex-shrink-0">
                <Image
                  src={business.logoUrl}
                  alt={business.name}
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center border border-gray-200 flex-shrink-0">
                <Building2 className="h-6 w-6 text-gray-400" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h3 className="text-xl font-bold text-gray-900 truncate">
                {business.name}
              </h3>
              {business.description && (
                <p className="text-sm text-gray-600 line-clamp-1 mt-1">
                  {business.description}
                </p>
              )}
            </div>
          </div>
          {business.qrCodeUrl && (
            <QrCode className="h-5 w-5 text-primary flex-shrink-0 ml-2" />
          )}
        </div>

        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <Utensils className="h-4 w-4 text-primary" />
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {business._count.menus}
            </div>
            <div className="text-xs text-gray-500">Menu Items</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <MapPin className="h-4 w-4 text-primary" />
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {business._count.branches}
            </div>
            <div className="text-xs text-gray-500">Branches</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <TrendingUp className="h-4 w-4 text-primary" />
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {business._count.qrScans}
            </div>
            <div className="text-xs text-gray-500">Scans</div>
          </div>
        </div>
      </div>
    </>
  );
}
