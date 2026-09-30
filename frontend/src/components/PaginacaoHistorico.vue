<script setup lang="ts">
import { ChevronLeft, ChevronRight } from '@lucide/vue'
import { Button } from '@/components/ui/button'

defineProps<{
  pagina: number
  totalPaginas: number
  total: number
  temAnterior: boolean
  temProxima: boolean
  carregando: boolean
}>()

defineEmits<{ anterior: []; proxima: [] }>()
</script>

<template>
  <nav v-if="total > 0" aria-label="Paginação do histórico" class="flex flex-wrap items-center justify-between gap-3">
    <p class="numerais text-muted-foreground text-sm">
      Página {{ pagina }} de {{ totalPaginas }} · {{ total.toLocaleString('pt-BR') }}
      {{ total === 1 ? 'consulta' : 'consultas' }}
    </p>
    <div class="flex gap-2">
      <Button type="button" variant="outline" :disabled="!temAnterior || carregando" @click="$emit('anterior')">
        <ChevronLeft aria-hidden="true" />
        Anterior
      </Button>
      <Button type="button" variant="outline" :disabled="!temProxima || carregando" @click="$emit('proxima')">
        Próxima
        <ChevronRight aria-hidden="true" />
      </Button>
    </div>
  </nav>
</template>
