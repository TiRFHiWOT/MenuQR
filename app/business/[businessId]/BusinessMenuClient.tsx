"use client";

import { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import { Search, MapPin } from "lucide-react";
import { useQRCode } from "@/hooks/useQRCode";

interface Business {
  id: string;
  name: string;
  description?: string | null;
  logoUrl?: string | null;
  menus: MenuItem[];
  categories: Category[];
  branches: Branch[];
}

interface MenuItem {
  id: string;
  name: string;
  price: number;
  imageUrl?: string | null;
  categoryId?: string | null;
  category?: {
    id: string;
    name: string;
  } | null;
}

interface Category {
  id: string;
  name: string;
}

interface Branch {
  id: string;
  name: string;
  address?: string | null;
}

interface BusinessMenuClientProps {
  business: Business;
  businessId: string;
}

export default function BusinessMenuClient({
  business,
  businessId,
}: BusinessMenuClientProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [mounted, setMounted] = useState(false);
  const { trackScan } = useQRCode();

  const allItems = useMemo(() => business.menus || [], [business.menus]);
  const allCategories = useMemo(
    () => business.categories || [],
    [business.categories]
  );

  // Only show categories that have items
  const categoriesWithItems = useMemo(() => {
    return allCategories.filter((category) =>
      allItems.some((item) => item.categoryId === category.id)
    );
  }, [allCategories, allItems]);

  // Filter items by selected category and search query
  const displayItems = useMemo(() => {
    return allItems.filter((item) => {
      const matchesCategory =
        selectedCategory === null || item.categoryId === selectedCategory;
      const matchesSearch =
        searchQuery === "" ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category?.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [allItems, selectedCategory, searchQuery]);

  useEffect(() => {
    setMounted(true);
    trackScan(businessId);
  }, [businessId, trackScan]);

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading menu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header Section */}
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col items-center text-center mb-6">
            {business.logoUrl && (
              <div className="relative w-20 h-20 mb-4 rounded-full overflow-hidden border-4 border-white/20 shadow-lg">
                <Image
                  src={business.logoUrl}
                  alt={business.name}
                  fill
                  className="object-cover"
                />
              </div>
            )}
            <h1 className="text-3xl md:text-4xl font-bold mb-2">
              {business.name}
            </h1>
            {business.description && (
              <p className="text-gray-300 text-sm md:text-base line-clamp-1 max-w-2xl">
                {business.description}
              </p>
            )}
          </div>

          {/* Branches */}
          {business.branches && business.branches.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2 mt-4">
              {business.branches.map((branch) => (
                <div
                  key={branch.id}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-white/10 backdrop-blur-sm border border-white/20"
                >
                  <MapPin className="h-3 w-3" />
                  <span>{branch.name}</span>
                  {branch.address && (
                    <span className="text-white/70">• {branch.address}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search menu items..."
              className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-full focus:ring-2 focus:ring-primary focus:border-transparent transition-all bg-white shadow-sm"
            />
          </div>
        </div>

        {/* Category Pills */}
        {categoriesWithItems.length > 0 && (
          <div className="mb-6 overflow-x-auto">
            <div className="flex gap-2 pb-2">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                  selectedCategory === null
                    ? "bg-primary text-white shadow-md"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                All Items
              </button>
              {categoriesWithItems.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                    selectedCategory === category.id
                      ? "bg-primary text-white shadow-md"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Menu Items - Compact List */}
        {displayItems.length === 0 ? (
          <div className="bg-gray-50 rounded-2xl border border-gray-200 p-12 text-center">
            <p className="text-gray-500 text-lg">
              No menu items available
              {selectedCategory || searchQuery ? " matching your search" : ""}.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {displayItems.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-gray-200 p-4 hover:border-gray-300 transition-all duration-200 group"
              >
                <div className="flex gap-4">
                  {/* Image - 4x4 (64px x 64px) */}
                  <div className="relative w-16 h-16 flex-shrink-0 rounded-xl overflow-hidden border border-gray-200">
                    {item.imageUrl ? (
                      <Image
                        src={item.imageUrl}
                        alt={item.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                        <span className="text-gray-400 text-xs font-medium">
                          No Image
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="text-lg font-bold text-gray-900 truncate">
                        {item.name}
                      </h3>
                      <span className="text-lg font-bold text-primary flex-shrink-0">
                        ${item.price.toFixed(2)}
                      </span>
                    </div>
                    {item.category && (
                      <span className="inline-block text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full mb-2">
                        {item.category.name}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
