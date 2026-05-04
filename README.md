# Sistema de recomendação de cuidados para gatos

Backend **Node.js (Express)** com **TensorFlow.js (tfjs-node)**, **ChromaDB** para armazenar e consultar vetores de produtos, e frontend **React (Vite)**.

A pasta `parte05-ecommerce-recomendations-with-tensorflow/` é apenas material de referência (não faz parte do build).

## Pré-requisitos

- Node.js 18+
- Docker (para o ChromaDB)

## 1. Subir o ChromaDB

```bash
docker compose up -d
```

O serviço fica em `http://localhost:8000` (padrão do `backend/src/config.js` via `CHROMA_URL`).

## 2. Backend — instalar, treinar e rodar

```bash
cd backend
npm install
npm run seed
```

O `seed` lê `data/cats.csv` e `data/products.json`, gera compras simuladas, grava os vetores no ChromaDB, treina a rede (mesma arquitetura do exemplo de e-commerce) e salva o modelo em `backend/models/recommender/` e o contexto em `backend/models/context.json`.

Iniciar a API (porta **4000**):

```bash
npm run dev
```

### Endpoints

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/health` | Health check |
| `POST` | `/cats` | Corpo: `idade`, `peso`, `castrado`, `ambiente`, `atividade` |
| `GET` | `/cats/:id` | Perfil do gato |
| `GET` | `/recommendations/:id` | Produtos (ranking ML + Chroma) + cuidados com motivo |
| `POST` | `/admin/retrain` | Roda o seed de novo (Chroma + treino) |

## 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Abre em `http://localhost:5173` com **proxy** para a API em `localhost:4000`.  
Para apontar outra URL da API, crie `frontend/.env` com:

```env
VITE_API_URL=http://localhost:4000
```

## 4. Testes (backend)

```bash
cd backend
npm test
```

## Fluxo

1. **Treino:** vetores de produto são calculados e upsert no ChromaDB; o modelo aprende pares (vetor gato, vetor produto) com rótulo de “comprou / não comprou” (dados simulados no seed).  
2. **Predição:** o perfil vira um vetor no mesmo espaço que o produto; o Chroma devolve os N vizinhos; a rede reordena por score; as **regras** acrescentam dicas com **motivo**.

## Dados

- `backend/data/products.json` — catálogo curado (substituível/amplável).  
- `backend/data/cats.csv` — perfis tipo Kaggle para seed (colunas: `idade`, `peso`, `castrado`, `ambiente`, `atividade`).

## Produção

- Rodar ChromaDB persistido (volume já definido no `docker-compose.yml`).  
- Definir `CHROMA_URL`, `PORT`, `MODEL_DIR` conforme o ambiente.  
- Servir o build do frontend (`npm run build` em `frontend/`) atrás de um reverse proxy com CORS se API e UI estiverem em origens diferentes.
