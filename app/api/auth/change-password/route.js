import { NextResponse } from "next/server";
import { validateSession, verifyPassword, hashPassword, isStrongPassword } from "@/lib/auth";
import getDb from "@/lib/db";
import { cookies } from "next/headers";

export async function POST(request) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("auth_token")?.value;
        const userId = validateSession(token);

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { oldPassword, newPassword, confirmNewPassword } = body;

        if (!oldPassword || !newPassword || !confirmNewPassword) {
            return NextResponse.json({ error: "All password fields are required" }, { status: 400 });
        }

        if (newPassword !== confirmNewPassword) {
            return NextResponse.json({ error: "New passwords do not match" }, { status: 400 });
        }

        const db = getDb();
        const user = db.prepare("SELECT password_hash, salt FROM users WHERE id = ?").get(userId);

        if (!user || !verifyPassword(oldPassword, user.password_hash, user.salt)) {
            return NextResponse.json({ error: "Incorrect old password" }, { status: 401 });
        }

        if (!isStrongPassword(newPassword)) {
            return NextResponse.json({ error: "New password does not meet complexity requirements" }, { status: 400 });
        }

        const { hash, salt } = hashPassword(newPassword);
        db.prepare("UPDATE users SET password_hash = ?, salt = ? WHERE id = ?").run(hash, salt, userId);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("POST /api/auth/change-password error:", error);
        // Do not leak specific internal errors to the client to avoid probing
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
