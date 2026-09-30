import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import HistoricoTabela from '@/components/HistoricoTabela.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import type { Consulta } from '@/types/consulta'

const encontrada: Consulta = {
  id: 2,
  cep: '01001000',
  logradouro: 'Praça da Sé',
  bairro: 'Sé',
  cidade: 'São Paulo',
  status: 'encontrado',
  dataConsulta: '2026-09-29T21:02:48Z',
}

const inexistente: Consulta = {
  id: 1,
  cep: '59000000',
  logradouro: null,
  bairro: null,
  cidade: null,
  status: 'nao_encontrado',
  dataConsulta: '2026-09-29T21:00:10Z',
}

type Props = { items?: Consulta[]; carregando?: boolean; filtrado?: boolean }

const montar = (props: Props = {}) =>
  mount(HistoricoTabela, { props: { items: [], carregando: false, filtrado: false, ...props } })

const celulas = (linha: { findAll: (s: string) => { text: () => string }[] }) =>
  linha.findAll('td').map((td) => td.text())

describe('HistoricoTabela com consultas', () => {
  it('é uma tabela com legenda e colunas CEP, Endereço, Status e Data', () => {
    const wrapper = montar({ items: [encontrada] })

    expect(wrapper.get('caption').text()).toBe('Histórico de consultas')
    expect(wrapper.findAll('th[scope="col"]').map((th) => th.text())).toEqual([
      'CEP',
      'Endereço',
      'Status',
      'Data',
    ])
  })

  it('mostra uma linha por consulta, na ordem recebida', () => {
    const wrapper = montar({ items: [encontrada, inexistente] })

    expect(wrapper.findAll('tbody tr')).toHaveLength(2)
    expect(celulas(wrapper.findAll('tbody tr')[0]!)[0]).toBe('01001-000')
    expect(celulas(wrapper.findAll('tbody tr')[1]!)[0]).toBe('59000-000')
  })

  it('CEP encontrado mostra o endereço numa linha só, sem sobras de vírgula', () => {
    const wrapper = montar({ items: [encontrada] })

    expect(celulas(wrapper.get('tbody tr'))[1]).toBe('Praça da Sé, Sé, São Paulo')
  })

  it('ignora partes vazias do endereço (CEP único de cidade)', () => {
    const cidadeUnica = { ...encontrada, logradouro: '', bairro: '' }

    expect(celulas(montar({ items: [cidadeUnica] }).get('tbody tr'))[1]).toBe('São Paulo')
  })

  it('CEP inexistente não tem endereço e mostra um traço', () => {
    expect(celulas(montar({ items: [inexistente] }).get('tbody tr'))[1]).toBe('—')
  })

  it('cada linha mostra o status com o StatusBadge', () => {
    const badges = montar({ items: [encontrada, inexistente] }).findAllComponents(StatusBadge)

    expect(badges.map((b) => b.props('status'))).toEqual(['encontrado', 'nao_encontrado'])
  })

  it('a data aparece em pt-BR dentro de <time> com o instante original', () => {
    const tempo = montar({ items: [encontrada] }).get('tbody time')

    expect(tempo.attributes('datetime')).toBe('2026-09-29T21:02:48Z')
    expect(tempo.text()).toMatch(/^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}$/)
  })

  it('não mostra mensagem de vazio nem de carregamento', () => {
    const texto = montar({ items: [encontrada] }).text()

    expect(texto).not.toContain('Nenhuma consulta')
    expect(texto).not.toContain('Carregando')
  })
})

describe('HistoricoTabela sem consultas', () => {
  it('histórico vazio convida a fazer a primeira consulta', () => {
    const wrapper = montar({ items: [], filtrado: false })

    expect(wrapper.text()).toContain('Nenhuma consulta registrada ainda')
    expect(wrapper.find('tbody tr').exists()).toBe(false)
  })

  it('com filtro ativo, explica que nenhuma consulta tem aquele status', () => {
    expect(montar({ items: [], filtrado: true }).text()).toContain('Nenhuma consulta com esse status')
  })
})

describe('HistoricoTabela carregando', () => {
  it('sem itens ainda, avisa que está carregando em vez de dizer que está vazio', () => {
    const wrapper = montar({ items: [], carregando: true })

    expect(wrapper.text()).toContain('Carregando histórico')
    expect(wrapper.text()).not.toContain('Nenhuma consulta')
  })

  it('mantém os itens já exibidos durante a troca de página e sinaliza ocupado', () => {
    const wrapper = montar({ items: [encontrada], carregando: true })

    expect(wrapper.findAll('tbody tr')).toHaveLength(1)
    expect(wrapper.attributes('aria-busy')).toBe('true')
  })

  it('fora do carregamento não sinaliza ocupado', () => {
    expect(montar({ items: [encontrada] }).attributes('aria-busy')).not.toBe('true')
  })
})
