/**
 * IndexedDB helper functions for storing model metadata
 */

const DB_NAME = 'typing-behavior-db';
const STATS_STORE = 'model-stats';
const DB_VERSION = 1;

/**
 * Initialize the IndexedDB database
 * @returns {Promise<IDBDatabase>} The database instance
 */
export const initDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      console.error('IndexedDB error:', event.target.error);
      reject('Error opening IndexedDB');
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STATS_STORE)) {
        db.createObjectStore(STATS_STORE, { keyPath: 'id' });
      }
    };

    request.onsuccess = (event) => {
      const db = event.target.result;
      resolve(db);
    };
  });
};

/**
 * Save model statistics to IndexedDB
 * @param {Object} stats - Model statistics
 * @returns {Promise<void>}
 */
export const saveModelStats = async (stats) => {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STATS_STORE], 'readwrite');
      const store = transaction.objectStore(STATS_STORE);
      
      const modelStats = {
        id: 'input-behavior-stats', // Fixed ID for easy retrieval
        ...stats,
        timestamp: Date.now()
      };
      
      const request = store.put(modelStats);
      
      request.onsuccess = () => resolve();
      request.onerror = (event) => {
        console.error('Error saving stats:', event.target.error);
        reject(event.target.error);
      };
    });
  } catch (error) {
    console.error('Failed to save model stats:', error);
    throw error;
  }
};

/**
 * Load model statistics from IndexedDB
 * @returns {Promise<Object|null>} Model statistics or null if not found
 */
export const loadModelStats = async () => {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STATS_STORE], 'readonly');
      const store = transaction.objectStore(STATS_STORE);
      const request = store.get('input-behavior-stats');
      
      request.onsuccess = (event) => {
        const result = event.target.result;
        resolve(result || null);
      };
      
      request.onerror = (event) => {
        console.error('Error loading stats:', event.target.error);
        reject(event.target.error);
      };
    });
  } catch (error) {
    console.error('Failed to load model stats:', error);
    return null;
  }
};

/**
 * Delete model statistics from IndexedDB
 * @returns {Promise<void>}
 */
export const deleteModelStats = async () => {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STATS_STORE], 'readwrite');
      const store = transaction.objectStore(STATS_STORE);
      const request = store.delete('input-behavior-stats');
      
      request.onsuccess = () => resolve();
      request.onerror = (event) => {
        console.error('Error deleting stats:', event.target.error);
        reject(event.target.error);
      };
    });
  } catch (error) {
    console.error('Failed to delete model stats:', error);
    throw error;
  }
}; 