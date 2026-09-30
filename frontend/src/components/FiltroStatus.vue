<script setup lang="ts">
import { nextTick, ref } from 'vue'
import type { FiltroHistorico } from '@/composables/useHistorico'

const props = defineProps<{ modelValue: FiltroHistorico }>()

const emit = defineEmits<{ 'update:modelValue': [filtro: FiltroHistorico] }>()

const OPCOES: { valor: FiltroHistorico; rotulo: string }[] = [
  { valor: 'todos', rotulo: 'Todos' },
  { valor: 'encontrado', rotulo: 'Encontrados' },
  { valor: 'nao_encontrado', rotulo: 'Não encontrados' },
]

const botoes = ref<HTMLButtonElement[]>([])

function escolher(valor: FiltroHistorico) {
  if (valor !== props.modelValue) emit('update:modelValue', valor)
}

// Padrão WAI-ARIA de radiogroup: setas movem a seleção (com volta nas pontas) e o foco acompanha.
async function aoTeclar(evento: KeyboardEvent, indice: number) {
  const passo = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[evento.key]
  if (passo === undefined) return
  evento.preventDefault()

  const destino = (indice + passo + OPCOES.length) % OPCOES.length
  emit('update:modelValue', OPCOES[destino]!.valor)
  await nextTick()
  botoes.value[destino]?.focus()
}
</script>

<template>
  <div role="radiogroup" aria-label="Filtrar por status" class="inline-flex gap-1">
    <button
      v-for="(opcao, indice) in OPCOES"
      :key="opcao.valor"
      ref="botoes"
      type="button"
      role="radio"
      :aria-checked="modelValue === opcao.valor"
      :tabindex="modelValue === opcao.valor ? 0 : -1"
      class="font-display h-9 rounded-sm border-2 px-3 text-base font-semibold transition-colors duration-200"
      :class="
        modelValue === opcao.valor
          ? 'bg-primary text-primary-foreground border-via-contorno'
          : 'border-border text-muted-foreground hover:bg-muted hover:text-foreground'
      "
      @click="escolher(opcao.valor)"
      @keydown="aoTeclar($event, indice)"
    >
      {{ opcao.rotulo }}
    </button>
  </div>
</template>
