import { computed, ref, shallowRef } from 'vue'
import { ApiError, MENSAGEM_INESPERADA, listarHistorico } from '@/api/consultas'
import type { Consulta, FiltrosHistorico, Resumo, StatusConsulta } from '@/types/consulta'

export const TAMANHO_PAGINA = 10

export type FiltroHistorico = 'todos' | StatusConsulta

export function useHistorico() {
  const items = shallowRef<Consulta[]>([])
  const total = ref(0)
  const resumo = ref<Resumo>({ total: 0, encontrados: 0, naoEncontrados: 0 })
  const filtro = ref<FiltroHistorico>('todos')
  const offset = ref(0)
  const carregando = ref(false)
  const erro = shallowRef<ApiError | null>(null)

  // Cada busca ganha um número; só a mais recente pode atualizar a tela (evita resposta antiga
  // sobrescrever a nova quando o usuário troca de filtro ou de página rápido).
  let ultimaBusca = 0

  const pagina = computed(() => Math.floor(offset.value / TAMANHO_PAGINA) + 1)
  const totalPaginas = computed(() => Math.max(1, Math.ceil(total.value / TAMANHO_PAGINA)))
  const temProxima = computed(() => pagina.value < totalPaginas.value)
  const temAnterior = computed(() => pagina.value > 1)

  async function carregar() {
    const busca = ++ultimaBusca
    const filtros: FiltrosHistorico = { limit: TAMANHO_PAGINA, offset: offset.value }
    if (filtro.value !== 'todos') filtros.status = filtro.value

    carregando.value = true
    try {
      const historico = await listarHistorico(filtros)
      if (busca !== ultimaBusca) return
      items.value = historico.items
      total.value = historico.total
      resumo.value = historico.resumo
      erro.value = null
    } catch (falha) {
      if (busca !== ultimaBusca) return
      // Mantém os itens já exibidos; a tela mostra o erro ao lado deles.
      erro.value =
        falha instanceof ApiError ? falha : new ApiError('ERRO_INESPERADO', MENSAGEM_INESPERADA)
    } finally {
      if (busca === ultimaBusca) carregando.value = false
    }
  }

  async function irParaProxima() {
    if (!temProxima.value) return
    offset.value += TAMANHO_PAGINA
    await carregar()
  }

  async function irParaAnterior() {
    if (!temAnterior.value) return
    offset.value -= TAMANHO_PAGINA
    await carregar()
  }

  async function filtrar(novoFiltro: FiltroHistorico) {
    filtro.value = novoFiltro
    offset.value = 0
    await carregar()
  }

  async function recarregar() {
    offset.value = 0
    await carregar()
  }

  return {
    items,
    total,
    resumo,
    filtro,
    pagina,
    totalPaginas,
    temProxima,
    temAnterior,
    carregando,
    erro,
    carregar,
    irParaProxima,
    irParaAnterior,
    filtrar,
    recarregar,
  }
}
