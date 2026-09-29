<script setup lang="ts">
import { computed } from 'vue'
import { REGIOES_POSTAIS, regiaoPostal } from '@/utils/regioes'

const props = defineProps<{ cep: string }>()

const regiao = computed(() => regiaoPostal(props.cep))
</script>

<template>
  <div class="flex flex-col gap-2">
    <ol aria-label="Regiões postais" class="flex list-none gap-1">
      <li
        v-for="r in REGIOES_POSTAIS"
        :key="r.digito"
        :aria-current="regiao?.digito === r.digito ? 'true' : undefined"
        class="numerais font-display grid size-8 place-items-center rounded-sm border text-base font-semibold transition-colors duration-300 ease-saida"
        :class="
          regiao?.digito === r.digito
            ? 'bg-primary text-primary-foreground border-via-contorno border-2'
            : 'border-border text-muted-foreground'
        "
      >
        {{ r.digito }}
      </li>
    </ol>
    <p v-if="regiao" class="text-muted-foreground text-sm">
      Região postal {{ regiao.digito }}: {{ regiao.descricao }}
    </p>
  </div>
</template>
