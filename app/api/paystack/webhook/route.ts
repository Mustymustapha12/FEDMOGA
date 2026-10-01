import { createHmac, timingSafeEqual } from "node:crypto";
import { database, paystackKey } from "../../../lib";
import { verifyPayment } from "../../../paystack";
import { sendContinuation } from "../../../../server/email";
export async function POST(req: Request) {
  if (Number(req.headers.get("content-length") || 0) > 100000)
    return new Response("Too large", { status: 413 });
  const raw = await req.text();
  if (raw.length > 100000) return new Response("Too large", { status: 413 });
  let event;
  try {
    event = JSON.parse(raw);
  } catch {
    return new Response("Bad event", { status: 400 });
  }
  const ref = event?.data?.reference;
  if (typeof ref !== "string") return new Response("Ignored");
  try {
    const p = await database()
      .prepare("SELECT mode FROM payments WHERE reference=?")
      .bind(ref)
      .first<{ mode: "test" | "live" }>();
    if (!p) return new Response("Ignored");
    const signature = req.headers.get("x-paystack-signature") || "";
    if (!/^[a-f0-9]{128}$/i.test(signature))
      return new Response("Invalid signature", { status: 401 });
    const expected = createHmac("sha512", await paystackKey(p.mode))
      .update(raw)
      .digest();
    if (!timingSafeEqual(expected, Buffer.from(signature, "hex")))
      return new Response("Invalid signature", { status: 401 });
    if (event.event === "charge.success") {
      const token = await verifyPayment(ref);
      if (token) await sendContinuation(ref, token);
    }
    return new Response("OK");
  } catch {
    return new Response("Verification failed; retry", { status: 500 });
  }
}
