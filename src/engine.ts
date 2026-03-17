import { db } from './db';
import { useStore } from './store';

interface ModelPrediction {
  globalSummary: string;
  entities: {
    id: string;
    newState: Record<string, any>;
    newRelationships: { targetId: string; nature: string; strength: number }[];
    newMemoryEvent: string;
    compressedArchive?: string;
  }[];
}

interface SeedingPrediction {
  entities: {
    id: string;
    name: string;
    type: string;
    traits: string[];
    state: Record<string, any>;
    relationships: { targetId: string; nature: string; strength: number }[];
    recent_memory: string[];
    archival_memory: string;
  }[];
}

export async function seedWorldByAI() {
  const state = useStore.getState();
  const { apiKey, modelId, worldContext, setEngineStatus } = state;

  if (!apiKey) throw new Error('OpenRouter API key is required to seed the world.');

  setEngineStatus('Constructing sociological baseline...');

  const systemMessage = `You are an omniscient simulation architect designing a deep, interconnected societal model based on the provided World Context. 
Generate exactly 10 unique, rich, and diverse entities (people, corporations, AIs, DAOs, or ideological factions).
Crucially, they must be inter-connected. Define their 'relationships' matrix targeting the 'id' of other entities in the array (e.g., e1 might secretly fund e3, or e4 is politically opposed to e2).

You MUST return ONLY raw JSON representing an object with an "entities" array. 
Schema: { "entities": [ { "id": "string (e1 through e10)", "name": "string", "type": "string", "traits": ["string"], "state": { "wealth_or_power": 0, "alignment": "string", "hidden_motive": "string" }, "relationships": [ { "targetId": "string (e.g. e2)", "nature": "string", "strength": 0-100 } ], "recent_memory": ["string"], "archival_memory": "string" } ] }. 
Ensure the JSON is valid and clean.`;

  const userMessage = `World Context: ${worldContext}`;

  setEngineStatus('Awaiting LLM world generation...');
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: modelId,
      messages: [
        { role: 'system', content: systemMessage },
        { role: 'user', content: userMessage }
      ],
      response_format: { type: 'json_object' }
    })
  });

  if (!response.ok) {
    const errorBody = await response.text();
    setEngineStatus('');
    throw new Error(`API Error (${response.status}): ${errorBody}`);
  }

  setEngineStatus('Parsing omniscient matrix...');
  const data = await response.json();
  let prediction: SeedingPrediction;
  
  try {
    const rawContent = data.choices[0].message.content.trim();
    const startIndex = rawContent.indexOf('{');
    const endIndex = rawContent.lastIndexOf('}');
    
    if (startIndex === -1 || endIndex === -1) {
      throw new Error(`Could not find JSON object in response. Raw response: ${rawContent}`);
    }
    
    const jsonString = rawContent.slice(startIndex, endIndex + 1);
    prediction = JSON.parse(jsonString);
  } catch (err: any) {
    setEngineStatus('');
    throw new Error(`Failed to parse AI seeding response as JSON. Error: ${err.message || err}. Raw content: ${data.choices?.[0]?.message?.content}`);
  }

  if (!prediction || !prediction.entities || prediction.entities.length === 0) {
    setEngineStatus('');
    throw new Error(`Invalid JSON schema returned by model during seeding. Parsed object: ${JSON.stringify(prediction)}`);
  }

  setEngineStatus('Patching societal database...');
  await db.entities.clear();
  await db.entities.bulkAdd(prediction.entities);
  state.clearTickSummaries();
  setEngineStatus('');
}

export async function executeTick() {
  const state = useStore.getState();
  const { apiKey, modelId, worldContext, globalEvent, setEngineStatus } = state;

  if (!apiKey) {
    throw new Error('OpenRouter API key is required.');
  }
  if (!globalEvent.trim()) {
    throw new Error('Please enter a global event.');
  }

  setEngineStatus('Calculating Semantic Wake-up...');
  // 1. Wake-up Phase: Semantic Wake-up (keyword match on traits/recent_memory)
  const allEntities = await db.entities.toArray();
  const eventWords = globalEvent.toLowerCase().split(/\s+/).filter(w => w.length > 2);

  const scoredEntities = allEntities.map(entity => {
    let score = 0;
    const searchString = [
      ...entity.traits,
      ...entity.recent_memory,
      entity.name,
      entity.type
    ].join(' ').toLowerCase();

    for (const word of eventWords) {
      if (searchString.includes(word)) score += 1;
    }
    return { entity, score };
  });

  scoredEntities.sort((a, b) => b.score - a.score);
  const activeEntities = scoredEntities.slice(0, 5).map(e => e.entity);

  if (activeEntities.length === 0) {
    setEngineStatus('');
    throw new Error('No entities populated. Please seed the world first.');
  }

  setEngineStatus('Prompting deterministic physics engine...');
  // 2. Prompt Construction (Societal Depth)
  const systemMessage = `You are the underlying physics and sociology engine for a deep simulation (akin to MiroFish or OASIS). 
You receive the World Context, the Current Event, and the state of Active Entities. Predict exactly how the event changes their state, memetic alignment, and relational power dynamics in profound, interconnected ways (consider ripple effects, hidden motives, and structural changes). 

Provide a high-level \`globalSummary\` describing the narrative aftermath of this event on these entities.
Update their \`newRelationships\` array if alliances shift, hostilities break out, or dependencies form with other entities. Keep the strength 0-100.
If an entity has 5 items in their recent_memory, compress them into a single summary sentence for their archival_memory and clear the recent array. 

Return ONLY raw JSON matching this schema: { "globalSummary": "A vivid 2-3 sentence narrative of the consequences.", "entities": [ { "id": "string", "newState": {}, "newRelationships": [ { "targetId": "string", "nature": "string", "strength": 0 } ], "newMemoryEvent": "string", "compressedArchive": "optional string" } ] }. Do not wrap with \`\`\`json.`;

  const userMessage = `
World Context: ${worldContext}
Current Event: ${globalEvent}

Active Entities:
${JSON.stringify(activeEntities, null, 2)}
  `;

  setEngineStatus('Awaiting LLM Inference...');
  // 3. Execution
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: modelId,
      messages: [
        { role: 'system', content: systemMessage },
        { role: 'user', content: userMessage }
      ],
      response_format: { type: 'json_object' }
    })
  });

  if (!response.ok) {
    const errorBody = await response.text();
    setEngineStatus('');
    throw new Error(`API Error (${response.status}): ${errorBody}`);
  }

  setEngineStatus('Parsing dimensional shift...');
  const data = await response.json();
  let prediction: ModelPrediction;
  
  try {
    const rawContent = data.choices[0].message.content.trim();
    const startIndex = rawContent.indexOf('{');
    const endIndex = rawContent.lastIndexOf('}');
    
    if (startIndex === -1 || endIndex === -1) {
      throw new Error(`Could not find JSON object in response. Raw response: ${rawContent}`);
    }
    
    const jsonString = rawContent.slice(startIndex, endIndex + 1);
    prediction = JSON.parse(jsonString);
  } catch (err: any) {
    setEngineStatus('');
    throw new Error(`Failed to parse model response as JSON. Error: ${err.message || err}. Raw content: ${data.choices?.[0]?.message?.content}`);
  }

  if (!prediction || !prediction.entities) {
    setEngineStatus('');
    throw new Error(`Invalid JSON schema returned by model. Parsed object: ${JSON.stringify(prediction)}`);
  }

  setEngineStatus('Applying timeline patches...');
  // 4. Patching
  await db.transaction('rw', db.entities, async () => {
    for (const update of prediction.entities) {
      const entity = activeEntities.find(e => e.id === update.id);
      if (!entity) continue;

      let newRecentMemory = [...entity.recent_memory, update.newMemoryEvent].filter(Boolean);
      let newArchivalMemory = entity.archival_memory;

      if (update.compressedArchive) {
        newArchivalMemory = newArchivalMemory 
          ? `${newArchivalMemory} ${update.compressedArchive}`
          : update.compressedArchive;
        newRecentMemory = []; // Cleared due to compression
      }

      await db.entities.update(update.id, {
        state: update.newState,
        relationships: update.newRelationships || entity.relationships || [],
        recent_memory: newRecentMemory,
        archival_memory: newArchivalMemory
      });
    }
  });

  if (prediction.globalSummary) {
    state.addTickSummary(`[Tick ${state.tick + 1}] ${prediction.globalSummary}`);
  }

  state.incrementTick();
  setEngineStatus('');
}