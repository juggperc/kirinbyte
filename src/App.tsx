import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Settings, Play, Database, BrainCircuit, Sparkles, ScrollText, RotateCcw, History } from 'lucide-react';

import { db } from './db';
import { useStore } from './store';
import { executeTick, seedWorldByAI } from './engine';

import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Textarea } from './components/ui/textarea';
import { Card, CardHeader, CardTitle, CardContent } from './components/ui/card';
import { Badge } from './components/ui/badge';
import { Separator } from './components/ui/separator';
import { ScrollArea } from './components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './components/ui/dialog';

export default function App() {
  const { 
    apiKey, setApiKey, 
    modelId, setModelId, 
    tick, tickSummaries,
    worldContext, setWorldContext, 
    globalEvent, setGlobalEvent,
    resetSimulation
  } = useStore();

  const entities = useLiveQuery(() => db.entities.toArray(), []) || [];
  const simulations = useLiveQuery(() => db.simulations.orderBy('timestamp').reverse().toArray(), []) || [];
  
  const [isExecuting, setIsExecuting] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSeed = async () => {
    setIsSeeding(true);
    setError(null);
    try {
      await seedWorldByAI();
    } catch (err: any) {
      setError(err.message || 'An error occurred during seeding.');
    } finally {
      setIsSeeding(false);
    }
  };

  const handleExecute = async () => {
    setIsExecuting(true);
    setError(null);
    try {
      await executeTick();
      setGlobalEvent(''); // Clear on success
    } catch (err: any) {
      setError(err.message || 'An error occurred during execution.');
    } finally {
      setIsExecuting(false);
    }
  };

  const handleNewSimulation = async () => {
    if (tick > 0 || entities.length > 0) {
      try {
        await db.simulations.add({
          id: crypto.randomUUID(),
          timestamp: Date.now(),
          worldContext,
          finalTick: tick,
          summaries: [...tickSummaries],
          finalEntities: JSON.stringify(entities)
        });
      } catch (err) {
        console.error("Failed to save simulation history:", err);
      }
    }
    
    await db.entities.clear();
    resetSimulation();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 flex flex-col font-sans dark">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BrainCircuit className="text-indigo-400 w-6 h-6" />
          <h1 className="text-xl font-bold tracking-tight">KirinByte</h1>
          <Badge variant="outline" className="ml-2 bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-800 cursor-default">
            Tick: {tick}
          </Badge>
        </div>
        
        <div className="flex items-center gap-3">
          <Dialog>
            <DialogTrigger render={<Button variant="outline" size="sm" className="bg-slate-800 border-slate-700 hover:bg-slate-700 hover:text-white text-slate-300" />}>
              <History className="w-4 h-4 mr-2" />
              History
            </DialogTrigger>
            <DialogContent className="bg-slate-900 border-slate-800 text-slate-50 sm:max-w-[700px] h-[80vh] flex flex-col">
              <DialogHeader>
                <DialogTitle className="text-slate-100 flex items-center gap-2">
                  <History className="w-5 h-5 text-indigo-400" /> Past Simulations
                </DialogTitle>
              </DialogHeader>
              <ScrollArea className="flex-1 mt-4 rounded-md border border-slate-800 bg-slate-950 p-4">
                {simulations.length === 0 ? (
                  <p className="text-slate-500 text-center italic mt-10">No past simulations found.</p>
                ) : (
                  <div className="space-y-6">
                    {simulations.map(sim => (
                      <div key={sim.id} className="p-4 bg-slate-900 rounded-md border border-slate-800 shadow-sm flex flex-col gap-2">
                        <div className="flex justify-between items-start">
                          <h3 className="text-sm font-semibold text-slate-200">
                            {new Date(sim.timestamp).toLocaleString()}
                          </h3>
                          <Badge variant="secondary" className="bg-slate-800">
                            {sim.finalTick} Ticks
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-400 italic">"{sim.worldContext}"</p>
                        {sim.summaries.length > 0 && (
                          <div className="mt-2 pl-3 border-l-2 border-slate-800">
                            <p className="text-xs text-slate-300 line-clamp-3">
                              {sim.summaries[0]}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </DialogContent>
          </Dialog>

          <Dialog>
            <DialogTrigger render={<Button variant="outline" size="sm" className="bg-slate-800 border-slate-700 hover:bg-slate-700 hover:text-white text-slate-300" />}>
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </DialogTrigger>
            <DialogContent className="bg-slate-900 border-slate-800 text-slate-50 sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle className="text-slate-100">Simulation Settings</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">OpenRouter API Key</label>
                  <Input 
                    type="password" 
                    value={apiKey} 
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="sk-or-v1-..."
                    className="bg-slate-950 border-slate-800 text-slate-200"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Model ID</label>
                  <Input 
                    type="text" 
                    value={modelId} 
                    onChange={(e) => setModelId(e.target.value)}
                    placeholder="deepseek/deepseek-chat"
                    className="bg-slate-950 border-slate-800 text-slate-200"
                  />
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Controller */}
        <aside className="w-80 border-r border-slate-800 bg-slate-900/50 p-6 flex flex-col gap-6 overflow-y-auto">
          <div>
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">World Context</h2>
            <Textarea 
              value={worldContext}
              onChange={(e) => setWorldContext(e.target.value)}
              placeholder="Describe the current state of the world..."
              className="bg-slate-950 border-slate-800 min-h-[120px] resize-none focus-visible:ring-indigo-500 text-slate-300 placeholder:text-slate-600"
            />
          </div>

          <div>
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Next Global Event</h2>
            <Textarea 
              value={globalEvent}
              onChange={(e) => setGlobalEvent(e.target.value)}
              placeholder="e.g. China bans a major crypto exchange"
              className="bg-slate-950 border-slate-800 min-h-[80px] resize-none focus-visible:ring-indigo-500 text-slate-300 placeholder:text-slate-600"
            />
          </div>

          <Button 
            onClick={handleExecute} 
            disabled={isExecuting || isSeeding || !apiKey || !globalEvent.trim() || entities.length === 0}
            className="w-full h-14 text-lg font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-900/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isExecuting ? (
              <span className="animate-pulse flex items-center gap-2">Processing...</span>
            ) : (
              <span className="flex items-center gap-2"><Play className="w-5 h-5 fill-current" /> Execute Tick</span>
            )}
          </Button>

          {error && (
            <div className="p-3 rounded-md bg-red-950/50 border border-red-900/50 text-red-400 text-sm break-words">
              {error}
            </div>
          )}

          <div className="mt-auto pt-6 flex flex-col gap-4 border-t border-slate-800">
            {tickSummaries.length > 0 && (
              <Dialog>
                <DialogTrigger render={<Button variant="outline" className="w-full bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700" />}>
                  <ScrollText className="w-4 h-4 mr-2 text-indigo-400" />
                  View Simulation Logs
                </DialogTrigger>
                <DialogContent className="bg-slate-900 border-slate-800 text-slate-50 sm:max-w-[600px] h-[80vh] flex flex-col">
                  <DialogHeader>
                    <DialogTitle className="text-slate-100 flex items-center gap-2">
                      <ScrollText className="w-5 h-5 text-indigo-400" /> Global Event Summaries
                    </DialogTitle>
                  </DialogHeader>
                  <ScrollArea className="flex-1 mt-4 rounded-md border border-slate-800 bg-slate-950 p-4">
                    <div className="space-y-4">
                      {tickSummaries.map((summary, idx) => (
                        <div key={idx} className="p-3 bg-slate-900 rounded-md border border-slate-800">
                          <p className="text-sm text-slate-300 leading-relaxed">{summary}</p>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </DialogContent>
              </Dialog>
            )}

            <div className="flex gap-2">
              <Button 
                onClick={handleSeed} 
                disabled={isSeeding || isExecuting || !apiKey}
                variant="secondary" 
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 disabled:opacity-50"
              >
                {isSeeding ? (
                  <span className="animate-pulse"><Sparkles className="w-4 h-4" /></span>
                ) : (
                  <span className="flex items-center gap-2"><Database className="w-4 h-4" /> Seed</span>
                )}
              </Button>
              <Button 
                onClick={handleNewSimulation} 
                disabled={isSeeding || isExecuting}
                variant="destructive" 
                className="flex-[0.5] bg-red-950 hover:bg-red-900 text-red-300 border border-red-900/50 disabled:opacity-50"
                title="Reset World State"
              >
                <RotateCcw className="w-4 h-4" /> Reset
              </Button>
            </div>
          </div>
        </aside>

        {/* Main Content Grid */}
        <main className="flex-1 p-6 overflow-y-auto bg-slate-950">
          <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-6">
            {entities.map(entity => (
              <Card key={entity.id} className="bg-slate-900 border-slate-800 flex flex-col shadow-xl">
                <CardHeader className="pb-3 border-b border-slate-800/50">
                  <div className="flex justify-between items-start mb-2">
                    <CardTitle className="text-lg text-slate-100 font-bold">{entity.name}</CardTitle>
                    <Badge variant="secondary" className="bg-slate-800 text-slate-300 hover:bg-slate-700">{entity.type}</Badge>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {entity.traits.map(t => (
                      <Badge key={t} variant="outline" className="border-slate-700 text-slate-400 text-xs px-1.5 py-0">
                        {t}
                      </Badge>
                    ))}
                  </div>
                </CardHeader>
                <CardContent className="pt-4 flex-1 flex flex-col gap-4">
                  {/* State Viewer */}
                  <div className="bg-slate-950 rounded-md p-3 border border-slate-800 font-mono text-xs text-indigo-300 overflow-x-auto">
                    <pre>{JSON.stringify(entity.state, null, 2)}</pre>
                  </div>

                  <Separator className="bg-slate-800" />

                  {/* Memory Sections */}
                  <div className="flex-1 flex flex-col gap-3 text-sm">
                    <div>
                      <h4 className="text-xs font-semibold text-slate-500 uppercase mb-1.5">Recent Memory ({entity.recent_memory.length}/5)</h4>
                      {entity.recent_memory.length > 0 ? (
                        <ul className="list-disc list-inside space-y-1 text-slate-300">
                          {entity.recent_memory.map((mem, i) => (
                            <li key={i} className="truncate" title={mem}>{mem}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-slate-600 italic text-xs">No recent memories.</p>
                      )}
                    </div>
                    
                    <div>
                      <h4 className="text-xs font-semibold text-slate-500 uppercase mb-1">Archival Memory</h4>
                      <p className="text-slate-400 text-xs leading-relaxed italic border-l-2 border-slate-800 pl-3">
                        {entity.archival_memory || "No archives available."}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {entities.length === 0 && (
              <div className="col-span-full flex flex-col items-center justify-center h-64 text-slate-500 gap-3 border-2 border-dashed border-slate-800 rounded-xl">
                {isSeeding ? (
                  <>
                    <Sparkles className="w-8 h-8 opacity-50 animate-pulse text-indigo-400" />
                    <p className="animate-pulse">LLM is weaving the world fabric...</p>
                  </>
                ) : (
                  <>
                    <Database className="w-8 h-8 opacity-50" />
                    <p>No entities found. Click "Seed" to dynamically generate the world.</p>
                  </>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
