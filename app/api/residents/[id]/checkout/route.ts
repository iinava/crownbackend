import { checkoutResident } from "@/lib/dal/residents";
import { NextRequest } from "next/server";

/**
 * POST /api/residents/[id]/checkout
 * Body: { move_out_date: "YYYY-MM-DD" }  (optional — defaults to today)
 *
 * Marks the resident inactive, records their move_out_date,
 * and vacates their bed assignment in one atomic operation.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json().catch(() => ({}));

  // Default to today if not supplied
  const moveOutDate: string =
    body.move_out_date ?? new Date().toISOString().slice(0, 10);

  const resident = await checkoutResident(Number(id), moveOutDate);
  if (!resident) {
    return Response.json({ error: "Resident not found" }, { status: 404 });
  }

  return Response.json(resident);
}
