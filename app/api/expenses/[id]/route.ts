import { updateExpense, deleteExpense } from "@/lib/dal/expenses";
import { NextRequest } from "next/server";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  const expense = await updateExpense(Number(id), {
    title:    body.title,
    amount:   body.amount !== undefined ? Number(body.amount) : undefined,
    category: body.category,
    date:     body.date,
    notes:    body.notes,
  });

  if (!expense) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
  return Response.json(expense);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const deleted = await deleteExpense(Number(id));
  if (!deleted) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
  return new Response(null, { status: 204 });
}
