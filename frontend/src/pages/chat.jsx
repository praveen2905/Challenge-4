import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { chatApi } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  Trash2,
  Bot,
  User,
  Globe,
  Sparkles,
  Languages,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
  { code: "fr", label: "Français" },
  { code: "de", label: "Deutsch" },
  { code: "zh", label: "中文" },
  { code: "hi", label: "हिंदी" },
  { code: "ar", label: "العربية" },
];

const SUGGESTIONS = [
  "Where are the restrooms?",
  "What time does the event start?",
  "How do I get to the VIP area?",
  "Is there wheelchair access?",
  "Where can I find medical assistance?",
  "What food options are available?",
];

function MessageBubble({ msg, animate }) {
  const isUser = msg.role === "user";
  return (
    <motion.div
      initial={animate ? { opacity: 0, y: 10 } : false}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-start gap-3 ${isUser ? "flex-row-reverse" : ""}`}
    >
      <div
        className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${
          isUser
            ? "bg-primary/20 text-primary"
            : "bg-accent/20 text-accent"
        }`}
      >
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? "bg-primary/20 text-white rounded-tr-sm"
            : "bg-card border border-card-border text-foreground rounded-tl-sm"
        }`}
      >
        <p className="whitespace-pre-wrap">{msg.content}</p>
        <div className="flex items-center gap-1 mt-1.5">
          {msg.language && msg.language !== "en" && (
            <Badge className="text-[10px] py-0 bg-white/5 text-muted-foreground border-0">
              <Globe className="h-2.5 w-2.5 mr-0.5" />
              {msg.language}
            </Badge>
          )}
          <span className="text-[10px] text-muted-foreground ml-auto">
            {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

export default function ChatPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const bottomRef = useRef(null);
  const [text, setText] = useState("");
  const [language, setLanguage] = useState("en");
  const [localMessages, setLocalMessages] = useState([]);

  const { data: history = [], isLoading } = useQuery({
    queryKey: ["chat-history"],
    queryFn: chatApi.history,
    onSuccess: (data) => setLocalMessages(data),
  });

  useEffect(() => {
    if (history.length > 0 && localMessages.length === 0) {
      setLocalMessages(history);
    }
  }, [history]);

  const sendMutation = useMutation({
    mutationFn: chatApi.sendMessage,
    onSuccess: (data) => {
      setLocalMessages((prev) => [...prev, data.userMessage, data.assistantMessage]);
    },
    onError: () => {
      toast({ title: "Failed to send message", variant: "destructive" });
    },
  });

  const clearMutation = useMutation({
    mutationFn: chatApi.clearHistory,
    onSuccess: () => {
      setLocalMessages([]);
      qc.invalidateQueries(["chat-history"]);
      toast({ title: "Chat history cleared" });
    },
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [localMessages, sendMutation.isPending]);

  const handleSend = () => {
    const msg = text.trim();
    if (!msg || sendMutation.isPending) return;
    setText("");
    // Optimistically show user message
    setLocalMessages((prev) => [
      ...prev,
      { _id: "tmp-user", role: "user", content: msg, language, timestamp: new Date().toISOString() },
    ]);
    sendMutation.mutate({ message: msg, language });
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const messages = localMessages;

  return (
    <div className="max-w-3xl mx-auto h-full flex flex-col gap-4" style={{ height: "calc(100vh - 120px)" }}>
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            Multilingual AI Assistant
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Ask anything about the venue — responds in your language
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="appearance-none pl-8 pr-3 py-1.5 rounded-lg bg-card border border-card-border text-sm text-white cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>{l.label}</option>
              ))}
            </select>
            <Languages className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-destructive"
            onClick={() => clearMutation.mutate()}
            disabled={clearMutation.isPending || messages.length === 0}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto rounded-2xl bg-card border border-card-border p-4 space-y-4 min-h-0">
        {isLoading ? (
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
            Loading history…
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-6 text-center">
            <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Bot className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h3 className="text-white font-semibold mb-1">VenueIQ AI Assistant</h3>
              <p className="text-sm text-muted-foreground max-w-xs">
                I can help with venue navigation, event info, and support in 40+ languages.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 w-full max-w-md">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => { setText(s); }}
                  className="text-left text-xs p-3 rounded-xl bg-background border border-border hover:border-primary/30 hover:bg-primary/5 text-muted-foreground hover:text-white transition-all"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            <AnimatePresence initial={false}>
              {messages.map((msg, i) => (
                <MessageBubble key={msg._id || i} msg={msg} animate={i >= messages.length - 2} />
              ))}
            </AnimatePresence>
            {sendMutation.isPending && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-3"
              >
                <div className="h-8 w-8 rounded-full bg-accent/20 flex items-center justify-center">
                  <Bot className="h-4 w-4 text-accent" />
                </div>
                <div className="bg-card border border-card-border rounded-2xl rounded-tl-sm px-4 py-3">
                  <div className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <motion.span
                        key={i}
                        className="h-2 w-2 rounded-full bg-muted-foreground"
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                      />
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
            <div ref={bottomRef} />
          </>
        )}
      </div>

      {/* Input */}
      <div className="shrink-0 flex gap-2 items-end">
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about directions, schedules, venue services…"
          rows={2}
          className="flex-1 resize-none bg-card border-card-border text-white placeholder:text-muted-foreground focus:ring-primary"
        />
        <Button
          onClick={handleSend}
          disabled={!text.trim() || sendMutation.isPending}
          className="h-full px-4 rounded-xl"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
