/** "29/09/2026 21:02". Sem `fuso`, usa o fuso do navegador; o parâmetro existe para testes e relatórios. */
export function formatarDataHora(iso: string, fuso?: string): string {
  const data = new Date(iso)
  if (Number.isNaN(data.getTime())) return iso

  const partes = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    timeZone: fuso,
  }).formatToParts(data)

  const parte = (tipo: Intl.DateTimeFormatPartTypes) => partes.find((p) => p.type === tipo)?.value
  return `${parte('day')}/${parte('month')}/${parte('year')} ${parte('hour')}:${parte('minute')}`
}
