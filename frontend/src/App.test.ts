import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from '@/App.vue'
import type { Consulta } from '@/types/consulta'

// --- Backend falso: guarda as consultas em memória e responde como a API de verdade ---------

const ERRO_NAO_ENCONTRADO = {
  code: 'CEP_NAO_ENCONTRADO',
  message: 'CEP não encontrado. Confira os números digitados e tente novamente.',
}
const ERRO_VIACEP = {
  code: 'VIACEP_INDISPONIVEL',
  message: 'O serviço de consulta de CEP está indisponível no momento. Tente novamente em instantes.',
}

function consultaSalva(id: number, sobrescritas: Partial<Consulta> = {}): Consulta {
  return {
    id,
    cep: '01001000',
    logradouro: 'Praça da Sé',
    bairro: 'Sé',
    cidade: 'São Paulo',
    status: 'encontrado',
    dataConsulta: '2026-09-29T21:02:48Z',
    ...sobrescritas,
  }
}

function criarBackend(inicial: Consulta[] = []) {
  const estado = { consultas: [...inicial], viaCepFora: false, historicoForaDoAr: false }
  const chamadas: { metodo: string; caminho: string }[] = []

  const json = (status: number, corpo: unknown) =>
    new Response(JSON.stringify(corpo), { status, headers: { 'Content-Type': 'application/json' } })

  const fetchFalso = vi.fn(async (entrada: RequestInfo | URL, opcoes?: RequestInit) => {
    const url = new URL(String(entrada), 'http://localhost')
    const metodo = opcoes?.method ?? 'GET'
    chamadas.push({ metodo, caminho: url.pathname + url.search })

    if (metodo === 'POST') {
      const { cep } = JSON.parse(opcoes!.body as string) as { cep: string }
      if (estado.viaCepFora) return json(502, { detail: ERRO_VIACEP })

      const id = estado.consultas.length + 1
      if (cep === '01001000') {
        const salva = consultaSalva(id)
        estado.consultas.push(salva)
        return json(200, {
          cep: salva.cep,
          logradouro: salva.logradouro,
          bairro: salva.bairro,
          cidade: salva.cidade,
          dataConsulta: salva.dataConsulta,
        })
      }
      estado.consultas.push(
        consultaSalva(id, { cep, logradouro: null, bairro: null, cidade: null, status: 'nao_encontrado' }),
      )
      return json(404, { detail: ERRO_NAO_ENCONTRADO })
    }

    if (estado.historicoForaDoAr) throw new TypeError('Failed to fetch')

    const status = url.searchParams.get('status')
    const limit = Number(url.searchParams.get('limit') ?? 50)
    const offset = Number(url.searchParams.get('offset') ?? 0)
    const filtradas = [...estado.consultas].reverse().filter((c) => !status || c.status === status)
    const encontrados = estado.consultas.filter((c) => c.status === 'encontrado').length
    return json(200, {
      items: filtradas.slice(offset, offset + limit),
      total: filtradas.length,
      limit,
      offset,
      resumo: {
        total: estado.consultas.length,
        encontrados,
        naoEncontrados: estado.consultas.length - encontrados,
      },
    })
  })

  return { estado, chamadas, fetchFalso, gets: () => chamadas.filter((c) => c.metodo === 'GET') }
}

// --- Auxiliares de tela ----------------------------------------------------------------------

async function abrir(backend: ReturnType<typeof criarBackend>) {
  vi.stubGlobal('fetch', backend.fetchFalso)
  const wrapper = mount(App)
  await flushPromises()
  return wrapper
}

async function consultar(wrapper: VueWrapper, cep: string) {
  await wrapper.get('input[name="cep"]').setValue(cep)
  await wrapper.get('form').trigger('submit')
  await flushPromises()
}

async function clicar(wrapper: VueWrapper, textoDoBotao: string) {
  const botao = wrapper.findAll('button, [role="radio"]').find((b) => b.text() === textoDoBotao)
  expect(botao, `botão "${textoDoBotao}"`).toBeDefined()
  await botao!.trigger('click')
  await flushPromises()
}

function resumoDe(wrapper: VueWrapper) {
  return wrapper
    .get('[aria-label="Resumo do histórico"]')
    .findAll('dt')
    .map((dt) => [dt.text(), dt.element.nextElementSibling?.textContent?.trim()])
}

const linhas = (wrapper: VueWrapper) => wrapper.findAll('tbody tr')

beforeEach(() => {
  document.documentElement.classList.remove('dark')
})

afterEach(() => {
  vi.unstubAllGlobals()
})

// --- Testes ------------------------------------------------------------------------------------

describe('página ao abrir', () => {
  it('tem o título da página e o formulário com o botão desabilitado', async () => {
    const wrapper = await abrir(criarBackend())

    expect(wrapper.get('h1').text()).toBe('Consulta de CEP')
    expect(wrapper.find('input[name="cep"]').exists()).toBe(true)
    expect(wrapper.get('button[type="submit"]').attributes('disabled')).toBeDefined()
  })

  it('carrega a primeira página do histórico, 10 itens por vez', async () => {
    const backend = criarBackend()

    await abrir(backend)

    expect(backend.gets()).toHaveLength(1)
    const url = new URL(backend.gets()[0]!.caminho, 'http://localhost')
    expect(url.pathname).toBe('/api/consultas')
    expect(url.searchParams.get('limit')).toBe('10')
    expect(url.searchParams.get('offset')).toBe('0')
  })

  it('histórico vazio: resumo zerado e convite para a primeira consulta', async () => {
    const wrapper = await abrir(criarBackend())

    expect(resumoDe(wrapper)).toEqual([
      ['Consultas', '0'],
      ['Encontrados', '0'],
      ['Não encontrados', '0'],
    ])
    expect(wrapper.text()).toContain('Nenhuma consulta registrada ainda')
  })

  it('com consultas gravadas mostra a tabela e o resumo', async () => {
    const backend = criarBackend([
      consultaSalva(1),
      consultaSalva(2, { cep: '59000000', logradouro: null, bairro: null, cidade: null, status: 'nao_encontrado' }),
    ])

    const wrapper = await abrir(backend)

    expect(linhas(wrapper)).toHaveLength(2)
    expect(linhas(wrapper)[0]!.text()).toContain('59000-000') // a mais recente primeiro
    expect(resumoDe(wrapper)).toEqual([
      ['Consultas', '2'],
      ['Encontrados', '1'],
      ['Não encontrados', '1'],
    ])
  })
})

describe('consultar um CEP', () => {
  it('CEP encontrado: mostra o endereço e o histórico ganha a nova linha', async () => {
    const backend = criarBackend()
    const wrapper = await abrir(backend)

    await wrapper.get('input[name="cep"]').setValue('01001000')
    expect((wrapper.get('input[name="cep"]').element as HTMLInputElement).value).toBe('01001-000')
    expect(wrapper.get('button[type="submit"]').attributes('disabled')).toBeUndefined()

    await wrapper.get('form').trigger('submit')
    await flushPromises()

    const resultado = wrapper.get('[aria-label="Endereço encontrado"]')
    expect(resultado.text()).toContain('Praça da Sé')
    expect(resultado.text()).toContain('01001-000')
    expect(linhas(wrapper)).toHaveLength(1)
    expect(resumoDe(wrapper)[0]).toEqual(['Consultas', '1'])
    expect(backend.gets()).toHaveLength(2) // abertura + recarga depois da consulta
  })

  it('CEP inexistente: aviso claro, sem cartão de endereço, e a consulta entra no histórico', async () => {
    const wrapper = await abrir(criarBackend())

    await consultar(wrapper, '59000000')

    const aviso = wrapper.get('[data-tipo="nao-encontrado"]')
    expect(aviso.attributes('role')).toBe('status')
    expect(aviso.text()).toContain('CEP não encontrado')
    expect(wrapper.find('[aria-label="Endereço encontrado"]').exists()).toBe(false)
    expect(linhas(wrapper)).toHaveLength(1)
    expect(linhas(wrapper)[0]!.text()).toContain('Não encontrado')
    expect(resumoDe(wrapper)).toContainEqual(['Não encontrados', '1'])
  })

  it('a consulta seguinte troca o resultado anterior pelo novo', async () => {
    const wrapper = await abrir(criarBackend())
    await consultar(wrapper, '01001000')
    expect(wrapper.find('[aria-label="Endereço encontrado"]').exists()).toBe(true)

    await consultar(wrapper, '59000000')

    expect(wrapper.find('[aria-label="Endereço encontrado"]').exists()).toBe(false)
    expect(wrapper.find('[data-tipo="nao-encontrado"]').exists()).toBe(true)
    expect(linhas(wrapper)).toHaveLength(2)
  })

  it('ViaCEP fora do ar: erro claro com "Tentar novamente", sem mexer no histórico', async () => {
    const backend = criarBackend()
    const wrapper = await abrir(backend)
    backend.estado.viaCepFora = true

    await consultar(wrapper, '01001000')

    const erro = wrapper.get('[data-tipo="indisponivel"]')
    expect(erro.attributes('role')).toBe('alert')
    expect(erro.text()).toContain('Serviço de CEP indisponível')
    expect(linhas(wrapper)).toHaveLength(0)
    expect(backend.gets()).toHaveLength(1) // não recarregou: nada foi gravado
  })

  it('"Tentar novamente" repete a consulta e, com o serviço de volta, mostra o endereço', async () => {
    const backend = criarBackend()
    const wrapper = await abrir(backend)
    backend.estado.viaCepFora = true
    await consultar(wrapper, '01001000')

    backend.estado.viaCepFora = false
    await clicar(wrapper, 'Tentar novamente')

    expect(wrapper.find('[data-tipo="indisponivel"]').exists()).toBe(false)
    expect(wrapper.get('[aria-label="Endereço encontrado"]').text()).toContain('Praça da Sé')
    expect(linhas(wrapper)).toHaveLength(1)
  })

  it('CEP incompleto não envia nada ao servidor', async () => {
    const backend = criarBackend()
    const wrapper = await abrir(backend)

    await consultar(wrapper, '590')

    expect(backend.chamadas.filter((c) => c.metodo === 'POST')).toHaveLength(0)
  })
})

describe('histórico: filtro e paginação', () => {
  const misto = () => [
    consultaSalva(1),
    consultaSalva(2, { cep: '59000000', logradouro: null, bairro: null, cidade: null, status: 'nao_encontrado' }),
    consultaSalva(3),
  ]

  it('filtrar por status pede só aquele status e mantém o resumo do histórico inteiro', async () => {
    const backend = criarBackend(misto())
    const wrapper = await abrir(backend)

    await clicar(wrapper, 'Não encontrados')

    const url = new URL(backend.gets().at(-1)!.caminho, 'http://localhost')
    expect(url.searchParams.get('status')).toBe('nao_encontrado')
    expect(linhas(wrapper)).toHaveLength(1)
    expect(resumoDe(wrapper)).toEqual([
      ['Consultas', '3'],
      ['Encontrados', '2'],
      ['Não encontrados', '1'],
    ])
  })

  it('filtro sem resultados explica que nenhuma consulta tem aquele status', async () => {
    const backend = criarBackend([consultaSalva(1)])
    const wrapper = await abrir(backend)

    await clicar(wrapper, 'Não encontrados')

    expect(wrapper.text()).toContain('Nenhuma consulta com esse status')
  })

  it('com mais de 10 consultas, "Próxima" busca a página seguinte', async () => {
    const backend = criarBackend(Array.from({ length: 25 }, (_, i) => consultaSalva(i + 1)))
    const wrapper = await abrir(backend)
    expect(linhas(wrapper)).toHaveLength(10)
    expect(wrapper.text()).toContain('Página 1 de 3')

    await clicar(wrapper, 'Próxima')

    const url = new URL(backend.gets().at(-1)!.caminho, 'http://localhost')
    expect(url.searchParams.get('offset')).toBe('10')
    expect(wrapper.text()).toContain('Página 2 de 3')
  })

  it('uma consulta nova volta o histórico para a primeira página', async () => {
    const backend = criarBackend(Array.from({ length: 25 }, (_, i) => consultaSalva(i + 1)))
    const wrapper = await abrir(backend)
    await clicar(wrapper, 'Próxima')

    await consultar(wrapper, '01001000')

    expect(wrapper.text()).toContain('Página 1 de 3')
    expect(new URL(backend.gets().at(-1)!.caminho, 'http://localhost').searchParams.get('offset')).toBe('0')
  })

  it('falha ao carregar o histórico mostra o erro e "Tentar novamente" o recupera', async () => {
    const backend = criarBackend([consultaSalva(1)])
    backend.estado.historicoForaDoAr = true
    const wrapper = await abrir(backend)

    const erro = wrapper.get('[data-tipo="indisponivel"]')
    expect(erro.text()).toContain('Sem conexão com o servidor')

    backend.estado.historicoForaDoAr = false
    await clicar(wrapper, 'Tentar novamente')

    expect(wrapper.find('[data-tipo="indisponivel"]').exists()).toBe(false)
    expect(linhas(wrapper)).toHaveLength(1)
  })
})
