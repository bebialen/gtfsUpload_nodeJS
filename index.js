import express from 'express';
import gtfsRoutes from './routes/routes.js';
// import gtfsRoutes from './../gtfs_feature_backend/routes/routes.js';
// import { db } from './../config/db.js';
// const cors    =  require('cors');        // ← import cors
import cors from 'cors';
const app = express();
app.use(express.json()); // Parse JSON bodies
app.use(cors());
app.use(gtfsRoutes);
app.get('/ping', async (req, res) => {
  const [rows] = await db.query('SELECT 1');
  res.json({ message: 'DB Connected', rows });
});

app.listen(3000, () => {
  console.log('🚀 Server running at http://localhost:3000');
});


