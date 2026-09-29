import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import FiltroStatus from '@/components/FiltroStatus.vue'
import type { FiltroHistorico } from '@/composables/useHistorico'

const montar = (modelValue: FiltroHistorico = 'todos') =>
  mount(FiltroStatus, { props: { modelValue } })

describe('FiltroStatus', () => {
  it('é um grupo de opções nomeado "Filtrar por status", com as três opções em ordem', () => {
    const wrapper = montar()

    expect(wrapper.get('[role="radiogroup"]').attributes('aria-label')).toBe('Filtrar por status')
    expect(wrapper.findAll('[role="radio"]').map((r) => r.text())).toEqual([
      'Todos',
      'Encontrados',
      'Não encontrados',
    ])
  })

  it.each([
    ['todos', 0],
    ['encontrado', 1],
    ['nao_encontrado', 2],
  ] as const)('com o filtro "%s" só a opção %i fica marcada', (filtro, indice) => {
    const marcadas = montar(filtro)
      .findAll('[role="radio"]')
      .map((r) => r.attributes('aria-checked'))

    expect(marcadas.map((m) => m === 'true')).toEqual([0, 1, 2].map((i) => i === indice))
  })

  it('só a opção marcada entra na ordem do Tab (as outras são alcançadas pelas setas)', () => {
    const tabindex = montar('encontrado')
      .findAll('[role="radio"]')
      .map((r) => r.attributes('tabindex'))

    expect(tabindex).toEqual(['-1', '0', '-1'])
  })

  it.each([
    [1, 'encontrado'],
    [2, 'nao_encontrado'],
  ] as const)('clicar na opção %i emite "%s"', async (indice, valor) => {
    const wrapper = montar('todos')

    await wrapper.findAll('[role="radio"]')[indice]!.trigger('click')

    expect(wrapper.emitted('update:modelValue')).toEqual([[valor]])
  })

  it('clicar na opção que já está marcada não emite nada (evita recarregar à toa)', async () => {
    const wrapper = montar('encontrado')

    await wrapper.findAll('[role="radio"]')[1]!.trigger('click')

    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it('seta para a direita e para a esquerda trocam a opção, dando a volta nas pontas', async () => {
    const primeiro = montar('todos')
    await primeiro.findAll('[role="radio"]')[0]!.trigger('keydown', { key: 'ArrowRight' })
    expect(primeiro.emitted('update:modelValue')).toEqual([['encontrado']])

    const naVolta = montar('todos')
    await naVolta.findAll('[role="radio"]')[0]!.trigger('keydown', { key: 'ArrowLeft' })
    expect(naVolta.emitted('update:modelValue')).toEqual([['nao_encontrado']])

    const ultimo = montar('nao_encontrado')
    await ultimo.findAll('[role="radio"]')[2]!.trigger('keydown', { key: 'ArrowRight' })
    expect(ultimo.emitted('update:modelValue')).toEqual([['todos']])
  })
})
