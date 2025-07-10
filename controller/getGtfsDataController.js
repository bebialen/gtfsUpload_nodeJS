import { db } from '../config/db.js';

export const getGtfsDataController = async (req, res) => {
    
  const { limit } = req.query;

  const tables = [
    'agency',
    'calendar',
    'routes',
    'trips',
    'stops',
    'fare_attributes',
    'fare_rules',
    'frequencies',
    'stop_times'
  ];

  const safeLimit = Math.min(parseInt(limit, 10) || 100, 10000); // max 10,000 rows

  const results = {};
  const errors = [];

  for (const table of tables) {
    try {
      const [rows] = await db.query(`SELECT * FROM \`${table}\` LIMIT ?`, [safeLimit]);
      results[table] = rows;
    } catch (err) {
      console.error(`Error fetching table ${table}:`, err);
      errors.push({ table, message: err.message });
    }
  }

  res.json({
    logcode: 6000,
    message: 'GTFS data fetched successfully',
    limit: safeLimit,
    data: results,
    errors: errors.length ? errors : undefined,
  });
};
