// Keeps copies of attached PDFs in the browser (IndexedDB) until the AI has read them, so a nest
// that's still being built can pick up again after the page reloads or the tab is closed.
// Every call quietly does nothing if the browser blocks storage.

const DB = "chick-files";
const STORE = "files";

function open() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function run(mode, action) {
  try {
    const db = await open();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, mode);
      const req = action(tx.objectStore(STORE));
      tx.oncomplete = () => resolve(req?.result);
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    return undefined;
  }
}

export const stashFile = (id, file) => run("readwrite", (s) => s.put(file, id));
export const getStashedFile = (id) => run("readonly", (s) => s.get(id));
export const dropStashedFile = (id) => run("readwrite", (s) => s.delete(id));
