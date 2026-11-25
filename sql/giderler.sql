-- GİDER KAYITLARI (Neon → SQL Editor'da bir kez çalıştırın)
CREATE TABLE IF NOT EXISTS giderler (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business       text NOT NULL CHECK (business IN ('studio', 'salon')),
  entry_date     date NOT NULL DEFAULT CURRENT_DATE,
  amount         numeric(12,2) NOT NULL CHECK (amount > 0),
  category       text NOT NULL DEFAULT 'diger'
                 CHECK (category IN ('kira', 'fatura', 'maas', 'malzeme', 'ikram',
                                     'bakim', 'vergi', 'reklam', 'diger')),
  payment_method text NOT NULL DEFAULT 'nakit'
                 CHECK (payment_method IN ('nakit', 'kart', 'havale')),
  note           text,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS giderler_date_idx ON giderler (entry_date DESC);

DROP TRIGGER IF EXISTS giderler_updated_at ON giderler;
CREATE TRIGGER giderler_updated_at
BEFORE UPDATE ON giderler
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
