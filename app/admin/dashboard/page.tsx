"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Building2,
  TrendingUp,
  QrCode,
  MapPin,
  BarChart3,
  Calendar,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface Stats {
  totalBusinesses: number;
  totalBranches: number;
  totalScans: number;
  scansToday: number;
  scansThisWeek: number;
  scansThisMonth: number;
  trend: number;
}

interface Business {
  id: string;
  name: string;
  owner: {
    name: string | null;
    email: string;
  };
  _count: {
    branches: number;
    menus: number;
    qrScans: number;
  };
  createdAt: string;
}

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [scanData, setScanData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<"day" | "week" | "month">("week");

  const fetchData = useCallback(async () => {
    try {
      // Fetch businesses
      const businessesRes = await fetch("/api/businesses");
      if (businessesRes.ok) {
        const businessesData = await businessesRes.json();
        setBusinesses(businessesData);

        // Calculate stats
        const totalBusinesses = businessesData.length;
        const totalBranches = businessesData.reduce(
          (sum: number, b: Business) => sum + (b._count?.branches || 0),
          0
        );
        const totalScans = businessesData.reduce(
          (sum: number, b: Business) => sum + (b._count?.qrScans || 0),
          0
        );

        setStats({
          totalBusinesses,
          totalBranches,
          totalScans,
          scansToday: 0, // Will be updated from analytics
          scansThisWeek: 0,
          scansThisMonth: 0,
          trend: 0,
        });
      }

      // Fetch analytics
      const analyticsRes = await fetch(
        `/api/analytics/qr-scans?period=${period}`
      );
      if (analyticsRes.ok) {
        const analyticsData = await analyticsRes.json();
        setScanData(analyticsData);

        setStats((prevStats) => {
          if (!prevStats) return prevStats;
          return {
            ...prevStats,
            scansToday: period === "day" ? analyticsData.periodScans : 0,
            scansThisWeek: period === "week" ? analyticsData.periodScans : 0,
            scansThisMonth: period === "month" ? analyticsData.periodScans : 0,
            trend: analyticsData.trend || 0,
          };
        });
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  }, [period]);

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
      fetchData();
    }
  }, [session, status, router, period, fetchData]);

  if (loading || status === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const chartData =
    scanData?.byDate?.map((item: any) => ({
      date: new Date(item.date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      scans: item.count,
    })) || [];

  const hourlyData =
    scanData?.byHour?.map((item: any) => ({
      hour: `${item.hour}:00`,
      scans: item.count,
    })) || [];

  const businessScansData =
    scanData?.byBusiness
      ?.sort((a: any, b: any) => b.periodScans - a.periodScans)
      .slice(0, 10)
      .map((item: any) => ({
        name:
          item.businessName.length > 15
            ? item.businessName.substring(0, 15) + "..."
            : item.businessName,
        scans: item.periodScans,
      })) || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-3">
              <BarChart3 className="h-8 w-8 text-primary" />
              <h1 className="text-2xl font-bold text-gray-900">
                Admin Dashboard
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/admin/businesses"
                className="text-sm text-gray-700 hover:text-gray-900 font-medium"
              >
                View All Businesses
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
        {/* Period Selector */}
        <div className="mb-6 flex gap-2">
          <button
            onClick={() => setPeriod("day")}
            className={`px-4 py-2 rounded-xl font-semibold transition-all ${
              period === "day"
                ? "bg-primary text-white"
                : "bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            Today
          </button>
          <button
            onClick={() => setPeriod("week")}
            className={`px-4 py-2 rounded-xl font-semibold transition-all ${
              period === "week"
                ? "bg-primary text-white"
                : "bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            This Week
          </button>
          <button
            onClick={() => setPeriod("month")}
            className={`px-4 py-2 rounded-xl font-semibold transition-all ${
              period === "month"
                ? "bg-primary text-white"
                : "bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            This Month
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <Building2 className="h-8 w-8 text-primary" />
              <span className="text-3xl font-bold text-gray-900">
                {stats?.totalBusinesses || 0}
              </span>
            </div>
            <div className="text-sm text-gray-500">Total Businesses</div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <MapPin className="h-8 w-8 text-primary" />
              <span className="text-3xl font-bold text-gray-900">
                {stats?.totalBranches || 0}
              </span>
            </div>
            <div className="text-sm text-gray-500">Total Branches</div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <QrCode className="h-8 w-8 text-primary" />
              <span className="text-3xl font-bold text-gray-900">
                {scanData?.periodScans || 0}
              </span>
            </div>
            <div className="text-sm text-gray-500">
              QR Scans (
              {period === "day"
                ? "Today"
                : period === "week"
                ? "This Week"
                : "This Month"}
              )
            </div>
            {scanData?.trend !== undefined && (
              <div
                className={`text-xs mt-2 ${
                  scanData.trend >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {scanData.trend >= 0 ? "↑" : "↓"}{" "}
                {Math.abs(scanData.trend).toFixed(1)}%
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <TrendingUp className="h-8 w-8 text-primary" />
              <span className="text-3xl font-bold text-gray-900">
                {stats?.totalScans || 0}
              </span>
            </div>
            <div className="text-sm text-gray-500">Total All-Time Scans</div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Scan Trends */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Scan Trends
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="scans"
                  stroke="#d7263d"
                  strokeWidth={2}
                  name="Scans"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Hourly Distribution */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Hourly Scan Distribution
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={hourlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="scans" fill="#d7263d" name="Scans" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Businesses */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Top Businesses by Scans
          </h2>
          {businessScansData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={businessScansData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={150} />
                <Tooltip />
                <Bar dataKey="scans" fill="#d7263d" name="Scans" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500 text-center py-8">
              No scan data available
            </p>
          )}
        </div>

        {/* Recent Businesses */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            All Businesses
          </h2>
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
                    Total Scans
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
