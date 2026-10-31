// Tiện ích cấp thấp cho IndexedDB.
//
// Cấu trúc đồng nhất với mô hình lịch sử của ứng dụng:
//   - Cơ sở dữ liệu `image-sub2api-studio` phiên bản 1;
//   - Kho đối tượng `studio_history`, keyPath `id`;
//   - Chỉ mục `byScopeCreatedAt` (`[scope, createdAt]`, không duy nhất);
//   - Chỉ mục `byScope` (`scope`, không duy nhất).
//
// Module này chỉ mở cơ sở dữ liệu và đóng gói giao dịch; các thao tác CRUD (gồm yêu thích / LRU)
// được triển khai ở tầng trên trong `historyStore.js`.
//
// Khi chế độ riêng tư hoặc hạn mức lưu trữ gây lỗi, ném `Error('IDB_UNAVAILABLE')` và gắn
// lỗi gốc vào `error.cause`; bên gọi dựa vào đó để chuyển sang dùng localStorage.

/** @type {string} */
export const DB_NAME = 'image-sub2api-studio';
/** @type {number} */
export const DB_VERSION = 1;
/** @type {string} */
export const STORE_NAME = 'studio_history';
/** @type {string} */
export const INDEX_BY_SCOPE_CREATED_AT = 'byScopeCreatedAt';
/** @type {string} */
export const INDEX_BY_SCOPE = 'byScope';

/** @type {string} */
const ERR_UNAVAILABLE = 'IDB_UNAVAILABLE';

/**
 * Promise kết nối đã lưu. Dùng lại cùng một kết nối trong phiên để không phải mở lại cho mỗi thao tác CRUD.
 * Khi có `versionchange`, xóa bộ nhớ đệm và đóng kết nối để lần gọi tiếp theo mở lại.
 *
 * @type {Promise<IDBDatabase> | null}
 */
let cachedDbPromise = null;

/**
 * Kiểm tra môi trường hiện tại có cung cấp đối tượng toàn cục `indexedDB` dùng được hay không.
 *
 * Một số trình duyệt (đặc biệt là Firefox ở chế độ riêng tư) ném `SecurityError` ngay khi
 * truy cập `window.indexedDB`, vì vậy cần dùng try/catch.
 *
 * Lưu ý: hàm này chỉ kiểm tra sơ bộ API có hiện diện hay không. Lệnh `open()` vẫn có thể lỗi
 * do hạn mức hoặc quyền truy cập; {@link openDb} sẽ chuyển lỗi đó thành `IDB_UNAVAILABLE`.
 *
 * @returns {boolean}
 */
export function indexedDbAvailable() {
  try {
    if (typeof globalThis === 'undefined') return false;
    // @ts-ignore - trong trình duyệt, indexedDB là thuộc tính của globalThis
    const idb = globalThis.indexedDB;
    return typeof idb !== 'undefined' && idb !== null;
  } catch {
    return false;
  }
}

/**
 * Chuẩn hóa giá trị bất kỳ thành `Error`, bọc bằng `IDB_UNAVAILABLE` và giữ lại nguyên nhân để bên gọi kiểm tra.
 *
 * @param {unknown} cause
 * @returns {Error}
 */
function makeUnavailableError(cause) {
  const error = new Error(ERR_UNAVAILABLE);
  // @ts-ignore - Error.cause đã được hỗ trợ trên các trình duyệt hiện đại và Node 18 trở lên
  error.cause = cause instanceof Error ? cause : cause != null ? new Error(String(cause)) : undefined;
  return error;
}

/**
 * Tạo kho đối tượng và chỉ mục khi có sự kiện `upgradeneeded`.
 * Chỉ chạy khi nâng cấp từ v0 lên v1; nếu phiên bản sau cần thêm chỉ mục, hãy bổ sung nhánh kiểm tra `oldVersion` tại đây.
 *
 * @param {IDBDatabase} db
 * @param {IDBVersionChangeEvent} event
 */
function applyUpgrade(db, event) {
  const oldVersion = event.oldVersion ?? 0;

  if (oldVersion < 1) {
    // Trong sự kiện upgradeneeded, request.transaction là giao dịch versionchange; dùng nó để lấy kho hiện có
    // hoặc tạo kho mới.
    const store = db.objectStoreNames.contains(STORE_NAME)
      ? // @ts-ignore - event.target là IDBOpenDBRequest, có transaction trong sự kiện upgradeneeded
        event.target.transaction.objectStore(STORE_NAME)
      : db.createObjectStore(STORE_NAME, { keyPath: 'id' });

    if (!store.indexNames.contains(INDEX_BY_SCOPE_CREATED_AT)) {
      store.createIndex(INDEX_BY_SCOPE_CREATED_AT, ['scope', 'createdAt'], { unique: false });
    }
    if (!store.indexNames.contains(INDEX_BY_SCOPE)) {
      store.createIndex(INDEX_BY_SCOPE, 'scope', { unique: false });
    }
  }
}

/**
 * Mở (hoặc dùng lại) cơ sở dữ liệu `image-sub2api-studio` và trả về Promise kết nối.
 *
 * - Nếu `indexedDB` không khả dụng hoặc `open` phát sinh sự kiện `error` / `blocked`, ném
 *   `Error('IDB_UNAVAILABLE')` và gắn lỗi gốc vào `error.cause`.
 * - Khi kết nối nhận `versionchange`, chủ động gọi `close()` và xóa bộ nhớ đệm để không chặn tab khác nâng cấp.
 * - Khi kết nối nhận `close` (ví dụ sau khi khởi động lại), cũng xóa bộ nhớ đệm để lần gọi sau mở lại.
 *
 * @returns {Promise<IDBDatabase>}
 * @throws  {Error} `IDB_UNAVAILABLE`
 */
export function openDb() {
  if (cachedDbPromise) return cachedDbPromise;

  if (!indexedDbAvailable()) {
    return Promise.reject(makeUnavailableError(new Error('indexedDB is undefined')));
  }

  cachedDbPromise = new Promise((resolve, reject) => {
    /** @type {IDBOpenDBRequest} */
    let request;
    try {
      // @ts-ignore - trong trình duyệt, indexedDB là thuộc tính của globalThis
      request = globalThis.indexedDB.open(DB_NAME, DB_VERSION);
    } catch (error) {
      reject(makeUnavailableError(error));
      return;
    }

    request.onupgradeneeded = (event) => {
      const db = request.result;
      try {
        applyUpgrade(db, event);
      } catch (error) {
        // Chủ động hủy giao dịch khi nâng cấp thất bại để luồng bên ngoài xử lý lỗi.
        try {
          request.transaction?.abort();
        } catch {
          /* ignore */
        }
        reject(makeUnavailableError(error));
      }
    };

    request.onsuccess = () => {
      const db = request.result;

      // Chủ động đóng kết nối khi tab khác nâng cấp phiên bản để không chặn tab đó.
      db.onversionchange = () => {
        try {
          db.close();
        } catch {
          /* ignore */
        }
        cachedDbPromise = null;
      };

      // Xóa bộ nhớ đệm nếu kết nối đóng bất thường để lần sau mở lại.
      db.onclose = () => {
        cachedDbPromise = null;
      };

      resolve(db);
    };

    request.onerror = () => {
      cachedDbPromise = null;
      reject(makeUnavailableError(request.error));
    };

    request.onblocked = () => {
      cachedDbPromise = null;
      reject(makeUnavailableError(new Error('indexedDB open blocked')));
    };
  });

  // Nếu Promise bị từ chối, bảo đảm lần gọi sau có thể thử lại.
  cachedDbPromise.catch(() => {
    cachedDbPromise = null;
  });

  return cachedDbPromise;
}

/**
 * Bắt đầu một giao dịch trên kho đối tượng `studio_history` và truyền kho đó cho callback.
 *
 * Ví dụ sử dụng:
 * ```js
 * const entries = await withStore('readonly', async (store) => {
 *   return new Promise((resolve, reject) => {
 *     const req = store.getAll();
 *     req.onsuccess = () => resolve(req.result);
 *     req.onerror = () => reject(req.error);
 *   });
 * });
 * ```
 *
 * Quy ước hoạt động:
 * - `mode`: `'readonly'` hoặc `'readwrite'`.
 * - `fn` có thể là hàm đồng bộ hoặc bất đồng bộ. Giá trị trả về trở thành kết quả Promise sau khi giao dịch `complete`.
 * - Nếu `fn` ném lỗi hoặc Promise trả về bị từ chối, chủ động gọi `transaction.abort()` rồi chuyển tiếp lỗi.
 * - Nếu giao dịch bị hủy (ví dụ hết hạn mức hoặc bị ngắt bên ngoài) sau khi `fn` đã hoàn tất, Promise vẫn bị từ chối bằng lỗi giao dịch.
 *
 * @template T
 * @param {IDBTransactionMode} mode
 * @param {(store: IDBObjectStore) => T | Promise<T>} fn
 * @returns {Promise<T>}
 */
export async function withStore(mode, fn) {
  const db = await openDb();

  return new Promise((resolve, reject) => {
    /** @type {IDBTransaction} */
    let tx;
    try {
      tx = db.transaction(STORE_NAME, mode);
    } catch (error) {
      reject(makeUnavailableError(error));
      return;
    }

    const store = tx.objectStore(STORE_NAME);

    /** @type {unknown} */
    let resolved;
    /** @type {boolean} */
    let hasResolved = false;
    /** @type {unknown} */
    let aborted;

    tx.oncomplete = () => {
      if (hasResolved) {
        // @ts-ignore - resolved đã được gán khi hasResolved=true
        resolve(resolved);
      } else {
        // Trường hợp hiếm: giao dịch hoàn tất nhưng fn chưa resolve (fn đồng bộ trả về undefined vẫn được xem là đã resolve).
        resolve(/** @type {T} */ (/** @type {unknown} */ (undefined)));
      }
    };

    tx.onerror = () => {
      reject(tx.error ?? aborted ?? new Error('IDB transaction error'));
    };

    tx.onabort = () => {
      reject(tx.error ?? aborted ?? new Error('IDB transaction aborted'));
    };

    Promise.resolve()
      .then(() => fn(store))
      .then((value) => {
        resolved = value;
        hasResolved = true;
      })
      .catch((error) => {
        aborted = error;
        try {
          tx.abort();
        } catch {
          /* Bỏ qua: giao dịch có thể đã hoàn tất cùng lỗi. */
        }
        reject(error);
      });
  });
}

/**
 * Chỉ dùng khi kiểm thử / gỡ lỗi: xóa bộ nhớ đệm kết nối để lần gọi `openDb()` sau mở lại cơ sở dữ liệu.
 * Xuất hàm này để kiểm thử đơn vị hoặc buộc kết nối lại khi chuyển danh tính người dùng.
 *
 * @returns {void}
 */
export function __resetForTests() {
  cachedDbPromise = null;
}
