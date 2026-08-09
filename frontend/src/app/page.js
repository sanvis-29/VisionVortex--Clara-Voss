"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";

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
  RefreshCw,
} from "lucide-react";

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
} from "recharts";

import {
  getClaraStatus,
  getClaraTopics,
  getClaraFeed,
  getClaraMemory,
} from "../lib/claraApi";

/* =========================================================
   NAVIGATION
========================================================= */

const navItems = [
  { id: "overview", label: "Overview", icon: HomeIcon },
  { id: "signals", label: "Signal Stream", icon: Radio },
  { id: "newsroom", label: "Newsroom", icon: Newspaper },
  { id: "published", label: "Published", icon: Send },
  { id: "rejected", label: "Not Published", icon: XCircle },
  { id: "beliefs", label: "Beliefs", icon: Brain },
  { id: "memory", label: "Memory Core", icon: Network },
  { id: "analytics", label: "Analytics", icon: Activity },
  { id: "system", label: "System Status", icon: Settings },
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

const validStates = [
  "OBSERVING",
  "ANALYZING",
  "INTRIGUED",
  "SKEPTICAL",
  "PUBLISHING",
  "REFLECTING",
];

/* =========================================================
   FALLBACKS
========================================================= */

const fallbackStatus = {
  id: "clara_voss",
  state: "OBSERVING",
  active: true,
  cycle_status: "SILENCE",
  discovered: 0,
  rejected: 0,
  published: 0,
  message: "Waiting for Clara's next editorial cycle.",
  started_at: null,
  finished_at: null,
};

const fallbackBeliefs = [
  {
    id: "belief_1",
    text:
      "AI agents become meaningful when they can take actions, not merely generate text.",
    status: "STABLE",
    strength: 0.85,
  },
  {
    id: "belief_2",
    text: "Inference economics matter more than benchmark headlines.",
    status: "STABLE",
    strength: 0.75,
  },
];

/* =========================================================
   HELPERS
========================================================= */

function normalizeState(state) {
  const value = String(state || "OBSERVING").toUpperCase();

  if (validStates.includes(value)) {
    return value;
  }

  return "OBSERVING";
}

function formatTime(value) {
  if (!value) return "—";

  try {
    return new Intl.DateTimeFormat("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return "—";
  }
}

function getSignalCategory(topic) {
  const title = `${topic?.title || ""} ${topic?.summary || ""}`.toLowerCase();

  if (title.includes("agent")) return "AI AGENTS";
  if (title.includes("open source") || title.includes("open-source"))
    return "OPEN SOURCE";
  if (title.includes("security") || title.includes("attack"))
    return "AI SECURITY";
  if (title.includes("model") || title.includes("deepseek"))
    return "AI MODELS";
  if (title.includes("inference")) return "INFRASTRUCTURE";

  return "TECH SIGNAL";
}

function beliefPresentation(status) {
  const normalized = String(status || "STABLE").toUpperCase();

  if (normalized === "STRENGTHENED") {
    return {
      symbol: "↑",
      tone: "olive",
    };
  }

  if (normalized === "CHALLENGED") {
    return {
      symbol: "↓",
      tone: "sand",
    };
  }

  return {
    symbol: "→",
    tone: "taupe",
  };
}

function buildMemoryGraph(memories) {
  const base = [];

  const positions = [
    { x: 50, y: 50, size: 19 },
    { x: 25, y: 26, size: 12 },
    { x: 75, y: 25, size: 11 },
    { x: 78, y: 68, size: 10 },
    { x: 27, y: 72, size: 12 },
    { x: 52, y: 83, size: 9 },
    { x: 49, y: 18, size: 8 },
  ];

  const labels = [];

  memories.forEach((memory) => {
    if (memory?.topic) labels.push(memory.topic);

    (memory?.entities || []).forEach((entity) => {
      labels.push(entity);
    });
  });

  const unique = [...new Set(labels)].slice(0, 7);

  if (unique.length === 0) {
    unique.push("Editorial Memory");
  }

  unique.forEach((label, index) => {
    const position = positions[index] || positions[positions.length - 1];

    base.push({
      id: index + 1,
      label,
      x: position.x,
      y: position.y,
      size: position.size,
      primary: index === 0,
    });
  });

  const links = [];

  for (let index = 1; index < base.length; index++) {
    links.push([1, index + 1]);
  }

  return {
    nodes: base,
    links,
  };
}

/* =========================================================
   PAGE
========================================================= */

export default function Home() {
  const [status, setStatus] = useState(fallbackStatus);
  const [topics, setTopics] = useState([]);
  const [posts, setPosts] = useState([]);
  const [memories, setMemories] = useState([]);
  const [beliefs, setBeliefs] = useState(fallbackBeliefs);

  const [claraState, setClaraState] = useState("OBSERVING");
  const [mouse, setMouse] = useState({ x: 700, y: 400 });
  const [activeSection, setActiveSection] = useState("overview");

  const [loading, setLoading] = useState(true);
  const [backendConnected, setBackendConnected] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(null);

  const scrollContainer = useRef(null);

  /* =========================================================
     BACKEND FETCH
  ========================================================= */

  async function loadClaraData() {
    try {
      const [statusData, topicsData, feedData, memoryData] =
        await Promise.all([
          getClaraStatus(),
          getClaraTopics(),
          getClaraFeed(),
          getClaraMemory(),
        ]);

      if (statusData) {
        setStatus(statusData);
        setClaraState(normalizeState(statusData.state));
        setBackendConnected(true);
      }

      if (Array.isArray(topicsData?.topics)) {
        setTopics(topicsData.topics);
      }

      if (Array.isArray(feedData?.posts)) {
        setPosts(feedData.posts);
      }

      if (Array.isArray(memoryData?.memories)) {
        setMemories(memoryData.memories);
      }

      if (
        Array.isArray(memoryData?.beliefs) &&
        memoryData.beliefs.length > 0
      ) {
        setBeliefs(memoryData.beliefs);
      }

      setLastRefresh(new Date());
    } catch (error) {
      console.error("Clara frontend integration error:", error);
      setBackendConnected(false);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadClaraData();

    const interval = setInterval(() => {
      loadClaraData();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  /* =========================================================
     DERIVED DATA
  ========================================================= */

  const topCandidate = topics[0] || null;

  const radarData = useMemo(() => {
    const breakdown = topCandidate?.breakdown || {};

    return [
      {
        subject: "Impact",
        value: breakdown.consequence ?? 0,
      },
      {
        subject: "Novelty",
        value: breakdown.novelty ?? 0,
      },
      {
        subject: "Relevance",
        value: breakdown.relevance ?? 0,
      },
      {
        subject: "Credibility",
        value: breakdown.credibility ?? 0,
      },
      {
        subject: "Timeliness",
        value: breakdown.timeliness ?? 0,
      },
      {
        subject: "Discussion",
        value: breakdown.discussion_potential ?? 0,
      },
    ];
  }, [topCandidate]);

  const signals = useMemo(() => {
    return topics.slice(0, 5).map((topic, index) => ({
      id: topic.external_id || `topic-${index}`,
      time: formatTime(topic.published_at),
      title: topic.title,
      category: getSignalCategory(topic),
      score: topic.score ?? 0,
      decision: topic.decision,
      active: index === 0,
      source: topic.source,
      reason: topic.reason,
    }));
  }, [topics]);

  const rejectedStories = useMemo(() => {
    return topics
      .filter((topic) => topic.decision !== "PUBLISH")
      .map((topic) => ({
        title: topic.title,
        score: topic.score,
        decision: topic.decision,
        reason: topic.reason,
      }));
  }, [topics]);

  const visualBeliefs = useMemo(() => {
    return beliefs.map((belief) => {
      const presentation = beliefPresentation(belief.status);

      return {
        ...belief,
        state: belief.status || "STABLE",
        symbol: presentation.symbol,
        tone: presentation.tone,
      };
    });
  }, [beliefs]);

  const memoryGraph = useMemo(
    () => buildMemoryGraph(memories),
    [memories]
  );

  const actualRejects = topics.filter(
    (topic) => topic.decision === "REJECT"
  ).length;

  const watchCount = topics.filter(
    (topic) => topic.decision === "WATCH"
  ).length;

  const avgSalience =
    topics.length > 0
      ? (
          topics.reduce(
            (sum, item) => sum + Number(item.score || 0),
            0
          ) / topics.length
        ).toFixed(1)
      : "0.0";

  const rejectionRate =
    status.discovered > 0
      ? `${Math.round(
          ((status.discovered - Number(status.published || 0)) /
            status.discovered) *
            100
        )}%`
      : "0%";

  const salience = Number(topCandidate?.score || 0);

  const hypePenalty =
    topCandidate?.breakdown?.hype_penalty ?? 0;

  const repetitionPenalty =
    topCandidate?.breakdown?.repetition_penalty ?? 0;

  /* =========================================================
     INTERACTION
  ========================================================= */

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
      {/* =====================================================
          BACKGROUND
      ===================================================== */}

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
        {/* =====================================================
            SIDEBAR
        ===================================================== */}

        <aside className="z-30 h-screen border-r border-[#5F5045]/10 bg-[#FAF6F0]/82 p-5 backdrop-blur-2xl">
          <div className="mb-8">
            <div className="flex items-center gap-3">
              <motion.div
                whileHover={{
                  rotate: 8,
                  scale: 1.06,
                }}
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
            {navItems.map(
              ({ id, label, icon: Icon }) => {
                const active =
                  activeSection === id;

                return (
                  <motion.button
                    whileHover={{
                      x: active ? 0 : 4,
                    }}
                    whileTap={{
                      scale: 0.98,
                    }}
                    key={id}
                    onClick={() =>
                      goToSection(id)
                    }
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[11px] transition ${
                      active
                        ? "bg-[#473A32] text-[#FFFDF9] shadow-[0_8px_20px_rgba(60,48,40,.12)]"
                        : "text-[#594A40] hover:bg-[#E9DED3]"
                    }`}
                  >
                    <Icon
                      size={14}
                      strokeWidth={1.6}
                    />

                    {label}
                  </motion.button>
                );
              }
            )}
          </nav>

          {/* CORE */}

          <div className="mt-6 rounded-[24px] border border-[#766558]/10 bg-white/40 p-4 backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <p className="text-[8px] tracking-[0.2em] text-[#816F61]">
                CLARA CORE
              </p>

              <span className="relative flex h-2 w-2">
                <span
                  className={`absolute h-full w-full animate-ping rounded-full ${
                    backendConnected
                      ? "bg-[#75856A]"
                      : "bg-[#A89A8C]"
                  } opacity-40`}
                />

                <span
                  className={`relative h-2 w-2 rounded-full ${
                    backendConnected
                      ? "bg-[#75856A]"
                      : "bg-[#A89A8C]"
                  }`}
                />
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
                  scale: [
                    0.8,
                    1.1,
                    0.8,
                  ],
                  opacity: [
                    0.35,
                    0.9,
                    0.35,
                  ],
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

        {/* =====================================================
            MAIN
        ===================================================== */}

        <section
          ref={scrollContainer}
          className="h-screen overflow-y-auto scroll-smooth p-6 xl:p-7"
        >
          <div className="mx-auto max-w-[1550px]">
            {/* =================================================
                OVERVIEW
            ================================================= */}

            <section
              id="overview"
              className="scroll-mt-6"
            >
              <motion.div
                initial={{
                  opacity: 0,
                  y: -10,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                className="mb-5 flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                      <span className="absolute h-full w-full animate-ping rounded-full bg-[#75856A] opacity-40" />
                      <span className="relative h-2 w-2 rounded-full bg-[#75856A]" />
                    </span>

                    <p className="text-[10px] tracking-[0.22em] text-[#706157]">
                      {backendConnected
                        ? "SYSTEM ACTIVE"
                        : "LOCAL VISUAL MODE"}
                    </p>
                  </div>

                  <p className="mt-1.5 text-xs text-[#7B6C61]">
                    {loading
                      ? "Synchronizing with Clara..."
                      : status.message ||
                        "Clara is operating independently."}
                  </p>
                </div>

                <div className="flex items-center gap-6 rounded-2xl border border-white/50 bg-[#FBF8F4]/75 px-6 py-3 backdrop-blur-xl">
                  <Metric
                    label="DISCOVERED"
                    value={
                      status.discovered ?? 0
                    }
                  />

                  <Metric
                    label="NOT PUBLISHED"
                    value={
                      status.rejected ?? 0
                    }
                  />

                  <Metric
                    label="PUBLISHED"
                    value={
                      status.published ?? 0
                    }
                  />

                  <motion.button
                    whileHover={{
                      rotate: 20,
                    }}
                    onClick={loadClaraData}
                    className="text-[#77685E]"
                  >
                    <RefreshCw size={14} />
                  </motion.button>
                </div>
              </motion.div>

              <div className="grid gap-4 xl:grid-cols-[1.35fr_1fr_0.95fr]">
                {/* =============================================
                    CLARA HERO
                ============================================= */}

                <motion.div
                  initial={{
                    opacity: 0,
                    y: 20,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  className="group relative min-h-[510px] overflow-hidden rounded-[32px] border border-white/50 bg-[#D9CBBB] shadow-[0_20px_65px_rgba(53,42,34,.08)]"
                >
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={claraState}
                      initial={{
                        opacity: 0,
                        scale: 1.035,
                        filter:
                          "blur(7px)",
                      }}
                      animate={{
                        opacity: 1,
                        scale: 1,
                        filter:
                          "blur(0px)",
                      }}
                      exit={{
                        opacity: 0,
                        scale: 0.985,
                        filter:
                          "blur(5px)",
                      }}
                      transition={{
                        duration: 0.85,
                      }}
                      className="absolute inset-0"
                    >
                      <Image
                        src={
                          claraImages[
                            claraState
                          ]
                        }
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
                    animate={{
                      top: [
                        "8%",
                        "92%",
                        "8%",
                      ],
                    }}
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
                      Autonomous AI Systems
                      Analyst
                    </p>

                    <div className="mt-11">
                      <p className="text-[8px] tracking-[0.25em] text-[#8C7B6E]">
                        CURRENT STATE
                      </p>

                      <div className="mt-2 flex items-center gap-2">
                        <Eye size={14} />

                        <AnimatePresence mode="wait">
                          <motion.p
                            key={
                              claraState
                            }
                            initial={{
                              opacity: 0,
                              x: -7,
                            }}
                            animate={{
                              opacity: 1,
                              x: 0,
                            }}
                            exit={{
                              opacity: 0,
                              x: 7,
                            }}
                            className="text-lg font-medium tracking-[0.16em]"
                          >
                            {claraState}
                          </motion.p>
                        </AnimatePresence>
                      </div>

                      <div className="mt-3 h-px w-[160px] overflow-hidden bg-[#756458]/20">
                        <motion.div
                          animate={{
                            x: [
                              "-100%",
                              "100%",
                            ],
                          }}
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
                          key={
                            claraState
                          }
                          initial={{
                            opacity: 0,
                            y: 8,
                          }}
                          animate={{
                            opacity: 1,
                            y: 0,
                          }}
                          exit={{
                            opacity: 0,
                            y: -8,
                          }}
                          className="mt-3 font-serif text-[17px] italic leading-6 text-[#443830]"
                        >
                          “
                          {
                            claraThoughts[
                              claraState
                            ]
                          }
                          ”
                        </motion.p>
                      </AnimatePresence>
                    </div>
                  </div>

                  <div className="absolute right-6 top-6 flex items-center gap-2 rounded-full border border-white/30 bg-[#F8F2EB]/55 px-3 py-2 backdrop-blur-xl">
                    <ScanSearch size={12} />

                    <span className="text-[8px] tracking-[0.18em]">
                      {status.cycle_status ||
                        "OBSERVING"}
                    </span>
                  </div>

                  <div className="absolute bottom-6 left-8 flex items-center gap-2 rounded-full border border-white/30 bg-[#FAF5EE]/60 px-4 py-2 backdrop-blur-xl">
                    <Clock3 size={12} />

                    <span className="text-[8px] tracking-[0.17em]">
                      LAST CYCLE ·{" "}
                      {formatTime(
                        status.finished_at
                      )}
                    </span>
                  </div>
                </motion.div>

                {/* =============================================
                    SIGNAL STREAM
                ============================================= */}

                <Panel>
                  <div
                    id="signals"
                    className="scroll-mt-7"
                  >
                    <SectionHeading
                      title="LIVE SIGNAL STREAM"
                      subtitle="Real candidates discovered by Clara"
                    />

                    <SignalVisualizer />

                    <div className="space-y-2">
                      {signals.length >
                      0 ? (
                        signals.map(
                          (
                            signal,
                            index
                          ) => (
                            <SignalCard
                              key={
                                signal.id
                              }
                              signal={
                                signal
                              }
                              index={
                                index
                              }
                            />
                          )
                        )
                      ) : (
                        <EmptyState text="Waiting for the next discovery cycle." />
                      )}
                    </div>
                  </div>
                </Panel>

                {/* =============================================
                    EDITORIAL BRAIN
                ============================================= */}

                <Panel>
                  <SectionHeading
                    title="EDITORIAL BRAIN"
                    subtitle={
                      topCandidate
                        ? "Current highest-ranked candidate"
                        : "Waiting for editorial evaluation"
                    }
                  />

                  <div className="mt-2 h-[230px]">
                    <ResponsiveContainer
                      width="100%"
                      height="100%"
                    >
                      <RadarChart
                        cx="50%"
                        cy="52%"
                        outerRadius="65%"
                        data={radarData}
                      >
                        <PolarGrid
                          stroke="#B4A699"
                          strokeOpacity={
                            0.35
                          }
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
                          fillOpacity={
                            0.22
                          }
                          strokeWidth={
                            1.6
                          }
                          animationDuration={
                            1300
                          }
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
                        <p className="font-serif text-4xl">
                          {salience.toFixed(
                            1
                          )}
                        </p>

                        <span className="mb-1 ml-1 text-[9px] text-[#8A7A6D]">
                          /100
                        </span>
                      </div>
                    </div>

                    <div className="text-right text-[8px] leading-5 text-[#7C6C61]">
                      <p>
                        HYPE −
                        {hypePenalty}
                      </p>

                      <p>
                        REPETITION −
                        {repetitionPenalty}
                      </p>
                    </div>
                  </div>

                  <div
                    className={`mt-4 w-full rounded-xl px-5 py-3 text-center text-[9px] tracking-[0.2em] ${
                      topCandidate?.decision ===
                      "PUBLISH"
                        ? "bg-[#3E342D] text-[#FFFDF9]"
                        : "bg-[#EAE1D8] text-[#65564A]"
                    }`}
                  >
                    {topCandidate
                      ? `${topCandidate.decision} · ${topCandidate.reason}`
                      : "AWAITING SIGNAL"}
                  </div>
                </Panel>
              </div>
            </section>

            {/* =================================================
                NEWSROOM
            ================================================= */}

            <section
              id="newsroom"
              className="scroll-mt-7 pt-5"
            >
              <Panel>
                <SectionHeading
                  title="NEWSROOM"
                  subtitle="What Clara considered, compared and decided"
                />

                <div className="mt-5 grid gap-3 md:grid-cols-4">
                  <BigStat
                    label="DISCOVERED"
                    value={
                      status.discovered ??
                      0
                    }
                  />

                  <BigStat
                    label="WATCH"
                    value={watchCount}
                  />

                  <BigStat
                    label="REJECTED"
                    value={actualRejects}
                  />

                  <BigStat
                    label="PUBLISHED"
                    value={
                      status.published ??
                      0
                    }
                  />
                </div>

                <div className="mt-5 rounded-2xl bg-[#E8DED4]/50 p-5">
                  <p className="text-[8px] tracking-[0.18em] text-[#77685E]">
                    EDITORIAL DISTRIBUTION
                  </p>

                  <div className="mt-4 flex h-[70px] items-end justify-between gap-2">
                    {topics.length > 0
                      ? topics.map(
                          (
                            topic,
                            index
                          ) => (
                            <motion.div
                              key={
                                topic.external_id ||
                                index
                              }
                              initial={{
                                height: 2,
                              }}
                              animate={{
                                height:
                                  Math.max(
                                    8,
                                    Number(
                                      topic.score ||
                                        0
                                    ) *
                                      0.7
                                  ),
                              }}
                              transition={{
                                duration:
                                  0.8,
                                delay:
                                  index *
                                  0.05,
                              }}
                              className="w-full rounded-t-full bg-[#6D5D51]/25"
                            />
                          )
                        )
                      : null}
                  </div>
                </div>
              </Panel>
            </section>

            {/* =================================================
                PUBLISHED
            ================================================= */}

            <section
              id="published"
              className="scroll-mt-7 pt-5"
            >
              <Panel>
                <SectionHeading
                  title="PUBLISHED"
                  subtitle="Stories Clara independently decided were worth saying"
                />

                {posts.length > 0 ? (
                  <div className="mt-5 grid gap-4 xl:grid-cols-2">
                    {posts.map(
                      (post, index) => (
                        <PublishedCard
                          key={
                            post.id ||
                            index
                          }
                          post={post}
                        />
                      )
                    )}
                  </div>
                ) : (
                  <SilenceCard
                    message={
                      status.message
                    }
                  />
                )}
              </Panel>
            </section>

            {/* =================================================
                REJECTED / WATCH
            ================================================= */}

            <section
              id="rejected"
              className="scroll-mt-7 pt-5"
            >
              <Panel>
                <SectionHeading
                  title="NOT PUBLISHED"
                  subtitle="Silence is also a decision"
                />

                <div className="mt-5 grid gap-3 xl:grid-cols-3">
                  {rejectedStories.length >
                  0 ? (
                    rejectedStories.map(
                      (
                        story,
                        index
                      ) => (
                        <RejectedCard
                          key={`${story.title}-${index}`}
                          story={story}
                        />
                      )
                    )
                  ) : (
                    <EmptyState text="No rejected stories stored yet." />
                  )}
                </div>
              </Panel>
            </section>

            {/* =================================================
                BELIEFS
            ================================================= */}

            <section
              id="beliefs"
              className="scroll-mt-7 pt-5"
            >
              <Panel>
                <div className="flex items-center justify-between">
                  <SectionHeading
                    title="CLARA'S WORLD MODEL"
                    subtitle="Persistent beliefs evolving with evidence"
                  />

                  <Brain
                    size={18}
                    strokeWidth={1.4}
                  />
                </div>

                <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  {visualBeliefs.map(
                    (belief) => (
                      <BeliefCard
                        key={
                          belief.id ||
                          belief.text
                        }
                        belief={
                          belief
                        }
                      />
                    )
                  )}
                </div>
              </Panel>
            </section>

            {/* =================================================
                MEMORY
            ================================================= */}

            <section
              id="memory"
              className="scroll-mt-7 pt-5"
            >
              <Panel>
                <div className="flex items-center justify-between">
                  <SectionHeading
                    title="MEMORY CORE"
                    subtitle={`${memories.length} persisted editorial memories`}
                  />

                  <Network
                    size={18}
                    strokeWidth={1.4}
                  />
                </div>

                <div className="mt-5">
                  <MemoryCore
                    nodes={
                      memoryGraph.nodes
                    }
                    links={
                      memoryGraph.links
                    }
                  />
                </div>
              </Panel>
            </section>

            {/* =================================================
                ANALYTICS
            ================================================= */}

            <section
              id="analytics"
              className="scroll-mt-7 pt-5"
            >
              <Panel>
                <SectionHeading
                  title="EDITORIAL ANALYTICS"
                  subtitle="How Clara is using attention"
                />

                <div className="mt-5 grid gap-3 md:grid-cols-4">
                  <AnalyticsCard
                    label="Average Salience"
                    value={avgSalience}
                    detail={`${topics.length} ranked candidates`}
                  />

                  <AnalyticsCard
                    label="Non-Publish Rate"
                    value={
                      rejectionRate
                    }
                    detail="Intentional selectivity"
                  />

                  <AnalyticsCard
                    label="Memory Store"
                    value={
                      memories.length
                    }
                    detail={`${visualBeliefs.length} persistent beliefs`}
                  />

                  <AnalyticsCard
                    label="Watch Queue"
                    value={watchCount}
                    detail="Signals below publish threshold"
                  />
                </div>
              </Panel>
            </section>

            {/* =================================================
                SYSTEM
            ================================================= */}

            <section
              id="system"
              className="scroll-mt-7 py-5"
            >
              <Panel>
                <SectionHeading
                  title="SYSTEM STATUS"
                  subtitle="Autonomous runtime health"
                />

                <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <StatusCard
                    icon={Cpu}
                    label="Editorial Engine"
                    status={
                      status.active
                        ? "ONLINE"
                        : "OFFLINE"
                    }
                    detail={
                      status.cycle_status ||
                      "Waiting"
                    }
                  />

                  <StatusCard
                    icon={Database}
                    label="Memory Store"
                    status="CONNECTED"
                    detail={`${memories.length} memories`}
                  />

                  <StatusCard
                    icon={Wifi}
                    label="Live Sources"
                    status={
                      backendConnected
                        ? "STREAMING"
                        : "DISCONNECTED"
                    }
                    detail={`${status.discovered || 0} latest discoveries`}
                  />

                  <StatusCard
                    icon={Server}
                    label="Backend API"
                    status={
                      backendConnected
                        ? "CONNECTED"
                        : "LOCAL FALLBACK"
                    }
                    detail={
                      lastRefresh
                        ? `Synced ${lastRefresh.toLocaleTimeString()}`
                        : "Not synced"
                    }
                  />
                </div>

                <div className="mt-5 flex items-center justify-between rounded-2xl bg-[#EAE1D8]/55 px-5 py-4">
                  <div>
                    <p className="text-[8px] tracking-[0.18em] text-[#817267]">
                      AUTONOMOUS EXECUTION
                    </p>

                    <p className="mt-1 text-xs text-[#4A3D34]">
                      GET requests only
                      observe saved state.
                      Generation remains
                      independent of the
                      frontend.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 text-[8px] tracking-[0.16em] text-[#66725C]">
                    <CheckCircle2
                      size={14}
                    />
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
      initial={{
        opacity: 0,
        y: 15,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      transition={{
        duration: 0.55,
      }}
      whileHover={{
        borderColor:
          "rgba(92,76,64,.16)",
      }}
      className="rounded-[28px] border border-[#66564A]/10 bg-[#FBF7F2]/82 p-5 shadow-[0_15px_45px_rgba(54,43,35,.045)] backdrop-blur-xl"
    >
      {children}
    </motion.div>
  );
}

function SectionHeading({
  title,
  subtitle,
}) {
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

      {[15, 35, 50, 68, 82].map(
        (position, index) => (
          <motion.div
            key={position}
            animate={{
              height: [
                5,
                18 + index * 3,
                8,
                25 - index * 2,
                5,
              ],
            }}
            transition={{
              duration:
                2 + index * 0.3,
              repeat: Infinity,
            }}
            style={{
              left: `${position}%`,
            }}
            className="absolute bottom-1/2 w-px bg-[#66564A]/35"
          />
        )
      )}
    </div>
  );
}

function SignalCard({
  signal,
  index,
}) {
  const watch =
    signal.decision === "WATCH";

  return (
    <motion.div
      initial={{
        opacity: 0,
        x: 20,
      }}
      animate={{
        opacity: 1,
        x: 0,
      }}
      transition={{
        delay:
          0.15 + index * 0.06,
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
            opacity: [
              0.2,
              0.6,
              0.2,
            ],
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

          <div className="mt-2 flex items-center justify-between gap-3">
            <span className="text-[7px] tracking-[0.16em] text-[#877568]">
              {signal.category}
            </span>

            <div className="flex items-center gap-2">
              <span
                className={`text-[7px] tracking-[0.12em] ${
                  watch
                    ? "text-[#84765F]"
                    : "text-[#76685D]"
                }`}
              >
                {signal.decision}
              </span>

              <span className="font-serif text-lg">
                {signal.score}
              </span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function BigStat({
  label,
  value,
}) {
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
            {post.topic ||
              "AI / TECHNOLOGY"}
          </span>
        </div>
      </div>

      <h3 className="mt-5 font-serif text-xl leading-6">
        {post.angle ||
          post.mainClaim ||
          "Clara's latest editorial decision"}
      </h3>

      <p className="mt-4 text-[11px] leading-5 text-[#65584E]">
        {post.text}
      </p>

      <div className="mt-5 rounded-xl bg-[#EFE7DE]/55 p-4">
        <p className="text-[7px] tracking-[0.18em] text-[#89796D]">
          CLARA&apos;S RATIONALE
        </p>

        <p className="mt-2 text-[10px] leading-5 text-[#62554B]">
          {post.rationale}
        </p>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <span className="text-[7px] text-[#8A7C71]">
          {formatTime(
            post.createdAt
          )}
        </span>

        {post.sources?.[0] && (
          <a
            href={post.sources[0]}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 text-[7px] tracking-[0.14em] text-[#65564A]"
          >
            SOURCE
            <ExternalLink
              size={10}
            />
          </a>
        )}
      </div>
    </motion.div>
  );
}

function SilenceCard({ message }) {
  return (
    <motion.div
      initial={{
        opacity: 0,
        scale: 0.98,
      }}
      animate={{
        opacity: 1,
        scale: 1,
      }}
      className="mt-5 rounded-[24px] border border-[#6B5A4D]/10 bg-[#F1E9E0]/65 p-7"
    >
      <p className="text-[8px] tracking-[0.22em] text-[#8A796D]">
        NO PUBLICATION
      </p>

      <h3 className="mt-4 font-serif text-2xl">
        Silence was the decision.
      </h3>

      <p className="mt-3 max-w-2xl text-[11px] leading-6 text-[#6D5E53]">
        {message ||
          "Clara reviewed the available signals and found none sufficiently consequential to justify publication."}
      </p>
    </motion.div>
  );
}

function RejectedCard({ story }) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="rounded-[22px] border border-[#6B5A4D]/10 bg-white/28 p-4"
    >
      <div className="flex items-center justify-between">
        <span className="text-[7px] tracking-[0.16em] text-[#7A6C62]">
          {story.decision}
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
        {story.decision ===
        "WATCH"
          ? "MONITORING · BELOW PUBLISH THRESHOLD"
          : "BELOW EDITORIAL THRESHOLD"}
      </p>
    </motion.div>
  );
}

function BeliefCard({ belief }) {
  const tones = {
    olive:
      "bg-[#EFF1EA] text-[#66725C]",
    taupe:
      "bg-[#F0ECE7] text-[#675F59]",
    sand:
      "bg-[#F1ECE4] text-[#75685D]",
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
          tones[belief.tone] ||
          tones.taupe
        }`}
      >
        {belief.symbol}{" "}
        {belief.state}
      </span>

      <p className="mt-3 font-serif text-[15px] leading-5 text-[#433830]">
        {belief.text}
      </p>

      {belief.strength !==
        undefined && (
        <p className="mt-3 text-[7px] tracking-[0.14em] text-[#8A7B70]">
          CONFIDENCE ·{" "}
          {Math.round(
            Number(
              belief.strength
            ) * 100
          )}
          %
        </p>
      )}
    </motion.div>
  );
}

function MemoryCore({
  nodes,
  links,
}) {
  return (
    <div className="relative h-[390px] overflow-hidden rounded-[24px] border border-[#6B5A4D]/10 bg-[#F7F1EA]/75">
      <div
        className="absolute inset-0 opacity-[0.075]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, #5B4B40 1px, transparent 0)",
          backgroundSize:
            "24px 24px",
        }}
      />

      <div className="absolute left-1/2 top-1/2 h-[260px] w-[260px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#DCCDBD]/25 blur-[80px]" />

      <svg className="absolute inset-0 h-full w-full">
        {links.map(
          ([a, b], index) => {
            const start =
              nodes.find(
                (node) =>
                  node.id === a
              );

            const end =
              nodes.find(
                (node) =>
                  node.id === b
              );

            if (
              !start ||
              !end
            ) {
              return null;
            }

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
                  delay:
                    index * 0.1,
                }}
              />
            );
          }
        )}
      </svg>

      <div className="absolute left-5 top-5">
        <p className="text-[9px] font-semibold tracking-[0.16em]">
          MEMORY CONSTELLATION
        </p>

        <p className="mt-1 text-[8px] text-[#8A7B6F]">
          Previous arguments remain
          connected
        </p>
      </div>

      {nodes.map(
        (node, index) => (
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
              delay:
                0.2 +
                index * 0.1,
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
                delay:
                  index * 0.3,
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
        )
      )}
    </div>
  );
}

function AnalyticsCard({
  label,
  value,
  detail,
}) {
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
        <Icon
          size={16}
          strokeWidth={1.5}
        />

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

function EmptyState({ text }) {
  return (
    <div className="rounded-2xl border border-[#6B5A4D]/10 bg-white/25 p-5 text-[10px] text-[#7A6C61]">
      {text}
    </div>
  );
}