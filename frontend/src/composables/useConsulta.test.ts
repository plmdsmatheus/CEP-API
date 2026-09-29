import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError, consultarCep } from '@/api/consultas'
import { useConsulta } from '@/composables/useConsulta'
import type { ResultadoConsulta } from '@/types/consulta'

// Só `consultarCep` é simulado; o `ApiError` continua real para os `instanceof` funcionarem.
vi.mock('@/api/consultas', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/api/consultas')>()),
  consultarCep: vi.fn(),
}))

const consultarCepMock = vi.mocked(consultarCep)

const praçaDaSé: ResultadoConsulta = {
  cep: '01001000',
  logradouro: 'Praça da Sé',
  bairro: 'Sé',
  cidade: 'São Paulo',
  dataConsulta: '2026-09-29T21:02:48.548892Z',
}

function pendente<T>() {
  let resolver!: (valor: T) => void
  let rejeitar!: (erro: unknown) => void
  const promessa = new Promise<T>((res, rej) => {
    resolver = res
    rejeitar = rej
  })
  return { promessa, resolver, rejeitar }
}

beforeEach(() => {
  consultarCepMock.mockReset()
})

describe('estado inicial e campo de CEP', () => {
  it('começa vazio, sem resultado, sem erro e sem permitir consulta', () => {
    const c = useConsulta()

    expect(c.cep.value).toBe('')
    expect(c.resultado.value).toBeNull()
    expect(c.erro.value).toBeNull()
    expect(c.carregando.value).toBe(false)
    expect(c.podeConsultar.value).toBe(false)
  })

  it('atualizarCep aplica a máscara (só dígitos, hífen automático)', () => {
    const c = useConsulta()

    c.atualizarCep('59000abc000')

    expect(c.cep.value).toBe('59000-000')
  })

  it('só permite consultar com o CEP completo', () => {
    const c = useConsulta()

    c.atualizarCep('59000-00')
    expect(c.podeConsultar.value).toBe(false)

    c.atualizarCep('59000-000')
    expect(c.podeConsultar.value).toBe(true)
  })
})

describe('consultar', () => {
  it('com CEP incompleto não chama a API e mostra erro de CEP inválido', async () => {
    const c = useConsulta()
    c.atualizarCep('123')

    await c.consultar()

    expect(consultarCepMock).not.toHaveBeenCalled()
    expect(c.erro.value?.code).toBe('CEP_INVALIDO')
    expect(c.erro.value?.message).toMatch(/8 dígitos/)
  })

  it('com sucesso guarda o resultado e limpa o erro', async () => {
    consultarCepMock.mockResolvedValueOnce(praçaDaSé)
    const c = useConsulta()
    c.atualizarCep('01001000')

    await c.consultar()

    expect(consultarCepMock).toHaveBeenCalledWith('01001-000')
    expect(c.resultado.value).toEqual(praçaDaSé)
    expect(c.erro.value).toBeNull()
    expect(c.carregando.value).toBe(false)
  })

  it('fica carregando enquanto a API responde e não permite outra consulta', async () => {
    const chamada = pendente<ResultadoConsulta>()
    consultarCepMock.mockReturnValueOnce(chamada.promessa)
    const c = useConsulta()
    c.atualizarCep('01001000')

    const emAndamento = c.consultar()

    expect(c.carregando.value).toBe(true)
    expect(c.podeConsultar.value).toBe(false)

    chamada.resolver(praçaDaSé)
    await emAndamento

    expect(c.carregando.value).toBe(false)
    expect(c.podeConsultar.value).toBe(true)
  })

  it('ignora consultas repetidas enquanto uma está em andamento', async () => {
    const chamada = pendente<ResultadoConsulta>()
    consultarCepMock.mockReturnValueOnce(chamada.promessa)
    const c = useConsulta()
    c.atualizarCep('01001000')

    const primeira = c.consultar()
    const segunda = c.consultar()
    chamada.resolver(praçaDaSé)
    await Promise.all([primeira, segunda])

    expect(consultarCepMock).toHaveBeenCalledTimes(1)
  })

  it('erro da API guarda code e mensagem e não deixa resultado', async () => {
    consultarCepMock.mockRejectedValueOnce(
      new ApiError('CEP_NAO_ENCONTRADO', 'CEP não encontrado. Confira os números.', 404),
    )
    const c = useConsulta()
    c.atualizarCep('99999999')

    await c.consultar()

    expect(c.erro.value?.code).toBe('CEP_NAO_ENCONTRADO')
    expect(c.erro.value?.message).toBe('CEP não encontrado. Confira os números.')
    expect(c.resultado.value).toBeNull()
    expect(c.carregando.value).toBe(false)
  })

  it('falha que não é ApiError vira ERRO_INESPERADO com mensagem amigável', async () => {
    consultarCepMock.mockRejectedValueOnce(new Error('boom interno'))
    const c = useConsulta()
    c.atualizarCep('01001000')

    await c.consultar()

    expect(c.erro.value?.code).toBe('ERRO_INESPERADO')
    expect(c.erro.value?.message).not.toContain('boom')
    expect(c.carregando.value).toBe(false)
  })

  it('uma nova consulta descarta o resultado e o erro da anterior', async () => {
    consultarCepMock.mockResolvedValueOnce(praçaDaSé)
    consultarCepMock.mockRejectedValueOnce(
      new ApiError('VIACEP_INDISPONIVEL', 'Serviço indisponível.', 502),
    )
    consultarCepMock.mockResolvedValueOnce(praçaDaSé)
    const c = useConsulta()
    c.atualizarCep('01001000')

    await c.consultar()
    expect(c.resultado.value).not.toBeNull()

    await c.consultar()
    expect(c.resultado.value).toBeNull()
    expect(c.erro.value?.code).toBe('VIACEP_INDISPONIVEL')

    await c.consultar()
    expect(c.erro.value).toBeNull()
    expect(c.resultado.value).toEqual(praçaDaSé)
  })
})

describe('aoConsultar (avisa que o histórico mudou)', () => {
  it('é chamado quando o CEP é encontrado', async () => {
    consultarCepMock.mockResolvedValueOnce(praçaDaSé)
    const aoConsultar = vi.fn()
    const c = useConsulta({ aoConsultar })
    c.atualizarCep('01001000')

    await c.consultar()

    expect(aoConsultar).toHaveBeenCalledTimes(1)
  })

  it('é chamado quando o CEP não existe, porque essa consulta também é gravada', async () => {
    consultarCepMock.mockRejectedValueOnce(new ApiError('CEP_NAO_ENCONTRADO', 'Não encontrado.', 404))
    const aoConsultar = vi.fn()
    const c = useConsulta({ aoConsultar })
    c.atualizarCep('99999999')

    await c.consultar()

    expect(aoConsultar).toHaveBeenCalledTimes(1)
  })

  it.each([
    ['CEP_INVALIDO', 422],
    ['REQUISICAO_INVALIDA', 422],
    ['VIACEP_INDISPONIVEL', 502],
    ['REDE_INDISPONIVEL', undefined],
    ['ERRO_INESPERADO', 500],
  ])('não é chamado no erro %s, que não grava no histórico', async (code, status) => {
    consultarCepMock.mockRejectedValueOnce(new ApiError(code, 'Falhou.', status))
    const aoConsultar = vi.fn()
    const c = useConsulta({ aoConsultar })
    c.atualizarCep('01001000')

    await c.consultar()

    expect(aoConsultar).not.toHaveBeenCalled()
  })

  it('não é chamado quando o CEP incompleto nem chega à API', async () => {
    const aoConsultar = vi.fn()
    const c = useConsulta({ aoConsultar })
    c.atualizarCep('123')

    await c.consultar()

    expect(aoConsultar).not.toHaveBeenCalled()
  })
})
