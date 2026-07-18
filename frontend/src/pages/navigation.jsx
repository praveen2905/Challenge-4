import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { navigationApi, venuesApi } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import {
  Navigation,
  MapPin,
  Clock,
  ArrowRight,
  Accessibility,
  AlertTriangle,
  Footprints,
  Target,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

const POIS = [
  "Main Entrance",
  "Emergency Exit A",
  "Emergency Exit B",
  "Restrooms (Level 1)",
  "Restrooms (Level 2)",
  "Food Court",
  "Medical Station",
  "Info Desk",
  "Main Stage",
  "VIP Lounge",
  "Parking Area",
  "North Stand",
  "South Stand",
  "East Wing",
  "West Wing",
];

const ZONE_COLORS = {
  seating: "#6366f1",
  standing: "#8b5cf6",
  vip: "#f59e0b",
  floor: "#14b8a6",
  amenity: "#10b981",
  transit: "#3b82f6",
};

const POI_ICONS = {
  entrance: "🚪",
  exit: "🚨",
  restroom: "🚻",
  food: "🍔",
  medical: "🏥",
  info: "ℹ️",
  stage: "🎤",
  parking: "🅿️",
};

function VenueMap({ mapData, route }) {
  if (!mapData) return (
    <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
      Loading map…
    </div>
  );

  return (
    <svg viewBox="0 0 100 100" className="w-full h-full" style={{ background: "hsl(222 47% 8%)" }}>
      {/* Grid */}
      <defs>
        <pattern id="grid" width="5" height="5" patternUnits="userSpaceOnUse">
          <path d="M 5 0 L 0 0 0 5" fill="none" stroke="hsl(222 47% 16%)" strokeWidth="0.3" />
        </pattern>
      </defs>
      <rect width="100" height="100" fill="url(#grid)" />

      {/* Zones */}
      {mapData.zones?.map((zone) => (
        <g key={zone.id}>
          <rect
            x={zone.x}
            y={zone.y}
            width={zone.width}
            height={zone.height}
            fill={zone.color}
            fillOpacity={0.15}
            stroke={zone.color}
            strokeOpacity={0.4}
            strokeWidth="0.5"
            rx="1"
          />
          <text
            x={zone.x + zone.width / 2}
            y={zone.y + zone.height / 2}
            textAnchor="middle"
            dominantBaseline="middle"
            fill={zone.color}
            fontSize="2.5"
            fontWeight="bold"
            opacity="0.8"
          >
            {zone.name.length > 10 ? zone.name.split(" ")[0] : zone.name}
          </text>
        </g>
      ))}

      {/* POIs */}
      {mapData.pois?.map((poi) => (
        <g key={poi.id}>
          <circle cx={poi.x} cy={poi.y} r="1.8" fill="hsl(222 47% 20%)" stroke="hsl(213 31% 91%)" strokeWidth="0.4" />
          <text x={poi.x} y={poi.y} textAnchor="middle" dominantBaseline="middle" fontSize="1.8">
            {POI_ICONS[poi.type] || "•"}
          </text>
        </g>
      ))}

      {/* Route overlay if present */}
      {route && (
        <g>
          <line x1="50" y1="90" x2="50" y2="47" stroke="hsl(173 80% 40%)" strokeWidth="0.8" strokeDasharray="2 1" />
          <circle cx="50" cy="90" r="2" fill="hsl(173 80% 40%)" />
          <circle cx="50" cy="47" r="2" fill="hsl(199 89% 48%)" />
        </g>
      )}
    </svg>
  );
}

export default function NavigationPage() {
  const { toast } = useToast();
  const [origin, setOrigin] = useState("Main Entrance");
  const [destination, setDestination] = useState("VIP Lounge");
  const [accessibility, setAccessibility] = useState(false);
  const [language, setLanguage] = useState("en");
  const [routeResult, setRouteResult] = useState(null);

  const { data: venues = [] } = useQuery({
    queryKey: ["venues"],
    queryFn: venuesApi.list,
  });

  const venueId = venues[0]?.id || venues[0]?._id || "default";

  const { data: mapData } = useQuery({
    queryKey: ["nav-map", venueId],
    queryFn: () => navigationApi.map(venueId),
    enabled: !!venueId && venueId !== "default",
  });

  const { data: dynamicPois = [] } = useQuery({
    queryKey: ["nav-pois"],
    queryFn: navigationApi.pois,
  });

  const poisList = dynamicPois && dynamicPois.length > 0
    ? Array.from(new Set(dynamicPois.map((p) => p.name)))
    : POIS;

  const routeMutation = useMutation({
    mutationFn: navigationApi.route,
    onSuccess: (data) => {
      setRouteResult(data);
      toast({ title: "Route generated!" });
    },
    onError: () => toast({ title: "Could not generate route", variant: "destructive" }),
  });

  const handleGetRoute = () => {
    routeMutation.mutate({
      venueId,
      origin,
      destination,
      accessibility,
      language,
    });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Navigation className="h-6 w-6 text-primary" />
          Smart Navigation
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          AI-powered crowd-aware routing for your venue
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Route Planner */}
        <div className="space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 rounded-2xl bg-card border border-card-border space-y-4"
          >
            <h2 className="font-semibold text-white flex items-center gap-2">
              <Footprints className="h-4 w-4 text-primary" />
              Plan Your Route
            </h2>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground block mb-1.5">From</label>
                <select
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  {poisList.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>

              <div className="flex items-center justify-center">
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </div>

              <div>
                <label className="text-xs text-muted-foreground block mb-1.5">To</label>
                <select
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  {poisList.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={accessibility}
                  onChange={(e) => setAccessibility(e.target.checked)}
                  className="accent-primary rounded"
                />
                <Accessibility className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Wheelchair accessible</span>
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="bg-background border border-border rounded-lg px-2 py-1 text-xs text-white focus:outline-none"
              >
                <option value="en">English</option>
                <option value="es">Español</option>
                <option value="fr">Français</option>
                <option value="de">Deutsch</option>
                <option value="zh">中文</option>
                <option value="hi">हिंदी</option>
              </select>
            </div>

            <Button
              className="w-full gap-2"
              onClick={handleGetRoute}
              disabled={routeMutation.isPending || origin === destination}
            >
              <Navigation className="h-4 w-4" />
              {routeMutation.isPending ? "Generating Route…" : "Get AI Route"}
            </Button>
          </motion.div>

          {/* Route Result */}
          <AnimatePresence>
            {routeResult && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="p-6 rounded-2xl bg-card border border-primary/30 space-y-4"
              >
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h3 className="font-semibold text-white flex items-center gap-2">
                    <Target className="h-4 w-4 text-primary" />
                    Your Route
                  </h3>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-primary/20 text-primary border-primary/30">
                      <Clock className="h-3 w-3 mr-1" />
                      {routeResult.estimatedTime}
                    </Badge>
                    <Badge className="bg-card border-card-border text-muted-foreground">
                      {routeResult.distance}
                    </Badge>
                    {routeResult.aiPowered && (
                      <Badge className="bg-accent/20 text-accent border-accent/30">
                        <Zap className="h-3 w-3 mr-1" />
                        AI
                      </Badge>
                    )}
                  </div>
                </div>

                {routeResult.crowdWarnings?.length > 0 && (
                  <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm">
                    <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>Avoiding: {routeResult.crowdWarnings.join(", ")}</span>
                  </div>
                )}

                {routeResult.accessibilityInfo && (
                  <div className="flex items-center gap-2 text-xs text-blue-400 bg-blue-500/10 border border-blue-500/20 rounded-xl p-3">
                    <Accessibility className="h-4 w-4" />
                    {routeResult.accessibilityInfo}
                  </div>
                )}

                <ol className="space-y-3">
                  {routeResult.route?.map((step) => (
                    <li key={step.step} className="flex items-start gap-3">
                      <span className="h-6 w-6 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center font-bold shrink-0">
                        {step.step}
                      </span>
                      <div>
                        <p className="text-sm text-white">{step.instruction}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {step.distance} · {step.landmark}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Venue Map */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-4 rounded-2xl bg-card border border-card-border"
        >
          <h2 className="font-semibold text-white mb-3 flex items-center gap-2">
            <MapPin className="h-4 w-4 text-accent" />
            Venue Map
          </h2>
          <div className="rounded-xl overflow-hidden aspect-square">
            <VenueMap mapData={mapData} route={routeResult} />
          </div>
          {/* Legend */}
          <div className="mt-3 flex flex-wrap gap-2">
            {Object.entries(ZONE_COLORS).map(([type, color]) => (
              <span key={type} className="flex items-center gap-1 text-xs text-muted-foreground">
                <span className="h-2 w-2 rounded-sm inline-block" style={{ backgroundColor: color }} />
                {type}
              </span>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
