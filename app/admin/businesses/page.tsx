"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Building2, BarChart3 } from "lucide-react";

interface Business {
  id: string;
  name: string;
  description: string | null;
  owner: {
    id: string;
    name: string | null;
    email: string;
  };
  _count: {
    menus: number;
    branches: number;
    qrScans: number;
  };
  createdAt: string;
}

export default function AdminBusinessesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
      return;
    }

    if (status === "authenticated" && session?.user.role !== "ADMIN") {
      router.push("/owner/businesses");
      return;
    }

    if (status === "authenticated") {
      fetchBusinesses();
    }
  }, [session, status, router]);

  const fetchBusinesses = async () => {
    try {
      const response = await fetch("/api/businesses");
      if (response.ok) {
        const data = await response.json();
        setBusinesses(data);
      }
    } catch (error) {
      console.error("Error fetching businesses:", error);
    } finally {
      setLoading(false);
    }
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
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-3">
              <Building2 className="h-8 w-8 text-primary" />
              <h1 className="text-2xl font-bold text-gray-900">
                All Businesses
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/admin/dashboard"
                className="text-sm text-gray-700 hover:text-gray-900 font-medium flex items-center gap-2"
              >
                <BarChart3 className="h-4 w-4" />
                Dashboard
              </Link>
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
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">
                    Business Name
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">
                    Owner
                  </th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700">
                    Branches
                  </th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700">
                    Menu Items
                  </th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700">
                    QR Scans
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">
                    Created
                  </th>
                </tr>
              </thead>
              <tbody>
                {businesses.map((business) => (
                  <tr
                    key={business.id}
                    className="border-b border-gray-100 hover:bg-gray-50"
                  >
                    <td className="py-3 px-4 font-medium text-gray-900">
                      {business.name}
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {business.owner.name || business.owner.email}
                    </td>
                    <td className="py-3 px-4 text-center text-gray-600">
                      {business._count.branches}
                    </td>
                    <td className="py-3 px-4 text-center text-gray-600">
                      {business._count.menus}
                    </td>
                    <td className="py-3 px-4 text-center text-gray-600">
                      {business._count.qrScans}
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {new Date(business.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {businesses.length === 0 && (
              <p className="text-gray-500 text-center py-8">
                No businesses found
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
