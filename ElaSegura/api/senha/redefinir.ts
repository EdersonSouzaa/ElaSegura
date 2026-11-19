/**
 * POST /api/senha/redefinir
 * Corpo: { email: string, codigo: string, novaSenha: string }
 *
 * Erros possíveis: email_invalido, senha_tamanho, codigo_invalido (com
 * `tentativasRestantes` quando o código existe), codigo_expirado,
 * codigo_bloqueado (400); muitas_tentativas (429, com `minutos`).
 */
import {
  LIMITES,
  consumirLimite,
  corpoJson,
  exigirPost,
  ipDaRequisicao,
  normalizarEmail,
  redefinirComCodigo,
  responderErro,
  validarCodigo,
  validarNovaSenha,
  type Requisicao,
  type Resposta,
} from '../_lib/redefinicaoSenha';

export default async function handler(req: Requisicao, res: Resposta) {
  if (!exigirPost(req, res)) return;

  try {
    const corpo = corpoJson(req);
    const email = normalizarEmail(corpo.email);
    const codigo = validarCodigo(corpo.codigo);
    const novaSenha = validarNovaSenha(corpo.novaSenha);

    await consumirLimite('verificacao-ip', ipDaRequisicao(req), LIMITES.verificacaoIp);
    await redefinirComCodigo(email, codigo, novaSenha);

    res.status(200).json({ ok: true });
  } catch (erro) {
    responderErro(res, erro);
  }
}
