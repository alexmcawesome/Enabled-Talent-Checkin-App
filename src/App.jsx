import { useState, useCallback } from "react";

// ─── Data ──────────────────────────────────────────────────────────────────
const EMPLOYEES = [
  { id: 1, name: "Marcus", fullName: "Marcus Johnson", role: "UX Researcher", company: "Apex Digital", disability: "Deaf / Hard of Hearing", avatar: "MJ", daysIn: 32, stage: "30-Day" },
  { id: 2, name: "Sofia", fullName: "Sofia Reyes", role: "Project Manager", company: "Meridian Group", disability: "Spinal Cord Injury", avatar: "SR", daysIn: 61, stage: "60-Day" },
  { id: 3, name: "David", fullName: "David Chen", role: "Software Engineer", company: "Northlight Labs", disability: "Autism Spectrum Disorder", avatar: "DC", daysIn: 93, stage: "90-Day" },
  { id: 4, name: "Priya", fullName: "Priya Patel", role: "Data Analyst", company: "Solstice Analytics", disability: "Visual Impairment (Low Vision)", avatar: "PP", daysIn: 31, stage: "30-Day" },
  { id: 5, name: "James", fullName: "James O'Brien", role: "Account Executive", company: "Crestwood Partners", disability: "PTSD / Anxiety Disorder", avatar: "JO", daysIn: 64, stage: "60-Day" },
  { id: 6, name: "Amara", fullName: "Amara Osei", role: "HR Specialist", company: "Vantage People Co.", disability: "Chronic Fatigue Syndrome", avatar: "AO", daysIn: 90, stage: "90-Day" },
  { id: 7, name: "Tyler", fullName: "Tyler Nguyen", role: "Marketing Coordinator", company: "Bloom Creative", disability: "Dyslexia / ADHD", avatar: "TN", daysIn: 33, stage: "30-Day" },
  { id: 8, name: "Rachel", fullName: "Rachel Kim", role: "Financial Analyst", company: "Harbor Capital", disability: "Bipolar II Disorder", avatar: "RK", daysIn: 62, stage: "60-Day" },
  { id: 9, name: "Carlos", fullName: "Carlos Martinez", role: "Operations Specialist", company: "Titan Logistics", disability: "Traumatic Brain Injury", avatar: "CM", daysIn: 91, stage: "90-Day" },
  { id: 10, name: "Fatima", fullName: "Fatima Al-Hassan", role: "Policy Analyst", company: "Civic Bridge Institute", disability: "Multiple Sclerosis", avatar: "FA", daysIn: 30, stage: "30-Day" },
];

const QUESTIONS = [
  { id: 1, text: "How would you describe your overall transition into your new role?", options: ["Excellent — I feel fully settled and confident", "Good — mostly smooth with minor adjustments still underway", "Mixed — some aspects are going well, others are challenging", "Difficult — I'm still struggling to find my footing"] },
  { id: 2, text: "Are the workplace accommodations currently in place meeting your needs?", options: ["Yes — everything is working well", "Mostly — there are small gaps but nothing critical", "Partially — I have unmet needs I haven't formally raised", "No — my current accommodations are insufficient"] },
  { id: 3, text: "How comfortable do you feel discussing your disability-related needs with your direct manager?", options: ["Very comfortable — open communication is established", "Somewhat comfortable — I'd raise something if it was urgent", "Uncomfortable — I worry about how it might be received", "I haven't needed to bring anything up yet"] },
  { id: 4, text: "Have you encountered any barriers related to your disability that are affecting your work?", options: ["No barriers — things are functioning smoothly", "Minor barriers — manageable but worth noting", "Moderate barriers — affecting productivity but I'm coping", "Significant barriers — this is impacting my performance"] },
  { id: 5, text: "How well does your team support your inclusion in meetings and collaborative projects?", options: ["Extremely well — I feel fully included and valued", "Generally well — the occasional miss but usually positive", "It varies — depends on the situation or team member", "There are consistent inclusion gaps I've noticed"] },
  { id: 6, text: "Are there technology tools, software, or physical environment changes that would meaningfully help you?", options: ["No — my current setup is well-optimized", "Maybe — there are a few things I'd like to explore", "Yes — I have specific tools in mind I haven't requested yet", "Yes — and I'm unsure how to request or access them"] },
  { id: 7, text: "Compared to when you first started, how would you rate your overall wellbeing at work?", options: ["Significantly improved — I feel much more settled", "Slightly improved — trending in the right direction", "About the same — no notable change", "It's become more challenging since I started"] },
];

const stageColors = {
  "30-Day": { bg: "#E8F4FD", text: "#1565C0", bar: "#1976D2" },
  "60-Day": { bg: "#FFF3E0", text: "#E65100", bar: "#F57C00" },
  "90-Day": { bg: "#E8F5E9", text: "#1B5E20", bar: "#388E3C" },
};

const sentimentConfig = {
  positive:  { label: "Positive",  color: "#166534", bg: "#F0FDF4", border: "#BBF7D0", dot: "#22C55E" },
  neutral:   { label: "Neutral",   color: "#713F12", bg: "#FFFBEB", border: "#FDE68A", dot: "#F59E0B" },
  "at-risk": { label: "At Risk",   color: "#991B1B", bg: "#FEF2F2", border: "#FECACA", dot: "#EF4444" },
};

// ─── Claude API helpers ─────────────────────────────────────────────────────
const ANTHROPIC_API_KEY = "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";
const ANTHROPIC_HEADERS = {
  "Content-Type": "application/json",
  "x-api-key": ANTHROPIC_API_KEY,
  "anthropic-version": "2023-06-01",
  "anthropic-dangerous-direct-browser-access": "true",
};
async function analyzeEmployeeSurvey(employee, answers, writeIns) {
  const qaText = QUESTIONS.map(q => {
    const ans = answers[q.id] || "No answer";
    const note = writeIns[q.id] ? `\n   Additional note: "${writeIns[q.id]}"` : "";
    return `Q: ${q.text}\nA: ${ans}${note}`;
  }).join("\n\n");

  const prompt = `You are an HR support analyst for Enabled Talent, a disability-inclusive staffing firm. Analyze this ${employee.stage} check-in survey for ${employee.fullName}, a ${employee.role} at ${employee.company} with ${employee.disability}.

SURVEY RESPONSES:
${qaText}

Respond ONLY with a JSON object — no preamble, no markdown. Format:
{
  "sentiment": "positive" | "neutral" | "at-risk",
  "summary": "2-3 sentence plain-English summary of how this employee is doing",
  "flags": ["flag1", "flag2"],
  "positives": ["positive1", "positive2"],
  "recommendAction": true | false,
  "actionNote": "If recommendAction is true, one sentence on what action to take"
}

Rules:
- sentiment "at-risk" if any significant barriers, insufficient accommodations, declining wellbeing, or discomfort with manager
- sentiment "positive" if transition is smooth, accommodations working, inclusion good, wellbeing improving
- sentiment "neutral" for mixed or stable-but-flat responses
- flags: list 1-3 specific concerns (empty array if none)
- positives: list 1-2 genuine strengths observed
- keep all text concise and professional`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: ANTHROPIC_HEADERS,
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      messages: [{ role: "user", content: prompt }]
    })
  });
  const data = await res.json();
  const text = data.content?.map(b => b.text || "").join("").replace(/```json|```/g, "").trim();
  return JSON.parse(text);
}

async function analyzeAggregateTrends(completedSurveys, analyses) {
  const summaries = completedSurveys.map(({ employee, answers, writeIns }) => {
    const analysis = analyses[employee.id];
    const qaText = QUESTIONS.map(q => `Q${q.id}: ${answers[q.id] || "N/A"}`).join(" | ");
    return `${employee.fullName} (${employee.stage}, ${employee.company}, ${employee.disability}):
  Sentiment: ${analysis?.sentiment || "pending"}
  Responses: ${qaText}
  Notes: ${Object.values(writeIns).filter(Boolean).join("; ") || "none"}`;
  }).join("\n\n");

  const prompt = `You are a senior HR analytics consultant for Enabled Talent, reviewing check-in data across ${completedSurveys.length} recent placements.

COMPLETED CHECK-IN DATA:
${summaries}

Respond ONLY with a JSON object — no preamble, no markdown. Format:
{
  "overallHealth": "strong" | "mixed" | "concerning",
  "headline": "One punchy sentence summarizing the portfolio",
  "trends": [
    { "title": "trend name", "detail": "1-2 sentence explanation", "type": "positive" | "warning" | "info" }
  ],
  "topRisks": ["risk1", "risk2"],
  "recommendations": ["rec1", "rec2", "rec3"],
  "atRiskCount": number,
  "positiveCount": number
}

Rules:
- Identify 2-4 meaningful trends across employees (patterns, common themes, disability-specific issues)
- topRisks: 1-3 most urgent issues requiring action (empty array if none)
- recommendations: 2-4 concrete actions Enabled Talent should take
- Be specific and actionable — reference specific employees or patterns by name`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: ANTHROPIC_HEADERS,
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1500,
      messages: [{ role: "user", content: prompt }]
    })
  });
  const data = await res.json();
  const text = data.content?.map(b => b.text || "").join("").replace(/```json|```/g, "").trim();
  return JSON.parse(text);
}

// ─── Main App ───────────────────────────────────────────────────────────────
export default function App() {
  const [view, setView] = useState("dashboard");
  const [activeEmployee, setActiveEmployee] = useState(null);
  const [surveyPhase, setSurveyPhase] = useState("email");
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState({});
  const [writeIns, setWriteIns] = useState({});
  const [wantsContact, setWantsContact] = useState(null);
  const [scheduleType, setScheduleType] = useState(null);
  const [completedSurveys, setCompletedSurveys] = useState([]);
  const [aiAnalyses, setAiAnalyses] = useState({});
  const [analysisLoading, setAnalysisLoading] = useState({});
  const [aggregateInsights, setAggregateInsights] = useState(null);
  const [aggregateLoading, setAggregateLoading] = useState(false);
  const [expandedCard, setExpandedCard] = useState(null);

  const completedIds = completedSurveys.map(s => s.employee.id);
  const atRiskCount = Object.values(aiAnalyses).filter(a => a.sentiment === "at-risk").length;
  const positiveCount = Object.values(aiAnalyses).filter(a => a.sentiment === "positive").length;

  const startSurvey = (emp) => {
    setActiveEmployee(emp);
    setSurveyPhase("email");
    setCurrentQ(0);
    setAnswers({});
    setWriteIns({});
    setWantsContact(null);
    setScheduleType(null);
    setView("survey");
  };

  const handleSubmitSurvey = useCallback(async () => {
    const emp = activeEmployee;
    const surveyData = { employee: emp, answers, writeIns, wantsContact, scheduleType };
    setCompletedSurveys(prev => [...prev, surveyData]);
    setSurveyPhase("done");
    setAggregateInsights(null);
    setAnalysisLoading(prev => ({ ...prev, [emp.id]: true }));
    try {
      const analysis = await analyzeEmployeeSurvey(emp, answers, writeIns);
      setAiAnalyses(prev => ({ ...prev, [emp.id]: analysis }));
    } catch {
      setAiAnalyses(prev => ({ ...prev, [emp.id]: { sentiment: "neutral", summary: "Analysis unavailable.", flags: [], positives: [], recommendAction: false } }));
    } finally {
      setAnalysisLoading(prev => ({ ...prev, [emp.id]: false }));
    }
  }, [activeEmployee, answers, writeIns, wantsContact, scheduleType]);

  const runAggregateAnalysis = async () => {
    if (completedSurveys.length === 0) return;
    setView("insights");
    setAggregateLoading(true);
    try {
      const insights = await analyzeAggregateTrends(completedSurveys, aiAnalyses);
      setAggregateInsights(insights);
    } catch {
      setAggregateInsights({ overallHealth: "mixed", headline: "Analysis unavailable.", trends: [], topRisks: [], recommendations: [], atRiskCount: 0, positiveCount: 0 });
    } finally {
      setAggregateLoading(false);
    }
  };

  return (
    <div style={{ fontFamily: "'Georgia', serif", minHeight: "100vh", background: "#F7F4EF" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .emp-card:hover { transform: translateY(-2px); box-shadow: 0 8px 32px rgba(0,0,0,0.10) !important; }
        .emp-card { transition: transform 0.2s, box-shadow 0.2s; }
        .opt-btn { transition: all 0.15s; cursor: pointer; }
        .opt-btn:hover { border-color: #2C2C2C !important; background: #FAF8F5 !important; }
        .opt-btn.sel { background: #1C1C1C !important; color: #fff !important; border-color: #1C1C1C !important; }
        .primary-btn { transition: background 0.2s; }
        .primary-btn:hover { background: #111 !important; }
        .fade { animation: fadeUp 0.35s ease forwards; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        textarea:focus { outline: none; border-color: #888 !important; }
      `}</style>

      {/* Header */}
      <header style={{ background: "#1C1C1C", color: "#fff", padding: "0 32px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 60 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#C8F04A", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1C1C1C" strokeWidth="2.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          </div>
          <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: 18 }}>Enabled Talent</span>
          <span style={{ color: "#555", fontSize: 12, fontFamily: "'DM Sans', sans-serif" }}>/ Agentic Check-In v2.0</span>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {[
            { id: "dashboard", label: "Dashboard", action: () => setView("dashboard") },
            { id: "insights", label: `Insights${completedSurveys.length > 0 ? ` (${completedSurveys.length})` : ""}`, action: runAggregateAnalysis },
          ].map(tab => (
            <button key={tab.id} onClick={tab.action} style={{
              background: view === tab.id ? "#C8F04A" : "rgba(255,255,255,0.08)",
              color: view === tab.id ? "#1C1C1C" : "#aaa",
              border: "none", borderRadius: 6, padding: "6px 16px",
              fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, cursor: "pointer"
            }}>{tab.label}</button>
          ))}
        </div>
      </header>

      {/* ═══════════ DASHBOARD ═══════════ */}
      {view === "dashboard" && (
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 24px" }} className="fade">
          {/* Stats row */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 36 }}>
            {[
              { label: "Active Placements", value: EMPLOYEES.length, color: "#1C1C1C" },
              { label: "Surveys Completed", value: completedIds.length, color: "#1565C0" },
              { label: "At Risk", value: atRiskCount, color: "#991B1B" },
              { label: "Positive Outcomes", value: positiveCount, color: "#166534" },
            ].map(s => (
              <div key={s.label} style={{ background: "#fff", borderRadius: 12, padding: "20px 24px", border: "1px solid #E8E4DC", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
                <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 36, color: s.color, lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#888", marginTop: 6 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Title + action */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20, gap: 16 }}>
            <div>
              <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 28, color: "#1C1C1C" }}>Talent Placement Roster</h1>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#888", marginTop: 4 }}>Click any placement to trigger their check-in. AI analysis runs automatically on submission.</p>
            </div>
            {completedSurveys.length > 0 && (
              <button className="primary-btn" onClick={runAggregateAnalysis} style={{ background: "#1C1C1C", color: "#C8F04A", border: "none", borderRadius: 8, padding: "10px 18px", fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 8 }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z"/><path d="M12 6v6l4 2"/></svg>
                Aggregate Analysis
              </button>
            )}
          </div>

          {/* Roster grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 14 }}>
            {EMPLOYEES.map(emp => {
              const done = completedIds.includes(emp.id);
              const analysis = aiAnalyses[emp.id];
              const loading = analysisLoading[emp.id];
              const sc = stageColors[emp.stage];
              const sent = analysis ? sentimentConfig[analysis.sentiment] : null;
              const isExpanded = expandedCard === emp.id;

              return (
                <div key={emp.id} style={{ background: "#fff", borderRadius: 14, border: "1.5px solid " + (done ? "#D4BBFF" : "#E8E4DC"), boxShadow: "0 2px 8px rgba(0,0,0,0.04)", overflow: "hidden" }}>
                  <div className={done ? "" : "emp-card"} onClick={() => !done && startSurvey(emp)}
                    style={{ padding: "18px 22px", display: "flex", alignItems: "center", gap: 16, cursor: done ? "default" : "pointer" }}>
                    <div style={{ width: 48, height: 48, borderRadius: "50%", background: done ? "#EDE7F6" : "#1C1C1C", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Serif Display', serif", fontSize: 14, color: done ? "#4527A0" : "#C8F04A", flexShrink: 0 }}>
                      {emp.avatar}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap", marginBottom: 3 }}>
                        <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: 16, color: "#1C1C1C" }}>{emp.fullName}</span>
                        <span style={{ padding: "2px 8px", borderRadius: 20, fontSize: 10, fontFamily: "'DM Sans', sans-serif", fontWeight: 700, background: sc.bg, color: sc.text }}>{emp.stage}</span>
                        {loading && <span style={{ padding: "2px 8px", borderRadius: 20, fontSize: 10, fontFamily: "'DM Sans', sans-serif", background: "#F3F4F6", color: "#6B7280" }}>⟳ Analyzing…</span>}
                        {!loading && sent && (
                          <span style={{ padding: "2px 8px", borderRadius: 20, fontSize: 10, fontFamily: "'DM Sans', sans-serif", fontWeight: 700, background: sent.bg, color: sent.color, border: "1px solid " + sent.border, display: "flex", alignItems: "center", gap: 4 }}>
                            <span style={{ width: 6, height: 6, borderRadius: "50%", background: sent.dot, display: "inline-block" }} />
                            {sent.label}
                          </span>
                        )}
                        {done && !loading && !analysis && <span style={{ padding: "2px 8px", borderRadius: 20, fontSize: 10, fontFamily: "'DM Sans', sans-serif", background: "#F3F4F6", color: "#888" }}>✓ Complete</span>}
                      </div>
                      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#666" }}>{emp.role} · <span style={{ color: "#999" }}>{emp.company}</span></div>
                      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "#bbb", marginTop: 2 }}>{emp.disability} · Day {emp.daysIn}</div>
                    </div>
                    {done && analysis && (
                      <button onClick={e => { e.stopPropagation(); setExpandedCard(isExpanded ? null : emp.id); }}
                        style={{ background: "none", border: "none", cursor: "pointer", color: "#aaa", padding: 4, flexShrink: 0 }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ transform: isExpanded ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}><path d="M6 9l6 6 6-6"/></svg>
                      </button>
                    )}
                    {!done && (
                      <div style={{ width: 30, height: 30, borderRadius: "50%", background: "#F7F4EF", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                      </div>
                    )}
                  </div>

                  {/* Expanded AI panel */}
                  {isExpanded && analysis && (
                    <div style={{ borderTop: "1px solid #F0EDE8", background: sent.bg, padding: "14px 22px" }} className="fade">
                      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: sent.color, lineHeight: 1.65, marginBottom: sent.flags?.length || sent.positives?.length ? 12 : 0 }}>
                        {analysis.summary}
                      </p>
                      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                        {analysis.flags?.length > 0 && (
                          <div style={{ flex: 1, minWidth: 160 }}>
                            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, fontWeight: 700, color: "#991B1B", marginBottom: 5, textTransform: "uppercase", letterSpacing: 0.5 }}>⚑ Flags</div>
                            {analysis.flags.map((f, i) => <div key={i} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11.5, color: "#7F1D1D", marginBottom: 3, paddingLeft: 9, borderLeft: "2px solid #FCA5A5" }}>{f}</div>)}
                          </div>
                        )}
                        {analysis.positives?.length > 0 && (
                          <div style={{ flex: 1, minWidth: 160 }}>
                            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, fontWeight: 700, color: "#166534", marginBottom: 5, textTransform: "uppercase", letterSpacing: 0.5 }}>✓ Positives</div>
                            {analysis.positives.map((p, i) => <div key={i} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11.5, color: "#14532D", marginBottom: 3, paddingLeft: 9, borderLeft: "2px solid #86EFAC" }}>{p}</div>)}
                          </div>
                        )}
                      </div>
                      {analysis.recommendAction && analysis.actionNote && (
                        <div style={{ marginTop: 10, padding: "9px 12px", background: "#FEF2F2", borderRadius: 7, border: "1px solid #FECACA" }}>
                          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11.5, color: "#991B1B", fontWeight: 700 }}>Recommended Action: </span>
                          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11.5, color: "#7F1D1D" }}>{analysis.actionNote}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Footer note */}
          <div style={{ marginTop: 32, padding: "16px 22px", borderRadius: 12, background: "#1C1C1C", display: "flex", gap: 14, alignItems: "flex-start" }}>
            <div style={{ width: 26, height: 26, borderRadius: 7, background: "#C8F04A", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#1C1C1C" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>
            </div>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#888", lineHeight: 1.7 }}>
              <strong style={{ color: "#C8F04A" }}>Agentic AI Pipeline Active</strong> — On survey submission, Claude automatically performs per-employee sentiment analysis, flags accommodation gaps and barriers, and surfaces wellbeing trends. Expand any completed card to view the full analysis. Use <strong style={{ color: "#fff" }}>Aggregate Analysis</strong> to identify cross-employee patterns and portfolio-level risks.
            </div>
          </div>
        </div>
      )}

      {/* ═══════════ INSIGHTS ═══════════ */}
      {view === "insights" && (
        <div style={{ maxWidth: 860, margin: "0 auto", padding: "40px 24px" }} className="fade">
          <button onClick={() => setView("dashboard")} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#888", display: "flex", alignItems: "center", gap: 6, padding: 0, marginBottom: 28 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            Back to Dashboard
          </button>

          <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 30, color: "#1C1C1C", marginBottom: 6 }}>Aggregate Insights</h1>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#888", marginBottom: 32 }}>AI-generated analysis across {completedSurveys.length} completed check-in{completedSurveys.length !== 1 ? "s" : ""}</p>

          {completedSurveys.length === 0 && (
            <div style={{ background: "#fff", borderRadius: 14, padding: "48px", textAlign: "center", border: "1px solid #E8E4DC" }}>
              <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: "#aaa", marginBottom: 8 }}>No surveys completed yet</div>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#bbb" }}>Complete at least one employee check-in to run aggregate analysis.</p>
            </div>
          )}

          {aggregateLoading && (
            <div style={{ background: "#fff", borderRadius: 14, padding: "48px", textAlign: "center", border: "1px solid #E8E4DC" }}>
              <div style={{ width: 44, height: 44, border: "3px solid #E8E4DC", borderTopColor: "#1C1C1C", borderRadius: "50%", margin: "0 auto 20px", animation: "spin 1s linear infinite" }} />
              <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 20, color: "#1C1C1C", marginBottom: 8 }}>Analyzing patterns…</div>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#888" }}>Claude is reviewing {completedSurveys.length} survey{completedSurveys.length !== 1 ? "s" : ""} for trends, risks, and recommendations.</p>
            </div>
          )}

          {aggregateInsights && !aggregateLoading && (
            <div className="fade">
              {/* Health card */}
              <div style={{ background: "#1C1C1C", borderRadius: 14, padding: "22px 26px", marginBottom: 18, display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: 180 }}>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: "#666", textTransform: "uppercase", letterSpacing: 1, marginBottom: 5 }}>Portfolio Health</div>
                  <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 24, color: aggregateInsights.overallHealth === "strong" ? "#C8F04A" : aggregateInsights.overallHealth === "concerning" ? "#FCA5A5" : "#FDE68A" }}>
                    {{ strong: "Strong", mixed: "Mixed", concerning: "Concerning" }[aggregateInsights.overallHealth]}
                  </div>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#aaa", marginTop: 5, lineHeight: 1.5 }}>{aggregateInsights.headline}</div>
                </div>
                <div style={{ display: "flex", gap: 12 }}>
                  {[
                    { val: aggregateInsights.atRiskCount, label: "At Risk", color: "#EF4444" },
                    { val: aggregateInsights.positiveCount, label: "Positive", color: "#22C55E" },
                    { val: completedSurveys.length, label: "Surveyed", color: "#C8F04A" },
                  ].map(s => (
                    <div key={s.label} style={{ textAlign: "center", background: "#252525", borderRadius: 10, padding: "12px 18px" }}>
                      <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 26, color: s.color }}>{s.val}</div>
                      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: "#666", marginTop: 3 }}>{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Trends */}
              {aggregateInsights.trends?.length > 0 && (
                <div style={{ marginBottom: 18 }}>
                  <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 20, color: "#1C1C1C", marginBottom: 12 }}>Trends Identified</h2>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
                    {aggregateInsights.trends.map((t, i) => {
                      const tc = { positive: { bg: "#F0FDF4", border: "#BBF7D0", dot: "#22C55E", color: "#14532D" }, warning: { bg: "#FFF7ED", border: "#FED7AA", dot: "#F97316", color: "#7C2D12" }, info: { bg: "#EFF6FF", border: "#BFDBFE", dot: "#3B82F6", color: "#1E3A5F" } }[t.type] || { bg: "#EFF6FF", border: "#BFDBFE", dot: "#3B82F6", color: "#1E3A5F" };
                      return (
                        <div key={i} style={{ background: tc.bg, borderRadius: 11, padding: "14px 16px", border: "1px solid " + tc.border }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 7 }}>
                            <div style={{ width: 7, height: 7, borderRadius: "50%", background: tc.dot, flexShrink: 0 }} />
                            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 700, color: tc.color }}>{t.title}</div>
                          </div>
                          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: tc.color, lineHeight: 1.6, opacity: 0.85 }}>{t.detail}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Risks */}
              {aggregateInsights.topRisks?.length > 0 && (
                <div style={{ background: "#FEF2F2", borderRadius: 12, padding: "18px 20px", marginBottom: 18, border: "1px solid #FECACA" }}>
                  <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 18, color: "#991B1B", marginBottom: 10 }}>⚑ Top Risks Requiring Attention</h2>
                  {aggregateInsights.topRisks.map((r, i) => (
                    <div key={i} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#7F1D1D", marginBottom: 7, paddingLeft: 12, borderLeft: "3px solid #FCA5A5", lineHeight: 1.5 }}>{r}</div>
                  ))}
                </div>
              )}

              {/* Recommendations */}
              {aggregateInsights.recommendations?.length > 0 && (
                <div style={{ background: "#fff", borderRadius: 12, padding: "18px 20px", border: "1px solid #E8E4DC", marginBottom: 18 }}>
                  <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 18, color: "#1C1C1C", marginBottom: 12 }}>Recommended Actions</h2>
                  {aggregateInsights.recommendations.map((r, i) => (
                    <div key={i} style={{ display: "flex", gap: 11, alignItems: "flex-start", marginBottom: 10 }}>
                      <div style={{ width: 20, height: 20, borderRadius: "50%", background: "#1C1C1C", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: "#C8F04A", fontWeight: 700 }}>{i + 1}</span>
                      </div>
                      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#333", lineHeight: 1.6 }}>{r}</div>
                    </div>
                  ))}
                </div>
              )}

              <button className="primary-btn" onClick={runAggregateAnalysis} style={{ background: "#1C1C1C", color: "#C8F04A", border: "none", borderRadius: 8, padding: "10px 18px", fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                ↺ Re-run Analysis
              </button>
            </div>
          )}
        </div>
      )}

      {/* ═══════════ SURVEY ═══════════ */}
      {view === "survey" && activeEmployee && (
        <div style={{ maxWidth: 600, margin: "0 auto", padding: "40px 24px" }} className="fade">
          <button onClick={() => setView("dashboard")} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#888", display: "flex", alignItems: "center", gap: 6, marginBottom: 28, padding: 0 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            Back to Dashboard
          </button>

          {/* EMAIL */}
          {surveyPhase === "email" && (
            <div className="fade" style={{ background: "#fff", borderRadius: 12, overflow: "hidden", boxShadow: "0 4px 20px rgba(0,0,0,0.08)", border: "1px solid #E8E4DC" }}>
              <div style={{ background: "#F7F4EF", padding: "14px 22px", borderBottom: "1px solid #E8E4DC" }}>
                {[["From", `Jamie Okonkwo <jamie@enabledtalent.com>`], ["To", `${activeEmployee.fullName} <${activeEmployee.name.toLowerCase()}@work.com>`], ["Subject", `Your ${activeEmployee.stage} Check-In — ${activeEmployee.company} 🌱`]].map(([l, v]) => (
                  <div key={l} style={{ display: "flex", gap: 8, marginBottom: 3 }}>
                    <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#aaa", width: 44, flexShrink: 0 }}>{l}:</span>
                    <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#555" }}>{v}</span>
                  </div>
                ))}
              </div>
              <div style={{ padding: "28px 30px" }}>
                <p style={{ fontFamily: "'DM Serif Display', serif", fontSize: 21, color: "#1C1C1C", lineHeight: 1.4, marginBottom: 14 }}>Hi {activeEmployee.name}, it's been {activeEmployee.daysIn} days — how are you doing?</p>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#555", lineHeight: 1.8, marginBottom: 24 }}>This 3–4 minute check-in goes directly to your Enabled Talent support team — not your employer. Everything you share is confidential.</p>
                <button className="primary-btn" onClick={() => setSurveyPhase("intro")} style={{ background: "#1C1C1C", color: "#fff", border: "none", borderRadius: 10, padding: "13px 24px", fontSize: 14, fontFamily: "'DM Sans', sans-serif", fontWeight: 600, width: "100%", cursor: "pointer" }}>
                  Start My {activeEmployee.stage} Check-In →
                </button>
              </div>
            </div>
          )}

          {/* INTRO */}
          {surveyPhase === "intro" && (
            <div className="fade" style={{ background: "#fff", borderRadius: 16, border: "1px solid #E8E4DC", overflow: "hidden", boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }}>
              <div style={{ height: 4, background: stageColors[activeEmployee.stage].bar }} />
              <div style={{ padding: "32px 32px 28px" }}>
                <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#1C1C1C", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Serif Display', serif", fontSize: 14, color: "#C8F04A", marginBottom: 18 }}>{activeEmployee.avatar}</div>
                <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 24, color: "#1C1C1C", marginBottom: 10 }}>Welcome, {activeEmployee.name}.</h1>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#555", lineHeight: 1.8, marginBottom: 20 }}>7 short questions with multiple-choice answers and space for your own words. At the end you can request to speak with your Enabled Talent team directly.</p>
                {[["🔒", "Confidential — never shared with your employer"], ["⏱", "About 3–4 minutes"], ["💬", "Read by your Enabled Talent support team"]].map(([icon, text]) => (
                  <div key={text} style={{ display: "flex", gap: 10, marginBottom: 9, alignItems: "flex-start" }}>
                    <span style={{ fontSize: 14 }}>{icon}</span>
                    <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#666" }}>{text}</span>
                  </div>
                ))}
                <button className="primary-btn" onClick={() => setSurveyPhase("survey")} style={{ marginTop: 22, background: "#1C1C1C", color: "#fff", border: "none", borderRadius: 10, padding: "13px 24px", fontSize: 14, fontFamily: "'DM Sans', sans-serif", fontWeight: 600, width: "100%", cursor: "pointer" }}>
                  I'm Ready →
                </button>
              </div>
            </div>
          )}

          {/* QUESTIONS */}
          {surveyPhase === "survey" && (
            <div className="fade">
              <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #E8E4DC", overflow: "hidden", boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }}>
                <div style={{ height: 4, background: "#E8E4DC" }}>
                  <div style={{ height: "100%", background: stageColors[activeEmployee.stage].bar, width: `${((currentQ + 1) / QUESTIONS.length) * 100}%`, transition: "width 0.4s" }} />
                </div>
                <div style={{ padding: "28px 32px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#aaa", marginBottom: 18 }}>
                    <span>{activeEmployee.stage} · {activeEmployee.company}</span><span>Q{currentQ + 1} / {QUESTIONS.length}</span>
                  </div>
                  <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 20, color: "#1C1C1C", lineHeight: 1.45, marginBottom: 20 }}>{QUESTIONS[currentQ].text}</h2>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 18 }}>
                    {QUESTIONS[currentQ].options.map(opt => (
                      <div key={opt} className={`opt-btn${answers[QUESTIONS[currentQ].id] === opt ? " sel" : ""}`}
                        onClick={() => setAnswers(p => ({ ...p, [QUESTIONS[currentQ].id]: opt }))}
                        style={{ padding: "12px 14px", borderRadius: 9, border: "1.5px solid #E8E4DC", background: "#fff", fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#333", lineHeight: 1.5, userSelect: "none" }}>
                        {opt}
                      </div>
                    ))}
                  </div>
                  <textarea value={writeIns[QUESTIONS[currentQ].id] || ""} onChange={e => setWriteIns(p => ({ ...p, [QUESTIONS[currentQ].id]: e.target.value }))}
                    placeholder="Anything to add? (optional)" rows={2}
                    style={{ width: "100%", padding: "10px 13px", borderRadius: 9, border: "1.5px solid #E8E4DC", fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#333", background: "#FDFCFA", resize: "none", lineHeight: 1.6, marginBottom: 18 }} />
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => currentQ > 0 ? setCurrentQ(currentQ - 1) : setSurveyPhase("intro")}
                      style={{ padding: "10px 16px", borderRadius: 8, border: "1.5px solid #E8E4DC", background: "#fff", fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#777", cursor: "pointer" }}>← Back</button>
                    <button className="primary-btn" onClick={() => currentQ < QUESTIONS.length - 1 ? setCurrentQ(currentQ + 1) : setSurveyPhase("contact")}
                      disabled={!answers[QUESTIONS[currentQ].id]}
                      style={{ flex: 1, padding: "10px 16px", borderRadius: 8, border: "none", background: answers[QUESTIONS[currentQ].id] ? "#1C1C1C" : "#D1CBC3", color: "#fff", fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, cursor: answers[QUESTIONS[currentQ].id] ? "pointer" : "not-allowed" }}>
                      {currentQ < QUESTIONS.length - 1 ? "Next →" : "Continue →"}
                    </button>
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "center", gap: 5, marginTop: 14 }}>
                {QUESTIONS.map((_, i) => <div key={i} style={{ width: i === currentQ ? 16 : 6, height: 6, borderRadius: 3, background: i < currentQ ? stageColors[activeEmployee.stage].bar : i === currentQ ? "#1C1C1C" : "#D4CFC8", transition: "all 0.3s" }} />)}
              </div>
            </div>
          )}

          {/* CONTACT */}
          {surveyPhase === "contact" && (
            <div className="fade" style={{ background: "#fff", borderRadius: 16, border: "1px solid #E8E4DC", overflow: "hidden", boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }}>
              <div style={{ height: 4, background: stageColors[activeEmployee.stage].bar }} />
              <div style={{ padding: "32px 32px 28px" }}>
                <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: "#1C1C1C", lineHeight: 1.35, marginBottom: 10 }}>Would you prefer to speak directly with someone at Enabled Talent?</h2>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#777", lineHeight: 1.7, marginBottom: 20 }}>All conversations are confidential and never shared with your employer.</p>
                {wantsContact === null && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                    {["Yes, I'd like to schedule a conversation", "No thanks — the survey covers it"].map(opt => (
                      <div key={opt} className="opt-btn" onClick={() => setWantsContact(opt.startsWith("Yes"))}
                        style={{ padding: "12px 14px", borderRadius: 9, border: "1.5px solid #E8E4DC", background: "#fff", fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#333", userSelect: "none", cursor: "pointer" }}>
                        {opt}
                      </div>
                    ))}
                  </div>
                )}
                {wantsContact === true && !scheduleType && (
                  <div className="fade">
                    <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#555", marginBottom: 14 }}>How would you prefer to connect?</p>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 18 }}>
                      {[{ type: "Phone Call", emoji: "📞", bg: "#EFF6FF" }, { type: "Video Call", emoji: "🎥", bg: "#F5F3FF" }].map(s => (
                        <div key={s.type} onClick={() => setScheduleType(s.type)}
                          style={{ background: s.bg, borderRadius: 11, padding: "20px 16px", textAlign: "center", cursor: "pointer", transition: "all 0.2s" }}>
                          <div style={{ fontSize: 24, marginBottom: 7 }}>{s.emoji}</div>
                          <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 15, color: "#1C1C1C" }}>{s.type}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {wantsContact === true && scheduleType && (
                  <div className="fade" style={{ background: "#F0FDF4", borderRadius: 10, padding: "14px 16px", marginBottom: 18, border: "1px solid #BBF7D0" }}>
                    <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 16, color: "#14532D", marginBottom: 3 }}>✓ {scheduleType} requested</div>
                    <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#166534" }}>Your relationship manager will reach out within one business day.</div>
                  </div>
                )}
                {wantsContact === false && (
                  <div className="fade" style={{ background: "#FFFBEB", borderRadius: 10, padding: "12px 16px", marginBottom: 18, border: "1px solid #FDE68A" }}>
                    <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#78350F" }}>Understood — reply to your check-in email any time if you'd like to connect.</div>
                  </div>
                )}
                {(wantsContact === false || (wantsContact === true && scheduleType)) && (
                  <button className="primary-btn" onClick={handleSubmitSurvey} style={{ width: "100%", padding: "13px", borderRadius: 9, border: "none", background: "#1C1C1C", color: "#fff", fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
                    Submit Check-In ✓
                  </button>
                )}
              </div>
            </div>
          )}

          {/* DONE */}
          {surveyPhase === "done" && (
            <div className="fade" style={{ textAlign: "center", paddingTop: 16 }}>
              <div style={{ width: 68, height: 68, borderRadius: "50%", background: "#C8F04A", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#1C1C1C" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 26, color: "#1C1C1C", marginBottom: 8 }}>Check-In Complete</h2>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#666", lineHeight: 1.7, maxWidth: 380, margin: "0 auto 16px" }}>
                Thank you, <strong>{activeEmployee.name}</strong>. Your {activeEmployee.stage} responses have been recorded.
              </p>
              {analysisLoading[activeEmployee.id] ? (
                <div style={{ background: "#fff", borderRadius: 11, padding: "14px 18px", border: "1px solid #E8E4DC", margin: "0 auto 20px", maxWidth: 360, display: "flex", gap: 10, alignItems: "center" }}>
                  <div style={{ width: 18, height: 18, border: "2px solid #E8E4DC", borderTopColor: "#1C1C1C", borderRadius: "50%", flexShrink: 0, animation: "spin 1s linear infinite" }} />
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#888" }}>Claude is analyzing your responses…</span>
                </div>
              ) : aiAnalyses[activeEmployee.id] && (() => {
                const a = aiAnalyses[activeEmployee.id];
                const s = sentimentConfig[a.sentiment];
                return (
                  <div style={{ background: s.bg, borderRadius: 11, padding: "14px 18px", border: "1px solid " + s.border, margin: "0 auto 20px", maxWidth: 420, textAlign: "left" }}>
                    <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, fontWeight: 700, color: s.color, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 5 }}>AI Analysis Complete</div>
                    <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: s.color, lineHeight: 1.6 }}>{a.summary}</p>
                  </div>
                );
              })()}
              <div style={{ display: "flex", gap: 9, justifyContent: "center" }}>
                <button className="primary-btn" onClick={() => setView("dashboard")} style={{ padding: "10px 24px", borderRadius: 8, border: "none", background: "#1C1C1C", color: "#fff", fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                  ← Dashboard
                </button>
                {completedSurveys.length > 0 && (
                  <button onClick={runAggregateAnalysis} style={{ padding: "10px 18px", borderRadius: 8, border: "1.5px solid #1C1C1C", background: "#fff", fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#1C1C1C", cursor: "pointer" }}>
                    View Insights →
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
