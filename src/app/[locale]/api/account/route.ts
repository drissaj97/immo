import { NextResponse } from "next/server";
import { destroySession, getSession } from "@/lib/auth/session";
import { listFavoriteIds } from "@/server/repositories/favorites";
import { listSimulations } from "@/server/repositories/investment";
import { listSavedSearches } from "@/server/repositories/saved-searches";

export async function GET() {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [favorites, simulations, searches] = await Promise.all([
    listFavoriteIds(user.id),
    listSimulations(user.id),
    listSavedSearches(user.id),
  ]);

  return NextResponse.json({
    exportedAt: new Date().toISOString(),
    user: { id: user.id, email: user.email, role: user.role, fullName: user.fullName },
    favorites,
    simulations,
    savedSearches: searches,
    disclaimer: "Export démo — données fictives",
  });
}

export async function DELETE() {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Demo: log deletion request; production would purge DB rows
  console.info(`[CNDP] Deletion request for user ${user.id} (${user.email})`);
  await destroySession();

  return NextResponse.json({
    ok: true,
    message: "Demande de suppression enregistrée. Session fermée.",
    deletedAt: new Date().toISOString(),
  });
}
