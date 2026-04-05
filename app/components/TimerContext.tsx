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
  | { type: "tick" }
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
    case "tick":
      return { ...state, elapsed: state.elapsed + 1 };
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
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const saved = readPersistedTimerState();

    if (saved?.sessionStartISO) {
      startRef.current = new Date(saved.sessionStartISO);
    }

    if (saved?.running && saved.segmentStartMs != null) {
      const away = Math.floor((Date.now() - saved.segmentStartMs) / 1000);
      dispatch({
        type: "hydrate",
        payload: {
          elapsed: (saved.elapsed ?? 0) + away,
          running: true,
          selectedTaskId: saved.selectedTaskId ?? "",
        },
      });
      segmentStartMsRef.current = Date.now();
      intervalRef.current = setInterval(() => dispatch({ type: "tick" }), 1000);
    } else {
      dispatch({
        type: "hydrate",
        payload: {
          elapsed: saved?.elapsed ?? 0,
          running: false,
          selectedTaskId: saved?.selectedTaskId ?? "",
        },
      });
      segmentStartMsRef.current = null;
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  useEffect(() => {
    if (!state.hydrated) return;

    if (!state.running && state.elapsed === 0) {
      localStorage.removeItem("timer_state");
      return;
    }

    localStorage.setItem(
      "timer_state",
      JSON.stringify({
        running: state.running,
        elapsed: state.elapsed,
        segmentStartMs: state.running ? segmentStartMsRef.current ?? Date.now() : undefined,
        sessionStartISO: startRef.current?.toISOString(),
        selectedTaskId: state.selectedTaskId,
      }),
    );
  }, [state.elapsed, state.hydrated, state.running, state.selectedTaskId]);

  function start() {
    if (!startRef.current) startRef.current = new Date();
    if (intervalRef.current) clearInterval(intervalRef.current);
    segmentStartMsRef.current = Date.now();
    dispatch({ type: "start" });
    intervalRef.current = setInterval(() => dispatch({ type: "tick" }), 1000);
  }

  function pause() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
    segmentStartMsRef.current = null;
    dispatch({ type: "pause" });
  }

  function stop(): StoppedSession | null {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
    segmentStartMsRef.current = null;

    if (!startRef.current || state.elapsed === 0) {
      startRef.current = null;
      dispatch({ type: "reset" });
      return null;
    }

    const result: StoppedSession = { elapsed: state.elapsed, sessionStart: startRef.current };
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
