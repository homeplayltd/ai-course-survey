"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { questions } from "@/lib/questions";
import Image from "next/image";

type Answers = Record<string, number | string | string[]>;

export default function SurveyPage() {
  const [screen, setScreen] = useState<"welcome" | "survey" | "thanks">("welcome");
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [submitting, setSubmitting] = useState(false);

  const q = questions[currentQ];
  const total = questions.length;

  function setAnswer(id: string, value: number | string | string[]) {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  }

  function toggleMulti(id: string, option: string) {
    const current = (answers[id] as string[]) || [];
    const idx = current.indexOf(option);
    if (idx > -1) {
      setAnswer(id, current.filter((o) => o !== option));
    } else {
      setAnswer(id, [...current, option]);
    }
  }

  async function submit() {
    setSubmitting(true);
    try {
      await supabase.from("responses").insert({
        overall: answers.overall || null,
        relevance: answers.relevance || null,
        confidence: answers.confidence || null,
        useful_topics: answers.useful_topics || [],
        would_recommend: answers.would_recommend || null,
        feedback: answers.feedback || null,
      });
    } catch (e) {
      console.error("Submit error:", e);
    }
    setSubmitting(false);
    setScreen("thanks");
  }

  return (
    <>
      <div className="header">
        <Image src="/logo-white.png" alt="Homeplay" width={140} height={28} style={{ height: 28, width: "auto" }} />
      </div>

      <div className="container">
        {/* WELCOME */}
        {screen === "welcome" && (
          <div className="welcome">
            <h1>AI for Interior Design</h1>
            <p>Thank you for attending today&apos;s session. We&apos;d love your feedback — it only takes a minute.</p>
            <button className="btn-primary" onClick={() => setScreen("survey")}>
              Start Survey
            </button>
          </div>
        )}

        {/* SURVEY */}
        {screen === "survey" && (
          <>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${((currentQ + 1) / total) * 100}%` }} />
            </div>
            <div className="progress-text">{currentQ + 1} of {total}</div>

            <div className="question-card" key={q.id}>
              <h2>{q.text}</h2>

              {q.type === "rating" && (
                <>
                  <div className="rating-group">
                    {Array.from({ length: q.max! - q.min! + 1 }, (_, i) => q.min! + i).map((n) => (
                      <label key={n} onClick={() => setAnswer(q.id, n)}>
                        <span className={`rating-btn${answers[q.id] === n ? " selected" : ""}`}>{n}</span>
                      </label>
                    ))}
                  </div>
                  <div className="rating-labels">
                    <span>{q.labels![0]}</span>
                    <span>{q.labels![1]}</span>
                  </div>
                </>
              )}

              {q.type === "multi" && (
                <div className="choice-group">
                  {q.options!.map((opt) => {
                    const selected = ((answers[q.id] as string[]) || []).includes(opt);
                    return (
                      <div
                        key={opt}
                        className={`choice-label${selected ? " selected" : ""}`}
                        onClick={() => toggleMulti(q.id, opt)}
                      >
                        {opt}
                      </div>
                    );
                  })}
                </div>
              )}

              {q.type === "text" && (
                <textarea
                  className="text-input"
                  placeholder={q.placeholder}
                  value={(answers[q.id] as string) || ""}
                  onChange={(e) => setAnswer(q.id, e.target.value)}
                />
              )}
            </div>

            <div className="nav-buttons">
              {currentQ > 0 && (
                <button className="btn-secondary" onClick={() => setCurrentQ(currentQ - 1)}>Back</button>
              )}
              {currentQ < total - 1 ? (
                <button className="btn-primary" onClick={() => setCurrentQ(currentQ + 1)}>Next</button>
              ) : (
                <button className="btn-primary" onClick={submit} disabled={submitting}>
                  {submitting ? "Submitting..." : "Submit"}
                </button>
              )}
            </div>
          </>
        )}

        {/* THANKS */}
        {screen === "thanks" && (
          <div className="thank-you">
            <div className="checkmark">
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="32" height="32">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h1>Thank you</h1>
            <p>Your feedback helps us shape future sessions and improve how we support the design community.</p>
          </div>
        )}
      </div>
    </>
  );
}
