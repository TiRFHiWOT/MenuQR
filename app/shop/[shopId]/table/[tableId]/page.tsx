import { prisma } from "@/lib/prisma";
import Image from "next/image";
import { notFound } from "next/navigation";

interface PageProps {
  params: Promise<{
    shopId: string;
    tableId: string;
  }>;
}

export default async function CustomerMenuPage({ params }: PageProps) {
  const { shopId, tableId } = await params;

  const shop = await prisma.shop.findUnique({
    where: { id: shopId },
    include: {
      menus: {
        orderBy: { name: "asc" },
      },
    },
  });

  const table = await prisma.table.findUnique({
    where: { id: tableId },
  });

  if (!shop || !table || table.shopId !== shopId) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h1 className="text-3xl font-bold mb-2">{shop.name}</h1>
          {shop.location && (
            <p className="text-gray-600 mb-4">{shop.location}</p>
          )}
          <div className="inline-block px-4 py-2 bg-blue-100 text-blue-800 rounded-lg">
            Table {table.tableNumber}
          </div>
        </div>

        <h2 className="text-2xl font-bold mb-6">Menu</h2>

        {shop.menus.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-600 text-lg">
              No menu items available at this time.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {shop.menus.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-lg shadow overflow-hidden hover:shadow-lg transition-shadow"
              >
                {item.imageUrl && (
                  <div className="relative w-full h-48">
                    <Image
                      src={item.imageUrl}
                      alt={item.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <div className="p-6">
                  <h3 className="text-xl font-semibold mb-2">{item.name}</h3>
                  <p className="text-2xl font-bold text-blue-600">
                    ${item.price.toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export async function generateMetadata({ params }: PageProps) {
  const { shopId } = await params;
  const shop = await prisma.shop.findUnique({
    where: { id: shopId },
  });

  if (!shop) {
    return {
      title: "Menu Not Found",
    };
  }

  return {
    title: `${shop.name} - Menu`,
    description: `Digital menu for ${shop.name}`,
  };
}
