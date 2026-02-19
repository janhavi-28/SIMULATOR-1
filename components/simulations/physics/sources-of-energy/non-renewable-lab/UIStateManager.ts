/**
 * UI state for the non-renewable simulator: overlays, theme, mode, accessibility.
 * No physics — pure UI preferences.
 */

import { useCallback, useState } from "react";
import type { LearningMode, OverlayToggles, RunMode } from "./types";

const DEFAULT_OVERLAYS: OverlayToggles = {
  showEnergyFlow: true,
  showHeatLoss: true,
  showEmissions: true,
  showEfficiency: true,
};

export interface UIState {
  learningMode: LearningMode;
  overlayToggles: OverlayToggles;
  colorTheme: "default" | "highContrast";
  animationSpeed: number;
  runSpeed: number;
  runMode: RunMode;
  autoStabilize: boolean;
  soundEnabled: boolean;
  highContrastMode: boolean;
  largeLabels: boolean;
  slowMotion: boolean;
  showOnlyMainProcesses: boolean;
  graphPanelOpen: boolean;
}

const DEFAULT_UI_STATE: UIState = {
  learningMode: "explore",
  overlayToggles: DEFAULT_OVERLAYS,
  colorTheme: "default",
  animationSpeed: 1,
  runSpeed: 1,
  runMode: "realtime",
  autoStabilize: false,
  soundEnabled: false,
  highContrastMode: false,
  largeLabels: false,
  slowMotion: false,
  showOnlyMainProcesses: false,
  graphPanelOpen: true,
};

export function useUIState(initial: Partial<UIState> = {}) {
  const [state, setState] = useState<UIState>({ ...DEFAULT_UI_STATE, ...initial });

  const setLearningMode = useCallback((mode: LearningMode) => {
    setState((s) => ({ ...s, learningMode: mode }));
  }, []);

  const setOverlay = useCallback(<K extends keyof OverlayToggles>(key: K, value: boolean) => {
    setState((s) => ({
      ...s,
      overlayToggles: { ...s.overlayToggles, [key]: value },
    }));
  }, []);

  const setColorTheme = useCallback((theme: "default" | "highContrast") => {
    setState((s) => ({ ...s, colorTheme: theme }));
  }, []);

  const setAnimationSpeed = useCallback((speed: number) => {
    setState((s) => ({ ...s, animationSpeed: speed }));
  }, []);

  const setRunSpeed = useCallback((speed: number) => {
    setState((s) => ({ ...s, runSpeed: speed }));
  }, []);

  const setRunMode = useCallback((mode: RunMode) => {
    setState((s) => ({ ...s, runMode: mode }));
  }, []);

  const setAutoStabilize = useCallback((v: boolean) => {
    setState((s) => ({ ...s, autoStabilize: v }));
  }, []);

  const setSoundEnabled = useCallback((v: boolean) => {
    setState((s) => ({ ...s, soundEnabled: v }));
  }, []);

  const setHighContrastMode = useCallback((v: boolean) => {
    setState((s) => ({ ...s, highContrastMode: v }));
  }, []);

  const setLargeLabels = useCallback((v: boolean) => {
    setState((s) => ({ ...s, largeLabels: v }));
  }, []);

  const setSlowMotion = useCallback((v: boolean) => {
    setState((s) => ({ ...s, slowMotion: v }));
  }, []);

  const setShowOnlyMainProcesses = useCallback((v: boolean) => {
    setState((s) => ({ ...s, showOnlyMainProcesses: v }));
  }, []);

  const setGraphPanelOpen = useCallback((v: boolean) => {
    setState((s) => ({ ...s, graphPanelOpen: v }));
  }, []);

  const toggleGraphPanel = useCallback(() => {
    setState((s) => ({ ...s, graphPanelOpen: !s.graphPanelOpen }));
  }, []);

  return {
    uiState: state,
    setLearningMode,
    setOverlay,
    setColorTheme,
    setAnimationSpeed,
    setRunSpeed,
    setRunMode,
    setAutoStabilize,
    setSoundEnabled,
    setHighContrastMode,
    setLargeLabels,
    setSlowMotion,
    setShowOnlyMainProcesses,
    setGraphPanelOpen,
    toggleGraphPanel,
  };
}
