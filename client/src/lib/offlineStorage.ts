/**
 * Offline Storage Utility for AI LaTeX Generator
 * 
 * This utility provides methods to interact with IndexedDB for offline storage
 * and handles synchronization of offline changes when the app comes back online.
 */

// IndexedDB configuration
const DB_NAME = 'AILatexGeneratorOfflineDB';
const DB_VERSION = 1;
const DOCUMENTS_STORE = 'documents';
const PENDING_CHANGES_STORE = 'pendingChanges';

// Types
export interface OfflineDocument {
  id: number | string;
  userId: number;
  title: string;
  content: string;
  updatedAt: string;
  createdAt: string;
  isLocal?: boolean;
}

export interface PendingChange {
  id?: number;
  documentId: number | string;
  type: 'create' | 'update' | 'delete';
  data: Partial<OfflineDocument>;
  timestamp: number;
}

// Get IndexedDB connection
function getDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) {
      reject(new Error('IndexedDB is not supported in this browser'));
      return;
    }
    
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = (event) => {
      reject(new Error(`IndexedDB error: ${(event.target as any).errorCode}`));
    };
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      // Create stores if they don't exist
      if (!db.objectStoreNames.contains(DOCUMENTS_STORE)) {
        const documentStore = db.createObjectStore(DOCUMENTS_STORE, { keyPath: 'id' });
        documentStore.createIndex('userId', 'userId', { unique: false });
        documentStore.createIndex('updatedAt', 'updatedAt', { unique: false });
      }
      
      if (!db.objectStoreNames.contains(PENDING_CHANGES_STORE)) {
        const pendingChangesStore = db.createObjectStore(PENDING_CHANGES_STORE, { keyPath: 'id', autoIncrement: true });
        pendingChangesStore.createIndex('documentId', 'documentId', { unique: false });
        pendingChangesStore.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
    
    request.onsuccess = (event) => {
      resolve((event.target as IDBOpenDBRequest).result);
    };
  });
}

// Save a document to offline storage
export async function saveDocumentOffline(document: OfflineDocument): Promise<OfflineDocument> {
  try {
    const db = await getDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([DOCUMENTS_STORE, PENDING_CHANGES_STORE], 'readwrite');
      const documentStore = transaction.objectStore(DOCUMENTS_STORE);
      const pendingChangesStore = transaction.objectStore(PENDING_CHANGES_STORE);
      
      // Save the document
      const documentRequest = documentStore.put(document);
      
      // Record the pending change for sync
      const pendingChange: PendingChange = {
        documentId: document.id,
        type: document.isLocal ? 'create' : 'update',
        data: document,
        timestamp: Date.now()
      };
      
      const pendingRequest = pendingChangesStore.add(pendingChange);
      
      transaction.oncomplete = () => {
        console.log('Document saved offline:', document.id);
        
        // Trigger sync if the browser is online
        if (navigator.onLine && 'serviceWorker' in navigator && 'SyncManager' in window) {
          navigator.serviceWorker.ready.then(registration => {
            registration.sync.register('sync-latex-changes')
              .catch(err => console.error('Background sync registration failed:', err));
          });
        }
        
        resolve(document);
      };
      
      transaction.onerror = (event) => {
        reject(new Error(`Transaction error: ${(event.target as any).error}`));
      };
    });
  } catch (error) {
    console.error('Error saving document offline:', error);
    throw error;
  }
}

// Get a document from offline storage
export async function getDocumentOffline(documentId: number | string): Promise<OfflineDocument | null> {
  try {
    const db = await getDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(DOCUMENTS_STORE, 'readonly');
      const store = transaction.objectStore(DOCUMENTS_STORE);
      const request = store.get(documentId);
      
      request.onsuccess = () => {
        resolve(request.result || null);
      };
      
      request.onerror = (event) => {
        reject(new Error(`Get document error: ${(event.target as any).error}`));
      };
    });
  } catch (error) {
    console.error('Error getting document offline:', error);
    return null;
  }
}

// Get all documents from offline storage
export async function getAllDocumentsOffline(userId?: number): Promise<OfflineDocument[]> {
  try {
    const db = await getDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(DOCUMENTS_STORE, 'readonly');
      const store = transaction.objectStore(DOCUMENTS_STORE);
      
      let request: IDBRequest;
      
      if (userId !== undefined) {
        const index = store.index('userId');
        request = index.getAll(userId);
      } else {
        request = store.getAll();
      }
      
      request.onsuccess = () => {
        resolve(request.result || []);
      };
      
      request.onerror = (event) => {
        reject(new Error(`Get all documents error: ${(event.target as any).error}`));
      };
    });
  } catch (error) {
    console.error('Error getting all documents offline:', error);
    return [];
  }
}

// Delete a document from offline storage
export async function deleteDocumentOffline(documentId: number | string): Promise<boolean> {
  try {
    const db = await getDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([DOCUMENTS_STORE, PENDING_CHANGES_STORE], 'readwrite');
      const documentStore = transaction.objectStore(DOCUMENTS_STORE);
      const pendingChangesStore = transaction.objectStore(PENDING_CHANGES_STORE);
      
      // Delete the document
      const documentRequest = documentStore.delete(documentId);
      
      // Check if document exists and is not local-only
      const getRequest = documentStore.get(documentId);
      
      getRequest.onsuccess = () => {
        const document = getRequest.result;
        
        if (document && !document.isLocal) {
          // Record deletion for sync
          const pendingChange: PendingChange = {
            documentId: documentId,
            type: 'delete',
            data: { id: documentId },
            timestamp: Date.now()
          };
          
          pendingChangesStore.add(pendingChange);
        }
      };
      
      transaction.oncomplete = () => {
        console.log('Document deleted offline:', documentId);
        
        // Trigger sync if the browser is online
        if (navigator.onLine && 'serviceWorker' in navigator && 'SyncManager' in window) {
          navigator.serviceWorker.ready.then(registration => {
            registration.sync.register('sync-latex-changes')
              .catch(err => console.error('Background sync registration failed:', err));
          });
        }
        
        resolve(true);
      };
      
      transaction.onerror = (event) => {
        reject(new Error(`Transaction error: ${(event.target as any).error}`));
      };
    });
  } catch (error) {
    console.error('Error deleting document offline:', error);
    return false;
  }
}

// Get pending changes for sync
export async function getPendingChanges(): Promise<PendingChange[]> {
  try {
    const db = await getDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(PENDING_CHANGES_STORE, 'readonly');
      const store = transaction.objectStore(PENDING_CHANGES_STORE);
      const request = store.getAll();
      
      request.onsuccess = () => {
        resolve(request.result || []);
      };
      
      request.onerror = (event) => {
        reject(new Error(`Get pending changes error: ${(event.target as any).error}`));
      };
    });
  } catch (error) {
    console.error('Error getting pending changes:', error);
    return [];
  }
}

// Clear a pending change after sync
export async function clearPendingChange(changeId: number): Promise<boolean> {
  try {
    const db = await getDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(PENDING_CHANGES_STORE, 'readwrite');
      const store = transaction.objectStore(PENDING_CHANGES_STORE);
      const request = store.delete(changeId);
      
      request.onsuccess = () => {
        resolve(true);
      };
      
      request.onerror = (event) => {
        reject(new Error(`Clear pending change error: ${(event.target as any).error}`));
      };
    });
  } catch (error) {
    console.error('Error clearing pending change:', error);
    return false;
  }
}

// Utility function to check if the app is running in offline mode
export function isOfflineMode(): boolean {
  return !navigator.onLine;
}

// Register event handlers for online/offline events
export function initOfflineListeners() {
  window.addEventListener('online', () => {
    console.log('Application is now online');
    document.dispatchEvent(new CustomEvent('app:online'));
    
    // Trigger sync
    if ('serviceWorker' in navigator && 'SyncManager' in window) {
      navigator.serviceWorker.ready.then(registration => {
        registration.sync.register('sync-latex-changes')
          .catch(err => console.error('Background sync registration failed:', err));
      });
    }
  });
  
  window.addEventListener('offline', () => {
    console.log('Application is now offline');
    document.dispatchEvent(new CustomEvent('app:offline'));
  });
}