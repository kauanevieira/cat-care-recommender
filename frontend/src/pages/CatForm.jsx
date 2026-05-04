import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Sparkles } from 'lucide-react';

export default function CatForm({ onSubmit, loading, error }) {
  const [castrado, setCastrado] = useState(true);
  const [ambiente, setAmbiente] = useState('apartamento');
  const [atividade, setAtividade] = useState('medio');

  function handleSubmit(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    onSubmit({
      idade: Number(fd.get('idade')),
      peso: Number(fd.get('peso')),
      castrado,
      ambiente,
      atividade,
    });
  }

  return (
    <Card className="max-w-md shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl">Cadastro do Gato</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="idade">Idade (anos)</Label>
              <Input
                id="idade"
                name="idade"
                type="number"
                step="0.1"
                min="0"
                max="30"
                defaultValue="3"
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="peso">Peso (kg)</Label>
              <Input
                id="peso"
                name="peso"
                type="number"
                step="0.1"
                min="0.3"
                max="25"
                defaultValue="4.5"
                required
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ambiente">Ambiente</Label>
            <Select value={ambiente} onValueChange={setAmbiente}>
              <SelectTrigger id="ambiente">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="apartamento">Apartamento</SelectItem>
                <SelectItem value="casa">Casa</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="atividade">Nível de atividade</Label>
            <Select value={atividade} onValueChange={setAtividade}>
              <SelectTrigger id="atividade">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="baixo">Baixo</SelectItem>
                <SelectItem value="medio">Médio</SelectItem>
                <SelectItem value="alto">Alto</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="castrado"
              checked={castrado}
              onCheckedChange={setCastrado}
            />
            <Label htmlFor="castrado" className="cursor-pointer">
              Castrado
            </Label>
          </div>

          {error && (
            <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
              {String(error)}
            </p>
          )}

          <Button type="submit" disabled={loading} className="mt-1 w-full gap-2">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Gerando…
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Gerar Recomendação
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
