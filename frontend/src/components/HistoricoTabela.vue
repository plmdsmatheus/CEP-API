<script setup lang="ts">
import StatusBadge from '@/components/StatusBadge.vue'
import type { Consulta } from '@/types/consulta'
import { formatarCep } from '@/utils/cep'
import { formatarDataHora } from '@/utils/data'

defineProps<{
  items: Consulta[]
  carregando: boolean
  /** Há um filtro de status ativo (muda a mensagem de "vazio"). */
  filtrado: boolean
}>()

// Partes vazias (CEP único de cidade) e nulas (CEP inexistente) ficam de fora.
function endereco(consulta: Consulta): string {
  return [consulta.logradouro, consulta.bairro, consulta.cidade].filter(Boolean).join(', ') || '—'
}
</script>

<template>
  <div :aria-busy="carregando ? 'true' : undefined">
    <div v-if="items.length" class="quadro overflow-x-auto" :class="{ 'opacity-60': carregando }">
      <table class="w-full text-left text-base">
        <caption class="sr-only">
          Histórico de consultas
        </caption>
        <thead>
          <tr class="border-border border-b-2">
            <th
              v-for="coluna in ['CEP', 'Endereço', 'Status', 'Data']"
              :key="coluna"
              scope="col"
              class="text-muted-foreground font-display text-rotulo px-4 py-3 font-semibold tracking-[0.06em] uppercase"
            >
              {{ coluna }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="consulta in items" :key="consulta.id" class="border-border border-b last:border-b-0">
            <td class="font-display px-4 py-3 text-lg font-semibold whitespace-nowrap">
              {{ formatarCep(consulta.cep) }}
            </td>
            <td class="px-4 py-3">{{ endereco(consulta) }}</td>
            <td class="px-4 py-3"><StatusBadge :status="consulta.status" /></td>
            <td class="text-muted-foreground px-4 py-3 whitespace-nowrap">
              <time :datetime="consulta.dataConsulta">{{ formatarDataHora(consulta.dataConsulta) }}</time>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <p v-else-if="carregando" role="status" class="border-border text-muted-foreground rounded-md border-2 border-dashed p-8 text-center">
      Carregando histórico…
    </p>

    <p v-else role="status" class="border-border text-muted-foreground rounded-md border-2 border-dashed p-8 text-center">
      {{
        filtrado
          ? 'Nenhuma consulta com esse status.'
          : 'Nenhuma consulta registrada ainda. Consulte um CEP para começar.'
      }}
    </p>
  </div>
</template>
