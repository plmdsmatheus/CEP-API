import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import AlertaConsulta from '@/components/AlertaConsulta.vue'

const montar = (code: string, message = 'Mensagem do servidor.') =>
  mount(AlertaConsulta, { props: { erro: { code, message } } })

describe('AlertaConsulta: cada situação tem título, tipo e papel próprios', () => {
  it.each([
    ['CEP_NAO_ENCONTRADO', 'nao-encontrado', 'status', 'CEP não encontrado'],
    ['CEP_INVALIDO', 'invalido', 'status', 'CEP inválido'],
    ['REQUISICAO_INVALIDA', 'invalido', 'status', 'Requisição inválida'],
    ['VIACEP_INDISPONIVEL', 'indisponivel', 'alert', 'Serviço de CEP indisponível'],
    ['REDE_INDISPONIVEL', 'indisponivel', 'alert', 'Sem conexão com o servidor'],
    ['ERRO_INESPERADO', 'inesperado', 'alert', 'Algo deu errado'],
    ['CODIGO_QUE_NAO_EXISTE', 'inesperado', 'alert', 'Algo deu errado'],
  ])('%s → tipo %s, role %s, título "%s"', (code, tipo, role, titulo) => {
    const wrapper = montar(code)

    expect(wrapper.attributes('data-tipo')).toBe(tipo)
    expect(wrapper.attributes('role')).toBe(role)
    expect(wrapper.text()).toContain(titulo)
  })

  it('mostra a mensagem vinda do servidor', () => {
    const wrapper = montar('CEP_NAO_ENCONTRADO', 'CEP não encontrado. Confira os números digitados.')

    expect(wrapper.text()).toContain('CEP não encontrado. Confira os números digitados.')
  })

  it('tem um ícone decorativo (o significado está no texto, não só na cor ou no desenho)', () => {
    const icone = montar('CEP_NAO_ENCONTRADO').get('svg')

    expect(icone.attributes('aria-hidden')).toBe('true')
  })
})

describe('AlertaConsulta: tentar novamente', () => {
  it.each(['VIACEP_INDISPONIVEL', 'REDE_INDISPONIVEL', 'ERRO_INESPERADO'])(
    'em %s (falha passageira) oferece "Tentar novamente", que emite o evento',
    async (code) => {
      const wrapper = montar(code)

      await wrapper.get('button').trigger('click')

      expect(wrapper.get('button').text()).toBe('Tentar novamente')
      expect(wrapper.emitted('tentarNovamente')).toHaveLength(1)
    },
  )

  it.each(['CEP_NAO_ENCONTRADO', 'CEP_INVALIDO', 'REQUISICAO_INVALIDA'])(
    'em %s o usuário precisa mudar o CEP, então não há botão de repetir',
    (code) => {
      expect(montar(code).find('button').exists()).toBe(false)
    },
  )
})
