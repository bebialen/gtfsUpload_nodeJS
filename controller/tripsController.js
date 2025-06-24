import { db } from '../config/db.js';
export const getTrips = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT t.*, r.route_short_name
      FROM trips t
      JOIN routes r ON t.route_id = r.route_id
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch trips' });
  }
};
