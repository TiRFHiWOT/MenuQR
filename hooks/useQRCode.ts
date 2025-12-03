import { useState, useCallback } from "react";
import { toast } from "sonner";

export function useQRCode() {
  const [loading, setLoading] = useState(false);

  const trackScan = useCallback(async (businessId: string) => {
    try {
      await fetch(`/api/qr/${businessId}`, {
        method: "POST",
      });
    } catch (error) {
      // Silent fail for tracking
      console.error("Failed to track QR scan:", error);
    }
  }, []);

  const getQRCode = useCallback(async (businessId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/qr/${businessId}`);
      if (response.ok) {
        const data = await response.json();
        return data.qrCodeUrl;
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to get QR code");
        return null;
      }
    } catch (error) {
      toast.error("An error occurred while getting QR code");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    trackScan,
    getQRCode,
  };
}
