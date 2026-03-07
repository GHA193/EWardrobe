import { NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import { existsSync, mkdirSync } from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";

// Upload directory relative to project root
const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

/**
 * POST /api/upload
 * Handle image file upload via multipart form data.
 * Returns the public URL path of the uploaded image.
 */
export async function POST(request) {
    try {
        const formData = await request.formData();
        const file = formData.get("file");

        if (!file || typeof file === "string") {
            return NextResponse.json(
                { error: "No file provided" },
                { status: 400 }
            );
        }

        // Validate file type (Client-sided MIME might be spoofed, but we check anyway)
        const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json(
                { error: "Invalid file type. Allowed: JPEG, PNG, WebP, GIF" },
                { status: 400 }
            );
        }

        // Validate file size (max 10MB)
        const MAX_SIZE = 10 * 1024 * 1024;
        if (file.size > MAX_SIZE) {
            return NextResponse.json(
                { error: "File too large. Maximum size is 10MB" },
                { status: 400 }
            );
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Security: Magic Number (File Signature) Validation
        // This prevents malicious files masked with an image extension from being saved.
        let ext = null;

        // JPEG: FF D8 FF
        if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
            ext = 'jpg';
        }
        // PNG: 89 50 4E 47 0D 0A 1A 0A
        else if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
            ext = 'png';
        }
        // GIF: GIF87a or GIF89a (47 49 46 38)
        else if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x38) {
            ext = 'gif';
        }
        // WebP: RIFF .... WEBP
        else if (
            buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
            buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50
        ) {
            ext = 'webp';
        }

        if (!ext) {
            return NextResponse.json(
                { error: "Malformed or unrecognized image format (Magic byte mismatch). Security policy check failed." },
                { status: 400 }
            );
        }

        // Ensure the upload directory exists
        if (!existsSync(UPLOAD_DIR)) {
            mkdirSync(UPLOAD_DIR, { recursive: true });
        }

        // Generate a completely clean unique filename with verified extension. Ignore original file.name entirely.
        const filename = `${uuidv4()}.${ext}`;
        const filepath = path.join(UPLOAD_DIR, filename);

        // Write file securely to disk
        await writeFile(filepath, buffer);

        // Return the public URL path
        const imageUrl = `/uploads/${filename}`;
        return NextResponse.json({ url: imageUrl }, { status: 201 });
    } catch (error) {
        console.error("POST /api/upload error:", error);
        return NextResponse.json(
            { error: "Failed to upload file" },
            { status: 500 }
        );
    }
}
