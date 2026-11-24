import { query, signToken, body, handle, HttpError, sleep } from './_lib.js';

// POST /api/login  { username, password }  ->  { token, username }
export default handle(async (req, res) => {
  if (req.method !== 'POST') throw new HttpError(405, 'Yalnızca POST');
  const { username, password } = body(req);
  if (!username || !password) throw new HttpError(400, 'Kullanıcı adı ve şifre gerekli.');
  const rows = await query(
    'SELECT username FROM kullanicilar WHERE username = $1 AND password = $2',
    [String(username).trim(), String(password)]
  );
  if (!rows.length) {
    await sleep(600); // tahmin denemelerini yavaşlat
    throw new HttpError(401, 'Kullanıcı adı veya şifre yanlış.');
  }
  res.status(200).json({ token: signToken(rows[0].username), username: rows[0].username });
});
