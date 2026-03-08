import { NextResponse } from "next/server";
import getDb from "@/lib/db";
import fs from "fs";
import path from "path";

/**
 * POST /api/items/batch-delete
 * Delete multiple clothing items and their associated image files.
 * Expects { ids: ["id1", "id2", ...] }
 */
export async function POST(request) {
    try {
        const body = await request.json();
        const { ids } = body;

        if (!Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json({ error: "No ids provided" }, { status: 400 });
        }

        const db = getDb();

        // 1. Fetch items to get image URLs before deleting the records
        const placeholders = ids.map(() => '?').join(',');
        const items = db.prepare(`SELECT * FROM items WHERE id IN (${placeholders})`).all(...ids);

        if (items.length === 0) {
            return NextResponse.json({ success: true, message: "No items matched criteria" });
        }

        // 2. Delete database records FIRST (Safeguard against data-hanging if fs fails)
        db.prepare(`DELETE FROM items WHERE id IN (${placeholders})`).run(...ids);

        // 3. Delete physical image files
        // We do this non-blockingly and tolerate missing files to prevent request failure.
        items.forEach(item => {
            if (item.image_url) {
                try {
                    // Extract safe filename if image_url has path info
                    const safeFilename = path.basename(item.image_url);
                    const imagePath = path.join(process.cwd(), "public", "uploads", safeFilename);
                    if (fs.existsSync(imagePath)) {
                        fs.unlinkSync(imagePath);
                    }
                } catch (err) {
                    console.warn(`Could not delete image file for item: ${item.id}`, err);
                }
            }
        });

        return NextResponse.json({ success: true, count: items.length });
    } catch (error) {
        console.error("POST /api/items/batch-delete error:", error);
        return NextResponse.json(
            { error: "Failed to batch delete items" },
            { status: 500 }
        );
    }
}
