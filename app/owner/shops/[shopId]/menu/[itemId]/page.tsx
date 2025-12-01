"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";

interface MenuItem {
  id: string;
  name: string;
  price: number;
  imageUrl: string | null;
  shop: {
    id: string;
    name: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

export default function MenuItemDetailPage({
  params,
}: {
  params:
    | Promise<{ shopId: string; itemId: string }>
    | { shopId: string; itemId: string };
}) {
  const { data: session } = useSession();
  const router = useRouter();
  const [menuItem, setMenuItem] = useState<MenuItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [shopId, setShopId] = useState<string>("");
  const [itemId, setItemId] = useState<string>("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const resolveParams = async () => {
      const p = await Promise.resolve(params);
      setShopId(p.shopId);
      setItemId(p.itemId);
    };
    resolveParams();
  }, [params]);

  useEffect(() => {
    if (itemId) {
      fetchMenuItem();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemId]);

  const fetchMenuItem = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await fetch(`/api/menu-items/${itemId}`);

      if (response.ok) {
        const data = await response.json();
        setMenuItem(data);
      } else if (response.status === 404) {
        setError("Menu item not found");
      } else if (response.status === 403) {
        setError("You don't have permission to view this menu item");
      } else {
        setError("Failed to load menu item");
      }
    } catch (error) {
      console.error("Error fetching menu item:", error);
      setError("An error occurred while loading the menu item");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (
      !confirm(
        "Are you sure you want to delete this menu item? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      setDeleting(true);
      const response = await fetch(`/api/menu-items/${itemId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        router.push(`/owner/shops/${shopId}/menu`);
      } else {
        const data = await response.json();
        setError(data.error || "Failed to delete menu item");
      }
    } catch (error) {
      console.error("Error deleting menu item:", error);
      setError("An error occurred while deleting the menu item");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading menu item...</p>
        </div>
      </div>
    );
  }

  if (error && !menuItem) {
    return (
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center space-x-4">
                <Link href="/owner/shops" className="text-xl font-bold">
                  MenuQR Owner
                </Link>
              </div>
            </div>
          </div>
        </nav>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
          <Link
            href={`/owner/shops/${shopId}/menu`}
            className="mt-4 inline-block text-blue-600 hover:text-blue-800"
          >
            ← Back to Menu
          </Link>
        </div>
      </div>
    );
  }

  if (!menuItem) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link href="/owner/shops" className="text-xl font-bold">
                MenuQR Owner
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link
          href={`/owner/shops/${shopId}/menu`}
          className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-6"
        >
          <svg
            className="w-5 h-5 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to Menu
        </Link>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="md:flex">
            {/* Image Section */}
            <div className="md:w-1/2 bg-gray-100 flex items-center justify-center p-8">
              {menuItem.imageUrl ? (
                <div className="relative w-full h-96">
                  <Image
                    src={menuItem.imageUrl}
                    alt={menuItem.name}
                    fill
                    className="object-cover rounded-lg"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                </div>
              ) : (
                <div className="w-full h-96 bg-gray-200 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-24 h-24 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
              )}
            </div>

            {/* Details Section */}
            <div className="md:w-1/2 p-8">
              <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {menuItem.name}
                </h1>
                <p className="text-2xl font-semibold text-blue-600">
                  ${menuItem.price.toFixed(2)}
                </p>
              </div>

              <div className="border-t border-gray-200 pt-6 mb-6">
                <h2 className="text-sm font-medium text-gray-500 mb-2">Shop</h2>
                <p className="text-lg text-gray-900">{menuItem.shop.name}</p>
              </div>

              {menuItem.createdAt && (
                <div className="border-t border-gray-200 pt-6 mb-6">
                  <h2 className="text-sm font-medium text-gray-500 mb-2">
                    Created
                  </h2>
                  <p className="text-gray-900">
                    {new Date(menuItem.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              )}

              {menuItem.updatedAt && (
                <div className="border-t border-gray-200 pt-6 mb-6">
                  <h2 className="text-sm font-medium text-gray-500 mb-2">
                    Last Updated
                  </h2>
                  <p className="text-gray-900">
                    {new Date(menuItem.updatedAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              )}

              <div className="border-t border-gray-200 pt-6 flex space-x-4">
                <Link
                  href={`/owner/shops/${shopId}/menu`}
                  className="flex-1 text-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Back to Menu
                </Link>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deleting ? "Deleting..." : "Delete Item"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
