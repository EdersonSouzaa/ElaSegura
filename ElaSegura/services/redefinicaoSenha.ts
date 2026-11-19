import { Platform } from 'react-native';
import type { ChaveTraducao, Idioma, Interpolacao } from '../i18n';

/**
 * Cliente das rotas /api/senha/* (funções da Vercel em api/senha).
 *
 * Na web o app e a API estão no mesmo domínio, então o caminho relativo basta.
 * No celular não existe "mesmo domínio": é preciso apontar para o site
 * publicado em EXPO_PUBLIC_SITE_URL (ex: https://elasegura.vercel.app).
 */
function urlDaApi(caminho: string) {
  if (Platform.OS === 'web') return caminho;
  const base = (process.env.EXPO_PUBLIC_SITE_URL || '').replace(/\/+$/, '');
  return `${base}${caminho}`;
}

export class ErroRedefinicaoSenha extends Error {
  constructor(
    public readonly codigo: string,
    public readonly detalhes: Record<string, any> = {}
  ) {
    super(codigo);
  }
}

async function chamar(caminho: string, corpo: Record<string, unknown>) {
  let resposta: Response;
  try {
    resposta = await fetch(urlDaApi(caminho), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(corpo),
    });
  } catch {
    throw new ErroRedefinicaoSenha('sem_conexao');
  }

  const dados = await resposta.json().catch(() => ({}));
  if (!resposta.ok) {
    const { erro, ...detalhes } = dados ?? {};
    throw new ErroRedefinicaoSenha(typeof erro === 'string' ? erro : 'erro_interno', detalhes);
  }
}

export function enviarCodigoRedefinicao(email: string, idioma: Idioma) {
  return chamar('/api/senha/enviar-codigo', { email: email.trim(), idioma });
}

export function redefinirSenhaComCodigo(email: string, codigo: string, novaSenha: string) {
  return chamar('/api/senha/redefinir', { email: email.trim(), codigo: codigo.trim(), novaSenha });
}

/** Chave de tradução + valores para a mensagem de erro de cada código devolvido pela API. */
export function mensagemErroRedefinicao(erro: unknown): { chave: ChaveTraducao; valores?: Interpolacao } {
  if (!(erro instanceof ErroRedefinicaoSenha)) return { chave: 'redefinicaoSenha.erroGenerico' };
  const d = erro.detalhes;
  switch (erro.codigo) {
    case 'email_invalido':
      return { chave: 'login.formatoEmailInvalido' };
    case 'senha_tamanho':
      return { chave: 'login.senhaTamanho' };
    case 'aguarde':
      return { chave: 'redefinicaoSenha.aguarde', valores: { segundos: d.segundos ?? 60 } };
    case 'muitas_tentativas':
      return { chave: 'redefinicaoSenha.muitasTentativas', valores: { minutos: d.minutos ?? 60 } };
    case 'codigo_invalido':
      return typeof d.tentativasRestantes === 'number'
        ? { chave: 'redefinicaoSenha.codigoErrado', valores: { restantes: d.tentativasRestantes } }
        : { chave: 'redefinicaoSenha.codigoInvalido' };
    case 'codigo_expirado':
      return { chave: 'redefinicaoSenha.codigoExpirado' };
    case 'codigo_bloqueado':
      return { chave: 'redefinicaoSenha.codigoBloqueado' };
    case 'sem_conexao':
      return { chave: 'redefinicaoSenha.semConexao' };
    default:
      return { chave: 'redefinicaoSenha.erroGenerico' };
  }
}
