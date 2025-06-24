import { db } from './../config/db.js';

export const getRoutes = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM routes');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch routes' });
  }
};


export const getStopsByRoute = async (req, res) => {
  const { route_id } = req.params;

  try {
    const [stops] = await db.query(`
      SELECT DISTINCT s.stop_id, s.stop_name, s.stop_lat, s.stop_lon, st.stop_sequence
      FROM trips t
      JOIN stop_times st ON t.trip_id = st.trip_id
      JOIN stops s ON st.stop_id = s.stop_id
      WHERE t.route_id = ?
      ORDER BY st.stop_sequence ASC
    `, [route_id]);

    if (stops.length === 0) {
      return res.status(404).json({ message: 'No stops found for this route' });
    }

    res.json({ route_id, stops });
  } catch (err) {
    console.error('Error fetching stops by route:', err);
    res.status(500).json({ error: 'Failed to fetch stops for this route' });
  }
};


export const getTripsByRoute = async (req, res) => {
  const { route_id } = req.params;

  try {
    // Step 1: Get all trips for the given route
    const [trips] = await db.query(`
      SELECT trip_id, service_id, trip_headsign, direction_id, shape_id
      FROM trips
      WHERE route_id = ?
    `, [route_id]);

    if (trips.length === 0) {
      return res.status(404).json({ message: 'No trips found for this route' });
    }

    // Step 2: Fetch and attach stops to each trip
    for (const trip of trips) {
      const [stops] = await db.query(`
        SELECT
          s.stop_id,
          s.stop_name,
          s.stop_lat,
          s.stop_lon,
          st.arrival_time,
          st.departure_time,
          st.stop_sequence
        FROM stop_times st
        JOIN stops s ON st.stop_id = s.stop_id
        WHERE st.trip_id = ?
        ORDER BY st.stop_sequence ASC
      `, [trip.trip_id]);

      trip.stops = stops; // attach stops array to trip
    }

    // Return final structured response
    res.json({ route_id, trips });

  } catch (err) {
    console.error('Error fetching trips with stops:', err);
    res.status(500).json({ error: 'Failed to fetch trips with stops for this route' });
  }
};


