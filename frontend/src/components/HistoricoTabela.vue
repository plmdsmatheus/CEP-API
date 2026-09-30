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

const COLUNAS = [
  { nome: 'CEP', largura: 'sm:w-36' },
  { nome: 'Endereço', largura: '' },
  { nome: 'Status', largura: 'sm:w-52' },
  { nome: 'Data', largura: 'sm:w-44' },
]

// Partes vazias (CEP único de cidade) e nulas (CEP inexistente) ficam de fora.
function endereco(consulta: Consulta): string {
  return [consulta.logradouro, consulta.bairro, consulta.cidade].filter(Boolean).join(', ') || '—'
}
</script>

<template>
  <div :aria-busy="carregando ? 'true' : undefined">
    <div v-if="items.length" class="quadro overflow-x-auto" :class="{ 'opacity-60': carregando }">
      <table class="w-full text-left text-base sm:table-fixed max-sm:block">
        <caption class="sr-only">
          Histórico de consultas
        </caption>
        <!-- No celular cada linha vira um bloco (CEP e status, endereço, data); o cabeçalho só para leitores de tela. -->
        <thead class="max-sm:sr-only">
          <tr class="border-border border-b-2">
            <th
              v-for="coluna in COLUNAS"
              :key="coluna.nome"
              scope="col"
              class="text-muted-foreground font-display text-rotulo px-4 py-3 font-semibold tracking-[0.06em] uppercase"
              :class="coluna.largura"
            >
              {{ coluna.nome }}
            </th>
          </tr>
        </thead>
        <tbody class="max-sm:block">
          <tr
            v-for="consulta in items"
            :key="consulta.id"
            class="border-border border-b last:border-b-0 max-sm:grid max-sm:grid-cols-[1fr_auto] max-sm:items-center max-sm:gap-x-3 max-sm:gap-y-1 max-sm:px-4 max-sm:py-3"
          >
            <td class="font-display px-4 py-3 text-lg font-semibold whitespace-nowrap max-sm:col-start-1 max-sm:row-start-1 max-sm:p-0">
              {{ formatarCep(consulta.cep) }}
            </td>
            <td class="px-4 py-3 max-sm:col-span-2 max-sm:row-start-2 max-sm:p-0">{{ endereco(consulta) }}</td>
            <td class="px-4 py-3 max-sm:col-start-2 max-sm:row-start-1 max-sm:p-0"><StatusBadge :status="consulta.status" /></td>
            <td class="text-muted-foreground px-4 py-3 whitespace-nowrap max-sm:col-span-2 max-sm:row-start-3 max-sm:p-0 max-sm:text-sm">
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
