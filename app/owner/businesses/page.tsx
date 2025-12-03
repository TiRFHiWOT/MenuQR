"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Building2, Plus } from "lucide-react";
import { useBusinesses } from "@/hooks/useBusinesses";
import BusinessCard from "@/components/BusinessCard";
import CreateBusinessModal from "@/components/CreateBusinessModal";
import Button from "@/components/ui/Button";

export default function OwnerBusinessesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { businesses, loading, fetchBusinesses } = useBusinesses();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingBusiness, setEditingBusiness] = useState<any>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
      return;
    }

    if (status === "authenticated") {
      fetchBusinesses();
    }
  }, [session, status, router, fetchBusinesses]);

  const handleEdit = (business: any) => {
    setEditingBusiness(business);
    setShowCreateModal(true);
  };

  const handleDelete = (businessId: string) => {
    fetchBusinesses();
  };

  const handleSuccess = () => {
    fetchBusinesses();
    setEditingBusiness(null);
  };

  if (loading || status === "loading") {
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
      {/* Header */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-3">
              <Building2 className="h-8 w-8 text-primary" />
              <h1 className="text-2xl font-bold text-gray-900">
                My Businesses
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700 font-medium">
                {session?.user.email}
              </span>
              <button
                onClick={() => signOut()}
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors px-4 py-2 rounded-lg hover:bg-gray-100"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Businesses</h2>
          <Button
            variant="primary"
            onClick={() => {
              setEditingBusiness(null);
              setShowCreateModal(true);
            }}
          >
            <Plus className="h-5 w-5 mr-2" />
            Create Business
          </Button>
        </div>

        {businesses.length === 0 && !loading && (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
            <Building2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 text-lg mb-2">No businesses yet</p>
            <p className="text-gray-500 mb-6">
              Create your first business to get started
            </p>
            <Button variant="primary" onClick={() => setShowCreateModal(true)}>
              Create Business
            </Button>
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {businesses.map((business) => (
            <BusinessCard key={business.id} business={business} />
          ))}
        </div>
      </div>

      <CreateBusinessModal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setEditingBusiness(null);
        }}
        onSuccess={handleSuccess}
        editingBusiness={editingBusiness}
      />
    </div>
  );
}
