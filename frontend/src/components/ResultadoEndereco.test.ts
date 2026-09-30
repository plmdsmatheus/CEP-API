import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import ReguaRegioes from '@/components/ReguaRegioes.vue'
import ResultadoEndereco from '@/components/ResultadoEndereco.vue'
import type { ResultadoConsulta } from '@/types/consulta'

const praçaDaSé: ResultadoConsulta = {
  cep: '01001000',
  logradouro: 'Praça da Sé',
  bairro: 'Sé',
  cidade: 'São Paulo',
  dataConsulta: '2026-09-29T21:02:48.548892Z',
}

const montar = (resultado: ResultadoConsulta = praçaDaSé) =>
  mount(ResultadoEndereco, { props: { resultado } })

describe('ResultadoEndereco', () => {
  it('é uma região nomeada "Endereço encontrado"', () => {
    const wrapper = montar()

    expect(wrapper.attributes('aria-label')).toBe('Endereço encontrado')
  })

  it('mostra o CEP com a máscara, em destaque', () => {
    expect(montar().text()).toContain('01001-000')
  })

  it('mostra logradouro, bairro e cidade, cada um com seu rótulo', () => {
    const itens = montar()
      .findAll('dt')
      .map((dt) => [dt.text(), dt.element.nextElementSibling?.textContent?.trim()])

    expect(itens).toEqual([
      ['Logradouro', 'Praça da Sé'],
      ['Bairro', 'Sé'],
      ['Cidade', 'São Paulo'],
    ])
  })

  it('CEP único de cidade (logradouro e bairro vazios) mostra "Não informado", não um campo em branco', () => {
    const itens = montar({ ...praçaDaSé, logradouro: '', bairro: '' })
      .findAll('dt')
      .map((dt) => [dt.text(), dt.element.nextElementSibling?.textContent?.trim()])

    expect(itens).toEqual([
      ['Logradouro', 'Não informado'],
      ['Bairro', 'Não informado'],
      ['Cidade', 'São Paulo'],
    ])
  })

  it('mostra quando a consulta foi registrada, em pt-BR, com o instante original no <time>', () => {
    const tempo = montar().get('time')

    expect(tempo.attributes('datetime')).toBe('2026-09-29T21:02:48.548892Z')
    expect(tempo.text()).toMatch(/^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}$/)
  })

  it('inclui a régua das regiões postais com o CEP consultado', () => {
    const regua = montar().findComponent(ReguaRegioes)

    expect(regua.exists()).toBe(true)
    expect(regua.props('cep')).toBe('01001000')
  })
})
