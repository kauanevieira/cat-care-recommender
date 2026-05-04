import { useState } from 'react';
import CatForm from './pages/CatForm.jsx';
import Dashboard from './pages/Dashboard.jsx';
import { createCat, getRecommendations } from './api.js';
import { Cat } from 'lucide-react';

export default function App() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  async function handleSubmit(payload) {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const cat = await createCat(payload);
      const rec = await getRecommendations(cat.id);
      setResult(rec);
    } catch (e) {
      setError(e.message || String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <header className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-xl bg-primary/10">
            <Cat className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Sistema de Recomendação para Gatos
          </h1>
        </div>
        <p className="text-muted-foreground ml-[52px]">
          Produtos ranqueados por rede neural + busca vetorial (ChromaDB) e dicas com motivo.
        </p>
      </header>

      <CatForm onSubmit={handleSubmit} loading={loading} error={error} />
      <Dashboard result={result} />
    </div>
  );
}
