<script setup lang="ts">
import { useId } from 'vue'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { formatarCep } from '@/utils/cep'

const props = defineProps<{
  /** CEP já mascarado (NNNNN-NNN). */
  modelValue: string
  /** Vem do useConsulta: CEP completo e nenhuma consulta em andamento. */
  podeConsultar: boolean
  carregando: boolean
  invalido?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [valor: string]
  consultar: []
}>()

const idCampo = useId()
const idAjuda = useId()

// Campo nativo (e não o Input do shadcn) porque a máscara precisa ser dona do valor exibido:
// o Input guarda um estado local e mostraria a letra digitada quando o valor pai não muda.
function aoDigitar(evento: Event) {
  const campo = evento.target as HTMLInputElement
  const mascarado = formatarCep(campo.value)
  campo.value = mascarado
  emit('update:modelValue', mascarado)
}

function aoEnviar() {
  // O botão desabilitado já impede o clique; isto cobre envio programático e duplo envio.
  if (props.podeConsultar) emit('consultar')
}
</script>

<template>
  <form class="quadro flex flex-col gap-4 p-5 sm:flex-row sm:items-start" novalidate @submit.prevent="aoEnviar">
    <div class="flex flex-1 flex-col gap-1.5">
      <Label :for="idCampo" class="font-display text-rotulo tracking-[0.06em] uppercase">CEP</Label>
      <input
        :id="idCampo"
        :value="modelValue"
        name="cep"
        type="text"
        inputmode="numeric"
        autocomplete="postal-code"
        maxlength="9"
        placeholder="00000-000"
        :aria-invalid="invalido ? 'true' : undefined"
        :aria-describedby="idAjuda"
        class="numerais font-display border-input bg-background text-foreground placeholder:text-muted-foreground aria-invalid:border-erro-linha h-14 w-full rounded-md border-2 px-3 text-3xl font-semibold tracking-wide"
        @input="aoDigitar"
      >
      <p :id="idAjuda" class="text-muted-foreground text-sm">
        Somente números. O hífen é inserido automaticamente.
      </p>
    </div>

    <Button
      type="submit"
      :disabled="!podeConsultar"
      :aria-busy="carregando ? 'true' : undefined"
      class="border-via-contorno h-14 border-2 px-6 text-base font-semibold sm:mt-[1.625rem]"
    >
      {{ carregando ? 'Consultando…' : 'Consultar' }}
    </Button>
  </form>
</template>
