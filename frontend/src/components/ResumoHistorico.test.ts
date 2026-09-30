import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import ResumoHistorico from '@/components/ResumoHistorico.vue'
import type { Resumo } from '@/types/consulta'

const montar = (resumo: Resumo) => mount(ResumoHistorico, { props: { resumo } })

function pares(wrapper: ReturnType<typeof montar>) {
  return wrapper
    .findAll('dt')
    .map((dt) => [dt.text(), dt.element.nextElementSibling?.textContent?.trim()])
}

describe('ResumoHistorico', () => {
  it('é uma região nomeada "Resumo do histórico"', () => {
    expect(montar({ total: 0, encontrados: 0, naoEncontrados: 0 }).attributes('aria-label')).toBe(
      'Resumo do histórico',
    )
  })

  it('mostra total, encontrados e não encontrados, cada número com seu rótulo', () => {
    const wrapper = montar({ total: 12, encontrados: 9, naoEncontrados: 3 })

    expect(pares(wrapper)).toEqual([
      ['Consultas', '12'],
      ['Encontrados', '9'],
      ['Não encontrados', '3'],
    ])
  })

  it('mostra zeros quando o histórico está vazio', () => {
    expect(pares(montar({ total: 0, encontrados: 0, naoEncontrados: 0 }))).toEqual([
      ['Consultas', '0'],
      ['Encontrados', '0'],
      ['Não encontrados', '0'],
    ])
  })

  it('separa milhares no padrão brasileiro', () => {
    const wrapper = montar({ total: 1234, encontrados: 1200, naoEncontrados: 34 })

    expect(pares(wrapper)[0]).toEqual(['Consultas', '1.234'])
  })
})
