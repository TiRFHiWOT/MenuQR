import { useState, useCallback } from "react";
import { toast } from "sonner";

export function useAnalytics() {
  const [loading, setLoading] = useState(false);

  const fetchQRScanAnalytics = useCallback(
    async (period: "day" | "week" | "month" = "week", businessId?: string) => {
      setLoading(true);
      try {
        const url = `/api/analytics/qr-scans?period=${period}${
          businessId ? `&businessId=${businessId}` : ""
        }`;
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          return data;
        } else {
          const error = await response.json();
          toast.error(error.error || "Failed to fetch analytics");
          return null;
        }
      } catch (error) {
        toast.error("An error occurred while fetching analytics");
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    loading,
    fetchQRScanAnalytics,
  };
}
