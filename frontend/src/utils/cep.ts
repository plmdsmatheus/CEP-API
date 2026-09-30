const TAMANHO_CEP = 8

/** Mantém só os dígitos (é o valor enviado à API). */
export function somenteDigitos(entrada: string): string {
  return entrada.replace(/\D/g, '')
}

/** Máscara do campo: só dígitos, no máximo 8, com hífen a partir do 6º (NNNNN-NNN). */
export function formatarCep(entrada: string): string {
  const digitos = somenteDigitos(entrada).slice(0, TAMANHO_CEP)
  return digitos.length > 5 ? `${digitos.slice(0, 5)}-${digitos.slice(5)}` : digitos
}

/** Só habilita o envio; a validação de verdade é feita pelo backend. */
export function cepValido(cep: string): boolean {
  return /^\d{5}-?\d{3}$/.test(cep)
}
