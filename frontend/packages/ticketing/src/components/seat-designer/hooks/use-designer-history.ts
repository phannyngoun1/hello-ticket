/**
 * Undo/Redo History Hook for Seat Designer
 * 
 * Provides snapshot-based undo/redo functionality for designer state.
 * Uses a generic approach with getSnapshot/restoreSnapshot functions
 * to stay decoupled from the actual state shape.
 */

import { useState, useCallback, useRef } from "react";

export interface UseDesignerHistoryOptions<T> {
  /** Function to capture current state snapshot */
  getSnapshot: () => T;
  /** Function to restore state from a snapshot */
  restoreSnapshot: (snapshot: T) => void;
  /** Maximum number of history entries (default: 50) */
  maxHistory?: number;
}

export interface UseDesignerHistoryReturn {
  /** Record current state as a snapshot (call before making changes) */
  recordSnapshot: () => void;
  /** Undo last change */
  undo: () => void;
  /** Redo last undone change */
  redo: () => void;
  /** Clear entire history */
  clearHistory: () => void;
  /** Whether undo is available */
  canUndo: boolean;
  /** Whether redo is available */
  canRedo: boolean;
}

const DEFAULT_MAX_HISTORY = 50;

export function useDesignerHistory<T>({
  getSnapshot,
  restoreSnapshot,
  maxHistory = DEFAULT_MAX_HISTORY,
}: UseDesignerHistoryOptions<T>): UseDesignerHistoryReturn {
  // History stack: past snapshots (oldest first)
  const [past, setPast] = useState<T[]>([]);
  // Future stack: undone snapshots (newest first)
  const [future, setFuture] = useState<T[]>([]);
  
  // Track if we're currently restoring (to prevent recording during undo/redo)
  const isRestoringRef = useRef(false);

  const recordSnapshot = useCallback(() => {
    // Don't record if we're in the middle of an undo/redo operation
    if (isRestoringRef.current) {
      return;
    }

    const snapshot = getSnapshot();
    
    setPast((prev) => {
      // Add new snapshot to past
      const newPast = [...prev, snapshot];
      // Limit history size
      if (newPast.length > maxHistory) {
        return newPast.slice(-maxHistory);
      }
      return newPast;
    });
    
    // Clear future when new action is recorded (can't redo after new action)
    setFuture([]);
  }, [getSnapshot, maxHistory]);

  const undo = useCallback(() => {
    if (past.length === 0) {
      return;
    }

    // Get current state as snapshot (to push to future)
    const currentSnapshot = getSnapshot();
    
    // Get the previous state from past
    const previousSnapshot = past[past.length - 1];
    
    // Remove from past
    setPast((prev) => prev.slice(0, -1));
    
    // Add current state to future
    setFuture((prev) => [currentSnapshot, ...prev]);
    
    // Restore previous state
    isRestoringRef.current = true;
    restoreSnapshot(previousSnapshot);
    // Reset flag after a microtask to allow state updates to complete
    Promise.resolve().then(() => {
      isRestoringRef.current = false;
    });
  }, [past, getSnapshot, restoreSnapshot]);

  const redo = useCallback(() => {
    if (future.length === 0) {
      return;
    }

    // Get current state as snapshot (to push to past)
    const currentSnapshot = getSnapshot();
    
    // Get the next state from future
    const nextSnapshot = future[0];
    
    // Remove from future
    setFuture((prev) => prev.slice(1));
    
    // Add current state to past
    setPast((prev) => [...prev, currentSnapshot]);
    
    // Restore next state
    isRestoringRef.current = true;
    restoreSnapshot(nextSnapshot);
    // Reset flag after a microtask to allow state updates to complete
    Promise.resolve().then(() => {
      isRestoringRef.current = false;
    });
  }, [future, getSnapshot, restoreSnapshot]);

  const clearHistory = useCallback(() => {
    setPast([]);
    setFuture([]);
  }, []);

  return {
    recordSnapshot,
    undo,
    redo,
    clearHistory,
    canUndo: past.length > 0,
    canRedo: future.length > 0,
  };
}
