import "server-only";
import { createHash } from "crypto";
import { click } from "./payments";

export type ClickParams = Record<string, string>;

export async function readClickForm(req: Request): Promise<ClickParams> {
  const form = await req.formData();
  return Object.fromEntries([...form.entries()].map(([k, v]) => [k, String(v)]));
}

/** sign_string = md5(click_trans_id + service_id + SECRET_KEY + merchant_trans_id [+ merchant_prepare_id] + amount + action + sign_time) */
export function clickSignValid(p: ClickParams, withPrepareId: boolean) {
  const raw = p.click_trans_id + p.service_id + click.secret() + p.merchant_trans_id
    + (withPrepareId ? p.merchant_prepare_id : "") + p.amount + p.action + p.sign_time;
  return !!click.secret() && createHash("md5").update(raw).digest("hex") === p.sign_string;
}

export const CLICK_ERR = {
  sign: [-1, "SIGN CHECK FAILED!"], amount: [-2, "Incorrect parameter amount"], action: [-3, "Action not found"],
  paid: [-4, "Already paid"], order: [-5, "Order does not exist"], tx: [-6, "Transaction does not exist"],
  request: [-8, "Error in request from click"], cancelled: [-9, "Transaction cancelled"],
} as const;

export function clickReply(p: ClickParams, e: readonly [number, string] | null, extra: Record<string, unknown> = {}) {
  return Response.json({
    click_trans_id: p.click_trans_id, merchant_trans_id: p.merchant_trans_id,
    error: e ? e[0] : 0, error_note: e ? e[1] : "Success", ...extra,
  });
}
