import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import crypto from 'crypto';
import { db } from '../config/db.js';

// export function computeFileHash(filePath) {
//   const fileBuffer = fs.readFileSync(filePath);
//   return crypto.createHash('sha256').update(fileBuffer).digest('hex');
// }

// export function findGTFSFile(dir, filename) {
//   const entries = fs.readdirSync(dir, { withFileTypes: true });
//   for (const entry of entries) {
//     const fullPath = path.join(dir, entry.name);
//     if (entry.isDirectory()) {
//       const found = findGTFSFile(fullPath, filename);
//       if (found) return found;
//     } else {
//       const lowerName = entry.name.toLowerCase();
//       if (lowerName === `${filename}.csv` || lowerName === `${filename}.txt`) {
//         return fullPath;
//       }
//     }
//   }
//   return null;
// }

// export function clearDirectory(dirPath) {
//   if (fs.existsSync(dirPath)) {
//     fs.readdirSync(dirPath).forEach(file => {
//       const fullPath = path.join(dirPath, file);
//       fs.rmSync(fullPath, { recursive: true, force: true });
//     });
//   }
// }

// export async function insertBatch(batch, keys, table) {
//   const values = batch.map(row =>
//     `(${keys.map(k => db.escape(row[k])).join(', ')})`
//   ).join(', ');
//   const query = `INSERT IGNORE INTO ${table} (${keys.join(', ')}) VALUES ${values}`;
//   await db.query(query);
// }

// export async function countRowsInFile(filePath) {
//   return new Promise((resolve, reject) => {
//     let rowCount = 0;
//     fs.createReadStream(filePath)
//       .pipe(csv())
//       .on('data', () => rowCount++)
//       .on('end', () => resolve(rowCount))
//       .on('error', (err) => reject(err));
//   });
// }


export function computeFileHash(filePath) {
  const fileBuffer = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(fileBuffer).digest('hex');
}

export function findGTFSFile(dir, filename) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const found = findGTFSFile(fullPath, filename);
      if (found) return found;
    } else {
      const lowerName = entry.name.toLowerCase();
      if (lowerName === `${filename}.csv` || lowerName === `${filename}.txt`) {
        return fullPath;
      }
    }
  }
  return null;
}

export function listUploadedFiles(dir, extractPath) {
  const files = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...listUploadedFiles(fullPath, extractPath));
    } else if (entry.name.endsWith('.csv') || entry.name.endsWith('.txt')) {
      files.push(path.relative(extractPath, fullPath));
    }
  }
  return files;
}

export function clearDirectory(dirPath) {
  if (fs.existsSync(dirPath)) {
    fs.readdirSync(dirPath).forEach(file => {
      const fullPath = path.join(dirPath, file);
      fs.rmSync(fullPath, { recursive: true, force: true });
    });
  }
}

export async function countRowsInFile(filePath) {
  return new Promise((resolve, reject) => {
    let rowCount = 0;
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', () => rowCount++)
      .on('end', () => resolve(rowCount))
      .on('error', (err) => reject(err));
  });
}

export async function countRows(uploadedFiles, extractPath) {
  const rowCounts = [];
  for (const file of uploadedFiles) {
    const filePath = path.join(extractPath, file);
    try {
      const rowCount = await countRowsInFile(filePath);
      rowCounts.push(rowCount);
    } catch (err) {
      rowCounts.push('Error counting rows');
    }
  }
  return rowCounts;
}

export async function insertBatch(batch, keys, table, db) {
  const values = batch.map(row => `(${keys.map(k => db.escape(row[k])).join(', ')})`).join(', ');
  const query = `INSERT IGNORE INTO ${table} (${keys.join(', ')}) VALUES ${values}`;
  await db.query(query);
}
