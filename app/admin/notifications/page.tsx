"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Bell,
  CheckCircle,
  XCircle,
  Loader2,
  RefreshCw,
  Send,
  MessageSquare,
} from "lucide-react";
import { toast } from "sonner";
import { DatePicker } from "@/components/DatePicker";
import { TableRowSkeleton } from "@/components/skeletons";

interface NotificationEntry {
  id: number;
  resident_name: string;
  phone: string;
  channel: string;
  status: string;
  error: string | null;
  sent_date: string;
  sent_at: string;
}

interface TodayStats {
  sent: number;
  failed: number;
  total: number;
}

export default function NotificationsPage() {
  const [entries, setEntries] = useState<NotificationEntry[]>([]);
  const [todayStats, setTodayStats] = useState<TodayStats>({ sent: 0, failed: 0, total: 0 });
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (dateFrom) params.set("dateFrom", dateFrom);
      if (dateTo) params.set("dateTo", dateTo);
      const res = await fetch(`/api/notifications?${params}`);
      const data = await res.json();
      setEntries(data.data ?? []);
      setTotal(data.total ?? 0);
      setTodayStats(data.todayStats ?? { sent: 0, failed: 0, total: 0 });
    } catch {
      toast.error("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function runNow() {
    setRunning(true);
    try {
      const res = await fetch("/api/cron/daily-reminders");
      const data = await res.json();
      if (res.ok) {
        toast.success(
          `Done! Fines updated: ${data.finesUpdated}, SMS sent: ${data.remindersSent ?? 0}, Failed: ${data.remindersFailed ?? 0}`
        );
        fetchData();
      } else {
        toast.error(data.error ?? "Failed to run reminders");
      }
    } catch {
      toast.error("Failed to run daily job");
    } finally {
      setRunning(false);
    }
  }

  function maskPhone(phone: string): string {
    if (phone.length <= 6) return phone;
    return phone.slice(0, 3) + "****" + phone.slice(-3);
  }

  function formatTime(iso: string): string {
    return new Date(iso).toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Automated rent reminders &amp; notification history
          </p>
        </div>
        <Button onClick={runNow} disabled={running} className="gap-2">
          {running ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          Run Now
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-border/60 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Bell className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{todayStats.total}</p>
              <p className="text-xs text-muted-foreground">Sent Today</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center shrink-0">
              <CheckCircle className="h-4 w-4 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold">{todayStats.sent}</p>
              <p className="text-xs text-muted-foreground">Delivered</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center shrink-0">
              <XCircle className="h-4 w-4 text-destructive" />
            </div>
            <div>
              <p className="text-2xl font-bold">{todayStats.failed}</p>
              <p className="text-xs text-muted-foreground">Failed</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* History */}
      <Card className="border-border/60 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Notification Log</CardTitle>
              <CardDescription>{total} total notifications</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={fetchData} className="gap-1.5">
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh
            </Button>
          </div>

          {/* Date filters */}
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <DatePicker
              value={dateFrom}
              onChange={setDateFrom}
              placeholder="From date"
              className="h-8 w-40 text-xs"
            />
            <span className="text-muted-foreground text-xs">to</span>
            <DatePicker
              value={dateTo}
              onChange={setDateTo}
              placeholder="To date"
              className="h-8 w-40 text-xs"
            />
            {(dateFrom || dateTo) && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs"
                onClick={() => { setDateFrom(""); setDateTo(""); }}
              >
                Clear
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-4 px-4">
              <table className="w-full">
                <tbody><TableRowSkeleton cols={6} rows={6} /></tbody>
              </table>
            </div>
          ) : entries.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No notifications sent yet</p>
              <p className="text-xs mt-1">Click &quot;Run Now&quot; to send reminders to overdue residents</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Resident</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Channel</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Sent At</TableHead>
                  <TableHead>Error</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="font-medium">{entry.resident_name}</TableCell>
                    <TableCell className="text-muted-foreground text-xs font-mono">
                      {maskPhone(entry.phone)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs capitalize">
                        {entry.channel}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {entry.status === "sent" ? (
                        <Badge className="bg-success/15 text-success border-success/30 text-xs">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Sent
                        </Badge>
                      ) : (
                        <Badge variant="destructive" className="text-xs">
                          <XCircle className="h-3 w-3 mr-1" />
                          Failed
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatTime(entry.sent_at)}
                    </TableCell>
                    <TableCell className="text-xs text-destructive max-w-[200px] truncate">
                      {entry.error ?? "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
