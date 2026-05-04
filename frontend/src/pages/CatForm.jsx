import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Sparkles, Cat, RefreshCw } from 'lucide-react';

const ACTIVITY_OPTIONS = [
  { value: 'baixo', label: 'Baixo', emoji: '😴', description: 'Preguiçoso' },
  { value: 'medio', label: 'Médio', emoji: '🐱', description: 'Equilibrado' },
  { value: 'alto', label: 'Alto', emoji: '⚡', description: 'Agitado' },
];

export default function CatForm({ onSubmit, loading, error, hasResult, values, onChange }) {
  function set(field, val) {
    onChange(prev => ({ ...prev, [field]: val }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    onSubmit({
      idade: Number(values.idade),
      peso: Number(values.peso),
      castrado: values.castrado,
      ambiente: values.ambiente,
      atividade: values.atividade,
    });
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-amber-400 px-5 py-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/30">
            <Cat className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-white font-bold text-base">Perfil do seu Gato</h2>
            <p className="text-orange-100 text-xs mt-0.5">Personalize as recomendações da IA</p>
          </div>
        </div>
      </div>

      {/* Form body */}
      <form onSubmit={handleSubmit} className="p-5 space-y-5">
        {/* Idade e Peso */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Dados Básicos</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="idade" className="text-sm font-medium text-gray-700">Idade</Label>
              <div className="relative">
                <Input
                  id="idade"
                  name="idade"
                  type="number"
                  step="0.1"
                  min="0"
                  max="30"
                  value={values.idade}
                  onChange={e => set('idade', e.target.value)}
                  required
                  className="pr-10 bg-gray-50 border-gray-200 focus:bg-white focus:border-orange-400 focus:ring-orange-400/20"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">anos</span>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="peso" className="text-sm font-medium text-gray-700">Peso</Label>
              <div className="relative">
                <Input
                  id="peso"
                  name="peso"
                  type="number"
                  step="0.1"
                  min="0.3"
                  max="25"
                  value={values.peso}
                  onChange={e => set('peso', e.target.value)}
                  required
                  className="pr-8 bg-gray-50 border-gray-200 focus:bg-white focus:border-orange-400 focus:ring-orange-400/20"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">kg</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-dashed border-gray-100" />

        {/* Ambiente */}
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Ambiente</p>
          <Select value={values.ambiente} onValueChange={val => set('ambiente', val)}>
            <SelectTrigger className="w-full bg-gray-50 border-gray-200 focus:border-orange-400">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="apartamento">🏢 Apartamento</SelectItem>
              <SelectItem value="casa">🏡 Casa com jardim</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Nível de atividade */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Nível de atividade</p>
          <div className="grid grid-cols-3 gap-2">
            {ACTIVITY_OPTIONS.map(({ value, label, emoji, description }) => (
              <button
                key={value}
                type="button"
                onClick={() => set('atividade', value)}
                className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border-2 text-xs font-semibold transition-all cursor-pointer ${
                  values.atividade === value
                    ? 'border-orange-500 bg-orange-50 text-orange-700 shadow-sm'
                    : 'border-gray-200 bg-gray-50 text-gray-500 hover:border-orange-200 hover:bg-orange-50/30'
                }`}
              >
                <span className="text-xl">{emoji}</span>
                <span>{label}</span>
                <span className={`text-[10px] font-normal ${values.atividade === value ? 'text-orange-500' : 'text-gray-400'}`}>
                  {description}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Castrado toggle */}
        <label
          htmlFor="castrado"
          className={`flex items-center gap-3 rounded-xl px-4 py-3 border-2 cursor-pointer transition-all ${
            values.castrado ? 'bg-orange-50 border-orange-300' : 'bg-gray-50 border-gray-200 hover:border-gray-300'
          }`}
        >
          <Checkbox
            id="castrado"
            checked={values.castrado}
            onCheckedChange={val => set('castrado', val)}
            onClick={e => e.stopPropagation()}
          />
          <div className="flex-1">
            <span className="cursor-pointer font-semibold text-gray-800 text-sm">
              Gato castrado
            </span>
            <p className="text-xs text-gray-400 mt-0.5">Influencia nas recomendações nutricionais</p>
          </div>
          <span className={`text-xl ${values.castrado ? 'opacity-100' : 'opacity-30'}`}>✂️</span>
        </label>

        {/* Error */}
        {error && (
          <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            <span className="text-base flex-shrink-0">⚠️</span>
            <p className="text-sm text-red-700">{String(error)}</p>
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-bold py-3.5 rounded-xl transition-all text-sm shadow-sm hover:shadow-md active:scale-[0.98]"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Analisando perfil…
            </>
          ) : hasResult ? (
            <>
              <RefreshCw className="h-4 w-4" />
              Atualizar Recomendações
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              Ver Recomendações
            </>
          )}
        </button>

        <p className="text-center text-xs text-gray-400">
          🔒 Dados usados apenas para recomendação
        </p>
      </form>
    </div>
  );
}
