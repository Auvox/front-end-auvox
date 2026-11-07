/* ══════════════════════════════════════════════════════════════
   OTIMIZADOR DA GALERIA "BASTIDORES"

   Lê as fotos originais (pesadas, direto do celular/câmera) e gera
   as versões que o site realmente carrega, em tamanhos fixos:

     • miniatura  → recorte 4:5, 360×450 e 720×900 (1x / 2x da grade)
     • ampliada   → lado maior 1080 e 1600 px, sem recorte (lightbox)
     • placeholder→ 16 px borrado, embutido em base64 no manifesto

   Cada tamanho sai em AVIF (mais leve) e WebP (fallback). O navegador
   escolhe sozinho o formato e a largura certa via <picture>/srcset.

   Nunca amplia: se a original for menor que o tamanho-alvo, a versão
   sai no tamanho máximo que a original permite (ampliar só deixaria
   a foto maior em bytes e borrada).

   Uso:
     npm run galeria                       (lê ../fotosAuvox)
     npm run galeria -- C:/caminho/fotos   (outra pasta)
   ══════════════════════════════════════════════════════════════ */

import { existsSync } from 'node:fs';
import { mkdir, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const ENTRADA = path.resolve(RAIZ, process.argv[2] ?? '../fotosAuvox');
const SAIDA = path.join(RAIZ, 'src/assets/galeria');
const MANIFESTO = path.join(SAIDA, 'galeria.json');

/* A foto da equipe (a que abre a galeria) entra sempre como a primeira */
const CAPA = {
  arquivo: path.join(RAIZ, 'src/assets/equipeAuvox.png'),
  id: 'equipe-auvox',
  alt: 'Equipe Auvox reunida na sala de aula',
};

const MINIATURA = { proporcao: 5 / 4, larguras: [360, 720] }; // altura = largura × 1,25
const AMPLIADA = { ladosMaiores: [1080, 1600] };

const QUALIDADE = {
  avif: { quality: 55, effort: 6, chromaSubsampling: '4:2:0' },
  webp: { quality: 80, effort: 6, smartSubsample: true },
};

/* Fotos da pasta que NÃO entram no site (pelo id). Ex.: prints com
   dados pessoais. A original continua na pasta. */
const IGNORAR = new Set([
  'f6e720cd', // print do Postman com e-mail e telefone pessoais
]);

const EXTENSOES = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif', '.tif', '.tiff']);

const slug = (nome) =>
  nome
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

/* Nomes no formato UUID (fotos salvas do WhatsApp) viram ids curtos */
const idDe = (nome) => {
  const s = slug(nome);
  return /^[0-9a-f]{8}-[0-9a-f]{4}-/.test(s) ? s.slice(0, 8) : s;
};

const kb = (bytes) => `${(bytes / 1024).toFixed(1)} KB`;

/* Larguras-alvo que a original comporta. Se ela não chega ao maior alvo
   mas passa do anterior (ex.: 1599 px, entre 1080 e 1600), o próprio
   tamanho dela vira a versão maior, para não jogar resolução fora.
   Nunca amplia. */
function alvosPossiveis(alvos, maximo) {
  const cabem = alvos.filter((alvo) => alvo <= maximo);
  const ultimo = cabem[cabem.length - 1] ?? 0;
  const naoAlcancaOMaior = maximo < alvos[alvos.length - 1];
  if (naoAlcancaOMaior && maximo > ultimo * 1.1) cabem.push(Math.floor(maximo));
  return cabem;
}

async function salvar(pipeline, nomeBase) {
  const gerados = {};
  for (const formato of ['avif', 'webp']) {
    const arquivo = `${nomeBase}.${formato}`;
    const info = await pipeline.clone()[formato](QUALIDADE[formato]).toFile(path.join(SAIDA, arquivo));
    gerados[formato] = { arquivo, bytes: info.size };
  }
  return gerados;
}

async function processar({ arquivo, id, alt }) {
  // .rotate() sem argumento aplica a orientação EXIF (fotos de celular)
  // antes de qualquer recorte; os metadados são descartados na saída.
  const base = sharp(arquivo, { failOn: 'none' }).rotate();
  const { width, height } = await base.clone().toBuffer({ resolveWithObject: true }).then((r) => r.info);

  const entrada = (await stat(arquivo)).size;

  /* ── Miniaturas 4:5 ── */
  const larguraRecorteMax = Math.min(width, height / MINIATURA.proporcao);
  const miniaturas = [];
  for (const w of alvosPossiveis(MINIATURA.larguras, larguraRecorteMax)) {
    const h = Math.round(w * MINIATURA.proporcao);
    const pipeline = base.clone().resize(w, h, { fit: 'cover', position: sharp.strategy.attention });
    const gerados = await salvar(pipeline, `${id}-mini-${w}`);
    miniaturas.push({ w, h, avif: gerados.avif.arquivo, webp: gerados.webp.arquivo, bytes: gerados.avif.bytes });
  }

  /* ── Ampliadas (sem recorte) ── */
  const ladoMaior = Math.max(width, height);
  const ampliadas = [];
  for (const lado of alvosPossiveis(AMPLIADA.ladosMaiores, ladoMaior)) {
    const escala = lado / ladoMaior;
    const w = Math.round(width * escala);
    const h = Math.round(height * escala);
    const pipeline = base.clone().resize(w, h, { fit: 'fill' });
    const gerados = await salvar(pipeline, `${id}-${w}`);
    ampliadas.push({ w, h, avif: gerados.avif.arquivo, webp: gerados.webp.arquivo, bytes: gerados.avif.bytes });
  }

  /* ── Placeholder borrado (aparece enquanto a foto carrega) ── */
  const mini = await base
    .clone()
    .resize(16, 20, { fit: 'cover', position: sharp.strategy.attention })
    .blur(1.2)
    .webp({ quality: 40 })
    .toBuffer();
  const placeholder = `data:image/webp;base64,${mini.toString('base64')}`;

  /* No log: o peso em AVIF da miniatura menor e da ampliada maior — é o
     que um visitante típico baixa ao abrir a galeria e a foto. */
  const maior = ampliadas[ampliadas.length - 1];
  console.log(
    `  ${id.padEnd(20)} original ${width}×${height} (${kb(entrada)})` +
      `  →  miniatura ${miniaturas.map((m) => `${m.w}×${m.h}`).join(' / ')} (${kb(miniaturas[0].bytes)})` +
      `  ·  ampliada ${ampliadas.map((a) => `${a.w}×${a.h}`).join(' / ')} (${kb(maior.bytes)})` +
      (Math.max(width, height) < AMPLIADA.ladosMaiores[0] ? '   ⚠ original pequena' : '')
  );

  const semBytes = ({ w, h, avif, webp }) => ({ w, h, avif, webp });
  return {
    id,
    alt,
    largura: maior.w,
    altura: maior.h,
    placeholder,
    miniaturas: miniaturas.map(semBytes),
    ampliadas: ampliadas.map(semBytes),
  };
}

async function main() {
  if (!existsSync(ENTRADA)) {
    console.error(`Pasta de fotos não encontrada: ${ENTRADA}`);
    process.exit(1);
  }

  /* O manifesto guarda as LEGENDAS (alt) e a ordem dos arquivos: o que
     já foi editado à mão nele é mantido, e fotos novas entram no fim. No
     site a ordem é sorteada a cada abertura da galeria (só a foto da
     equipe fica sempre em primeiro). */
  let altsAnteriores = {};
  let ordemAnterior = new Map();
  if (existsSync(MANIFESTO)) {
    const anterior = JSON.parse(await readFile(MANIFESTO, 'utf8'));
    altsAnteriores = Object.fromEntries(anterior.fotos.map((f) => [f.id, f.alt]));
    ordemAnterior = new Map(anterior.fotos.map((f, i) => [f.id, i]));
  }

  await rm(SAIDA, { recursive: true, force: true });
  await mkdir(SAIDA, { recursive: true });

  const arquivos = [];
  for (const nome of await readdir(ENTRADA)) {
    if (!EXTENSOES.has(path.extname(nome).toLowerCase())) continue;
    const id = idDe(path.parse(nome).name);
    if (IGNORAR.has(id)) continue;
    const arquivo = path.join(ENTRADA, nome);
    arquivos.push({ arquivo, id, salvaEm: (await stat(arquivo)).mtimeMs });
  }

  const posicao = (f) => ordemAnterior.get(f.id) ?? Infinity;
  arquivos.sort((a, b) => posicao(a) - posicao(b) || a.salvaEm - b.salvaEm);

  const fontes = [
    CAPA,
    ...arquivos.map(({ arquivo, id }, i) => ({
      arquivo,
      id,
      // a foto da equipe é a 1ª; as da pasta vêm depois
      alt: altsAnteriores[id] ?? `Bastidores da Auvox, foto ${i + 2}`,
    })),
  ];

  console.log(`\nOtimizando ${fontes.length} fotos de ${ENTRADA}\n`);
  const fotos = [];
  for (const fonte of fontes) fotos.push(await processar(fonte));

  await writeFile(MANIFESTO, `${JSON.stringify({ fotos }, null, 2)}\n`);
  console.log(`\nManifesto: ${path.relative(RAIZ, MANIFESTO)}\n`);
}

main().catch((erro) => {
  console.error(erro);
  process.exit(1);
});
