"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

interface MenuItem {
  id: string;
  name: string;
  price: number;
  imageUrl: string | null;
}

interface Table {
  id: string;
  tableNumber: number;
}

interface Shop {
  id: string;
  name: string;
  location: string | null;
  owner: {
    id: string;
    name: string | null;
    email: string;
  };
  menus: MenuItem[];
  tables: Table[];
}

export default function ShopDetailPage({
  params,
}: {
  params: Promise<{ shopId: string }> | { shopId: string };
}) {
  const router = useRouter();
  const [shop, setShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);
  const [shopId, setShopId] = useState<string>("");

  useEffect(() => {
    const getShopId = async () => {
      if (params instanceof Promise) {
        const p = await params;
        setShopId(p.shopId);
      } else {
        setShopId(params.shopId);
      }
    };
    getShopId();
  }, [params]);

  useEffect(() => {
    if (shopId) {
      fetchShop();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shopId]);

  const fetchShop = async () => {
    try {
      const response = await fetch(`/api/shops/${shopId}`);
      if (response.ok) {
        const data = await response.json();
        setShop(data);
      }
    } catch (error) {
      console.error("Error fetching shop:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  if (!shop) {
    return <div className="p-8">Shop not found</div>;
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/admin/shops" className="text-xl font-bold">
                MenuQR Admin
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto section">
        <div className="mb-6">
          <h2 className="text-2xl font-bold">{shop.name}</h2>
          {shop.location && <p className="text-muted">{shop.location}</p>}
          <p className="text-sm text-muted mt-2">
            Owner: {shop.owner.name || shop.owner.email}
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          <div>
            <h3 className="text-xl font-semibold mb-4">
              Menu Items ({shop.menus.length})
            </h3>
            <div className="card">
              {shop.menus.length === 0 ? (
                <p className="text-muted">No menu items</p>
              ) : (
                <div className="space-y-4">
                  {shop.menus.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between border-b border-[var(--border)] pb-4 last:border-0"
                    >
                      <div className="flex-1">
                        <h4 className="font-medium">{item.name}</h4>
                        <p className="text-sm text-primary font-semibold">
                          ${item.price.toFixed(2)}
                        </p>
                      </div>
                      {item.imageUrl && (
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-16 h-16 object-cover rounded-xl"
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-4">
              Tables ({shop.tables.length})
            </h3>
            <div className="card">
              {shop.tables.length === 0 ? (
                <p className="text-muted">No tables</p>
              ) : (
                <div className="grid grid-cols-4 gap-2">
                  {shop.tables.map((table) => (
                    <div
                      key={table.id}
                      className="text-center p-3 bg-[var(--muted)] rounded-xl"
                    >
                      Table {table.tableNumber}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
