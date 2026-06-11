import { useState, useRef, useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import Shell from './components/Shell'
import icons from './components/nav-icons'
import './App.css'

// ─── Nav ──────────────────────────────────────────────────────────────────────

const navItems = [
  { path: '/', label: 'Dialing Controls', ...icons.simulation },
]

// ─── Constants ───────────────────────────────────────────────────────────────

const BASELINE_DIALS  = 152
const CURRENT_DIALS   = 145
const CURRENT_FCR     = 3.2   // % — live reading, used in status bar

// FCR baseline per segment — reflects expected call quality when targeting that group
const SEGMENT_FCR: Record<string, number> = {
  '':                          3.2,  // no targeting — matches live reading
  'High-value renewals':       2.6,  // engaged, easy to reach, low failed connection rate
  'Expiring this month':       3.0,  // motivated but not always reachable
  'Re-engagement — 90 day':   4.1,  // cold, lower answer rates
  'New leads — Q4':            3.8,  // mixed quality, newer numbers
  'Lapsed accounts':           4.4,  // hardest to reach, highest failed connection rate
  'Win-back — 6 month':        3.5,  // moderate — some re-engagement traction
}

const REALIZED_DIALS  = 142   // simulated realized — just above floor at tolerance=10
const REALIZED_FCR    = 3.8   // simulated realized — healthy but closer to threshold

// ─── Types ───────────────────────────────────────────────────────────────────

interface ControlState {
  multiplier:        number
  capacitySafety:    number
  priorityGroup:     string
  priorityTtl:       number
  fcrWarnThreshold:  number
  fcrPauseThreshold: number
}

interface ChangeEntry {
  id:          string
  when:        Date
  diff:        string
  author:      string
  rollbackTo:  ControlState
  isRollback:  boolean
  rollbackOf?: string
}

// ─── Seed data ────────────────────────────────────────────────────────────────

const INITIAL: ControlState = {
  multiplier:        1.0,
  capacitySafety:    2,
  priorityGroup:     '',
  priorityTtl:       120,
  fcrWarnThreshold:  4,
  fcrPauseThreshold: 5,
}

const SEED_CHANGES: ChangeEntry[] = [
  {
    id:         'change_1',
    when:       new Date('2025-11-26T10:49:00'),
    diff:       'Dial speed: 1.0 → 1.2',
    author:     'T. Okafor',
    rollbackTo: { ...INITIAL, multiplier: 1.0 },
    isRollback: false,
  },
  {
    id:         'change_2',
    when:       new Date('2025-11-26T09:49:00'),
    diff:       'Protect against overdialing: 2 → 3',
    author:     'T. Okafor',
    rollbackTo: { ...INITIAL, capacitySafety: 2 },
    isRollback: false,
  },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(d: Date) {
  return d.toLocaleString('en-US', {
    month:   'numeric',
    day:     'numeric',
    year:    'numeric',
    hour:    'numeric',
    minute:  '2-digit',
    hour12:  true,
  })
}

function calcProjected(controls: ControlState, tolerance: number, baseFcr: number, baseDials: number) {
  // FCR rises slowly at low multipliers, accelerates sharply above ~1.5×
  const fcrLift  = parseFloat((Math.pow(controls.multiplier - 1.0, 1.6) * 4.8).toFixed(1))
  const fcrProj  = parseFloat((baseFcr + fcrLift).toFixed(1))
  const dialsProj    = Math.round(baseDials * controls.multiplier)
  const dialsFloor   = Math.round((1 - tolerance / 100) * BASELINE_DIALS)
  const fcrOk        = fcrProj < controls.fcrPauseThreshold
  const throughputOk = dialsProj >= dialsFloor
  return { fcrProj, dialsProj, dialsFloor, fcrOk, throughputOk, overall: fcrOk && throughputOk }
}

function formatCountdown(s: number | null): string {
  if (s === null || s <= 0) return '0:00'
  const mins = Math.floor(s / 60)
  const secs = s % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function LockableCard({ disabled, children }: { disabled: boolean; children: React.ReactNode }) {
  return (
    <div title={disabled ? 'Controls are locked while dialing is paused.' : undefined}>
      <div className={`card${disabled ? ' card-disabled' : ''}`}>
        {children}
      </div>
    </div>
  )
}

function StatusBar({ stopActive, controls, liveFcr }: { stopActive: boolean; controls: ControlState; liveFcr: number }) {
  const fcrStatus: 'ok' | 'warn' | 'critical' =
    liveFcr >= controls.fcrPauseThreshold ? 'critical' :
    liveFcr >= controls.fcrWarnThreshold  ? 'warn'     : 'ok'

  const systemStatus = stopActive ? 'stopped' : fcrStatus === 'critical' ? 'critical' : 'ok'

  return (
    <div className="status-bar">
      {!stopActive && (
        <>
          <span className={`status-chip status-chip--${systemStatus}`}>
            <span className="status-chip-dot" />
            Dialing active
          </span>
          <span className="status-bar-rule" />
        </>
      )}

      <div className="status-stat">
        <span className="status-stat-label">Failed connections</span>
        <span className="status-stat-value">
          <span className={`dot dot-${fcrStatus === 'ok' ? 'green' : fcrStatus === 'warn' ? 'amber' : 'red'}`} />
          {liveFcr}%
        </span>
        <span className="status-stat-context">warn {controls.fcrWarnThreshold}% · pause {controls.fcrPauseThreshold}%</span>
      </div>

      {!stopActive && (
        <>
          <span className="status-bar-rule" />
          <div className="status-stat">
            <span className="monitoring-dot" />
            <span className="status-stat-label">Monitoring</span>
          </div>
        </>
      )}
    </div>
  )
}

function StatusVal({ value }: { value: boolean | null }) {
  if (value === null) return <span className="status-val status-val-dash">—</span>
  return value
    ? <span key="ok"   className="status-val status-val-ok">OK</span>
    : <span key="fail" className="status-val status-val-fail">Fail</span>
}

function StatusRow({ label, value, detail, overall = false }: { label: string; value: boolean | null; detail?: string; overall?: boolean }) {
  return (
    <div className={`status-row${overall ? ' status-row-overall' : ''}${detail ? ' status-row-has-detail' : ''}`}>
      <span className="status-row-label">
        {label}
        {detail && <span className="status-row-detail">{detail}</span>}
      </span>
      <StatusVal value={value} />
    </div>
  )
}

// ─── App (shell wrapper) ──────────────────────────────────────────────────────

export default function App() {
  return (
    <Shell navItems={navItems}>
      <Routes>
        <Route path="/" element={<DialingPage />} />
      </Routes>
    </Shell>
  )
}

// ─── DialingPage ──────────────────────────────────────────────────────────────

function DialingPage() {

  // Applied control state
  const [controls,      setControls]      = useState<ControlState>(INITIAL)

  // Draft state — real-time display before commit
  const [multDraft,     setMultDraft]     = useState(INITIAL.multiplier)
  const [capDraft,      setCapDraft]      = useState(String(INITIAL.capacitySafety))
  const [groupDraft,    setGroupDraft]    = useState(INITIAL.priorityGroup)
  const [ttlDraft,      setTtlDraft]      = useState(String(INITIAL.priorityTtl))
  const [fcrWarnDraft,  setFcrWarnDraft]  = useState(String(INITIAL.fcrWarnThreshold))
  const [fcrPauseDraft, setFcrPauseDraft] = useState(String(INITIAL.fcrPauseThreshold))

  // Stop dialing
  const [stopApplied,       setStopApplied]       = useState(false)
  const [stopExpanded,      setStopExpanded]       = useState(false)
  const [resumeSecondsLeft, setResumeSecondsLeft] = useState<number | null>(null)
  const [stopResume,        setStopResume]         = useState('30')
  const [stopReason,        setStopReason]         = useState('technical')

  // Outcome tracker config
  const [tolerance,         setTolerance]         = useState(10)
  const [evalWindow,        setEvalWindow]         = useState('2')
  const [hasSimulatedEval,  setHasSimulatedEval]  = useState(false)
  const [realizedFloor,     setRealizedFloor]      = useState(0)

  // Live readings — drift slightly over time to simulate a running system
  const [liveOffset, setLiveOffset] = useState({ fcr: 0, dials: 0 })

  useEffect(() => {
    const tick = () => {
      setLiveOffset({
        fcr:   parseFloat(((Math.random() - 0.5) * 0.4).toFixed(1)),  // ±0.2%
        dials: Math.round((Math.random() - 0.5) * 8),                 // ±4/hr
      })
    }
    tick()
    const t = setInterval(tick, 9000)
    return () => clearInterval(t)
  }, [])

  const liveFcrReading   = parseFloat((CURRENT_FCR  + liveOffset.fcr).toFixed(1))
  const liveDialsReading = Math.max(120, CURRENT_DIALS + liveOffset.dials)

  // Change log
  const [changes,       setChanges]       = useState<ChangeEntry[]>(SEED_CHANGES)
  const [hasInteracted, setHasInteracted] = useState(false)
  const [projFlash,     setProjFlash]     = useState(false)
  const nextNum       = useRef(3)
  const flashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Countdown ticker
  useEffect(() => {
    if (!stopApplied || resumeSecondsLeft === null || resumeSecondsLeft <= 0) return
    const t = setTimeout(() => setResumeSecondsLeft(s => (s !== null && s > 0 ? s - 1 : 0)), 1000)
    return () => clearTimeout(t)
  }, [stopApplied, resumeSecondsLeft])

  // ── Helpers ────────────────────────────────────────────────────────────────

  function logChange(diff: string, rollbackTo: ControlState, isRollback = false, rollbackOf?: string) {
    const id = `change_${nextNum.current++}`
    setChanges(prev => [{ id, when: new Date(), diff, author: 'You', rollbackTo, isRollback, rollbackOf }, ...prev])
    setHasInteracted(true)
  }

  function applyPatch(patch: Partial<ControlState>, diff: string) {
    const rollbackTo = { ...controls }
    setControls(c => ({ ...c, ...patch }))
    logChange(diff, rollbackTo)
    if (flashTimerRef.current) clearTimeout(flashTimerRef.current)
    setProjFlash(true)
    flashTimerRef.current = setTimeout(() => setProjFlash(false), 700)
  }

  function syncDrafts(state: ControlState) {
    setMultDraft(state.multiplier)
    setCapDraft(String(state.capacitySafety))
    setGroupDraft(state.priorityGroup)
    setTtlDraft(String(state.priorityTtl))
    setFcrWarnDraft(String(state.fcrWarnThreshold))
    setFcrPauseDraft(String(state.fcrPauseThreshold))
  }

  function handleRollback(entry: ChangeEntry) {
    const rollbackTo = { ...controls }
    setControls(entry.rollbackTo)
    syncDrafts(entry.rollbackTo)
    logChange(`Rolled back: "${entry.diff}"`, rollbackTo, true, entry.id)
  }

  function handleReapply(rollbackEntry: ChangeEntry) {
    const original = changes.find(c => c.id === rollbackEntry.rollbackOf)
    const rollbackTo = { ...controls }
    setControls(rollbackEntry.rollbackTo)
    syncDrafts(rollbackEntry.rollbackTo)
    logChange(`Re-applied: "${original?.diff ?? rollbackEntry.diff}"`, rollbackTo)
  }

  function handleStopApply() {
    const label = stopReason === 'technical'  ? 'Technical issue'
                : stopReason === 'compliance' ? 'Compliance hold'
                : stopReason === 'capacity'   ? 'Capacity constraint'
                : stopReason === 'planned'    ? 'Planned pause'
                : 'Other'
    setStopApplied(true)
    setStopExpanded(false)
    setResumeSecondsLeft(parseInt(stopResume) * 60)
    logChange(`Dialing stopped — resume in ${stopResume} min · ${label}`, { ...controls })
  }

  function handleResume() {
    setStopApplied(false)
    setStopExpanded(false)
    setResumeSecondsLeft(null)
    logChange('Dialing resumed', { ...controls })
  }

  function handleFcrRevert() {
    if (
      controls.fcrWarnThreshold  !== INITIAL.fcrWarnThreshold ||
      controls.fcrPauseThreshold !== INITIAL.fcrPauseThreshold
    ) {
      applyPatch(
        { fcrWarnThreshold: INITIAL.fcrWarnThreshold, fcrPauseThreshold: INITIAL.fcrPauseThreshold },
        `When to slow down or stop: thresholds reset to defaults`
      )
    }
    setFcrWarnDraft(String(INITIAL.fcrWarnThreshold))
    setFcrPauseDraft(String(INITIAL.fcrPauseThreshold))
  }

  // ── Derived ────────────────────────────────────────────────────────────────

  const fcrWarnVal        = parseFloat(fcrWarnDraft)
  const fcrPauseVal       = parseFloat(fcrPauseDraft)
  const warnBelowCurrent  = !isNaN(fcrWarnVal)  && fcrWarnVal  <= liveFcrReading
  const pauseBelowCurrent = !isNaN(fcrPauseVal) && fcrPauseVal <= liveFcrReading
  const warnAbovePause    = !isNaN(fcrWarnVal) && !isNaN(fcrPauseVal) && fcrWarnVal >= fcrPauseVal
  const liveFcrWarn       = !isNaN(fcrWarnVal)  ? fcrWarnVal  : controls.fcrWarnThreshold
  const liveFcrPause      = !isNaN(fcrPauseVal) ? fcrPauseVal : controls.fcrPauseThreshold
  // No-segment baseline tracks the live reading; segment profiles are calibrated independently
  const segmentBaseFcr    = controls.priorityGroup === '' ? liveFcrReading : (SEGMENT_FCR[controls.priorityGroup] ?? liveFcrReading)
  const proj              = calcProjected({ ...controls, multiplier: multDraft, fcrWarnThreshold: liveFcrWarn, fcrPauseThreshold: liveFcrPause }, tolerance, segmentBaseFcr, liveDialsReading)
  const disabled          = stopApplied
  const nextEvalFormatted = new Date(Date.now() + parseInt(evalWindow) * 60 * 60 * 1000)
    .toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
  const fcrHealthy        = liveFcrReading < liveFcrPause
  const stopReasonDisplay =
    stopReason === 'technical'  ? 'Technical issue' :
    stopReason === 'compliance' ? 'Compliance hold' :
    stopReason === 'capacity'   ? 'Capacity constraint' :
    stopReason === 'planned'    ? 'Planned pause' : 'Other'

  const rolledBackIds = new Set(
    changes.filter(c => c.isRollback && c.rollbackOf).map(c => c.rollbackOf!)
  )

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="page-layout">

      {/* ── Page header ──────────────────────────────────────────────────── */}
      <header className="app-header">
        <div className="header-left">
          <span className="header-title">Predictive Dialing</span>
          <span className="header-sep">·</span>
          <span className="header-subtitle">Manual Levers</span>
        </div>
        <div className="header-right">
          <span className="reset-note">Levers reset at 6:00 AM ET next day</span>

          {/* Stop all dialing — trigger always visible, form floats as popover */}
          <div className="stop-header-control">

            {/* Trigger — always shown unless dialing is stopped */}
            {!stopApplied && (
              <button
                className={`btn-stop${stopExpanded ? ' btn-stop--open' : ''}`}
                onClick={() => setStopExpanded(v => !v)}
              >
                Stop all dialing
                <span className="tag tag-danger">Hard stop</span>
              </button>
            )}

            {/* Scrim — mobile only, closes popover on tap */}
            {!stopApplied && stopExpanded && (
              <div className="stop-scrim" onClick={() => setStopExpanded(false)} />
            )}

            {/* Popover — floats below the trigger, no layout shift */}
            {!stopApplied && stopExpanded && (
              <div className="stop-popover">
                <div className="stop-intent-row">
                  <span className="stop-intent-label">Stop all dialing</span>
                  <span className="tag tag-danger">Hard stop</span>
                </div>
                <div className="stop-expand">
                  <div className="field-group" style={{ marginBottom: 0 }}>
                    <label className="field-label" htmlFor="stop-resume-hdr">Resume after</label>
                    <select id="stop-resume-hdr" className="select" value={stopResume} onChange={e => setStopResume(e.target.value)}>
                      <option value="15">15 min</option>
                      <option value="30">30 min</option>
                      <option value="60">60 min</option>
                      <option value="120">2 hours</option>
                      <option value="240">4 hours</option>
                    </select>
                  </div>
                  <div className="field-group" style={{ marginBottom: 0 }}>
                    <label className="field-label" htmlFor="stop-reason-hdr">Reason</label>
                    <select id="stop-reason-hdr" className="select" value={stopReason} onChange={e => setStopReason(e.target.value)}>
                      <option value="technical">Technical issue</option>
                      <option value="compliance">Compliance hold</option>
                      <option value="capacity">Capacity constraint</option>
                      <option value="planned">Planned pause</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div style={{ display: 'flex', gap: 'var(--space-8)', alignItems: 'center' }}>
                    <button className="btn-danger" onClick={handleStopApply}>Apply</button>
                    <button className="btn-ghost" onClick={() => setStopExpanded(false)}>Cancel</button>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </header>

      {/* ── Status bar ───────────────────────────────────────────────────── */}
      <StatusBar stopActive={stopApplied} controls={controls} liveFcr={liveFcrReading} />

      {/* ── Pause banner ─────────────────────────────────────────────────── */}
      {stopApplied && (
        <div className="stop-banner">
          <span className="stop-banner-dot" />
          <span className="stop-banner-label">Dialing stopped</span>
          <span className="tag tag-danger">Hard stop</span>
          <span className="stop-banner-sep">·</span>
          <span className="stop-banner-meta">{stopReasonDisplay} · resumes in {formatCountdown(resumeSecondsLeft)}</span>
          <button className="btn-ghost stop-banner-resume" onClick={handleResume}>Resume now</button>
        </div>
      )}

      {/* ── Two-panel body ───────────────────────────────────────────────── */}
      <div className="app-main">

        {/* ── Left panel ─────────────────────────────────────────────────── */}
        <div className="panel panel-left">

          {/* Dial speed */}
          <LockableCard disabled={disabled}>
            <div className="section-heading">Dial speed</div>
            <p className="helper" style={{ marginBottom: 'var(--space-14)' }}>
              Scales calls placed per available banker. Answer detection and transfer rates set the upper bound.
            </p>
            <div className="slider-wrap">
              <input
                type="range" min={1.0} max={2.0} step={0.1}
                value={multDraft} disabled={disabled} className="lever-slider"
                onChange={e => { setMultDraft(parseFloat(e.target.value)); setHasInteracted(true) }}
                onMouseUp={() => {
                  if (multDraft !== controls.multiplier)
                    applyPatch({ multiplier: multDraft }, `Dial speed: ${controls.multiplier.toFixed(1)} → ${multDraft.toFixed(1)}`)
                }}
                onKeyUp={() => {
                  if (multDraft !== controls.multiplier)
                    applyPatch({ multiplier: multDraft }, `Dial speed: ${controls.multiplier.toFixed(1)} → ${multDraft.toFixed(1)}`)
                }}
              />
              <span className="slider-val">{multDraft.toFixed(1)}</span>
            </div>
            <div className="slider-bounds">
              <span>1.0</span>
              <span>2.0</span>
            </div>
          </LockableCard>

          {/* Capacity safety */}
          <LockableCard disabled={disabled}>
            <label className="section-heading" htmlFor="cap-input">Protect against overdialing</label>
            <input
              id="cap-input" type="number" min={0} max={50}
              className="input input-sm" value={capDraft} disabled={disabled}
              onChange={e => setCapDraft(e.target.value)}
              onBlur={() => {
                const val = parseInt(capDraft)
                if (isNaN(val)) { setCapDraft(String(controls.capacitySafety)); return }
                if (val !== controls.capacitySafety)
                  applyPatch({ capacitySafety: val }, `Protect against overdialing: ${controls.capacitySafety} → ${val}`)
              }}
            />
            <p className="helper" style={{ marginTop: 'var(--space-8)' }}>
              Dial harder only when at least this many spare bankers are available.
            </p>
          </LockableCard>

          {/* Priority routing */}
          <LockableCard disabled={disabled}>
            <div className="section-heading">Focus calls on a segment</div>

            {controls.priorityGroup && (
              <div className="targeting-active">
                <span className="dot dot-green" />
                <span className="targeting-label">Targeting <strong>{controls.priorityGroup}</strong></span>
                <button
                  className="btn-ghost"
                  disabled={disabled}
                  onClick={() => {
                    applyPatch({ priorityGroup: '' }, `Focus calls on a segment: "${controls.priorityGroup}" → none`)
                    setGroupDraft('')
                  }}
                >
                  Clear
                </button>
              </div>
            )}

            <div className="field-group">
              <label className="field-label" htmlFor="priority-group">Opportunity group</label>
              <select
                id="priority-group"
                className="select"
                style={{ width: '100%' }}
                value={groupDraft}
                disabled={disabled}
                onChange={e => {
                  const val = e.target.value
                  setGroupDraft(val)
                  if (val !== controls.priorityGroup)
                    applyPatch({ priorityGroup: val }, `Focus calls on a segment: "${controls.priorityGroup || 'none'}" → "${val || 'none'}"`)
                }}
              >
                <option value="">No priority targeting</option>
                <option value="High-value renewals">High-value renewals</option>
                <option value="Expiring this month">Expiring this month</option>
                <option value="Re-engagement — 90 day">Re-engagement — 90 day</option>
                <option value="New leads — Q4">New leads — Q4</option>
                <option value="Lapsed accounts">Lapsed accounts</option>
                <option value="Win-back — 6 month">Win-back — 6 month</option>
              </select>
            </div>

            {groupDraft && (
              <div className="field-group">
                <label className="field-label" htmlFor="priority-ttl">Priority window (minutes)</label>
                <input
                  id="priority-ttl" type="number" min={1}
                  className="input input-sm" value={ttlDraft} disabled={disabled}
                  onChange={e => setTtlDraft(e.target.value)}
                  onBlur={() => {
                    const val = parseInt(ttlDraft)
                    if (isNaN(val)) { setTtlDraft(String(controls.priorityTtl)); return }
                    if (val !== controls.priorityTtl)
                      applyPatch({ priorityTtl: val }, `Segment TTL: ${controls.priorityTtl} → ${val} min`)
                  }}
                />
                <p className="helper" style={{ marginTop: 'var(--space-5)' }}>
                  This group takes priority for {ttlDraft} minutes, then routing returns to normal.
                </p>
              </div>
            )}
          </LockableCard>

          {/* Configure acceptable FCR */}
          <LockableCard disabled={disabled}>
            <div className="section-heading">When to slow down or stop</div>
            <div className="fcr-current">
              <span className="helper">Current rate</span>
              <span className="fcr-rate">
                <span className={`dot ${fcrHealthy ? 'dot-green' : 'dot-red'}`} />
                {liveFcrReading}%
              </span>
            </div>
            <div className="field-group">
              <label className="field-label" htmlFor="fcr-warn">Warn threshold (%)</label>
              <input
                id="fcr-warn" type="number" min={0} max={100} step={0.5}
                className="input input-sm" value={fcrWarnDraft} disabled={disabled}
                onChange={e => { setFcrWarnDraft(e.target.value); setHasInteracted(true) }}
                onBlur={() => {
                  const val = parseFloat(fcrWarnDraft)
                  if (isNaN(val)) { setFcrWarnDraft(String(controls.fcrWarnThreshold)); return }
                  if (warnAbovePause) { setFcrWarnDraft(String(controls.fcrWarnThreshold)); return }
                  if (val !== controls.fcrWarnThreshold)
                    applyPatch({ fcrWarnThreshold: val }, `Warn threshold: ${controls.fcrWarnThreshold}% → ${val}%`)
                }}
              />
              {warnAbovePause && (
                <p className="fcr-validation fcr-validation--danger">
                  Warn threshold must be below the pause threshold.
                </p>
              )}
              {!warnAbovePause && warnBelowCurrent && (
                <p className="fcr-validation fcr-validation--warn">
                  Current rate ({liveFcrReading}%) already meets this threshold — system is now in warn.
                </p>
              )}
            </div>
            <div className="field-group">
              <label className="field-label" htmlFor="fcr-pause">Pause threshold (%)</label>
              <input
                id="fcr-pause" type="number" min={0} max={100} step={0.5}
                className="input input-sm" value={fcrPauseDraft} disabled={disabled}
                onChange={e => { setFcrPauseDraft(e.target.value); setHasInteracted(true) }}
                onBlur={() => {
                  const val = parseFloat(fcrPauseDraft)
                  if (isNaN(val)) { setFcrPauseDraft(String(controls.fcrPauseThreshold)); return }
                  if (warnAbovePause) { setFcrPauseDraft(String(controls.fcrPauseThreshold)); return }
                  if (val !== controls.fcrPauseThreshold)
                    applyPatch({ fcrPauseThreshold: val }, `Pause threshold: ${controls.fcrPauseThreshold}% → ${val}%`)
                }}
              />
              {!warnAbovePause && pauseBelowCurrent && (
                <p className="fcr-validation fcr-validation--danger">
                  Current rate ({liveFcrReading}%) already meets this threshold — dialing will pause immediately.
                </p>
              )}
              {!pauseBelowCurrent && !warnAbovePause && (
                <p className="helper" style={{ marginTop: 'var(--space-5)' }}>
                  New dialing is paused if rate meets this percentage.
                </p>
              )}
            </div>
            <button className="btn-ghost" disabled={disabled} onClick={handleFcrRevert}>
              Revert changes
            </button>
            <p className="cross-panel-note">Outcomes shown in Health thresholds →</p>
            <div className="threshold-confirmation">
              <span className="dot dot-green" />
              System will warn at {controls.fcrWarnThreshold}% · pause at {controls.fcrPauseThreshold}%
            </div>
          </LockableCard>

        </div>

        {/* ── Right panel ──────────────────────────────────────────────────── */}
        <div className="panel panel-right">

          {/* Dials per hour */}
          <div className="card">
            <div className="section-heading">Current dial volume</div>
            {disabled && (
              <p className="dialing-stopped-note">
                <span className="stop-banner-dot" style={{ display: 'inline-block' }} />
                Dialing paused — no active volume
              </p>
            )}
            <div className="dials-grid">
              <div className="dials-col">
                <span className="dials-col-label">7-day same-time baseline</span>
                <span className="dials-col-value">{BASELINE_DIALS}</span>
              </div>
              <div className="dials-col">
                <span className="dials-col-label">Now</span>
                <span className={`dials-col-value${disabled ? ' dials-col-value-muted' : ''}`}>
                  {disabled ? '—' : liveDialsReading}
                </span>
              </div>
              <div className="dials-col">
                <span className="dials-col-label">Projected</span>
                <span className={`dials-col-value${!hasInteracted || disabled ? ' dials-col-value-muted' : ''}`}>
                  {disabled || !hasInteracted ? '—' : proj.dialsProj}
                </span>
              </div>
            </div>
          </div>

          {/* Outcome tracker */}
          <div className="card">
            <div className="section-heading">Health thresholds</div>
            <div className="formula-box">
              <span className="formula-text">
                Healthy if failed connections stay below {liveFcrPause}% and dials stay above{' '}
                <span key={proj.dialsFloor} className="formula-floor-chip">{proj.dialsFloor}/hr</span>
                {' '}within {tolerance}% of the {BASELINE_DIALS}/hr baseline, checked over a {evalWindow}-hour window.
              </span>
            </div>
            <div className="outcome-inputs">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
                <label className="field-label" htmlFor="tol-input">Dials can fall up to this % below baseline before flagging</label>
                <input
                  id="tol-input" type="number" min={0} max={50}
                  className="input input-sm" value={tolerance}
                  onChange={e => setTolerance(parseInt(e.target.value) || 0)}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
                <label className="field-label" htmlFor="eval-window">Evaluation window</label>
                <select id="eval-window" className="select" value={evalWindow} onChange={e => setEvalWindow(e.target.value)} style={{ width: 'fit-content' }}>
                  <option value="1">1 hour</option>
                  <option value="2">2 hours</option>
                  <option value="4">4 hours</option>
                  <option value="8">8 hours</option>
                </select>
              </div>
            </div>
            <div className="baseline-strip">
              <span className="helper">Baseline failed connection rate: <strong style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{CURRENT_FCR}%</strong></span>
              <span className="baseline-sep" />
              <span className="helper">Baseline dials/hour: <strong style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{BASELINE_DIALS}</strong></span>
              <span className="baseline-sep" />
              <span className="helper">Floor: <strong style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{proj.dialsFloor}</strong></span>
            </div>
            <div className="next-eval-note">
              <span className="dot dot-muted" />
              Next evaluation around {nextEvalFormatted} · {evalWindow}-hour window
              {!hasSimulatedEval && !disabled && (
                <button
                  className="simulate-btn"
                  onClick={() => { setHasSimulatedEval(true); setRealizedFloor(proj.dialsFloor) }}
                >
                  Simulate eval close →
                </button>
              )}
            </div>
            <div className="status-boxes">
              <div className={`status-box${projFlash ? ' proj-flash' : ''}`}>
                <div className="status-box-header">
                  Projected status
                  {!hasInteracted && !disabled && <span className="status-box-qualifier">· at current settings</span>}
                </div>
                <StatusRow
                  label="Failed connection rate OK"
                  value={disabled ? null : proj.fcrOk}
                  detail={disabled ? undefined : `${proj.fcrProj}% vs ${liveFcrPause}% limit`}
                />
                <StatusRow
                  label="Throughput OK"
                  value={disabled ? null : proj.throughputOk}
                  detail={disabled ? undefined : `${proj.dialsProj}/hr · floor ${proj.dialsFloor}`}
                />
                <StatusRow label="Overall" value={disabled ? null : proj.overall} overall />
                {disabled && (
                  <p className="proj-placeholder" style={{ padding: 'var(--space-8) var(--space-12)', margin: 0, borderTop: '1px solid var(--border-light)' }}>
                    No active projection while dialing is paused.
                  </p>
                )}
                {!disabled && hasInteracted && !proj.overall && (
                  <p className="proj-nudge">
                    {!proj.fcrOk
                      ? 'Failed connection rate too high — consider reducing dial speed.'
                      : 'Projected dials too low — consider increasing dial speed.'}
                  </p>
                )}
              </div>
              <div className="status-box">
                <div className="status-box-header">
                  Realized status
                  {hasSimulatedEval && <span className="status-box-qualifier">· last window</span>}
                </div>
                {hasSimulatedEval ? (
                  <>
                    <StatusRow
                      label="Failed connection rate OK"
                      value={REALIZED_FCR < liveFcrPause}
                      detail={`${REALIZED_FCR}% vs ${liveFcrPause}% limit`}
                    />
                    <StatusRow
                      label="Throughput OK"
                      value={REALIZED_DIALS >= realizedFloor}
                      detail={`${REALIZED_DIALS}/hr · floor was ${realizedFloor}`}
                    />
                    <StatusRow
                      label="Overall"
                      value={(REALIZED_FCR < liveFcrPause) && (REALIZED_DIALS >= realizedFloor)}
                      overall
                    />
                  </>
                ) : (
                  <>
                    <StatusRow label="Failed connection rate OK" value={null} />
                    <StatusRow label="Throughput OK"             value={null} />
                    <StatusRow label="Overall"                   value={null} overall />
                    <p className="realized-helper">Populated after evaluation window closes.</p>
                  </>
                )}
              </div>
            </div>
            {hasSimulatedEval && !disabled && (
              <p className="check-back-note">
                Realized loaded · adjust tolerance or dial speed above to widen projected margin.
              </p>
            )}
            {!hasSimulatedEval && hasInteracted && !disabled && (
              <p className="check-back-note">
                Check back around {nextEvalFormatted} to see realized impact.
              </p>
            )}
          </div>

          {/* Recent changes */}
          <div className="card">
            <div className="section-heading">What changed</div>
            <table className="changes-table">
              <thead>
                <tr>
                  <th>When</th>
                  <th>Who</th>
                  <th>What</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {changes.map(entry => (
                  <tr key={entry.id + entry.when.toISOString()}>
                    <td className="td-when">{fmtDate(entry.when)}</td>
                    <td className={`td-author${entry.author === 'You' ? ' td-author-you' : ''}`}>{entry.author}</td>
                    <td className={entry.isRollback ? 'td-diff-rollback' : 'td-diff'}>
                      {entry.diff}
                      {rolledBackIds.has(entry.id) && (
                        <span className="badge-rolled-back">rolled back</span>
                      )}
                    </td>
                    <td className="td-action">
                      {!entry.isRollback && !rolledBackIds.has(entry.id) && (
                        <button className="btn-rollback" onClick={() => handleRollback(entry)}>Rollback</button>
                      )}
                      {entry.isRollback && (
                        <button className="btn-rollback" onClick={() => handleReapply(entry)}>Re-apply</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      </div>

      <footer className="app-footer">
        This prototype uses generalized terminology. Internal system names, proprietary metrics, and business-specific thresholds have been abstracted to protect confidential information. Visuals were built using{' '}
        <a href="https://linzlos.github.io/tiny-wire/" target="_blank" rel="noopener noreferrer">Tiny Wire</a>{' '}
        (<a href="https://github.com/LinzLos/tiny-wire" target="_blank" rel="noopener noreferrer">source</a>), a design system I created. The design decisions, constraints, and interactions shown are accurate representations of the work.
      </footer>
    </div>
  )
}
