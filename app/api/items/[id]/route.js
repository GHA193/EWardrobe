import { NextResponse } from "next/server";
import getDb from "@/lib/db";

/**
 * GET /api/items/[id]
 * Retrieve a single clothing item by its ID.
 */
export async function GET(request, { params }) {
    try {
        const { id } = await params;
        const db = getDb();
        const item = db.prepare("SELECT * FROM items WHERE id = ?").get(id);

        if (!item) {
            return NextResponse.json({ error: "Item not found" }, { status: 404 });
        }

        return NextResponse.json(item);
    } catch (error) {
        console.error("GET /api/items/[id] error:", error);
        return NextResponse.json(
            { error: "Failed to fetch item" },
            { status: 500 }
        );
    }
}

/**
 * PUT /api/items/[id]
 * Update an existing clothing item.
 */
export async function PUT(request, { params }) {
    try {
        const { id } = await params;
        const body = await request.json();
        const db = getDb();

        const existing = db.prepare("SELECT * FROM items WHERE id = ?").get(id);
        if (!existing) {
            return NextResponse.json({ error: "Item not found" }, { status: 404 });
        }

        const {
            image_url = existing.image_url,
            category = existing.category,
            brand = existing.brand,
            purchase_date = existing.purchase_date,
            size = existing.size,
            color = existing.color,
            notes = existing.notes,
        } = body;

        const now = new Date().toISOString();

        db.prepare(
            `UPDATE items SET image_url = ?, category = ?, brand = ?, purchase_date = ?,
       size = ?, color = ?, notes = ?, updated_at = ? WHERE id = ?`
        ).run(image_url, category, brand, purchase_date, size, color, notes, now, id);

        const updated = db.prepare("SELECT * FROM items WHERE id = ?").get(id);
        return NextResponse.json(updated);
    } catch (error) {
        console.error("PUT /api/items/[id] error:", error);
        return NextResponse.json(
            { error: "Failed to update item" },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/items/[id]
 * Delete a clothing item and its associated image file.
 */
export async function DELETE(request, { params }) {
    try {
        const { id } = await params;
        const db = getDb();

        const item = db.prepare("SELECT * FROM items WHERE id = ?").get(id);
        if (!item) {
            return NextResponse.json({ error: "Item not found" }, { status: 404 });
        }

        db.prepare("DELETE FROM items WHERE id = ?").run(id);

        // Attempt to delete the image file from disk
        try {
            const fs = await import("fs");
            const path = await import("path");
            const imagePath = path.join(process.cwd(), "public", item.image_url);
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }
        } catch {
            // Non-critical: log but don't fail the request
            console.warn("Could not delete image file for item:", id);
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("DELETE /api/items/[id] error:", error);
        return NextResponse.json(
            { error: "Failed to delete item" },
            { status: 500 }
        );
    }
}
