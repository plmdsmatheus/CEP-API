import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import PaginacaoHistorico from '@/components/PaginacaoHistorico.vue'

type Props = {
  pagina?: number
  totalPaginas?: number
  total?: number
  temAnterior?: boolean
  temProxima?: boolean
  carregando?: boolean
}

const montar = (props: Props = {}) =>
  mount(PaginacaoHistorico, {
    props: {
      pagina: 1,
      totalPaginas: 3,
      total: 25,
      temAnterior: false,
      temProxima: true,
      carregando: false,
      ...props,
    },
  })

const botao = (wrapper: ReturnType<typeof montar>, nome: string) =>
  wrapper.findAll('button').find((b) => b.text() === nome)!

describe('PaginacaoHistorico', () => {
  it('é uma navegação nomeada e diz a página atual e o total', () => {
    const wrapper = montar({ pagina: 2, totalPaginas: 3, total: 25 })

    expect(wrapper.get('nav').attributes('aria-label')).toBe('Paginação do histórico')
    expect(wrapper.text()).toContain('Página 2 de 3')
    expect(wrapper.text()).toContain('25 consultas')
  })

  it('usa o singular quando há uma consulta só', () => {
    expect(montar({ pagina: 1, totalPaginas: 1, total: 1, temProxima: false }).text()).toContain(
      '1 consulta',
    )
    expect(montar({ pagina: 1, totalPaginas: 1, total: 1, temProxima: false }).text()).not.toContain(
      '1 consultas',
    )
  })

  it('separa milhares no padrão brasileiro', () => {
    expect(montar({ total: 1250, totalPaginas: 125 }).text()).toContain('1.250 consultas')
  })

  it('não aparece quando não há consultas', () => {
    expect(montar({ total: 0, totalPaginas: 1, temProxima: false }).find('nav').exists()).toBe(false)
  })

  it('desabilita "Anterior" na primeira página e "Próxima" na última', () => {
    const primeira = montar({ temAnterior: false, temProxima: true })
    expect(botao(primeira, 'Anterior').attributes('disabled')).toBeDefined()
    expect(botao(primeira, 'Próxima').attributes('disabled')).toBeUndefined()

    const ultima = montar({ pagina: 3, temAnterior: true, temProxima: false })
    expect(botao(ultima, 'Anterior').attributes('disabled')).toBeUndefined()
    expect(botao(ultima, 'Próxima').attributes('disabled')).toBeDefined()
  })

  it('os botões emitem "anterior" e "proxima"', async () => {
    const wrapper = montar({ pagina: 2, temAnterior: true, temProxima: true })

    await botao(wrapper, 'Anterior').trigger('click')
    await botao(wrapper, 'Próxima').trigger('click')

    expect(wrapper.emitted('anterior')).toHaveLength(1)
    expect(wrapper.emitted('proxima')).toHaveLength(1)
  })

  it('enquanto carrega, os dois botões ficam desabilitados', () => {
    const wrapper = montar({ pagina: 2, temAnterior: true, temProxima: true, carregando: true })

    expect(botao(wrapper, 'Anterior').attributes('disabled')).toBeDefined()
    expect(botao(wrapper, 'Próxima').attributes('disabled')).toBeDefined()
  })
})
