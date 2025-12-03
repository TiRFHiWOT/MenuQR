"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Building2,
  QrCode,
  MapPin,
  Utensils,
  TrendingUp,
  Download,
  Edit,
  Trash2,
  Plus,
  ArrowLeft,
  UtensilsCrossed,
} from "lucide-react";
import { useBusinesses } from "@/hooks/useBusinesses";
import { useBranches } from "@/hooks/useBranches";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import CreateBusinessModal from "@/components/CreateBusinessModal";
import Dropdown from "@/components/ui/Dropdown";

interface Business {
  id: string;
  name: string;
  description: string | null;
  logoUrl: string | null;
  qrCodeUrl: string | null;
  branches: Branch[];
  _count: {
    menus: number;
    branches: number;
    qrScans: number;
  };
}

interface Branch {
  id: string;
  name: string;
  address: string | null;
}

export default function BusinessDetailPage({
  params,
}: {
  params: Promise<{ businessId: string }> | { businessId: string };
}) {
  const { data: session } = useSession();
  const router = useRouter();
  const {
    fetchBusiness,
    updateBusiness,
    deleteBusiness,
    loading: businessLoading,
  } = useBusinesses();
  const {
    createBranch,
    updateBranch,
    deleteBranch,
    loading: branchLoading,
  } = useBranches();
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [businessId, setBusinessId] = useState<string>("");
  const [showBranchForm, setShowBranchForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDeleteBusinessConfirm, setShowDeleteBusinessConfirm] =
    useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [deletingBranchId, setDeletingBranchId] = useState<string | null>(null);
  const [branchFormData, setBranchFormData] = useState({
    name: "",
    address: "",
  });
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);

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
      loadBusiness();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessId]);

  const loadBusiness = async () => {
    setLoading(true);
    try {
      const data = await fetchBusiness(businessId);
      if (data) {
        setBusiness(data);
      }
    } catch (error) {
      console.error("Error fetching business:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBranch = async () => {
    if (!deletingBranchId) return;
    const success = await deleteBranch(deletingBranchId);
    if (success) {
      setShowDeleteConfirm(false);
      setDeletingBranchId(null);
      loadBusiness();
    }
  };

  const handleSubmitBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingBranch) {
      const result = await updateBranch(editingBranch.id, {
        name: branchFormData.name,
        address: branchFormData.address || undefined,
      });
      if (result) {
        setShowBranchForm(false);
        setBranchFormData({ name: "", address: "" });
        setEditingBranch(null);
        loadBusiness();
      }
    } else {
      const result = await createBranch({
        name: branchFormData.name,
        address: branchFormData.address || undefined,
        businessId: businessId,
      });
      if (result) {
        setShowBranchForm(false);
        setBranchFormData({ name: "", address: "" });
        loadBusiness();
      }
    }
  };

  const downloadQRCode = () => {
    if (!business?.qrCodeUrl) return;
    const link = document.createElement("a");
    link.href = business.qrCodeUrl;
    link.download = `${business.name}-qr-code.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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

  if (!business) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 text-lg">Business not found</p>
          <Link
            href="/owner/businesses"
            className="text-primary hover:underline mt-4 inline-block"
          >
            Back to Businesses
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link
          href="/owner/businesses"
          className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Businesses
        </Link>

        {/* Business Header */}
        <div className="bg-white rounded-2xl border border-gray-200 p-8 mb-8">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              {business.logoUrl && (
                <div className="relative w-16 h-16 rounded-full overflow-hidden border border-gray-200 flex-shrink-0">
                  <Image
                    src={business.logoUrl}
                    alt={business.name}
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h1 className="text-4xl font-bold text-gray-900 mb-2">
                  {business.name}
                </h1>
                {business.description && (
                  <p className="text-gray-600 line-clamp-1">
                    {business.description}
                  </p>
                )}
              </div>
            </div>
            <div className="flex gap-3 shrink-0 rounded-full bg-gray-100">
              <Dropdown
                items={[
                  {
                    label: "Manage Menu",
                    icon: <UtensilsCrossed className="h-4 w-4" />,
                    onClick: () =>
                      router.push(`/owner/businesses/${businessId}/menu`),
                  },
                  {
                    label: "Add Branch",
                    icon: <Plus className="h-4 w-4" />,
                    onClick: () => {
                      setEditingBranch(null);
                      setBranchFormData({ name: "", address: "" });
                      setShowBranchForm(true);
                    },
                  },
                  {
                    label: "Edit Business",
                    icon: <Edit className="h-4 w-4" />,
                    onClick: () => setShowEditModal(true),
                  },
                  {
                    label: "Delete Business",
                    icon: <Trash2 className="h-4 w-4" />,
                    onClick: () => setShowDeleteBusinessConfirm(true),
                    variant: "danger",
                  },
                ]}
              />
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-6">
            <div className="text-center p-4 bg-gray-50 rounded-xl border border-gray-200">
              <Utensils className="h-6 w-6 text-primary mx-auto mb-2" />
              <div className="text-3xl font-bold text-gray-900">
                {business._count?.menus || 0}
              </div>
              <div className="text-sm text-gray-500">Menu Items</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-xl border border-gray-200">
              <MapPin className="h-6 w-6 text-primary mx-auto mb-2" />
              <div className="text-3xl font-bold text-gray-900">
                {business._count?.branches || 1}
              </div>
              <div className="text-sm text-gray-500">Branches</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-xl border border-gray-200">
              <TrendingUp className="h-6 w-6 text-primary mx-auto mb-2" />
              <div className="text-3xl font-bold text-gray-900">
                {business._count?.qrScans || 0}
              </div>
              <div className="text-sm text-gray-500">QR Scans</div>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* QR Code */}
          <div className="bg-white rounded-2xl border border-gray-200 p-8">
            <div className="flex items-center gap-3 mb-6">
              <QrCode className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold text-gray-900">QR Code</h2>
            </div>
            {business.qrCodeUrl ? (
              <div className="text-center">
                <div className="bg-white p-4 rounded-xl inline-block mb-4 border-2 border-gray-200">
                  <Image
                    src={business.qrCodeUrl}
                    alt="QR Code"
                    width={200}
                    height={200}
                    className="rounded-lg"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="primary"
                    className="flex-1"
                    onClick={downloadQRCode}
                  >
                    <Download className="h-5 w-5 mr-2" />
                    Download
                  </Button>
                  <Button
                    variant="secondary"
                    className="flex-1"
                    onClick={async () => {
                      try {
                        const response = await fetch(`/api/qr/${businessId}`, {
                          method: "GET",
                        });
                        if (response.ok) {
                          const data = await response.json();
                          await loadBusiness(); // Reload to get new QR code
                        }
                      } catch (error) {
                        console.error("Error regenerating QR code:", error);
                      }
                    }}
                  >
                    Regenerate
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-center">QR code not available</p>
            )}
          </div>

          {/* Branches */}
          <div className="bg-white rounded-2xl border border-gray-200 p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <MapPin className="h-6 w-6 text-primary" />
                <h2 className="text-2xl font-bold text-gray-900">Branches</h2>
              </div>
            </div>

            <div className="space-y-3">
              {business.branches.map((branch) => (
                <div
                  key={branch.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200"
                >
                  <div>
                    <div className="font-semibold text-gray-900">
                      {branch.name}
                    </div>
                    {branch.address && (
                      <div className="text-sm text-gray-500">
                        {branch.address}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingBranch(branch);
                        setBranchFormData({
                          name: branch.name,
                          address: branch.address || "",
                        });
                        setShowBranchForm(true);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => {
                        setDeletingBranchId(branch.id);
                        setShowDeleteConfirm(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              {business.branches.length === 0 && (
                <p className="text-gray-500 text-center py-8">
                  No branches yet. Add your first branch!
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Branch Form Modal */}
      <Modal
        isOpen={showBranchForm}
        onClose={() => {
          setShowBranchForm(false);
          setEditingBranch(null);
          setBranchFormData({ name: "", address: "" });
        }}
        title={editingBranch ? "Edit Branch" : "Add Branch"}
        size="sm"
      >
        <form onSubmit={handleSubmitBranch} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Branch Name *
            </label>
            <input
              type="text"
              value={branchFormData.name}
              onChange={(e) =>
                setBranchFormData({ ...branchFormData, name: e.target.value })
              }
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Address
            </label>
            <input
              type="text"
              value={branchFormData.address}
              onChange={(e) =>
                setBranchFormData({
                  ...branchFormData,
                  address: e.target.value,
                })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              variant="primary"
              className="flex-1"
              loading={branchLoading}
            >
              {editingBranch ? "Update" : "Create"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={() => {
                setShowBranchForm(false);
                setEditingBranch(null);
                setBranchFormData({ name: "", address: "" });
              }}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Branch Confirmation Modal */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setDeletingBranchId(null);
        }}
        title="Delete Branch"
        size="sm"
      >
        <p className="text-gray-600 mb-6">
          Are you sure you want to delete this branch? This action cannot be
          undone.
        </p>
        <div className="flex gap-3">
          <Button
            variant="danger"
            className="flex-1"
            onClick={handleDeleteBranch}
            loading={branchLoading}
          >
            Delete
          </Button>
          <Button
            variant="secondary"
            className="flex-1"
            onClick={() => {
              setShowDeleteConfirm(false);
              setDeletingBranchId(null);
            }}
          >
            Cancel
          </Button>
        </div>
      </Modal>

      {/* Edit Business Modal */}
      <CreateBusinessModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
        }}
        onSuccess={(updatedBusiness) => {
          setBusiness(updatedBusiness);
          setShowEditModal(false);
          loadBusiness();
        }}
        editingBusiness={
          business
            ? {
                id: business.id,
                name: business.name,
                description: business.description,
                logoUrl: business.logoUrl,
              }
            : null
        }
      />

      {/* Delete Business Confirmation Modal */}
      <Modal
        isOpen={showDeleteBusinessConfirm}
        onClose={() => setShowDeleteBusinessConfirm(false)}
        title="Delete Business"
        size="sm"
      >
        <p className="text-gray-600 mb-6">
          Are you sure you want to delete &quot;{business?.name}&quot;? This
          action cannot be undone.
        </p>
        <div className="flex gap-3">
          <Button
            variant="danger"
            className="flex-1"
            onClick={async () => {
              if (business) {
                const success = await deleteBusiness(business.id);
                if (success) {
                  setShowDeleteBusinessConfirm(false);
                  router.push("/owner/businesses");
                }
              }
            }}
            loading={businessLoading}
          >
            Delete
          </Button>
          <Button
            variant="secondary"
            className="flex-1"
            onClick={() => setShowDeleteBusinessConfirm(false)}
          >
            Cancel
          </Button>
        </div>
      </Modal>
    </div>
  );
}
