// Gelir ve gider tabloları için ortak listeleme / ekleme / güncelleme / silme.
import { query, requireUser, body, handle, HttpError } from './_lib.js';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const EXPENSE_CATEGORIES = ['kira', 'fatura', 'maas', 'malzeme', 'ikram', 'bakim', 'vergi', 'reklam', 'diger'];

// table: 'gelirler' | 'giderler'
// withCategory: giderlerde kategori sütunu var
export function crudHandler({ table, withCategory = false }) {
  const COLUMNS = `id::text AS id, business, to_char(entry_date, 'YYYY-MM-DD') AS date,
    amount::text AS amount, payment_method AS payment, coalesce(note, '') AS note,
    ${withCategory ? 'category,' : ''}
    floor(extract(epoch FROM created_at) * 1000)::text AS created_at`;

  const toRecord = (r) => ({
    id: r.id,
    business: r.business,
    date: r.date,
    amount: parseFloat(r.amount),
    payment: r.payment,
    note: r.note || '',
    ...(withCategory ? { category: r.category || 'diger' } : {}),
    createdAt: Number(r.created_at),
  });

  function validate(b) {
    const business = String(b.business || '');
    const date = String(b.date || '');
    const amount = Number(b.amount);
    const payment = String(b.payment || 'nakit');
    const note = String(b.note || '').trim().slice(0, 500);
    const category = String(b.category || 'diger');
    if (!['studio', 'salon'].includes(business)) throw new HttpError(400, 'Geçersiz iş yeri.');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new HttpError(400, 'Geçersiz tarih.');
    if (!Number.isFinite(amount) || amount <= 0 || amount > 1e10) throw new HttpError(400, 'Geçersiz tutar.');
    if (!['nakit', 'kart', 'havale'].includes(payment)) throw new HttpError(400, 'Geçersiz ödeme türü.');
    if (withCategory && !EXPENSE_CATEGORIES.includes(category)) throw new HttpError(400, 'Geçersiz gider türü.');
    return { business, date, amount: amount.toFixed(2), payment, note, category };
  }

  return handle(async (req, res) => {
    requireUser(req);

    if (req.method === 'GET') {
      const rows = await query(`SELECT ${COLUMNS} FROM ${table} ORDER BY entry_date DESC, created_at DESC`);
      return res.status(200).json(rows.map(toRecord));
    }

    if (req.method === 'POST') {
      const r = validate(body(req));
      const rows = withCategory
        ? await query(
            `INSERT INTO ${table} (business, entry_date, amount, payment_method, note, category)
             VALUES ($1, $2::date, $3::numeric, $4, NULLIF($5, ''), $6) RETURNING ${COLUMNS}`,
            [r.business, r.date, r.amount, r.payment, r.note, r.category]
          )
        : await query(
            `INSERT INTO ${table} (business, entry_date, amount, payment_method, note)
             VALUES ($1, $2::date, $3::numeric, $4, NULLIF($5, '')) RETURNING ${COLUMNS}`,
            [r.business, r.date, r.amount, r.payment, r.note]
          );
      return res.status(200).json(toRecord(rows[0]));
    }

    if (req.method === 'PUT') {
      const b = body(req);
      if (!UUID.test(String(b.id || ''))) throw new HttpError(400, 'Geçersiz kayıt.');
      const r = validate(b);
      const rows = withCategory
        ? await query(
            `UPDATE ${table} SET business = $2, entry_date = $3::date, amount = $4::numeric,
               payment_method = $5, note = NULLIF($6, ''), category = $7
             WHERE id = $1::uuid RETURNING ${COLUMNS}`,
            [b.id, r.business, r.date, r.amount, r.payment, r.note, r.category]
          )
        : await query(
            `UPDATE ${table} SET business = $2, entry_date = $3::date, amount = $4::numeric,
               payment_method = $5, note = NULLIF($6, '')
             WHERE id = $1::uuid RETURNING ${COLUMNS}`,
            [b.id, r.business, r.date, r.amount, r.payment, r.note]
          );
      if (!rows.length) throw new HttpError(404, 'Kayıt bulunamadı (silinmiş olabilir).');
      return res.status(200).json(toRecord(rows[0]));
    }

    if (req.method === 'DELETE') {
      const id = String((req.query && req.query.id) || '');
      if (!UUID.test(id)) throw new HttpError(400, 'Geçersiz kayıt.');
      await query(`DELETE FROM ${table} WHERE id = $1::uuid`, [id]);
      return res.status(200).json({ ok: true });
    }

    throw new HttpError(405, 'Desteklenmeyen istek');
  });
}
