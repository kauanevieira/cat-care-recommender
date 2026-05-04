import { useState } from 'react';
import CatForm from './pages/CatForm.jsx';
import Dashboard from './pages/Dashboard.jsx';
import { createCat, getRecommendations } from './api.js';
import { Cat, ShoppingCart, Search, Heart, User, X, Sparkles } from 'lucide-react';

function getCategoryEmoji(category) {
  const map = {
    racao: '🥣', alimento: '🥣', alimentacao: '🥣',
    brinquedo: '🧶', brinquedos: '🧶',
    acessorio: '🎀', acessorios: '🎀',
    higiene: '🧼',
    saude: '💊', medicamento: '💊',
    cama: '🛏️', conforto: '🛏️',
    areia: '🪣', sanitario: '🪣',
  };
  const lower = (category || '').toLowerCase();
  for (const [key, val] of Object.entries(map)) {
    if (lower.includes(key)) return val;
  }
  return '🐱';
}

export default function App() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);

  // Form state lifted here so values persist when layout switches
  const [formValues, setFormValues] = useState({
    idade: '3',
    peso: '4.5',
    castrado: true,
    ambiente: 'apartamento',
    atividade: 'medio',
  });

  async function handleSubmit(payload) {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const cat = await createCat(payload);
      const rec = await getRecommendations(cat.id);
      setResult(rec);
      setTimeout(() => {
        document.getElementById('results')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (e) {
      setError(e.message || String(e));
    } finally {
      setLoading(false);
    }
  }

  function handleAddToCart(product) {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.id === product.id ? { ...item, qty: item.qty + 1 } : item
        );
      }
      return [...prev, { ...product, qty: 1 }];
    });
  }

  const cartCount = cart.reduce((sum, item) => sum + item.qty, 0);
  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Topbar */}
      <div className="bg-orange-500 text-white text-xs text-center py-2 font-medium tracking-wide">
        🐱 Frete grátis em compras acima de R$&nbsp;99 · Recomendações 100% personalizadas por IA
      </div>

      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl flex items-center justify-center shadow-sm">
                <Cat className="h-5 w-5 text-white" />
              </div>
              <div className="leading-none">
                <span className="text-lg font-bold text-gray-900">PetCare</span>
                <span className="text-lg font-bold text-orange-500">AI</span>
              </div>
            </div>

            {/* Nav links */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#" className="text-sm font-medium text-gray-600 hover:text-orange-500 transition-colors">Início</a>
              <a href="#" className="text-sm font-medium text-gray-600 hover:text-orange-500 transition-colors">Produtos</a>
              <a href="#" className="text-sm font-medium text-gray-600 hover:text-orange-500 transition-colors">Marcas</a>
              <a href="#" className="text-sm font-medium text-gray-600 hover:text-orange-500 transition-colors">Sobre</a>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1">
              <button className="p-2 text-gray-500 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-colors" aria-label="Buscar">
                <Search className="h-5 w-5" />
              </button>
              <button className="p-2 text-gray-500 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-colors" aria-label="Favoritos">
                <Heart className="h-5 w-5" />
              </button>
              <button
                onClick={() => setCartOpen(true)}
                className="relative p-2 text-gray-500 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-colors"
                aria-label="Carrinho"
              >
                <ShoppingCart className="h-5 w-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-orange-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center leading-none">
                    {cartCount}
                  </span>
                )}
              </button>
              <button className="hidden sm:flex items-center gap-1.5 ml-2 px-4 py-2 bg-orange-500 text-white text-sm font-semibold rounded-xl hover:bg-orange-600 transition-colors shadow-sm">
                <User className="h-4 w-4" />
                Entrar
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Cart Sidebar */}
      {cartOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div
            className="flex-1 bg-black/50 backdrop-blur-sm"
            onClick={() => setCartOpen(false)}
          />
          <div className="w-full max-w-sm bg-white shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-orange-500" />
                <h2 className="text-base font-bold text-gray-900">
                  Carrinho{' '}
                  {cartCount > 0 && (
                    <span className="text-orange-500">({cartCount})</span>
                  )}
                </h2>
              </div>
              <button
                onClick={() => setCartOpen(false)}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {cart.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                  <div className="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <ShoppingCart className="h-8 w-8 text-orange-300" />
                  </div>
                  <p className="font-medium text-gray-500">Carrinho vazio</p>
                  <p className="text-sm mt-1">Gere recomendações e adicione produtos!</p>
                </div>
              ) : (
                cart.map(item => (
                  <div key={item.id} className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-orange-100 to-amber-100 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
                      {getCategoryEmoji(item.category)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{item.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{item.qty}x · R$&nbsp;{Number(item.price).toFixed(2)}</p>
                    </div>
                    <p className="text-sm font-bold text-orange-500 flex-shrink-0">
                      R$&nbsp;{(item.price * item.qty).toFixed(2)}
                    </p>
                  </div>
                ))
              )}
            </div>

            {cart.length > 0 && (
              <div className="p-4 border-t border-gray-100 bg-gray-50 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Subtotal</span>
                  <span className="font-bold text-lg text-gray-900">R$&nbsp;{cartTotal.toFixed(2)}</span>
                </div>
                <button className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3.5 rounded-xl transition-colors shadow-sm text-sm">
                  Finalizar Compra →
                </button>
                <button
                  onClick={() => setCartOpen(false)}
                  className="w-full text-gray-500 hover:text-gray-700 text-sm font-medium py-2 transition-colors"
                >
                  Continuar comprando
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Hero Banner */}
      {!result && (
        <div className="relative overflow-hidden bg-gradient-to-r from-orange-500 via-orange-500 to-amber-400">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-4 left-10 text-8xl">🐾</div>
            <div className="absolute bottom-4 right-16 text-7xl">🐱</div>
            <div className="absolute top-8 right-1/3 text-5xl">✨</div>
          </div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-1.5 text-sm font-semibold text-white mb-5 border border-white/20">
                <Sparkles className="h-4 w-4" />
                Powered by IA · Rede Neural + ChromaDB
              </div>
              <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4 leading-tight">
                Produtos perfeitos<br />para o seu gato 🐱
              </h1>
              <p className="text-lg text-orange-100 mb-8 leading-relaxed">
                Nossa IA analisa o perfil do seu felino e seleciona os melhores produtos personalizados.
                Sem achismos — só ciência e dados.
              </p>
              <div className="flex flex-wrap gap-3">
                <a
                  href="#form"
                  className="bg-white text-orange-500 font-bold px-6 py-3 rounded-xl hover:bg-orange-50 transition-colors shadow-md"
                >
                  Começar agora →
                </a>
                <a
                  href="#"
                  className="border-2 border-white/40 text-white font-semibold px-6 py-3 rounded-xl hover:bg-white/10 transition-colors"
                >
                  Como funciona
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Breadcrumb when showing results */}
      {result && (
        <div className="bg-white border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <a href="#" className="hover:text-orange-500 transition-colors">Início</a>
              <span>›</span>
              <a href="#" className="hover:text-orange-500 transition-colors">Recomendações</a>
              <span>›</span>
              <span className="text-gray-900 font-medium">Gato #{result.gato_id}</span>
            </div>
          </div>
        </div>
      )}

      {/* Main */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10">
        {!result ? (
          <div id="form" className="flex flex-col items-center gap-8">
            {/* Feature pills */}
            <div className="flex flex-wrap justify-center gap-3 text-sm">
              {[
                { icon: '🧠', text: 'Rede Neural Personalizada' },
                { icon: '🔍', text: 'Busca Vetorial ChromaDB' },
                { icon: '💡', text: 'Explicabilidade com Motivos' },
                { icon: '⚡', text: 'Resultados em segundos' },
              ].map(({ icon, text }) => (
                <div key={text} className="flex items-center gap-2 bg-white border border-gray-200 rounded-full px-4 py-2 shadow-sm text-gray-700 font-medium">
                  <span>{icon}</span> {text}
                </div>
              ))}
            </div>
            <div className="w-full max-w-md">
              <CatForm
                onSubmit={handleSubmit}
                loading={loading}
                error={error}
                hasResult={false}
                values={formValues}
                onChange={setFormValues}
              />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-8 items-start">
            <div className="lg:sticky lg:top-24">
              <CatForm
                onSubmit={handleSubmit}
                loading={loading}
                error={error}
                hasResult={true}
                values={formValues}
                onChange={setFormValues}
              />
            </div>
            <div id="results">
              <Dashboard result={result} onAddToCart={handleAddToCart} />
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-orange-600 rounded-lg flex items-center justify-center">
                  <Cat className="h-4 w-4 text-white" />
                </div>
                <span className="text-white font-bold text-lg">PetCareAI</span>
              </div>
              <p className="text-sm text-gray-500 max-w-xs leading-relaxed">
                Plataforma de recomendação inteligente para produtos felinos, usando rede neural e busca vetorial (ChromaDB).
              </p>
              <div className="flex gap-3 mt-4">
                {['🐾', '📦', '💬'].map((icon, i) => (
                  <button key={i} className="w-9 h-9 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-orange-500 transition-colors text-base">
                    {icon}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-3 text-sm uppercase tracking-wide">Navegação</h4>
              <ul className="space-y-2 text-sm">
                {['Início', 'Produtos', 'Marcas', 'Sobre'].map(link => (
                  <li key={link}>
                    <a href="#" className="hover:text-orange-400 transition-colors">{link}</a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-3 text-sm uppercase tracking-wide">Suporte</h4>
              <ul className="space-y-2 text-sm">
                {['FAQ', 'Contato', 'Trocas e Devoluções', 'Política de Privacidade'].map(link => (
                  <li key={link}>
                    <a href="#" className="hover:text-orange-400 transition-colors">{link}</a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-600">
            <p>© 2026 PetCareAI — Simulação de e-commerce com IA. Todos os direitos reservados.</p>
            <p className="flex items-center gap-1">
              Feito com <span className="text-orange-500">♥</span> e Inteligência Artificial
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
