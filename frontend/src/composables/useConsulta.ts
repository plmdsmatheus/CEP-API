import { computed, ref, shallowRef } from 'vue'
import { ApiError, MENSAGEM_INESPERADA, consultarCep } from '@/api/consultas'
import type { ResultadoConsulta } from '@/types/consulta'
import { cepValido, formatarCep } from '@/utils/cep'

const MENSAGEM_CEP_INCOMPLETO = 'CEP inválido. Informe os 8 dígitos do CEP.'

interface Opcoes {
  /** Chamado quando uma consulta entrou no histórico do backend (para a tela recarregá-lo). */
  aoConsultar?: () => void
}

export function useConsulta(opcoes: Opcoes = {}) {
  const cep = ref('')
  const resultado = shallowRef<ResultadoConsulta | null>(null)
  const erro = shallowRef<ApiError | null>(null)
  const carregando = ref(false)

  const podeConsultar = computed(() => cepValido(cep.value) && !carregando.value)

  function atualizarCep(valor: string) {
    cep.value = formatarCep(valor)
  }

  async function consultar() {
    if (carregando.value) return

    resultado.value = null
    erro.value = null

    if (!cepValido(cep.value)) {
      erro.value = new ApiError('CEP_INVALIDO', MENSAGEM_CEP_INCOMPLETO)
      return
    }

    let gravouNoHistorico = false
    carregando.value = true
    try {
      resultado.value = await consultarCep(cep.value)
      gravouNoHistorico = true
    } catch (falha) {
      erro.value =
        falha instanceof ApiError ? falha : new ApiError('ERRO_INESPERADO', MENSAGEM_INESPERADA)
      // CEP inexistente também é gravado no histórico; os demais erros não são.
      gravouNoHistorico = erro.value.code === 'CEP_NAO_ENCONTRADO'
    } finally {
      carregando.value = false
    }

    if (gravouNoHistorico) opcoes.aoConsultar?.()
  }

  return { cep, resultado, erro, carregando, podeConsultar, atualizarCep, consultar }
}
