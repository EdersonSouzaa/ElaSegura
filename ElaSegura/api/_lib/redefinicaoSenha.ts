/**
 * Núcleo da redefinição de senha por código de 6 dígitos.
 *
 * Roda SOMENTE no servidor (funções da Vercel em /api). Nada daqui pode ser
 * importado pelo app: aqui ficam a senha do Gmail, a chave da conta de serviço
 * do Firebase e o segredo que assina os códigos.
 *
 * Proteções:
 *  - Envio: 1 código por minuto e no máximo 5 por hora para cada e-mail;
 *    no máximo 10 envios por hora para cada IP.
 *  - Código: vale 15 minutos, aceita no máximo 5 tentativas e é apagado assim
 *    que é usado (uso único). Um código novo invalida o anterior.
 *  - Verificação: no máximo 30 tentativas por hora para cada IP, somando
 *    todos os e-mails, para ninguém ficar chutando códigos em massa.
 *  - O código nunca é salvo puro: guardamos um HMAC-SHA256 dele com
 *    RESET_CODE_SECRET.
 *  - A resposta do envio é a mesma exista ou não a conta, então a rota não
 *    serve para descobrir quem tem cadastro.
 *
 * Os documentos de controle ficam nas coleções `codigosRedefinicao` e
 * `limitesRedefinicao`, que as Security Rules bloqueiam para o app. Só o Admin
 * SDK (que ignora as rules) mexe nelas.
 */
import crypto from 'crypto';
import type { IncomingMessage, ServerResponse } from 'http';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import nodemailer from 'nodemailer';

// ---------------------------------------------------------------------------
// Regras
// ---------------------------------------------------------------------------

const MINUTO = 60 * 1000;
const HORA = 60 * MINUTO;

export const VALIDADE_CODIGO_MS = 15 * MINUTO;
export const MAX_TENTATIVAS_CODIGO = 5;

const LIMITE_ENVIO_EMAIL = { max: 5, janelaMs: HORA, intervaloMinimoMs: MINUTO };
const LIMITE_ENVIO_IP = { max: 10, janelaMs: HORA, intervaloMinimoMs: 0 };
const LIMITE_VERIFICACAO_IP = { max: 30, janelaMs: HORA, intervaloMinimoMs: 0 };

export const LIMITES = {
  envioEmail: LIMITE_ENVIO_EMAIL,
  envioIp: LIMITE_ENVIO_IP,
  verificacaoIp: LIMITE_VERIFICACAO_IP,
};

// ---------------------------------------------------------------------------
// Tipos mínimos do runtime Node da Vercel (evita depender de @vercel/node)
// ---------------------------------------------------------------------------

export type Requisicao = IncomingMessage & { body?: unknown };
export type Resposta = ServerResponse & {
  status(codigo: number): Resposta;
  json(corpo: unknown): void;
};

/** Erro com código estável que o app traduz para a usuária. */
export class ErroRedefinicao extends Error {
  constructor(
    public readonly status: number,
    public readonly codigo: string,
    public readonly extra: Record<string, unknown> = {}
  ) {
    super(codigo);
  }
}

export function responderErro(res: Resposta, erro: unknown) {
  if (erro instanceof ErroRedefinicao) {
    res.status(erro.status).json({ erro: erro.codigo, ...erro.extra });
    return;
  }
  console.error('[redefinicao-senha]', erro);
  res.status(500).json({ erro: 'erro_interno' });
}

// ---------------------------------------------------------------------------
// Configuração
// ---------------------------------------------------------------------------

function variavel(nome: string): string {
  // A regra vale para o bundle do Expo; aqui é Node na Vercel, onde process.env é dinâmico de verdade.
  // eslint-disable-next-line expo/no-dynamic-env-var
  const valor = process.env[nome];
  if (!valor) throw new Error(`Variável de ambiente ausente: ${nome}`);
  return valor;
}

function segredoDosCodigos(): string {
  const segredo = variavel('RESET_CODE_SECRET');
  if (segredo.length < 32) {
    throw new Error('RESET_CODE_SECRET precisa ter pelo menos 32 caracteres');
  }
  return segredo;
}

function firebaseAdmin() {
  if (getApps().length === 0) {
    initializeApp({
      credential: cert({
        projectId: variavel('FIREBASE_PROJECT_ID'),
        clientEmail: variavel('FIREBASE_CLIENT_EMAIL'),
        // Na Vercel a chave costuma ficar com "\n" literais em vez de quebras.
        privateKey: variavel('FIREBASE_PRIVATE_KEY').replace(/\\n/g, '\n'),
      }),
    });
  }
  return { auth: getAuth(), db: getFirestore() };
}

let transporte: nodemailer.Transporter | null = null;

function transporteEmail() {
  if (!transporte) {
    const porta = Number(process.env.SMTP_PORT || 465);
    transporte = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: porta,
      secure: porta === 465,
      auth: { user: variavel('SMTP_USER'), pass: variavel('SMTP_PASS') },
    });
  }
  return transporte;
}

// ---------------------------------------------------------------------------
// Utilidades
// ---------------------------------------------------------------------------

const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizarEmail(valor: unknown): string {
  if (typeof valor !== 'string') throw new ErroRedefinicao(400, 'email_invalido');
  const email = valor.trim().toLowerCase();
  if (email.length > 254 || !REGEX_EMAIL.test(email)) {
    throw new ErroRedefinicao(400, 'email_invalido');
  }
  return email;
}

/** IP de quem chamou. Na Vercel, x-real-ip e x-forwarded-for são preenchidos pela própria plataforma. */
export function ipDaRequisicao(req: Requisicao): string {
  const real = req.headers['x-real-ip'];
  if (typeof real === 'string' && real) return real;
  const encaminhado = req.headers['x-forwarded-for'];
  const primeiro = (Array.isArray(encaminhado) ? encaminhado[0] : encaminhado)?.split(',')[0]?.trim();
  return primeiro || req.socket?.remoteAddress || 'desconhecido';
}

export function corpoJson(req: Requisicao): Record<string, unknown> {
  const corpo = req.body;
  if (corpo && typeof corpo === 'object') return corpo as Record<string, unknown>;
  if (typeof corpo === 'string') {
    try {
      const convertido = JSON.parse(corpo);
      if (convertido && typeof convertido === 'object') return convertido;
    } catch {
      // cai no erro abaixo
    }
  }
  throw new ErroRedefinicao(400, 'requisicao_invalida');
}

export function exigirPost(req: Requisicao, res: Resposta): boolean {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'POST') return true;
  res.setHeader('Allow', 'POST');
  res.status(405).json({ erro: 'metodo_nao_permitido' });
  return false;
}

/** Hash usado como id de documento: nunca guardamos e-mail ou IP em texto puro nos controles. */
function idDe(tipo: string, valor: string) {
  return crypto.createHash('sha256').update(`${tipo}:${valor}`).digest('hex');
}

function hashDoCodigo(email: string, codigo: string) {
  return crypto.createHmac('sha256', segredoDosCodigos()).update(`${email}:${codigo}`).digest('hex');
}

function iguaisEmTempoConstante(a: string, b: string) {
  const bufA = Buffer.from(a, 'hex');
  const bufB = Buffer.from(b, 'hex');
  return bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB);
}

// ---------------------------------------------------------------------------
// Limite de requisições (guardado no Firestore, porque funções serverless não
// compartilham memória entre si)
// ---------------------------------------------------------------------------

type Limite = { max: number; janelaMs: number; intervaloMinimoMs: number };

export async function consumirLimite(tipo: string, valor: string, limite: Limite) {
  const { db } = firebaseAdmin();
  const ref = db.collection('limitesRedefinicao').doc(idDe(tipo, valor));
  const agora = Date.now();

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const anteriores: number[] = (snap.data()?.eventos ?? []).filter(
      (t: unknown) => typeof t === 'number' && agora - t < limite.janelaMs
    );
    const ultimo = anteriores.length ? Math.max(...anteriores) : 0;

    if (limite.intervaloMinimoMs && agora - ultimo < limite.intervaloMinimoMs) {
      const segundos = Math.ceil((limite.intervaloMinimoMs - (agora - ultimo)) / 1000);
      throw new ErroRedefinicao(429, 'aguarde', { segundos });
    }
    if (anteriores.length >= limite.max) {
      const maisAntigo = Math.min(...anteriores);
      const minutos = Math.ceil((limite.janelaMs - (agora - maisAntigo)) / MINUTO);
      throw new ErroRedefinicao(429, 'muitas_tentativas', { minutos });
    }

    tx.set(ref, {
      eventos: [...anteriores, agora],
      // Pode ser usado numa política de TTL do Firestore para limpeza automática.
      expiraEm: new Date(agora + limite.janelaMs),
    });
  });
}

// ---------------------------------------------------------------------------
// Envio do código
// ---------------------------------------------------------------------------

export type Idioma = 'pt' | 'en';

export function idiomaValido(valor: unknown): Idioma {
  return valor === 'en' ? 'en' : 'pt';
}

/** Gera e envia um código, se existir conta com esse e-mail. Sem conta, não faz nada (e não conta isso a ninguém). */
export async function gerarEEnviarCodigo(email: string, idioma: Idioma) {
  const { auth, db } = firebaseAdmin();

  try {
    await auth.getUserByEmail(email);
  } catch (erro: any) {
    if (erro?.code === 'auth/user-not-found') return;
    throw erro;
  }

  const codigo = crypto.randomInt(0, 1_000_000).toString().padStart(6, '0');
  const ref = refCodigo(db, email);

  await ref.set({
    hash: hashDoCodigo(email, codigo),
    tentativas: 0,
    criadoEm: new Date(),
    expiraEm: new Date(Date.now() + VALIDADE_CODIGO_MS),
  });

  try {
    await transporteEmail().sendMail({
      from: variavel('MAIL_FROM'),
      to: email,
      ...conteudoEmail(codigo, idioma),
    });
  } catch (erro) {
    await ref.delete().catch(() => undefined);
    throw erro;
  }
}

function refCodigo(db: Firestore, email: string) {
  return db.collection('codigosRedefinicao').doc(idDe('email', email));
}

function conteudoEmail(codigo: string, idioma: Idioma) {
  const minutos = VALIDADE_CODIGO_MS / MINUTO;
  const textos =
    idioma === 'en'
      ? {
          assunto: `${codigo} is your ElaSegura code`,
          titulo: 'Reset your password',
          intro: 'Use the code below in the app to create a new password:',
          validade: `The code expires in ${minutos} minutes and can only be used once.`,
          ignorar: "If you didn't ask for this, just ignore this email. Your password stays the same.",
        }
      : {
          assunto: `${codigo} é o seu código do ElaSegura`,
          titulo: 'Redefinir sua senha',
          intro: 'Use o código abaixo no app para criar uma nova senha:',
          validade: `O código vale por ${minutos} minutos e só pode ser usado uma vez.`,
          ignorar: 'Se não foi você quem pediu, ignore este e-mail. Sua senha continua a mesma.',
        };

  const text = `${textos.titulo}\n\n${textos.intro}\n\n${codigo}\n\n${textos.validade}\n${textos.ignorar}`;
  const html = `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#2d2d2d">
    <h2 style="margin:0 0 16px">${textos.titulo}</h2>
    <p style="margin:0 0 16px;line-height:1.5">${textos.intro}</p>
    <p style="font-size:32px;font-weight:bold;letter-spacing:8px;margin:0 0 16px">${codigo}</p>
    <p style="margin:0 0 8px;line-height:1.5;color:#555">${textos.validade}</p>
    <p style="margin:0;line-height:1.5;color:#555">${textos.ignorar}</p>
  </div>`;

  return { subject: textos.assunto, text, html };
}

// ---------------------------------------------------------------------------
// Verificação do código e troca da senha
// ---------------------------------------------------------------------------

export function validarCodigo(valor: unknown): string {
  if (typeof valor !== 'string' || !/^\d{6}$/.test(valor.trim())) {
    throw new ErroRedefinicao(400, 'codigo_invalido');
  }
  return valor.trim();
}

/** Mesma regra do cadastro do app. */
export function validarNovaSenha(valor: unknown): string {
  if (typeof valor !== 'string' || valor.length < 6 || valor.length > 20) {
    throw new ErroRedefinicao(400, 'senha_tamanho');
  }
  return valor;
}

/**
 * Confere o código e, se estiver certo, troca a senha.
 *
 * A conferência roda numa transação: duas requisições simultâneas com o
 * mesmo código não conseguem usá-lo duas vezes, e o contador de tentativas
 * não perde incrementos.
 */
export async function redefinirComCodigo(email: string, codigo: string, novaSenha: string) {
  const { auth, db } = firebaseAdmin();
  const ref = refCodigo(db, email);
  const hashInformado = hashDoCodigo(email, codigo);

  const resultado = await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const dados = snap.data();
    if (!dados) return { ok: false as const, erro: 'codigo_invalido', extra: {} };

    const expiraEm: Date = dados.expiraEm?.toDate?.() ?? new Date(0);
    if (expiraEm.getTime() < Date.now()) {
      tx.delete(ref);
      return { ok: false as const, erro: 'codigo_expirado', extra: {} };
    }

    if (iguaisEmTempoConstante(dados.hash, hashInformado)) {
      tx.delete(ref); // uso único
      return { ok: true as const };
    }

    const tentativas = (dados.tentativas ?? 0) + 1;
    if (tentativas >= MAX_TENTATIVAS_CODIGO) {
      tx.delete(ref);
      return { ok: false as const, erro: 'codigo_bloqueado', extra: {} };
    }
    tx.update(ref, { tentativas });
    return {
      ok: false as const,
      erro: 'codigo_invalido',
      extra: { tentativasRestantes: MAX_TENTATIVAS_CODIGO - tentativas },
    };
  });

  if (!resultado.ok) throw new ErroRedefinicao(400, resultado.erro, resultado.extra);

  const usuaria = await auth.getUserByEmail(email);
  await auth.updateUser(usuaria.uid, { password: novaSenha });
  // Derruba sessões abertas em outros aparelhos: quem esqueceu a senha pode
  // estar justamente tentando tirar alguém da conta.
  await auth.revokeRefreshTokens(usuaria.uid);
}
