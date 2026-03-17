import Dexie, { type EntityTable } from 'dexie';

export interface Entity {
  id: string;
  name: string;
  type: string;
  traits: string[];
  state: Record<string, any>;
  recent_memory: string[];
  archival_memory: string;
}

const db = new Dexie('KirinByteDB') as Dexie & {
  entities: EntityTable<Entity, 'id'>;
};

db.version(1).stores({
  entities: 'id, name, type, *traits'
});

export { db };