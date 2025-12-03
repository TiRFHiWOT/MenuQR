import { useState, useCallback } from "react";
import { toast } from "sonner";

interface Business {
  id: string;
  name: string;
  description: string | null;
  logoUrl: string | null;
  qrCodeUrl: string | null;
  _count: {
    menus: number;
    branches: number;
    qrScans: number;
  };
}

export function useBusinesses() {
  const [loading, setLoading] = useState(false);
  const [businesses, setBusinesses] = useState<Business[]>([]);

  const fetchBusinesses = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/businesses");
      if (response.ok) {
        const data = await response.json();
        setBusinesses(data);
        return data;
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to fetch businesses");
        return [];
      }
    } catch (error) {
      toast.error("An error occurred while fetching businesses");
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const createBusiness = useCallback(
    async (data: { name: string; description?: string; logoUrl?: string }) => {
      setLoading(true);
      try {
        const response = await fetch("/api/businesses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        if (response.ok) {
          const business = await response.json();
          toast.success("Business created successfully");
          await fetchBusinesses();
          setLoading(false); // Reset loading before returning
          return business;
        } else {
          const error = await response.json();
          toast.error(error.error || "Failed to create business");
          setLoading(false);
          return null;
        }
      } catch (error) {
        toast.error("An error occurred while creating business");
        setLoading(false);
        return null;
      }
    },
    [fetchBusinesses]
  );

  const updateBusiness = useCallback(
    async (
      businessId: string,
      data: { name?: string; description?: string; logoUrl?: string }
    ) => {
      setLoading(true);
      try {
        const response = await fetch(`/api/businesses/${businessId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        if (response.ok) {
          const business = await response.json();
          toast.success("Business updated successfully");
          await fetchBusinesses();
          setLoading(false); // Reset loading before returning
          return business;
        } else {
          const error = await response.json();
          toast.error(error.error || "Failed to update business");
          setLoading(false);
          return null;
        }
      } catch (error) {
        toast.error("An error occurred while updating business");
        setLoading(false);
        return null;
      }
    },
    [fetchBusinesses]
  );

  const deleteBusiness = useCallback(async (businessId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/businesses/${businessId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Business deleted successfully");
        setBusinesses((prev) => prev.filter((b) => b.id !== businessId));
        setLoading(false); // Reset loading before returning
        return true;
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to delete business");
        setLoading(false);
        return false;
      }
    } catch (error) {
      toast.error("An error occurred while deleting business");
      setLoading(false);
      return false;
    }
  }, []);

  const fetchBusiness = useCallback(async (businessId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/businesses/${businessId}`);
      if (response.ok) {
        const data = await response.json();
        return data;
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to fetch business");
        return null;
      }
    } catch (error) {
      toast.error("An error occurred while fetching business");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    businesses,
    loading,
    fetchBusinesses,
    createBusiness,
    updateBusiness,
    deleteBusiness,
    fetchBusiness,
  };
}
