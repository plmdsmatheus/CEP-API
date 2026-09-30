import { describe, expect, it } from 'vitest'
import { cepValido, formatarCep, somenteDigitos } from './cep'

describe('formatarCep (máscara)', () => {
  it.each([
    ['', ''],
    ['5', '5'],
    ['59000', '59000'], // o hífen só aparece a partir do 6º dígito, para dar para apagar
    ['590000', '59000-0'],
    ['59000000', '59000-000'],
    ['59000-000', '59000-000'],
  ])('formata "%s" como "%s"', (entrada, esperado) => {
    expect(formatarCep(entrada)).toBe(esperado)
  })

  it.each([
    ['abc', ''],
    ['59a', '59'],
    ['abc59x000y000', '59000-000'],
    ['59.000 000', '59000-000'],
    ['59000-', '59000'],
  ])('descarta o que não é dígito: "%s" vira "%s"', (entrada, esperado) => {
    expect(formatarCep(entrada)).toBe(esperado)
  })

  it('limita a 8 dígitos', () => {
    expect(formatarCep('5900000012345')).toBe('59000-000')
  })
})

describe('somenteDigitos', () => {
  it('remove hífen e qualquer outro caractere', () => {
    expect(somenteDigitos('59000-000')).toBe('59000000')
    expect(somenteDigitos(' 5a9.0-00 000 ')).toBe('59000000')
  })
})

describe('cepValido', () => {
  it.each(['59000-000', '59000000', '01001-000'])('aceita "%s"', (cep) => {
    expect(cepValido(cep)).toBe(true)
  })

  it.each(['', '5900', '59000-00', '59000-0000', '590000000', '5900000a', '59000 000'])(
    'rejeita "%s"',
    (cep) => {
      expect(cepValido(cep)).toBe(false)
    },
  )
})
