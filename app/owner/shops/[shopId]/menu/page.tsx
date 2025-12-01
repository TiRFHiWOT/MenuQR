"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";

interface MenuItem {
  id: string;
  name: string;
  price: number;
  imageUrl: string | null;
}

export default function MenuPage({
  params,
}: {
  params: Promise<{ shopId: string }> | { shopId: string };
}) {
  const { data: session } = useSession();
  const router = useRouter();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    imageUrl: "",
  });
  const [uploading, setUploading] = useState(false);
  const [shopId, setShopId] = useState<string>("");
  const [submitError, setSubmitError] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

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
      fetchMenuItems();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shopId]);

  const fetchMenuItems = async () => {
    try {
      const response = await fetch(`/api/shops/${shopId}`);
      if (response.ok) {
        const data = await response.json();
        setMenuItems(data.menus || []);
      }
    } catch (error) {
      console.error("Error fetching menu items:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const uploadFormData = new FormData();
      uploadFormData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: uploadFormData,
      });

      if (response.ok) {
        const data = await response.json();
        setFormData((prev) => ({ ...prev, imageUrl: data.imageUrl }));
      }
    } catch (error) {
      console.error("Error uploading image:", error);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");
    setSubmitting(true);

    // Get fresh form data directly from the form element
    const form = e.currentTarget as HTMLFormElement;
    const formDataObj = new FormData(form);
    const nameFromForm = formDataObj.get("name") as string;
    const priceFromForm = formDataObj.get("price") as string;

    // Use form data directly, fallback to state if needed
    const nameValue = nameFromForm || formData.name || "";
    const priceValue = priceFromForm || formData.price || "";

    console.log("Sending to API:", {
      name: nameValue,
      price: priceValue,
      imageUrl: formData.imageUrl || null,
      shopId: shopId,
    });

    try {
      const url = editingItem
        ? `/api/menu-items/${editingItem.id}`
        : "/api/menu-items";
      const method = editingItem ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: nameValue,
          price: priceValue,
          imageUrl: formData.imageUrl || null,
          shopId: shopId,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setShowForm(false);
        setEditingItem(null);
        setFormData({ name: "", price: "", imageUrl: "" });
        setSubmitError("");
        fetchMenuItems();
      } else {
        setSubmitError(
          data.error || data.details || "Failed to save menu item"
        );
      }
    } catch (error: any) {
      console.error("Error saving menu item:", error);
      setSubmitError("An error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (item: MenuItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      price: item.price.toString(),
      imageUrl: item.imageUrl || "",
    });
    setShowForm(true);
  };

  const handleDelete = async (itemId: string) => {
    if (!confirm("Are you sure you want to delete this menu item?")) return;

    try {
      const response = await fetch(`/api/menu-items/${itemId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchMenuItems();
      }
    } catch (error) {
      console.error("Error deleting menu item:", error);
    }
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
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
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Menu Items</h2>
          <button
            onClick={() => {
              setShowForm(true);
              setEditingItem(null);
              setFormData({ name: "", price: "", imageUrl: "" });
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Add Menu Item
          </button>
        </div>

        {showForm && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">
              {editingItem ? "Edit Menu Item" : "Add Menu Item"}
            </h3>
            <form
              onSubmit={handleSubmit}
              className="space-y-4"
              name="menu-item-form"
            >
              {submitError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                  {submitError}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>
                <input
                  key="menu-item-name"
                  name="name"
                  type="text"
                  required
                  placeholder="Enter menu item name (e.g., Coffee)"
                  value={formData.name || ""}
                  onChange={(e) => {
                    const newName = e.target.value;
                    console.log("Name changed to:", newName);
                    setFormData((prev) => ({
                      ...prev,
                      name: newName,
                    }));
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
                {formData.name && (
                  <p className="text-xs text-gray-500 mt-1">
                    Name: "{formData.name}"
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price *
                </label>
                <input
                  key="menu-item-price"
                  name="price"
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  placeholder="0.00"
                  value={formData.price || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, price: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Image
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  disabled={uploading}
                />
                {uploading && (
                  <p className="text-sm text-gray-600 mt-1">Uploading...</p>
                )}
                {formData.imageUrl && (
                  <img
                    src={formData.imageUrl}
                    alt="Preview"
                    className="mt-2 w-32 h-32 object-cover rounded"
                  />
                )}
              </div>
              <div className="flex space-x-4">
                <button
                  type="submit"
                  disabled={submitting || !shopId}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? "Saving..." : editingItem ? "Update" : "Create"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingItem(null);
                    setFormData({ name: "", price: "", imageUrl: "" });
                  }}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {menuItems.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-lg shadow overflow-hidden"
            >
              {item.imageUrl && (
                <div className="relative w-full h-48">
                  <Image
                    src={item.imageUrl}
                    alt={item.name}
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              <div className="p-4">
                <h3 className="text-lg font-semibold mb-1">{item.name}</h3>
                <p className="text-xl font-bold text-blue-600 mb-4">
                  ${item.price.toFixed(2)}
                </p>
                <div className="flex space-x-2">
                  <Link
                    href={`/owner/shops/${shopId}/menu/${item.id}`}
                    className="flex-1 text-center px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    View
                  </Link>
                  <button
                    onClick={() => handleEdit(item)}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {menuItems.length === 0 && !loading && (
          <div className="text-center py-12">
            <p className="text-gray-600">
              No menu items yet. Add your first item!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
