import { useState, useCallback } from "react";
import { toast } from "sonner";

interface Branch {
  id: string;
  name: string;
  address: string | null;
  businessId: string;
}

export function useBranches() {
  const [loading, setLoading] = useState(false);

  const fetchBranches = useCallback(async (businessId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/branches?businessId=${businessId}`);
      if (response.ok) {
        const data = await response.json();
        return data;
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to fetch branches");
        return [];
      }
    } catch (error) {
      toast.error("An error occurred while fetching branches");
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const createBranch = useCallback(
    async (data: { name: string; address?: string; businessId: string }) => {
      setLoading(true);
      try {
        const response = await fetch("/api/branches", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        if (response.ok) {
          const branch = await response.json();
          toast.success("Branch created successfully");
          return branch;
        } else {
          const error = await response.json();
          toast.error(error.error || "Failed to create branch");
          return null;
        }
      } catch (error) {
        toast.error("An error occurred while creating branch");
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const updateBranch = useCallback(
    async (branchId: string, data: { name?: string; address?: string }) => {
      setLoading(true);
      try {
        const response = await fetch(`/api/branches/${branchId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        if (response.ok) {
          const branch = await response.json();
          toast.success("Branch updated successfully");
          return branch;
        } else {
          const error = await response.json();
          toast.error(error.error || "Failed to update branch");
          return null;
        }
      } catch (error) {
        toast.error("An error occurred while updating branch");
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const deleteBranch = useCallback(async (branchId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/branches/${branchId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Branch deleted successfully");
        return true;
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to delete branch");
        return false;
      }
    } catch (error) {
      toast.error("An error occurred while deleting branch");
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    fetchBranches,
    createBranch,
    updateBranch,
    deleteBranch,
  };
}
