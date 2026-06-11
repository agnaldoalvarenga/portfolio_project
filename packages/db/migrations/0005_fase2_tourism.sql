CREATE EXTENSION IF NOT EXISTS vector;

-- helper: is the current user staff/admin?
CREATE OR REPLACE FUNCTION is_staff()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role IN ('staff','admin'));
$$;

CREATE TABLE IF NOT EXISTS tourism_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source text NOT NULL,
  region text NOT NULL,
  period text NOT NULL,
  metric text NOT NULL,
  value  numeric(18,4) NOT NULL,
  unit   text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT tourism_data_uniq UNIQUE (source, region, period, metric)
);
ALTER TABLE tourism_data ENABLE ROW LEVEL SECURITY;
CREATE POLICY tourism_data_staff_read ON tourism_data FOR SELECT USING (is_staff());

CREATE TABLE IF NOT EXISTS tourism_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source text NOT NULL,
  region text NOT NULL,
  content text NOT NULL,
  embedding vector(1024) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT tourism_documents_uniq UNIQUE (source, region, content)
);
ALTER TABLE tourism_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY tourism_documents_staff_read ON tourism_documents FOR SELECT USING (is_staff());

-- Approximate nearest-neighbour index for cosine distance retrieval.
CREATE INDEX IF NOT EXISTS tourism_documents_embedding_idx
  ON tourism_documents USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
