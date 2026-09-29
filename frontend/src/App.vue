<script setup lang="ts">
import { computed, onMounted } from 'vue'
import AlertaConsulta from '@/components/AlertaConsulta.vue'
import ConsultaForm from '@/components/ConsultaForm.vue'
import FiltroStatus from '@/components/FiltroStatus.vue'
import HistoricoTabela from '@/components/HistoricoTabela.vue'
import PaginacaoHistorico from '@/components/PaginacaoHistorico.vue'
import ResultadoEndereco from '@/components/ResultadoEndereco.vue'
import ResumoHistorico from '@/components/ResumoHistorico.vue'
import { useConsulta } from '@/composables/useConsulta'
import { useHistorico } from '@/composables/useHistorico'

const {
  items,
  total,
  resumo,
  filtro,
  pagina,
  totalPaginas,
  temProxima,
  temAnterior,
  carregando: carregandoHistorico,
  erro: erroHistorico,
  carregar,
  irParaProxima,
  irParaAnterior,
  filtrar,
  recarregar,
} = useHistorico()

// Toda consulta gravada no backend faz o histórico voltar para a primeira página.
const { cep, resultado, erro, carregando, podeConsultar, atualizarCep, consultar } = useConsulta({
  aoConsultar: recarregar,
})

const cepInvalido = computed(
  () => erro.value?.code === 'CEP_INVALIDO' || erro.value?.code === 'REQUISICAO_INVALIDA',
)

onMounted(carregar)

const COLUNAS = ['A', 'B', 'C', 'D', 'E', 'F']
const LINHAS = ['1', '2', '3', '4']
</script>

<template>
  <div class="mx-auto flex min-h-screen max-w-5xl gap-3 px-4 py-6 sm:px-6 sm:py-10">
    <!-- Moldura de quadrantes da prancha: régua vertical. Decorativa. -->
    <div aria-hidden="true" class="relative hidden shrink-0 pt-8 sm:block">
      <div class="regua-vertical ml-auto h-full" />
      <div class="font-display text-muted-foreground absolute inset-y-8 right-3 flex flex-col justify-around text-sm font-semibold">
        <span v-for="linha in LINHAS" :key="linha">{{ linha }}</span>
      </div>
    </div>

    <div class="flex min-w-0 flex-1 flex-col gap-3">
      <!-- Régua horizontal (A–F). Decorativa. -->
      <div aria-hidden="true" class="hidden sm:block">
        <div class="font-display text-muted-foreground grid grid-cols-6 text-sm font-semibold">
          <span v-for="coluna in COLUNAS" :key="coluna" class="text-center">{{ coluna }}</span>
        </div>
        <div class="regua-horizontal" />
      </div>

      <header class="flex flex-col gap-2 pt-2">
        <h1 class="text-4xl leading-none font-bold sm:text-5xl">Consulta de CEP</h1>
        <p class="text-muted-foreground max-w-prose text-lg">
          Informe um CEP para localizar o endereço. Cada consulta fica registrada no histórico.
        </p>
      </header>

      <main class="flex flex-col gap-10 pt-4">
        <section aria-labelledby="titulo-consulta" class="flex flex-col gap-4">
          <h2 id="titulo-consulta" class="sr-only">Consultar um CEP</h2>

          <ConsultaForm
            :model-value="cep"
            :pode-consultar="podeConsultar"
            :carregando="carregando"
            :invalido="cepInvalido"
            @update:model-value="atualizarCep"
            @consultar="consultar"
          />

          <ResultadoEndereco v-if="resultado" :resultado="resultado" />
          <AlertaConsulta v-else-if="erro" :erro="erro" @tentar-novamente="consultar" />
        </section>

        <section aria-labelledby="titulo-historico" class="flex flex-col gap-5">
          <h2 id="titulo-historico" class="text-titulo font-semibold">Histórico de consultas</h2>

          <ResumoHistorico :resumo="resumo" />

          <div class="flex flex-wrap items-center gap-3">
            <FiltroStatus :model-value="filtro" @update:model-value="filtrar" />
          </div>

          <AlertaConsulta v-if="erroHistorico" :erro="erroHistorico" @tentar-novamente="carregar" />

          <HistoricoTabela :items="items" :carregando="carregandoHistorico" :filtrado="filtro !== 'todos'" />

          <PaginacaoHistorico
            :pagina="pagina"
            :total-paginas="totalPaginas"
            :total="total"
            :tem-anterior="temAnterior"
            :tem-proxima="temProxima"
            :carregando="carregandoHistorico"
            @anterior="irParaAnterior"
            @proxima="irParaProxima"
          />
        </section>
      </main>
    </div>
  </div>
</template>
