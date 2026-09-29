import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import ConsultaForm from '@/components/ConsultaForm.vue'

type Props = { modelValue?: string; podeConsultar?: boolean; carregando?: boolean; invalido?: boolean }

function montar(props: Props = {}) {
  return mount(ConsultaForm, {
    props: { modelValue: '', podeConsultar: false, carregando: false, invalido: false, ...props },
  })
}

describe('campo de CEP', () => {
  it('tem um rótulo "CEP" associado ao campo', () => {
    const wrapper = montar()
    const input = wrapper.get('input')
    const rotulo = wrapper.get('label')

    expect(rotulo.text()).toBe('CEP')
    expect(input.attributes('id')).toBeTruthy()
    expect(rotulo.attributes('for')).toBe(input.attributes('id'))
  })

  it('pede teclado numérico e preenchimento de CEP, e limita o tamanho à máscara', () => {
    const input = montar().get('input')

    expect(input.attributes('inputmode')).toBe('numeric')
    expect(input.attributes('autocomplete')).toBe('postal-code')
    expect(input.attributes('maxlength')).toBe('9')
    expect(input.attributes('placeholder')).toBe('00000-000')
    expect(input.attributes('name')).toBe('cep')
  })

  it('mostra o valor recebido em modelValue', () => {
    const input = montar({ modelValue: '59000-000' }).get('input')

    expect((input.element as HTMLInputElement).value).toBe('59000-000')
  })

  it('aplica a máscara ao digitar: só dígitos e hífen automático', async () => {
    const wrapper = montar()
    const input = wrapper.get('input')

    await input.setValue('59000abc000')

    expect((input.element as HTMLInputElement).value).toBe('59000-000')
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['59000-000'])
  })

  it('não deixa letras aparecerem no campo, mesmo quando o valor pai não muda', async () => {
    const wrapper = montar({ modelValue: '59000' })
    const input = wrapper.get('input')

    await input.setValue('59000a')

    expect((input.element as HTMLInputElement).value).toBe('59000')
  })

  it('tem um texto de ajuda ligado ao campo', () => {
    const wrapper = montar()
    const idAjuda = wrapper.get('input').attributes('aria-describedby')!

    expect(idAjuda).toBeTruthy()
    expect(wrapper.get(`#${idAjuda}`).text()).toMatch(/número/i)
  })

  it('marca o campo como inválido quando invalido é verdadeiro', () => {
    expect(montar({ invalido: true }).get('input').attributes('aria-invalid')).toBe('true')
    expect(montar({ invalido: false }).get('input').attributes('aria-invalid')).not.toBe('true')
  })
})

describe('botão Consultar', () => {
  it('é o botão de envio do formulário e diz o que faz', () => {
    const botao = montar({ podeConsultar: true }).get('button')

    expect(botao.attributes('type')).toBe('submit')
    expect(botao.text()).toBe('Consultar')
  })

  it('fica desabilitado enquanto o CEP não está completo', () => {
    expect(montar({ podeConsultar: false }).get('button').attributes('disabled')).toBeDefined()
    expect(montar({ podeConsultar: true }).get('button').attributes('disabled')).toBeUndefined()
  })

  it('durante a consulta mostra "Consultando…", fica desabilitado e sinaliza ocupado', () => {
    const botao = montar({ podeConsultar: false, carregando: true }).get('button')

    expect(botao.text()).toBe('Consultando…')
    expect(botao.attributes('disabled')).toBeDefined()
    expect(botao.attributes('aria-busy')).toBe('true')
  })
})

describe('envio do formulário', () => {
  it('clicar no botão habilitado emite "consultar" uma vez', async () => {
    // O jsdom só envia formulários que estão no documento (como o navegador de verdade).
    const wrapper = mount(ConsultaForm, {
      props: { modelValue: '59000-000', podeConsultar: true, carregando: false },
      attachTo: document.body,
    })

    await wrapper.get('button').trigger('click')

    expect(wrapper.emitted('consultar')).toHaveLength(1)
    wrapper.unmount()
  })

  it('enviar o formulário (Enter no campo) emite "consultar"', async () => {
    const wrapper = montar({ modelValue: '59000-000', podeConsultar: true })

    await wrapper.get('form').trigger('submit')

    expect(wrapper.emitted('consultar')).toHaveLength(1)
  })

  it('não recarrega a página ao enviar', () => {
    const wrapper = montar({ podeConsultar: true })
    const evento = new Event('submit', { cancelable: true })

    wrapper.get('form').element.dispatchEvent(evento)

    expect(evento.defaultPrevented).toBe(true)
  })

  it('ignora o envio quando ainda não pode consultar (CEP incompleto ou consulta em andamento)', async () => {
    const incompleto = montar({ modelValue: '590', podeConsultar: false })
    const emAndamento = montar({ modelValue: '59000-000', podeConsultar: false, carregando: true })

    await incompleto.get('form').trigger('submit')
    await emAndamento.get('form').trigger('submit')

    expect(incompleto.emitted('consultar')).toBeUndefined()
    expect(emAndamento.emitted('consultar')).toBeUndefined()
  })
})
