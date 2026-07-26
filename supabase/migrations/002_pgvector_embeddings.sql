-- pgvector extension + embedding tables (run when PostgreSQL has pgvector installed)
-- docker: use pgvector/pgvector image or CREATE EXTENSION vector;

CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS listing_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  embedding vector(1536),
  is_demo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS listing_embeddings_vector_idx
  ON listing_embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 50);

CREATE TABLE IF NOT EXISTS affiliate_referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_code VARCHAR(32) NOT NULL,
  agent_name VARCHAR(255),
  visitor_id VARCHAR(128),
  user_id UUID REFERENCES users(id),
  event VARCHAR(32) NOT NULL,
  metadata JSONB,
  is_demo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS affiliate_referrals_code_idx ON affiliate_referrals(affiliate_code);
