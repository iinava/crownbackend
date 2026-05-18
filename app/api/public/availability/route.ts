import { sql } from "@/lib/db";

// No authentication — public endpoint
export const dynamic = "force-dynamic";

export async function GET() {
  // Single query: floors → rooms → beds with occupancy status
  // Deliberately excludes resident_id and all personal data
  const rows = await sql`
    SELECT
      fl.id              AS floor_id,
      fl.label           AS floor_label,
      r.id               AS room_id,
      r.label            AS room_label,
      r.capacity,
      b.id               AS bed_id,
      b.number           AS bed_number,
      CASE WHEN ba.id IS NOT NULL THEN 'occupied' ELSE 'free' END AS status
    FROM floors fl
    JOIN rooms r  ON r.floor_id = fl.id
    JOIN beds  b  ON b.room_id  = r.id
    LEFT JOIN bed_assignments ba
           ON ba.bed_id = b.id AND ba.vacated_at IS NULL
    ORDER BY fl.id, r.id, b.number
  `;

  // Shape: group into floors → rooms → beds
  const floorsMap = new Map<
    number,
    {
      id: number;
      label: string;
      rooms: Map<
        number,
        {
          id: number;
          label: string;
          capacity: number;
          beds: { number: string; status: "free" | "occupied" }[];
        }
      >;
    }
  >();

  for (const row of rows as {
    floor_id: number; floor_label: string;
    room_id: number;  room_label: string; capacity: number;
    bed_id: number;   bed_number: string; status: "free" | "occupied";
  }[]) {
    if (!floorsMap.has(row.floor_id)) {
      floorsMap.set(row.floor_id, {
        id: row.floor_id,
        label: row.floor_label,
        rooms: new Map(),
      });
    }
    const floor = floorsMap.get(row.floor_id)!;

    if (!floor.rooms.has(row.room_id)) {
      floor.rooms.set(row.room_id, {
        id: row.room_id,
        label: row.room_label,
        capacity: row.capacity,
        beds: [],
      });
    }
    floor.rooms.get(row.room_id)!.beds.push({
      number: row.bed_number,
      status: row.status,
    });
  }

  // Convert maps → arrays, compute roll-up counts
  const floors = Array.from(floorsMap.values()).map((floor) => {
    const rooms = Array.from(floor.rooms.values()).map((room) => {
      const occupied  = room.beds.filter((b) => b.status === "occupied").length;
      const free      = room.beds.filter((b) => b.status === "free").length;
      return {
        id:       room.id,
        label:    room.label,
        capacity: room.capacity,
        occupied,
        free,
        beds:     room.beds,
      };
    });

    const floorOccupied = rooms.reduce((a, r) => a + r.occupied, 0);
    const floorFree     = rooms.reduce((a, r) => a + r.free,     0);

    return {
      id:       floor.id,
      label:    floor.label,
      occupied: floorOccupied,
      free:     floorFree,
      rooms,
    };
  });

  const totalOccupied = floors.reduce((a, f) => a + f.occupied, 0);
  const totalFree     = floors.reduce((a, f) => a + f.free,     0);

  return Response.json(
    {
      summary: {
        total_beds: totalOccupied + totalFree,
        occupied:   totalOccupied,
        free:       totalFree,
      },
      floors,
    },
    {
      headers: {
        // Allow any origin to call this (public landing page on any domain)
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET",
        // Cache for 60 seconds — availability doesn't change by the second
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
      },
    }
  );
}
