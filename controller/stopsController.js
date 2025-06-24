import { db } from '../config/db.js';
                                                             
export const getStops = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM stops');
    res.json(rows);

  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch stops' });
  }
};
