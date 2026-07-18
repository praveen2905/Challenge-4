import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { crowdApi } from "@/lib/api";
import { motion } from "framer-motion";
import {
  Users,
  MapPin,
  Clock,
  CheckCircle2,
  AlertCircle,
  Star,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

const ZONE_TASKS = {
  "Z-North": ["Monitor entry flow", "Coordinate with security", "Report capacity updates"],
  "Z-South": ["Critical: Manage crowd surge", "Open emergency gates if needed", "Alert coordinator"],
  "Z-East": ["High density: Direct to West Wing", "Count entering fans", "Update HQ every 15min"],
  "Z-West": ["Standard monitoring", "Assist attendees with needs", "Guide to seats"],
  "Z-VIP": ["VIP guest assistance", "Maintain exclusive entry", "Coordinate with hosts"],
  "Z-MAIN": ["Floor safety monitoring", "Emergency exit clearance", "Photo pit management"],
  "Z-FOOD": ["Queue management", "Medical alert watch", "Cleanliness coordination"],
  "Z-ENTRY": ["Entry flow optimization", "Ticket scanning support", "Lost & found"],
};

function VolunteerZoneCard({ zone, index }) {
  const tasks = ZONE_TASKS[zone.zoneId] || ["Monitor assigned area", "Report issues to HQ", "Assist attendees"];
  const ls = {
    low: { text: "text-emerald-400", bar: "bg-emerald-500", badge: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
    medium: { text: "text-amber-400", bar: "bg-amber-500", badge: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
    high: { text: "text-orange-400", bar: "bg-orange-500", badge: "bg-orange-500/20 text-orange-400 border-orange-500/30" },
    critical: { text: "text-red-400", bar: "bg-red-500", badge: "bg-red-500/20 text-red-400 border-red-500/30" },
  }[zone.level] || { text: "text-muted-foreground", bar: "bg-muted", badge: "" };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      className={`p-5 rounded-2xl bg-card border transition-all ${
        zone.level === "critical"
          ? "border-red-500/40 shadow-red-500/5 shadow-lg"
          : zone.level === "high"
          ? "border-orange-500/30"
          : "border-card-border"
      }`}
    >
      <div className="flex items-start justify-between mb-3 gap-2">
        <div>
          <h3 className="font-semibold text-white">{zone.name}</h3>
          <div className="flex items-center gap-1.5 mt-1">
            <MapPin className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">{zone.zoneId}</span>
          </div>
        </div>
        <Badge className={`text-xs capitalize shrink-0 ${ls.badge}`}>
          {zone.level}
        </Badge>
      </div>

      {/* Occupancy */}
      <div className="mb-4">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-muted-foreground">Capacity</span>
          <span className={`font-semibold ${ls.text}`}>{zone.densityPercent}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
          <motion.div
            className={`h-full rounded-full ${ls.bar}`}
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(zone.densityPercent, 100)}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          {zone.count.toLocaleString()} / {zone.capacity.toLocaleString()} attendees
        </div>
      </div>

      {/* Tasks */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Your Tasks</p>
        <ul className="space-y-1.5">
          {tasks.map((task, i) => (
            <li key={i} className="flex items-start gap-2 text-sm">
              {zone.level === "critical" || zone.level === "high" ? (
                <AlertCircle className="h-3.5 w-3.5 text-orange-400 shrink-0 mt-0.5" />
              ) : (
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400/60 shrink-0 mt-0.5" />
              )}
              <span className="text-muted-foreground leading-snug">{task}</span>
            </li>
          ))}
        </ul>
      </div>
    </motion.div>
  );
}

export default function VolunteerPage() {
  const { data: zones = [], isLoading } = useQuery({
    queryKey: ["crowd-zones"],
    queryFn: crowdApi.zones,
    refetchInterval: 20000,
  });

  const { totalAttendees, criticalZones, highZones } = useMemo(() => {
    const total = zones.reduce((s, z) => s + z.count, 0);
    const critical = zones.filter((z) => z.level === "critical");
    const high = zones.filter((z) => z.level === "high");
    return { totalAttendees: total, criticalZones: critical, highZones: high };
  }, [zones]);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            Volunteer Portal
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Zone assignments, tasks, and real-time crowd status
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          On Duty
        </div>
      </div>

      {/* Briefing */}
      {(criticalZones.length > 0 || highZones.length > 0) && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-5 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-300"
        >
          <div className="flex items-center gap-2 font-semibold mb-2">
            <AlertCircle className="h-5 w-5" />
            Urgent Briefing
          </div>
          <p className="text-sm">
            {criticalZones.length > 0 && (
              <span className="font-medium text-red-400">
                CRITICAL: {criticalZones.map((z) => z.name).join(", ")} at/near maximum capacity.{" "}
              </span>
            )}
            {highZones.length > 0 && (
              <span>
                HIGH: {highZones.map((z) => z.name).join(", ")} require close monitoring.{" "}
              </span>
            )}
            Please coordinate with your supervisor immediately.
          </p>
        </motion.div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Zones", value: zones.length, icon: MapPin, color: "primary" },
          { label: "Total Attendees", value: totalAttendees.toLocaleString(), icon: Users, color: "accent" },
          { label: "Critical Zones", value: criticalZones.length, icon: AlertCircle, color: "destructive" },
          { label: "Your Shift", value: "08:00 – 20:00", icon: Clock, color: "chart-3" },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="p-4 rounded-xl bg-card border border-card-border flex items-center gap-3"
          >
            <div className={`h-8 w-8 rounded-lg bg-${stat.color}/10 flex items-center justify-center shrink-0`}>
              <stat.icon className={`h-4 w-4 text-${stat.color}`} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
              <p className="text-lg font-bold text-white">{isLoading ? "…" : stat.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Shift Tips */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="p-4 rounded-2xl bg-primary/5 border border-primary/20 flex items-start gap-3"
      >
        <Star className="h-5 w-5 text-primary shrink-0 mt-0.5" />
        <div className="text-sm">
          <span className="font-semibold text-primary">Shift Tips: </span>
          <span className="text-muted-foreground">
            Keep radio charged · Log every zone count update · Escalate medical emergencies immediately ·
            Use the AI Chat assistant for multilingual support · Break rotations every 2 hours
          </span>
        </div>
      </motion.div>

      {/* Zone Grid */}
      <div>
        <h2 className="font-semibold text-white mb-4">Zone Overview & Tasks</h2>
        {isLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-64 rounded-2xl bg-card border border-card-border animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {zones.map((zone, i) => (
              <VolunteerZoneCard key={zone.zoneId} zone={zone} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
