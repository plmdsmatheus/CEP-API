import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { iniciarTemaDoSistema } from './tema'

type Ouvinte = (evento: { matches: boolean }) => void

let escuro = false
let ouvintes: Ouvinte[] = []

beforeEach(() => {
  ouvintes = []
  document.documentElement.classList.remove('dark')
  vi.stubGlobal(
    'matchMedia',
    vi.fn((consulta: string) => ({
      media: consulta,
      get matches() {
        return escuro
      },
      addEventListener: (_: string, ouvinte: Ouvinte) => ouvintes.push(ouvinte),
      removeEventListener: (_: string, ouvinte: Ouvinte) => {
        ouvintes = ouvintes.filter((o) => o !== ouvinte)
      },
    })),
  )
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('iniciarTemaDoSistema', () => {
  it('consulta a preferência de esquema de cores do sistema', () => {
    iniciarTemaDoSistema()

    expect(window.matchMedia).toHaveBeenCalledWith('(prefers-color-scheme: dark)')
  })

  it('sistema escuro → adiciona a classe "dark" no <html>', () => {
    escuro = true

    iniciarTemaDoSistema()

    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('sistema claro → não usa a classe "dark"', () => {
    escuro = false

    iniciarTemaDoSistema()

    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })

  it('acompanha a troca de tema do sistema enquanto a página está aberta', () => {
    escuro = false
    iniciarTemaDoSistema()

    ouvintes.forEach((ouvinte) => ouvinte({ matches: true }))
    expect(document.documentElement.classList.contains('dark')).toBe(true)

    ouvintes.forEach((ouvinte) => ouvinte({ matches: false }))
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })

  it('devolve uma função que para de acompanhar o sistema', () => {
    const parar = iniciarTemaDoSistema()
    expect(ouvintes).toHaveLength(1)

    parar()

    expect(ouvintes).toHaveLength(0)
  })
})
