// Gelir kayıtları
// GET /api/records · POST /api/records · PUT /api/records · DELETE /api/records?id=...
import { crudHandler } from './_crud.js';

export default crudHandler({ table: 'gelirler' });
