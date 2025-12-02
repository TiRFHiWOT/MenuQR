"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

interface Shop {
  id: string;
  name: string;
  location: string | null;
  owner: {
    id: string;
    name: string | null;
    email: string;
  };
  _count: {
    menus: number;
    tables: number;
  };
}

export default function AdminShopsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
      return;
    }

    if (status === "authenticated" && session?.user.role !== "ADMIN") {
      router.push("/owner/shops");
      return;
    }

    if (status === "authenticated") {
      fetchShops();
    }
  }, [session, status, router]);

  const fetchShops = async () => {
    try {
      const response = await fetch("/api/shops");
      if (response.ok) {
        const data = await response.json();
        setShops(data);
      }
    } catch (error) {
      console.error("Error fetching shops:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (shopId: string) => {
    if (!confirm("Are you sure you want to delete this shop?")) return;

    try {
      const response = await fetch(`/api/shops/${shopId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchShops();
      }
    } catch (error) {
      console.error("Error deleting shop:", error);
    }
  };

  if (loading || status === "loading") {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold">MenuQR Admin</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                {session?.user.email}
              </span>
              <button
                onClick={() => signOut()}
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto section">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Shops</h2>
          <Link href="/admin/shops/new" className="btn-primary">
            Create Shop
          </Link>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {shops.map((shop) => (
            <div key={shop.id} className="card">
              <h3 className="text-lg font-semibold mb-2">{shop.name}</h3>
              {shop.location && (
                <p className="text-sm text-muted mb-2">{shop.location}</p>
              )}
              <p className="text-sm text-muted mb-2">
                Owner: {shop.owner.name || shop.owner.email}
              </p>
              <p className="text-sm text-muted mb-4">
                {shop._count.menus} menu items • {shop._count.tables} tables
              </p>
              <div className="flex space-x-2">
                <Link
                  href={`/admin/shops/${shop.id}`}
                  className="flex-1 text-center btn-primary"
                >
                  View
                </Link>
                <button
                  onClick={() => handleDelete(shop.id)}
                  className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all duration-150 active:scale-95"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>

        {shops.length === 0 && !loading && (
          <div className="text-center py-12">
            <p className="text-muted">
              No shops found. Create your first shop!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
