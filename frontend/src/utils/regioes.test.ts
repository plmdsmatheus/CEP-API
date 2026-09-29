import { describe, expect, it } from 'vitest'
import { REGIOES_POSTAIS, regiaoPostal } from './regioes'

describe('REGIOES_POSTAIS (primeiro dígito do CEP)', () => {
  it('tem as 10 regiões, de 0 a 9, em ordem', () => {
    expect(REGIOES_POSTAIS.map((r) => r.digito)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9])
  })

  it.each([
    [0, 'Grande São Paulo'],
    [1, 'Interior e litoral de SP'],
    [2, 'RJ e ES'],
    [3, 'MG'],
    [4, 'BA e SE'],
    [5, 'PE, AL, PB e RN'],
    [6, 'CE, PI, MA, PA, AM, AC, AP e RR'],
    [7, 'DF, GO, TO, RO, MT e MS'],
    [8, 'PR e SC'],
    [9, 'RS'],
  ])('a região %i cobre %s', (digito, descricao) => {
    expect(REGIOES_POSTAIS[digito]).toEqual({ digito, descricao })
  })
})

describe('regiaoPostal', () => {
  it('descobre a região pelo primeiro dígito, com ou sem máscara', () => {
    expect(regiaoPostal('59000-000')).toEqual({ digito: 5, descricao: 'PE, AL, PB e RN' })
    expect(regiaoPostal('01001000')).toEqual({ digito: 0, descricao: 'Grande São Paulo' })
  })

  it('devolve null quando não há dígito para olhar', () => {
    expect(regiaoPostal('')).toBeNull()
    expect(regiaoPostal('abc')).toBeNull()
  })
})
