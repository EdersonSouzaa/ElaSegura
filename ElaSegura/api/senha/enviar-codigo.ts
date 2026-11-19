/**
 * POST /api/senha/enviar-codigo
 * Corpo: { email: string, idioma?: 'pt' | 'en' }
 *
 * Sempre responde { ok: true } quando a requisição é aceita, exista ou não
 * uma conta com o e-mail. Erros possíveis: email_invalido (400),
 * aguarde (429, com `segundos`), muitas_tentativas (429, com `minutos`).
 */
import {
  LIMITES,
  consumirLimite,
  corpoJson,
  exigirPost,
  gerarEEnviarCodigo,
  idiomaValido,
  ipDaRequisicao,
  normalizarEmail,
  responderErro,
  type Requisicao,
  type Resposta,
} from '../_lib/redefinicaoSenha';

export default async function handler(req: Requisicao, res: Resposta) {
  if (!exigirPost(req, res)) return;

  try {
    const corpo = corpoJson(req);
    const email = normalizarEmail(corpo.email);
    const idioma = idiomaValido(corpo.idioma);

    await consumirLimite('envio-ip', ipDaRequisicao(req), LIMITES.envioIp);
    await consumirLimite('envio-email', email, LIMITES.envioEmail);

    await gerarEEnviarCodigo(email, idioma);
    res.status(200).json({ ok: true });
  } catch (erro) {
    responderErro(res, erro);
  }
}
