import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import StatusBadge from '@/components/StatusBadge.vue'
import type { StatusConsulta } from '@/types/consulta'

const montar = (status: StatusConsulta) => mount(StatusBadge, { props: { status } })

describe('StatusBadge', () => {
  it.each([
    ['encontrado', 'Encontrado'],
    ['nao_encontrado', 'Não encontrado'],
  ] as const)('status %s aparece escrito como "%s" (nunca só por cor)', (status, texto) => {
    const wrapper = montar(status)

    expect(wrapper.text()).toBe(texto)
    expect(wrapper.attributes('data-status')).toBe(status)
  })

  it('tem um ícone decorativo', () => {
    expect(montar('encontrado').get('svg').attributes('aria-hidden')).toBe('true')
    expect(montar('nao_encontrado').get('svg').attributes('aria-hidden')).toBe('true')
  })
})
