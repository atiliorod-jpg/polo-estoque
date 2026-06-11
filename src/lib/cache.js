// Cache offline em localStorage, isolado por restaurante.
// Permite o app funcionar sem internet e sincronizar ao reconectar.

const ns = (rid, chave) => `pe::${rid}::${chave}`;

export const cacheGet = (rid, chave, fallback) => {
  if (!rid) return fallback;
  try {
    const s = localStorage.getItem(ns(rid, chave));
    return s ? JSON.parse(s) : fallback;
  } catch { return fallback; }
};

export const cacheSet = (rid, chave, valor) => {
  if (!rid) return;
  try { localStorage.setItem(ns(rid, chave), JSON.stringify(valor)); } catch {}
};

// ── Outbox: operações pendentes quando offline ───────────────
// Cada item: { id, kind:'registro'|'doc', op:'insert'|'delete'|'upsert', payload }
export const outboxGet = (rid) => cacheGet(rid, '_outbox', []);
export const outboxSet = (rid, fila) => cacheSet(rid, '_outbox', fila);

export const outboxAdd = (rid, item) => {
  const fila = outboxGet(rid);
  fila.push({ ...item, _enfileiradoEm: Date.now() });
  outboxSet(rid, fila);
};

export const outboxClear = (rid) => outboxSet(rid, []);
