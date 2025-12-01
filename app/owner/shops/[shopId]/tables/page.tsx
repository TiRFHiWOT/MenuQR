"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import QRCode from "qrcode";

interface Table {
  id: string;
  tableNumber: number;
}

export default function TablesPage({
  params,
}: {
  params: Promise<{ shopId: string }> | { shopId: string };
}) {
  const { data: session } = useSession();
  const router = useRouter();
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [tableNumber, setTableNumber] = useState("");
  const [qrCodes, setQrCodes] = useState<Record<string, string>>({});
  const [shopId, setShopId] = useState<string>("");

  useEffect(() => {
    const getShopId = async () => {
      if (params instanceof Promise) {
        const p = await params;
        setShopId(p.shopId);
      } else {
        setShopId(params.shopId);
      }
    };
    getShopId();
  }, [params]);

  useEffect(() => {
    if (shopId) {
      fetchTables();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shopId]);

  useEffect(() => {
    if (shopId && tables.length > 0) {
      generateQRCodes();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tables, shopId]);

  const fetchTables = async () => {
    try {
      const response = await fetch(`/api/shops/${shopId}`);
      if (response.ok) {
        const data = await response.json();
        setTables(data.tables || []);
      }
    } catch (error) {
      console.error("Error fetching tables:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateQRCodes = async () => {
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
    const codes: Record<string, string> = {};

    for (const table of tables) {
      const url = `${baseUrl}/shop/${shopId}/table/${table.id}`;
      try {
        const qrDataUrl = await QRCode.toDataURL(url);
        codes[table.id] = qrDataUrl;
      } catch (error) {
        console.error("Error generating QR code:", error);
      }
    }

    setQrCodes(codes);
  };

  const handleAddTable = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch("/api/tables", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tableNumber: parseInt(tableNumber),
          shopId: shopId,
        }),
      });

      if (response.ok) {
        setTableNumber("");
        fetchTables();
      } else {
        const data = await response.json();
        alert(data.error || "Failed to add table");
      }
    } catch (error) {
      console.error("Error adding table:", error);
    }
  };

  const handleDelete = async (tableId: string) => {
    if (!confirm("Are you sure you want to delete this table?")) return;

    try {
      const response = await fetch(`/api/tables/${tableId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchTables();
      }
    } catch (error) {
      console.error("Error deleting table:", error);
    }
  };

  const downloadQR = (tableId: string, tableNumber: number) => {
    const qrDataUrl = qrCodes[tableId];
    if (!qrDataUrl) return;

    const link = document.createElement("a");
    link.download = `table-${tableNumber}-qr.png`;
    link.href = qrDataUrl;
    link.click();
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link href="/owner/shops" className="text-xl font-bold">
                MenuQR Owner
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                {session?.user.email}
              </span>
              <button
                onClick={() => signOut()}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="text-2xl font-bold mb-6">Tables & QR Codes</h2>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">Add New Table</h3>
          <form onSubmit={handleAddTable} className="flex space-x-4">
            <input
              type="number"
              min="1"
              required
              value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value)}
              placeholder="Table number"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Add Table
            </button>
          </form>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {tables.map((table) => (
            <div key={table.id} className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4 text-center">
                Table {table.tableNumber}
              </h3>
              {qrCodes[table.id] ? (
                <div className="flex flex-col items-center space-y-4">
                  <img
                    src={qrCodes[table.id]}
                    alt={`QR Code for Table ${table.tableNumber}`}
                    className="w-48 h-48"
                  />
                  <button
                    onClick={() => downloadQR(table.id, table.tableNumber)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Download QR
                  </button>
                  <button
                    onClick={() => handleDelete(table.id)}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    Delete Table
                  </button>
                </div>
              ) : (
                <div className="text-center text-gray-600">
                  Generating QR code...
                </div>
              )}
            </div>
          ))}
        </div>

        {tables.length === 0 && !loading && (
          <div className="text-center py-12">
            <p className="text-gray-600">
              No tables yet. Add your first table!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
