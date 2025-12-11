"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import OwnerSidebar from "@/components/OwnerSidebar";
import Dialog from "@/components/Dialog";

interface MenuItem {
  id: string;
  name: string;
  price: number;
  imageUrl: string | null;
  categoryId?: string | null;
  category?: {
    id: string;
    name: string;
  } | null;
}

interface Category {
  id: string;
  name: string;
  _count?: {
    items: number;
  };
}

export default function MenuPage({
  params,
}: {
  params: Promise<{ shopId: string }> | { shopId: string };
}) {
  const { data: session } = useSession();
  const router = useRouter();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    imageUrl: "",
    categoryId: "",
  });
  const [categoryFormData, setCategoryFormData] = useState({
    name: "",
  });
  const [uploading, setUploading] = useState(false);
  const [shopId, setShopId] = useState<string>("");
  const [submitError, setSubmitError] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [submittingCategory, setSubmittingCategory] = useState(false);

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
      fetchCategories().then((cats) => {
        // Auto-create default categories if none exist
        if (!cats || cats.length === 0) {
          fetch("/api/categories/default", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ shopId }),
          })
            .then((res) => res.json())
            .then(() => {
              fetchCategories();
            })
            .catch((err) =>
              console.error("Error creating default categories:", err)
            );
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shopId]);

  const fetchMenuItems = async () => {
    try {
      const response = await fetch(`/api/shops/${shopId}`);
      if (response.ok) {
        const data = await response.json();
        setMenuItems(data.menus || []);
        setCategories(data.categories || []);
      }
    } catch (error) {
      console.error("Error fetching menu items:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch(`/api/categories?shopId=${shopId}`);
      if (response.ok) {
        const data = await response.json();
        setCategories(data || []);
        return data || [];
      }
      return [];
    } catch (error) {
      console.error("Error fetching categories:", error);
      return [];
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
          categoryId: formData.categoryId || null,
          shopId: shopId,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setShowForm(false);
        setEditingItem(null);
        setFormData({ name: "", price: "", imageUrl: "", categoryId: "" });
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
      categoryId: item.categoryId || "",
    });
    setShowForm(true);
  };

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");
    setSubmittingCategory(true);

    try {
      const url = editingCategory
        ? `/api/categories/${editingCategory.id}`
        : "/api/categories";
      const method = editingCategory ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: categoryFormData.name,
          shopId: shopId,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setShowCategoryForm(false);
        setEditingCategory(null);
        setCategoryFormData({ name: "" });
        fetchCategories();
        fetchMenuItems();
      } else {
        setSubmitError(data.error || "Failed to save category");
      }
    } catch (error: any) {
      console.error("Error saving category:", error);
      setSubmitError("An error occurred. Please try again.");
    } finally {
      setSubmittingCategory(false);
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this category? Menu items in this category will become uncategorized."
      )
    )
      return;

    try {
      const response = await fetch(`/api/categories/${categoryId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchCategories();
        fetchMenuItems();
      }
    } catch (error) {
      console.error("Error deleting category:", error);
    }
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
    <div className="min-h-screen bg-[var(--background)] flex">
      <OwnerSidebar shopId={shopId} userEmail={session?.user.email} />
      <div className="flex-1 lg:ml-0">
        <div className="max-w-7xl mx-auto section">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Menu Items</h2>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowCategoryForm(true);
                  setEditingCategory(null);
                  setCategoryFormData({ name: "" });
                }}
                className="px-4 py-2 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-all duration-150 active:scale-95"
              >
                Manage Categories
              </button>
              <button
                onClick={() => {
                  setShowForm(true);
                  setEditingItem(null);
                  setFormData({
                    name: "",
                    price: "",
                    imageUrl: "",
                    categoryId: "",
                  });
                }}
                className="btn-primary"
              >
                Add Menu Item
              </button>
            </div>
          </div>

          <Dialog
            isOpen={showForm}
            onClose={() => {
              setShowForm(false);
              setEditingItem(null);
              setFormData({
                name: "",
                price: "",
                imageUrl: "",
                categoryId: "",
              });
              setSubmitError("");
            }}
            title={editingItem ? "Edit Menu Item" : "Add Menu Item"}
          >
            <form
              onSubmit={handleSubmit}
              className="space-y-4"
              name="menu-item-form"
            >
              {submitError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
                  {submitError}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-1">
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
                />
                {formData.name && (
                  <p className="text-xs text-muted mt-1">
                    Name: &quot;{formData.name}&quot;
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-1">
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
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-1">
                  Category *
                </label>
                <select
                  value={formData.categoryId}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      categoryId: e.target.value,
                    }))
                  }
                  required
                  className="w-full px-3 py-2 border border-[var(--border)] rounded-xl"
                >
                  <option value="">Select a category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                {categories.length === 0 && (
                  <p className="text-sm text-muted mt-1">
                    No categories available. Please create a category first.
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-1">
                  Image
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="w-full px-3 py-2 border border-[var(--border)] rounded-xl"
                  disabled={uploading}
                />
                {uploading && (
                  <p className="text-sm text-muted mt-1">Uploading...</p>
                )}
                {formData.imageUrl && (
                  <Image
                    src={formData.imageUrl}
                    alt="Preview"
                    width={128}
                    height={128}
                    className="mt-2 w-32 h-32 object-cover rounded-xl"
                  />
                )}
              </div>
              <div className="flex space-x-4">
                <button
                  type="submit"
                  disabled={submitting || !shopId || !formData.categoryId}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? "Saving..." : editingItem ? "Update" : "Create"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingItem(null);
                    setFormData({
                      name: "",
                      price: "",
                      imageUrl: "",
                      categoryId: "",
                    });
                    setSubmitError("");
                  }}
                  className="px-4 py-2 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-all duration-150 active:scale-95"
                >
                  Cancel
                </button>
              </div>
            </form>
          </Dialog>

          <Dialog
            isOpen={showCategoryForm}
            onClose={() => {
              setShowCategoryForm(false);
              setEditingCategory(null);
              setCategoryFormData({ name: "" });
              setSubmitError("");
            }}
            title={editingCategory ? "Edit Category" : "Add Category"}
          >
            <form onSubmit={handleCategorySubmit} className="space-y-4">
              {submitError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
                  {submitError}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Drinks, Breakfast, Main Courses"
                  value={categoryFormData.name}
                  onChange={(e) =>
                    setCategoryFormData({ name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-[var(--border)] rounded-xl"
                />
              </div>
              <div className="flex space-x-4">
                <button
                  type="submit"
                  disabled={submittingCategory}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submittingCategory
                    ? "Saving..."
                    : editingCategory
                    ? "Update"
                    : "Create"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCategoryForm(false);
                    setEditingCategory(null);
                    setCategoryFormData({ name: "" });
                    setSubmitError("");
                  }}
                  className="px-4 py-2 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-all duration-150 active:scale-95"
                >
                  Cancel
                </button>
              </div>
            </form>
          </Dialog>

          {categories.length > 0 && (
            <div className="card mb-6">
              <h3 className="text-lg font-semibold mb-4">Categories</h3>
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <div
                    key={category.id}
                    className="flex items-center gap-2 bg-[var(--card)] px-3 py-2 rounded-xl"
                  >
                    <span className="font-medium">{category.name}</span>
                    <span className="text-xs text-muted">
                      ({category._count?.items || 0} items)
                    </span>
                    <button
                      onClick={() => {
                        setEditingCategory(category);
                        setCategoryFormData({ name: category.name });
                        setShowCategoryForm(true);
                      }}
                      className="text-xs text-primary hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(category.id)}
                      className="text-xs text-red-600 hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {menuItems.map((item) => (
              <div key={item.id} className="card overflow-hidden">
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
                  <div className="flex items-start justify-between mb-1">
                    <h3 className="text-lg font-semibold">{item.name}</h3>
                    {item.category && (
                      <span className="text-xs bg-[var(--border)] px-2 py-1 rounded-full">
                        {item.category.name}
                      </span>
                    )}
                  </div>
                  <p className="text-xl font-bold text-primary mb-4">
                    ${item.price.toFixed(2)}
                  </p>
                  <div className="flex space-x-2">
                    <Link
                      href={`/owner/shops/${shopId}/menu/${item.id}`}
                      className="flex-1 text-center btn-primary"
                    >
                      View
                    </Link>
                    <button
                      onClick={() => handleEdit(item)}
                      className="flex-1 btn-secondary"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all duration-150 active:scale-95"
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
              <p className="text-muted">
                No menu items yet. Add your first item!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
