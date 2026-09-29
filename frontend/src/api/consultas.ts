import { somenteDigitos } from '@/utils/cep'
import type { FiltrosHistorico, Historico, ResultadoConsulta } from '@/types/consulta'

const URL_CONSULTAS = '/api/consultas'

const MENSAGEM_REDE =
  'Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.'
export const MENSAGEM_INESPERADA = 'Ocorreu um erro inesperado. Tente novamente em instantes.'

/** Erro da API (`code` e `message` vêm do backend) ou de comunicação com ela. */
export class ApiError extends Error {
  readonly code: string
  readonly status?: number

  constructor(code: string, message: string, status?: number) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.status = status
  }
}

/** Lê o corpo de erro padrão `{ detail: { code, message } }`; devolve null se não estiver nesse formato. */
async function lerErroDaApi(resposta: Response): Promise<{ code: string; message: string } | null> {
  try {
    const { detail } = await resposta.json()
    if (typeof detail?.code === 'string' && typeof detail?.message === 'string') {
      return { code: detail.code, message: detail.message }
    }
  } catch {
    // corpo vazio ou que não é JSON (ex.: página de erro do proxy)
  }
  return null
}

async function requisitar<T>(url: string, opcoes?: RequestInit): Promise<T> {
  let resposta: Response
  try {
    resposta = await fetch(url, opcoes)
  } catch {
    throw new ApiError('REDE_INDISPONIVEL', MENSAGEM_REDE)
  }

  if (!resposta.ok) {
    const erro = await lerErroDaApi(resposta)
    throw new ApiError(
      erro?.code ?? 'ERRO_INESPERADO',
      erro?.message ?? MENSAGEM_INESPERADA,
      resposta.status,
    )
  }

  try {
    return (await resposta.json()) as T
  } catch {
    throw new ApiError('ERRO_INESPERADO', MENSAGEM_INESPERADA, resposta.status)
  }
}

export function consultarCep(cep: string): Promise<ResultadoConsulta> {
  return requisitar<ResultadoConsulta>(URL_CONSULTAS, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cep: somenteDigitos(cep) }),
  })
}

export function listarHistorico(filtros: FiltrosHistorico = {}): Promise<Historico> {
  const parametros = new URLSearchParams()
  if (filtros.status !== undefined) parametros.set('status', filtros.status)
  if (filtros.limit !== undefined) parametros.set('limit', String(filtros.limit))
  if (filtros.offset !== undefined) parametros.set('offset', String(filtros.offset))

  const query = parametros.toString()
  return requisitar<Historico>(query ? `${URL_CONSULTAS}?${query}` : URL_CONSULTAS)
}
