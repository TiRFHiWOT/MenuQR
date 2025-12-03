import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createServerSupabaseClient } from "@/lib/supabase";
import { createId } from "@paralleldrive/cuid2";
import QRCode from "qrcode";

// Track QR scan (POST) - public endpoint
export async function POST(
  request: Request,
  {
    params,
  }: { params: Promise<{ businessId: string }> | { businessId: string } }
) {
  try {
    const businessId =
      params instanceof Promise ? (await params).businessId : params.businessId;

    // Get client IP and user agent if available
    const headers = request.headers;
    const ipAddress =
      headers.get("x-forwarded-for") || headers.get("x-real-ip") || "unknown";
    const userAgent = headers.get("user-agent") || null;

    // Create QR scan record
    try {
      await prisma.qRScan.create({
        data: {
          businessId,
          ipAddress: ipAddress !== "unknown" ? ipAddress : null,
          userAgent,
        },
      });
    } catch (error) {
      // Fallback to Supabase if Prisma fails
      const supabase = createServerSupabaseClient();
      const scanId = createId();
      const now = new Date().toISOString();

      await supabase.from("QRScan").insert({
        id: scanId,
        businessId,
        ipAddress: ipAddress !== "unknown" ? ipAddress : null,
        userAgent,
        scannedAt: now,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error tracking QR scan:", error);
    // Don't fail the request if tracking fails
    return NextResponse.json({ success: false });
  }
}

// Get QR code image (GET) - public endpoint
export async function GET(
  request: Request,
  {
    params,
  }: { params: Promise<{ businessId: string }> | { businessId: string } }
) {
  try {
    const businessId =
      params instanceof Promise ? (await params).businessId : params.businessId;

    // Get business to check if it exists
    let business;
    try {
      business = await prisma.business.findUnique({
        where: { id: businessId },
        select: { id: true, qrCodeUrl: true },
      });
    } catch (error) {
      const supabase = createServerSupabaseClient();
      const { data } = await supabase
        .from("Business")
        .select("id, qrCodeUrl")
        .eq("id", businessId)
        .single();
      business = data;
    }

    if (!business) {
      return NextResponse.json(
        { error: "Business not found" },
        { status: 404 }
      );
    }

    // If QR code already exists, return it
    if (business.qrCodeUrl) {
      return NextResponse.json({ qrCodeUrl: business.qrCodeUrl });
    }

    // Generate new QR code
    // Prioritize NEXT_PUBLIC_BASE_URL from environment
    let baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

    // If not set, try NEXTAUTH_URL
    if (!baseUrl) {
      baseUrl = process.env.NEXTAUTH_URL;
    }

    // If still not set, try to get from request headers
    if (!baseUrl) {
      const host = request.headers.get("host");
      const protocol = request.headers.get("x-forwarded-proto") || "http";
      if (host && !host.includes("localhost") && !host.includes("127.0.0.1")) {
        baseUrl = `${protocol}://${host}`;
      }
    }

    // Fallback to localhost only if no other option
    if (!baseUrl) {
      baseUrl = "http://localhost:3000";
    }

    // Log for debugging (remove in production)
    if (process.env.NODE_ENV === "development") {
      console.log("QR Code Base URL:", baseUrl);
    }

    // Ensure the URL is properly formatted
    const qrUrl = `${baseUrl.replace(/\/$/, "")}/business/${businessId}`;

    const qrCodeDataUrl = await QRCode.toDataURL(qrUrl, {
      width: 400,
      margin: 2,
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
      type: "image/png",
      errorCorrectionLevel: "M",
    });

    // Save QR code to business
    try {
      await prisma.business.update({
        where: { id: businessId },
        data: { qrCodeUrl: qrCodeDataUrl },
      });
    } catch (error) {
      const supabase = createServerSupabaseClient();
      await supabase
        .from("Business")
        .update({ qrCodeUrl: qrCodeDataUrl })
        .eq("id", businessId);
    }

    return NextResponse.json({ qrCodeUrl: qrCodeDataUrl });
  } catch (error: any) {
    console.error("Error generating QR code:", error);
    return NextResponse.json(
      {
        error: "Failed to generate QR code",
        details:
          process.env.NODE_ENV === "development" ? error?.message : undefined,
      },
      { status: 500 }
    );
  }
}
