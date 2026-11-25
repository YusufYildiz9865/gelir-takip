// Gider kayıtları
// GET /api/expenses · POST /api/expenses · PUT /api/expenses · DELETE /api/expenses?id=...
import { crudHandler } from './_crud.js';

export default crudHandler({ table: 'giderler', withCategory: true });
