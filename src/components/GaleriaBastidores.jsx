import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import gsap from 'gsap';
import { FiChevronLeft, FiChevronRight, FiX } from 'react-icons/fi';
import manifesto from '../assets/galeria/galeria.json';
import fotoSobre from '../assets/equipeAuvox.webp';
import { pausarRolagem, retomarRolagem } from '../lib/rolagem.js';
import '../styles/galeria.css';

/* ══════════════════════════════════════════════════════════════
   GALERIA "BASTIDORES"

   Abre a partir da foto da equipe no Sobre: a foto cresce até virar a
   capa da galeria enquanto o painel escuro se expande do mesmo
   retângulo até a tela inteira (efeito "expandir"). Abaixo da capa,
   uma grade de miniaturas; clicar numa abre o visualizador em tela
   cheia, que passa para os lados com setas, teclado ou arrastando.

   As fotos vêm já otimizadas de src/assets/galeria (gere com
   `npm run galeria`). Este componente é carregado sob demanda: nada
   dele — nem as imagens — pesa no carregamento inicial do site.
   ══════════════════════════════════════════════════════════════ */

const URLS = import.meta.glob('../assets/galeria/*.{avif,webp}', {
  eager: true,
  query: '?url',
  import: 'default',
});
const url = (arquivo) => URLS[`../assets/galeria/${arquivo}`];
const srcset = (versoes, formato) =>
  versoes.map((v) => `${url(v[formato])} ${v.w}w`).join(', ');

const FOTOS = manifesto.fotos;
const RAIO_ORIGEM = 28; // mesmo raio da foto no Sobre (.sobre-hero-img-frame)
const dois = (n) => String(n).padStart(2, '0');
const reduzMovimento = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ── Foto otimizada: AVIF → WebP, com placeholder borrado por baixo ── */
function Foto({ foto, tipo, sizes, carregamento = 'lazy', prioridade, fundo }) {
  const versoes = tipo === 'mini' ? foto.miniaturas : foto.ampliadas;
  const maior = versoes[versoes.length - 1];
  const [pronta, setPronta] = useState(false);

  // imagens já em cache podem terminar de carregar antes do onLoad
  const verificar = useCallback((img) => {
    if (img?.complete && img.naturalWidth) setPronta(true);
  }, []);

  return (
    <span
      className={`galeria-foto${pronta ? ' pronta' : ''}`}
      style={{ backgroundImage: `url(${fundo ?? foto.placeholder})` }}
    >
      <picture>
        <source type="image/avif" srcSet={srcset(versoes, 'avif')} sizes={sizes} />
        <source type="image/webp" srcSet={srcset(versoes, 'webp')} sizes={sizes} />
        <img
          ref={verificar}
          src={url(maior.webp)}
          width={maior.w}
          height={maior.h}
          alt={foto.alt}
          loading={carregamento}
          fetchPriority={prioridade}
          decoding="async"
          draggable="false"
          onLoad={() => setPronta(true)}
        />
      </picture>
    </span>
  );
}

/* ── Visualizador em tela cheia ── */
function Visualizador({ indice, onMudar, onFechar }) {
  const total = FOTOS.length;
  const raizRef = useRef(null);
  const trilhoRef = useRef(null);
  const arrasto = useRef(null);
  const [deslocamento, setDeslocamento] = useState(0);
  const foto = FOTOS[indice];

  useLayoutEffect(() => {
    const raiz = raizRef.current;
    raiz.focus({ preventScroll: true });
    if (reduzMovimento()) return undefined;
    const ctx = gsap.context(() => {
      gsap.fromTo(raiz, { opacity: 0 }, { opacity: 1, duration: 0.3, ease: 'power2.out' });
      gsap.fromTo('.galeria-vis-palco', { scale: 0.94 }, { scale: 1, duration: 0.5, ease: 'power3.out' });
    }, raiz);
    return () => ctx.revert();
  }, []);

  /* Arrastar para os lados (mouse ou toque). O trilho segue o dedo e,
     ao soltar, avança se passou de ~15% da largura ou foi um "peteleco". */
  const aoPressionar = (evento) => {
    if (evento.button !== 0) return;
    arrasto.current = { x: evento.clientX, t: performance.now(), id: evento.pointerId };
    trilhoRef.current.setPointerCapture(evento.pointerId);
  };

  const aoMover = (evento) => {
    const a = arrasto.current;
    if (!a || a.id !== evento.pointerId) return;
    let dx = evento.clientX - a.x;
    // resistência elástica nas pontas
    if ((indice === 0 && dx > 0) || (indice === total - 1 && dx < 0)) dx *= 0.3;
    setDeslocamento(dx);
  };

  const aoSoltar = (evento) => {
    const a = arrasto.current;
    if (!a || a.id !== evento.pointerId) return;
    arrasto.current = null;
    const dx = evento.clientX - a.x;
    const velocidade = Math.abs(dx) / Math.max(performance.now() - a.t, 1);
    const largura = trilhoRef.current.offsetWidth;
    if (Math.abs(dx) > largura * 0.15 || (Math.abs(dx) > 30 && velocidade > 0.5)) {
      onMudar(indice + (dx < 0 ? 1 : -1));
    }
    setDeslocamento(0);
  };

  const arrastando = deslocamento !== 0;

  return (
    <div
      className="galeria-vis"
      ref={raizRef}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-label={`Foto ${indice + 1} de ${total}`}
    >
      <div className="galeria-vis-topo">
        <span className="galeria-vis-contador">
          {dois(indice + 1)} <span>/ {dois(total)}</span>
        </span>
        <p className="galeria-vis-legenda">{foto.alt}</p>
        <button type="button" className="galeria-fechar" onClick={onFechar}>
          Voltar à galeria <FiX aria-hidden="true" />
        </button>
      </div>

      <div className="galeria-vis-palco">
        <div
          className={`galeria-vis-trilho${arrastando ? ' arrastando' : ''}`}
          ref={trilhoRef}
          style={{ transform: `translate3d(calc(${-indice * 100}% + ${deslocamento}px), 0, 0)` }}
          onPointerDown={aoPressionar}
          onPointerMove={aoMover}
          onPointerUp={aoSoltar}
          onPointerCancel={aoSoltar}
        >
          {FOTOS.map((f, i) => (
            <div className="galeria-vis-slide" key={f.id} aria-hidden={i !== indice}>
              {/* só a foto atual e as vizinhas carregam; o resto fica vazio */}
              {Math.abs(i - indice) <= 1 && (
                <div
                  className="galeria-vis-quadro"
                  style={{ '--w': f.largura, '--h': f.altura }}
                >
                  <Foto
                    foto={f}
                    tipo="ampliada"
                    sizes={`min(92vw, ${f.largura * 2}px)`}
                    carregamento="eager"
                    prioridade={i === indice ? 'high' : 'low'}
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        <button
          type="button"
          className="galeria-vis-seta -anterior"
          onClick={() => onMudar(indice - 1)}
          disabled={indice === 0}
          aria-label="Foto anterior"
        >
          <FiChevronLeft aria-hidden="true" />
        </button>
        <button
          type="button"
          className="galeria-vis-seta -proxima"
          onClick={() => onMudar(indice + 1)}
          disabled={indice === total - 1}
          aria-label="Próxima foto"
        >
          <FiChevronRight aria-hidden="true" />
        </button>
      </div>

      <div className="galeria-vis-filme" role="tablist" aria-label="Escolher foto">
        {FOTOS.map((f, i) => (
          <button
            type="button"
            key={f.id}
            role="tab"
            aria-selected={i === indice}
            aria-label={`Ver foto ${i + 1}`}
            className={`galeria-vis-mini${i === indice ? ' ativa' : ''}`}
            onClick={() => onMudar(i)}
          >
            <Foto foto={f} tipo="mini" sizes="64px" />
          </button>
        ))}
      </div>
    </div>
  );
}

/* ── Galeria ── */
export default function GaleriaBastidores({ origem, onFechada }) {
  const painelRef = useRef(null);
  const rolagemRef = useRef(null);
  const capaFotoRef = useRef(null);
  const fechando = useRef(false);
  const [ativa, setAtiva] = useState(null);

  /* Pausa a página por trás e tira ela do foco/leitor de tela.
     useLayoutEffect: a limpeza roda junto com o fechamento, antes de o
     Sobre devolver o foco para a foto (com `inert` ainda ligado, o foco
     seria recusado). */
  useLayoutEffect(() => {
    const raizApp = document.getElementById('root');
    pausarRolagem();
    if (raizApp) raizApp.inert = true;
    return () => {
      retomarRolagem();
      if (raizApp) raizApp.inert = false;
    };
  }, []);

  /* ABERTURA — a foto do Sobre cresce até virar a capa, e o painel se
     expande do mesmo retângulo até a tela inteira. Como a capa tem a
     mesma proporção (quadrada) da foto de origem, o voo é feito só com
     transform: nada de animar largura/altura, então roda liso. */
  useLayoutEffect(() => {
    const painel = painelRef.current;
    const capa = capaFotoRef.current;
    const entradas = painel.querySelectorAll('[data-entrada]');
    // foco no próprio diálogo (leitor de tela anuncia o título; Tab
    // segue para o botão Fechar) sem acender anel de foco num botão
    painel.focus({ preventScroll: true });

    if (!origem || reduzMovimento()) {
      gsap.fromTo(painel, { opacity: 0 }, { opacity: 1, duration: 0.25 });
      return undefined;
    }

    const o = origem.getBoundingClientRect();
    const c = capa.getBoundingClientRect();
    const escala = o.width / c.width;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    // context + revert: no StrictMode o efeito roda duas vezes, e a
    // segunda medição precisa da capa sem o transform da primeira
    const ctx = gsap.context(() => {
      gsap
        .timeline({ defaults: { duration: 0.95, ease: 'power3.inOut' } })
        .fromTo(
          painel,
          { clipPath: `inset(${o.top}px ${vw - o.right}px ${vh - o.bottom}px ${o.left}px round ${RAIO_ORIGEM}px)` },
          { clipPath: 'inset(0px 0px 0px 0px round 0px)', clearProps: 'clipPath' },
          0
        )
        .fromTo(
          capa,
          {
            x: o.left - c.left,
            y: o.top - c.top,
            scale: escala,
            borderRadius: RAIO_ORIGEM / escala,
            transformOrigin: '0 0',
          },
          { x: 0, y: 0, scale: 1, borderRadius: 24, clearProps: 'transform,borderRadius' },
          0
        )
        .fromTo(
          entradas,
          { opacity: 0, y: 36 },
          { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out', stagger: 0.05, clearProps: 'all' },
          0.55
        );
    });

    return () => ctx.revert();
  }, [origem]);

  /* FECHAMENTO — o caminho inverso: tudo some, a capa volta para o
     lugar da foto no Sobre e o painel se recolhe em volta dela. */
  const fechar = useCallback(() => {
    if (fechando.current) return;
    fechando.current = true;

    const painel = painelRef.current;
    const capa = capaFotoRef.current;
    if (!origem || reduzMovimento()) {
      gsap.to(painel, { opacity: 0, duration: 0.2, onComplete: onFechada });
      return;
    }

    const o = origem.getBoundingClientRect();
    const c = capa.getBoundingClientRect();
    const escala = o.width / c.width;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    const tl = gsap.timeline({ onComplete: onFechada });
    tl.to(painel.querySelectorAll('[data-entrada], .galeria-topo'), {
      opacity: 0,
      duration: 0.25,
      ease: 'power2.in',
    })
      .to(
        capa,
        {
          x: o.left - c.left,
          y: o.top - c.top,
          scale: escala,
          borderRadius: RAIO_ORIGEM / escala,
          transformOrigin: '0 0',
          duration: 0.8,
          ease: 'power3.inOut',
        },
        0.1
      )
      .fromTo(
        painel,
        { clipPath: 'inset(0px 0px 0px 0px round 0px)' },
        {
          clipPath: `inset(${o.top}px ${vw - o.right}px ${vh - o.bottom}px ${o.left}px round ${RAIO_ORIGEM}px)`,
          duration: 0.8,
          ease: 'power3.inOut',
        },
        0.1
      );
  }, [origem, onFechada]);

  const mudarFoto = useCallback((i) => {
    setAtiva(Math.min(Math.max(i, 0), FOTOS.length - 1));
  }, []);

  const fecharFoto = useCallback(() => {
    // devolve o foco para a miniatura da foto que estava aberta
    const botao = rolagemRef.current?.querySelector(`[data-indice="${ativa}"]`);
    setAtiva(null);
    requestAnimationFrame(() => botao?.focus({ preventScroll: true }));
  }, [ativa]);

  /* Teclado: Esc fecha (visualizador primeiro, depois a galeria);
     setas passam as fotos quando o visualizador está aberto. */
  useEffect(() => {
    const aoTeclar = (evento) => {
      if (evento.key === 'Escape') {
        evento.preventDefault();
        if (ativa !== null) fecharFoto();
        else fechar();
      } else if (ativa !== null && evento.key === 'ArrowRight') {
        mudarFoto(ativa + 1);
      } else if (ativa !== null && evento.key === 'ArrowLeft') {
        mudarFoto(ativa - 1);
      }
    };
    window.addEventListener('keydown', aoTeclar);
    return () => window.removeEventListener('keydown', aoTeclar);
  }, [ativa, fechar, fecharFoto, mudarFoto]);

  const capa = FOTOS[0];

  return createPortal(
    <div className="galeria" data-lenis-prevent>
      <div
        className="galeria-painel"
        ref={painelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="galeria-titulo"
        tabIndex={-1}
        inert={ativa !== null}
      >
        <div className="galeria-topo">
          <span className="galeria-topo-slug">
            <span>//</span> bastidores
          </span>
          <button type="button" className="galeria-fechar" onClick={fechar}>
            Fechar <FiX aria-hidden="true" />
          </button>
        </div>

        <div className="galeria-rolagem" ref={rolagemRef}>
          <header className="galeria-capa">
            <div className="galeria-capa-foto" ref={capaFotoRef}>
              {/* a foto do Sobre já está em cache: serve de fundo
                  enquanto a versão maior carrega, sem piscar */}
              <Foto
                foto={capa}
                tipo="ampliada"
                sizes="min(460px, 86vw)"
                carregamento="eager"
                prioridade="high"
                fundo={fotoSobre}
              />
            </div>

            <div className="galeria-capa-texto">
              <p className="galeria-slug" data-entrada>
                <span>//</span> por trás das telas
              </p>
              <h2 className="galeria-titulo" id="galeria-titulo" data-entrada>
                Bastidores da <span>AUVOX</span>
              </h2>
              <p className="galeria-descricao" data-entrada>
                Reuniões, testes, café e muito código. Um pouco do dia a dia de quem
                constrói os nossos produtos.
              </p>
              <p className="galeria-total" data-entrada>
                {dois(FOTOS.length)} fotos <span aria-hidden="true">· clique para ampliar</span>
              </p>
            </div>
          </header>

          <ul className="galeria-grade">
            {FOTOS.map((foto, i) => (
              <li key={foto.id} data-entrada>
                <button
                  type="button"
                  className="galeria-item"
                  data-indice={i}
                  onClick={() => setAtiva(i)}
                  aria-label={`Ampliar: ${foto.alt}`}
                >
                  <Foto
                    foto={foto}
                    tipo="mini"
                    sizes="(max-width: 640px) 46vw, (max-width: 1100px) 31vw, 280px"
                  />
                  <span className="galeria-item-num" aria-hidden="true">{dois(i + 1)}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {ativa !== null && (
        <Visualizador indice={ativa} onMudar={mudarFoto} onFechar={fecharFoto} />
      )}
    </div>,
    document.body
  );
}
