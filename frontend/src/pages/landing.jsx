import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Activity, ShieldAlert, Navigation, Languages, BrainCircuit } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import gsap from "gsap";

function StatCounter({ target, label }) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    const obj = { val: 0 };
    gsap.to(obj, {
      val: target,
      duration: 2,
      ease: "power2.out",
      onUpdate: () => setValue(Math.floor(obj.val)),
    });
  }, [target]);

  return (
    <div className="flex flex-col items-center justify-center p-6 border border-border/50 rounded-2xl bg-card/30 backdrop-blur-sm">
      <div className="text-4xl md:text-5xl font-bold text-white mb-2">
        {value.toLocaleString()}{target > 100 ? "+" : ""}
      </div>
      <div className="text-sm text-muted-foreground uppercase tracking-wider">{label}</div>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden flex flex-col relative">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-accent/10 rounded-full blur-[150px] pointer-events-none" />

      <header className="w-full border-b border-border/50 bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold tracking-tight text-white">
              Venue<span className="text-primary">IQ</span>
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/login">
              <Button variant="ghost" className="text-muted-foreground hover:text-white">Sign In</Button>
            </Link>
            <Link to="/register">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col">
        <section className="relative pt-24 pb-32 md:pt-36 md:pb-40 px-4 flex flex-col items-center text-center z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-4xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-8">
              <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse" />
              Live Event Mission Control
            </div>
            <h1 className="text-5xl md:text-7xl font-bold text-white tracking-tight mb-8 leading-tight">
              AI-Powered Venue Operations at{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
                Tournament Scale
              </span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed">
              The nerve center for massive esports and sports events. Real-time crowd management, smart navigation, multilingual AI, and instant decision support.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/register">
                <Button size="lg" className="w-full sm:w-auto h-14 px-8 text-lg rounded-xl shadow-[0_0_30px_rgba(29,185,152,0.3)]">
                  Launch Command Center
                </Button>
              </Link>
              <Link to="/login">
                <Button variant="outline" size="lg" className="w-full sm:w-auto h-14 px-8 text-lg rounded-xl border-border/50 bg-card/50 hover:bg-card">
                  Sign In to Active Event
                </Button>
              </Link>
            </div>
          </motion.div>
        </section>

        <section className="py-12 border-y border-border/30 bg-card/20 z-10">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
              <StatCounter target={15000} label="Attendees Managed" />
              <StatCounter target={8} label="Smart Zones" />
              <StatCounter target={47} label="Languages" />
              <StatCounter target={100} label="Real-time Insights" />
            </div>
          </div>
        </section>

        <section className="py-24 px-4 z-10">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Four Pillars of Operational Excellence</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">Everything you need to run a flawless event, powered by real-time data and artificial intelligence.</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {[
                { icon: ShieldAlert, title: "Crowd Management", color: "primary", desc: "Monitor zone densities in real-time. Anticipate bottlenecks before they happen and dynamically redirect traffic to prevent overcrowding." },
                { icon: Navigation, title: "Smart Navigation", color: "accent", desc: "Provide dynamic, crowd-aware routing for attendees. Automatically avoid congested areas and offer accessible paths tailored to individual needs." },
                { icon: Languages, title: "Multilingual AI Assistant", color: "chart-3", desc: "Support a global audience with an AI assistant that instantly detects and responds in over 40 languages, answering venue and schedule questions." },
                { icon: BrainCircuit, title: "Decision Support", color: "chart-4", desc: "Empower staff with Gemini AI-driven operational guidance. Get immediate, contextual recommendations for handling emergencies and optimizing flow." },
              ].map((feature, i) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className={`p-8 rounded-3xl bg-card border border-card-border hover:border-${feature.color}/30 transition-colors group`}
                >
                  <div className={`h-12 w-12 rounded-xl bg-${feature.color}/10 flex items-center justify-center text-${feature.color} mb-6 group-hover:scale-110 transition-transform`}>
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{feature.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="py-8 border-t border-border/50 bg-background z-10 text-center text-sm text-muted-foreground">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            <span className="font-bold text-white">VenueIQ</span>
          </div>
          <p>© {new Date().getFullYear()} VenueIQ Platform. Built for the Hackathon.</p>
        </div>
      </footer>
    </div>
  );
}
