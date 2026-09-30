<script setup lang="ts">
import { computed } from 'vue'
import { CircleCheck, MapPinOff } from '@lucide/vue'
import type { StatusConsulta } from '@/types/consulta'

const props = defineProps<{ status: StatusConsulta }>()

// Encontrado = traço sólido e verde; não encontrado = tracejado ("rua projetada") e tom de aviso.
const visual = computed(() =>
  props.status === 'encontrado'
    ? {
        texto: 'Encontrado',
        icone: CircleCheck,
        classes: 'border-solid border-sucesso-linha bg-sucesso-fundo text-sucesso',
      }
    : {
        texto: 'Não encontrado',
        icone: MapPinOff,
        classes: 'border-dashed border-aviso-linha bg-aviso-fundo text-aviso',
      },
)
</script>

<template>
  <span
    :data-status="status"
    class="inline-flex items-center gap-1.5 rounded-sm border-2 px-2 py-0.5 text-sm font-semibold whitespace-nowrap"
    :class="visual.classes"
  >
    <component :is="visual.icone" class="size-3.5" aria-hidden="true" />
    {{ visual.texto }}
  </span>
</template>
