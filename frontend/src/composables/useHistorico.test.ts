import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError, listarHistorico } from '@/api/consultas'
import { TAMANHO_PAGINA, useHistorico } from '@/composables/useHistorico'
import type { Consulta, Historico } from '@/types/consulta'

// Só `listarHistorico` é simulado; o `ApiError` continua real.
vi.mock('@/api/consultas', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/api/consultas')>()),
  listarHistorico: vi.fn(),
}))

const listarHistoricoMock = vi.mocked(listarHistorico)

function consulta(id: number, cep = '01001000'): Consulta {
  return {
    id,
    cep,
    logradouro: 'Praça da Sé',
    bairro: 'Sé',
    cidade: 'São Paulo',
    status: 'encontrado',
    dataConsulta: '2026-09-29T21:02:48Z',
  }
}

function historico(sobrescritas: Partial<Historico> = {}): Historico {
  return {
    items: [consulta(2), consulta(1)],
    total: 2,
    limit: 10,
    offset: 0,
    resumo: { total: 2, encontrados: 2, naoEncontrados: 0 },
    ...sobrescritas,
  }
}

function pendente<T>() {
  let resolver!: (valor: T) => void
  const promessa = new Promise<T>((res) => {
    resolver = res
  })
  return { promessa, resolver }
}

beforeEach(() => {
  listarHistoricoMock.mockReset()
})

describe('estado inicial', () => {
  it('começa vazio, na primeira página e com o filtro "todos"', () => {
    const h = useHistorico()

    expect(h.items.value).toEqual([])
    expect(h.total.value).toBe(0)
    expect(h.resumo.value).toEqual({ total: 0, encontrados: 0, naoEncontrados: 0 })
    expect(h.filtro.value).toBe('todos')
    expect(h.pagina.value).toBe(1)
    expect(h.totalPaginas.value).toBe(1)
    expect(h.temProxima.value).toBe(false)
    expect(h.temAnterior.value).toBe(false)
    expect(h.carregando.value).toBe(false)
    expect(h.erro.value).toBeNull()
  })

  it('usa páginas de 10 itens', () => {
    expect(TAMANHO_PAGINA).toBe(10)
  })
})

describe('carregar', () => {
  it('busca a primeira página sem filtro de status e guarda itens, total e resumo', async () => {
    const dados = historico()
    listarHistoricoMock.mockResolvedValueOnce(dados)
    const h = useHistorico()

    await h.carregar()

    expect(listarHistoricoMock).toHaveBeenCalledWith({ limit: 10, offset: 0 })
    expect(h.items.value).toEqual(dados.items)
    expect(h.total.value).toBe(2)
    expect(h.resumo.value).toEqual(dados.resumo)
    expect(h.carregando.value).toBe(false)
    expect(h.erro.value).toBeNull()
  })

  it('fica carregando enquanto a API responde', async () => {
    const chamada = pendente<Historico>()
    listarHistoricoMock.mockReturnValueOnce(chamada.promessa)
    const h = useHistorico()

    const emAndamento = h.carregar()
    expect(h.carregando.value).toBe(true)

    chamada.resolver(historico())
    await emAndamento
    expect(h.carregando.value).toBe(false)
  })

  it('erro da API guarda o erro, mantém os itens já exibidos e o próximo sucesso limpa o erro', async () => {
    listarHistoricoMock.mockResolvedValueOnce(historico())
    listarHistoricoMock.mockRejectedValueOnce(new ApiError('REDE_INDISPONIVEL', 'Sem conexão.'))
    listarHistoricoMock.mockResolvedValueOnce(historico())
    const h = useHistorico()

    await h.carregar()
    await h.carregar()
    expect(h.erro.value?.code).toBe('REDE_INDISPONIVEL')
    expect(h.items.value).toHaveLength(2)
    expect(h.carregando.value).toBe(false)

    await h.carregar()
    expect(h.erro.value).toBeNull()
  })

  it('falha que não é ApiError vira ERRO_INESPERADO', async () => {
    listarHistoricoMock.mockRejectedValueOnce(new Error('boom interno'))
    const h = useHistorico()

    await h.carregar()

    expect(h.erro.value?.code).toBe('ERRO_INESPERADO')
    expect(h.erro.value?.message).not.toContain('boom')
  })
})

describe('paginação', () => {
  it('calcula páginas a partir do total', async () => {
    listarHistoricoMock.mockResolvedValue(historico({ total: 25 }))
    const h = useHistorico()

    await h.carregar()

    expect(h.pagina.value).toBe(1)
    expect(h.totalPaginas.value).toBe(3)
    expect(h.temProxima.value).toBe(true)
    expect(h.temAnterior.value).toBe(false)
  })

  it('irParaProxima e irParaAnterior andam de 10 em 10 e param nas pontas', async () => {
    listarHistoricoMock.mockResolvedValue(historico({ total: 25 }))
    const h = useHistorico()
    await h.carregar()

    await h.irParaProxima()
    expect(listarHistoricoMock).toHaveBeenLastCalledWith({ limit: 10, offset: 10 })
    expect(h.pagina.value).toBe(2)

    await h.irParaProxima()
    expect(listarHistoricoMock).toHaveBeenLastCalledWith({ limit: 10, offset: 20 })
    expect(h.pagina.value).toBe(3)
    expect(h.temProxima.value).toBe(false)

    listarHistoricoMock.mockClear()
    await h.irParaProxima() // já está na última: não faz nada
    expect(listarHistoricoMock).not.toHaveBeenCalled()

    await h.irParaAnterior()
    expect(listarHistoricoMock).toHaveBeenLastCalledWith({ limit: 10, offset: 10 })
    await h.irParaAnterior()
    expect(h.pagina.value).toBe(1)

    listarHistoricoMock.mockClear()
    await h.irParaAnterior() // já está na primeira: não faz nada
    expect(listarHistoricoMock).not.toHaveBeenCalled()
  })
})

describe('filtro por status', () => {
  it('filtrar volta para a primeira página e envia o status', async () => {
    listarHistoricoMock.mockResolvedValue(historico({ total: 25 }))
    const h = useHistorico()
    await h.carregar()
    await h.irParaProxima()

    await h.filtrar('encontrado')

    expect(listarHistoricoMock).toHaveBeenLastCalledWith({
      status: 'encontrado',
      limit: 10,
      offset: 0,
    })
    expect(h.filtro.value).toBe('encontrado')
    expect(h.pagina.value).toBe(1)
  })

  it('o filtro "todos" não envia status', async () => {
    listarHistoricoMock.mockResolvedValue(historico())
    const h = useHistorico()
    await h.filtrar('nao_encontrado')

    await h.filtrar('todos')

    expect(listarHistoricoMock).toHaveBeenLastCalledWith({ limit: 10, offset: 0 })
    expect(h.filtro.value).toBe('todos')
  })

  it('a paginação continua respeitando o filtro escolhido', async () => {
    listarHistoricoMock.mockResolvedValue(historico({ total: 25 }))
    const h = useHistorico()
    await h.filtrar('nao_encontrado')

    await h.irParaProxima()

    expect(listarHistoricoMock).toHaveBeenLastCalledWith({
      status: 'nao_encontrado',
      limit: 10,
      offset: 10,
    })
  })
})

describe('recarregar (depois de uma nova consulta)', () => {
  it('volta para a primeira página mantendo o filtro', async () => {
    listarHistoricoMock.mockResolvedValue(historico({ total: 25 }))
    const h = useHistorico()
    await h.filtrar('encontrado')
    await h.irParaProxima()

    await h.recarregar()

    expect(listarHistoricoMock).toHaveBeenLastCalledWith({
      status: 'encontrado',
      limit: 10,
      offset: 0,
    })
    expect(h.pagina.value).toBe(1)
    expect(h.filtro.value).toBe('encontrado')
  })
})

describe('respostas fora de ordem', () => {
  it('ignora a resposta antiga quando uma busca mais nova já foi feita', async () => {
    const antiga = pendente<Historico>()
    const nova = pendente<Historico>()
    listarHistoricoMock.mockReturnValueOnce(antiga.promessa)
    listarHistoricoMock.mockReturnValueOnce(nova.promessa)
    const h = useHistorico()

    const primeira = h.filtrar('encontrado')
    const segunda = h.filtrar('nao_encontrado')
    nova.resolver(historico({ items: [consulta(9, '99999999')], total: 1 }))
    await segunda
    antiga.resolver(historico({ items: [consulta(1), consulta(2)], total: 2 }))
    await primeira

    expect(h.items.value.map((c) => c.id)).toEqual([9])
    expect(h.total.value).toBe(1)
    expect(h.carregando.value).toBe(false)
  })
})
