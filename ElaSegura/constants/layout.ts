/**
 * Limites de largura para a versão web.
 *
 * O app foi desenhado para celular. Num monitor largo, sem limite, os cards e
 * botões esticavam por toda a tela. Na web o app inteiro fica numa coluna
 * centralizada (LARGURA_MAXIMA_APP) e os modais/folhas não passam de
 * LARGURA_MAXIMA_MODAL. No celular nenhum dos dois limites chega a valer.
 */
export const LARGURA_MAXIMA_APP = 600;
export const LARGURA_MAXIMA_MODAL = 560;

/** Para espalhar no estilo do conteúdo de um modal ou folha inferior. */
export const larguraModal = {
  width: '100%',
  maxWidth: LARGURA_MAXIMA_MODAL,
  alignSelf: 'center',
} as const;
