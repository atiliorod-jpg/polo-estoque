import { hoje } from './formatters';

const DIA_MS = 86400000;

export const addDias = (dataISO, dias) =>
  new Date(new Date(dataISO).getTime() + dias * DIA_MS).toISOString().slice(0, 10);

export const diasAte = (dataISO, ref = hoje()) =>
  Math.round((new Date(dataISO) - new Date(ref)) / DIA_MS);

/**
 * Regra de datas dos registros: nunca no futuro (evita erro de digitação);
 * registros com mais de 3 dias de atraso pedem confirmação.
 */
export function validarDataRegistro(data, ref = hoje()) {
  if (!data) return { ok: false, motivo: 'vazia' };
  if (data > ref) return { ok: false, motivo: 'futuro' };
  const atraso = Math.abs(diasAte(data, ref));
  if (data < ref && atraso > 3) return { ok: true, confirmar: true, dias: atraso };
  return { ok: true };
}

// (o controle de validades por lote vive em utils/lotes.js — calcLotes)
