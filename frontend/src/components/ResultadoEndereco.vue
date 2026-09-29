<script setup lang="ts">
import { computed } from 'vue'
import { CircleCheck } from '@lucide/vue'
import ReguaRegioes from '@/components/ReguaRegioes.vue'
import type { ResultadoConsulta } from '@/types/consulta'
import { formatarCep } from '@/utils/cep'
import { formatarDataHora } from '@/utils/data'

const props = defineProps<{ resultado: ResultadoConsulta }>()

// CEP único de cidade vem do ViaCEP com logradouro e bairro vazios.
const campos = computed(() => [
  { rotulo: 'Logradouro', valor: props.resultado.logradouro },
  { rotulo: 'Bairro', valor: props.resultado.bairro },
  { rotulo: 'Cidade', valor: props.resultado.cidade },
])
</script>

<template>
  <section
    aria-label="Endereço encontrado"
    class="bg-card text-card-foreground border-sucesso-linha flex flex-col gap-5 rounded-md border-2 p-5 shadow-[var(--sombra-prancha)]"
  >
    <p class="text-sucesso flex items-center gap-2 text-sm font-semibold">
      <CircleCheck class="size-4" aria-hidden="true" />
      Endereço encontrado
    </p>

    <p class="numerais font-display text-cep font-bold tracking-tight">{{ formatarCep(resultado.cep) }}</p>

    <dl class="grid gap-x-8 gap-y-3 sm:grid-cols-3">
      <div v-for="campo in campos" :key="campo.rotulo" class="flex flex-col gap-0.5">
        <dt class="text-muted-foreground font-display text-rotulo tracking-[0.06em] uppercase">
          {{ campo.rotulo }}
        </dt>
        <dd class="text-lg font-medium">{{ campo.valor || 'Não informado' }}</dd>
      </div>
    </dl>

    <ReguaRegioes :cep="resultado.cep" />

    <p class="text-muted-foreground text-sm">
      Consulta registrada em
      <time :datetime="resultado.dataConsulta" class="numerais">{{ formatarDataHora(resultado.dataConsulta) }}</time>
    </p>
  </section>
</template>
