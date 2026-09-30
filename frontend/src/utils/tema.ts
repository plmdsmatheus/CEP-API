/**
 * Segue o tema do sistema: a classe `dark` no <html> liga os tokens do modo escuro (style.css).
 * Devolve a função que para de acompanhar o sistema.
 */
export function iniciarTemaDoSistema(): () => void {
  const preferenciaEscura = window.matchMedia('(prefers-color-scheme: dark)')
  const aplicar = (escuro: boolean) => document.documentElement.classList.toggle('dark', escuro)

  aplicar(preferenciaEscura.matches)
  const aoMudar = (evento: { matches: boolean }) => aplicar(evento.matches)
  preferenciaEscura.addEventListener('change', aoMudar)

  return () => preferenciaEscura.removeEventListener('change', aoMudar)
}
