"use client";

import { createContext, useContext, useEffect, useReducer, useRef } from "react";

interface StoppedSession {
  elapsed: number;
  sessionStart: Date;
}

interface TimerContextValue {
  elapsed: number;
  running: boolean;
  selectedTaskId: string;
  setSelectedTaskId: (id: string) => void;
  start: () => void;
  pause: () => void;
  stop: () => StoppedSession | null;
}

interface PersistedTimerState {
  running: boolean;
  elapsed: number;
  segmentStartMs?: number;
  sessionStartISO?: string;
  selectedTaskId?: string;
}

interface TimerState {
  elapsed: number;
  running: boolean;
  selectedTaskId: string;
  hydrated: boolean;
}

type TimerAction =
  | {
      type: "hydrate";
      payload: { elapsed: number; running: boolean; selectedTaskId: string };
    }
  | { type: "sync-elapsed"; payload: number }
  | { type: "start" }
  | { type: "pause" }
  | { type: "reset" }
  | { type: "set-task"; payload: string };

const TimerContext = createContext<TimerContextValue | null>(null);

const initialState: TimerState = {
  elapsed: 0,
  running: false,
  selectedTaskId: "",
  hydrated: false,
};

function timerReducer(state: TimerState, action: TimerAction): TimerState {
  switch (action.type) {
    case "hydrate":
      return {
        elapsed: action.payload.elapsed,
        running: action.payload.running,
        selectedTaskId: action.payload.selectedTaskId,
        hydrated: true,
      };
    case "sync-elapsed":
      if (state.elapsed === action.payload) return state;
      return { ...state, elapsed: action.payload };
    case "start":
      return { ...state, running: true };
    case "pause":
      return { ...state, running: false };
    case "reset":
      return { ...state, elapsed: 0, running: false };
    case "set-task":
      return { ...state, selectedTaskId: action.payload };
    default:
      return state;
  }
}

function readPersistedTimerState(): PersistedTimerState | null {
  const raw = localStorage.getItem("timer_state");
  if (!raw) return null;

  try {
    return JSON.parse(raw) as PersistedTimerState;
  } catch {
    localStorage.removeItem("timer_state");
    return null;
  }
}

export function TimerProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(timerReducer, initialState);
  const startRef = useRef<Date | null>(null);
  const segmentStartMsRef = useRef<number | null>(null);
  const elapsedBeforeRunRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stateRef = useRef(initialState);

  function getElapsedNow(now = Date.now()) {
    if (segmentStartMsRef.current == null) return elapsedBeforeRunRef.current;
    return elapsedBeforeRunRef.current + Math.max(0, Math.floor((now - segmentStartMsRef.current) / 1000));
  }

  function syncElapsed(now = Date.now()) {
    dispatch({ type: "sync-elapsed", payload: getElapsedNow(now) });
  }

  function clearTicker() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
  }

  function startTicker() {
    clearTicker();
    intervalRef.current = setInterval(() => {
      syncElapsed();
    }, 250);
  }

  function persistTimerState(now = Date.now()) {
    const currentState = stateRef.current;

    if (!currentState.hydrated) return;

    if (!currentState.running && currentState.elapsed === 0) {
      localStorage.removeItem("timer_state");
      return;
    }

    const persistedElapsed = currentState.running ? getElapsedNow(now) : elapsedBeforeRunRef.current;

    localStorage.setItem(
      "timer_state",
      JSON.stringify({
        running: currentState.running,
        elapsed: persistedElapsed,
        segmentStartMs: currentState.running ? now : undefined,
        sessionStartISO: startRef.current?.toISOString(),
        selectedTaskId: currentState.selectedTaskId,
      }),
    );
  }

  function applyPersistedState(saved: PersistedTimerState | null, now = Date.now()) {
    clearTicker();

    if (saved?.sessionStartISO) {
      startRef.current = new Date(saved.sessionStartISO);
    } else {
      startRef.current = null;
    }

    elapsedBeforeRunRef.current = saved?.elapsed ?? 0;

    if (saved?.running && saved.segmentStartMs != null) {
      segmentStartMsRef.current = saved.segmentStartMs;
      const elapsed = getElapsedNow(now);
      dispatch({
        type: "hydrate",
        payload: {
          elapsed,
          running: true,
          selectedTaskId: saved.selectedTaskId ?? "",
        },
      });
      startTicker();
      return;
    }

    segmentStartMsRef.current = null;
    dispatch({
      type: "hydrate",
      payload: {
        elapsed: elapsedBeforeRunRef.current,
        running: false,
        selectedTaskId: saved?.selectedTaskId ?? "",
      },
    });
  }

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    applyPersistedState(readPersistedTimerState());

    function resyncFromClock() {
      if (segmentStartMsRef.current == null) return;
      const now = Date.now();
      syncElapsed(now);
      persistTimerState(now);
    }

    function persistOnLifecycleChange() {
      persistTimerState();
    }

    function onStorage(event: StorageEvent) {
      if (event.key !== "timer_state") return;

      if (!event.newValue) {
        clearTicker();
        startRef.current = null;
        segmentStartMsRef.current = null;
        elapsedBeforeRunRef.current = 0;
        dispatch({
          type: "hydrate",
          payload: { elapsed: 0, running: false, selectedTaskId: "" },
        });
        return;
      }

      try {
        applyPersistedState(JSON.parse(event.newValue) as PersistedTimerState);
      } catch {
        localStorage.removeItem("timer_state");
      }
    }

    window.addEventListener("focus", resyncFromClock);
    window.addEventListener("pageshow", resyncFromClock);
    document.addEventListener("visibilitychange", resyncFromClock);
    window.addEventListener("storage", onStorage);
    window.addEventListener("pagehide", persistOnLifecycleChange);
    window.addEventListener("beforeunload", persistOnLifecycleChange);

    return () => {
      window.removeEventListener("focus", resyncFromClock);
      window.removeEventListener("pageshow", resyncFromClock);
      document.removeEventListener("visibilitychange", resyncFromClock);
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("pagehide", persistOnLifecycleChange);
      window.removeEventListener("beforeunload", persistOnLifecycleChange);
      clearTicker();
    };
  }, []);

  useEffect(() => {
    persistTimerState();
  }, [state.elapsed, state.hydrated, state.running, state.selectedTaskId]);

  function start() {
    if (!startRef.current) startRef.current = new Date();
    if (segmentStartMsRef.current != null) return;
    segmentStartMsRef.current = Date.now();
    dispatch({ type: "start" });
    syncElapsed(segmentStartMsRef.current);
    startTicker();
  }

  function pause() {
    const elapsed = getElapsedNow();
    elapsedBeforeRunRef.current = elapsed;
    segmentStartMsRef.current = null;
    clearTicker();
    dispatch({ type: "sync-elapsed", payload: elapsed });
    dispatch({ type: "pause" });
  }

  function stop(): StoppedSession | null {
    const elapsed = getElapsedNow();
    clearTicker();
    segmentStartMsRef.current = null;
    elapsedBeforeRunRef.current = 0;

    if (!startRef.current || elapsed === 0) {
      startRef.current = null;
      dispatch({ type: "reset" });
      return null;
    }

    const result: StoppedSession = { elapsed, sessionStart: startRef.current };
    startRef.current = null;
    dispatch({ type: "reset" });
    return result;
  }

  function setSelectedTaskId(id: string) {
    dispatch({ type: "set-task", payload: id });
  }

  return (
    <TimerContext.Provider
      value={{
        elapsed: state.elapsed,
        running: state.running,
        selectedTaskId: state.selectedTaskId,
        setSelectedTaskId,
        start,
        pause,
        stop,
      }}
    >
      {children}
    </TimerContext.Provider>
  );
}

export function useTimer() {
  const ctx = useContext(TimerContext);
  if (!ctx) throw new Error("useTimer must be used within TimerProvider");
  return ctx;
}
