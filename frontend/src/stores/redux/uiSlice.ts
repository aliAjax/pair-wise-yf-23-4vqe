import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export interface ToastItem {
  id: number;
  kind: "success" | "error" | "info";
  message: string;
}

export interface LogEntry {
  id: number;
  time: string;
  entity: string;
  message: string;
}

interface UiState {
  toasts: ToastItem[];
  logs: LogEntry[];
}

const initialState: UiState = { toasts: [], logs: [] };

let toastSeq = 1;
let logSeq = 1;

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    toastAdded: {
      reducer(state, action: PayloadAction<ToastItem>) {
        state.toasts.push(action.payload);
      },
      prepare(kind: ToastItem["kind"], message: string) {
        return { payload: { id: toastSeq++, kind, message } };
      }
    },
    toastDismissed(state, action: PayloadAction<number>) {
      state.toasts = state.toasts.filter((toast) => toast.id !== action.payload);
    },
    logAdded: {
      reducer(state, action: PayloadAction<LogEntry>) {
        state.logs.unshift(action.payload);
        if (state.logs.length > 200) state.logs.length = 200;
      },
      prepare(entity: string, message: string) {
        return { payload: { id: logSeq++, time: new Date().toISOString(), entity, message } };
      }
    }
  }
});

export const uiActions = uiSlice.actions;
export const uiReducer = uiSlice.reducer;
