"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { questions } from "@/lib/questions";
import Image from "next/image";

interface Response {
  id: number;
  overall: number | null;
  relevance: number | null;
  confidence: number | null;
  useful_topics: string[];
  would_recommend: number | null;
  feedback: string | null;
  created_at: string;
}

export default function ResultsPage() {
  const [responses, setResponses] = useState<Response[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    const { data } = await supabase
      .from("responses")
      .select("*")
      .order("created_at", { ascending: true });
    if (data) setResponses(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAll();

    const channel = supabase
      .channel("responses-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "responses" },
        (payload) => {
          setResponses((prev) => [...prev, payload.new as Response]);
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "responses" },
        () => {
          fetchAll();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchAll]);

  const count = responses.length;

  function getRatingData(qId: string) {
    const q = questions.find((q) => q.id === qId)!;
    const vals = responses.map((r) => (r as unknown as Record<string, unknown>)[qId] as number).filter((v) => v != null);
    const avg = vals.length ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1) : "—";
    const dist: Record<number, number> = {};
    for (let i = q.min!; i <= q.max!; i++) dist[i] = 0;
    vals.forEach((v) => dist[v]++);
    const maxCount = Math.max(...Object.values(dist), 1);
    return { avg, dist, maxCount, q };
  }

  function getMultiData(qId: string) {
    const q = questions.find((q) => q.id === qId)!;
    const counts: Record<string, number> = {};
    q.options!.forEach((o) => (counts[o] = 0));
    responses.forEach((r) => {
      const sel = (r as unknown as Record<string, unknown>)[qId] as string[] | null;
      if (sel) sel.forEach((s) => { if (counts[s] != null) counts[s]++; });
    });
    const maxC = Math.max(...Object.values(counts), 1);
    return { counts, maxC, q };
  }

  function getTextData(qId: string) {
    return responses
      .map((r) => (r as unknown as Record<string, unknown>)[qId] as string | null)
      .filter((t): t is string => !!t && t.trim().length > 0);
  }

  // Separate questions by type for layout
  const ratingQs = questions.filter((q) => q.type === "rating");
  const multiQs = questions.filter((q) => q.type === "multi");
  const textQs = questions.filter((q) => q.type === "text");

  if (loading) {
    return (
      <div style={styles.viewport}>
        <div style={styles.header}>
          <Image src="/logo-white.png" alt="Homeplay" width={140} height={28} style={{ height: 24, width: "auto" }} />
        </div>
        <div style={{ ...styles.body, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--sage)" }}>
          Loading results...
        </div>
      </div>
    );
  }

  return (
    <div style={styles.viewport}>
      {/* Header bar */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <Image src="/logo-white.png" alt="Homeplay" width={140} height={24} style={{ height: 22, width: "auto" }} />
        </div>
        <div style={styles.headerCenter}>
          <span style={styles.headerTitle}>AI for Interior Design — Live Results</span>
        </div>
        <div style={styles.headerRight}>
          <span style={styles.liveDot} />
          <span style={styles.responsesBadge}>{count} response{count !== 1 ? "s" : ""}</span>
        </div>
      </div>

      {/* Main content area — fills remaining viewport */}
      <div style={styles.body}>
        {count === 0 ? (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#828073" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <p style={{ fontSize: "1.2vw", color: "var(--sage)", marginTop: "1vh" }}>Waiting for responses...</p>
          </div>
        ) : (
          <div style={styles.grid}>
            {/* Row 1: Rating cards — 4 across the top */}
            {ratingQs.slice(0, 4).map((q) => {
              const { avg, dist, maxCount } = getRatingData(q.id);
              return (
                <div style={styles.card} key={q.id}>
                  <div style={styles.cardLabel}>{q.text}</div>
                  <div style={styles.avgRow}>
                    <span style={styles.avgNumber}>{avg}</span>
                    <span style={styles.avgSuffix}>/ 5</span>
                  </div>
                  <div style={styles.barsContainer}>
                    {Array.from({ length: q.max! - q.min! + 1 }, (_, i) => q.min! + i).map((n) => (
                      <div style={styles.barRow} key={n}>
                        <span style={styles.barLabel}>{n}</span>
                        <div style={styles.barTrack}>
                          <div style={{ ...styles.barFill, width: `${(dist[n] / maxCount) * 100}%` }} />
                        </div>
                        <span style={styles.barCount}>{dist[n]}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            {/* Row 2: Multi-choice + text feedback + remaining rating */}
            {multiQs.map((q) => {
              const { counts, maxC } = getMultiData(q.id);
              return (
                <div style={{ ...styles.card, ...styles.cardWide }} key={q.id}>
                  <div style={styles.cardLabel}>{q.text}</div>
                  <div style={styles.barsContainer}>
                    {q.options!.map((opt) => (
                      <div style={styles.barRow} key={opt}>
                        <span style={styles.barLabelWide} title={opt}>
                          {opt.length > 30 ? opt.substring(0, 30) + "..." : opt}
                        </span>
                        <div style={styles.barTrack}>
                          <div style={{ ...styles.barFill, width: `${(counts[opt] / maxC) * 100}%` }} />
                        </div>
                        <span style={styles.barCount}>{counts[opt]}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            {/* Remaining rating (would_recommend) */}
            {ratingQs.slice(4).map((q) => {
              const { avg, dist, maxCount } = getRatingData(q.id);
              return (
                <div style={styles.card} key={q.id}>
                  <div style={styles.cardLabel}>{q.text}</div>
                  <div style={styles.avgRow}>
                    <span style={styles.avgNumber}>{avg}</span>
                    <span style={styles.avgSuffix}>/ 5</span>
                  </div>
                  <div style={styles.barsContainer}>
                    {Array.from({ length: q.max! - q.min! + 1 }, (_, i) => q.min! + i).map((n) => (
                      <div style={styles.barRow} key={n}>
                        <span style={styles.barLabel}>{n}</span>
                        <div style={styles.barTrack}>
                          <div style={{ ...styles.barFill, width: `${(dist[n] / maxCount) * 100}%` }} />
                        </div>
                        <span style={styles.barCount}>{dist[n]}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            {/* Text feedback */}
            {textQs.map((q) => {
              const texts = getTextData(q.id);
              return (
                <div style={styles.card} key={q.id}>
                  <div style={styles.cardLabel}>{q.text}</div>
                  <div style={styles.textFeedback}>
                    {texts.length === 0 ? (
                      <span style={{ color: "var(--sage)", fontSize: "0.8vw" }}>No written feedback yet</span>
                    ) : (
                      texts.slice(-6).map((t, i) => (
                        <div style={styles.textItem} key={i}>{t}</div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Inline styles using viewport units for full-screen scaling ── */

const styles: Record<string, React.CSSProperties> = {
  viewport: {
    width: "100vw",
    height: "100vh",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    background: "#f8f0eb",
  },

  /* Header */
  header: {
    background: "#111111",
    padding: "1.2vh 2vw",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexShrink: 0,
  },
  headerLeft: {
    flex: "0 0 auto",
  },
  headerCenter: {
    flex: 1,
    textAlign: "center",
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: "1.1vw",
    fontWeight: 500,
    letterSpacing: "0.02em",
    opacity: 0.9,
  },
  headerRight: {
    flex: "0 0 auto",
    display: "flex",
    alignItems: "center",
    gap: "0.5vw",
  },
  liveDot: {
    display: "inline-block",
    width: "0.5vw",
    height: "0.5vw",
    minWidth: 6,
    minHeight: 6,
    background: "#22c55e",
    borderRadius: "50%",
    animation: "pulse 2s ease-in-out infinite",
  },
  responsesBadge: {
    color: "#FFFFFF",
    fontSize: "0.9vw",
    fontWeight: 600,
    opacity: 0.9,
  },

  /* Body */
  body: {
    flex: 1,
    overflow: "hidden",
    padding: "1.5vh 1.5vw",
  },

  /* Grid — 4 columns, 2 rows */
  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr 1fr",
    gridTemplateRows: "1fr 1fr",
    gap: "1.2vh 1vw",
    height: "100%",
  },

  /* Cards */
  card: {
    background: "#FFFFFF",
    borderRadius: "0.8vw",
    padding: "1.5vh 1.2vw",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
  },
  cardWide: {
    gridColumn: "1 / 3",
  },
  cardLabel: {
    fontSize: "0.85vw",
    fontWeight: 500,
    color: "#828073",
    marginBottom: "1vh",
    lineHeight: 1.3,
  },

  /* Average display */
  avgRow: {
    display: "flex",
    alignItems: "baseline",
    gap: "0.3vw",
    marginBottom: "0.8vh",
  },
  avgNumber: {
    fontSize: "2.5vw",
    fontWeight: 700,
    color: "#111111",
    lineHeight: 1,
  },
  avgSuffix: {
    fontSize: "0.9vw",
    color: "#828073",
  },

  /* Bars */
  barsContainer: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-evenly",
  },
  barRow: {
    display: "flex",
    alignItems: "center",
    gap: "0.4vw",
  },
  barLabel: {
    width: "1.2vw",
    textAlign: "right" as const,
    fontSize: "0.75vw",
    color: "#828073",
    fontWeight: 500,
    flexShrink: 0,
  },
  barLabelWide: {
    width: "8vw",
    textAlign: "left" as const,
    fontSize: "0.7vw",
    color: "#828073",
    fontWeight: 500,
    flexShrink: 0,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap" as const,
  },
  barTrack: {
    flex: 1,
    height: "1.5vh",
    background: "#F2E0D6",
    borderRadius: "0.3vw",
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    background: "#707052",
    borderRadius: "0.3vw",
    transition: "width 0.5s ease",
  },
  barCount: {
    width: "1.5vw",
    fontSize: "0.75vw",
    fontWeight: 600,
    color: "#111111",
    flexShrink: 0,
  },

  /* Text feedback */
  textFeedback: {
    flex: 1,
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    gap: "0.6vh",
  },
  textItem: {
    fontSize: "0.8vw",
    color: "#111111",
    lineHeight: 1.4,
    padding: "0.6vh 0",
    borderBottom: "1px solid #F2E0D6",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap" as const,
  },

  /* Empty state */
  emptyState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
  },
  emptyIcon: {
    opacity: 0.5,
  },
};
