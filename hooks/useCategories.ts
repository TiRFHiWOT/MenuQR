import { useState, useCallback } from "react";
import { toast } from "sonner";

interface Category {
  id: string;
  name: string;
  _count?: {
    items: number;
  };
}

export function useCategories() {
  const [loading, setLoading] = useState(false);

  const fetchCategories = useCallback(async (businessId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/categories?businessId=${businessId}`);
      if (response.ok) {
        const data = await response.json();
        return data;
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to fetch categories");
        return [];
      }
    } catch (error) {
      toast.error("An error occurred while fetching categories");
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const createCategory = useCallback(
    async (data: { name: string; businessId: string }) => {
      setLoading(true);
      try {
        const response = await fetch("/api/categories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        if (response.ok) {
          const category = await response.json();
          toast.success("Category created successfully");
          return category;
        } else {
          const error = await response.json();
          toast.error(error.error || "Failed to create category");
          return null;
        }
      } catch (error) {
        toast.error("An error occurred while creating category");
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const updateCategory = useCallback(
    async (categoryId: string, data: { name: string }) => {
      setLoading(true);
      try {
        const response = await fetch(`/api/categories/${categoryId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        if (response.ok) {
          const category = await response.json();
          toast.success("Category updated successfully");
          return category;
        } else {
          const error = await response.json();
          toast.error(error.error || "Failed to update category");
          return null;
        }
      } catch (error) {
        toast.error("An error occurred while updating category");
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const deleteCategory = useCallback(async (categoryId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/categories/${categoryId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Category deleted successfully");
        return true;
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to delete category");
        return false;
      }
    } catch (error) {
      toast.error("An error occurred while deleting category");
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
  };
}
