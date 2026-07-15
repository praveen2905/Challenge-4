import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { decisionsApi } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import {
  BrainCircuit,
  Send,
  Clock,
  Zap,
  AlertTriangle,
  CheckCircle,
  Info,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

const PRIORITY_STYLES = {
  low: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  medium: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  high: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  urgent: "bg-red-500/20 text-red-400 border-red-500/30",
};

const PRIORITY_ICONS = {
  low: Info,
  medium: AlertTriangle,
  high: AlertTriangle,
  urgent: AlertTriangle,
};

const SAMPLE_QUERIES = [
  "Should we open the additional entrance gates given current crowd density?",
  "How should we handle the overcrowding in the South Stand?",
  "When should we start evacuating the VIP lounge?",
  "What's the best way to redirect foot traffic from East Wing?",
  "How many additional security personnel should we deploy?",
  "Should we delay the main event start due to venue conditions?",
];

function DecisionCard({ result, query, timestamp }) {
  const [expanded, setExpanded] = useState(true);
  const PIcon = PRIORITY_ICONS[result.priority] || Info;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl bg-card border border-card-border overflow-hidden"
    >
      {/* Card Header */}
      <div
        className="flex items-start justify-between gap-3 p-5 cursor-pointer hover:bg-background/50 transition-colors"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <BrainCircuit className="h-4 w-4 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground mb-1">Query</p>
            <p className="text-sm text-white font-medium leading-snug">{query}</p>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <Badge className={`text-xs capitalize ${PRIORITY_STYLES[result.priority] || PRIORITY_STYLES.medium}`}>
                <PIcon className="h-3 w-3 mr-1" />
                {result.priority} priority
              </Badge>
              {result.aiPowered && (
                <Badge className="text-xs bg-primary/20 text-primary border-primary/30">
                  <Zap className="h-3 w-3 mr-1" />
                  Gemini AI
                </Badge>
              )}
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {new Date(timestamp).toLocaleTimeString()}
              </span>
            </div>
          </div>
        </div>
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
        )}
      </div>

      {/* Card Body */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 space-y-4 border-t border-border">
              {/* Recommendation */}
              <div className="mt-4 p-4 rounded-xl bg-primary/5 border border-primary/20">
                <p className="text-xs text-primary font-semibold mb-2 uppercase tracking-wider">Recommendation</p>
                <p className="text-sm text-white leading-relaxed">{result.recommendation}</p>
              </div>

              {/* Reasoning */}
              {result.reasoning && (
                <div className="p-3 rounded-xl bg-background border border-border">
                  <p className="text-xs text-muted-foreground font-semibold mb-1">Reasoning</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{result.reasoning}</p>
                </div>
              )}

              {/* Actions */}
              {result.actions?.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground font-semibold mb-2 uppercase tracking-wider">Immediate Actions</p>
                  <ul className="space-y-2">
                    {result.actions.map((action, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                        <span className="text-white">{action}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function DecisionsPage() {
  const { toast } = useToast();
  const [query, setQuery] = useState("");
  const [context, setContext] = useState("");
  const [showContext, setShowContext] = useState(false);
  const [decisions, setDecisions] = useState([]);

  const queryMutation = useMutation({
    mutationFn: decisionsApi.query,
    onSuccess: (data) => {
      setDecisions((prev) => [
        { result: data, query: queryMutation.variables?.query, timestamp: new Date().toISOString() },
        ...prev,
      ]);
      setQuery("");
      setContext("");
    },
    onError: () => toast({ title: "Query failed", variant: "destructive" }),
  });

  const handleSubmit = () => {
    const q = query.trim();
    if (!q) return;
    queryMutation.mutate({ query: q, context: context.trim() || undefined });
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-primary" />
          AI Decision Support
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Get real-time operational guidance powered by Gemini AI
        </p>
      </div>

      {/* Query Input */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 rounded-2xl bg-card border border-card-border space-y-4"
      >
        <div className="flex items-center gap-2 text-primary mb-2">
          <BrainCircuit className="h-5 w-5" />
          <span className="font-semibold text-white">Ask the AI Advisor</span>
        </div>

        <Textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Describe a situation or ask for operational guidance…"
          rows={3}
          className="bg-background border-border text-white placeholder:text-muted-foreground focus:ring-primary resize-none"
        />

        <div>
          <button
            className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 mb-2"
            onClick={() => setShowContext((v) => !v)}
          >
            {showContext ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            Add additional context (optional)
          </button>
          <AnimatePresence>
            {showContext && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
              >
                <Textarea
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  placeholder="E.g. VIP guest arriving, staff shortage, rain expected…"
                  rows={2}
                  className="bg-background border-border text-white placeholder:text-muted-foreground focus:ring-primary resize-none"
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex flex-wrap gap-2">
            {SAMPLE_QUERIES.slice(0, 3).map((s) => (
              <button
                key={s}
                onClick={() => setQuery(s)}
                className="text-xs px-3 py-1.5 rounded-lg bg-background border border-border hover:border-primary/30 text-muted-foreground hover:text-white transition-all"
              >
                {s.slice(0, 35)}…
              </button>
            ))}
          </div>
          <Button
            onClick={handleSubmit}
            disabled={!query.trim() || queryMutation.isPending}
            className="gap-2"
          >
            {queryMutation.isPending ? (
              <>
                <motion.div
                  className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
                Consulting AI…
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Get Recommendation
              </>
            )}
          </Button>
        </div>
      </motion.div>

      {/* Sample Queries */}
      {decisions.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="p-5 rounded-2xl bg-card border border-card-border"
        >
          <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-3">Sample Queries</p>
          <div className="grid sm:grid-cols-2 gap-2">
            {SAMPLE_QUERIES.map((s) => (
              <button
                key={s}
                onClick={() => setQuery(s)}
                className="text-left text-sm p-3 rounded-xl bg-background border border-border hover:border-primary/30 hover:bg-primary/5 text-muted-foreground hover:text-white transition-all"
              >
                {s}
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Decision History */}
      {decisions.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-white">Decision History</h2>
            <button
              className="text-xs text-muted-foreground hover:text-white"
              onClick={() => setDecisions([])}
            >
              Clear
            </button>
          </div>
          <AnimatePresence>
            {decisions.map((d, i) => (
              <DecisionCard key={i} {...d} />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
