import * as SQLite from 'expo-sqlite';

// Enable debugging for SQLite (Optional)
// SQLite.enablePromise(true);

let db = null;

// Initialize database and create tables
export const initDatabase = async () => {
  try {
    if (!db) {
      db = await SQLite.openDatabaseAsync('cattle.db');

      // await db.runAsync('DROP TABLE IF EXISTS cattle');

      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS cattle (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          earTagNumber TEXT NOT NULL UNIQUE,
          name TEXT,
          gender TEXT NOT NULL,
          cattleObtained TEXT NOT NULL,
          cattleBreed TEXT,
          cattleStage TEXT,
          cattleStatus TEXT,
          weight TEXT,
          dateOfBirth TEXT,
          dateOfEntry TEXT,
          motherTagNo TEXT,
          isPresent INTEGER DEFAULT 1,
          status TEXT DEFAULT 'alive',
          saleAmount REAL,
          purchasePrice REAL,
          inseminationDate TEXT,
          lastDeliveryDate TEXT,
          isSick INTEGER DEFAULT 0,
          createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
          updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // Drop the old events table if it exists
      // await db.runAsync('DROP TABLE IF EXISTS events');

      // Create new events table with cowIds column
      await db.runAsync(`
        CREATE TABLE IF NOT EXISTS events (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          type TEXT NOT NULL,
          date TEXT NOT NULL,
          description TEXT,
          cowIds TEXT NOT NULL,
          status TEXT DEFAULT 'pending',
          createdAt TEXT DEFAULT (datetime('now')),
          updatedAt TEXT DEFAULT (datetime('now'))
        )
      `);

      // Drop the old transactions table if it exists
      // await db.runAsync('DROP TABLE IF EXISTS transactions');

      // Create new transactions table
      await db.runAsync(`
        CREATE TABLE IF NOT EXISTS transactions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          type TEXT NOT NULL,
          amount REAL NOT NULL,
          description TEXT,
          date TEXT NOT NULL,
          category TEXT,
          cowId INTEGER,
          createdAt TEXT DEFAULT (datetime('now')),
          updatedAt TEXT DEFAULT (datetime('now')),
          FOREIGN KEY (cowId) REFERENCES cattle(id)
        )
      `);

      // Drop the old events table if it exists
      // await db.runAsync('DROP TABLE IF EXISTS milk');

      // Create milk records table
      await db.runAsync(`
        CREATE TABLE IF NOT EXISTS milk (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          date TEXT NOT NULL,
          cowIds TEXT NOT NULL,
          amTotal REAL DEFAULT 0,
          pmTotal REAL DEFAULT 0,
          totalProduced REAL NOT NULL,
          milkRate REAL DEFAULT 0,
          totalIncome REAL DEFAULT 0,
          createdAt TEXT DEFAULT (datetime('now')),
          updatedAt TEXT DEFAULT (datetime('now'))
        )
      `);

      // Create health records table
      await db.runAsync(`
        CREATE TABLE IF NOT EXISTS health (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          cowId INTEGER NOT NULL,
          disease TEXT NOT NULL,
          symptoms TEXT,
          diagnosis TEXT,
          treatment TEXT,
          startDate TEXT NOT NULL,
          endDate TEXT,
          status TEXT DEFAULT 'active',
          notes TEXT,
          createdAt TEXT DEFAULT (datetime('now')),
          updatedAt TEXT DEFAULT (datetime('now')),
          FOREIGN KEY (cowId) REFERENCES cattle(id)
        )
      `);
      // let query = 'SELECT * FROM health';
      // const rows = await db.getAllAsync(query);
      // console.log(rows)

      console.log('Database initialized successfully');
    }
    return db;
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
};

// Export database instance for queries
export const getDatabase = async () => {
  if (!db) {
    await initDatabase();
  }
  return db;
};

export default getDatabase;


