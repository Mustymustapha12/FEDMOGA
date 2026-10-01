import { database, errorResponse } from "../../../lib";
import {
  readJson,
  rateLimit,
  validEmail,
  HttpError,
} from "../../../../server/security";
import { sendContinuation } from "../../../../server/email";
import { verifyPayment } from "../../../paystack";
export async function POST(req: Request) {
  try {
    const { email, reference } = await readJson(req);
    if (
      !validEmail(email) ||
      typeof reference !== "string" ||
      !/^FEDMOGA-[A-Za-z0-9-]{12,80}$/.test(reference)
    )
      throw new HttpError("Enter your payment email and reference");
    const normalized = (email as string).trim().toLowerCase();
    await rateLimit("recover:" + normalized, 3, 3600_000);
    const p = await database()
      .prepare(
        "SELECT id FROM payments WHERE email=? AND reference=? AND completed=0",
      )
      .bind(normalized, reference)
      .first();
    if (p) {
      try {
        const token = await verifyPayment(reference);
        if (token) await sendContinuation(reference, token, true);
      } catch {
        console.error("Payment recovery was not completed");
      }
    }
    return Response.json({
      ok: true,
      message:
        "If an eligible payment matches and email delivery is configured, a registration link will be emailed.",
    });
  } catch (e) {
    return errorResponse(e);
  }
}
