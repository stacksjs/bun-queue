# CLAUDE.md — bun-queue

## Git Commits

When committing changes, do not include a `Co-Authored-By` line for Claude in commit messages.

---

## ABSOLUTE RULES — READ BEFORE WRITING ANY CODE

### RULE 1: ZERO VANILLA JAVASCRIPT IN CLIENT CODE

This is non-negotiable. Every conversation forgets this. **READ THIS EVERY TIME.**

If you are about to write `document.`, `window.`, `localStorage.`, or an IIFE — **STOP**. There is a stx composable for it. If there isn't, **add one to stx upstream**. No exceptions. No "just this once." No "it's simpler."

### RULE 2: NO POLLING — USE REACTIVE PATTERNS

Never write `setInterval` + fetch loops, `setTimeout` retry loops, or any polling pattern. Use:
- `useFetch()` with reactive dependencies for data that changes
- `useEventListener('stx:navigate', fn)` for navigation-triggered refreshes
- Server-sent events or WebSocket composables for real-time data (add to stx if missing)

### RULE 3: USE STX DIRECTIVES — NOT JS DOM MANIPULATION

All UI behavior goes through stx directives and the reactive system. No `classList.add()`, no `style.display =`, no `innerHTML =`. Use `:class`, `:style`, `:if`, `@click`, `{{ }}`.

### RULE 4: CHECK STX SOURCE BEFORE GUESSING

Before writing **any** frontend code, read these files to know what's available:

| What | File to read |
|------|-------------|
| Browser runtime API | `/Users/glennmichaeltorregosa/Documents/Projects/stx/packages/stx/src/signals.ts` |
| Template directives | `/Users/glennmichaeltorregosa/Documents/Projects/stx/packages/stx/src/process.ts` |
| Expression evaluation | `/Users/glennmichaeltorregosa/Documents/Projects/stx/packages/stx/src/expressions.ts` |
| Reactive system | `/Users/glennmichaeltorregosa/Documents/Projects/stx/packages/stx/src/reactivity.ts` |
| SPA router | `/Users/glennmichaeltorregosa/Documents/Projects/stx/packages/router/src/client.ts` |
| Browser composables | `/Users/glennmichaeltorregosa/Documents/Projects/stx/packages/stx/src/browser-composables.ts` |
| Composable types | `/Users/glennmichaeltorregosa/Documents/Projects/stx/packages/stx/src/composables.ts` |

Search for `window.stx = {` in `signals.ts` to see every function exposed to the browser. Search for `window.` assignments after it to see all globals.

### RULE 5: FIX STX UPSTREAM — NEVER WORK AROUND IT

If stx is missing a composable, directive, or has a bug:
1. Fix it in `/Users/glennmichaeltorregosa/Documents/Projects/stx/packages/stx/src/`
2. Take inspiration from Vue 3 Composition API, Svelte 5 runes, React hooks
3. Rebuild: `cd /Users/glennmichaeltorregosa/Documents/Projects/stx/packages/stx && bun --bun build.ts`
4. If router changes: `cd /Users/glennmichaeltorregosa/Documents/Projects/stx/packages/router && bun --bun build.ts`
5. Test in bun-queue devtools: `bun --watch server.ts`

---

## BANNED PATTERNS — EXACT REPLACEMENTS

| Banned pattern | Use instead |
|----------------|-------------|
| `document.getElementById('x')` | `useRef('x')` with `ref="x"` on element |
| `document.querySelector('.x')` | `useRef('x')` or stx directives |
| `document.querySelectorAll('.x')` | `@for` / `:for` directive |
| `document.createElement('div')` | stx templates / `:if` to show/hide |
| `document.addEventListener('click', fn)` | `@click="fn()"` directive |
| `document.addEventListener('submit', fn)` | `@submit.prevent="fn()"` directive |
| `window.addEventListener('resize', fn)` | `useEventListener('resize', fn)` |
| `window.addEventListener('keydown', fn)` | `useEventListener('keydown', fn)` |
| `window.addEventListener('storage', fn)` | `useLocalStorage()` handles cross-tab sync |
| `window.location.href` | `useRoute()` to read, `navigate(url)` to change |
| `window.location.pathname` | `useRoute().path` |
| `window.history.pushState()` | `navigate(url)` |
| `window.history.back()` | `goBack()` |
| `localStorage.getItem(k)` | `useLocalStorage(k, default)` |
| `localStorage.setItem(k, v)` | `useLocalStorage(k, default)` — write via `.set()` |
| `sessionStorage.getItem(k)` | `useSessionStorage(k, default)` (add to stx if missing) |
| `setTimeout(fn, ms)` | `useTimeout(fn, ms)` |
| `setInterval(fn, ms)` | `useInterval(fn, ms)` |
| `setInterval` + fetch (polling) | `useFetch()` with reactive deps or SSE |
| `el.classList.add('x')` | `:class="{ x: condition }"` directive |
| `el.classList.toggle('x')` | `:class="{ x: isActive() }"` with signal |
| `el.style.display = 'none'` | `:if="condition"` directive |
| `el.style.color = 'red'` | `:style="{ color: val() }"` directive |
| `el.innerHTML = '...'` | `{{ expression }}` or `{!! rawHtml !!}` |
| `el.textContent = '...'` | `{{ expression }}` |
| `el.setAttribute('href', x)` | `:href="expression"` |
| `new MutationObserver(...)` | `effect()` — stx tracks reactive deps automatically |
| `(function() { ... })()` | `stx.mount(fn)` or `stx.mountEl(sel, fn)` |
| `fetch().then().then()` in IIFE | `useFetch(url)` or `useAsync(fn)` |
| Custom SPA router | `injectRouterScript()` — canonical router handles everything |

---

## EXCEPTIONS — LEGITIMATE EXTERNAL LIB USAGE

These are the **only** cases where direct DOM/window access is acceptable:

| Exception | Why | Rule |
|-----------|-----|------|
| **Chart.js initialization** | Chart.js requires a canvas context via its own API | Wrap in `onMount()`, destroy in `onDestroy()`, get canvas via `useRef()` |
| **D3.js bindings** | D3 manages its own DOM subtree | Contain D3 in `onMount()`, scope to a `useRef()` container, cleanup in `onDestroy()` |
| **Blob/File download** | Browser API for triggering file downloads | Wrap in a function called via `@click`, use `URL.createObjectURL()` inside |
| **Clipboard API** | `navigator.clipboard.writeText()` | Wrap in `@click` handler, add `useClipboard()` to stx if used frequently |
| **Canvas 2D/WebGL** | Raw canvas rendering | Get canvas via `useRef()`, init in `onMount()`, cleanup in `onDestroy()` |
| **Third-party widget init** | Libraries that mount to a container element | Get container via `useRef()`, init in `onMount()`, destroy in `onDestroy()` |

**Pattern for all exceptions:**
```html
<canvas ref="chart-canvas"></canvas>
<script data-stx-scoped>
  stx.mount(function() {
    var chartRef = useRef('chart-canvas')
    onMount(function() {
      var chart = new Chart(chartRef.current, { /* config */ })
      return function() { chart.destroy() }  // cleanup
    })
    return {}
  })
</script>
```

Even with exceptions, **never** use `getElementById` or `querySelector` — always `useRef()`.

---

## COMMON GOTCHAS — MISTAKES WE KEEP MAKING

### 1. Writing IIFEs for "simple" sidebar/nav logic
**Wrong:** "It's just a toggle, I'll use a quick IIFE with getElementById"
**Right:** `stx.mountEl()` + `useLocalStorage()` + `@click` — same amount of code, reactive, persistent, cross-tab synced

### 2. Writing a custom SPA router
**Wrong:** Copy-pasting a fetch + DOMParser + innerHTML router into the layout
**Right:** Call `injectRouterScript(html)` in `index.ts` — the canonical router in `stx/packages/router/src/client.ts` handles link interception, view transitions, script re-execution, cleanup, prefetch, caching, active links, and external script loading

### 3. Forgetting that `@for` clones need x-cloak removed
**Fixed upstream:** `bindFor` and `bindIf` in `signals.ts` now strip `x-cloak` from clones. If `{{ }}` shows raw in `@for` output, the stx build is stale — rebuild.

### 4. Polling with setInterval + fetch for "live" data
**Wrong:** `setInterval(function() { fetch('/api/jobs').then(...) }, 5000)`
**Right:** `useFetch('/api/jobs')` or reactive pattern. For truly real-time: add SSE/WS composable to stx.

### 5. Using `document.currentScript` hacks for mount targeting
**Wrong:** Placing `<script>` tags next to elements to use `document.currentScript.nextElementSibling`
**Right:** `stx.mountEl('#sidebar', fn)` — mounts to any element by selector, no script placement dependency

### 6. Inline style/class manipulation in JS
**Wrong:** `effect(function() { el.classList.add('collapsed') })`
**Right:** `:class="{ collapsed: isCollapsed() }"` on the element — stx handles the DOM updates

### 7. Not cleaning up Chart.js/D3 on SPA navigation
**Wrong:** `new Chart(canvas, config)` in a bare `<script>` — leaks on every navigation
**Right:** Initialize in `onMount()`, return destroy function. The router calls `stx._cleanupContainer()` which triggers `onDestroy` hooks.

### 8. External scripts not loading on SPA navigation
**Fixed upstream:** The router's `swap()` now detects new `<head>` scripts, loads them, waits for them, then runs inline scripts. If Chart.js/D3 pages break on SPA nav, the router build is stale.

### 9. Forgetting `data-stx-link` on nav items
The canonical router manages active classes on elements with `data-stx-link`. Without it, nav items won't highlight on SPA navigation. Add `data-stx-active-class="active"` for custom class names.

### 10. Guessing what stx provides instead of reading the source
**Wrong:** Assuming stx doesn't have X, writing vanilla JS
**Right:** `grep -n 'function useWhatever' signals.ts` or read `window.stx = {` block. The runtime has 30+ composables. Check before coding.

---

## STX CLIENT-SIDE DIRECTIVE REFERENCE

### Reactive Bindings (applied to HTML attributes in rendered output)
| Directive | Purpose | Example |
|-----------|---------|---------|
| `{{ expr }}` | Text interpolation | `<span>{{ job.name }}</span>` |
| `{!! expr !!}` | Raw HTML output | `{!! htmlContent !!}` |
| `:attr="expr"` | Attribute binding | `:href="job.url"`, `:disabled="loading()"` |
| `:class="expr"` | Class binding (object or array) | `:class="{ active: isActive(), hidden: !show() }"` |
| `:style="expr"` | Style binding (object) | `:style="{ color: textColor(), opacity: fade() }"` |
| `:if="expr"` | Conditional render | `:if="items().length > 0"` |
| `:for="x in items"` | List render | `:for="job in jobs()"` |
| `@click="expr"` | Click handler | `@click="toggle()"`, `@click="deleteJob(job.id)"` |
| `@submit="expr"` | Submit handler | `@submit.prevent="handleSubmit()"` |
| `@input="expr"` | Input handler | `@input="search.set($event.target.value)"` |
| `@keydown="expr"` | Keydown handler | `@keydown.enter="submit()"` |
| `@change="expr"` | Change handler | `@change="filter.set($event.target.value)"` |
| `@model="prop"` | Two-way binding | `@model="searchQuery"` |
| `ref="name"` | Element reference | `ref="chart-canvas"` → `useRef('chart-canvas')` |
| `x-cloak` | Hide until processed | Auto-added by stx, auto-removed after mount |

### Event Modifiers
| Modifier | Effect |
|----------|--------|
| `.prevent` | `e.preventDefault()` |
| `.stop` | `e.stopPropagation()` |
| `.once` | Remove after first trigger |
| `.capture` | Use capture phase |
| `.passive` | Passive listener |
| `.enter` / `.escape` / `.space` | Key-specific |

### Server-Side Directives (process.ts — Blade-like, processed before sending to browser)
| Directive | Purpose |
|-----------|---------|
| `@extends('layout')` | Extend a layout |
| `@section('name')...@endsection` | Define section content |
| `@yield('name', 'default')` | Output section in layout |
| `@push('stack')...@endpush` | Push to named stack |
| `@stack('name')` | Output stack contents |
| `@include('partial')` | Include partial template |
| `@includeIf('partial')` | Include if exists |
| `@includeWhen(cond, 'partial')` | Conditional include |
| `@if(cond)...@elseif...@else...@endif` | Server conditional |
| `@unless(cond)...@endunless` | Negated conditional |
| `@foreach(items as item)...@endforeach` | Server loop |
| `@forelse(items as item)...@empty...@endforelse` | Loop with empty fallback |
| `@for(init; cond; step)...@endfor` | C-style server loop |
| `@switch(val)...@case...@break...@default...@endswitch` | Switch |
| `@json(data)` | Output JSON-encoded |
| `@csrf` | CSRF token field |
| `@method('PUT')` | HTTP method spoofing |

---

## STX RUNTIME API REFERENCE (browser — signals.ts)

### Reactivity
| Function | Description |
|----------|-------------|
| `state(initial)` | Reactive signal. Read: `s()`. Write: `s.set(val)` |
| `derived(fn)` | Computed signal, auto-tracks deps. Read: `d()` |
| `effect(fn)` | Side effect, re-runs on dep change. Returns dispose fn |
| `batch(fn)` | Batch multiple writes, single re-render |
| `untrack(fn)` | Read signals inside without tracking |
| `peek(signal)` | Read value without tracking |
| `isSignal(val)` | Check if value is a signal |

### Lifecycle
| Function | Description |
|----------|-------------|
| `onMount(fn)` | Runs after DOM ready. Return cleanup fn for auto-destroy |
| `onDestroy(fn)` | Runs on teardown (SPA navigation, cleanup) |

### Composables
| Function | Description |
|----------|-------------|
| `useRef(name)` | DOM ref by `ref="name"`. Returns `{ current: HTMLElement }` |
| `useLocalStorage(key, default)` | Persistent signal, cross-tab sync |
| `useEventListener(event, handler, opts?)` | Auto-cleanup. `opts.target` for specific element |
| `useFetch(url, opts?)` | Reactive data fetching |
| `useDebounce(fn, ms)` | Debounced function |
| `useDebouncedValue(signal, ms)` | Debounced signal value |
| `useThrottle(fn, ms)` | Throttled function |
| `useInterval(fn, ms)` | Auto-cleanup interval |
| `useTimeout(fn, ms)` | Auto-cleanup timeout |
| `useToggle(initial?)` | Boolean toggle. Returns `[value, toggle]` |
| `useCounter(initial?)` | Counter with inc/dec/reset |
| `useClickOutside(ref, handler)` | Detect outside clicks |
| `useFocus(ref)` | Track element focus state |
| `useAsync(fn)` | Async with loading/error/data states |
| `useColorMode(opts?)` | Theme management (light/dark/system) |
| `useDark(opts?)` | Dark mode toggle |

### Navigation
| Function | Description |
|----------|-------------|
| `navigate(url)` | SPA navigation via canonical router |
| `goBack()` | History back |
| `goForward()` | History forward |
| `useRoute()` | Current route info (path, params, query) |
| `useSearchParams()` | URL search parameters |

### Mount System
| Function | Description |
|----------|-------------|
| `stx.mount(setupFn)` | Mount to nearest element (uses `document.currentScript`) |
| `stx.mountEl(selector, setupFn)` | Mount to specific element by CSS selector |

### Vue-compat Aliases
`ref` = `state`, `reactive` = `state`, `computed` = `derived`, `watch` = `$watch`, `watchEffect` = `effect`

---

## SPA ROUTER

The canonical router lives in `stx/packages/router/src/client.ts` and is injected via `injectRouterScript()`. **Do NOT write custom routers.**

It handles: link interception, history pushState, View Transitions API with CSS fallback, `<head>` style swapping, external `<head>` script loading (Chart.js/D3), smart script filtering, prefetch on hover, response caching (5min TTL), active link management (`data-stx-link`), cleanup via `stx._cleanupContainer()`.

Configure: `window.STX_ROUTER_OPTIONS = { container: '#main-wrapper' }`

---

## PROJECT STRUCTURE

```
packages/
  bun-queue/            # Core Redis-backed job queue
  devtools/             # Dashboard UI (stx-based)
    src/
      layouts/app.stx   # Layout — sidebar mount + router config (NO vanilla JS)
      pages/*.stx       # 12 pages
      partials/         # sidebar.stx, etc.
      components/       # stx components
      index.ts          # Server — renders pages, injects router
      api.ts            # API routes + mock data
      types.ts          # TypeScript types
server.ts               # Dev entry → devtools/src/index.ts
```

**stx (bun-linked):** `/Users/glennmichaeltorregosa/Documents/Projects/stx`

## RUNNING

- Dev server: `bun --watch server.ts` (port 4400)
- Build stx: `cd /Users/glennmichaeltorregosa/Documents/Projects/stx/packages/stx && bun --bun build.ts`
- Build router: `cd /Users/glennmichaeltorregosa/Documents/Projects/stx/packages/router && bun --bun build.ts`

## CORRECT PATTERNS

### Sidebar toggle
```html
<script data-stx-scoped>
  stx.mountEl('#sidebar', function() {
    var collapsed = useLocalStorage('sidebar-collapsed', false)
    function toggle() { collapsed.set(!collapsed()) }
    effect(function() { /* apply classes via refs or let :class handle it */ })
    return { collapsed: collapsed, toggle: toggle }
  })
</script>
```
Button: `<button @click="toggle()">` — never `id="sidebar-toggle"` with addEventListener.

### Page with data fetching
```html
<script data-stx-scoped>
  stx.mount(function() {
    var jobs = state([])
    var loading = state(true)
    useFetch('/api/jobs').then(function(r) { jobs.set(r); loading.set(false) })
    return { jobs: jobs, loading: loading }
  })
</script>
```

### Chart.js (exception pattern)
```html
<canvas ref="my-chart"></canvas>
<script data-stx-scoped>
  stx.mount(function() {
    var chartRef = useRef('my-chart')
    onMount(function() {
      var chart = new Chart(chartRef.current, { /* config */ })
      return function() { chart.destroy() }
    })
    return {}
  })
</script>
```

### Router injection (server-side, index.ts)
```typescript
import { injectRouterScript, processDirectives } from '@stacksjs/stx'
let html = await processDirectives(content, context, templatePath, config, new Set())
html = injectRouterScript(html)
```
