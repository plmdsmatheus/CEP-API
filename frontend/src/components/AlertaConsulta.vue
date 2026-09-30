<script setup lang="ts">
import { computed, type Component } from 'vue'
import { CircleAlert, MapPinOff, ServerOff, TriangleAlert, WifiOff } from '@lucide/vue'
import { Button } from '@/components/ui/button'

const props = defineProps<{ erro: { code: string; message: string } }>()

defineEmits<{ tentarNovamente: [] }>()

type Tipo = 'nao-encontrado' | 'invalido' | 'indisponivel' | 'inesperado'

interface Situacao {
  tipo: Tipo
  titulo: string
  icone: Component
}

const SITUACOES: Record<string, Situacao> = {
  CEP_NAO_ENCONTRADO: { tipo: 'nao-encontrado', titulo: 'CEP inexistente', icone: MapPinOff },
  CEP_INVALIDO: { tipo: 'invalido', titulo: 'CEP inválido', icone: TriangleAlert },
  REQUISICAO_INVALIDA: { tipo: 'invalido', titulo: 'Requisição inválida', icone: TriangleAlert },
  VIACEP_INDISPONIVEL: { tipo: 'indisponivel', titulo: 'Serviço de CEP indisponível', icone: ServerOff },
  REDE_INDISPONIVEL: { tipo: 'indisponivel', titulo: 'Sem conexão com o servidor', icone: WifiOff },
}

const INESPERADO: Situacao = { tipo: 'inesperado', titulo: 'Algo deu errado', icone: CircleAlert }

const situacao = computed(() => SITUACOES[props.erro.code] ?? INESPERADO)

// Aviso (o usuário pode agir sobre o CEP): educado, sem interromper. Erro (falha do sistema): alerta.
const ehErro = computed(() => ['indisponivel', 'inesperado'].includes(situacao.value.tipo))

// Só falhas passageiras se resolvem repetindo a consulta.
const podeRepetir = ehErro

// Forma do contorno reforça a cor: tracejado = rua projetada (CEP inexistente); sólido nos demais.
const classes = computed(() => {
  switch (situacao.value.tipo) {
    case 'nao-encontrado':
      return 'border-dashed border-aviso-linha bg-aviso-fundo text-aviso'
    case 'invalido':
      return 'border-solid border-aviso-linha bg-aviso-fundo text-aviso'
    default:
      return 'border-solid border-erro-linha bg-erro-fundo text-erro'
  }
})
</script>

<template>
  <div
    :role="ehErro ? 'alert' : 'status'"
    :data-tipo="situacao.tipo"
    class="flex items-start gap-3 rounded-md border-2 p-4"
    :class="classes"
  >
    <component :is="situacao.icone" class="mt-0.5 size-5 shrink-0" aria-hidden="true" />
    <div class="flex flex-1 flex-col gap-1">
      <p class="font-display text-xl leading-tight font-semibold">{{ situacao.titulo }}</p>
      <p class="text-base">{{ erro.message }}</p>
      <Button
        v-if="podeRepetir"
        type="button"
        variant="outline"
        class="border-erro-linha text-erro mt-2 self-start border-2 bg-transparent"
        @click="$emit('tentarNovamente')"
      >
        Tentar novamente
      </Button>
    </div>
  </div>
</template>
