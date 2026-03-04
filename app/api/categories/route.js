import CATEGORIES from "@/lib/categories";
import { NextResponse } from "next/server";

/**
 * GET /api/categories
 * Return the list of available clothing categories.
 */
export async function GET() {
    return NextResponse.json(CATEGORIES);
}
