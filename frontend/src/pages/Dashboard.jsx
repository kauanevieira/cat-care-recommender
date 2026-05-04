import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, ShoppingBag, HeartPulse } from 'lucide-react';

const CARE_LABELS = {
  alimentacao: 'Alimentação',
  atividade: 'Atividade',
  ambiente: 'Ambiente',
  saude: 'Saúde',
};

const CARE_COLORS = {
  alimentacao: 'bg-orange-50 border-orange-200',
  atividade: 'bg-blue-50 border-blue-200',
  ambiente: 'bg-green-50 border-green-200',
  saude: 'bg-rose-50 border-rose-200',
};

const CARE_BADGE_COLORS = {
  alimentacao: 'bg-orange-100 text-orange-700 border-orange-200',
  atividade: 'bg-blue-100 text-blue-700 border-blue-200',
  ambiente: 'bg-green-100 text-green-700 border-green-200',
  saude: 'bg-rose-100 text-rose-700 border-rose-200',
};

export default function Dashboard({ result }) {
  if (!result) return null;
  const { gato_id, produtos = [], cuidados = {}, aviso } = result;

  return (
    <div className="mt-8 space-y-8">
      <div className="flex items-center gap-2">
        <h2 className="text-2xl font-bold tracking-tight">
          Resultado — gato <span className="text-primary">#{gato_id}</span>
        </h2>
      </div>

      {aviso && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{aviso}</span>
        </div>
      )}

      <section>
        <div className="flex items-center gap-2 mb-4">
          <ShoppingBag className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Produtos Recomendados</h3>
          <Badge variant="secondary">{produtos.length}</Badge>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {produtos.map((p) => (
            <Card key={p.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-base leading-snug">{p.name}</CardTitle>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className="text-xs">
                    {p.category}
                  </Badge>
                  <span className="text-sm font-semibold text-primary">
                    R$ {Number(p.price).toFixed(2)}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Score do modelo</span>
                    <span className="font-medium text-foreground">
                      {((p.score ?? 0) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <Progress
                    value={Math.min(100, (p.score ?? 0) * 100)}
                    className="h-2"
                    indicatorClassName="bg-primary"
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <div className="flex items-center gap-2 mb-4">
          <HeartPulse className="h-5 w-5 text-emerald-600" />
          <h3 className="text-lg font-semibold">Cuidados e Explicabilidade</h3>
        </div>
        <div className="flex flex-col gap-3">
          {['alimentacao', 'atividade', 'ambiente', 'saude'].map((key) => {
            const block = cuidados[key];
            if (!block) return null;
            return (
              <div
                key={key}
                className={`rounded-lg border p-4 ${CARE_COLORS[key]}`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${CARE_BADGE_COLORS[key]}`}
                  >
                    {CARE_LABELS[key]}
                  </span>
                </div>
                <p className="font-semibold text-sm text-foreground mb-1">{block.recomendacao}</p>
                <p className="text-sm text-muted-foreground italic">
                  <span className="font-medium not-italic text-foreground">Motivo: </span>
                  {block.motivo}
                </p>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
