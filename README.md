# ☎️ Predictive Dialing — Manual Levers

An interactive UX prototype of the **operator control panel for a predictive dialing system** — the screen a contact-center operations lead uses to safely push call volume up or down in real time, without overdialing, burning a segment, or flying past a quality limit.

### ▶️ [Live demo → dialing.netlify.app](https://dialing.netlify.app/)

It's a working front-end, not a mockup: the levers move, the projections recompute live, every change lands in an audit log you can roll back, and a simulated "live" system drifts underneath you so the readings feel real.

> **On the terminology:** this prototype uses generalized language. Internal system names, proprietary metrics, and business-specific thresholds are abstracted to protect confidential information. The design decisions, constraints, and interactions are accurate representations of the real work.

## What the screen does

A single operator surface, split into levers (left) and consequences (right):

**Levers — left panel**
- **Dial speed** — a 1.0×–2.0× multiplier on calls placed per available banker. The constraint is modeled: failed-connection rate rises slowly at low speeds and accelerates sharply past ~1.5×, so pushing harder has a visible cost.
- **Protect against overdialing** — only dial harder when at least *N* spare bankers are free.
- **Focus calls on a segment** — route priority to an opportunity group (High-value renewals, Lapsed accounts, Win-back, …) for a set window, then fall back to normal. Each segment carries its own calibrated failed-connection baseline.
- **When to slow down or stop** — operator-set **warn** and **pause** thresholds on failed-connection rate, with live validation (warn must sit below pause; a threshold already met by the current rate warns you it'll trigger immediately).
- **Stop all dialing** — a hard stop with a reason and a resume timer, surfaced as a persistent banner and a live countdown. While stopped, every lever locks.

**Consequences — right panel**
- **Current dial volume** — 7-day same-time baseline vs. now vs. projected.
- **Health thresholds** — a spelled-out healthy condition (failed connections below the pause line *and* dials above a tolerance floor over an evaluation window), with **Projected** status (what your current settings imply) shown next to **Realized** status (what actually happened last window — simulate the eval close to populate it).
- **What changed** — an audit log of every adjustment with who/when/what, one-click **Rollback**, and **Re-apply** for anything you rolled back.

## Interaction craft worth a look

The detail that makes it read as a real tool, not a form:
- **Draft vs. applied state** — a lever shows its new value as you drag, but only commits (and logs) on release/blur, so the audit trail stays clean.
- **Optimistic projection flash** — the projected panel pulses the moment a change commits, tying cause to effect.
- **Live drift** — failed-connection and dial readings wander slightly on a timer, so the system feels alive and thresholds feel consequential.
- **Guarded inputs** — invalid threshold combinations are caught inline and reverted rather than silently accepted.
- **Locked-while-paused** — stopping dialing visibly disables the levers, because you shouldn't be tuning a system that isn't running.

## Built with

- **[Tiny Wire](https://linzlos.github.io/tiny-wire/)** ([source](https://github.com/LinzLos/tiny-wire)) — the design system this is built on; all tokens, type, and components come from it. Includes full light/dark theming with a persisted toggle.
- **React 19** + **TypeScript** + **Vite** + **React Router** + **Tailwind CSS v4**.
- Deployed on **Netlify** with SPA routing fallback.

## Run it locally

```bash
npm install
npm run dev      # start the dev server (Vite)
npm run build    # type-check + production build to dist/
npm run preview  # serve the production build
```

## Credits

Designed and built by **Lindsay Zuñiga**. Built on the [Tiny Wire](https://github.com/LinzLos/tiny-wire) design system. Please credit when remixing or adapting — feedback welcome → [linkedin.com/in/zunigo](https://www.linkedin.com/in/zunigo)
