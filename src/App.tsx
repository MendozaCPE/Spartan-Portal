import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react"

type Status = "On target" | "Warning" | "Critical" | "Caution" | "Pending"
type IconName = "alert" | "bars" | "calendar" | "check" | "chevron" | "download" | "filter" | "help" | "info" | "key" | "lock" | "logout" | "shield" | "triangle" | "user" | "x"

const Icon = ({ name, size = 18 }: { name: IconName; size?: number }) => {
  const paths: Record<IconName, React.ReactNode> = {
    alert: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v6m0 4h.01" />
      </>
    ),
    bars: (
      <>
        <path d="M5 20V10m7 10V4m7 16v-7" />
        <path d="M3 20h18" />
      </>
    ),
    calendar: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M16 3v4M8 3v4M3 10h18" />
      </>
    ),
    check: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="m8 12 2.5 2.5L16 9" />
      </>
    ),
    chevron: <path d="m9 18 6-6-6-6" />,
    download: (
      <>
        <path d="M12 3v12m-4-4 4 4 4-4" />
        <path d="M5 20h14" />
      </>
    ),
    filter: <path d="M4 5h16l-6.5 7.2V19l-3 1v-7.8L4 5Z" />,
    help: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M9.8 9a2.3 2.3 0 1 1 3.4 2c-.8.5-1.2 1-1.2 2m0 4h.01" />
      </>
    ),
    info: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 11v6m0-10h.01" />
      </>
    ),
    key: (
      <>
        <circle cx="8" cy="15" r="4" />
        <path d="m11 12 8-8m-3 3 2 2m-5 1 2 2" />
      </>
    ),
    lock: (
      <>
        <rect x="5" y="10" width="14" height="11" rx="2" />
        <path d="M8 10V7a4 4 0 0 1 8 0v3" />
      </>
    ),
    logout: (
      <>
        <path d="M10 5H5v14h5m5-3 4-4-4-4m4 4H9" />
      </>
    ),
    shield: (
      <>
        {/* Crossed Spear and Sword forming an X mark */}
        {/* Spear: shaft and spearhead */}
        <line x1="5" y1="19" x2="15" y2="9" strokeWidth="1.8" />
        <polygon points="20,4 14.5,7 17,9.5" fill="currentColor" stroke="currentColor" strokeWidth="1" strokeLinejoin="round" />
        {/* Sword: blade, crossguard, grip, and pommel */}
        <line x1="4.5" y1="4.5" x2="13" y2="13" strokeWidth="1.8" />
        <path d="M4.5 7 L4.5 4.5 L7 4.5" strokeWidth="1.6" />
        <line x1="11" y1="15" x2="15" y2="11" strokeWidth="2.4" />
        <line x1="13" y1="13" x2="16.5" y2="16.5" strokeWidth="1.8" />
        <circle cx="17.5" cy="17.5" r="1.3" fill="currentColor" stroke="none" />
      </>
    ),
    triangle: (
      <>
        <path d="M12 4 3 20h18L12 4Z" />
        <path d="M12 9v5m0 3h.01" />
      </>
    ),
    user: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21a8 8 0 0 1 16 0" />
      </>
    ),
    x: <path d="m6 6 12 12M18 6 6 18" />,
  }
  return (
    <svg
      aria-hidden="true"
      className="icon"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[name]}
    </svg>
  )
}

// ── Tooltip System ─────────────────────────────────────────────────────
type TipCtx = {
  show: (text: string, x: number, y: number) => void
  hide: () => void
  move: (x: number, y: number) => void
  setSuppressed: (source: string, s: boolean) => void
}
const TipContext = createContext<TipCtx>({
  show: () => {},
  hide: () => {},
  move: () => {},
  setSuppressed: () => {},
})

function TipProvider({ children }: { children: React.ReactNode }) {
  const [tipState, setTipState] = useState<{ text: string; x: number; y: number } | null>(null)
  const [visible, setVisible] = useState(false)
  const suppressSources = useRef(new Map<string, boolean>())
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingRef = useRef<{ text: string; x: number; y: number } | null>(null)
  const boxRef = useRef<HTMLDivElement | null>(null)

  const isSuppressed = () => Array.from(suppressSources.current.values()).some(Boolean)

  const setSuppressed = useCallback((source: string, s: boolean) => {
    suppressSources.current.set(source, s)
    if (isSuppressed()) {
      if (timerRef.current) clearTimeout(timerRef.current)
      pendingRef.current = null
      setTipState(null)
      setVisible(false)
    }
  }, [])

  const show = useCallback((text: string, x: number, y: number) => {
    if (isSuppressed()) return
    if (timerRef.current) clearTimeout(timerRef.current)
    pendingRef.current = { text, x, y }
    setVisible(false)
    timerRef.current = setTimeout(() => {
      if (pendingRef.current) {
        setTipState(pendingRef.current)
        setVisible(true)
      }
    }, 400)
  }, [])

  const hide = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    pendingRef.current = null
    setTipState(null)
    setVisible(false)
  }, [])

  const move = useCallback((x: number, y: number) => {
    pendingRef.current = pendingRef.current ? { ...pendingRef.current, x, y } : null
    setTipState(prev => prev ? { ...prev, x, y } : prev)
  }, [])

  useEffect(() => {
    const onDismiss = () => hide()
    window.addEventListener("scroll", onDismiss, true)
    window.addEventListener("pointerdown", onDismiss, true)
    return () => {
      window.removeEventListener("scroll", onDismiss, true)
      window.removeEventListener("pointerdown", onDismiss, true)
    }
  }, [hide])

  const getPos = (): React.CSSProperties => {
    if (!tipState) return { left: -9999, top: -9999 }
    const boxW = boxRef.current?.offsetWidth ?? 180
    const boxH = boxRef.current?.offsetHeight ?? 32
    const vw = window.innerWidth
    const vh = window.innerHeight
    const offset = 14
    let left = tipState.x + offset
    let top = tipState.y + offset
    if (left + boxW + 8 > vw) left = tipState.x - boxW - 4
    if (top + boxH + 8 > vh) top = tipState.y - boxH - 4
    if (left < 4) left = 4
    if (top < 4) top = 4
    return { left, top }
  }

  return (
    <TipContext.Provider value={{ show, hide, move, setSuppressed }}>
      {children}
      {tipState && (
        <div
          ref={boxRef}
          className={`tip-box${visible ? " tip-visible" : ""}`}
          style={getPos()}
          role="tooltip"
          id="global-tip"
        >
          {tipState.text}
        </div>
      )}
    </TipContext.Provider>
  )
}

function useTip() {
  const ctx = useContext(TipContext)
  const tip = (text: string) => ({
    onMouseEnter: (e: React.MouseEvent) => ctx.show(text, e.clientX, e.clientY),
    onMouseLeave: () => ctx.hide(),
    onMouseMove: (e: React.MouseEvent) => ctx.move(e.clientX, e.clientY),
    onFocus: (e: React.FocusEvent) => {
      const r = (e.currentTarget as HTMLElement).getBoundingClientRect()
      ctx.show(text, r.left, r.bottom + 4)
    },
    onBlur: () => ctx.hide(),
    "aria-describedby": "global-tip" as const,
  })
  return { tip, tipShow: ctx.show, tipHide: ctx.hide, tipMove: ctx.move }
}

function TipSuppressor({ suppress, source }: { suppress: boolean; source: string }) {
  const { setSuppressed } = useContext(TipContext)
  useEffect(() => {
    setSuppressed(source, suppress)
    return () => setSuppressed(source, false)
  }, [suppress, source, setSuppressed])
  return null
}

type Kpi = {
  id: number
  label: string
  value: number | null
  display: string
  target: string
  status: Status
  change: string
  support: string
  insight: [string, string, string]
}

type Attention = {
  severity: Status
  kpi: string
  item: string
  detail: string
  action: string
  expanded: string
}

type TermData = {
  pending: boolean
  kpis: Kpi[]
  timeline: {
    term: string
    short: string
    value: number
    response: number
    evaluations: number
  }[]
  areas: { label: string; value: number }[]
  subjects: { name: string; value: number }[]
  attention: Attention[]
  quadrantCounts: [number, number, number, number]
}

type DrillState = {
  kpi: number
  path: string[]
}

const thresholds = [
  "On target ≥85%; warning 75–84.9%; critical <75%.",
  "On target ≤10%; warning 10.1–20%; critical >20%.",
  "On target ≥95%; warning 85–94.9%; critical <85%.",
  "On target ≥4.0; warning 3.5–3.99; critical <3.5.",
  "On target ≥70%; warning 50–69%; critical <50%.",
]

const lateClasses = [
  {
    code: "IT 312-B",
    days: 12,
    faculty: "F-014",
    deadline: "May 22, 2026",
    submitted: "June 3, 2026",
  },
  {
    code: "IT 204-A",
    days: 9,
    faculty: "F-022",
    deadline: "May 22, 2026",
    submitted: "May 31, 2026",
  },
  {
    code: "IT 101-A",
    days: 7,
    faculty: "F-008",
    deadline: "May 22, 2026",
    submitted: "May 29, 2026",
  },
  {
    code: "IT 215-B",
    days: 6,
    faculty: "F-031",
    deadline: "May 22, 2026",
    submitted: "May 28, 2026",
  },
  {
    code: "IT 330-A",
    days: 5,
    faculty: "F-017",
    deadline: "May 22, 2026",
    submitted: "May 27, 2026",
  },
  {
    code: "IT 410-A",
    days: 4,
    faculty: "F-026",
    deadline: "May 22, 2026",
    submitted: "May 26, 2026",
  },
  {
    code: "IT 221-C",
    days: 3,
    faculty: "F-011",
    deadline: "May 22, 2026",
    submitted: "May 25, 2026",
  },
  {
    code: "IT 118-D",
    days: 2,
    faculty: "F-006",
    deadline: "May 22, 2026",
    submitted: "May 24, 2026",
  },
  {
    code: "IT 305-B",
    days: 1,
    faculty: "F-024",
    deadline: "May 22, 2026",
    submitted: "May 23, 2026",
  },
]

const yearLevels = [
  { name: "1st year", count: 21, total: 120 },
  { name: "2nd year", count: 17, total: 110 },
  { name: "3rd year", count: 12, total: 100 },
  { name: "4th year", count: 7, total: 90 },
]

const recognitionCandidates = [
  { code: "IT 201-A", faculty: "F-009", rating: 4.6, pass: 92, response: 95 },
  { code: "IT 314-A", faculty: "F-017", rating: 4.5, pass: 89, response: 93 },
  { code: "IT 122-B", faculty: "F-026", rating: 4.4, pass: 94, response: 97 },
]

const facultyOverview = [
  {
    faculty: "F-005",
    sections: 3,
    rating: 4.3,
    response: 96,
    pass: 90,
    flag: "None",
    section: "IT 205-A",
  },
  {
    faculty: "F-009",
    sections: 2,
    rating: 4.6,
    response: 95,
    pass: 92,
    flag: "None",
    section: "IT 201-A",
  },
  {
    faculty: "F-014",
    sections: 3,
    rating: 4.0,
    response: 94,
    pass: 81,
    flag: "Grades 12 days late",
    section: "IT 312-B",
  },
  {
    faculty: "F-017",
    sections: 2,
    rating: 4.5,
    response: 93,
    pass: 89,
    flag: "None",
    section: "IT 314-A",
  },
  {
    faculty: "F-022",
    sections: 3,
    rating: 4.1,
    response: 97,
    pass: 86,
    flag: "Grades 9 days late",
    section: "IT 204-A",
  },
  {
    faculty: "F-026",
    sections: 2,
    rating: 4.4,
    response: 97,
    pass: 94,
    flag: "None",
    section: "IT 122-B",
  },
  {
    faculty: "F-038",
    sections: 3,
    rating: 3.9,
    response: 92,
    pass: 80,
    flag: "Below 4.0 target, confirm with other evidence",
    section: "IT 218-B",
  },
  {
    faculty: "F-044",
    sections: 2,
    rating: 4.2,
    response: 98,
    pass: 88,
    flag: "None",
    section: "IT 220-A",
  },
]

const insights: Kpi["insight"][] = [
  [
    "Share of graded students who passed.",
    "Warning below 85%; critical below 75%.",
    "Review the lowest subjects and arrange tutoring or review sessions.",
  ],
  [
    "Students with at least one failing or incomplete grade.",
    "Warning above 10%; critical above 20%.",
    "Refer to academic advising or e-Counseling and notify faculty.",
  ],
  [
    "Classes that submitted grades on time.",
    "Warning below 95%; critical below 85%. Late grades also delay SETE feedback.",
    "Follow up with faculty and escalate to the Dean if critical.",
  ],
  [
    "Average of all star ratings on a 1 to 5 scale.",
    "Warning below 4.0; critical below 3.5. Never read alone; read with KPI 1 and KPI 5.",
    "Review criterion-level scores, then plan faculty development after confirming with other evidence.",
  ],
  [
    "Sections that meet both the passing and rating targets.",
    "Warning below 70%; critical below 50%.",
    "Review sections where ratings and results disagree.",
  ],
]

const attentionDefault: Attention[] = [
  {
    severity: "Critical",
    kpi: "KPI 3",
    item: "IT 312-B (Faculty F-014)",
    detail: "Grades 12 days late",
    action: "Follow up and find the cause",
    expanded:
      "Grade submission missed the institutional deadline by 12 days. SETE feedback for this class remains delayed.",
  },
  {
    severity: "Critical",
    kpi: "KPI 3",
    item: "IT 204-A (Faculty F-022)",
    detail: "Grades 9 days late",
    action: "Follow up and find the cause",
    expanded:
      "Confirm whether the delay is caused by workload, system access, or unresolved grade requirements.",
  },
  {
    severity: "Critical",
    kpi: "KPI 1",
    item: "Data Structures and Algorithms",
    detail: "Passing rate 74%",
    action: "Arrange tutoring or review sessions",
    expanded:
      "This subject is 11 points below the 85% passing target and is the lowest-performing subject this term.",
  },
  {
    severity: "Warning",
    kpi: "KPI 5",
    item: "IT 305-A",
    detail: "Rating 4.5, passing 78%",
    action: "Review assessments and curriculum",
    expanded:
      "Students rate the teaching above target, while course outcomes remain below target. Review assessment alignment before drawing conclusions.",
  },
  {
    severity: "Warning",
    kpi: "KPI 4",
    item: "Faculty F-038",
    detail: "Rating 3.9",
    action: "Review criterion-level scores; confirm with other evidence",
    expanded:
      "Faculty SETE average of 3.9 is below the 4.0 target. Review criterion-level scores and confirm with classroom observations and student outcomes.",
  },
  {
    severity: "Caution",
    kpi: "KPI 4",
    item: "IT 221-C",
    detail: "48% uniform ratings",
    action: "Interpret with caution; confirm with other evidence",
    expanded:
      "Nearly half of responses use the same rating across all items. Confirm the pattern with response counts and other evidence.",
  },
]

function makeKpis(
  values: [number, number, number, number, number],
  prior: [number, number, number, number, number],
  campus: boolean,
): Kpi[] {
  const v = values.map(
    (n, i) => n + (campus ? [-0.8, 0.7, 2, -0.04, -2][i] : 0),
  ) as [number, number, number, number, number]
  const status: Status[] = [
    v[0] < 75 ? "Critical" : v[0] < 85 ? "Warning" : "On target",
    v[1] > 20 ? "Critical" : v[1] > 10 ? "Warning" : "On target",
    v[2] < 85 ? "Critical" : v[2] < 95 ? "Warning" : "On target",
    v[3] < 3.5 ? "Critical" : v[3] < 4 ? "Warning" : "On target",
    v[4] < 50 ? "Critical" : v[4] < 70 ? "Warning" : "On target",
  ]
  const changes = v.map((n, i) => n - prior[i])
  return [
    {
      id: 1,
      label: "Course Passing Rate",
      value: v[0],
      display: `${v[0].toFixed(1)}%`,
      target: "≥ 85%",
      status: status[0],
      change: `${
        changes[0] >= 0 ? "▲" : "▼"
      } ${Math.abs(changes[0]).toFixed(1)} pts`,
      support: campus
        ? "1,182 of 1,369 grades passed"
        : "2,014 of 2,310 grades passed",
      insight: insights[0],
    },
    {
      id: 2,
      label: "At-Risk Student Rate",
      value: v[1],
      display: `${v[1].toFixed(1)}%`,
      target: "≤ 10%",
      status: status[1],
      change: `${
        changes[1] <= 0 ? "▼" : "▲"
      } ${Math.abs(changes[1]).toFixed(1)} pts${
        changes[1] < 0 ? " (improving)" : ""
      }`,
      support: campus
        ? "34 of 238 students with a failing or incomplete grade"
        : "57 of 420 students with a failing or incomplete grade",
      insight: insights[1],
    },
    {
      id: 3,
      label: "On-Time Grade Submission",
      value: v[2],
      display: `${v[2].toFixed(1)}%`,
      target: "≥ 95%",
      status: status[2],
      change: `${
        changes[2] >= 0 ? "▲" : "▼"
      } ${Math.abs(changes[2]).toFixed(1)} pts`,
      support: `${Math.round((v[2] / 100) * (campus ? 29 : 50))} of ${
        campus ? 29 : 50
      } classes on time`,
      insight: insights[2],
    },
    {
      id: 4,
      label: "Average SETE Rating",
      value: v[3],
      display: `${v[3].toFixed(2)} / 5`,
      target: "≥ 4.0",
      status: status[3],
      change: `${
        changes[3] >= 0 ? "▲" : "▼"
      } ${Math.abs(changes[3]).toFixed(2)}`,
      support: campus
        ? "Response rate 95% · 1,206 evaluations · Uniform ratings 10%"
        : "Response rate 96% · 2,218 evaluations · Uniform ratings 9%",
      insight: insights[3],
    },
    {
      id: 5,
      label: "Teaching–Outcome Alignment",
      value: v[4],
      display: `${Math.round(v[4])}%`,
      target: "≥ 70%",
      status: status[4],
      change: `${
        changes[4] >= 0 ? "▲" : "▼"
      } ${Math.abs(changes[4]).toFixed(0)} pts`,
      support: campus
        ? "18 of 29 sections meet both targets"
        : "32 of 50 sections meet both targets",
      insight: insights[4],
    },
  ]
}

const terms = {
  "2025–2026|2nd Semester": {
    values: [87.2, 13.6, 82, 4.21, 64] as const,
    prior: [85.4, 15.1, 88, 4.13, 60] as const,
  },
  "2025–2026|1st Semester": {
    values: [85.4, 15.1, 88, 4.13, 60] as const,
    prior: [83.9, 16.7, 90, 4.1, 57] as const,
  },
  "2024–2025|2nd Semester": {
    values: [83.9, 16.7, 90, 4.1, 57] as const,
    prior: [82.8, 18.2, 92, 4.02, 54] as const,
  },
  "2024–2025|1st Semester": {
    values: [82.8, 18.2, 92, 4.02, 54] as const,
    prior: [81.9, 18.9, 91, 3.98, 52] as const,
  },
}

function getData(year: string, semester: string, campus: string): TermData {
  const pending = year === "2026–2027"
  const campusOnly = campus === "ARASOF-Nasugbu"
  const key = `${year}|${semester}` as keyof typeof terms
  const source = terms[key] ?? terms["2025–2026|2nd Semester"]
  const kpis = pending
    ? [
        "Course Passing Rate",
        "At-Risk Student Rate",
        "On-Time Grade Submission",
        "Average SETE Rating",
        "Teaching–Outcome Alignment",
      ].map((label, index) => ({
        id: index + 1,
        label,
        value: null,
        display: "Pending",
        target: ["≥ 85%", "≤ 10%", "≥ 95%", "≥ 4.0", "≥ 70%"][index],
        status: "Pending" as Status,
        change: "Available after term close",
        support: "Available after SETE closes and grades are submitted",
        insight: insights[index],
      }))
    : makeKpis([...source.values], [...source.prior], campusOnly)

  const endIndex = pending
    ? 4
    : year === "2024–2025"
      ? semester === "1st Semester"
        ? 1
        : 2
      : semester === "1st Semester"
        ? 3
        : 4
  const allTimeline = [
    {
      term: "1st Semester 2024–25",
      short: "1S 24–25",
      value: 4.02,
      response: 93,
      evaluations: 1964,
    },
    {
      term: "2nd Semester 2024–25",
      short: "2S 24–25",
      value: 4.1,
      response: 94,
      evaluations: 2051,
    },
    {
      term: "1st Semester 2025–26",
      short: "1S 25–26",
      value: 4.13,
      response: 95,
      evaluations: 2134,
    },
    {
      term: "2nd Semester 2025–26",
      short: "2S 25–26",
      value: 4.21,
      response: 96,
      evaluations: 2218,
    },
  ]
    .slice(0, endIndex)
    .map((d) =>
      campusOnly
        ? {
            ...d,
            value: +(d.value - 0.04).toFixed(2),
            response: d.response - 1,
            evaluations: Math.round(d.evaluations * 0.55),
          }
        : d,
    )

  const subjectDelta = pending ? 0 : kpis[0].value! - 87.2
  const subjects = [
    ["Data Structures and Algorithms", 74],
    ["Networking 1", 79],
    ["Systems Analysis and Design", 83],
    ["Web Systems", 86],
    ["Database Systems", 90],
    ["Introduction to Computing", 94],
  ].map(([name, value]) => ({
    name: String(name),
    value: Math.max(65, Math.min(98, Number(value) + subjectDelta)),
  }))

  const attention = pending
    ? [
        {
          severity: "Caution" as Status,
          kpi: "Current term",
          item: "Evaluation and grade period still open",
          detail: "KPI results pending",
          action: "Monitor completion dates",
          expanded:
            "Final KPI values will be computed only after SETE closes and grades are submitted.",
        },
      ]
    : year === "2025–2026" && semester === "2nd Semester"
      ? attentionDefault
      : [
          {
            severity: kpis[2].status,
            kpi: "KPI 3",
            item: "IT 210-A (Faculty F-019)",
            detail: "Grades 6 days late",
            action: "Follow up and document the cause",
            expanded:
              "The class missed the grade submission deadline, delaying release of SETE feedback.",
          },
          {
            severity: "Warning",
            kpi: "KPI 1",
            item: "Data Structures and Algorithms",
            detail: `Passing rate ${subjects[0].value.toFixed(0)}%`,
            action: "Arrange targeted review sessions",
            expanded:
              "The subject remains below the program passing target and requires an academic support plan.",
          },
          {
            severity: "Caution",
            kpi: "KPI 4",
            item: "IT 218-B",
            detail: "Low response count",
            action: "Interpret with caution",
            expanded:
              "Use the result only with other evidence because the SETE response count is low.",
          },
        ]

  return {
    pending,
    kpis,
    timeline: allTimeline,
    areas: [
      { label: "Criterion 1", value: 4.40 },
      { label: "Criterion 2", value: 4.32 },
      { label: "Criterion 3", value: 4.25 },
      { label: "Criterion 4", value: 4.12 },
      { label: "Criterion 5", value: 3.96 },
    ].map((d) => ({
      ...d,
      value: +(
        d.value +
        (campusOnly ? -0.04 : 0) +
        (semester === "1st Semester" ? -0.08 : 0)
      ).toFixed(2),
    })),
    subjects,
    attention,
    quadrantCounts: pending
      ? [32, 8, 6, 4]
      : kpis[4].value! >= 64
        ? [32, 8, 6, 4]
        : [30, 9, 7, 4],
  }
}

const statusTipText: Partial<Record<Status, string>> = {
  "On target": "Meets the target.",
  "Warning": "Below the target. Chair reviews the cause.",
  "Critical": "Far below the target. Escalate to the Dean.",
  "Caution": "Read this result carefully before acting.",
}

function StatusPill({ status }: { status: Status }) {
  const { tip } = useTip()
  const icon: IconName =
    status === "On target"
      ? "check"
      : status === "Warning"
        ? "triangle"
        : status === "Critical"
          ? "alert"
          : "info"
  const tipText = statusTipText[status]
  return (
    <span
      className={`status status-${status.toLowerCase().replace(" ", "-")}`}
      {...(tipText ? tip(tipText) : {})}
    >
      <Icon name={icon} size={14} />
      {status}
    </span>
  )
}

function PurposeTag({ children }: { children: React.ReactNode }) {
  return <span className="purpose-tag">{children}</span>
}

const guideItems = [
  [
    "Purpose-driven",
    "Focuses every measure on academic follow-up and program improvement.",
  ],
  [
    "User-centered",
    "Matches the Program Chair’s assigned program, campus and decision scope.",
  ],
  [
    "Data-driven",
    "Combines passing, risk, submission and SETE evidence using shared term filters.",
  ],
  [
    "Visually organized",
    "Groups alerts, KPIs, comparisons and follow-up items by decision priority.",
  ],
  [
    "Decision-oriented",
    "Connects each result to thresholds, cautions and a next decision.",
  ],
  [
    "Understandable",
    "Uses plain-language questions, consistent status labels and contextual tooltips.",
  ],
  [
    "Actionable",
    "Provides drill-downs, suggested actions, review states and Dean escalation.",
  ],
]

// ── Guided Tour ──────────────────────────────────────────
type TourStep = {
  selector: string
  title: string
  text: string
  badge: number
}

const TOUR_STEPS: TourStep[] = [
  {
    selector: ".hero",
    title: "Header and role identity",
    text: "This shows you are signed in as the Program Chair. Your data is limited to your own program.",
    badge: 1,
  },
  {
    selector: ".purpose",
    title: "Purpose line",
    text: "Every part of this dashboard supports one decision: which classes, subjects and faculty need follow-up now.",
    badge: 2,
  },
  {
    selector: ".filter-wrap",
    title: "Filter bar",
    text: "Filter by academic year, semester and campus. College and program are locked to your scope. The chips show what is active.",
    badge: 3,
  },
  {
    selector: ".alert-banner",
    title: "Alert banner",
    text: "The most serious problem appears first. Use View classes to see the cause, or Mark for Dean review to escalate.",
    badge: 4,
  },
  {
    selector: ".kpi-grid",
    title: "KPI cards",
    text: "Each card shows a KPI against its target, a status label, the change from the last term, and a 4-term trend.",
    badge: 5,
  },
  {
    selector: ".kpi-card:nth-child(3) .info-trigger",
    title: "KPI insight tooltip",
    text: "Click the i icon to see what the KPI means, why it matters, its warning thresholds, and a suggested action.",
    badge: 6,
  },
  {
    selector: ".kpi-card:nth-child(3) .drill-link",
    title: "Drill-down",
    text: "Drill down from a summary to the subject, section or class behind it. Student data stays as counts only.",
    badge: 7,
  },
  {
    selector: ".chart-a-wrap",
    title: "Chart A – SETE trend",
    text: "See whether SETE ratings are above the 4.0 target over time. Switch to evaluation criteria to find the weakest part of teaching.",
    badge: 8,
  },
  {
    selector: ".faculty-recognition-card",
    title: "Faculty & Recognition Overview",
    text: "Faculty appear by code, unranked. Starred sections meet both targets and are candidates for recognition. Confirm with other evidence first.",
    badge: 9,
  },
  {
    selector: ".chart-b-wrap",
    title: "Chart B – Rating vs passing",
    text: "Each dot is a class section. Where ratings and passing rates disagree, there is something to review. Hollow dots mean uniform ratings or few responses.",
    badge: 10,
  },
  {
    selector: ".chart-c-wrap",
    title: "Chart C – Subject passing rates",
    text: "Subjects are sorted from lowest passing rate, with the 85% target line. Use this to decide where to arrange tutoring.",
    badge: 11,
  },
  {
    selector: ".attention-section",
    title: "Needs Attention",
    text: "Your follow-up queue. Each item has a severity and a suggested action. Tick Mark reviewed when you have handled it.",
    badge: 12,
  },
  {
    selector: "footer",
    title: "Confidentiality footer",
    text: "Student data is counts only, faculty are shown by code, and SETE results appear only after grades are submitted.",
    badge: 13,
  },
]

const TOUR_LABEL_NAMES = [
  "Header and role identity",
  "Purpose line",
  "Filter bar",
  "Alert banner",
  "KPI cards",
  "KPI insight tooltip",
  "Drill-down",
  "Chart A – SETE trend",
  "Faculty & Recognition Overview",
  "Chart B – Rating vs passing",
  "Chart C – Subject passing rates",
  "Needs Attention",
  "Confidentiality footer",
]

function getSpotlightRect(selector: string): DOMRect | null {
  const el = document.querySelector(selector)
  if (!el) return null
  return el.getBoundingClientRect()
}

function GuidedTour({
  step,
  total,
  onNext,
  onBack,
  onSkip,
  openKpi3Insight,
  closeKpi3Insight,
  openKpi3Drill,
  closeKpi3Drill,
}: {
  step: number
  total: number
  onNext: () => void
  onBack: () => void
  onSkip: () => void
  openKpi3Insight: () => void
  closeKpi3Insight: () => void
  openKpi3Drill: () => void
  closeKpi3Drill: () => void
}) {
  const stepData = TOUR_STEPS[step]
  const [spotRect, setSpotRect] = useState<DOMRect | null>(null)
  const [cursorPos, setCursorPos] = useState({ x: window.innerWidth / 2, y: 100 })
  const [showRipple, setShowRipple] = useState(false)
  const [ripplePos, setRipplePos] = useState({ x: 0, y: 0 })
  const [cardVisible, setCardVisible] = useState(false)
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches

  useEffect(() => {
    setCardVisible(false)
    const el = document.querySelector(stepData.selector)
    if (!el) {
      setCardVisible(true)
      return
    }

    // Scroll target into view
    if (!reducedMotion) {
      el.scrollIntoView({ behavior: "smooth", block: "center" })
    } else {
      el.scrollIntoView({ block: "center" })
    }

    // After scroll, get position and animate cursor
    const scrollTimer = setTimeout(() => {
      const rect = el.getBoundingClientRect()
      setSpotRect(rect)
      const targetX = rect.left + rect.width * 0.3
      const targetY = rect.top + rect.height * 0.3

      if (!reducedMotion) {
        setCursorPos({ x: targetX, y: targetY })
        const rippleTimer = setTimeout(() => {
          setRipplePos({ x: targetX + 12, y: targetY + 12 })
          setShowRipple(true)
          setTimeout(() => {
            setShowRipple(false)
            setCardVisible(true)

            // For step 6 (index 5): open KPI3 insight briefly
            if (step === 5) {
              openKpi3Insight()
              setTimeout(closeKpi3Insight, 1800)
            }
            // For step 7 (index 6): open KPI3 drill briefly
            if (step === 6) {
              openKpi3Drill()
              setTimeout(closeKpi3Drill, 1800)
            }
          }, 500)
        }, 720)
        return () => clearTimeout(rippleTimer)
      } else {
        setCardVisible(true)
        if (step === 5) {
          openKpi3Insight()
          setTimeout(closeKpi3Insight, 1800)
        }
        if (step === 6) {
          openKpi3Drill()
          setTimeout(closeKpi3Drill, 1800)
        }
      }
    }, reducedMotion ? 100 : 500)

    return () => clearTimeout(scrollTimer)
  }, [step, stepData.selector])

  // Update spotRect on resize
  useEffect(() => {
    const update = () => {
      const el = document.querySelector(stepData.selector)
      if (el) setSpotRect(el.getBoundingClientRect())
    }
    window.addEventListener("resize", update)
    return () => window.removeEventListener("resize", update)
  }, [stepData.selector])

  // Keyboard nav
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "Enter") {
        if (step < total - 1) onNext(); else onSkip()
      }
      if (e.key === "ArrowLeft" && step > 0) onBack()
      if (e.key === "Escape") onSkip()
    }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [step, total, onNext, onBack, onSkip])

  // Card placement: avoid covering the element
  const cardPlacement = (): React.CSSProperties => {
    if (!spotRect) return { top: "50%", left: "50%", transform: "translate(-50%, -50%)" }
    const pad = 16
    const cardW = 320
    const cardH = 240
    const vw = window.innerWidth
    const vh = window.innerHeight

    // Try below
    if (spotRect.bottom + pad + cardH < vh) {
      const left = Math.min(Math.max(spotRect.left, pad), vw - cardW - pad)
      return { top: spotRect.bottom + pad, left }
    }
    // Try above
    if (spotRect.top - pad - cardH > 0) {
      const left = Math.min(Math.max(spotRect.left, pad), vw - cardW - pad)
      return { top: spotRect.top - cardH - pad, left }
    }
    // Try right
    if (spotRect.right + pad + cardW < vw) {
      const top = Math.min(Math.max(spotRect.top, pad), vh - cardH - pad)
      return { top, left: spotRect.right + pad }
    }
    // Fallback: left
    const top = Math.min(Math.max(spotRect.top, pad), vh - cardH - pad)
    return { top, left: Math.max(pad, spotRect.left - cardW - pad) }
  }

  const vw = window.innerWidth
  const vh = window.innerHeight
  const pad = 6

  return (
    <>
      {/* Overlay with SVG spotlight cutout */}
      <div className="tour-overlay" role="dialog" aria-modal="true" aria-label="Guided tour">
        <svg className="tour-overlay-svg" viewBox={`0 0 ${vw} ${vh}`} preserveAspectRatio="none">
          <defs>
            <mask id="tour-spotlight-mask">
              <rect width={vw} height={vh} fill="white" />
              {spotRect && (
                <rect
                  x={spotRect.left - pad}
                  y={spotRect.top - pad}
                  width={spotRect.width + pad * 2}
                  height={spotRect.height + pad * 2}
                  rx={8}
                  fill="black"
                />
              )}
            </mask>
          </defs>
          <rect width={vw} height={vh} fill="rgba(0,0,0,0.55)" mask="url(#tour-spotlight-mask)" />
          {spotRect && (
            <rect
              x={spotRect.left - pad}
              y={spotRect.top - pad}
              width={spotRect.width + pad * 2}
              height={spotRect.height + pad * 2}
              rx={8}
              fill="none"
              stroke="#D32F3A"
              strokeWidth={2.5}
            />
          )}
        </svg>
      </div>

      {/* Cursor */}
      {!reducedMotion && (
        <div
          className="tour-cursor"
          style={{ left: cursorPos.x, top: cursorPos.y }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M5 3l14 9-7 1-4 7-3-17z" fill="white" stroke="#333" strokeWidth="1.2" />
          </svg>
        </div>
      )}

      {/* Click ripple */}
      {showRipple && !reducedMotion && (
        <div className="tour-ripple" style={{ left: ripplePos.x, top: ripplePos.y }} />
      )}

      {/* Explanation card */}
      {cardVisible && (
        <div className="tour-card" style={cardPlacement()}>
          <div className="tour-step-badge">Step {step + 1} of {total}</div>
          <h3>{stepData.title}</h3>
          <p>{stepData.text}</p>
          <div className="tour-progress">
            <div className="tour-progress-bar" style={{ width: `${((step + 1) / total) * 100}%` }} />
          </div>
          <div className="tour-card-buttons">
            <button className="tour-btn-skip-text" onClick={onSkip}>Skip tour</button>
            <div className="tour-nav-buttons">
              {step > 0 && <button className="tour-btn-back" onClick={onBack}>Back</button>}
              <button className="tour-btn-next" onClick={step < total - 1 ? onNext : onSkip}>
                {step < total - 1 ? "Next" : "Finish"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pinned skip */}
      <button className="tour-pinned-skip" onClick={onSkip}>Skip tour ✕</button>
    </>
  )
}

function WelcomeModal({ onStart, onSkip }: { onStart: () => void; onSkip: () => void }) {
  return (
    <div className="tour-backdrop" role="dialog" aria-modal="true" aria-label="Tour welcome">
      <div className="tour-welcome">
        <h2>Welcome to Spartan Portal – Program Analytics</h2>
        <p>Take a 1-minute tour of the dashboard?</p>
        <div className="tour-welcome-buttons">
          <button className="tour-btn-primary" onClick={onStart}>Start tour</button>
          <button className="tour-btn-secondary" onClick={onSkip}>Skip</button>
        </div>
        <small>All data shown is fictional sample data.</small>
      </div>
    </div>
  )
}

function GuidePanel({ close }: { close: () => void }) {
  return (
    <div className="guide-panel" role="dialog" aria-label="Dashboard guide">
      <div className="guide-head">
        <div>
          <span>DASHBOARD GUIDE</span>
          <h2>How to read this dashboard</h2>
        </div>
        <button aria-label="Close dashboard guide" onClick={close}>
          <Icon name="x" size={18} />
        </button>
      </div>
      <div className="guide-list">
        {guideItems.map(([title, detail]) => (
          <div key={title}>
            <Icon name="check" size={15} />
            <p>
              <strong>{title}</strong>
              {detail}
            </p>
          </div>
        ))}
      </div>
      <p className="guide-responsibility">
        <Icon name="info" size={17} />
        <span>
          <strong>Decision support:</strong> this dashboard informs decisions.
          The Program Chair stays responsible.
        </span>
      </p>
    </div>
  )
}

function Header({
  onGuide,
  onReplayTour,
  showLabels,
  onToggleLabels,
  activeLabelIndex,
}: {
  onGuide: () => void
  onReplayTour: () => void
  showLabels: boolean
  onToggleLabels: () => void
  activeLabelIndex?: number | null
}) {
  const { tip: tipFn } = useTip()
  return (
    <>
      <header className="topbar">
        <div className="shell topbar-inner">
          <div className="brand">
            <span className="logo">
              <Icon name="shield" size={20} />
            </span>
            <strong>Spartan Portal</strong>
          </div>
          <div className="topbar-actions">
            <button
              type="button"
              className="guide-button"
              onClick={onGuide}
              {...tipFn("How this dashboard is meant to be read.")}
            >
              <Icon name="help" size={16} />
              Dashboard guide
            </button>
            <button
              type="button"
              className="tour-replay-btn"
              onClick={onReplayTour}
              {...tipFn("Watch the guided tour again.")}
            >
              ▶ Replay tour
            </button>
            <button
              type="button"
              className={`tour-labels-toggle ${showLabels ? "active" : ""}`}
              onClick={onToggleLabels}
              {...tipFn("Show numbered labels on each section.")}
            >
              {showLabels ? "● " : "○ "}Show labels
            </button>
            <span>Thursday, November 5, 2026</span>
          </div>
        </div>
      </header>
      <div className="utility">
        <div className="shell utility-inner">
          <button>
            <span className="round-icon">
              <Icon name="key" size={15} />
            </span>
            Change Password
          </button>
          <button>
            <Icon name="logout" size={17} />
            Sign-out
          </button>
        </div>
      </div>
      <section
        className={`hero ${activeLabelIndex === 0 ? "section-highlighted" : ""}`}
        style={{ position: "relative" }}
      >
        {showLabels && (
          <span
            className={`tour-section-badge ${activeLabelIndex === 0 ? "badge-active" : ""}`}
            style={{ top: 10, left: 14, zIndex: 10 }}
          >
            1
          </span>
        )}
        <div className="hero-photo" />
        <div className="slash slash-one" />
        <div className="slash slash-two" />
        <div className="shell hero-content">
          <div className="avatar">
            <Icon name="user" size={42} />
          </div>
          <div>
            <div className="role">PROGRAM CHAIR</div>
            <h1>
              College of Informatics and Computing Sciences – ARASOF-Nasugbu
              Campus
            </h1>
            <p>BS Information Technology – Program Chair</p>
            <div className="authorized">
              <Icon name="check" size={15} /> AUTHORIZED ACCESS
            </div>
          </div>
        </div>
      </section>
      <nav className="tabs">
        <div className="shell tabs-inner">
          {["Home", "News", "Advisories", "Schedules", "Downloads"].map((n) => (
            <button key={n}>{n}</button>
          ))}
          <button className="active">
            <Icon name="bars" size={17} />
            Program Analytics
          </button>
        </div>
      </nav>
    </>
  )
}

function Filters({
  year,
  semester,
  campus,
  setYear,
  setSemester,
  setCampus,
  reset,
  disabled,
}: {
  year: string
  semester: string
  campus: string
  setYear: (s: string) => void
  setSemester: (s: string) => void
  setCampus: (s: string) => void
  reset: () => void
  disabled?: boolean
}) {
  const { tip } = useTip()
  return (
    <div className="filter-wrap">
      <div className="filter-title">
        <Icon name="filter" size={17} /> Filter options
      </div>
      <div className="filters">
        <label>
          Academic Year
          <select
            disabled={disabled}
            value={year}
            onChange={(e) => setYear(e.target.value)}
            {...tip("Changes every card, chart and list on this page.")}
          >
            <option>2024–2025</option>
            <option>2025–2026</option>
            <option>2026–2027</option>
          </select>
        </label>
        <label>
          Semester
          <select
            disabled={disabled}
            value={semester}
            onChange={(e) => setSemester(e.target.value)}
            {...tip("Changes every card, chart and list on this page.")}
          >
            <option>1st Semester</option>
            <option>2nd Semester</option>
          </select>
        </label>
        <label className="locked">
          College
          <span
            className="locked-select"
            {...tip("Limited to your assigned scope.")}
          >
            College of Informatics and Computing Sciences{" "}
            <Icon name="lock" size={14} />
          </span>
        </label>
        <label className="locked program">
          Program
          <span
            className="locked-select"
            {...tip("Limited to your assigned scope.")}
          >
            BS Information Technology <Icon name="lock" size={14} />
          </span>
        </label>
        <label>
          Campus
          <select
            disabled={disabled}
            value={campus}
            onChange={(e) => setCampus(e.target.value)}
            {...tip("Changes every card, chart and list on this page.")}
          >
            <option>All campuses</option>
            <option>ARASOF-Nasugbu</option>
          </select>
        </label>
        <button disabled={disabled} className="reset" onClick={reset} {...tip("Return to the default filters.")}>
          Reset
        </button>
      </div>
      <div className="active-filter-chips" aria-label="Active filters">
        <span {...tip("Active filter.")}>{year}</span>
        <span {...tip("Active filter.")}>{semester}</span>
        <span {...tip("Active filter.")}>{campus}</span>
      </div>
    </div>
  )
}

function Insight({ kpi, close }: { kpi: Kpi; close?: () => void }) {
  return (
    <div
      className="insight-popover"
      role="dialog"
      aria-label={`${kpi.label} insight`}
    >
      <div className="popover-head">
        <strong>KPI {kpi.id} insight</strong>
        {close && (
          <button aria-label="Close insight" onClick={close}>
            <Icon name="x" size={16} />
          </button>
        )}
      </div>
      {[
        "What it tells you",
        "Why it matters",
        "Suggested action",
        "Thresholds",
      ].map((heading, i) => (
        <div className="insight-part" key={heading}>
          <span>
            {heading}
            {heading === "Suggested action" && (
              <PurposeTag>Decision support</PurposeTag>
            )}
          </span>
          <p>{i === 3 ? thresholds[kpi.id - 1] : kpi.insight[i]}</p>
        </div>
      ))}
    </div>
  )
}

function useAnimatedNumber(value: number | null, duration = 500) {
  const [shown, setShown] = useState(value ?? 0)
  const previous = useRef(value ?? 0)
  useEffect(() => {
    if (value === null) return
    const start = previous.current
    const began = performance.now()
    let frame = 0
    const tick = (now: number) => {
      const p = Math.min((now - began) / duration, 1)
      setShown(start + (value - start) * (1 - Math.pow(1 - p, 3)))
      if (p < 1) frame = requestAnimationFrame(tick)
      else previous.current = value
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [value, duration])
  return shown
}

function MiniSparkline({ kpi }: { kpi: Kpi }) {
  const { tip } = useTip()
  const defaults = [
    [82.8, 83.9, 85.4, 87.2],
    [18.2, 16.7, 15.1, 13.6],
    [92, 90, 88, 82],
    [4.02, 4.1, 4.13, 4.21],
    [54, 57, 60, 64],
  ]
  const base = defaults[kpi.id - 1]
  const delta = kpi.value === null ? 0 : kpi.value - base[3]
  const values = base.map((v) => v + delta)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const points = values
    .map((value, i) => {
      const x = 4 + i * 29
      const y = 22 - ((value - min) / Math.max(max - min, 0.01)) * 16
      return `${x},${y}`
    })
    .join(" ")
  return (
    <div className="mini-spark" {...tip("Last 4 terms.")}>
      <span>Last 4 terms</span>
      <svg viewBox="0 0 95 28" aria-label={`${kpi.label} last four terms`}>
        <polyline points={points} />
        {points.split(" ").map((point, i) => {
          const [cx, cy] = point.split(",")
          return <circle key={i} cx={cx} cy={cy} r={i === 3 ? 2.5 : 1.7} />
        })}
      </svg>
    </div>
  )
}

const kpiCardTips = [
  "Share of graded students who passed. Target 85% or higher.",
  "Students with at least one failing or incomplete grade. Target 10% or lower.",
  "Classes that submitted grades on time. Target 95% or higher.",
  "Average of all star ratings, 1 to 5. Target 4.0 or higher. Read with KPI 1 and KPI 5.",
  "Sections that meet both the passing and rating targets. Target 70% or higher.",
]

function KpiCard({
  kpi,
  index,
  open,
  onToggle,
  onDrill,
  showLabels,
  activeLabelIndex,
}: {
  kpi: Kpi
  index: number
  open: boolean
  onToggle: () => void
  onDrill: () => void
  showLabels?: boolean
  activeLabelIndex?: number | null
}) {
  const { tip } = useTip()
  const animated = useAnimatedNumber(kpi.value)
  const shown = animated ?? kpi.value
  const display =
    shown === null
      ? "—"
      : kpi.id === 4
        ? `${shown.toFixed(2)} / 5`
        : kpi.id === 5
          ? `${Math.round(shown)}%`
          : `${shown.toFixed(1)}%`

  const isCardTarget = kpi.id === 3 && (activeLabelIndex === 5 || activeLabelIndex === 6)
  const isTipHighlight = kpi.id === 3 && activeLabelIndex === 5
  const isDrillHighlight = kpi.id === 3 && activeLabelIndex === 6

  return (
    <article
      className={`kpi-card ${open ? "is-open" : ""} ${isCardTarget ? "kpi-card-target" : ""}`}
      style={{ animationDelay: `${index * 60}ms` }}
      onClick={onToggle}
    >
      <button
        className="kpi-hit"
        aria-expanded={open}
        aria-label={`Open ${kpi.label} insight`}
      />
      <div className="kpi-top">
        <span>KPI {kpi.id}</span>
        <span
          className={`info-trigger ${isTipHighlight ? "element-highlighted active-highlight" : ""}`}
          style={{ position: "relative" }}
          {...tip("Click for what it means, why it matters and the suggested action.")}
        >
          {showLabels && kpi.id === 3 && (
            <span
              className={`tour-section-badge ${activeLabelIndex === 5 ? "badge-active" : ""}`}
              style={{
                top: -12,
                right: -12,
                left: "auto",
              }}
            >
              6
            </span>
          )}
          <Icon name="info" size={17} />
          <span className="micro-tooltip">
            <strong>Decision support · </strong>
            {kpi.insight[0]}
          </span>
        </span>
      </div>
      <h3 {...tip(kpiCardTips[kpi.id - 1])}>{kpi.label}</h3>
      <div className={`kpi-value ${kpi.value === null ? "pending" : ""}`} {...tip(kpiCardTips[kpi.id - 1])}>
        {display}
      </div>
      <div className="target">
        Target <strong>{kpi.target}</strong>
      </div>
      <div className="kpi-meta">
        <StatusPill status={kpi.status} />
        <span className="change" {...tip("Change from the previous term. Green means favorable, red means unfavorable.")}>{kpi.change}</span>
      </div>
      <p className="support">{kpi.support}</p>
      <MiniSparkline kpi={kpi} />
      <button
        className={`drill-link ${isDrillHighlight ? "element-highlighted active-highlight" : ""}`}
        style={{ position: "relative" }}
        onClick={(event) => {
          event.stopPropagation()
          onDrill()
        }}
        {...tip("See the subject, section or class behind this number.")}
      >
        {showLabels && kpi.id === 3 && (
          <span
            className={`tour-section-badge ${activeLabelIndex === 6 ? "badge-active" : ""}`}
            style={{
              top: -8,
              left: -14,
            }}
          >
            7
          </span>
        )}
        Drill down <span>›</span>
      </button>
      {open && <Insight kpi={kpi} close={onToggle} />}
    </article>
  )
}

function ChartTip({
  children,
  x,
  y,
}: {
  children: React.ReactNode
  x: number
  y: number
}) {
  return (
    <div className="chart-tip" style={{ left: `${x}%`, top: `${y}%` }}>
      {children}
    </div>
  )
}

function ChartA({
  data,
  staticMode,
  onDrill,
  highlighted,
}: {
  data: TermData
  staticMode?: boolean
  onDrill: (kpi: number, path?: string[]) => void
  highlighted?: boolean
}) {
  const { tip, tipShow, tipHide, tipMove } = useTip()
  const [view, setView] = useState<"semester" | "area">("semester")
  const [hover, setHover] = useState<number | null>(null)
  const chartWidth = 1280
  const chartHeight = 250
  const plotLeft = 58
  const plotRight = 1215
  const plotTop = 20
  const plotBottom = 210
  const getY = (value: number) =>
    plotBottom - ((value - 1) / 4) * (plotBottom - plotTop)
  const points = data.timeline.map((d, i) => ({
    x:
      data.timeline.length === 1
        ? (plotLeft + plotRight) / 2
        : plotLeft + i * ((plotRight - plotLeft) / (data.timeline.length - 1)),
    y: getY(d.value),
  }))
  const targetY = getY(4)
  const path = points.reduce((d, point, index) => {
    if (index === 0) return `M ${point.x} ${point.y}`
    const previous = points[index - 1]
    const midpoint = (previous.x + point.x) / 2
    return `${d} C ${midpoint} ${previous.y}, ${midpoint} ${point.y}, ${point.x} ${point.y}`
  }, "")
  return (
    <article className={`chart-card ${highlighted ? "section-highlighted" : ""}`}>
      <div className="chart-head">
        <div>
          <div className="chart-labels">
            <span className="eyebrow">Chart A</span>
            <PurposeTag>Trend monitoring</PurposeTag>
          </div>
          <h3>Is teaching rated above target over time?</h3>
          <p className="so-what">
            So what? Ratings remain above target and are improving gradually.
          </p>
        </div>
        <span {...tip("Compare SETE results with the 4.0 target.")}>
          <Icon name="info" size={17} />
        </span>
      </div>
      <div className="segmented">
        <button
          disabled={staticMode}
          className={view === "semester" ? "active" : ""}
          onClick={() => setView("semester")}
          {...tip("Switch between semesters and evaluation criteria.")}
        >
          By semester
        </button>
        <button
          disabled={staticMode}
          className={view === "area" ? "active" : ""}
          onClick={() => setView("area")}
          {...tip("Switch between semesters and evaluation criteria.")}
        >
          By evaluation criterion
        </button>
      </div>
      {view === "semester" ? (
        <div className="chart-box">
          <svg
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            preserveAspectRatio="xMidYMid meet"
            aria-label="Average SETE rating line chart"
          >
            <rect
              className="target-zone"
              x={plotLeft}
              y={plotTop}
              width={plotRight - plotLeft}
              height={targetY - plotTop}
            />
            {[1, 2, 3, 4, 5].map((n) => (
              <g key={n}>
                <line
                  className="grid"
                  x1={plotLeft}
                  x2={plotRight}
                  y1={getY(n)}
                  y2={getY(n)}
                />
                <text className="axis-label" x="25" y={getY(n) + 4}>
                  {n}
                </text>
              </g>
            ))}
            <line
              className="target-line"
              x1={plotLeft}
              x2={plotRight}
              y1={targetY}
              y2={targetY}
              onMouseEnter={(e) => tipShow("Target: 4.0", e.clientX, e.clientY)}
              onMouseLeave={() => tipHide()}
              onMouseMove={(e) => tipMove(e.clientX, e.clientY)}
              style={{ cursor: "default", pointerEvents: "stroke" }}
            />
            <text
              className="target-label"
              x={plotLeft}
              y={targetY - 6}
              textAnchor="start"
            >
              Target 4.0
            </text>
            {points.length > 1 && <path className="line-path" d={path} />}
            {hover !== null && (
              <g className="chart-crosshair">
                <line
                  x1={points[hover].x}
                  x2={points[hover].x}
                  y1={plotTop}
                  y2={plotBottom}
                />
                <line
                  x1={plotLeft}
                  x2={plotRight}
                  y1={points[hover].y}
                  y2={points[hover].y}
                />
              </g>
            )}
            {points.map((p, i) => (
              <g
                key={data.timeline[i].short}
                className={hover !== null && hover !== i ? "chart-dimmed" : ""}
              >
                <text
                  className="value-label"
                  x={p.x}
                  y={p.y - 12}
                  textAnchor="middle"
                >
                  {data.timeline[i].value.toFixed(2)}
                </text>
                <circle
                  className="line-dot"
                  cx={p.x}
                  cy={p.y}
                  r="6"
                  onMouseEnter={(e) => {
                    setHover(i)
                    tipShow(
                      `${data.timeline[i].term} · Average ${data.timeline[i].value.toFixed(2)} · Response rate ${data.timeline[i].response}% · ${data.timeline[i].evaluations.toLocaleString()} evaluations`,
                      e.clientX,
                      e.clientY
                    )
                  }}
                  onMouseLeave={() => {
                    setHover(null)
                    tipHide()
                  }}
                  onMouseMove={(e) => tipMove(e.clientX, e.clientY)}
                  onClick={() => {
                    tipHide()
                    if (!staticMode) onDrill(4)
                  }}
                />
                <text
                  className="term-label"
                  x={p.x}
                  y="238"
                  textAnchor="middle"
                >
                  {data.timeline[i].short}
                </text>
              </g>
            ))}
          </svg>
          {hover !== null && (
            <ChartTip
              x={(points[hover].x / chartWidth) * 100}
              y={Math.max(8, (points[hover].y / chartHeight) * 100)}
            >
              <strong>{data.timeline[hover].term}</strong>
              <span>Average {data.timeline[hover].value.toFixed(2)}</span>
              <span>Response rate {data.timeline[hover].response}%</span>
              <span>
                {data.timeline[hover].evaluations.toLocaleString()} evaluations
              </span>
            </ChartTip>
          )}
        </div>
      ) : (
        <div className="area-chart">
          <div className="area-target" />
          {hover !== null && (
            <i
              className="area-hover-crosshair"
              style={{
                left: `calc(52px + (100% - 86px) * ${data.areas[hover].value / 5})`,
              }}
            />
          )}
          {data.areas.map((d, i) => (
            <div
              className={`area-row ${
                hover !== null && hover !== i ? "chart-dimmed" : ""
              }`}
              key={d.label}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              onClick={() => !staticMode && onDrill(4, [d.label])}
            >
              <span>{d.label}</span>
              <div>
                <i
                  style={{
                    width: `${(d.value / 5) * 100}%`,
                    animationDelay: `${i * 60}ms`,
                  }}
                />
              </div>
              <strong>{d.value.toFixed(2)}</strong>
            </div>
          ))}
          <small>
            Criterion names are placeholders for the SETE question groups.
          </small>
        </div>
      )}
    </article>
  )
}

const sectionNames = [
  "IT 305-A",
  "IT 312-A",
  "IT 204-B",
  "IT 221-A",
  "IT 310-C",
  "IT 205-A",
  "IT 211-B",
  "IT 304-A",
  "IT 306-B",
  "IT 220-A",
  "IT 201-C",
  "IT 313-A",
  "IT 208-B",
  "IT 315-A",
  "IT 203-A",
  "IT 311-C",
  "IT 212-A",
  "IT 307-B",
  "IT 209-A",
  "IT 302-C",
  "IT 214-A",
  "IT 308-B",
  "IT 216-C",
  "IT 303-A",
  "IT 217-B",
  "IT 309-A",
  "IT 202-C",
  "IT 301-A",
  "IT 215-B",
  "IT 218-A",
  "IT 219-C",
  "IT 206-A",
  "IT 320-A",
  "IT 321-B",
  "IT 322-C",
  "IT 323-A",
  "IT 324-B",
  "IT 325-A",
  "IT 326-C",
  "IT 327-A",
  "IT 328-B",
  "IT 329-A",
  "IT 330-C",
  "IT 331-A",
  "IT 332-B",
  "IT 333-A",
  "IT 334-C",
  "IT 335-A",
  "IT 336-B",
  "IT 337-A",
]
const subjectsShort = [
  "Web Systems",
  "Data Structures",
  "Database Systems",
  "Networking 1",
  "Systems Analysis",
]

function makeDots(counts: [number, number, number, number]) {
  const dots: {
    code: string
    subject: string
    pass: number
    rating: number
    response: number
    flagged: boolean
    quadrant: string
  }[] = []
  const groups = [
    {
      count: counts[0],
      pass: [87, 97],
      rate: [4.05, 4.7],
      quadrant: "Meets both",
    },
    {
      count: counts[1],
      pass: [72, 83],
      rate: [4.05, 4.6],
      quadrant: "High rating, low passing",
    },
    {
      count: counts[2],
      pass: [87, 96],
      rate: [3.45, 3.92],
      quadrant: "Low rating, high passing",
    },
    {
      count: counts[3],
      pass: [72, 83],
      rate: [3.35, 3.9],
      quadrant: "Both below target",
    },
  ]
  groups.forEach((g, gi) =>
    Array.from({ length: g.count }).forEach((_, j) => {
      const i = dots.length
      dots.push({
        code: sectionNames[i],
        subject: subjectsShort[i % 5],
        pass: g.pass[0] + ((j * 7 + gi * 3) % (g.pass[1] - g.pass[0] + 1)),
        rating: +(
          g.rate[0] +
          (((j * 11) % 50) / 50) * (g.rate[1] - g.rate[0])
        ).toFixed(2),
        response: 72 + ((i * 7) % 27),
        flagged: i % 11 === 0 || i === 0,
        quadrant: g.quadrant,
      })
    }),
  )
  return dots
}

function ChartB({
  data,
  onDrill,
  highlighted,
}: {
  data: TermData
  onDrill: (kpi: number, path?: string[]) => void
  highlighted?: boolean
}) {
  const { tip, tipShow, tipHide, tipMove } = useTip()
  const [hover, setHover] = useState<number | null>(null)
  const dots = useMemo(
    () => makeDots(data.quadrantCounts),
    [data.quadrantCounts],
  )
  return (
    <article className={`chart-card ${highlighted ? "section-highlighted" : ""}`}>
      <div className="chart-head">
        <div>
          <div className="chart-labels">
            <span className="eyebrow">Chart B</span>
            <PurposeTag>Comparative analysis</PurposeTag>
          </div>
          <h3>Do ratings and results agree?</h3>
          <p className="so-what">
            So what? 18 sections need review because ratings and outcomes differ
            or both miss target.
          </p>
        </div>
        <span {...tip("Each dot is one class section.")}>
          <Icon name="info" size={17} />
        </span>
      </div>
      <div className="scatter">
        {hover !== null && (
          <>
            <div
              className="scatter-crosshair vertical"
              style={{
                left: `${7 + ((dots[hover].pass - 65) / 35) * 88}%`,
              }}
            />
            <div
              className="scatter-crosshair horizontal"
              style={{
                top: `${92 - ((dots[hover].rating - 3) / 2) * 84}%`,
              }}
            />
          </>
        )}
        <div className="quadrant q1" style={{ pointerEvents: "auto" }} {...tip("Maintain current practices; candidates for recognition.")}>
          <strong>Meets both · {data.quadrantCounts[0]}</strong>
        </div>
        <div className="quadrant q2" style={{ pointerEvents: "auto" }} {...tip("Review assessments and curriculum.")}>
          <strong>High rating, low passing · {data.quadrantCounts[1]}</strong>
          <span>Review assessments and curriculum</span>
        </div>
        <div className="quadrant q3" style={{ pointerEvents: "auto" }} {...tip("Review teaching delivery.")}>
          <strong>Low rating, high passing · {data.quadrantCounts[2]}</strong>
          <span>Review teaching delivery</span>
        </div>
        <div className="quadrant q4" style={{ pointerEvents: "auto" }} {...tip("Review both teaching delivery and assessments.")}>
          <strong>Both below target · {data.quadrantCounts[3]}</strong>
          <span>Review</span>
        </div>
        <div className="scatter-y">SETE average</div>
        <div className="scatter-x">Passing rate (%)</div>
        <div className="v-ref" style={{ pointerEvents: "auto" }} {...tip("85% passing target")}>
          <span className="ref-line-label v-label">85% passing target</span>
        </div>
        <div className="h-ref" style={{ pointerEvents: "auto" }} {...tip("4.0 rating target")}>
          <span className="ref-line-label h-label">4.0 rating target</span>
        </div>
        <div className="scatter-ticks-x">
          <span className="tick-x-60">60%</span>
          <span className="tick-x-85">85%</span>
          <span className="tick-x-100">100%</span>
        </div>
        <div className="scatter-ticks-y">
          <span className="tick-y-5">5.0</span>
          <span className="tick-y-4">4.0</span>
          <span className="tick-y-3">3.0</span>
        </div>
        {dots.map((d, i) => {
          const x = 7 + ((d.pass - 65) / 35) * 88
          const y = 92 - ((d.rating - 3) / 2) * 84
          return (
            <button
              aria-label={`${d.code} chart point`}
              key={d.code}
              className={`dot ${d.flagged ? "flagged" : ""} ${
                hover !== null && hover !== i ? "chart-dimmed" : ""
              } ${hover === i ? "highlighted" : ""}`}
              style={{ left: `${x}%`, top: `${y}%` }}
              onMouseEnter={(e) => {
                setHover(i)
                tipShow(
                  `${d.code} · Passing rate ${d.pass}% · SETE average ${d.rating} · Response rate ${d.response}%${d.flagged ? " · Interpret with caution." : ""}`,
                  e.clientX,
                  e.clientY
                )
              }}
              onMouseLeave={() => {
                setHover(null)
                tipHide()
              }}
              onMouseMove={(e) => tipMove(e.clientX, e.clientY)}
              onClick={() => {
                tipHide()
                onDrill(5, [d.quadrant, d.code])
              }}
            />
          )
        })}
        {hover !== null && (
          <ChartTip
            x={Math.min(62, 7 + ((dots[hover].pass - 65) / 35) * 88)}
            y={Math.max(2, 78 - ((dots[hover].rating - 3) / 2) * 84)}
          >
            <strong>{dots[hover].code}</strong>
            <span>{dots[hover].subject}</span>
            <span>Passing rate {dots[hover].pass}%</span>
            <span>SETE average {dots[hover].rating}</span>
            <span>Response rate {dots[hover].response}%</span>
            {dots[hover].flagged && <em>Interpret with caution</em>}
          </ChartTip>
        )}
      </div>
      <div className="ring-key">
        <i /> Hollow ring: uniform ratings or few responses
      </div>
    </article>
  )
}

function subjectStatus(value: number): Status {
  return value < 75 ? "Critical" : value < 85 ? "Warning" : "On target"
}

function ChartC({
  data,
  onDrill,
  highlighted,
}: {
  data: TermData
  onDrill: (kpi: number, path?: string[]) => void
  highlighted?: boolean
}) {
  const { tip, tipShow, tipHide, tipMove } = useTip()
  const [hover, setHover] = useState<number | null>(null)
  return (
    <article className={`chart-card ${highlighted ? "section-highlighted" : ""}`}>
      <div className="chart-head">
        <div>
          <div className="chart-labels">
            <span className="eyebrow">Chart C</span>
            <PurposeTag>Comparative analysis</PurposeTag>
          </div>
          <h3>Which subjects fall below the passing target?</h3>
          <p className="so-what">
            So what? Three subjects are below target; Data Structures needs
            urgent academic support.
          </p>
        </div>
        <span {...tip("Subjects are sorted from lowest passing rate.")}>
          <Icon name="info" size={17} />
        </span>
      </div>
      <div className="subject-chart">
        <div className="subject-scale">
          <span className="tick-0">0</span>
          <span className="tick-50">50</span>
          <span className="tick-85">85% target</span>
          <span className="tick-100">100%</span>
        </div>
        <div
          className="subject-target"
          onMouseEnter={(e) => tipShow("Target: 85% passing rate", e.clientX, e.clientY)}
          onMouseLeave={() => tipHide()}
          onMouseMove={(e) => tipMove(e.clientX, e.clientY)}
          style={{ cursor: "default" }}
        />
        {data.subjects.map((d, i) => (
          <div
            className={`subject-row ${
              hover !== null && hover !== i ? "chart-dimmed" : ""
            } ${hover === i ? "is-hovered" : ""}`}
            key={d.name}
            onMouseEnter={(e) => {
              setHover(i)
              tipShow(
                `${d.name} · Passing rate ${d.value.toFixed(0)}% · ${Math.abs(85 - d.value).toFixed(0)} points from the 85% target`,
                e.clientX,
                e.clientY
              )
            }}
            onMouseLeave={() => {
              setHover(null)
              tipHide()
            }}
            onMouseMove={(e) => tipMove(e.clientX, e.clientY)}
            onClick={() => {
              tipHide()
              onDrill(1, [d.name])
            }}
          >
            {hover === i && (
              <i
                className="subject-crosshair"
                style={{
                  left: `calc(139px + (100% - 168px) * ${d.value / 100})`,
                }}
              />
            )}
            <span>{d.name}</span>
            <div className="subject-bar-track">
              <i
                className={`bar-${subjectStatus(d.value).toLowerCase().replace(" ", "-")}`}
                style={{ width: `${d.value}%`, animationDelay: `${i * 60}ms` }}
              />
            </div>
            <strong>{d.value.toFixed(0)}%</strong>
            {hover === i && (
              <ChartTip x={43} y={14 + i * 13.4}>
                <strong>{d.name}</strong>
                <span>Passing rate {d.value.toFixed(0)}%</span>
                <span>
                  {d.value >= 85
                    ? `${(d.value - 85).toFixed(0)} pts above target`
                    : `${(85 - d.value).toFixed(0)} pts below target`}
                </span>
              </ChartTip>
            )}
          </div>
        ))}
      </div>
    </article>
  )
}

function AlertBanner({
  data,
  onView,
  onDean,
  staticMode,
}: {
  data: TermData
  onView: () => void
  onDean: () => void
  staticMode?: boolean
}) {
  const { tip } = useTip()
  if (data.pending)
    return (
      <div className="alert-banner info-banner">
        <Icon name="info" size={23} />
        <div>
          <PurposeTag>Problem identification</PurposeTag>
          <strong>Term in progress.</strong> KPIs are computed after the
          evaluation period and grade submission.
        </div>
      </div>
    )
  const grade = data.kpis[2]
  const late = grade.support.includes("29")
    ? 5
    : Math.round(50 * (1 - grade.value! / 100))
  return (
    <div className="alert-banner critical-banner">
      <Icon name="alert" size={23} />
      <div className="alert-copy">
        <PurposeTag>Problem identification</PurposeTag>
        <strong>Critical · KPI 3</strong> On-Time Grade Submission is{" "}
        {grade.value!.toFixed(1)}% (target 95%). {late} of{" "}
        {grade.support.includes("29") ? 29 : 50} classes submitted grades late.
        Faculty receive SETE results only after submitting grades, so these
        classes also delay teaching feedback.
      </div>
      <div className="alert-actions">
        <PurposeTag>Decision support</PurposeTag>
        <button disabled={staticMode} onClick={onView} {...tip("Open the list of classes behind this alert.")}>
          View classes
        </button>
        <button disabled={staticMode} className="secondary" onClick={onDean} {...tip("Flag this issue for the Dean to review.")}>
          Mark for Dean review
        </button>
      </div>
    </div>
  )
}

function AttentionTable({
  data,
  tableRef,
  staticMode,
  onDrill,
  highlighted,
}: {
  data: TermData
  tableRef: React.RefObject<HTMLDivElement | null>
  staticMode?: boolean
  onDrill: (kpi: number, path?: string[]) => void
  highlighted?: boolean
}) {
  const { tip } = useTip()
  const [expanded, setExpanded] = useState<number | null>(null)
  const [reviewed, setReviewed] = useState<Set<number>>(new Set())
  const toggleReviewed = (index: number) => {
    setReviewed((current) => {
      const next = new Set(current)
      if (next.has(index)) next.delete(index)
      else next.add(index)
      return next
    })
  }
  return (
    <section className={`attention-section ${highlighted ? "section-highlighted" : ""}`} ref={tableRef}>
      <div className="section-title">
        <div>
          <span>FOLLOW-UP QUEUE</span>
          <h2>NEEDS ATTENTION</h2>
          <PurposeTag>Problem identification</PurposeTag>
        </div>
        <span>{data.attention.length} items</span>
      </div>
      <div className="attention-table">
        <div className="attention-head">
          <span>Severity</span>
          <span>Item</span>
          <span>Detail</span>
          <span>Suggested action</span>
          <span>Review</span>
          <span />
        </div>
        {data.attention.map((row, i) => (
          <div
            className={`attention-item ${expanded === i ? "expanded" : ""} ${
              reviewed.has(i) ? "reviewed" : ""
            }`}
            key={`${row.item}-${i}`}
          >
            <div
              className="attention-row"
              role="button"
              tabIndex={staticMode ? -1 : 0}
              onClick={() => {
                if (staticMode) return
                const kpi = Number(row.kpi.replace(/\D/g, "")) || 3
                onDrill(kpi, [row.item.replace(/ \(Faculty.*\)/, "")])
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !staticMode) {
                  const kpi = Number(row.kpi.replace(/\D/g, "")) || 3
                  onDrill(kpi, [row.item.replace(/ \(Faculty.*\)/, "")])
                }
              }}
            >
              {reviewed.has(i) ? (
                <span className="reviewed-pill">
                  <Icon name="check" size={14} /> Reviewed
                </span>
              ) : (
                <StatusPill status={row.severity} />
              )}
              <span className="item">
                <small>{row.kpi}</small>
                {row.item}
              </span>
              <span>{row.detail}</span>
              <strong>
                {row.action}
                <PurposeTag>Decision support</PurposeTag>
              </strong>
              <label
                className="review-check"
                onClick={(event) => event.stopPropagation()}
                {...tip("Mark this item as handled.")}
              >
                <input
                  type="checkbox"
                  disabled={staticMode}
                  checked={reviewed.has(i)}
                  onChange={() => toggleReviewed(i)}
                />
                <span>{reviewed.has(i) ? "Reviewed" : "Mark reviewed"}</span>
              </label>
              <button
                className="expand-row"
                disabled={staticMode}
                aria-label={`Expand ${row.item}`}
                onClick={(event) => {
                  event.stopPropagation()
                  setExpanded(expanded === i ? null : i)
                }}
                {...tip("Show details and the suggested action.")}
              >
                <Icon name="chevron" size={18} />
              </button>
            </div>
            {expanded === i && (
              <div className="row-detail">
                <Icon name="info" size={16} />
                <div>
                  <strong>Full detail</strong>
                  <p>{row.expanded}</p>
                  <strong>Suggested action</strong>
                  <p>{row.action}</p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      <p className="attention-footer">
        Showing the most urgent items. 7 more late classes are in the KPI 3 drill-down.
      </p>
    </section>
  )
}

function FacultyFlag({ flag }: { flag: string }) {
  const { tip } = useTip()
  const statusClass =
    flag === "None"
      ? "status-on-target"
      : flag.includes("late")
        ? "status-critical"
        : "status-warning"
  const icon: IconName =
    flag === "None" ? "check" : flag.includes("late") ? "alert" : "triangle"
  const flagTip =
    flag === "None"
      ? "No flag."
      : flag.includes("late")
        ? "Grades submitted after the deadline."
        : "Average is below the 4.0 target. Confirm with other evidence."
  return (
    <span className={`status faculty-flag ${statusClass}`} {...tip(flagTip)}>
      <Icon name={icon} size={14} />
      {flag}
    </span>
  )
}

function FacultyRecognitionOverview({
  onDrill,
  staticMode,
  highlighted,
}: {
  onDrill: (kpi: number, path?: string[]) => void
  staticMode?: boolean
  highlighted?: boolean
}) {
  const { tip } = useTip()
  return (
    <section className={`faculty-recognition-card ${highlighted ? "section-highlighted" : ""}`}>
      <div className="faculty-recognition-main-head">
        <div>
          <div className="tag-group">
            <PurposeTag>Decision support</PurposeTag>
            <PurposeTag>Comparative analysis</PurposeTag>
          </div>
          <h2>Faculty & Recognition Overview</h2>
          <p>
            Combined performance indicators for sample faculty and qualifying recognition candidates. Ratings depend on course context. Read with passing rate and other evidence.
          </p>
        </div>
        <Icon name="bars" size={21} />
      </div>

      <div className="combined-section">
        <div className="combined-subhead">
          <div className="subhead-title">
            <Icon name="check" size={15} />
            <h3>Recognition candidates</h3>
          </div>
          <span>3 candidate sections</span>
        </div>
        <p className="combined-subdesc">
          Sections that meet both targets with reliable responses. For Chair review. Confirm with other evidence before recognition.
        </p>
        <div className="recognition-table">
          <div className="recognition-columns">
            <span>Section</span>
            <span>Faculty code</span>
            <span {...tip("Average SETE rating, 1 to 5.")}>Rating</span>
            <span {...tip("Share of graded students who passed.")}>Passing rate</span>
            <span {...tip("Evaluations completed divided by students enrolled.")}>Response rate</span>
            <span />
          </div>
          {recognitionCandidates.map((candidate) => (
            <button
              key={candidate.code}
              disabled={staticMode}
              onClick={() => onDrill(5, ["Meets both", candidate.code])}
              title={`Drill down on ${candidate.code}`}
            >
              <strong>{candidate.code}</strong>
              <span>{candidate.faculty}</span>
              <span>{candidate.rating}</span>
              <span>{candidate.pass}%</span>
              <span>{candidate.response}%</span>
              <span {...tip("Open the section details.")}>
                <Icon name="chevron" size={17} />
              </span>
            </button>
          ))}
        </div>
        <p className="recognition-note">
          <Icon name="info" size={15} />
          Not a ranking. Ratings depend on course and class context.
        </p>
      </div>

      <div className="combined-divider" />

      <div className="combined-section">
        <div className="combined-subhead">
          <div className="subhead-title">
            <Icon name="bars" size={15} />
            <h3>Faculty overview</h3>
          </div>
          <span>8 faculty sample</span>
        </div>
        <p className="combined-subdesc">
          Sample of faculty by code, sorted by code (not ranked). Read with passing rate and other evidence.
        </p>
        <div className="faculty-table-compact">
          <div className="faculty-columns-compact">
            <span>Faculty code</span>
            <span>Sections</span>
            <span {...tip("Average SETE rating, 1 to 5.")}>Avg SETE</span>
            <span {...tip("Share of graded students who passed.")}>Passing rate</span>
            <span {...tip("Evaluations completed divided by students enrolled.")}>Response rate</span>
            <span>Flag</span>
            <span />
          </div>
          {facultyOverview.map((faculty) => {
            const quadrant =
              faculty.rating >= 4 && faculty.pass >= 85
                ? "Meets both"
                : faculty.rating >= 4
                  ? "High rating, low passing"
                  : faculty.pass >= 85
                    ? "Low rating, high passing"
                    : "Both below target"
            const isCand = recognitionCandidates.some(
              (c) => c.faculty === faculty.faculty,
            )
            return (
              <button
                key={faculty.faculty}
                disabled={staticMode}
                onClick={() => onDrill(5, [quadrant, faculty.section])}
                title={`Drill down on ${faculty.faculty} (${faculty.section})`}
              >
                <div className="faculty-cell-code">
                  <strong>{faculty.faculty}</strong>
                  {isCand && (
                    <span
                      className="cand-dot"
                      {...tip("Recognition candidate. Meets both targets with reliable responses.")}
                    >
                      ★
                    </span>
                  )}
                </div>
                <span>{faculty.sections}</span>
                <span>{faculty.rating.toFixed(1)}</span>
                <span>{faculty.pass}%</span>
                <span>{faculty.response}%</span>
                <FacultyFlag flag={faculty.flag} />
                <span {...tip("Open the section details.")}>
                  <Icon name="chevron" size={17} />
                </span>
              </button>
            )
          })}
        </div>
        <p className="faculty-legend">
          ★ Recognition candidate (meets both targets with reliable responses)
        </p>
        <p className="faculty-footer">
          Showing 8 of 22 faculty. Faculty appear by code only.
        </p>
      </div>
    </section>
  )
}

const RecognitionCandidates = FacultyRecognitionOverview
const FacultyOverview = FacultyRecognitionOverview

const kpiNames = [
  "Course Passing Rate",
  "At-Risk Student Rate",
  "On-Time Grade Submission",
  "Average SETE Rating",
  "Teaching–Outcome Alignment",
]

const sectionSamples = [
  {
    code: "IT 305-A",
    passed: "39 of 50",
    pass: 78,
    rating: 4.5,
    response: 96,
    evaluations: 48,
    uniform: 8,
  },
  {
    code: "IT 312-B",
    passed: "34 of 46",
    pass: 74,
    rating: 3.92,
    response: 91,
    evaluations: 42,
    uniform: 12,
  },
  {
    code: "IT 204-A",
    passed: "42 of 50",
    pass: 84,
    rating: 4.18,
    response: 94,
    evaluations: 47,
    uniform: 9,
  },
]

const quadrantLabels = [
  "Meets both",
  "High rating, low passing",
  "Low rating, high passing",
  "Both below target",
]

function DrillRows({
  rows,
  onSelect,
}: {
  rows: { label: string; detail: string; status?: Status }[]
  onSelect: (label: string) => void
}) {
  return (
    <div className="drill-rows">
      {rows.map((row) => (
        <button key={row.label} onClick={() => onSelect(row.label)}>
          <span>
            <strong>{row.label}</strong>
            <small>{row.detail}</small>
          </span>
          {row.status && <StatusPill status={row.status} />}
          <Icon name="chevron" size={17} />
        </button>
      ))}
    </div>
  )
}

function DrillPanel({
  state,
  data,
  close,
  setPath,
  onExport,
  staticMode,
}: {
  state: DrillState
  data: TermData
  close: () => void
  setPath: (path: string[]) => void
  onExport: () => void
  staticMode?: boolean
}) {
  const { kpi, path } = state
  const suggested = [
    "Review the lowest subjects and arrange tutoring or review sessions.",
    "Refer aggregated year-level concerns to academic advising or e-Counseling and notify faculty.",
    "Follow up with the listed faculty codes and escalate unresolved critical delays to the Dean.",
    "Review criterion-level scores, then confirm patterns with outcomes and other evidence before planning faculty development.",
    "Review sections where ratings and results disagree, prioritizing sections below both targets.",
  ][kpi - 1]

  const select = (label: string) => setPath([...path, label])
  let content: React.ReactNode

  if (kpi === 1) {
    if (path.length === 0) {
      content = (
        <DrillRows
          rows={data.subjects.map((subject) => ({
            label: subject.name,
            detail: `Passing rate ${subject.value.toFixed(0)}%`,
            status: subjectStatus(subject.value),
          }))}
          onSelect={select}
        />
      )
    } else if (path.length === 1) {
      content = (
        <>
          <p className="drill-context">
            Sections for <strong>{path[0]}</strong>
          </p>
          <DrillRows
            rows={sectionSamples.map((section) => ({
              label: section.code,
              detail: `${section.pass}% passing · SETE ${section.rating}`,
              status: subjectStatus(section.pass),
            }))}
            onSelect={select}
          />
        </>
      )
    } else {
      const section =
        sectionSamples.find((item) => item.code === path[1]) ??
        sectionSamples[0]
      content = (
        <div className="detail-grid">
          <div>
            <span>Passing count</span>
            <strong>{section.passed}</strong>
          </div>
          <div>
            <span>Passing rate</span>
            <strong>{section.pass}%</strong>
          </div>
          <div>
            <span>SETE rating</span>
            <strong>{section.rating} / 5</strong>
          </div>
          <div>
            <span>Response rate</span>
            <strong>{section.response}%</strong>
          </div>
        </div>
      )
    }
  } else if (kpi === 2) {
    const subjectCounts: Record<string, [string, number][]> = {
      "1st year": [
        ["Introduction to Computing", 8],
        ["Web Systems", 6],
        ["Programming 1", 7],
      ],
      "2nd year": [
        ["Data Structures and Algorithms", 7],
        ["Database Systems", 5],
        ["Networking 1", 5],
      ],
      "3rd year": [
        ["Systems Analysis and Design", 5],
        ["Web Systems", 4],
        ["Networking 2", 3],
      ],
      "4th year": [
        ["Capstone Project", 3],
        ["IT Elective", 2],
        ["Practicum", 2],
      ],
    }
    if (path.length === 0) {
      content = (
        <>
          <p className="drill-context">
            <strong>57 of 420 students</strong> have at least one failing or
            incomplete grade. Counts only; no student names.
          </p>
          <DrillRows
            rows={yearLevels.map((year) => ({
              label: year.name,
              detail: `${year.count} of ${year.total}`,
              status: "Warning",
            }))}
            onSelect={select}
          />
        </>
      )
    } else {
      content = (
        <>
          <p className="drill-context">
            Subject counts for <strong>{path[0]}</strong>. A student may appear
            in more than one subject count.
          </p>
          <DrillRows
            rows={(subjectCounts[path[0]] ?? subjectCounts["1st year"]).map(
              ([label, count]) => ({
                label,
                detail: `${count} at-risk students`,
              }),
            )}
            onSelect={(label) =>
              path.length === 1 ? select(label) : setPath([path[0], label])
            }
          />
        </>
      )
    }
  } else if (kpi === 3) {
    const supportMatch = data.kpis[2].support.match(/(\d+) of (\d+)/)
    const onTime = supportMatch ? Number(supportMatch[1]) : 41
    const classTotal = supportMatch ? Number(supportMatch[2]) : 50
    const lateCount = Math.max(0, classTotal - onTime)
    const visibleLateClasses = lateClasses.slice(0, lateCount)
    if (path.length === 0) {
      content = (
        <>
          <p className="drill-context">
            <strong>
              {lateCount} of {classTotal} classes
            </strong>{" "}
            submitted grades after the deadline.
          </p>
          <DrillRows
            rows={visibleLateClasses.map((item) => ({
              label: item.code,
              detail: `${item.days} ${item.days === 1 ? "day" : "days"} late`,
              status: item.days >= 9 ? "Critical" : "Warning",
            }))}
            onSelect={select}
          />
        </>
      )
    } else {
      const item =
        lateClasses.find((entry) => entry.code === path[0]) ?? lateClasses[0]
      content = (
        <div className="detail-grid">
          <div>
            <span>Class</span>
            <strong>{item.code}</strong>
          </div>
          <div>
            <span>Faculty code</span>
            <strong>{item.faculty}</strong>
          </div>
          <div>
            <span>Deadline</span>
            <strong>{item.deadline}</strong>
          </div>
          <div>
            <span>Submission date</span>
            <strong>{item.submitted}</strong>
          </div>
          <div>
            <span>Delay</span>
            <strong>{item.days} days late</strong>
          </div>
        </div>
      )
    }
  } else if (kpi === 4) {
    if (path.length === 0) {
      content = (
        <DrillRows
          rows={data.areas.map((area) => ({
            label: area.label,
            detail: `Average ${area.value.toFixed(2)} / 5`,
            status: area.value < 4 ? "Warning" : "On target",
          }))}
          onSelect={select}
        />
      )
    } else if (path.length === 1) {
      content = (
        <DrillRows
          rows={sectionSamples.map((section) => ({
            label: section.code,
            detail: `Average ${section.rating} · ${section.response}% response`,
            status: section.rating < 4 ? "Warning" : "On target",
          }))}
          onSelect={select}
        />
      )
    } else {
      const section = sectionSamples.find((item) => item.code === path[1]) ?? {
        ...sectionSamples[0],
        code: path[1],
        uniform: path[1] === "IT 221-C" ? 48 : 8,
      }
      content = (
        <>
          {section.uniform >= 40 && (
            <div className="caution-note">
              <Icon name="info" size={16} /> Interpret with caution
            </div>
          )}
          <div className="detail-grid">
            <div>
              <span>Average</span>
              <strong>{section.rating} / 5</strong>
            </div>
            <div>
              <span>Response rate</span>
              <strong>{section.response}%</strong>
            </div>
            <div>
              <span>Evaluations</span>
              <strong>{section.evaluations}</strong>
            </div>
            <div>
              <span>Uniform-rating share</span>
              <strong>{section.uniform}%</strong>
            </div>
          </div>
        </>
      )
    }
  } else {
    const counts = data.quadrantCounts
    if (path.length === 0) {
      content = (
        <DrillRows
          rows={quadrantLabels.map((label, index) => ({
            label,
            detail: `${counts[index]} sections`,
            status:
              index === 0 ? "On target" : index === 3 ? "Critical" : "Warning",
          }))}
          onSelect={select}
        />
      )
    } else if (path.length === 1) {
      const dots = makeDots(data.quadrantCounts).filter(
        (dot) => dot.quadrant === path[0],
      )
      content = <DrillRows rows={dots.slice(0, 12).map((dot) => ({
            label: dot.code,
            detail: `${dot.pass}% passing · SETE ${dot.rating}`,
            status:
              dot.pass >= 85 && dot.rating >= 4
                ? "On target"
                : dot.pass < 85 && dot.rating < 4
                  ? "Critical"
                  : "Warning",
          }))} onSelect={select} />
    } else {
      const candidate = recognitionCandidates.find(
        (item) => item.code === path[1],
      )
      const faculty = facultyOverview.find((item) => item.section === path[1])
      if (faculty) {
        content = (
          <>
            {faculty.flag !== "None" && (
              <div className="caution-note">
                <Icon
                  name={faculty.flag.includes("late") ? "alert" : "triangle"}
                  size={16}
                />
                {faculty.flag}
              </div>
            )}
            <div className="detail-grid">
              <div>
                <span>Section</span>
                <strong>{faculty.section}</strong>
              </div>
              <div>
                <span>Faculty code</span>
                <strong>{faculty.faculty}</strong>
              </div>
              <div>
                <span>Passing rate</span>
                <strong>{faculty.pass}%</strong>
              </div>
              <div>
                <span>SETE average</span>
                <strong>{faculty.rating}</strong>
              </div>
              <div>
                <span>Response rate</span>
                <strong>{faculty.response}%</strong>
              </div>
            </div>
          </>
        )
      } else if (candidate) {
        content = (
          <div className="detail-grid">
            <div>
              <span>Section</span>
              <strong>{candidate.code}</strong>
            </div>
            <div>
              <span>Faculty code</span>
              <strong>{candidate.faculty}</strong>
            </div>
            <div>
              <span>Passing rate</span>
              <strong>{candidate.pass}%</strong>
            </div>
            <div>
              <span>SETE average</span>
              <strong>{candidate.rating}</strong>
            </div>
            <div>
              <span>Response rate</span>
              <strong>{candidate.response}%</strong>
            </div>
          </div>
        )
      } else {
        const dot =
          makeDots(data.quadrantCounts).find((item) => item.code === path[1]) ??
          makeDots(data.quadrantCounts)[0]
        content = (
          <div className="detail-grid">
            <div>
              <span>Section</span>
              <strong>{dot.code}</strong>
            </div>
            <div>
              <span>Subject</span>
              <strong>{dot.subject}</strong>
            </div>
            <div>
              <span>Passing rate</span>
              <strong>{dot.pass}%</strong>
            </div>
            <div>
              <span>SETE average</span>
              <strong>{dot.rating}</strong>
            </div>
            <div>
              <span>Response rate</span>
              <strong>{dot.response}%</strong>
            </div>
          </div>
        )
      }
    }
  }

  const crumbs = ["Program", `KPI ${kpi}`, ...path]
  return (
    <div className={`drill-overlay ${staticMode ? "static-drill" : ""}`}>
      <button
        className="drill-backdrop"
        aria-label="Close drill-down"
        onClick={close}
        disabled={staticMode}
      />
      <aside
        className="drill-panel"
        role="dialog"
        aria-label="Drill-down panel"
      >
        <div className="drill-head">
          <div>
            <span>DRILL-DOWN</span>
            <h2>
              KPI {kpi} · {kpiNames[kpi - 1]}
            </h2>
          </div>
          <button
            onClick={close}
            disabled={staticMode}
            aria-label="Close drill-down"
          >
            <Icon name="x" size={19} />
          </button>
        </div>
        <nav className="breadcrumbs" aria-label="Drill-down breadcrumb">
          {crumbs.map((crumb, index) => (
            <span key={`${crumb}-${index}`}>
              {index > 0 && <i>›</i>}
              <button
                disabled={staticMode}
                onClick={() =>
                  setPath(index <= 1 ? [] : path.slice(0, index - 1))
                }
              >
                {crumb}
              </button>
            </span>
          ))}
        </nav>
        <div className="drill-content" key={path.join("/") || "root"}>
          {content}
        </div>
        <div className="drill-action">
          <PurposeTag>Decision support</PurposeTag>
          <span>Suggested action</span>
          <p>{suggested}</p>
          <button onClick={onExport} disabled={staticMode}>
            <Icon name="download" size={16} /> Export summary (prototype)
          </button>
        </div>
      </aside>
    </div>
  )
}

function Dashboard({
  tourKpi3InsightOpen,
  tourKpi3DrillOpen,
  showLabels,
  activeLabelIndex,
}: {
  tourKpi3InsightOpen?: boolean
  tourKpi3DrillOpen?: boolean
  showLabels?: boolean
  activeLabelIndex?: number | null
}) {
  const [year, setYear] = useState("2025–2026")
  const [semester, setSemester] = useState("2nd Semester")
  const [campus, setCampus] = useState("All campuses")
  const [openKpi, setOpenKpi] = useState<number | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [drill, setDrill] = useState<DrillState | null>(null)
  const [transitioning, setTransitioning] = useState(false)
  const tableRef = useRef<HTMLDivElement>(null)
  const data = useMemo(
    () => getData(year, semester, campus),
    [year, semester, campus],
  )

  // Tour-controlled state
  useEffect(() => {
    if (tourKpi3InsightOpen) setOpenKpi(3)
    else if (!tourKpi3InsightOpen && openKpi === 3) setOpenKpi(null)
  }, [tourKpi3InsightOpen])

  useEffect(() => {
    if (tourKpi3DrillOpen) setDrill({ kpi: 3, path: [] })
    else if (!tourKpi3DrillOpen && drill?.kpi === 3 && drill.path.length === 0) setDrill(null)
  }, [tourKpi3DrillOpen])

  useEffect(() => {
    if (activeLabelIndex !== null && activeLabelIndex !== undefined) {
      setOpenKpi(null)
      setDrill(null)
    }
  }, [activeLabelIndex])

  useEffect(() => {
    setTransitioning(true)
    const timer = setTimeout(() => setTransitioning(false), 300)
    return () => clearTimeout(timer)
  }, [year, semester, campus])

  useEffect(() => {
    const escape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpenKpi(null)
        setDrill(null)
      }
    }
    document.addEventListener("keydown", escape)
    return () => document.removeEventListener("keydown", escape)
  }, [])

  const change = (setter: (s: string) => void) => (v: string) => {
    setter(v)
    setOpenKpi(null)
  }
  const reset = () => {
    setYear("2025–2026")
    setSemester("2nd Semester")
    setCampus("All campuses")
  }
  const dean = () => {
    setToast("Marked for Dean review (prototype)")
    setTimeout(() => setToast(null), 2600)
  }
  const openDrill = (kpi: number, path: string[] = []) => {
    let normalized = path
    if (kpi === 4 && path[0]?.startsWith("IT "))
      normalized = ["Criterion 5", path[0]]
    if (kpi === 5 && path[0]?.startsWith("IT "))
      normalized = ["High rating, low passing", path[0]]
    setDrill({ kpi, path: normalized })
  }

  const { tip } = useTip()

  return (
    <div className="dashboard">
      <main className="shell main">
        <section className="intro" style={{ position: "relative" }}>
          <span className="overline">DECISION SUPPORT</span>
          <h2>Program Analytics – BS Information Technology</h2>
          <div
            className={`purpose ${activeLabelIndex === 1 ? "section-highlighted" : ""}`}
            style={{ position: "relative" }}
          >
            {showLabels && <span className={`tour-section-badge ${activeLabelIndex === 1 ? "badge-active" : ""}`} style={{ top: -10, left: -10 }}>2</span>}
            <Icon name="info" size={20} />
            <span>
              <strong>This user needs:</strong> Decide which classes, subjects
              and faculty need follow-up now.
            </span>
          </div>
        </section>
        <div
          className={`filter-wrap ${activeLabelIndex === 2 ? "section-highlighted" : ""}`}
          style={{ position: "relative" }}
        >
          {showLabels && <span className={`tour-section-badge ${activeLabelIndex === 2 ? "badge-active" : ""}`} style={{ top: -10, left: -10 }}>3</span>}
          <Filters
            year={year}
            semester={semester}
            campus={campus}
            setYear={change(setYear)}
            setSemester={change(setSemester)}
            setCampus={change(setCampus)}
            reset={reset}
          />
        </div>
        <div className={transitioning ? "content-changing" : ""}>
          <div
            className={`alert-banner-wrap ${activeLabelIndex === 3 ? "section-highlighted" : ""}`}
            style={{ position: "relative" }}
          >
            {showLabels && <span className={`tour-section-badge ${activeLabelIndex === 3 ? "badge-active" : ""}`} style={{ top: -10, left: -10 }}>4</span>}
            <AlertBanner
              data={data}
              onView={() => openDrill(3)}
              onDean={dean}
            />
          </div>
          <section
            className={`kpi-section ${activeLabelIndex === 4 ? "section-highlighted" : ""}`}
            style={{ position: "relative" }}
          >
            {showLabels && <span className={`tour-section-badge ${activeLabelIndex === 4 ? "badge-active" : ""}`} style={{ top: -10, left: -10 }}>5</span>}
            <div className="section-title">
              <div>
                <span>TERM PERFORMANCE</span>
                <h2>Academic health at a glance</h2>
                <PurposeTag>Performance monitoring</PurposeTag>
              </div>
              <p>Targets follow the program's sample monitoring thresholds.</p>
            </div>
            <div className="kpi-grid">
              {data.kpis.map((kpi, i) => (
                <KpiCard
                  key={kpi.id}
                  kpi={kpi}
                  index={i}
                  open={openKpi === kpi.id}
                  onToggle={() =>
                    setOpenKpi(openKpi === kpi.id ? null : kpi.id)
                  }
                  onDrill={() => openDrill(kpi.id)}
                  showLabels={showLabels}
                  activeLabelIndex={activeLabelIndex}
                />
              ))}
            </div>
          </section>

          <div className="analysis-with-recognition">
            <section className="charts-grid" style={{ position: "relative" }}>
              <div className="chart-a-wrap" style={{ position: "relative", gridColumn: "1 / -1" }}>
                {showLabels && <span className={`tour-section-badge ${activeLabelIndex === 7 ? "badge-active" : ""}`} style={{ top: -10, left: -10 }}>8</span>}
                <ChartA data={data} onDrill={openDrill} highlighted={activeLabelIndex === 7} />
              </div>
              <div className="chart-b-wrap" style={{ position: "relative" }}>
                {showLabels && <span className={`tour-section-badge ${activeLabelIndex === 9 ? "badge-active" : ""}`} style={{ top: -10, left: -10 }}>10</span>}
                <ChartB data={data} onDrill={openDrill} highlighted={activeLabelIndex === 9} />
              </div>
              <div className="chart-c-wrap" style={{ position: "relative" }}>
                {showLabels && <span className={`tour-section-badge ${activeLabelIndex === 10 ? "badge-active" : ""}`} style={{ top: -10, left: -10 }}>11</span>}
                <ChartC data={data} onDrill={openDrill} highlighted={activeLabelIndex === 10} />
              </div>
            </section>
            <div className="faculty-recognition-wrap" style={{ position: "relative" }}>
              {showLabels && <span className={`tour-section-badge ${activeLabelIndex === 8 ? "badge-active" : ""}`} style={{ top: -10, left: -10 }}>9</span>}
              <FacultyRecognitionOverview onDrill={openDrill} highlighted={activeLabelIndex === 8} />
            </div>
          </div>
          <div style={{ position: "relative" }}>
            {showLabels && <span className={`tour-section-badge ${activeLabelIndex === 11 ? "badge-active" : ""}`} style={{ top: -10, left: -10 }}>12</span>}
            <AttentionTable
              data={data}
              tableRef={tableRef}
              onDrill={openDrill}
              highlighted={activeLabelIndex === 11}
            />
          </div>
        </div>
      </main>
      <TipSuppressor suppress={(drill !== null || openKpi !== null)} source="panel" />
      <footer
        className={activeLabelIndex === 12 ? "section-highlighted" : ""}
        style={{ position: "relative" }}
      >
        {showLabels && <span className={`tour-section-badge ${activeLabelIndex === 12 ? "badge-active" : ""}`} style={{ top: -10, left: 16 }}>13</span>}
        <div className="shell footer-inner">
          <div>
            <span {...tip("Access limited to your program.")}><Icon name="lock" size={17} /></span>
            <span>
              <strong>Confidential.</strong> Visible to the Program Chair of
              this program only. Student-level data is shown only as counts.
              SETE results are released only after grades are submitted.
            </span>
          </div>
          <span className="sample" {...tip("All values are fictional sample data.")}>Sample data</span>
        </div>
      </footer>
      {toast && (
        <div className="toast">
          <Icon name="check" size={18} />
          {toast}
        </div>
      )}
      {drill && (
        <DrillPanel
          state={drill}
          data={data}
          close={() => setDrill(null)}
          setPath={(path) => setDrill({ ...drill, path })}
          onExport={() => {
            setToast("Summary export prepared (prototype)")
            setTimeout(() => setToast(null), 2600)
          }}
        />
      )}
    </div>
  )
}

export default function App() {
  const [guideOpen, setGuideOpen] = useState(false)
  const [welcomeOpen, setWelcomeOpen] = useState(false)
  const [tourActive, setTourActive] = useState(false)
  const [tourStep, setTourStep] = useState(0)
  const [showLabels, setShowLabels] = useState(false)
  const [tourToast, setTourToast] = useState<string | null>(null)
  const [kpi3InsightOpen, setKpi3InsightOpen] = useState(false)
  const [kpi3DrillOpen, setKpi3DrillOpen] = useState(false)

  // Auto-open welcome modal after 1.5s
  useEffect(() => {
    const timer = setTimeout(() => setWelcomeOpen(true), 1500)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setGuideOpen(false)
        if (tourActive) endTour()
      }
    }
    document.addEventListener("keydown", close)
    return () => document.removeEventListener("keydown", close)
  }, [tourActive])

  const startTour = () => {
    setWelcomeOpen(false)
    setTourStep(0)
    setTourActive(true)
  }

  const endTour = () => {
    setTourActive(false)
    setKpi3InsightOpen(false)
    setKpi3DrillOpen(false)
    setTourToast("Tour finished. Replay it any time from the top bar.")
    setTimeout(() => setTourToast(null), 3500)
  }

  const nextStep = () => {
    setKpi3InsightOpen(false)
    setKpi3DrillOpen(false)
    if (tourStep < TOUR_STEPS.length - 1) setTourStep(tourStep + 1)
    else endTour()
  }

  const prevStep = () => {
    setKpi3InsightOpen(false)
    setKpi3DrillOpen(false)
    if (tourStep > 0) setTourStep(tourStep - 1)
  }

  const [activeLabelIndex, setActiveLabelIndex] = useState<number | null>(null)

  const handleToggleLabels = () => {
    if (showLabels) {
      setShowLabels(false)
      setActiveLabelIndex(null)
      setKpi3InsightOpen(false)
      setKpi3DrillOpen(false)
    } else {
      setShowLabels(true)
    }
  }

  const handleSelectLabel = (index: number) => {
    if (activeLabelIndex === index) {
      setActiveLabelIndex(null)
      setKpi3InsightOpen(false)
      setKpi3DrillOpen(false)
      return
    }

    setActiveLabelIndex(index)
    // Keep popover/drill modal closed so target elements and badges are 100% visible and highlighted
    setKpi3InsightOpen(false)
    setKpi3DrillOpen(false)

    // Scroll element into view smoothly
    const step = TOUR_STEPS[index]
    if (step) {
      setTimeout(() => {
        const el = document.querySelector(step.selector)
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" })
        }
      }, 50)
    }
  }

  return (
    <TipProvider>
      <TipSuppressor suppress={tourActive} source="tour" />
      <Header
        onGuide={() => setGuideOpen(!guideOpen)}
        onReplayTour={() => {
          setWelcomeOpen(false)
          setTourStep(0)
          setTourActive(true)
        }}
        showLabels={showLabels}
        onToggleLabels={handleToggleLabels}
        activeLabelIndex={activeLabelIndex}
      />
      <Dashboard
        tourKpi3InsightOpen={kpi3InsightOpen}
        tourKpi3DrillOpen={kpi3DrillOpen}
        showLabels={showLabels}
        activeLabelIndex={activeLabelIndex}
      />
      {guideOpen && (
        <>
          <button
            className="guide-scrim"
            aria-label="Close dashboard guide"
            onClick={() => setGuideOpen(false)}
          />
          <GuidePanel close={() => setGuideOpen(false)} />
        </>
      )}
      {welcomeOpen && !tourActive && (
        <WelcomeModal onStart={startTour} onSkip={() => setWelcomeOpen(false)} />
      )}
      {tourActive && (
        <GuidedTour
          step={tourStep}
          total={TOUR_STEPS.length}
          onNext={nextStep}
          onBack={prevStep}
          onSkip={endTour}
          openKpi3Insight={() => setKpi3InsightOpen(true)}
          closeKpi3Insight={() => setKpi3InsightOpen(false)}
          openKpi3Drill={() => setKpi3DrillOpen(true)}
          closeKpi3Drill={() => setKpi3DrillOpen(false)}
        />
      )}
      {tourToast && (
        <div className="tour-toast">
          ✓ {tourToast}
        </div>
      )}
      {showLabels && (
        <div className="tour-labels-legend">
          <strong>Section labels</strong>
          <ol>
            {TOUR_LABEL_NAMES.map((name, i) => (
              <li
                key={i}
                className={activeLabelIndex === i ? "legend-active" : ""}
                onClick={() => handleSelectLabel(i)}
                title={`Click to highlight and view: ${name}`}
              >
                <span>{i + 1}</span>
                {name}
              </li>
            ))}
          </ol>
        </div>
      )}
    </TipProvider>
  )
}
