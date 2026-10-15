import postgres from 'postgres';

export class DatabaseConfigurationError extends Error {
  constructor() {
    super('DATABASE_URL is not configured for this deployment.');
    this.name = 'DatabaseConfigurationError';
  }
}

let sql;

function getSql() {
  if (sql) return sql;

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new DatabaseConfigurationError();

  sql = postgres(databaseUrl, { prepare: false, max: 1, ssl: 'require', idle_timeout: 20 });
  return sql;
}

export const db = {
  async list() { return getSql()`SELECT id, name, status FROM projects ORDER BY id DESC`; },
  async create({ name, status }) { const [row] = await getSql()`INSERT INTO projects (name, status) VALUES (${name}, ${status}) RETURNING id, name, status`; return row; },
  async update(id, { name, status }) { const [row] = await getSql()`UPDATE projects SET name = ${name}, status = ${status} WHERE id = ${id} RETURNING id, name, status`; return row || null; },
  async remove(id) { const rows = await getSql()`DELETE FROM projects WHERE id = ${id} RETURNING id`; return rows.length > 0; }
};
