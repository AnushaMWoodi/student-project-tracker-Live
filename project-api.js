import express from 'express';

const statuses = new Set(['Planned', 'In Progress', 'Completed']);

function validateProject(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { error: 'Provide a project name and status.' };
  }

  const name = typeof body.name === 'string' ? body.name.trim() : '';
  if (name.length < 1 || name.length > 80) {
    return { error: 'Project name must be between 1 and 80 characters.' };
  }

  if (!statuses.has(body.status)) {
    return { error: 'Choose a valid project status.' };
  }

  return { project: { name, status: body.status } };
}

export function createApp(db) {
  const router = express.Router();

  router.use(express.json({ limit: '10kb' }));

  router.get('/api/health', (req, res) => {
    res.json({ ok: true });
  });

  router.get('/api/projects', async (req, res) => {
    res.json(await db.list());
  });

  router.post('/api/projects', async (req, res) => {
    const result = validateProject(req.body);
    if (result.error) {
      return res.status(400).json({ error: result.error });
    }

    res.status(201).json(await db.create(result.project));
  });

  router.put('/api/projects/:id', async (req, res) => {
    const result = validateProject(req.body);
    if (result.error) {
      return res.status(400).json({ error: result.error });
    }

    const project = await db.update(req.params.id, result.project);
    if (!project) {
      return res.status(404).json({ error: 'Project not found.' });
    }

    res.json(project);
  });

  router.delete('/api/projects/:id', async (req, res) => {
    const removed = await db.remove(req.params.id);
    if (!removed) {
      return res.status(404).json({ error: 'Project not found.' });
    }

    res.json({ deleted: true });
  });

  return router;
}
