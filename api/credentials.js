import { query, signToken, requireUser, body, handle, HttpError } from './_lib.js';

// POST /api/credentials  { currentPassword, newUsername, newPassword }  ->  { token, username }
export default handle(async (req, res) => {
  if (req.method !== 'POST') throw new HttpError(405, 'Yalnızca POST');
  const user = requireUser(req);
  const { currentPassword, newUsername, newPassword } = body(req);
  const nu = String(newUsername || '').trim();
  const np = String(newPassword || '');
  if (!nu || np.length < 4) throw new HttpError(400, 'Kullanıcı adı boş olamaz, şifre en az 4 karakter olmalı.');
  const rows = await query(
    'UPDATE kullanicilar SET username = $3, password = $4 WHERE username = $1 AND password = $2 RETURNING username',
    [user, String(currentPassword || ''), nu, np]
  );
  if (!rows.length) throw new HttpError(400, 'Mevcut şifre yanlış.');
  res.status(200).json({ token: signToken(rows[0].username), username: rows[0].username });
});
