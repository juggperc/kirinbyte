import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Settings, Play, Database, BrainCircuit } from 'lucide-react';

import { db, type Entity } from './db';
import { useStore } from './store';
import { executeTick } from './engine';

import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Textarea } from './components/ui/textarea';
import { Card, CardHeader, CardTitle, CardContent } from './components/ui/card';
import { Badge } from './components/ui/badge';
import { Separator } from './components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './components/ui/dialog';

const SEED_ENTITIES: Entity[] = [
  {
    id: 'e1',
    name: 'Wei Chen',
    type: 'Person',
    traits: ['Tech CEO', 'Beijing', 'Aggressive', 'Visionary'],
    state: { wealth: 50000000, alignment: 'Chaotic Neutral', company_status: 'Growing' },
    recent_memory: ['Launched new AI product', 'Secured Series B funding'],
    archival_memory: 'Founded a successful AI startup in Beijing.'
  },
  {
    id: 'e2',
    name: 'CryptoWhale99',
    type: 'Person',
    traits: ['Crypto Trader', 'Anonymous', 'Risk-taker'],
    state: { wealth: 100000000, alignment: 'True Neutral', portfolio_risk: 'High' },
    recent_memory: ['Bought the dip on Bitcoin', 'Lost 2M on a meme coin'],
    archival_memory: 'Made a fortune in the 2021 crypto bull run.'
  },
  {
    id: 'e3',
    name: 'Global Bank Corp',
    type: 'Organization',
    traits: ['Financial Institution', 'Conservative', 'Regulated'],
    state: { assets: 500000000000, alignment: 'Lawful Evil', public_trust: 'Low' },
    recent_memory: ['Lobbied against crypto regulations', 'Fined for compliance failure'],
    archival_memory: 'A century-old banking institution slowly adapting to the digital age.'
  },
  {
    id: 'e4',
    name: 'Sarah Jenkins',
    type: 'Person',
    traits: ['Aussie Day Trader', 'Sydney', 'Optimistic'],
    state: { wealth: 250000, alignment: 'Neutral Good', stress_level: 'Medium' },
    recent_memory: ['Took a break from trading', 'Reading about macroeconomics'],
    archival_memory: 'Quit corporate job to trade full-time from Sydney.'
  },
  {
    id: 'e5',
    name: 'TechRegulator Bot',
    type: 'AI',
    traits: ['Government Tool', 'Strict', 'Efficient'],
    state: { processing_power: 'High', alignment: 'Lawful Neutral', targets: ['CryptoWhale99'] },
    recent_memory: ['Flagged suspicious transactions', 'Updated compliance rules'],
    archival_memory: 'Created to monitor and regulate emerging tech markets.'
  },
  {
    id: 'e6',
    name: 'Neon DAO',
    type: 'Organization',
    traits: ['Decentralized', 'Innovative', 'Unpredictable'],
    state: { treasury: 5000000, alignment: 'Chaotic Good', member_count: 1500 },
    recent_memory: ['Voted to fund a public goods project', 'Debating new governance token'],
    archival_memory: 'A fast-growing DAO focused on funding open-source tech.'
  },
  {
    id: 'e7',
    name: 'Elena Rostova',
    type: 'Person',
    traits: ['Venture Capitalist', 'London', 'Calculated'],
    state: { wealth: 15000000, alignment: 'Lawful Neutral', risk_appetite: 'Low' },
    recent_memory: ['Met with Wei Chen', 'Reviewing portfolio performance'],
    archival_memory: 'Former investment banker turned cautious VC.'
  },
  {
    id: 'e8',
    name: 'Quantum Systems Inc',
    type: 'Organization',
    traits: ['Research Lab', 'Secretive', 'Cutting-edge'],
    state: { breakthrough_progress: '80%', alignment: 'True Neutral', funding: 'Secure' },
    recent_memory: ['Achieved quantum supremacy in testing', 'Hired top physicists'],
    archival_memory: 'A stealth startup working on next-gen quantum computing.'
  },
  {
    id: 'e9',
    name: 'Marcus Thorne',
    type: 'Person',
    traits: ['Cybersecurity Expert', 'San Francisco', 'Paranoid'],
    state: { wealth: 800000, alignment: 'Chaotic Good', threat_level: 'High' },
    recent_memory: ['Discovered a zero-day exploit', 'Secured personal servers'],
    archival_memory: 'A renowned hacker turned security consultant.'
  },
  {
    id: 'e10',
    name: 'Project Cassandra',
    type: 'AI',
    traits: ['Predictive Model', 'Ominous', 'Accurate'],
    state: { accuracy_rate: '95%', alignment: 'True Neutral', current_prediction: 'Market Crash' },
    recent_memory: ['Analyzed global financial data', 'Predicted a regulatory crackdown'],
    archival_memory: 'An advanced AI designed to predict global socio-economic shifts.'
  }
];

export default function App() {
  const { 
    apiKey, setApiKey, 
    modelId, setModelId, 
    tick, 
    worldContext, setWorldContext, 
    globalEvent, setGlobalEvent 
  } = useStore();

  const entities = useLiveQuery(() => db.entities.toArray(), []) || [];
  
  const [isExecuting, setIsExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSeed = async () => {
    try {
      await db.entities.clear();
      await db.entities.bulkAdd(SEED_ENTITIES);
    } catch (err: any) {
      console.error(err);
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
            disabled={isExecuting || !apiKey || !globalEvent.trim()}
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

          <div className="mt-auto pt-6 border-t border-slate-800">
            <Button onClick={handleSeed} variant="secondary" className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700">
              <Database className="w-4 h-4 mr-2" />
              Seed World Data
            </Button>
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
                <Database className="w-8 h-8 opacity-50" />
                <p>No entities found. Click "Seed World Data" to begin.</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
