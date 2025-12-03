import { useState, useCallback } from "react";
import { toast } from "sonner";

interface MenuItem {
  id: string;
  name: string;
  price: number;
  imageUrl: string | null;
  categoryId: string | null;
  category?: {
    id: string;
    name: string;
  } | null;
}

export function useMenuItems() {
  const [loading, setLoading] = useState(false);

  const createMenuItem = useCallback(
    async (data: {
      name: string;
      price: number;
      imageUrl?: string | null;
      categoryId?: string | null;
      businessId: string;
    }) => {
      setLoading(true);
      try {
        const response = await fetch("/api/menu-items", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        if (response.ok) {
          const item = await response.json();
          toast.success("Menu item created successfully");
          return item;
        } else {
          const error = await response.json();
          toast.error(error.error || "Failed to create menu item");
          return null;
        }
      } catch (error) {
        toast.error("An error occurred while creating menu item");
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const updateMenuItem = useCallback(
    async (
      itemId: string,
      data: {
        name?: string;
        price?: number;
        imageUrl?: string | null;
        categoryId?: string | null;
      }
    ) => {
      setLoading(true);
      try {
        const response = await fetch(`/api/menu-items/${itemId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        if (response.ok) {
          const item = await response.json();
          toast.success("Menu item updated successfully");
          return item;
        } else {
          const error = await response.json();
          toast.error(error.error || "Failed to update menu item");
          return null;
        }
      } catch (error) {
        toast.error("An error occurred while updating menu item");
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const deleteMenuItem = useCallback(async (itemId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/menu-items/${itemId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Menu item deleted successfully");
        return true;
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to delete menu item");
        return false;
      }
    } catch (error) {
      toast.error("An error occurred while deleting menu item");
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    createMenuItem,
    updateMenuItem,
    deleteMenuItem,
  };
}
