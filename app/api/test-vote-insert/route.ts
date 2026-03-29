import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(request: NextRequest) {
    try {
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        let testUserId: any = null;

        const { data: profile, error } = await supabase
            .from("profiles")
            .select("pricing_plan, referred_by_id")
            .eq("id", testUserId)
            .single();

        return NextResponse.json({
            success: true,
            message: "Worked!",
            profile,
            error
        });

    } catch (e: any) {
        return NextResponse.json({ error: "Thrown exception: " + e.message });
    }
}
