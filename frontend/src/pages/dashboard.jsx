import { useQuery } from "@tanstack/react-query";
import { dashboardApi, crowdApi } from "@/lib/api";
import { motion } from "framer-motion";
import {
  Users,
  AlertTriangle,
  Activity,
  TrendingUp,
  ShieldCheck,
  Zap,
  Clock,
  BarChart3,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

const SEVERITY_COLOR = {
  critical: "bg-red-500/20 text-red-400 border-red-500/30",
  warning: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  info: "bg-blue-500/20 text-blue-400 border-blue-500/30",
};

const LEVEL_COLOR = {
  low: "text-emerald-400",
  medium: "text-amber-400",
  high: "text-orange-400",
  critical: "text-red-400",
};

const LEVEL_BAR = {
  low: "bg-emerald-500",
  medium: "bg-amber-500",
  high: "bg-orange-500",
  critical: "bg-red-500",
};

const TYPE_ICON = {
  zone_updated: "🗺️",
  alert_created: "🚨",
  alert_resolved: "✅",
  user_joined: "👤",
  navigation_request: "🧭",
  chat_session: "💬",
};

function StatCard({ icon: Icon, label, value, sub, color = "primary", delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="p-6 rounded-2xl bg-card border border-card-border flex items-start gap-4 hover:border-primary/30 transition-colors"
    >
      <div className={`h-10 w-10 rounded-xl bg-${color}/10 flex items-center justify-center shrink-0`}>
        <Icon className={`h-5 w-5 text-${color}`} />
      </div>
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-3xl font-bold text-white">{value ?? "—"}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </div>
    </motion.div>
  );
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-card-border rounded-xl p-3 shadow-xl text-xs">
      <p className="text-muted-foreground mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }} className="font-medium">
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: dashboardApi.stats,
    refetchInterval: 15000,
  });

  const { data: activity = [], isLoading: activityLoading } = useQuery({
    queryKey: ["dashboard-activity"],
    queryFn: dashboardApi.activity,
    refetchInterval: 15000,
  });

  const { data: trend = [], isLoading: trendLoading } = useQuery({
    queryKey: ["dashboard-trend"],
    queryFn: dashboardApi.crowdTrend,
    refetchInterval: 30000,
  });

  const { data: zones = [] } = useQuery({
    queryKey: ["crowd-zones"],
    queryFn: crowdApi.zones,
    refetchInterval: 15000,
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Operations Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time event intelligence — auto-refreshes every 15s
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          Live
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Users}
          label="Total Attendees"
          value={statsLoading ? "…" : (stats?.totalAttendees ?? 0).toLocaleString()}
          sub={`Avg density ${stats?.avgDensity ?? 0}%`}
          color="primary"
          delay={0}
        />
        <StatCard
          icon={AlertTriangle}
          label="Active Alerts"
          value={statsLoading ? "…" : stats?.activeAlerts ?? 0}
          sub={`${stats?.resolvedAlerts ?? 0} resolved today`}
          color="destructive"
          delay={0.05}
        />
        <StatCard
          icon={Zap}
          label="Zones at Capacity"
          value={statsLoading ? "…" : `${stats?.zonesAtCapacity ?? 0}/${stats?.totalZones ?? 0}`}
          sub="High or critical zones"
          color="accent"
          delay={0.1}
        />
        <StatCard
          icon={Activity}
          label="Active Volunteers"
          value={statsLoading ? "…" : stats?.activeVolunteers ?? 0}
          sub={`${stats?.chatSessions ?? 0} chat sessions`}
          color="chart-3"
          delay={0.15}
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Crowd Trend Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2 p-6 rounded-2xl bg-card border border-card-border"
        >
          <div className="flex items-center gap-2 mb-6">
            <BarChart3 className="h-5 w-5 text-primary" />
            <h2 className="font-semibold text-white">Crowd Trend (8h)</h2>
          </div>
          {trendLoading ? (
            <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
              Loading chart…
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={trend} margin={{ top: 5, right: 5, bottom: 0, left: -10 }}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(173 80% 40%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(173 80% 40%)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorDensity" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(199 89% 48%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(199 89% 48%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 47% 20%)" />
                <XAxis dataKey="time" tick={{ fill: "hsl(213 20% 60%)", fontSize: 11 }} tickLine={false} />
                <YAxis tick={{ fill: "hsl(213 20% 60%)", fontSize: 11 }} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="totalCount"
                  name="Attendees"
                  stroke="hsl(173 80% 40%)"
                  fill="url(#colorCount)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="avgDensity"
                  name="Avg Density %"
                  stroke="hsl(199 89% 48%)"
                  fill="url(#colorDensity)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </motion.div>

        {/* Activity Log */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="p-6 rounded-2xl bg-card border border-card-border overflow-hidden flex flex-col"
        >
          <div className="flex items-center gap-2 mb-4">
            <Clock className="h-5 w-5 text-accent" />
            <h2 className="font-semibold text-white">Recent Activity</h2>
          </div>
          <div className="flex-1 overflow-y-auto space-y-3 pr-1 max-h-64">
            {activityLoading ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : activity.length === 0 ? (
              <p className="text-sm text-muted-foreground">No recent activity</p>
            ) : (
              activity.map((a, i) => (
                <motion.div
                  key={a._id || i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="flex items-start gap-2"
                >
                  <span className="text-base shrink-0">
                    {TYPE_ICON[a.type] || "📋"}
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs text-white leading-snug truncate">{a.message}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {new Date(a.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                  {a.severity && (
                    <Badge
                      className={`text-[10px] shrink-0 ${SEVERITY_COLOR[a.severity] || ""}`}
                    >
                      {a.severity}
                    </Badge>
                  )}
                </motion.div>
              ))
            )}
          </div>
        </motion.div>
      </div>

      {/* Zone Status */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="p-6 rounded-2xl bg-card border border-card-border"
      >
        <div className="flex items-center gap-2 mb-6">
          <ShieldCheck className="h-5 w-5 text-primary" />
          <h2 className="font-semibold text-white">Zone Status Overview</h2>
          <span className="ml-auto text-xs text-muted-foreground">{zones.length} zones monitored</span>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {zones.map((zone, i) => (
            <motion.div
              key={zone.zoneId}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.05 }}
              className="p-4 rounded-xl bg-background border border-border hover:border-card-border transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-white truncate">{zone.name}</span>
                <span className={`text-xs font-semibold capitalize ${LEVEL_COLOR[zone.level] || "text-muted-foreground"}`}>
                  {zone.level}
                </span>
              </div>
              <Progress
                value={zone.densityPercent}
                className="h-1.5 mb-2 bg-muted"
              />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{zone.count.toLocaleString()} / {zone.capacity.toLocaleString()}</span>
                <span className={`font-semibold ${LEVEL_COLOR[zone.level]}`}>{zone.densityPercent}%</span>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
