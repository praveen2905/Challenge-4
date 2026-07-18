import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { crowdApi, venuesApi } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  CheckCircle2,
  BrainCircuit,
  RefreshCw,
  Shield,
  Flame,
  TrendingUp,
  Zap,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";

const SEVERITY_STYLES = {
  critical: {
    badge: "bg-red-500/20 text-red-400 border-red-500/30",
    border: "border-red-500/30",
    dot: "bg-red-400",
  },
  warning: {
    badge: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    border: "border-amber-500/30",
    dot: "bg-amber-400",
  },
  info: {
    badge: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    border: "border-blue-500/30",
    dot: "bg-blue-400",
  },
};

const LEVEL_STYLES = {
  low: { text: "text-emerald-400", bg: "bg-emerald-500", label: "Low" },
  medium: { text: "text-amber-400", bg: "bg-amber-500", label: "Medium" },
  high: { text: "text-orange-400", bg: "bg-orange-500", label: "High" },
  critical: { text: "text-red-400", bg: "bg-red-500", label: "Critical" },
};

function ZoneCard({ zone, onUpdate }) {
  const [newCount, setNewCount] = useState(zone.count);
  const [editing, setEditing] = useState(false);
  const { toast } = useToast();
  const qc = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: (data) => crowdApi.updateZone(zone.zoneId, data),
    onSuccess: () => {
      qc.invalidateQueries(["crowd-zones"]);
      qc.invalidateQueries(["crowd-alerts"]);
      toast({ title: `${zone.name} updated` });
      setEditing(false);
    },
    onError: () => toast({ title: "Update failed", variant: "destructive" }),
  });

  const ls = LEVEL_STYLES[zone.level] || LEVEL_STYLES.low;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`p-5 rounded-2xl bg-card border transition-all ${
        zone.level === "critical"
          ? "border-red-500/40 shadow-red-500/10 shadow-lg"
          : zone.level === "high"
          ? "border-orange-500/30"
          : "border-card-border"
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-white">{zone.name}</h3>
          <p className="text-xs text-muted-foreground capitalize">{zone.zoneId}</p>
        </div>
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${ls.text} bg-opacity-10`}>
          {ls.label}
        </span>
      </div>

      <div className="mb-3">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-muted-foreground">Occupancy</span>
          <span className={`font-semibold ${ls.text}`}>{zone.densityPercent}%</span>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <motion.div
            className={`h-full rounded-full ${ls.bg}`}
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(zone.densityPercent, 100)}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between text-sm mb-4">
        <span className="text-muted-foreground">
          <span className="text-white font-medium">{zone.count.toLocaleString()}</span> / {zone.capacity.toLocaleString()}
        </span>
        <Users className="h-4 w-4 text-muted-foreground" />
      </div>

      {editing ? (
        <div className="flex gap-2">
          <input
            type="number"
            min={0}
            max={zone.capacity}
            value={newCount}
            onChange={(e) => setNewCount(Number(e.target.value))}
            className="flex-1 bg-background border border-border rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <Button
            size="sm"
            onClick={() => updateMutation.mutate({ count: newCount })}
            disabled={updateMutation.isPending}
          >
            Save
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
            Cancel
          </Button>
        </div>
      ) : (
        <Button
          size="sm"
          variant="outline"
          className="w-full border-card-border hover:border-primary/30 text-muted-foreground hover:text-white"
          onClick={() => { setNewCount(zone.count); setEditing(true); }}
        >
          Update Count
        </Button>
      )}
    </motion.div>
  );
}

function AlertCard({ alert, onResolve }) {
  const s = SEVERITY_STYLES[alert.severity] || SEVERITY_STYLES.info;
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 10 }}
      className={`p-4 rounded-xl bg-card border ${s.border} flex items-start gap-3`}
    >
      <span className={`h-2 w-2 rounded-full shrink-0 mt-1.5 ${s.dot}`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <Badge className={`text-xs ${s.badge}`}>{alert.severity}</Badge>
          <span className="text-xs text-muted-foreground capitalize">{alert.zone} · {alert.type}</span>
        </div>
        <p className="text-sm text-white leading-snug">{alert.message}</p>
        <p className="text-xs text-muted-foreground mt-1">
          {new Date(alert.createdAt).toLocaleString()}
        </p>
      </div>
      {alert.status === "active" && (
        <Button
          size="sm"
          variant="ghost"
          className="shrink-0 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
          onClick={() => onResolve(alert.id || alert._id)}
        >
          <CheckCircle2 className="h-4 w-4" />
        </Button>
      )}
    </motion.div>
  );
}

export default function CrowdPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [tab, setTab] = useState("zones");
  const [aiResult, setAiResult] = useState(null);

  const { data: zones = [], isLoading: zonesLoading, refetch: refetchZones } = useQuery({
    queryKey: ["crowd-zones"],
    queryFn: crowdApi.zones,
    refetchInterval: 20000,
  });

  const { data: alerts = [], isLoading: alertsLoading, refetch: refetchAlerts } = useQuery({
    queryKey: ["crowd-alerts"],
    queryFn: crowdApi.alerts,
    refetchInterval: 20000,
  });

  const { data: venues = [] } = useQuery({
    queryKey: ["venues"],
    queryFn: venuesApi.list,
  });

  const resolveMutation = useMutation({
    mutationFn: crowdApi.resolveAlert,
    onSuccess: () => {
      qc.invalidateQueries(["crowd-alerts"]);
      toast({ title: "Alert resolved" });
    },
  });

  const analyzeMutation = useMutation({
    mutationFn: crowdApi.analyze,
    onSuccess: (data) => {
      setAiResult(data);
      toast({ title: "AI analysis complete" });
    },
    onError: () => toast({ title: "Analysis failed", variant: "destructive" }),
  });

  const handleAnalyze = () => {
    const venueId = venues[0]?.id || venues[0]?._id || "default";
    analyzeMutation.mutate({ venueId });
  };

  const activeAlerts = alerts.filter((a) => a.status === "active");
  const resolvedAlerts = alerts.filter((a) => a.status === "resolved");

  const RISK_STYLES = {
    low: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
    medium: "text-amber-400 bg-amber-500/10 border-amber-500/30",
    high: "text-orange-400 bg-orange-500/10 border-orange-500/30",
    critical: "text-red-400 bg-red-500/10 border-red-500/30",
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Crowd Management</h1>
          <p className="text-sm text-muted-foreground">
            {activeAlerts.length} active alert{activeAlerts.length !== 1 ? "s" : ""} · {zones.length} zones monitored
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="border-card-border text-muted-foreground hover:text-white"
            onClick={() => { refetchZones(); refetchAlerts(); }}
          >
            <RefreshCw className="h-4 w-4 mr-1" /> Refresh
          </Button>
          <Button
            size="sm"
            onClick={handleAnalyze}
            disabled={analyzeMutation.isPending}
            className="gap-1"
          >
            <BrainCircuit className="h-4 w-4" />
            {analyzeMutation.isPending ? "Analyzing…" : "AI Analyze"}
          </Button>
        </div>
      </div>

      {/* AI Analysis Result */}
      <AnimatePresence>
        {aiResult && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`p-5 rounded-2xl border ${RISK_STYLES[aiResult.riskLevel] || RISK_STYLES.medium}`}
          >
            <div className="flex items-start gap-3 flex-wrap">
              <BrainCircuit className="h-5 w-5 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="font-semibold">AI Analysis</span>
                  <Badge className={`text-xs capitalize ${RISK_STYLES[aiResult.riskLevel]}`}>
                    Risk: {aiResult.riskLevel}
                  </Badge>
                  {aiResult.predictedSurge && (
                    <Badge className="text-xs bg-orange-500/20 text-orange-400 border-orange-500/30">
                      <Flame className="h-3 w-3 mr-1" /> Surge Predicted
                    </Badge>
                  )}
                  {aiResult.aiPowered && (
                    <Badge className="text-xs bg-primary/20 text-primary border-primary/30">
                      <Zap className="h-3 w-3 mr-1" /> Gemini AI
                    </Badge>
                  )}
                </div>
                <p className="text-sm mb-3 opacity-90">{aiResult.summary}</p>
                {aiResult.recommendations?.length > 0 && (
                  <ul className="space-y-1">
                    {aiResult.recommendations.map((r, i) => (
                      <li key={i} className="text-xs flex items-center gap-2 opacity-80">
                        <span className="h-1 w-1 rounded-full bg-current shrink-0" />
                        {r}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="shrink-0"
                onClick={() => setAiResult(null)}
              >
                ✕
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-card border border-card-border rounded-xl w-fit">
        {[
          { key: "zones", label: "Zones", icon: Shield },
          { key: "active", label: `Active Alerts (${activeAlerts.length})`, icon: AlertTriangle },
          { key: "resolved", label: "Resolved", icon: CheckCircle2 },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === key
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-white"
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {tab === "zones" && (
          <motion.div
            key="zones"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
          >
            {zonesLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-48 rounded-2xl bg-card border border-card-border animate-pulse" />
              ))
            ) : (
              zones.map((zone) => (
                <ZoneCard key={zone.zoneId} zone={zone} />
              ))
            )}
          </motion.div>
        )}

        {tab === "active" && (
          <motion.div
            key="active"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-3"
          >
            {alertsLoading ? (
              <p className="text-muted-foreground text-sm">Loading…</p>
            ) : activeAlerts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <CheckCircle2 className="h-12 w-12 text-emerald-400 mb-3" />
                <p className="text-white font-medium">All clear!</p>
                <p className="text-sm text-muted-foreground">No active alerts at this time</p>
              </div>
            ) : (
              <AnimatePresence>
                {activeAlerts.map((a) => (
                  <AlertCard
                    key={a.id || a._id}
                    alert={a}
                    onResolve={(id) => resolveMutation.mutate(id)}
                  />
                ))}
              </AnimatePresence>
            )}
          </motion.div>
        )}

        {tab === "resolved" && (
          <motion.div
            key="resolved"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-3"
          >
            {resolvedAlerts.length === 0 ? (
              <p className="text-sm text-muted-foreground">No resolved alerts</p>
            ) : (
              resolvedAlerts.map((a) => (
                <AlertCard key={a.id || a._id} alert={a} onResolve={() => {}} />
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
