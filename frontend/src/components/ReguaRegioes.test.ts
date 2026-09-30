import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import ReguaRegioes from '@/components/ReguaRegioes.vue'

const montar = (cep: string) => mount(ReguaRegioes, { props: { cep } })

describe('ReguaRegioes', () => {
  it('mostra as 10 marcas, de 0 a 9, numa lista nomeada', () => {
    const wrapper = montar('59000-000')

    expect(wrapper.get('ol').attributes('aria-label')).toBe('Regiões postais')
    expect(wrapper.findAll('li').map((li) => li.text())).toEqual([
      '0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
    ])
  })

  it('acende só a marca do primeiro dígito do CEP', () => {
    const wrapper = montar('59000-000')

    const ativas = wrapper.findAll('li[aria-current="true"]')
    expect(ativas).toHaveLength(1)
    expect(ativas[0]!.text()).toBe('5')
  })

  it('acende a marca 0 para um CEP que começa com 0', () => {
    const wrapper = montar('01001000')

    expect(wrapper.get('li[aria-current="true"]').text()).toBe('0')
  })

  it('diz por extenso qual é a região (não depende de enxergar a régua)', () => {
    expect(montar('59000-000').text()).toContain('Região postal 5: PE, AL, PB e RN')
    expect(montar('01001-000').text()).toContain('Região postal 0: Grande São Paulo')
  })

  it('sem CEP não acende nenhuma marca nem mostra legenda de região', () => {
    const wrapper = montar('')

    expect(wrapper.findAll('li[aria-current="true"]')).toHaveLength(0)
    expect(wrapper.text()).not.toContain('Região postal')
  })
})
