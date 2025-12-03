"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Plus, Edit, Trash2, Upload, X } from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";
import { useMenuItems } from "@/hooks/useMenuItems";
import { useCategories } from "@/hooks/useCategories";
import Table from "@/components/ui/Table";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";

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

export default function BusinessMenuPage({
  params,
}: {
  params: Promise<{ businessId: string }> | { businessId: string };
}) {
  const { data: session } = useSession();
  const router = useRouter();
  const {
    createMenuItem,
    updateMenuItem,
    deleteMenuItem,
    loading: menuLoading,
  } = useMenuItems();
  const {
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    loading: categoryLoading,
  } = useCategories();
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
  const [categoryFormData, setCategoryFormData] = useState({ name: "" });
  const [uploading, setUploading] = useState(false);
  const [businessId, setBusinessId] = useState<string>("");

  useEffect(() => {
    const getBusinessId = async () => {
      if (params instanceof Promise) {
        const p = await params;
        setBusinessId(p.businessId);
      } else {
        setBusinessId(params.businessId);
      }
    };
    getBusinessId();
  }, [params]);

  useEffect(() => {
    if (businessId) {
      fetchMenuItems();
      fetchCategories(businessId).then(setCategories);
    }
  }, [businessId]);

  const fetchMenuItems = async () => {
    try {
      const response = await fetch(`/api/businesses/${businessId}`);
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

    if (editingItem) {
      const result = await updateMenuItem(editingItem.id, {
        name: formData.name,
        price: parseFloat(formData.price),
        imageUrl: formData.imageUrl || null,
        categoryId: formData.categoryId || null,
      });
      if (result) {
        setShowForm(false);
        setEditingItem(null);
        setFormData({ name: "", price: "", imageUrl: "", categoryId: "" });
        fetchMenuItems();
      }
    } else {
      const result = await createMenuItem({
        name: formData.name,
        price: parseFloat(formData.price),
        imageUrl: formData.imageUrl || null,
        categoryId: formData.categoryId || null,
        businessId: businessId,
      });
      if (result) {
        setShowForm(false);
        setFormData({ name: "", price: "", imageUrl: "", categoryId: "" });
        fetchMenuItems();
      }
    }
  };

  const handleDelete = async (itemId: string) => {
    const success = await deleteMenuItem(itemId);
    if (success) {
      fetchMenuItems();
    }
  };

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCategory) {
      const result = await updateCategory(editingCategory.id, {
        name: categoryFormData.name,
      });
      if (result) {
        setShowCategoryForm(false);
        setEditingCategory(null);
        setCategoryFormData({ name: "" });
        fetchCategories(businessId).then(setCategories);
      }
    } else {
      const result = await createCategory({
        name: categoryFormData.name,
        businessId: businessId,
      });
      if (result) {
        setShowCategoryForm(false);
        setCategoryFormData({ name: "" });
        fetchCategories(businessId).then(setCategories);
      }
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    const success = await deleteCategory(categoryId);
    if (success) {
      fetchCategories(businessId).then(setCategories);
      fetchMenuItems();
    }
  };

  // Calculate category item counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    menuItems.forEach((item) => {
      if (item.categoryId) {
        counts[item.categoryId] = (counts[item.categoryId] || 0) + 1;
      }
    });
    return counts;
  }, [menuItems]);

  const columns = useMemo<ColumnDef<MenuItem>[]>(
    () => [
      {
        accessorKey: "imageUrl",
        header: "Image",
        cell: ({ row }) => (
          <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-gray-200 flex-shrink-0">
            {row.original.imageUrl ? (
              <Image
                src={row.original.imageUrl}
                alt={row.original.name}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                <span className="text-xs text-gray-400">No image</span>
              </div>
            )}
          </div>
        ),
        enableSorting: false,
      },
      {
        accessorKey: "name",
        header: "Name",
        cell: ({ row }) => (
          <div className="font-semibold text-gray-900">{row.original.name}</div>
        ),
      },
      {
        accessorKey: "price",
        header: "Price",
        cell: ({ row }) => (
          <div className="font-bold text-primary">
            ${row.original.price.toFixed(2)}
          </div>
        ),
      },
      {
        accessorKey: "category",
        header: "Category",
        cell: ({ row }) => (
          <span className="text-xs font-medium bg-primary/10 text-primary px-3 py-1 rounded-full">
            {row.original.category?.name || "Uncategorized"}
          </span>
        ),
        enableSorting: false,
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="rounded-full"
              onClick={() => {
                setEditingItem(row.original);
                setFormData({
                  name: row.original.name,
                  price: row.original.price.toString(),
                  imageUrl: row.original.imageUrl || "",
                  categoryId: row.original.categoryId || "",
                });
                setShowForm(true);
              }}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="rounded-full"
              onClick={() => handleDelete(row.original.id)}
              loading={menuLoading}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ),
        enableSorting: false,
      },
    ],
    [menuLoading]
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link
          href={`/owner/businesses/${businessId}`}
          className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Business
        </Link>

        {/* Header */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-1">
                Menu Management
              </h1>
              <p className="text-sm text-gray-500">
                Manage your menu items and categories
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={() => {
                  setEditingCategory(null);
                  setCategoryFormData({ name: "" });
                  setShowCategoryForm(true);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Category
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  setEditingItem(null);
                  setFormData({
                    name: "",
                    price: "",
                    imageUrl: "",
                    categoryId: "",
                  });
                  setShowForm(true);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </div>
          </div>
        </div>

        {/* Categories Section */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Categories</h2>
          {categories.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p className="mb-4">No categories yet</p>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setEditingCategory(null);
                  setCategoryFormData({ name: "" });
                  setShowCategoryForm(true);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create First Category
              </Button>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => {
                const itemCount = categoryCounts[category.id] || 0;
                return (
                  <div
                    key={category.id}
                    className="flex items-center gap-2 bg-gray-50 px-4 py-2.5 rounded-full border border-gray-200 hover:border-gray-300 transition-all group"
                  >
                    <span className="font-medium text-gray-900">
                      {category.name}
                    </span>
                    <span className="text-xs font-medium text-gray-500 bg-white px-2 py-0.5 rounded-full">
                      {itemCount}
                    </span>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => {
                          setEditingCategory(category);
                          setCategoryFormData({ name: category.name });
                          setShowCategoryForm(true);
                        }}
                        className="p-1 text-gray-600 hover:text-primary hover:bg-primary/10 rounded-full transition-colors"
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(category.id)}
                        className="p-1 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Menu Items Table */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Menu Items</h2>
            {menuItems.length > 0 && (
              <span className="text-sm text-gray-500">
                {menuItems.length} {menuItems.length === 1 ? "item" : "items"}
              </span>
            )}
          </div>
          {menuItems.length > 0 ? (
            <Table data={menuItems} columns={columns} />
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                <Plus className="h-8 w-8 text-gray-400" />
              </div>
              <p className="text-lg font-medium text-gray-900 mb-2">
                No menu items yet
              </p>
              <p className="text-sm text-gray-500 mb-6">
                Get started by adding your first menu item
              </p>
              <Button
                variant="primary"
                onClick={() => {
                  setEditingItem(null);
                  setFormData({
                    name: "",
                    price: "",
                    imageUrl: "",
                    categoryId: "",
                  });
                  setShowForm(true);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Item
              </Button>
            </div>
          )}
        </div>

        {/* Menu Item Form Modal */}
        <Modal
          isOpen={showForm}
          onClose={() => {
            setShowForm(false);
            setEditingItem(null);
            setFormData({ name: "", price: "", imageUrl: "", categoryId: "" });
          }}
          title={editingItem ? "Edit Menu Item" : "Add Menu Item"}
          size="md"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Price *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) =>
                  setFormData({ ...formData, price: e.target.value })
                }
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Category *
              </label>
              <select
                value={formData.categoryId}
                onChange={(e) =>
                  setFormData({ ...formData, categoryId: e.target.value })
                }
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="">Select a category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Image
              </label>
              <div className="flex items-center gap-4">
                {formData.imageUrl && (
                  <div className="relative w-24 h-24 rounded-xl overflow-hidden border border-gray-200 flex-shrink-0">
                    <Image
                      src={formData.imageUrl}
                      alt="Preview"
                      fill
                      className="object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, imageUrl: "" })}
                      className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                )}
                <label className="flex-1 cursor-pointer">
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-primary transition-colors">
                    <Upload className="h-6 w-6 text-gray-400 mx-auto mb-2" />
                    <span className="text-sm text-gray-600">
                      {formData.imageUrl ? "Change Image" : "Upload Image"}
                    </span>
                    {uploading && (
                      <p className="text-xs text-gray-500 mt-2">Uploading...</p>
                    )}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                variant="primary"
                className="flex-1"
                loading={menuLoading}
              >
                {editingItem ? "Update" : "Create"}
              </Button>
              <Button
                type="button"
                variant="secondary"
                className="flex-1"
                onClick={() => {
                  setShowForm(false);
                  setEditingItem(null);
                  setFormData({
                    name: "",
                    price: "",
                    imageUrl: "",
                    categoryId: "",
                  });
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Modal>

        {/* Category Form Modal */}
        <Modal
          isOpen={showCategoryForm}
          onClose={() => {
            setShowCategoryForm(false);
            setEditingCategory(null);
            setCategoryFormData({ name: "" });
          }}
          title={editingCategory ? "Edit Category" : "Add Category"}
          size="sm"
        >
          <form onSubmit={handleCategorySubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Category Name *
              </label>
              <input
                type="text"
                value={categoryFormData.name}
                onChange={(e) => setCategoryFormData({ name: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                variant="primary"
                className="flex-1"
                loading={categoryLoading}
              >
                {editingCategory ? "Update" : "Create"}
              </Button>
              <Button
                type="button"
                variant="secondary"
                className="flex-1"
                onClick={() => {
                  setShowCategoryForm(false);
                  setEditingCategory(null);
                  setCategoryFormData({ name: "" });
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </div>
  );
}
