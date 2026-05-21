import { recalculateFines } from "@/lib/dal/payments";
import {
  getOverdueResidents,
  wasNotifiedToday,
  logNotification,
} from "@/lib/dal/notifications";
import { sendReminder, normalizePhone } from "@/lib/sms";
import { isAuthenticated } from "@/lib/auth";
import { NextRequest } from "next/server";

/**
 * Daily cron endpoint — runs every day at 9:00 AM IST.
 *
 * What it does:
 * 1. Recalculates fines for ALL overdue unpaid payments
 * 2. Calls overdue residents via Vobiz voice TTS (1 call per day max)
 *
 * Auth: Vercel Cron (Bearer CRON_SECRET) OR admin session (for Run Now button)
 */
export async function GET(request: NextRequest) {
  // Auth: accept cron secret OR admin session
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  const hasCronAuth = cronSecret && authHeader === `Bearer ${cronSecret}`;
  const hasSessionAuth = await isAuthenticated();

  if (!hasCronAuth && !hasSessionAuth) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Step 1: Recalculate fines
    const finesUpdated = await recalculateFines();

    // Step 2: Get overdue residents with phone numbers
    const overdueResidents = await getOverdueResidents();

    let sent = 0;
    let failed = 0;
    let skipped = 0;

    for (const resident of overdueResidents) {
      // Dedup: 1 call per resident per day
      const alreadyNotified = await wasNotifiedToday(resident.resident_id, "voice");
      if (alreadyNotified) {
        skipped++;
        continue;
      }

      const phone = normalizePhone(resident.phone!);

      const result = await sendReminder(phone, {
        residentName: resident.resident_name,
        amount: resident.amount,
        month: resident.month,
        daysOverdue: resident.days_overdue,
        fineAmount: resident.fine_amount,
        totalDue: resident.total_due,
      });

      await logNotification({
        residentId: resident.resident_id,
        paymentId: resident.payment_id,
        channel: "voice",
        phone,
        status: result.success ? "sent" : "failed",
        messageId: result.messageId,
        error: result.error,
      });

      if (result.success) sent++;
      else failed++;
    }

    return Response.json({
      success: true,
      finesUpdated,
      overdueCount: overdueResidents.length,
      remindersSent: sent,
      remindersFailed: failed,
      skippedAlreadyNotified: skipped,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[CRON] Daily reminders failed:", err);
    return Response.json(
      { error: "Internal error", details: String(err) },
      { status: 500 }
    );
  }
}
