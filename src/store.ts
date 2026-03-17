import { create } from 'zustand';

interface WorldState {
  apiKey: string;
  modelId: string;
  tick: number;
  worldContext: string;
  globalEvent: string;
  
  setApiKey: (key: string) => void;
  setModelId: (modelId: string) => void;
  incrementTick: () => void;
  setWorldContext: (ctx: string) => void;
  setGlobalEvent: (evt: string) => void;
}

export const useStore = create<WorldState>((set) => ({
  apiKey: '',
  modelId: 'deepseek/deepseek-chat',
  tick: 0,
  worldContext: 'Year 2026, tech startup boom in SE Asia',
  globalEvent: '',

  setApiKey: (key) => set({ apiKey: key }),
  setModelId: (model) => set({ modelId: model }),
  incrementTick: () => set((state) => ({ tick: state.tick + 1 })),
  setWorldContext: (ctx) => set({ worldContext: ctx }),
  setGlobalEvent: (evt) => set({ globalEvent: evt }),
}));