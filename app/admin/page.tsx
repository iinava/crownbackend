"use client";

import { useEffect, useState } from "react";
import { useHostel } from "@/lib/hostel-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { BedDouble, Users, DoorOpen, TrendingDown, AlertCircle, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { DashboardSkeleton } from "@/components/skeletons";

interface Room {
  id: number;
  number: string;
  capacity: number;
  occupied_count: number;
  floor_label: string;
  room_type: string;
  hostel_name?: string;
}

interface Unpaid {
  resident_name: string;
}

export default function AdminDashboard() {
  const { hostelParam, label, isLoading: hostelLoading } = useHostel();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [unpaid, setUnpaid] = useState<Unpaid[]>([]);
  const [totalResidents, setTotalResidents] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (hostelLoading) return;
    setLoading(true);
    const hq = hostelParam ? `&hostel=${hostelParam}` : "";

    Promise.all([
      fetch(`/api/rooms?_=1${hq}`).then((r) => r.json()),
      fetch(`/api/payments?paid=false&month=${new Date().toISOString().slice(0, 7) + "-01"}${hq}`).then((r) => r.json()),
      fetch(`/api/residents?active_only=true&limit=1${hq}`).then((r) => r.json()),
    ]).then(([roomData, payData, resData]) => {
      setRooms(roomData);
      setUnpaid(payData.data ?? []);
      setTotalResidents(resData.total ?? 0);
      setLoading(false);
    });
  }, [hostelParam, hostelLoading]);

  const totalBeds = rooms.reduce((a, r) => a + r.capacity, 0);
  const occupiedBeds = rooms.reduce((a, r) => a + r.occupied_count, 0);
  const vacantBeds = totalBeds - occupiedBeds;
  const monthLabel = new Date().toLocaleString("en-IN", { month: "long", year: "numeric" });
  const occupancyPct = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

  const stats = [
    { label: "Total Beds", value: totalBeds, sub: `${rooms.length} rooms`, icon: BedDouble },
    { label: "Occupied", value: occupiedBeds, sub: `${occupancyPct}% occupancy`, icon: Users },
    { label: "Vacant", value: vacantBeds, sub: `${vacantBeds} beds free`, icon: DoorOpen },
    { label: "Unpaid", value: unpaid.length, sub: monthLabel, icon: TrendingDown },
  ];

  const roomTypeBadge = (type: string) => {
    if (type === "dormitory") return <Badge variant="outline" className="text-[9px] px-1 py-0 bg-warning/10 text-warning border-warning/30">Dorm</Badge>;
    if (type === "ac") return <Badge variant="outline" className="text-[9px] px-1 py-0 bg-primary/10 text-primary border-primary/30">AC</Badge>;
    return null;
  };

  if (loading || hostelLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {label} — {monthLabel}
        </p>
      </div>

      {/* Banner */}
      {unpaid.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 rounded-xl border border-destructive/40 bg-destructive/15 px-4 py-3 sm:px-5 sm:py-4 text-sm shadow-sm">
          <div className="flex items-center gap-2.5 text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span className="font-semibold">{unpaid.length} unpaid this month</span>
          </div>
          <span className="text-foreground/80 truncate min-w-0 flex-1 text-xs sm:text-sm">
            — {unpaid.slice(0, 3).map((p) => p.resident_name).join(", ")}
            {unpaid.length > 3 && ` and ${unpaid.length - 3} more`}
          </span>
          <Link 
            href="/admin/payments" 
            className="sm:ml-auto shrink-0 text-xs font-medium text-destructive hover:text-destructive/80 underline-offset-4 hover:underline self-start sm:self-auto"
          >
            View all →
          </Link>
        </div>
      )}

      {unpaid.length === 0 && totalResidents > 0 && (
        <div className="flex items-center gap-2.5 rounded-md border px-3.5 py-2.5 text-sm">
          <CheckCircle2 className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="font-medium">All payments collected</span>
          <span className="text-muted-foreground">for {monthLabel}</span>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-1.5">
                <s.icon className="h-3.5 w-3.5" />
                {s.label}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold tabular-nums">{s.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{s.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Occupancy */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">Overall Occupancy</CardTitle>
            <span className="text-sm tabular-nums text-muted-foreground">{occupancyPct}%</span>
          </div>
        </CardHeader>
        <CardContent className="space-y-1.5">
          <Progress value={occupancyPct} className="h-2" />
          <p className="text-xs text-muted-foreground">
            {occupiedBeds} of {totalBeds} beds occupied across {rooms.length} rooms
          </p>
        </CardContent>
      </Card>

      {/* Rooms at a glance */}
      <div className="space-y-1">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold">Rooms at a glance</h2>
          <Link href="/admin/rooms" className="text-xs text-muted-foreground hover:text-foreground underline-offset-4 hover:underline">
            Manage rooms →
          </Link>
        </div>
        {(() => {
          const byGroup = rooms.reduce<Record<string, Room[]>>((acc, room) => {
            const key = hostelParam
              ? (room.floor_label ?? "Other")
              : `${room.hostel_name ?? ""} · ${room.floor_label ?? "Other"}`;
            if (!acc[key]) acc[key] = [];
            acc[key].push(room);
            return acc;
          }, {});

          const floorNumber = (label: string) => {
            const m = label.match(/(\d+)/);
            return m ? parseInt(m[1], 10) : 999;
          };
          const sortedGroups = Object.entries(byGroup).sort(([a], [b]) => {
            const [aHostel = "", aFloor = a] = a.split(" · ");
            const [bHostel = "", bFloor = b] = b.split(" · ");
            const hostelCmp = aHostel.localeCompare(bHostel);
            if (hostelCmp !== 0) return hostelCmp;
            return floorNumber(aFloor) - floorNumber(bFloor);
          });

          return (
            <div className="space-y-5">
              {sortedGroups.map(([groupLabel, groupRooms]) => {
                const grpOcc = groupRooms.reduce((a, r) => a + r.occupied_count, 0);
                const grpCap = groupRooms.reduce((a, r) => a + r.capacity, 0);
                return (
                  <div key={groupLabel}>
                    {/* Group header */}
                    <div className="flex items-center gap-3 mb-2.5">
                      <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest whitespace-nowrap">
                        {groupLabel}
                      </span>
                      <div className="flex-1 h-px bg-border" />
                      <span className="text-[11px] text-muted-foreground tabular-nums">
                        {grpOcc}/{grpCap}
                      </span>
                    </div>

                    {/* Room cards grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                      {groupRooms.map((room) => {
                        const pct = room.capacity > 0 ? Math.round((room.occupied_count / room.capacity) * 100) : 0;
                        const isFull = room.occupied_count >= room.capacity;
                        const hasOccupants = room.occupied_count > 0;
                        const dotColor = isFull
                          ? "bg-destructive"
                          : hasOccupants ? "bg-success" : "bg-muted-foreground/25";
                        const barColor = isFull
                          ? "bg-destructive"
                          : hasOccupants ? "bg-success" : "bg-muted-foreground/20";
                        return (
                          <Link key={room.id} href={`/admin/rooms/${room.id}`}>
                            <Card className="cursor-pointer hover:bg-accent hover:shadow-sm transition-all duration-150 border-border/60">
                              <CardContent className="p-3">
                                {/* Top row: icon + name + badge */}
                                <div className="flex items-start justify-between gap-1 mb-2">
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    <BedDouble className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                    <span className="text-sm font-semibold truncate">{room.number}</span>
                                  </div>
                                  <div className="flex items-center gap-1 shrink-0">
                                    {roomTypeBadge(room.room_type)}
                                    <span className={`h-1.5 w-1.5 rounded-full ${dotColor} shrink-0`} />
                                  </div>
                                </div>
                                {/* Progress bar */}
                                <div className="w-full bg-muted rounded-full h-1 overflow-hidden mb-1.5">
                                  <div
                                    className={`h-full rounded-full transition-all duration-300 ${barColor}`}
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                                {/* Bottom: ratio */}
                                <p className="text-[10px] text-muted-foreground tabular-nums">
                                  {room.occupied_count}/{room.capacity} beds
                                </p>
                              </CardContent>
                            </Card>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })()}
      </div>
    </div>
  );
}
