"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

import {
  Home as HomeIcon,
  Radio,
  Newspaper,
  Send,
  XCircle,
  Brain,
  Network,
  Activity,
  Settings,
  Sparkles,
  Eye,
  Clock3,
  ScanSearch,
  ExternalLink,
  CheckCircle2,
  Database,
  Cpu,
  Wifi,
  Server,
} from "lucide-react";

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
} from "recharts";

/* =========================================================
   MOCK DATA
========================================================= */

const navItems = [
  { id: "overview", label: "Overview", icon: HomeIcon },
  { id: "signals", label: "Signal Stream", icon: Radio },
  { id: "newsroom", label: "Newsroom", icon: Newspaper },
  { id: "published", label: "Published", icon: Send },
  { id: "rejected", label: "Rejected", icon: XCircle },
  { id: "beliefs", label: "Beliefs", icon: Brain },
  { id: "memory", label: "Memory Core", icon: Network },
  { id: "analytics", label: "Analytics", icon: Activity },
  { id: "system", label: "System Status", icon: Settings },
];

const signals = [
  {
    time: "18:41",
    title: "Anthropic debuts Claude 4 with extended tool use",
    category: "AI MODELS",
    score: 72,
  },
  {
    time: "18:37",
    title: "OpenAI agents gain persistent browser access",
    category: "AI AGENTS",
    score: 89,
    active: true,
  },
  {
    time: "18:32",
    title: "Meta open-sources Llama 4 Scout with extended context",
    category: "OPEN SOURCE",
    score: 64,
  },
  {
    time: "18:28",
    title: "Next-generation AI infrastructure enters testing",
    category: "INFRASTRUCTURE",
    score: 58,
  },
];

const radarData = [
  { subject: "Impact", value: 92 },
  { subject: "Novelty", value: 84 },
  { subject: "Relevance", value: 96 },
  { subject: "Credibility", value: 88 },
  { subject: "Timeliness", value: 80 },
  { subject: "Discussion", value: 76 },
];

const beliefs = [
  {
    state: "STRENGTHENED",
    symbol: "↑",
    tone: "olive",
    text: "Agent autonomy makes permission architecture increasingly critical.",
  },
  {
    state: "STABLE",
    symbol: "→",
    tone: "taupe",
    text: "Inference economics matter more than benchmark headlines.",
  },
  {
    state: "CHALLENGED",
    symbol: "↓",
    tone: "sand",
    text: "Closed models will maintain a persistent capability lead.",
  },
];

const memoryNodes = [
  { id: 1, label: "AI Agents", x: 50, y: 50, size: 19, primary: true },
  { id: 2, label: "Agent Security", x: 24, y: 27, size: 12 },
  { id: 3, label: "Coding Agents", x: 75, y: 25, size: 11 },
  { id: 4, label: "Tool Protocols", x: 78, y: 68, size: 10 },
  { id: 5, label: "Open Source", x: 27, y: 72, size: 13 },
  { id: 6, label: "Inference Cost", x: 52, y: 83, size: 9 },
  { id: 7, label: "Permissions", x: 49, y: 20, size: 8 },
];

const memoryLinks = [
  [1, 2],
  [1, 3],
  [1, 4],
  [1, 5],
  [1, 7],
  [5, 6],
];

const publishedPosts = [
  {
    id: "P_018",
    time: "18:39",
    topic: "AI AGENTS",
    title: "Browser access changes what agent security actually means.",
    text:
      "AI agents are gaining permissions faster than we are learning to secure them. Once models can browse, execute and persist, the attack surface is no longer just the prompt. It is every tool the agent is allowed to touch.",
    score: 89,
    rationale:
      "Selected because persistent browser access materially changes the threat model for autonomous systems.",
  },
  {
    id: "P_017",
    time: "15:12",
    topic: "OPEN SOURCE",
    title: "The interesting part of open models is no longer the benchmark.",
    text:
      "The real advantage is deployment freedom. Lower switching costs, cheaper experimentation and infrastructure ownership may matter more than a few points on a leaderboard.",
    score: 84,
    rationale:
      "Published because the release changes deployment economics for smaller AI teams.",
  },
];

const rejectedStories = [
  {
    title: "GPT-X improves benchmark performance by 1.8%",
    score: 52,
    reason:
      "Incremental benchmark movement without meaningful product, accessibility, cost or capability implications.",
  },
  {
    title: "AI startup raises another large funding round",
    score: 46,
    reason:
      "High attention, but no demonstrated technical or ecosystem consequence yet.",
  },
  {
    title: "Minor chatbot UI redesign becomes viral",
    score: 31,
    reason:
      "Strong discussion volume but almost no relevance to Clara's editorial domain.",
  },
];

/* =========================================================
   CLARA
========================================================= */

const claraImages = {
  OBSERVING: "/clara/observing.png",
  ANALYZING: "/clara/analyzing.png",
  INTRIGUED: "/clara/intrigued.png",
  SKEPTICAL: "/clara/skeptical.png",
  PUBLISHING: "/clara/publishing.png",
  REFLECTING: "/clara/reflecting.png",
};

const claraThoughts = {
  OBSERVING:
    "Scanning the ecosystem for weak but meaningful signals.",

  ANALYZING:
    "Does this development actually change how autonomous agents operate?",

  INTRIGUED:
    "This may be more consequential than the headline suggests.",

  SKEPTICAL:
    "High visibility does not automatically mean high significance.",

  PUBLISHING:
    "This clears the editorial threshold. It is worth saying.",

  REFLECTING:
    "Does this evidence strengthen or challenge what I already believe?",
};

const claraStates = [
  "OBSERVING",
  "ANALYZING",
  "INTRIGUED",
  "SKEPTICAL",
  "PUBLISHING",
  "REFLECTING",
];

/* =========================================================
   PAGE
========================================================= */

export default function Home() {
  const [claraState, setClaraState] = useState("OBSERVING");
  const [mouse, setMouse] = useState({ x: 700, y: 400 });
  const [activeSection, setActiveSection] = useState("overview");

  const scrollContainer = useRef(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setClaraState((current) => {
        const index = claraStates.indexOf(current);
        return claraStates[(index + 1) % claraStates.length];
      });
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  function handleMouseMove(event) {
    setMouse({
      x: event.clientX,
      y: event.clientY,
    });
  }

  function goToSection(id) {
    setActiveSection(id);

    const element = document.getElementById(id);

    if (element) {
      element.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }

  return (
    <main
      onMouseMove={handleMouseMove}
      className="relative min-h-screen overflow-hidden bg-[#F3ECE3] text-[#342A24]"
    >
      {/* BACKGROUND */}

      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <motion.div
          animate={{
            x: mouse.x - 280,
            y: mouse.y - 280,
          }}
          transition={{
            type: "spring",
            damping: 35,
            stiffness: 130,
            mass: 0.7,
          }}
          className="absolute h-[560px] w-[560px] rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(191,174,154,.20), rgba(191,174,154,.05) 42%, transparent 70%)",
          }}
        />

        <div className="absolute -right-40 -top-40 h-[520px] w-[520px] rounded-full bg-[#D8CABC]/30 blur-[150px]" />

        <div className="absolute -bottom-60 left-[20%] h-[620px] w-[620px] rounded-full bg-[#C9B7A4]/20 blur-[160px]" />

        <div
          className="absolute inset-0 opacity-[0.055]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(55,45,37,.18) 1px, transparent 1px), linear-gradient(90deg, rgba(55,45,37,.18) 1px, transparent 1px)",
            backgroundSize: "55px 55px",
          }}
        />
      </div>

      <div className="relative grid min-h-screen grid-cols-[230px_1fr]">
        {/* SIDEBAR */}

        <aside className="z-30 h-screen border-r border-[#5F5045]/10 bg-[#FAF6F0]/82 p-5 backdrop-blur-2xl">
          <div className="mb-8">
            <div className="flex items-center gap-3">
              <motion.div
                whileHover={{ rotate: 8, scale: 1.06 }}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#3E342D] text-[#F7F2EC]"
              >
                <Sparkles size={16} />
              </motion.div>

              <div>
                <h1 className="font-serif text-2xl tracking-[0.12em]">
                  CLARA
                </h1>

                <p className="text-[9px] tracking-[0.26em] text-[#8B7A6D]">
                  // LIVE
                </p>
              </div>
            </div>

            <p className="mt-4 text-[9px] uppercase leading-4 tracking-[0.17em] text-[#9D8D81]">
              Autonomous AI
              <br />
              Systems Analyst
            </p>
          </div>

          <nav className="space-y-1">
            {navItems.map(({ id, label, icon: Icon }) => {
              const active = activeSection === id;

              return (
                <motion.button
                  whileHover={{ x: active ? 0 : 4 }}
                  whileTap={{ scale: 0.98 }}
                  key={id}
                  onClick={() => goToSection(id)}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[11px] transition ${
                    active
                      ? "bg-[#473A32] text-[#FFFDF9] shadow-[0_8px_20px_rgba(60,48,40,.12)]"
                      : "text-[#594A40] hover:bg-[#E9DED3]"
                  }`}
                >
                  <Icon size={14} strokeWidth={1.6} />

                  {label}
                </motion.button>
              );
            })}
          </nav>

          <div className="mt-6 rounded-[24px] border border-[#766558]/10 bg-white/40 p-4 backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <p className="text-[8px] tracking-[0.2em] text-[#816F61]">
                CLARA CORE
              </p>

              <span className="relative flex h-2 w-2">
                <span className="absolute h-full w-full animate-ping rounded-full bg-[#75856A] opacity-40" />
                <span className="relative h-2 w-2 rounded-full bg-[#75856A]" />
              </span>
            </div>

            <div className="relative mt-4 flex h-20 items-center justify-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{
                  duration: 15,
                  repeat: Infinity,
                  ease: "linear",
                }}
                className="absolute h-16 w-16 rounded-full border border-dashed border-[#625348]/25"
              />

              <motion.div
                animate={{ rotate: -360 }}
                transition={{
                  duration: 10,
                  repeat: Infinity,
                  ease: "linear",
                }}
                className="absolute h-11 w-11 rounded-full border border-[#77675B]/20"
              />

              <motion.div
                animate={{
                  scale: [0.8, 1.1, 0.8],
                  opacity: [0.35, 0.9, 0.35],
                }}
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                }}
                className="h-6 w-6 rounded-full bg-[#746357]/15"
              />

              <div className="absolute h-2 w-2 rounded-full bg-[#40352D]" />
            </div>

            <p className="text-center text-[8px] tracking-[0.08em] text-[#726258]">
              LEARNING · REASONING
            </p>
          </div>
        </aside>

        {/* MAIN */}

        <section
          ref={scrollContainer}
          className="h-screen overflow-y-auto scroll-smooth p-6 xl:p-7"
        >
          <div className="mx-auto max-w-[1550px]">
            {/* OVERVIEW */}

            <section id="overview" className="scroll-mt-6">
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-5 flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                      <span className="absolute h-full w-full animate-ping rounded-full bg-[#75856A] opacity-40" />
                      <span className="relative h-2 w-2 rounded-full bg-[#75856A]" />
                    </span>

                    <p className="text-[10px] tracking-[0.22em] text-[#706157]">
                      SYSTEM ACTIVE
                    </p>
                  </div>

                  <p className="mt-1.5 text-xs text-[#7B6C61]">
                    Clara is operating independently.
                  </p>
                </div>

                <div className="flex gap-8 rounded-2xl border border-white/50 bg-[#FBF8F4]/75 px-6 py-3 backdrop-blur-xl">
                  <Metric label="UPTIME" value="12d 14h" />
                  <Metric label="SIGNALS" value="59" />
                  <Metric label="PUBLISHED" value="3" />
                </div>
              </motion.div>

              <div className="grid gap-4 xl:grid-cols-[1.35fr_1fr_0.95fr]">
                {/* CLARA */}

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="group relative min-h-[510px] overflow-hidden rounded-[32px] border border-white/50 bg-[#D9CBBB] shadow-[0_20px_65px_rgba(53,42,34,.08)]"
                >
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={claraState}
                      initial={{
                        opacity: 0,
                        scale: 1.035,
                        filter: "blur(7px)",
                      }}
                      animate={{
                        opacity: 1,
                        scale: 1,
                        filter: "blur(0px)",
                      }}
                      exit={{
                        opacity: 0,
                        scale: 0.985,
                        filter: "blur(5px)",
                      }}
                      transition={{ duration: 0.85 }}
                      className="absolute inset-0"
                    >
                      <Image
                        src={claraImages[claraState]}
                        alt={`Clara Voss ${claraState}`}
                        fill
                        priority
                        sizes="(max-width: 1280px) 100vw, 40vw"
                        className="object-cover object-top"
                      />
                    </motion.div>
                  </AnimatePresence>

                  <div className="absolute inset-0 bg-gradient-to-r from-[#ECE2D7]/95 via-[#ECE2D7]/52 to-transparent" />

                  <div className="absolute inset-0 bg-gradient-to-t from-[#302820]/18 via-transparent to-transparent" />

                  <motion.div
                    animate={{ top: ["8%", "92%", "8%"] }}
                    transition={{
                      duration: 8,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                    className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#625348]/32 to-transparent"
                  />

                  <div className="absolute left-8 top-8 max-w-[250px]">
                    <p className="text-[8px] tracking-[0.3em] text-[#8A786B]">
                      DIGITAL ANALYST / 001
                    </p>

                    <h2 className="mt-3 font-serif text-[43px] leading-[0.95] tracking-[0.05em]">
                      CLARA
                      <br />
                      VOSS
                    </h2>

                    <p className="mt-4 text-[9px] uppercase tracking-[0.2em] text-[#69594F]">
                      Autonomous AI Systems Analyst
                    </p>

                    <div className="mt-11">
                      <p className="text-[8px] tracking-[0.25em] text-[#8C7B6E]">
                        CURRENT STATE
                      </p>

                      <div className="mt-2 flex items-center gap-2">
                        <Eye size={14} />

                        <AnimatePresence mode="wait">
                          <motion.p
                            key={claraState}
                            initial={{ opacity: 0, x: -7 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 7 }}
                            className="text-lg font-medium tracking-[0.16em]"
                          >
                            {claraState}
                          </motion.p>
                        </AnimatePresence>
                      </div>

                      <div className="mt-3 h-px w-[160px] overflow-hidden bg-[#756458]/20">
                        <motion.div
                          animate={{ x: ["-100%", "100%"] }}
                          transition={{
                            duration: 1.8,
                            repeat: Infinity,
                            ease: "linear",
                          }}
                          className="h-full w-1/2 bg-[#51443B]"
                        />
                      </div>
                    </div>

                    <div className="mt-7">
                      <p className="text-[8px] tracking-[0.25em] text-[#8C7B6E]">
                        CURRENT THOUGHT
                      </p>

                      <AnimatePresence mode="wait">
                        <motion.p
                          key={claraState}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -8 }}
                          className="mt-3 font-serif text-[17px] italic leading-6 text-[#443830]"
                        >
                          “{claraThoughts[claraState]}”
                        </motion.p>
                      </AnimatePresence>
                    </div>
                  </div>

                  <div className="absolute right-6 top-6 flex items-center gap-2 rounded-full border border-white/30 bg-[#F8F2EB]/55 px-3 py-2 backdrop-blur-xl">
                    <ScanSearch size={12} />

                    <span className="text-[8px] tracking-[0.18em]">
                      THINKING
                    </span>

                    <motion.span
                      animate={{ opacity: [0.2, 1, 0.2] }}
                      transition={{
                        duration: 1.3,
                        repeat: Infinity,
                      }}
                    >
                      •••
                    </motion.span>
                  </div>

                  <div className="absolute bottom-6 left-8 flex items-center gap-2 rounded-full border border-white/30 bg-[#FAF5EE]/60 px-4 py-2 backdrop-blur-xl">
                    <Clock3 size={12} />

                    <span className="text-[8px] tracking-[0.17em]">
                      AUTONOMOUS CYCLE ACTIVE
                    </span>
                  </div>
                </motion.div>

                {/* SIGNALS */}

                <Panel>
                  <div id="signals" className="scroll-mt-7">
                    <SectionHeading
                      title="LIVE SIGNAL STREAM"
                      subtitle="Clara's incoming attention"
                    />

                    <SignalVisualizer />

                    <div className="space-y-2">
                      {signals.map((signal, index) => (
                        <SignalCard
                          key={signal.time}
                          signal={signal}
                          index={index}
                        />
                      ))}
                    </div>
                  </div>
                </Panel>

                {/* EDITORIAL */}

                <Panel>
                  <SectionHeading
                    title="EDITORIAL BRAIN"
                    subtitle="Multi-dimensional judgment"
                  />

                  <div className="mt-2 h-[230px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart
                        cx="50%"
                        cy="52%"
                        outerRadius="65%"
                        data={radarData}
                      >
                        <PolarGrid
                          stroke="#B4A699"
                          strokeOpacity={0.35}
                        />

                        <PolarAngleAxis
                          dataKey="subject"
                          tick={{
                            fill: "#77685D",
                            fontSize: 9,
                          }}
                        />

                        <Radar
                          dataKey="value"
                          stroke="#57483D"
                          fill="#887666"
                          fillOpacity={0.22}
                          strokeWidth={1.6}
                          animationDuration={1300}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="flex items-end justify-between border-t border-[#625348]/10 pt-4">
                    <div>
                      <p className="text-[8px] tracking-[0.18em] text-[#8C7B70]">
                        SALIENCE SCORE
                      </p>

                      <div className="mt-1 flex items-end">
                        <p className="font-serif text-4xl">89</p>

                        <span className="mb-1 ml-1 text-[9px] text-[#8A7A6D]">
                          /100
                        </span>
                      </div>
                    </div>

                    <div className="text-right text-[8px] leading-5 text-[#7C6C61]">
                      <p>HYPE −6</p>
                      <p>REPETITION −3</p>
                    </div>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="mt-4 w-full rounded-xl bg-[#3E342D] px-5 py-3 text-[9px] tracking-[0.2em] text-[#FFFDF9]"
                  >
                    SIGNAL CONFIRMED · PUBLISH
                  </motion.button>
                </Panel>
              </div>
            </section>

            {/* NEWSROOM */}

            <section id="newsroom" className="scroll-mt-7 pt-5">
              <Panel>
                <SectionHeading
                  title="NEWSROOM"
                  subtitle="What Clara considered, compared and decided"
                />

                <div className="mt-5 grid gap-3 md:grid-cols-3">
                  <BigStat label="DISCOVERED" value="31" />
                  <BigStat label="REJECTED" value="28" />
                  <BigStat label="PUBLISHED" value="3" />
                </div>

                <div className="mt-5 rounded-2xl bg-[#E8DED4]/50 p-5">
                  <p className="text-[8px] tracking-[0.18em] text-[#77685E]">
                    LAST 60 MINUTES
                  </p>

                  <div className="mt-4 flex h-[70px] items-end justify-between gap-2">
                    {[
                      10, 35, 20, 48, 28, 52, 17, 40, 30, 55, 21, 44, 31,
                      60, 24,
                    ].map((height, index) => (
                      <motion.div
                        key={index}
                        initial={{ height: 2 }}
                        animate={{ height }}
                        transition={{
                          duration: 0.8,
                          delay: index * 0.04,
                        }}
                        className="w-full rounded-t-full bg-[#6D5D51]/25"
                      />
                    ))}
                  </div>
                </div>
              </Panel>
            </section>

            {/* PUBLISHED */}

            <section id="published" className="scroll-mt-7 pt-5">
              <Panel>
                <SectionHeading
                  title="PUBLISHED"
                  subtitle="Stories Clara independently decided were worth saying"
                />

                <div className="mt-5 grid gap-4 xl:grid-cols-2">
                  {publishedPosts.map((post) => (
                    <PublishedCard key={post.id} post={post} />
                  ))}
                </div>
              </Panel>
            </section>

            {/* REJECTED */}

            <section id="rejected" className="scroll-mt-7 pt-5">
              <Panel>
                <SectionHeading
                  title="REJECTED FROM THE NEWSROOM"
                  subtitle="Silence is also a decision"
                />

                <div className="mt-5 grid gap-3 xl:grid-cols-3">
                  {rejectedStories.map((story) => (
                    <RejectedCard
                      key={story.title}
                      story={story}
                    />
                  ))}
                </div>
              </Panel>
            </section>

            {/* BELIEFS */}

            <section id="beliefs" className="scroll-mt-7 pt-5">
              <Panel>
                <div className="flex items-center justify-between">
                  <SectionHeading
                    title="CLARA'S WORLD MODEL"
                    subtitle="Persistent beliefs evolving with evidence"
                  />

                  <Brain size={18} strokeWidth={1.4} />
                </div>

                <div className="mt-5 grid gap-3 md:grid-cols-3">
                  {beliefs.map((belief) => (
                    <BeliefCard
                      key={belief.text}
                      belief={belief}
                    />
                  ))}
                </div>
              </Panel>
            </section>

            {/* MEMORY */}

            <section id="memory" className="scroll-mt-7 pt-5">
              <Panel>
                <div className="flex items-center justify-between">
                  <SectionHeading
                    title="MEMORY CORE"
                    subtitle="Semantic relationships across Clara's editorial history"
                  />

                  <Network size={18} strokeWidth={1.4} />
                </div>

                <div className="mt-5">
                  <MemoryCore />
                </div>
              </Panel>
            </section>

            {/* ANALYTICS */}

            <section id="analytics" className="scroll-mt-7 pt-5">
              <Panel>
                <SectionHeading
                  title="EDITORIAL ANALYTICS"
                  subtitle="How Clara is using attention"
                />

                <div className="mt-5 grid gap-3 md:grid-cols-4">
                  <AnalyticsCard
                    label="Average Salience"
                    value="74.8"
                    detail="+6.2 this cycle"
                  />

                  <AnalyticsCard
                    label="Rejection Rate"
                    value="90%"
                    detail="Intentional selectivity"
                  />

                  <AnalyticsCard
                    label="Memory Matches"
                    value="11"
                    detail="Across 31 signals"
                  />

                  <AnalyticsCard
                    label="Hype Filtered"
                    value="17"
                    detail="Since last cycle"
                  />
                </div>
              </Panel>
            </section>

            {/* SYSTEM */}

            <section id="system" className="scroll-mt-7 py-5">
              <Panel>
                <SectionHeading
                  title="SYSTEM STATUS"
                  subtitle="Autonomous runtime health"
                />

                <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <StatusCard
                    icon={Cpu}
                    label="Editorial Engine"
                    status="ONLINE"
                    detail="Cycle healthy"
                  />

                  <StatusCard
                    icon={Database}
                    label="Memory Store"
                    status="CONNECTED"
                    detail="7 clusters active"
                  />

                  <StatusCard
                    icon={Wifi}
                    label="Live Sources"
                    status="STREAMING"
                    detail="4 source classes"
                  />

                  <StatusCard
                    icon={Server}
                    label="Autonomy Worker"
                    status="RUNNING"
                    detail="Next cycle in 03:18"
                  />
                </div>

                <div className="mt-5 flex items-center justify-between rounded-2xl bg-[#EAE1D8]/55 px-5 py-4">
                  <div>
                    <p className="text-[8px] tracking-[0.18em] text-[#817267]">
                      AUTONOMOUS EXECUTION
                    </p>

                    <p className="mt-1 text-xs text-[#4A3D34]">
                      Clara continues operating without a human prompt.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 text-[8px] tracking-[0.16em] text-[#66725C]">
                    <CheckCircle2 size={14} />
                    VERIFIED
                  </div>
                </div>
              </Panel>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}

/* =========================================================
   COMPONENTS
========================================================= */

function Panel({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55 }}
      whileHover={{
        borderColor: "rgba(92,76,64,.16)",
      }}
      className="rounded-[28px] border border-[#66564A]/10 bg-[#FBF7F2]/82 p-5 shadow-[0_15px_45px_rgba(54,43,35,.045)] backdrop-blur-xl"
    >
      {children}
    </motion.div>
  );
}

function SectionHeading({ title, subtitle }) {
  return (
    <div>
      <p className="text-[10px] font-semibold tracking-[0.16em]">
        {title}
      </p>

      <p className="mt-1 text-[8px] text-[#8A7B6F]">
        {subtitle}
      </p>
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div>
      <p className="text-[7px] tracking-[0.2em] text-[#96877C]">
        {label}
      </p>

      <p className="mt-1 font-serif text-[17px] text-[#40352D]">
        {value}
      </p>
    </div>
  );
}

function SignalVisualizer() {
  return (
    <div className="relative mt-5 h-12 overflow-hidden">
      <div className="absolute top-1/2 h-px w-full bg-[#77685D]/10" />

      {[15, 35, 50, 68, 82].map((position, index) => (
        <motion.div
          key={position}
          animate={{
            height: [5, 18 + index * 3, 8, 25 - index * 2, 5],
          }}
          transition={{
            duration: 2 + index * 0.3,
            repeat: Infinity,
          }}
          style={{
            left: `${position}%`,
          }}
          className="absolute bottom-1/2 w-px bg-[#66564A]/35"
        />
      ))}
    </div>
  );
}

function SignalCard({ signal, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{
        delay: 0.2 + index * 0.08,
      }}
      whileHover={{
        x: 5,
        scale: 1.012,
      }}
      className={`relative cursor-pointer overflow-hidden rounded-2xl border p-3.5 ${
        signal.active
          ? "border-[#706054]/12 bg-[#E9DFD6]"
          : "border-transparent bg-white/30 hover:bg-white/45"
      }`}
    >
      {signal.active && (
        <motion.div
          animate={{
            opacity: [0.2, 0.6, 0.2],
          }}
          transition={{
            duration: 1.8,
            repeat: Infinity,
          }}
          className="absolute bottom-0 left-0 top-0 w-[2px] bg-[#51443B]"
        />
      )}

      <div className="flex gap-3">
        <p className="w-9 text-[8px] text-[#897A70]">
          {signal.time}
        </p>

        <div className="flex-1">
          <p className="text-[11px] leading-[17px] text-[#3F352E]">
            {signal.title}
          </p>

          <div className="mt-2 flex items-center justify-between">
            <span className="text-[7px] tracking-[0.16em] text-[#877568]">
              {signal.category}
            </span>

            <span className="font-serif text-lg">
              {signal.score}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function BigStat({ label, value }) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="rounded-2xl border border-white/35 bg-white/30 p-4"
    >
      <p className="text-[7px] tracking-[0.2em] text-[#88796E]">
        {label}
      </p>

      <p className="mt-2 font-serif text-4xl text-[#3D332C]">
        {value}
      </p>
    </motion.div>
  );
}

function PublishedCard({ post }) {
  return (
    <motion.div
      whileHover={{ y: -5 }}
      className="rounded-[24px] border border-[#6B5A4D]/10 bg-white/32 p-5"
    >
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <span className="rounded-full bg-[#EDF0E9] px-2.5 py-1 text-[7px] tracking-[0.15em] text-[#67725E]">
            PUBLISHED
          </span>

          <span className="rounded-full bg-[#EEE7DF] px-2.5 py-1 text-[7px] tracking-[0.15em] text-[#796B60]">
            {post.topic}
          </span>
        </div>

        <p className="font-serif text-lg">
          {post.score}
        </p>
      </div>

      <h3 className="mt-5 font-serif text-xl leading-6">
        {post.title}
      </h3>

      <p className="mt-4 text-[11px] leading-5 text-[#65584E]">
        {post.text}
      </p>

      <div className="mt-5 rounded-xl bg-[#EFE7DE]/55 p-4">
        <p className="text-[7px] tracking-[0.18em] text-[#89796D]">
          CLARA'S RATIONALE
        </p>

        <p className="mt-2 text-[10px] leading-5 text-[#62554B]">
          {post.rationale}
        </p>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <span className="text-[7px] text-[#8A7C71]">
          {post.id} · {post.time}
        </span>

        <button className="flex items-center gap-1 text-[7px] tracking-[0.14em] text-[#65564A]">
          SOURCE
          <ExternalLink size={10} />
        </button>
      </div>
    </motion.div>
  );
}

function RejectedCard({ story }) {
  return (
    <motion.div
      whileHover={{
        y: -4,
      }}
      className="rounded-[22px] border border-[#6B5A4D]/10 bg-white/28 p-4"
    >
      <div className="flex items-center justify-between">
        <span className="text-[7px] tracking-[0.16em] text-[#7A6C62]">
          REJECTED
        </span>

        <span className="font-serif text-xl">
          {story.score}
        </span>
      </div>

      <h3 className="mt-4 font-serif text-[17px] leading-5">
        {story.title}
      </h3>

      <p className="mt-3 text-[10px] leading-5 text-[#76685D]">
        {story.reason}
      </p>

      <div className="mt-4 h-px bg-[#76695E]/10" />

      <p className="mt-3 text-[7px] tracking-[0.16em] text-[#89796D]">
        BELOW EDITORIAL THRESHOLD
      </p>
    </motion.div>
  );
}

function BeliefCard({ belief }) {
  const tones = {
    olive: "bg-[#EFF1EA] text-[#66725C]",
    taupe: "bg-[#F0ECE7] text-[#675F59]",
    sand: "bg-[#F1ECE4] text-[#75685D]",
  };

  return (
    <motion.div
      whileHover={{
        y: -4,
        scale: 1.008,
      }}
      className="rounded-2xl border border-[#6B5A4D]/10 bg-white/28 p-4"
    >
      <span
        className={`inline-flex rounded-full px-2.5 py-1 text-[7px] tracking-[0.15em] ${
          tones[belief.tone]
        }`}
      >
        {belief.symbol} {belief.state}
      </span>

      <p className="mt-3 font-serif text-[15px] leading-5 text-[#433830]">
        {belief.text}
      </p>
    </motion.div>
  );
}

function MemoryCore() {
  return (
    <div className="relative h-[390px] overflow-hidden rounded-[24px] border border-[#6B5A4D]/10 bg-[#F7F1EA]/75">
      <div
        className="absolute inset-0 opacity-[0.075]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, #5B4B40 1px, transparent 0)",
          backgroundSize: "24px 24px",
        }}
      />

      <div className="absolute left-1/2 top-1/2 h-[260px] w-[260px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#DCCDBD]/25 blur-[80px]" />

      <svg className="absolute inset-0 h-full w-full">
        {memoryLinks.map(([a, b], index) => {
          const start = memoryNodes.find((node) => node.id === a);
          const end = memoryNodes.find((node) => node.id === b);

          return (
            <motion.line
              key={`${a}-${b}`}
              x1={`${start.x}%`}
              y1={`${start.y}%`}
              x2={`${end.x}%`}
              y2={`${end.y}%`}
              stroke="#76675B"
              strokeWidth="1"
              strokeOpacity="0.27"
              initial={{
                pathLength: 0,
                opacity: 0,
              }}
              animate={{
                pathLength: 1,
                opacity: 1,
              }}
              transition={{
                duration: 1.2,
                delay: index * 0.1,
              }}
            />
          );
        })}
      </svg>

      <div className="absolute left-5 top-5">
        <p className="text-[9px] font-semibold tracking-[0.16em]">
          MEMORY CONSTELLATION
        </p>

        <p className="mt-1 text-[8px] text-[#8A7B6F]">
          Previous arguments remain connected
        </p>
      </div>

      {memoryNodes.map((node, index) => (
        <motion.div
          key={node.id}
          initial={{
            opacity: 0,
            scale: 0,
          }}
          animate={{
            opacity: 1,
            scale: 1,
          }}
          transition={{
            delay: 0.2 + index * 0.1,
            type: "spring",
            stiffness: 130,
          }}
          whileHover={{
            scale: 1.14,
          }}
          className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer"
          style={{
            left: `${node.x}%`,
            top: `${node.y}%`,
          }}
        >
          <motion.div
            animate={{
              boxShadow: [
                "0 0 0 rgba(75,61,51,0)",
                node.primary
                  ? "0 0 42px rgba(75,61,51,.20)"
                  : "0 0 24px rgba(75,61,51,.12)",
                "0 0 0 rgba(75,61,51,0)",
              ],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              delay: index * 0.3,
            }}
            className={`flex items-center justify-center rounded-full border backdrop-blur-xl ${
              node.primary
                ? "border-[#51433A]/20 bg-[#E7DDD3]/92"
                : "border-[#6B5A4D]/12 bg-[#FBF7F2]/90"
            }`}
            style={{
              width: `${node.size * 4}px`,
              height: `${node.size * 4}px`,
            }}
          >
            <span className="px-2 text-center text-[8px] leading-3 tracking-[0.07em] text-[#51443B]">
              {node.label}
            </span>
          </motion.div>
        </motion.div>
      ))}

      <div className="absolute bottom-5 right-5 flex items-center gap-2 rounded-full border border-[#66564A]/10 bg-[#FBF7F2]/65 px-3 py-2 backdrop-blur-xl">
        <span className="h-1.5 w-1.5 rounded-full bg-[#75856A]" />

        <span className="text-[7px] tracking-[0.16em] text-[#75665B]">
          7 ACTIVE CLUSTERS
        </span>
      </div>
    </div>
  );
}

function AnalyticsCard({ label, value, detail }) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="rounded-2xl border border-[#6B5A4D]/10 bg-white/30 p-4"
    >
      <p className="text-[7px] tracking-[0.17em] text-[#8A7B70]">
        {label.toUpperCase()}
      </p>

      <p className="mt-3 font-serif text-3xl">
        {value}
      </p>

      <p className="mt-2 text-[8px] text-[#7E7065]">
        {detail}
      </p>
    </motion.div>
  );
}

function StatusCard({
  icon: Icon,
  label,
  status,
  detail,
}) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="rounded-2xl border border-[#6B5A4D]/10 bg-white/30 p-4"
    >
      <div className="flex items-center justify-between">
        <Icon size={16} strokeWidth={1.5} />

        <span className="h-1.5 w-1.5 rounded-full bg-[#75856A]" />
      </div>

      <p className="mt-4 text-[10px] font-medium">
        {label}
      </p>

      <p className="mt-2 text-[7px] tracking-[0.16em] text-[#66725C]">
        {status}
      </p>

      <p className="mt-1 text-[8px] text-[#84766B]">
        {detail}
      </p>
    </motion.div>
  );
}