/**
 * Servidor MCP (stdio) de **solo lectura** sobre el Redis de IBIME Connect.
 *
 * Por qué existe: el paquete de terceros que usábamos
 * (`@gongrzhe/server-redis-mcp@1.0.0`, única versión publicada) crea el cliente
 * de node-redis sin `pingInterval` ni `reconnectStrategy`. Redis Cloud —o el NAT
 * intermedio— corta la conexión ociosa a los ~90 s, el cliente emite
 * `read ETIMEDOUT` y el proceso muere con code=1: las tools de redis
 * desaparecían a mitad de sesión sin aviso. Aquí el keepalive mantiene viva la
 * conexión y, si aun así se cae, el cliente reconecta solo.
 *
 * Diferencias deliberadas con aquel paquete:
 * - Solo lectura: no se exponen SET, DEL ni ningún comando destructivo. Este
 *   Redis guarda sesiones del chat (correos de usuarios), igual que el MCP de
 *   Supabase, que también está en modo read-only.
 * - `SCAN` en vez de `KEYS`, para no bloquear el servidor.
 * - Conexión perezosa: arranca aunque Redis esté caído y lo reintenta en la
 *   primera llamada, en vez de morir al iniciar.
 * - Sin dependencias nuevas: JSON-RPC 2.0 a mano sobre stdio y el `redis` que el
 *   backend ya tiene instalado.
 *
 * Uso (Claude Code lo lanza así, sin argumentos):
 *   node backend/scripts/redis-mcp.mjs [redis://...]
 * La URL se toma de: argumento → env REDIS_URL → backend/.env. Con eso la
 * contraseña vive solo en backend/.env y no se duplica en ~/.claude.json.
 *
 * IMPORTANTE: stdout es el canal del protocolo. Todo log va a stderr.
 */
import { createClient } from 'redis';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const NOMBRE = 'ibime-redis';
const VERSION = '1.0.0';
const VERSIONES_PROTOCOLO = ['2025-06-18', '2025-03-26', '2024-11-05'];
const LIMITE_ELEMENTOS = 200; // tope de claves/elementos devueltos por llamada

const log = (msg) => process.stderr.write(`[${NOMBRE}] ${msg}\n`);

/** Oculta la contraseña antes de que una URL de Redis acabe en un log. */
const enmascarar = (url) => url.replace(/\/\/[^@]*@/, '//***@');

function resolverUrl() {
  const desdeArgv = process.argv[2];
  if (desdeArgv?.startsWith('redis')) return desdeArgv;
  if (process.env.REDIS_URL) return process.env.REDIS_URL;

  const env = resolve(here, '../.env');
  try {
    const linea = readFileSync(env, 'utf8')
      .split('\n')
      .find((l) => l.trim().startsWith('REDIS_URL='));
    if (linea) return linea.slice(linea.indexOf('=') + 1).trim().replace(/^["']|["']$/g, '');
  } catch {
    // .env puede no existir (p. ej. en un checkout limpio): lo tratamos abajo.
  }
  return null;
}

const url = resolverUrl();
if (!url) {
  log('No hay REDIS_URL (ni argumento, ni entorno, ni backend/.env). Abortando.');
  process.exit(1);
}

const cliente = createClient({
  url,
  pingInterval: 15_000, // el keepalive que le faltaba al paquete anterior
  socket: {
    connectTimeout: 10_000,
    keepAlive: 10_000,
    // Backoff con techo: reintenta indefinidamente en vez de matar el proceso.
    reconnectStrategy: (intentos) => Math.min(500 * 2 ** intentos, 30_000),
  },
});

// Sin este handler, un error del socket se convierte en excepción no capturada
// y el servidor MCP se cae: exactamente el bug que veníamos a arreglar.
cliente.on('error', (err) => log(`error de redis: ${err.message}`));
cliente.on('reconnecting', () => log('reconectando…'));

let conexion = null;
async function conectar() {
  if (cliente.isReady) return cliente;
  conexion ??= cliente.connect().finally(() => {
    conexion = null;
  });
  await conexion;
  return cliente;
}

/** Lee una clave respetando su tipo. Devuelve también TTL para depurar sesiones. */
async function leerClave(key) {
  const r = await conectar();
  const tipo = await r.type(key);
  if (tipo === 'none') return { key, existe: false };

  const ttl = await r.ttl(key); // -1 sin expiración, -2 inexistente
  let valor;
  switch (tipo) {
    case 'string':
      valor = await r.get(key);
      break;
    case 'hash':
      valor = await r.hGetAll(key);
      break;
    case 'list':
      valor = await r.lRange(key, 0, LIMITE_ELEMENTOS - 1);
      break;
    case 'set':
      valor = await r.sMembers(key);
      break;
    case 'zset':
      valor = await r.zRangeWithScores(key, 0, LIMITE_ELEMENTOS - 1);
      break;
    default:
      valor = `(tipo "${tipo}" no soportado por este servidor de solo lectura)`;
  }
  return { key, tipo, ttl, valor };
}

async function listarClaves(pattern = '*', limite = LIMITE_ELEMENTOS) {
  const r = await conectar();
  const claves = [];
  for await (const clave of r.scanIterator({ MATCH: pattern, COUNT: 100 })) {
    // scanIterator devuelve string en unas versiones y string[] en otras.
    claves.push(...(Array.isArray(clave) ? clave : [clave]));
    if (claves.length >= limite) break;
  }
  // SCAN devuelve lotes, así que `claves` puede pasarse del límite: recortamos y
  // reportamos lo que devolvemos de verdad, no lo que se escaneó.
  const devueltas = claves.slice(0, limite);
  return { pattern, total: devueltas.length, truncado: claves.length >= limite, claves: devueltas };
}

async function estadisticas() {
  const r = await conectar();
  const info = await r.info('server');
  const memoria = await r.info('memory');
  const buscar = (texto, campo) => texto.split('\n').find((l) => l.startsWith(`${campo}:`))?.split(':')[1]?.trim();
  return {
    url: enmascarar(url),
    dbsize: await r.dbSize(),
    version: buscar(info, 'redis_version'),
    uptime_segundos: Number(buscar(info, 'uptime_in_seconds')),
    memoria_usada: buscar(memoria, 'used_memory_human'),
  };
}

const TOOLS = [
  {
    name: 'list',
    description: 'Lista claves con SCAN (no bloqueante). Solo lectura.',
    inputSchema: {
      type: 'object',
      properties: {
        pattern: { type: 'string', description: 'Patrón glob, p. ej. "session:*". Por defecto "*".' },
        limit: { type: 'number', description: `Máximo de claves a devolver (por defecto ${LIMITE_ELEMENTOS}).` },
      },
    },
    handler: ({ pattern, limit }) => listarClaves(pattern ?? '*', Math.min(limit ?? LIMITE_ELEMENTOS, 1000)),
  },
  {
    name: 'get',
    description: 'Devuelve el valor de una clave (string/hash/list/set/zset) junto con su tipo y TTL. Solo lectura.',
    inputSchema: {
      type: 'object',
      properties: { key: { type: 'string', description: 'Nombre exacto de la clave.' } },
      required: ['key'],
    },
    handler: ({ key }) => leerClave(key),
  },
  {
    name: 'ttl',
    description: 'TTL en segundos de una clave (-1 sin expiración, -2 si no existe).',
    inputSchema: {
      type: 'object',
      properties: { key: { type: 'string' } },
      required: ['key'],
    },
    handler: async ({ key }) => ({ key, ttl: await (await conectar()).ttl(key) }),
  },
  {
    name: 'stats',
    description: 'Estado del servidor Redis: dbsize, versión, uptime y memoria usada.',
    inputSchema: { type: 'object', properties: {} },
    handler: () => estadisticas(),
  },
];

// ---------------------------------------------------------------------------
// Transporte JSON-RPC 2.0 sobre stdio (mensajes delimitados por salto de línea)
// ---------------------------------------------------------------------------

const responder = (id, payload) => process.stdout.write(`${JSON.stringify({ jsonrpc: '2.0', id, ...payload })}\n`);
const texto = (dato) => ({ content: [{ type: 'text', text: JSON.stringify(dato, null, 2) }] });

async function atender(metodo, params) {
  switch (metodo) {
    case 'initialize':
      return {
        protocolVersion: VERSIONES_PROTOCOLO.includes(params?.protocolVersion)
          ? params.protocolVersion
          : VERSIONES_PROTOCOLO.at(-1),
        capabilities: { tools: {} },
        serverInfo: { name: NOMBRE, version: VERSION },
      };
    case 'ping':
      return {};
    case 'tools/list':
      return { tools: TOOLS.map(({ name, description, inputSchema }) => ({ name, description, inputSchema })) };
    case 'tools/call': {
      const tool = TOOLS.find((t) => t.name === params?.name);
      if (!tool) return { ...texto({ error: `tool desconocida: ${params?.name}` }), isError: true };
      try {
        return texto(await tool.handler(params.arguments ?? {}));
      } catch (err) {
        // Un fallo de Redis se reporta como resultado, nunca tumba el proceso.
        log(`fallo en ${tool.name}: ${err.message}`);
        return { ...texto({ error: err.message }), isError: true };
      }
    }
    default:
      return null; // método no soportado
  }
}

let pendiente = '';
process.stdin.on('data', async (chunk) => {
  pendiente += chunk;
  let corte;
  while ((corte = pendiente.indexOf('\n')) >= 0) {
    const linea = pendiente.slice(0, corte).trim();
    pendiente = pendiente.slice(corte + 1);
    if (!linea) continue;

    let mensaje;
    try {
      mensaje = JSON.parse(linea);
    } catch {
      log('mensaje JSON inválido, ignorado');
      continue;
    }
    if (mensaje.id === undefined) continue; // notificación: no lleva respuesta

    const resultado = await atender(mensaje.method, mensaje.params);
    if (resultado === null) {
      responder(mensaje.id, { error: { code: -32601, message: `método no soportado: ${mensaje.method}` } });
    } else {
      responder(mensaje.id, { result: resultado });
    }
  }
});

process.stdin.on('close', () => process.exit(0));
process.on('SIGTERM', () => process.exit(0));

log(`solo lectura, escuchando en stdio · ${enmascarar(url)}`);
