import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET(req: NextRequest) {
  const session = await auth();
  
  // @ts-ignore
  if (!session || session.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [totalUsers, premiumUsers, activeSubs, totalAnime] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: "PREMIUM" } }),
      prisma.subscription.count({ where: { status: "ACTIVE" } }),
      prisma.anime.count(),
    ]);

    // Mock some activity stats for the UI
    const activeRooms = Math.floor(Math.random() * 50) + 10;
    const dailyStreams = Math.floor(Math.random() * 5000) + 2000;

    return NextResponse.json({
      totalUsers,
      premiumUsers,
      activeSubs,
      activeRooms,
      dailyStreams,
      totalAnime,
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
