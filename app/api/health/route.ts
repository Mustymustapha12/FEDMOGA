import { database } from "../../../server/database";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    await database().prepare("SELECT 1 AS ok").first();
    return Response.json({ status: "ok", database: "connected" });
  } catch {
    return Response.json({ status: "unavailable" }, { status: 503 });
  }
}
