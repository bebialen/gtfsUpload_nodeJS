



app.get('/ping', async (req, res) => {
  const [rows] = await db.query('SELECT 1');
  res.json({ message: 'DB Connected', rows });
});

export default router;