import { verifyPayment } from "../../../paystack";
import { appOrigin } from "../../../../server/security";
import { sendContinuation } from "../../../../server/email";
export async function GET(req: Request) {
  const ref = new URL(req.url).searchParams.get("reference");
  try {
    if (!ref) throw Error("Missing reference");
    const token = await verifyPayment(ref);
    if (token) {
      try {
        await sendContinuation(ref, token);
      } catch {
        console.error("Continuation email pending; webhook will retry");
      }
    }
    return Response.redirect(
      new URL(
        token
          ? "/?continue=" + encodeURIComponent(token)
          : "/?payment=complete",
        appOrigin(),
      ),
      303,
    );
  } catch {
    return Response.redirect(new URL("/?payment=unverified", appOrigin()), 303);
  }
}
