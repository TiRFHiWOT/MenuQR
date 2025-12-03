"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Upload, X } from "lucide-react";
import Modal from "./ui/Modal";
import Button from "./ui/Button";
import { useBusinesses } from "@/hooks/useBusinesses";

interface CreateBusinessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (business: any) => void;
  editingBusiness?: {
    id: string;
    name: string;
    description: string | null;
    logoUrl: string | null;
  } | null;
}

export default function CreateBusinessModal({
  isOpen,
  onClose,
  onSuccess,
  editingBusiness,
}: CreateBusinessModalProps) {
  const { createBusiness, updateBusiness, loading } = useBusinesses();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    logoUrl: "",
  });
  const [uploading, setUploading] = useState(false);

  // Update form data when editingBusiness changes
  useEffect(() => {
    if (editingBusiness) {
      setFormData({
        name: editingBusiness.name || "",
        description: editingBusiness.description || "",
        logoUrl: editingBusiness.logoUrl || "",
      });
    } else {
      setFormData({ name: "", description: "", logoUrl: "" });
    }
  }, [editingBusiness, isOpen]);

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
        setFormData((prev) => ({ ...prev, logoUrl: data.imageUrl }));
      }
    } catch (error) {
      console.error("Error uploading image:", error);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingBusiness) {
      const result = await updateBusiness(editingBusiness.id, {
        name: formData.name,
        description: formData.description || undefined,
        logoUrl: formData.logoUrl || undefined,
      });
      if (result) {
        onSuccess?.(result);
        onClose();
        setFormData({ name: "", description: "", logoUrl: "" });
      }
    } else {
      const result = await createBusiness({
        name: formData.name,
        description: formData.description || undefined,
        logoUrl: formData.logoUrl || undefined,
      });
      if (result) {
        onSuccess?.(result);
        onClose();
        setFormData({ name: "", description: "", logoUrl: "" });
      }
    }
  };

  const handleClose = () => {
    if (!editingBusiness) {
      setFormData({ name: "", description: "", logoUrl: "" });
    }
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={editingBusiness ? "Edit Business" : "Create New Business"}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Logo Upload */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Business Logo
          </label>
          <div className="flex items-center gap-4">
            {formData.logoUrl && (
              <div className="relative w-24 h-24 rounded-xl overflow-hidden border border-gray-200">
                <Image
                  src={formData.logoUrl}
                  alt="Logo preview"
                  fill
                  className="object-cover"
                />
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, logoUrl: "" })}
                  className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
            <label className="flex-1 cursor-pointer">
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-primary transition-colors">
                <Upload className="h-6 w-6 text-gray-400 mx-auto mb-2" />
                <span className="text-sm text-gray-600">
                  {formData.logoUrl ? "Change Logo" : "Upload Logo"}
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

        {/* Name */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Business Name *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => {
              const value = e.target.value.slice(0, 50); // Limit to 50 characters
              setFormData({ ...formData, name: value });
            }}
            maxLength={50}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            placeholder="Enter business name (max 50 characters)"
          />
          <p className="text-xs text-gray-500 mt-1">
            {formData.name.length}/50 characters
          </p>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            rows={4}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            placeholder="Enter business description (optional)"
          />
        </div>

        <div className="flex gap-3 pt-4">
          <Button
            type="submit"
            variant="primary"
            className="flex-1"
            loading={loading}
          >
            {editingBusiness ? "Update Business" : "Create Business"}
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="flex-1"
            onClick={handleClose}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Modal>
  );
}
