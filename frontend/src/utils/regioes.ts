import { somenteDigitos } from '@/utils/cep'

export interface RegiaoPostal {
  digito: number
  descricao: string
}

/** Regiões postais dos Correios: o primeiro dígito do CEP indica a região do país. */
export const REGIOES_POSTAIS: readonly RegiaoPostal[] = [
  { digito: 0, descricao: 'Grande São Paulo' },
  { digito: 1, descricao: 'Interior e litoral de SP' },
  { digito: 2, descricao: 'RJ e ES' },
  { digito: 3, descricao: 'MG' },
  { digito: 4, descricao: 'BA e SE' },
  { digito: 5, descricao: 'PE, AL, PB e RN' },
  { digito: 6, descricao: 'CE, PI, MA, PA, AM, AC, AP e RR' },
  { digito: 7, descricao: 'DF, GO, TO, RO, MT e MS' },
  { digito: 8, descricao: 'PR e SC' },
  { digito: 9, descricao: 'RS' },
]

export function regiaoPostal(cep: string): RegiaoPostal | null {
  const primeiroDigito = somenteDigitos(cep)[0]
  return primeiroDigito === undefined ? null : (REGIOES_POSTAIS[Number(primeiroDigito)] ?? null)
}
