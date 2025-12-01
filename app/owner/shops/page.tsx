"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

interface Shop {
  id: string;
  name: string;
  location: string | null;
  _count: {
    menus: number;
    tables: number;
  };
}

export default function OwnerShopsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
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

  if (loading || status === "loading") {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold">MenuQR Owner</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                {session?.user.email}
              </span>
              <button
                onClick={() => signOut()}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="text-2xl font-bold mb-6">My Shops</h2>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {shops.map((shop) => (
            <div key={shop.id} className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-2">{shop.name}</h3>
              {shop.location && (
                <p className="text-sm text-gray-600 mb-2">{shop.location}</p>
              )}
              <p className="text-sm text-gray-600 mb-4">
                {shop._count.menus} menu items • {shop._count.tables} tables
              </p>
              <div className="flex space-x-2">
                <Link
                  href={`/owner/shops/${shop.id}/menu`}
                  className="flex-1 text-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Manage Menu
                </Link>
                <Link
                  href={`/owner/shops/${shop.id}/tables`}
                  className="flex-1 text-center px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Tables & QR
                </Link>
              </div>
            </div>
          ))}
        </div>

        {shops.length === 0 && !loading && (
          <div className="text-center py-12">
            <p className="text-gray-600">
              No shops assigned to you yet. Contact an admin.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
