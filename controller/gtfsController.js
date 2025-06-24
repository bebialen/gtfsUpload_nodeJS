import unzipper from 'unzipper';
import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import { db } from '../config/db.js';

const extractPath = 'uploads/extracted';


function findCSVFile(dir, filename) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const found = findCSVFile(fullPath, filename);
      if (found) return found;
    } else if (entry.name.toLowerCase() === `${filename}.csv`) {
      return fullPath;
    }
  }
  return null;
}

export const uploadGTFS = async (req, res) => {
  const zipPath = req.file?.path;

  if (!zipPath) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  try {
    if (!fs.existsSync(zipPath)) {
      return res.status(400).json({ error: 'Uploaded file does not exist' });
    }

    // Clean or recreate extraction folder
    if (fs.existsSync(extractPath)) {
      fs.rmSync(extractPath, { recursive: true, force: true });
    }
    fs.mkdirSync(extractPath, { recursive: true });

    // 🧨 Handle invalid/corrupted ZIP
    try {
      await fs.createReadStream(zipPath)
        .pipe(unzipper.Extract({ path: extractPath }))
        .promise();
    } catch (zipErr) {
      return res.status(400).json({ error: 'Invalid or corrupted ZIP file' });
    }

    const tables = [
      'agency',
      'calendar',
      'routes',
      'trips',
      'stop_times',
      'stops',
      'fare_attributes',
      'fare_rules',
      'frequencies'
    ];

    const errors = [];
    let totalInserted = 0;

    for (const table of tables) {
      const filePath = findCSVFile(extractPath, table);
      if (!filePath) {
        errors.push(`${table}.csv not found`);
        continue;
      }

      const rows = [];

      try {
        await new Promise((resolve, reject) => {
          fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (row) => rows.push(row))
            .on('end', resolve)
            .on('error', reject);
        });
      } catch (csvErr) {
        errors.push(`${table}.csv is not a valid CSV or has bad encoding`);
        continue;
      }

      if (rows.length === 0) {
        errors.push(`${table}.csv is empty`);
        continue;
      }

      try {
        const [columns] = await db.query(`SHOW COLUMNS FROM ${table}`);
        const dbColumns = columns.map(col => col.Field);

        const keys = Object.keys(rows[0]);
        const filteredKeys = keys.filter(k => dbColumns.includes(k));
        const placeholders = filteredKeys.map(() => '?').join(', ');
        const insertQuery = `INSERT IGNORE INTO ${table} (${filteredKeys.join(', ')}) VALUES (${placeholders})`;

        for (const row of rows) {
          if (table === 'calendar') {
            const fixDate = (d) => {
              const date = new Date(d);
              return !isNaN(date) ? date.toISOString().slice(0, 10) : d;
            };
            if (row.start_date) row.start_date = fixDate(row.start_date);
            if (row.end_date) row.end_date = fixDate(row.end_date);
          }

          try {
            await db.query(insertQuery, filteredKeys.map(k => row[k]));
            totalInserted++;
          } catch (dbErr) {
            errors.push(`DB insert error in ${table}: ${dbErr.message}`);
          }
        }
      } catch (err) {
        errors.push(`Failed to process ${table}: ${err.message}`);
      }
    }

    res.json({
      message: 'GTFS data upload completed',
      totalInserted,
      warnings: errors.length ? errors : undefined
    });
  } catch (err) {
    console.error('Unexpected error:', err);
    res.status(500).json({ error: 'Unexpected server error during GTFS upload' });
  }
};
