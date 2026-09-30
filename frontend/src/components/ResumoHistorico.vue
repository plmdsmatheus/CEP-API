<script setup lang="ts">
import { computed } from 'vue'
import type { Resumo } from '@/types/consulta'

const props = defineProps<{ resumo: Resumo }>()

const numero = (n: number) => n.toLocaleString('pt-BR')

const itens = computed(() => [
  { rotulo: 'Consultas', valor: numero(props.resumo.total) },
  { rotulo: 'Encontrados', valor: numero(props.resumo.encontrados) },
  { rotulo: 'Não encontrados', valor: numero(props.resumo.naoEncontrados) },
])
</script>

<template>
  <section aria-label="Resumo do histórico">
    <dl class="flex flex-wrap gap-x-10 gap-y-3">
      <div v-for="item in itens" :key="item.rotulo" class="flex flex-col gap-0.5">
        <dt class="text-muted-foreground font-display text-rotulo tracking-[0.06em] uppercase">
          {{ item.rotulo }}
        </dt>
        <dd class="numerais font-display text-titulo font-semibold">{{ item.valor }}</dd>
      </div>
    </dl>
  </section>
</template>
