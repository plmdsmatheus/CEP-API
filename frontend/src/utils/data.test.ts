import { describe, expect, it } from 'vitest'
import { formatarDataHora } from './data'

describe('formatarDataHora', () => {
  it('formata como dd/mm/aaaa hh:mm', () => {
    expect(formatarDataHora('2026-09-29T21:02:48.548892Z', 'UTC')).toBe('29/09/2026 21:02')
  })

  it('respeita o fuso pedido (Brasília está 3 h atrás de UTC)', () => {
    expect(formatarDataHora('2026-09-29T21:02:48Z', 'America/Sao_Paulo')).toBe('29/09/2026 18:02')
  })

  it('usa dois dígitos em dia, mês, hora e minuto', () => {
    expect(formatarDataHora('2026-01-05T03:04:00Z', 'UTC')).toBe('05/01/2026 03:04')
  })

  it('devolve o texto original quando a data é inválida', () => {
    expect(formatarDataHora('ontem')).toBe('ontem')
  })
})
