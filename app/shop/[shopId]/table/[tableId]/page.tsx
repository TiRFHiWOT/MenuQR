import { prisma } from "@/lib/prisma";
import { createServerSupabaseClient } from "@/lib/supabase";
import Image from "next/image";
import { notFound } from "next/navigation";

interface PageProps {
  params: Promise<{
    shopId: string;
    tableId: string;
  }>;
}

async function getShopWithPrisma(shopId: string) {
  return await prisma.shop.findUnique({
    where: { id: shopId },
    include: {
      menus: {
        orderBy: { name: "asc" },
      },
    },
  });
}

async function getShopWithSupabase(shopId: string) {
  const supabase = createServerSupabaseClient();

  const { data: shop, error: shopError } = await supabase
    .from("Shop")
    .select("*")
    .eq("id", shopId)
    .single();

  if (shopError || !shop) {
    return null;
  }

  // Fetch menu items
  const { data: menus, error: menusError } = await supabase
    .from("MenuItem")
    .select("*")
    .eq("shopId", shopId)
    .order("name", { ascending: true });

  return {
    ...shop,
    menus: menus || [],
  };
}

async function getTableWithPrisma(tableId: string) {
  return await prisma.table.findUnique({
    where: { id: tableId },
  });
}

async function getTableWithSupabase(tableId: string) {
  const supabase = createServerSupabaseClient();

  const { data: table, error } = await supabase
    .from("Table")
    .select("*")
    .eq("id", tableId)
    .single();

  if (error || !table) {
    return null;
  }

  return table;
}

export default async function CustomerMenuPage({ params }: PageProps) {
  const { shopId, tableId } = await params;

  let shop;
  let table;

  // Try Prisma first, fallback to Supabase REST API if Prisma fails
  try {
    shop = await getShopWithPrisma(shopId);
    table = await getTableWithPrisma(tableId);
  } catch (prismaError: any) {
    const isConnectionError =
      prismaError?.code === "P1001" ||
      prismaError?.code === "P1013" ||
      prismaError?.message?.includes("Can't reach database server") ||
      prismaError?.message?.includes("database string is invalid") ||
      prismaError?.message?.includes("provided arguments are not supported");

    if (isConnectionError) {
      console.log(
        "Prisma connection failed, using Supabase REST API as fallback for customer menu..."
      );
      shop = await getShopWithSupabase(shopId);
      table = await getTableWithSupabase(tableId);
    } else {
      throw prismaError;
    }
  }

  if (!shop || !table || table.shopId !== shopId) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="max-w-4xl mx-auto section">
        <div className="card mb-6">
          <h1 className="text-3xl font-bold mb-2">{shop.name}</h1>
          {shop.location && <p className="text-muted mb-4">{shop.location}</p>}
          <div className="inline-block badge">Table {table.tableNumber}</div>
        </div>

        <h2 className="text-2xl font-bold mb-6">Menu</h2>

        {shop.menus.length === 0 ? (
          <div className="card p-12 text-center">
            <p className="text-muted text-lg">
              No menu items available at this time.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {shop.menus.map((item) => (
              <div
                key={item.id}
                className="card overflow-hidden hover:shadow-md transition-shadow duration-150"
              >
                {item.imageUrl && (
                  <div className="relative w-full h-48 -m-5 mb-4">
                    <Image
                      src={item.imageUrl}
                      alt={item.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <div>
                  <h3 className="text-xl font-semibold mb-2">{item.name}</h3>
                  <p className="text-2xl font-bold text-primary">
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

  let shop;

  try {
    shop = await prisma.shop.findUnique({
      where: { id: shopId },
    });
  } catch (prismaError: any) {
    const isConnectionError =
      prismaError?.code === "P1001" ||
      prismaError?.code === "P1013" ||
      prismaError?.message?.includes("Can't reach database server") ||
      prismaError?.message?.includes("database string is invalid") ||
      prismaError?.message?.includes("provided arguments are not supported");

    if (isConnectionError) {
      const supabase = createServerSupabaseClient();
      const { data } = await supabase
        .from("Shop")
        .select("name")
        .eq("id", shopId)
        .single();
      shop = data;
    }
  }

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
