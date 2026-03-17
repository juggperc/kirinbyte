import { db } from './db';
import { useStore } from './store';

interface ModelPrediction {
  entities: {
    id: string;
    newState: Record<string, any>;
    newMemoryEvent: string;
    compressedArchive?: string;
  }[];
}

export async function executeTick() {
  const state = useStore.getState();
  const { apiKey, modelId, worldContext, globalEvent } = state;

  if (!apiKey) {
    throw new Error('OpenRouter API key is required.');
  }
  if (!globalEvent.trim()) {
    throw new Error('Please enter a global event.');
  }

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
    throw new Error('No entities populated. Please seed the world first.');
  }

  // 2. Prompt Construction
  const systemMessage = `You are an omniscient deterministic physics engine for a text simulation. You receive the World Context, the Current Event, and the state of Active Entities. Predict exactly how the event changes their state. If an entity has 5 items in their recent_memory, compress them into a single summary sentence for their archival_memory and clear the recent array. Return ONLY raw JSON matching this schema: { "entities": [ { "id": "string", "newState": {}, "newMemoryEvent": "string", "compressedArchive": "optional string" } ] }. Do not wrap with \`\`\`json.`;

  const userMessage = `
World Context: ${worldContext}
Current Event: ${globalEvent}

Active Entities:
${JSON.stringify(activeEntities, null, 2)}
  `;

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
    throw new Error(`API Error (${response.status}): ${errorBody}`);
  }

  const data = await response.json();
  let prediction: ModelPrediction;
  
  try {
    const rawContent = data.choices[0].message.content.trim();
    // Remove markdown blocks if they slipped through
    const cleanedContent = rawContent.replace(/^```json\n/, '').replace(/\n```$/, '');
    prediction = JSON.parse(cleanedContent);
  } catch (err) {
    throw new Error('Failed to parse model response as JSON. Content was: ' + data.choices?.[0]?.message?.content);
  }

  if (!prediction || !prediction.entities) {
    throw new Error('Invalid JSON schema returned by model.');
  }

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
        recent_memory: newRecentMemory,
        archival_memory: newArchivalMemory
      });
    }
  });

  state.incrementTick();
}