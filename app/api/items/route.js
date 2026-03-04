import { NextResponse } from "next/server";
import getDb from "@/lib/db";
import { v4 as uuidv4 } from "uuid";

/**
 * GET /api/items
 * Retrieve items with optional filtering by category and keyword search.
 *
 * Query params:
 *   - category: filter by clothing category
 *   - q: global keyword search (matches brand, notes, category, color, size)
 */
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const category = searchParams.get("category");
        const query = searchParams.get("q");

        const db = getDb();
        let sql = "SELECT * FROM items WHERE 1=1";
        const params = [];

        if (category && category !== "all") {
            sql += " AND category = ?";
            params.push(category);
        }

        if (query) {
            sql +=
                " AND (brand LIKE ? OR notes LIKE ? OR category LIKE ? OR color LIKE ? OR size LIKE ?)";
            const wildcard = `%${query}%`;
            params.push(wildcard, wildcard, wildcard, wildcard, wildcard);
        }

        sql += " ORDER BY created_at DESC";

        const items = db.prepare(sql).all(...params);
        return NextResponse.json(items);
    } catch (error) {
        console.error("GET /api/items error:", error);
        return NextResponse.json(
            { error: "Failed to fetch items" },
            { status: 500 }
        );
    }
}

/**
 * POST /api/items
 * Create a new clothing item.
 * Expects a JSON body with: image_url, category, brand, purchase_date, size, color, notes.
 */
export async function POST(request) {
    try {
        const body = await request.json();
        const {
            image_url,
            category = "other",
            brand = "",
            purchase_date = "",
            size = "",
            color = "",
            notes = "",
        } = body;

        if (!image_url) {
            return NextResponse.json(
                { error: "image_url is required" },
                { status: 400 }
            );
        }

        const db = getDb();
        const id = uuidv4();
        const now = new Date().toISOString();

        db.prepare(
            `INSERT INTO items (id, image_url, category, brand, purchase_date, size, color, notes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        ).run(id, image_url, category, brand, purchase_date, size, color, notes, now, now);

        const item = db.prepare("SELECT * FROM items WHERE id = ?").get(id);
        return NextResponse.json(item, { status: 201 });
    } catch (error) {
        console.error("POST /api/items error:", error);
        return NextResponse.json(
            { error: "Failed to create item" },
            { status: 500 }
        );
    }
}
