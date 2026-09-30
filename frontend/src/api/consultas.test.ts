import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError, consultarCep, listarHistorico } from '@/api/consultas'
import type { Historico } from '@/types/consulta'

const fetchMock = vi.fn<typeof fetch>()

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  fetchMock.mockReset()
  vi.unstubAllGlobals()
})

function responderJson(status: number, corpo: unknown) {
  fetchMock.mockResolvedValueOnce(
    new Response(JSON.stringify(corpo), {
      status,
      headers: { 'Content-Type': 'application/json' },
    }),
  )
}

/** Devolve o `ApiError` lançado pela promise (falha o teste se ela resolver ou lançar outra coisa). */
async function erroDe(promessa: Promise<unknown>): Promise<ApiError> {
  try {
    await promessa
  } catch (erro) {
    expect(erro).toBeInstanceOf(ApiError)
    return erro as ApiError
  }
  throw new Error('a promise deveria ter sido rejeitada')
}

const historicoVazio: Historico = {
  items: [],
  total: 0,
  limit: 50,
  offset: 0,
  resumo: { total: 0, encontrados: 0, naoEncontrados: 0 },
}

describe('consultarCep', () => {
  it('envia POST /api/consultas com o CEP só com dígitos', async () => {
    responderJson(200, { cep: '59000000' })

    await consultarCep('59000-000')

    const [url, opcoes] = fetchMock.mock.calls[0]!
    expect(url).toBe('/api/consultas')
    expect(opcoes?.method).toBe('POST')
    expect(new Headers(opcoes?.headers).get('Content-Type')).toBe('application/json')
    expect(JSON.parse(opcoes?.body as string)).toEqual({ cep: '59000000' })
  })

  it('devolve o endereço retornado pela API', async () => {
    const resposta = {
      cep: '01001000',
      logradouro: 'Praça da Sé',
      bairro: 'Sé',
      cidade: 'São Paulo',
      dataConsulta: '2026-09-29T21:02:48.548892Z',
    }
    responderJson(200, resposta)

    await expect(consultarCep('01001-000')).resolves.toEqual(resposta)
  })

  it.each([
    [404, 'CEP_NAO_ENCONTRADO', 'CEP não encontrado. Confira os números digitados.'],
    [422, 'CEP_INVALIDO', 'CEP inválido. Informe 8 dígitos.'],
    [422, 'REQUISICAO_INVALIDA', 'Requisição inválida.'],
    [502, 'VIACEP_INDISPONIVEL', 'O serviço de consulta de CEP está indisponível.'],
  ])('erro %i da API vira ApiError com o code %s e a mensagem da API', async (status, code, message) => {
    responderJson(status, { detail: { code, message } })

    const erro = await erroDe(consultarCep('99999999'))

    expect(erro.code).toBe(code)
    expect(erro.message).toBe(message)
    expect(erro.status).toBe(status)
  })

  it('resposta de erro fora do formato da API (ex.: 500 em HTML) vira ERRO_INESPERADO', async () => {
    fetchMock.mockResolvedValueOnce(new Response('<html>Bad Gateway</html>', { status: 500 }))

    const erro = await erroDe(consultarCep('59000000'))

    expect(erro.code).toBe('ERRO_INESPERADO')
    expect(erro.status).toBe(500)
    expect(erro.message).not.toContain('<html>')
    expect(erro.message.length).toBeGreaterThan(0)
  })

  it('falha de rede vira REDE_INDISPONIVEL com mensagem clara', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'))

    const erro = await erroDe(consultarCep('59000000'))

    expect(erro.code).toBe('REDE_INDISPONIVEL')
    expect(erro.status).toBeUndefined()
    expect(erro.message).toMatch(/conect/i)
  })
})

describe('listarHistorico', () => {
  it('sem filtros chama GET /api/consultas e devolve o envelope', async () => {
    responderJson(200, historicoVazio)

    const historico = await listarHistorico()

    const [url, opcoes] = fetchMock.mock.calls[0]!
    expect(url).toBe('/api/consultas')
    expect(opcoes?.method ?? 'GET').toBe('GET')
    expect(historico).toEqual(historicoVazio)
  })

  it('envia status, limit e offset como query string', async () => {
    responderJson(200, historicoVazio)

    await listarHistorico({ status: 'encontrado', limit: 10, offset: 20 })

    const url = new URL(fetchMock.mock.calls[0]![0] as string, 'http://localhost')
    expect(url.pathname).toBe('/api/consultas')
    expect(Object.fromEntries(url.searchParams)).toEqual({
      status: 'encontrado',
      limit: '10',
      offset: '20',
    })
  })

  it('não envia os parâmetros que não foram informados', async () => {
    responderJson(200, historicoVazio)

    await listarHistorico({ limit: 5 })

    const url = new URL(fetchMock.mock.calls[0]![0] as string, 'http://localhost')
    expect(Object.fromEntries(url.searchParams)).toEqual({ limit: '5' })
  })

  it('erro da API vira ApiError', async () => {
    responderJson(422, { detail: { code: 'REQUISICAO_INVALIDA', message: 'Requisição inválida.' } })

    const erro = await erroDe(listarHistorico({ limit: 0 }))

    expect(erro.code).toBe('REQUISICAO_INVALIDA')
    expect(erro.status).toBe(422)
  })

  it('falha de rede vira REDE_INDISPONIVEL', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'))

    const erro = await erroDe(listarHistorico())

    expect(erro.code).toBe('REDE_INDISPONIVEL')
  })
})
