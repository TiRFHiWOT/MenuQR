"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

interface Shop {
  id: string;
  name: string;
  location?: string | null;
  menus: MenuItem[];
  categories: Category[];
  tables: Table[];
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

interface Table {
  id: string;
  tableNumber: number;
}

interface UniversalMenuClientProps {
  shop: Shop;
}

export default function UniversalMenuClient({
  shop,
}: UniversalMenuClientProps) {
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showTableSelection, setShowTableSelection] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Check localStorage for tableId
    if (typeof window !== "undefined") {
      const storedTableId = localStorage.getItem(`tableId_${shop.id}`);
      if (storedTableId) {
        setSelectedTableId(storedTableId);
        setShowTableSelection(false);
      } else {
        setShowTableSelection(true);
      }
    }
  }, [shop.id]);

  const handleTableSelect = (table: Table) => {
    if (typeof window !== "undefined") {
      localStorage.setItem(`tableId_${shop.id}`, table.id);
      setSelectedTableId(table.id);
      setShowTableSelection(false);
    }
  };

  const handleChangeTable = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(`tableId_${shop.id}`);
      setSelectedTableId(null);
      setShowTableSelection(true);
    }
  };

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  // Table selection screen
  if (showTableSelection) {
    return (
      <div className="min-h-screen bg-[var(--background)]">
        <div className="max-w-4xl mx-auto section">
          <div className="card mb-6 text-center">
            <h1 className="text-3xl font-bold mb-2">{shop.name}</h1>
            {shop.location && (
              <p className="text-muted mb-4">{shop.location}</p>
            )}
            <p className="text-lg mb-6">Please select your table</p>
          </div>

          <div className="grid gap-4 grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
            {shop.tables.map((table) => (
              <button
                key={table.id}
                onClick={() => handleTableSelect(table)}
                className="card p-6 text-center hover:shadow-lg transition-all duration-150 active:scale-95 hover:scale-105"
              >
                <div className="text-2xl font-bold text-primary">
                  {table.tableNumber}
                </div>
              </button>
            ))}
          </div>

          {shop.tables.length === 0 && (
            <div className="card p-12 text-center">
              <p className="text-muted text-lg">No tables available</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Menu display with categories
  const categories = shop.categories || [];
  const allItems = shop.menus || [];

  // Filter items by selected category
  const displayItems =
    selectedCategory === null
      ? allItems
      : allItems.filter((item) => item.categoryId === selectedCategory);

  const selectedTable = shop.tables.find((t) => t.id === selectedTableId);
  const tableNumber = selectedTable?.tableNumber;

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="max-w-4xl mx-auto section">
        <div className="card mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold mb-2">{shop.name}</h1>
              {shop.location && (
                <p className="text-muted mb-4">{shop.location}</p>
              )}
            </div>
            {tableNumber && (
              <div className="flex items-center gap-4">
                <div className="inline-block badge">Table {tableNumber}</div>
                <button
                  onClick={handleChangeTable}
                  className="text-sm text-muted hover:text-foreground transition-colors"
                >
                  Change Table
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Category Tabs */}
        {categories.length > 0 && (
          <div className="mb-6 overflow-x-auto">
            <div className="flex gap-2 pb-2">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`px-4 py-2 rounded-xl font-medium transition-all duration-150 whitespace-nowrap ${
                  selectedCategory === null
                    ? "bg-primary text-white"
                    : "bg-[var(--card)] text-foreground hover:bg-[var(--border)]"
                }`}
              >
                All
              </button>
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`px-4 py-2 rounded-xl font-medium transition-all duration-150 whitespace-nowrap ${
                    selectedCategory === category.id
                      ? "bg-primary text-white"
                      : "bg-[var(--card)] text-foreground hover:bg-[var(--border)]"
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>
        )}

        <h2 className="text-2xl font-bold mb-6">Menu</h2>

        {displayItems.length === 0 ? (
          <div className="card p-12 text-center">
            <p className="text-muted text-lg">
              No menu items available in this category.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {displayItems.map((item) => (
              <div
                key={item.id}
                className="card overflow-hidden hover:shadow-md transition-shadow duration-150"
              >
                {item.imageUrl && (
                  <div className="relative w-full h-48 -m-5 mb-4">
                    <Image
                      src={item.imageUrl}
                      alt={item.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <div>
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-xl font-semibold">{item.name}</h3>
                    {item.category && (
                      <span className="text-xs bg-[var(--border)] px-2 py-1 rounded-full">
                        {item.category.name}
                      </span>
                    )}
                  </div>
                  <p className="text-2xl font-bold text-primary">
                    ${item.price.toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
