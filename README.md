# Cat Care Recommender

Sistema de recomendação de cuidados e produtos para gatos, combinando uma **rede neural (TensorFlow.js)** com **busca vetorial (ChromaDB)** para gerar sugestões personalizadas com base no perfil do animal.

---

## Visao Geral

O sistema recebe o perfil de um gato (idade, peso, se e castrado, ambiente e nivel de atividade) e retorna:

- **Produtos recomendados** — ranqueados pela rede neural treinada sobre dados simulados de compra.
- **Dicas de cuidado** — geradas por um sistema de regras com motivos explicados.

### Tecnologias

| Camada | Tecnologia |
|--------|-----------|
| Backend | Node.js 18+ · Express |
| Machine Learning | TensorFlow.js (`tfjs-node`) |
| Busca vetorial | ChromaDB (via Docker) |
| Frontend | React + Vite |
| Testes | Vitest |

---

## Arquitetura

```
cats.csv + products.json
          |
       seed.js  ← rode uma vez antes de iniciar a API
          |
     encoder.js  ← converte perfis em vetores numericos
          |
  ┌───────┴───────┐
  |               |
trainer.js    ChromaDB
(TensorFlow)  (vetores dos produtos)
  |               |
model.json    busca por vizinhanca
weights.bin       |
  |               |
  └───────┬───────┘
          |
       API Express (porta 4000)
          |
    Frontend React (porta 5173)
```

**Fluxo de recomendacao:**

1. O frontend envia o perfil do gato para `POST /cats`.
2. A API converte o perfil em vetor e consulta o ChromaDB pelos 50 produtos mais proximos.
3. A rede neural pontua cada produto (score de 0 a 1) e retorna os top 10.
4. O sistema de regras (`rules.js`) acrescenta dicas de cuidado com motivo.
5. O resultado e devolvido ao frontend.

---

## Pre-requisitos

- [Node.js 18+](https://nodejs.org/)
- [Docker](https://www.docker.com/) (para o ChromaDB)

---

## Instalacao e Execucao

### 1. Subir o ChromaDB

```bash
docker compose up -d
```

O servico fica disponivel em `http://localhost:8000`.

### 2. Backend

```bash
cd backend
npm install
```

Treinar o modelo e popular o ChromaDB (necessario apenas uma vez):

```bash
npm run seed
```

O seed le `data/cats.csv` e `data/products.json`, simula historico de compras, treina a rede neural e salva os artefatos em `backend/models/`.

Iniciar a API em modo de desenvolvimento (porta **4000**):

```bash
npm run dev
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Acesse em `http://localhost:5173`. O Vite ja tem proxy configurado para `localhost:4000`.

---

## Endpoints da API

| Metodo | Rota | Descricao |
|--------|------|-----------|
| `GET` | `/health` | Health check |
| `POST` | `/cats` | Cadastra gato. Corpo: `{ idade, peso, castrado, ambiente, atividade }` |
| `GET` | `/cats/:id` | Retorna perfil do gato |
| `GET` | `/recommendations/:id` | Recomendacoes de produtos + dicas de cuidado |
| `POST` | `/admin/retrain` | Re-executa o seed (ChromaDB + treino) |

---

## Estrutura do Projeto

```
cat-care-recommender/
├── docker-compose.yml
├── backend/
│   ├── data/
│   │   ├── cats.csv          ← perfis de gatos para treino
│   │   └── products.json     ← catalogo de produtos
│   ├── models/
│   │   ├── recommender/
│   │   │   ├── model.json    ← arquitetura da rede neural
│   │   │   └── weights.bin   ← pesos aprendidos
│   │   └── context.json      ← normalizacao (min/max das features)
│   └── src/
│       ├── index.js          ← entrada do servidor
│       ├── config.js         ← variaveis de ambiente
│       ├── routes/           ← definicao das rotas
│       ├── services/
│       │   ├── encoder.js    ← converte perfis em vetores
│       │   ├── trainer.js    ← treina a rede neural
│       │   └── rules.js      ← regras de cuidado
│       ├── store/            ← estado em memoria dos gatos
│       └── seed/
│           └── seed.js       ← script de treino inicial
└── frontend/
    └── src/
        └── pages/
            └── CatForm.jsx
```

---

## Testes

```bash
cd backend
npm test
```

---

## Variaveis de Ambiente

### Backend (`backend/.env`)

| Variavel | Padrao | Descricao |
|----------|--------|-----------|
| `PORT` | `4000` | Porta da API |
| `CHROMA_URL` | `http://localhost:8000` | URL do ChromaDB |
| `MODEL_DIR` | `./models/recommender` | Diretorio do modelo salvo |

### Frontend (`frontend/.env`)

| Variavel | Padrao | Descricao |
|----------|--------|-----------|
| `VITE_API_URL` | `http://localhost:4000` | URL da API |

---

## Dados

- **`backend/data/cats.csv`** — perfis de gatos no estilo Kaggle (`idade`, `peso`, `castrado`, `ambiente`, `atividade`). Usados apenas no seed.
- **`backend/data/products.json`** — catalogo curado de produtos. Substituivel ou expansivel sem precisar retreinar.

---

## Notas de Producao

- O volume do ChromaDB ja esta definido no `docker-compose.yml` para persistencia.
- Configure `CHROMA_URL`, `PORT` e `MODEL_DIR` conforme o ambiente de deploy.
- Gere o build do frontend com `npm run build` em `frontend/` e sirva os arquivos estaticos por um reverse proxy.
- Configure CORS no backend se API e frontend estiverem em origens diferentes.
