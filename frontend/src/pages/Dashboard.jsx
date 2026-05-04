import { useState } from 'react';
import { AlertTriangle, ShoppingBag, HeartPulse, ShoppingCart, Star, Heart, Check, Zap } from 'lucide-react';

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

function getCategoryGradient(category) {
  const lower = (category || '').toLowerCase();
  if (lower.includes('racao') || lower.includes('aliment')) return 'from-orange-100 to-amber-100';
  if (lower.includes('brinquedo')) return 'from-purple-100 to-pink-100';
  if (lower.includes('acessorio')) return 'from-blue-100 to-sky-100';
  if (lower.includes('higiene')) return 'from-teal-100 to-cyan-100';
  if (lower.includes('saude') || lower.includes('medicamento')) return 'from-rose-100 to-red-100';
  if (lower.includes('cama') || lower.includes('conforto')) return 'from-green-100 to-emerald-100';
  return 'from-gray-100 to-slate-100';
}

function StarRating({ score }) {
  const stars = Math.round((score ?? 0) * 5);
  const pct = ((score ?? 0) * 100).toFixed(0);
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i}
          className={`h-3 w-3 ${i <= stars ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'}`}
        />
      ))}
      <span className="text-xs text-gray-500 ml-0.5">{pct}%</span>
    </div>
  );
}

const CARE_CONFIG = {
  alimentacao: {
    emoji: '🥣',
    label: 'Alimentação',
    gradient: 'from-orange-50 to-amber-50',
    border: 'border-orange-200',
    badge: 'bg-orange-100 text-orange-700',
    dot: 'bg-orange-400',
  },
  atividade: {
    emoji: '🏃',
    label: 'Atividade',
    gradient: 'from-blue-50 to-sky-50',
    border: 'border-blue-200',
    badge: 'bg-blue-100 text-blue-700',
    dot: 'bg-blue-400',
  },
  ambiente: {
    emoji: '🏡',
    label: 'Ambiente',
    gradient: 'from-green-50 to-emerald-50',
    border: 'border-green-200',
    badge: 'bg-green-100 text-green-700',
    dot: 'bg-green-400',
  },
  saude: {
    emoji: '💊',
    label: 'Saúde',
    gradient: 'from-rose-50 to-pink-50',
    border: 'border-rose-200',
    badge: 'bg-rose-100 text-rose-700',
    dot: 'bg-rose-400',
  },
};

export default function Dashboard({ result, onAddToCart }) {
  const [addedIds, setAddedIds] = useState(new Set());
  const [wishlist, setWishlist] = useState(new Set());

  if (!result) return null;

  const { gato_id, produtos = [], cuidados = {}, aviso } = result;

  function handleAdd(product) {
    onAddToCart(product);
    setAddedIds(prev => new Set([...prev, product.id]));
    setTimeout(() => {
      setAddedIds(prev => {
        const next = new Set(prev);
        next.delete(product.id);
        return next;
      });
    }, 2000);
  }

  function toggleWishlist(id) {
    setWishlist(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  return (
    <div className="space-y-8">
      {/* Section header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 bg-green-50 text-green-700 text-xs font-bold px-2.5 py-1 rounded-full border border-green-200">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              IA Ativa
            </span>
          </div>
          <h2 className="text-2xl font-extrabold text-gray-900">
            Recomendações para o Gato&nbsp;
            <span className="text-orange-500">#{gato_id}</span>
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            {produtos.length} produtos selecionados com base no perfil do seu felino
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500 bg-white border border-gray-200 rounded-xl px-3 py-2">
          <Zap className="h-4 w-4 text-orange-500" />
          Ordenado por score da IA
        </div>
      </div>

      {/* Warning */}
      {aviso && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3.5">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
          <p className="text-sm text-amber-800">{aviso}</p>
        </div>
      )}

      {/* Products section */}
      <section>
        <div className="flex items-center gap-2 mb-5">
          <ShoppingBag className="h-5 w-5 text-orange-500" />
          <h3 className="text-lg font-bold text-gray-900">Produtos Recomendados</h3>
          <span className="bg-orange-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
            {produtos.length}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {produtos.map((p, idx) => {
            const isAdded = addedIds.has(p.id);
            const isWishlisted = wishlist.has(p.id);
            const discountPct = idx % 3 === 0 ? 15 : idx % 3 === 1 ? null : 10;
            const originalPrice = discountPct ? p.price / (1 - discountPct / 100) : null;
            const isTopPick = idx === 0;
            const gradient = getCategoryGradient(p.category);

            return (
              <div
                key={p.id}
                className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-lg hover:border-orange-200 transition-all duration-200 group flex flex-col"
              >
                {/* Product image area */}
                <div className={`relative h-44 bg-gradient-to-br ${gradient} flex items-center justify-center`}>
                  <span className="text-6xl drop-shadow-sm group-hover:scale-110 transition-transform duration-200">
                    {getCategoryEmoji(p.category)}
                  </span>

                  {/* Badges */}
                  <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                    {isTopPick && (
                      <span className="bg-orange-500 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-sm">
                        ⭐ Top IA
                      </span>
                    )}
                    {discountPct && (
                      <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-sm">
                        -{discountPct}%
                      </span>
                    )}
                  </div>

                  {/* Wishlist */}
                  <button
                    onClick={() => toggleWishlist(p.id)}
                    className="absolute top-3 right-3 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full shadow-md flex items-center justify-center transition-all hover:scale-110 active:scale-95"
                    aria-label="Favoritar"
                  >
                    <Heart
                      className={`h-4 w-4 transition-colors ${
                        isWishlisted ? 'text-red-500 fill-red-500' : 'text-gray-400'
                      }`}
                    />
                  </button>
                </div>

                {/* Product info */}
                <div className="p-4 flex flex-col flex-1">
                  <div className="mb-2">
                    <span className="text-xs font-bold text-orange-500 uppercase tracking-wider">
                      {p.category}
                    </span>
                    <h4 className="text-sm font-bold text-gray-900 mt-0.5 leading-snug line-clamp-2">
                      {p.name}
                    </h4>
                  </div>

                  <StarRating score={p.score} />

                  {/* Price */}
                  <div className="mt-3 flex items-end gap-2">
                    <span className="text-2xl font-extrabold text-gray-900">
                      R$&nbsp;{Number(p.price).toFixed(2)}
                    </span>
                    {originalPrice && (
                      <span className="text-sm text-gray-400 line-through mb-0.5">
                        R$&nbsp;{originalPrice.toFixed(2)}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    ou 3x de R$&nbsp;{(p.price / 3).toFixed(2)} sem juros
                  </p>

                  {/* Free shipping tag */}
                  <div className="mt-2 inline-flex items-center gap-1 text-xs text-green-600 font-semibold">
                    <span>✓</span> Frete grátis
                  </div>

                  {/* Add to cart button */}
                  <button
                    onClick={() => handleAdd(p)}
                    className={`mt-4 w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all active:scale-[0.98] ${
                      isAdded
                        ? 'bg-green-500 text-white shadow-sm'
                        : 'bg-orange-500 hover:bg-orange-600 text-white shadow-sm hover:shadow-md'
                    }`}
                  >
                    {isAdded ? (
                      <>
                        <Check className="h-4 w-4" />
                        Adicionado!
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="h-4 w-4" />
                        Adicionar ao Carrinho
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Care tips section */}
      <section>
        <div className="flex items-center gap-2 mb-5">
          <HeartPulse className="h-5 w-5 text-rose-500" />
          <h3 className="text-lg font-bold text-gray-900">Cuidados Personalizados</h3>
          <span className="text-xs text-gray-400 font-medium bg-gray-100 px-2 py-0.5 rounded-full">
            com explicabilidade da IA
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {['alimentacao', 'atividade', 'ambiente', 'saude'].map(key => {
            const block = cuidados[key];
            if (!block) return null;
            const cfg = CARE_CONFIG[key];

            return (
              <div
                key={key}
                className={`bg-gradient-to-br ${cfg.gradient} rounded-2xl border ${cfg.border} p-5`}
              >
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-2xl">{cfg.emoji}</span>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${cfg.badge}`}>
                    {cfg.label}
                  </span>
                </div>
                <p className="font-bold text-sm text-gray-900 mb-2 leading-snug">
                  {block.recomendacao}
                </p>
                <div className="bg-white/70 backdrop-blur-sm rounded-xl px-3 py-2.5 border border-white/80">
                  <p className="text-xs text-gray-600 leading-relaxed">
                    <span className="font-bold text-gray-800">Por que? </span>
                    {block.motivo}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
