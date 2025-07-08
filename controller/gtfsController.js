import unzipper from 'unzipper';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import csv from 'csv-parser';
import cliProgress from 'cli-progress';
import { db } from '../config/db.js';
import { fileURLToPath } from 'url';
import { count } from 'console';

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// const extractPath = path.join(__dirname, '../temp/gtfs_extract');

// function findGTFSFile(dir, filename) {
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
// function clearDirectory(dirPath) {
//   if (fs.existsSync(dirPath)) {
//     for (const file of fs.readdirSync(dirPath)) {
//       const fullPath = path.join(dirPath, file);
//       if (fs.lstatSync(fullPath).isDirectory()) {
//         clearDirectory(fullPath);
//         fs.rmdirSync(fullPath);
//       } else {
//         fs.unlinkSync(fullPath);
//       }
//     }
//   }
// }


// async function insertBatch(batch, keys, table) {
//   const values = batch.map(row =>
//     `(${keys.map(k => db.escape(row[k])).join(', ')})`
//   ).join(', ');
//   const query = `INSERT IGNORE INTO ${table} (${keys.join(', ')}) VALUES ${values}`;

//   console.log(`Executing batch insert for ${table}: ${values.length} rows `);
//   console.log(`Executing batch insert for ${table}: ${values}  `);
//   await db.query(query);
// }

// export const uploadGTFS = async (req, res) => {
//   const zipPath = req.file?.path;

//   if (!zipPath) {
//     return res.status(400).json({ logcode: 6002, error: 'No file uploaded' });
//   }

//   try {
//     if (!fs.existsSync(zipPath)) {
//       return res.status(400).json({ logcode: 6002, error: 'Uploaded file does not exist' });
//     }

//     // if (fs.existsSync(extractPath)) {
//     //   fs.rmSync(extractPath, { recursive: true, force: true });
//     // }
//     clearDirectory(extractPath);
// fs.mkdirSync(extractPath, { recursive: true });

//     fs.mkdirSync(extractPath, { recursive: true });

//     try {
//       await fs.createReadStream(zipPath)
//         .pipe(unzipper.Extract({ path: extractPath }))
//         .promise();
//     } catch (zipErr) {
//       return res.status(400).json({ logcode: 6002, error: 'Invalid or corrupted ZIP file' });
//     }

//     const tables = [
      
//       'agency',
//       'calendar',
//       'routes',
//       'trips', 
//       'stops',
//       'fare_attributes',
//       'fare_rules',
//       'frequencies',
//       'stop_times',
//     ];

//     const errors = [];
//     let totalInserted = 0;

//     for (const table of tables) {
//       const filePath = findGTFSFile(extractPath, table);
//       if (!filePath) {
//         errors.push(`${table}.csv or .txt not found`);
//         continue;
//       }

//       console.log(`\n📦 Processing: ${table}`);

//       try {
//         const [columns] = await db.query(`SHOW COLUMNS FROM ${table}`);
//         const dbColumns = columns.map(col => col.Field);

//         // Read header
//         const headers = await new Promise((resolve, reject) => {
//           const headerStream = fs.createReadStream(filePath)
//             .pipe(csv())
//             .on('data', (row) => {
//               headerStream.destroy();
//               resolve(Object.keys(row));
//             })
//             .on('error', reject);
//         });

//         const filteredKeys = headers.filter(k => dbColumns.includes(k));
//         const batch = [];

//         const fixDate = (d) => {
//           const date = new Date(d);
//           return !isNaN(date) ? date.toISOString().slice(0, 10) : d;
//         };

//         // Count total lines for progress bar
//         const totalLines = await new Promise((resolve) => {
//           let count = 0;
//           fs.createReadStream(filePath)
//             .pipe(csv())
//             .on('data', () => count++)
//             .on('end', () => resolve(count));
//         });

//         const bar = new cliProgress.SingleBar({
//           format: `➡️ {table} [{bar}] {percentage}% | {value}/{total} rows`,
//           barCompleteChar: '█',
//           barIncompleteChar: '.',
//           hideCursor: true
//         }, cliProgress.Presets.shades_classic);

//         bar.start(totalLines, 0, { table });

//         await new Promise((resolve, reject) => {
//           const stream = fs.createReadStream(filePath).pipe(csv());
//           let processed = 0;

//           stream.on('data', async (row) => {
//             processed++;
//             bar.update(processed, { table });

//             if (table === 'calendar') {
//               if (row.start_date) row.start_date = fixDate(row.start_date);
//               if (row.end_date) row.end_date = fixDate(row.end_date);
//             }

//             const record = {};
//             for (const key of filteredKeys) {
//               record[key] = row[key] ?? null;
//             }

//             batch.push(record);

//             if (batch.length >= 500) {
//               stream.pause();
//               try {
//                 await insertBatch(batch, filteredKeys, table);
//                 totalInserted += batch.length;
//                 batch.length = 0;
//                 stream.resume();
//               } catch (e) {
//                 stream.destroy();
//                 bar.stop();
//                 reject(e);
//               }
//             }
//           });

//           stream.on('end', async () => {
//             if (batch.length > 0) {
//               try {
//                 await insertBatch(batch, filteredKeys, table);
//                 totalInserted += batch.length;
//               } catch (e) {
//                 bar.stop();
//                 return reject(e);
//               }
//             }
//             bar.stop();
//             resolve();
//           });

//           stream.on('error', (err) => {
//             bar.stop();
//             reject(err);
//           });
//         });

//       } catch (err) {
//         errors.push(`❌ Failed to process ${table}: ${err.message}`);
//       }
//     }

//     // List uploaded CSV or TXT files in the extracted folder
// function listUploadedFiles(dir) {
//   const files = [];
//   const entries = fs.readdirSync(dir, { withFileTypes: true });
//   for (const entry of entries) {
//     const fullPath = path.join(dir, entry.name);
//     if (entry.isDirectory()) {
//       files.push(...listUploadedFiles(fullPath));
//     } else if (entry.name.endsWith('.csv') || entry.name.endsWith('.txt')) {
//       files.push(path.relative(extractPath, fullPath));
//     }
//   }
//   return files;
// }

// const uploadedFiles = listUploadedFiles(extractPath);

// return res.json({
//   logcode: 6000,
//   messages: [
//     'GTFS data upload completed'
//   ],
//   totalTables: tables.length,
//   totalInserted,
//   uploadedFiles, // 👈 added list of uploaded files
//   warnings: errors.length ? errors : undefined,
// });


//   } catch (err) {
//     console.error('Unexpected error:', err);
//     return res.status(500).json({ logcode: 6001, error: 'Unexpected server error during GTFS upload' });
//   }
// };

// //----------------------------------------------//

// export const uploadStopTimes = async (req, res) => {
//   const filePath = req.file?.path; 
//   if (!filePath) return res.status(400).json({ error: 'No file uploaded' });

//   try {
//     const [columns] = await db.query(`SHOW COLUMNS FROM stop_times`);
//     const dbColumns = columns.map(col => col.Field);

//     const headers = await new Promise((resolve, reject) => {
//       const stream = fs.createReadStream(filePath).pipe(csv());
//       stream.on('data', (row) => {
//         stream.destroy();
//         resolve(Object.keys(row));
//       });
//       stream.on('error', reject);
//     });

//     const filteredKeys = headers.filter(k => dbColumns.includes(k));
//     const batch = [];

//     const totalLines = await new Promise((resolve) => {
//       let count = 0;
//       fs.createReadStream(filePath)
//         .pipe(csv())
//         .on('data', () => count++)
//         .on('end', () => resolve(count));
//     });

//     const bar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
//     bar.start(totalLines, 0);

//     await new Promise((resolve, reject) => {
//       const stream = fs.createReadStream(filePath).pipe(csv());
//       let processed = 0;

//       stream.on('data', async (row) => {
//         processed++;
//         bar.update(processed);

//         const record = {};
//         for (const key of filteredKeys) {
//           record[key] = row[key] ?? null;
//         }

//         batch.push(record);

//         if (batch.length >= 500) {
//           stream.pause();
//           try {
//             await insertBatch(batch, filteredKeys, 'stop_times');
//             batch.length = 0;
//             stream.resume();
//           } catch (err) {
//             stream.destroy();
//             bar.stop();
//             reject(err);
//           }
//         }
//       });

//       stream.on('end', async () => {
//         if (batch.length > 0) {
//           try {
//             await insertBatch(batch, filteredKeys, 'stop_times');
//           } catch (err) {
//             bar.stop();
//             return reject(err);
//           }
//         }
//         bar.stop();
//         resolve();
//       });

//       stream.on('error', (err) => {
//         bar.stop();
//         reject(err);
//       });
//     });

//     res.json({ message: 'stop_times uploaded successfully' });

//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: 'Server error' });
//   }
// };



const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const extractPath = path.join(__dirname, '../temp/gtfs_extract');

// Simulated in-memory hash store (replace with DB or Redis in production)
// const uploadedFileHashes = new Set();

function computeFileHash(filePath) {
  const fileBuffer = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(fileBuffer).digest('hex');
}

function findGTFSFile(dir, filename) {

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

function clearDirectory(dirPath) {
  if (fs.existsSync(dirPath)) {
    fs.readdirSync(dirPath).forEach(file => {
      const fullPath = path.join(dirPath, file);
      fs.rmSync(fullPath, { recursive: true, force: true });
    });
  }
}

async function insertBatch(batch, keys, table) {
  const values = batch.map(row =>
    `(${keys.map(k => db.escape(row[k])).join(', ')})`
  ).join(', ');
  const query = `INSERT IGNORE INTO ${table} (${keys.join(', ')}) VALUES ${values}`;
  await db.query(query);
}
async function countRowsInFile(filePath) {
  return new Promise((resolve, reject) => {
    let rowCount = 0;
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', () => rowCount++)
      .on('end', () => resolve(rowCount))
      .on('error', (err) => reject(err));
  });
}


export const uploadGTFS = async (req, res) => {
  const zipPath = req.file?.path;

  if (!zipPath) {
    return res.status(400).json({ logcode: 6002, error: 'No file uploaded' });
  }

  try {
    if (!fs.existsSync(zipPath)) {
      return res.status(400).json({ logcode: 6002, error: 'Uploaded file does not exist' });
    }

    const fileHash = computeFileHash(zipPath);

    console.log("the file hash is" + fileHash);
    // if (uploadedFileHashes.has(fileHash)) {
    //   return res.status(409).json({ logcode: 6003, error: 'This file has already been uploaded successfully.' });
    // }

    clearDirectory(extractPath);
    fs.mkdirSync(extractPath, { recursive: true });

    try {
      await fs.createReadStream(zipPath)
        .pipe(unzipper.Extract({ path: extractPath }))
        .promise();
    } catch (zipErr) {
      return res.status(400).json({ logcode: 6002, error: 'Invalid or corrupted ZIP file' });
    }
    const uploadedFiless= listUploadedFiles(extractPath);

          
    const rowCounts = [];

    for (const file of uploadedFiless) {
      const filePath = path.join(extractPath, file);
      try {
        const rowCount = await countRowsInFile(filePath);
        // rowCounts[file] = rowCount;
        rowCounts.push(rowCount);

        console.log(`1)  the rowCounts --> ${rowCounts[file]}`);
        console.log(`2)  the rowCounts --> ${rowCount}`);
      } catch (err) {
        rowCounts[file] = 'Error counting rows';
      }
    }

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

    const errors = [];
    let totalInserted = 0;

    for (const table of tables) {
      const filePath = findGTFSFile(extractPath, table);
      if (!filePath) {
        errors.push(`${table}.csv or .txt not found`);
        continue;
      }

      try {
        const [columns] = await db.query(`SHOW COLUMNS FROM ${table}`);
        const dbColumns = columns.map(col => col.Field);

        const headers = await new Promise((resolve, reject) => {
          const stream = fs.createReadStream(filePath).pipe(csv());
          stream.on('data', (row) => {
            stream.destroy();
            resolve(Object.keys(row));
          });
          stream.on('error', reject);
        });

        const filteredKeys = headers.filter(k => dbColumns.includes(k));
        const batch = [];

        const fixDate = (d) => {
          const date = new Date(d);
          return !isNaN(date) ? date.toISOString().slice(0, 10) : d;
        };

        const totalLines = await new Promise((resolve) => {
          let count = 0;
          fs.createReadStream(filePath).pipe(csv()).on('data', () => count++).on('end', () => resolve(count));
        });

        const bar = new cliProgress.SingleBar({
          format: `➡️ {table} [{bar}] {percentage}% | {value}/{total} rows`,
          barCompleteChar: '█',
          barIncompleteChar: '.',
          hideCursor: true
        }, cliProgress.Presets.shades_classic);

        bar.start(totalLines, 0, { table });

        await new Promise((resolve, reject) => {
          const stream = fs.createReadStream(filePath).pipe(csv());
          let processed = 0;

          stream.on('data', async (row) => {
            processed++;
            bar.update(processed, { table });

            if (table === 'calendar') {
              if (row.start_date) row.start_date = fixDate(row.start_date);
              if (row.end_date) row.end_date = fixDate(row.end_date);
            }

            const record = {};
            for (const key of filteredKeys) {
              record[key] = row[key] ?? null;
            }

            batch.push(record);

            if (batch.length >= 500) {
              stream.pause();
              try {
                await insertBatch(batch, filteredKeys, table);
                totalInserted += batch.length;
                batch.length = 0;
                stream.resume();
              } catch (e) {
                stream.destroy();
                bar.stop();
                reject(e);
              }
            }
          });

          stream.on('end', async () => {
            if (batch.length > 0) {
              try {
                await insertBatch(batch, filteredKeys, table);
                totalInserted += batch.length;
              } catch (e) {
                bar.stop();
                return reject(e);
              }
            }
            bar.stop();
            resolve();
          });

          stream.on('error', (err) => {
            bar.stop();
            reject(err);
          });
        });

      } catch (err) {
        errors.push(`❌ Failed to process ${table}: ${err.message}`);
      }
    }

    function listUploadedFiles(dir) {
      const files = [];
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          files.push(...listUploadedFiles(fullPath));
        } else if (entry.name.endsWith('.csv') || entry.name.endsWith('.txt')) {
          files.push(path.relative(extractPath, fullPath));
        }
      }
      return files;
    }
    async function countRowsInFile(filePath) {
  return new Promise((resolve, reject) => {
    let rowCount = 0;
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', () => rowCount++)
      .on('end', () => resolve(rowCount))
      .on('error', (err) => reject(err));
  });
}

    const uploadedFiles = listUploadedFiles(extractPath);
    // uploadedFileHashes.add(fileHash);

    const map = new Map();
    
  
    for(let i = 0; i<uploadedFiles.length ;i++ ){
      
      // console.log(tables[i])
      
      
      map.set(uploadedFiles[i],rowCounts[i]);
      // console.log(`the value is ${value}`);
      console.log(`the value issss ${Array.from(map.values())}`);

      
      // value = myVal;
      // console.log(myVal);
     }

     const tableStats = Array.from(map,([key, val])=>({ //destructuring
      table_name:key,
      count:val

    }))

    console.log(tableStats.values);
    console.log(`the map values are ${map.values()}`);
    const mapVal = map.values();
    const mapObject = Object.fromEntries(map);
    return res.json({
      logcode: 6000,
      messages: ['GTFS data upload completed'],
      totalTables: tables.length,
      totalInserted ,
      
      value:tableStats,
      warnings: errors.length ? errors : undefined,
    });
  } catch (err) {
    console.error('Unexpected error:', err);
    return res.status(500).json({ logcode: 6001, error: 'Unexpected server error during GTFS upload' });
  }
};



