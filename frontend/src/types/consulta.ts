export type StatusConsulta = 'encontrado' | 'nao_encontrado'

/** Resposta do POST /api/consultas (CEP encontrado). */
export interface ResultadoConsulta {
  cep: string
  logradouro: string
  bairro: string
  cidade: string
  dataConsulta: string
}

/** Item do histórico; o endereço é nulo quando o CEP não existe. */
export interface Consulta {
  id: number
  cep: string
  logradouro: string | null
  bairro: string | null
  cidade: string | null
  status: StatusConsulta
  dataConsulta: string
}

/** Contagem do histórico inteiro, sem considerar filtro nem paginação. */
export interface Resumo {
  total: number
  encontrados: number
  naoEncontrados: number
}

export interface Historico {
  items: Consulta[]
  /** Itens que batem com o filtro (base da paginação). */
  total: number
  limit: number
  offset: number
  resumo: Resumo
}

export interface FiltrosHistorico {
  status?: StatusConsulta
  limit?: number
  offset?: number
}
