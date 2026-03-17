import Dexie, { type EntityTable } from 'dexie';

export interface EntityRelationship {
  targetId: string;
  nature: string; // e.g. "Hostile", "Allied", "Dependent", "Secretly Funding"
  strength: number; // 0 to 100
}

export interface Entity {
  id: string;
  name: string;
  type: string;
  traits: string[];
  state: Record<string, any>;
  relationships: EntityRelationship[];
  recent_memory: string[];
  archival_memory: string;
}

export interface SimulationHistory {
  id: string;
  timestamp: number;
  worldContext: string;
  predictionGoal?: string;
  finalTick: number;
  summaries: string[];
  finalEntities: string; // JSON string to keep it flat
}

const db = new Dexie('KirinByteDB') as Dexie & {
  entities: EntityTable<Entity, 'id'>;
  simulations: EntityTable<SimulationHistory, 'id'>;
};

db.version(4).stores({
  entities: 'id, name, type, *traits',
  simulations: 'id, timestamp'
});

export { db };