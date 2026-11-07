import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import gsap from 'gsap';
import { FiArrowLeft, FiArrowRight, FiX } from 'react-icons/fi';
import manifesto from '../assets/galeria/galeria.json';
import fotoSobre from '../assets/equipeAuvox.webp';
import { pausarRolagem, retomarRolagem } from '../lib/rolagem.js';
import '../styles/galeria.css';

/* ══════════════════════════════════════════════════════════════
   GALERIA "BASTIDORES"

   A foto da equipe no Sobre vira a primeira foto de um mosaico: ao
   clicar, ela voa do lugar dela até o início do mosaico enquanto o
   painel se abre do mesmo retângulo até a tela inteira. As outras
   fotos seguem em linhas que ocupam a largura toda e continuam para
   baixo; numa linha todas têm a mesma altura e cada uma mantém a
   própria proporção, sem recorte. Clicar numa foto abre o visualizador.

   As fotos vêm já otimizadas de src/assets/galeria (gere com
   `npm run galeria`). Este componente é carregado sob demanda: nada
   dele, nem as imagens, pesa no carregamento inicial do site.
   ══════════════════════════════════════════════════════════════ */

const URLS = import.meta.glob('../assets/galeria/*.{avif,webp}', {
  eager: true,
  // no-inline: sem isso o Vite embute as imagens < 4 KB em base64 no JS
  query: '?no-inline',
  import: 'default',
});
const url = (arquivo) => URLS[`../assets/galeria/${arquivo}`];
const srcset = (versoes, formato) =>
  versoes.map((v) => `${url(v[formato])} ${v.w}w`).join(', ');

const FOTOS = manifesto.fotos;

/* No mosaico, o quadro segue a proporção da foto dentro de um limite: um
   print muito largo (ex.: 1075×162) ou muito alto viraria uma tira. Fora
   do limite, o quadro fica no limite e a foto aparece inteira dentro dele. */
const PROPORCAO_MIN = 0.5;
const PROPORCAO_MAX = 1.8;
const quadroDe = (foto) => {
  const real = foto.largura / foto.altura;
  const proporcao = Math.min(Math.max(real, PROPORCAO_MIN), PROPORCAO_MAX);
  return { proporcao, inteira: proporcao !== real };
};
const RAIO_ORIGEM = 28; // mesmo raio da foto no Sobre (.sobre-hero-img-frame)
const reduzMovimento = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ── Foto otimizada: AVIF → WebP, com placeholder borrado por baixo ── */
function Foto({ foto, tipo, sizes, carregamento = 'lazy', prioridade, fundo, inteira = false }) {
  const versoes = tipo === 'mini' ? foto.miniaturas : foto.ampliadas;
  const maior = versoes[versoes.length - 1];
  const [pronta, setPronta] = useState(false);

  // imagens já em cache podem terminar de carregar antes do onLoad
  const verificar = useCallback((img) => {
    if (img?.complete && img.naturalWidth) setPronta(true);
  }, []);

  return (
    <span
      className={`galeria-foto${pronta ? ' pronta' : ''}${inteira ? ' -inteira' : ''}`}
      // foto inteira (com sobra em volta) dispensa o placeholder borrado
      style={inteira ? undefined : { backgroundImage: `url(${fundo ?? foto.placeholder})` }}
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
  const filmeRef = useRef(null);
  const foto = FOTOS[indice];

  // com muitas fotos a tira rola: mantém a miniatura ativa à vista
  useEffect(() => {
    const filme = filmeRef.current;
    const ativa = filme?.querySelector('.ativa');
    if (!ativa) return;
    const alvo = ativa.offsetLeft - (filme.clientWidth - ativa.offsetWidth) / 2;
    filme.scrollTo({ left: alvo, behavior: reduzMovimento() ? 'auto' : 'smooth' });
  }, [indice]);

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
        <p className="galeria-vis-legenda">
          <span className="galeria-vis-contador">
            {indice + 1} de {total}
          </span>
          {foto.alt}
        </p>
        <button type="button" className="galeria-botao" onClick={onFechar}>
          Voltar <FiX aria-hidden="true" />
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
          className="galeria-seta -anterior"
          onClick={() => onMudar(indice - 1)}
          disabled={indice === 0}
          aria-label="Foto anterior"
        >
          <FiArrowLeft aria-hidden="true" />
        </button>
        <button
          type="button"
          className="galeria-seta -proxima"
          onClick={() => onMudar(indice + 1)}
          disabled={indice === total - 1}
          aria-label="Próxima foto"
        >
          <FiArrowRight aria-hidden="true" />
        </button>
      </div>

      <div className="galeria-vis-filme" ref={filmeRef} role="tablist" aria-label="Escolher foto">
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
            <Foto foto={f} tipo="mini" sizes="56px" />
          </button>
        ))}
      </div>
    </div>
  );
}

/* ── Galeria ── */
export default function GaleriaBastidores({ origem, onFechada }) {
  const painelRef = useRef(null);
  const mosaicoRef = useRef(null);
  const primeiroRef = useRef(null);
  const vooRef = useRef(null);
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

  /* O "voo": uma cópia da foto do Sobre, solta por cima de tudo, sai do
     retângulo de origem e pousa sobre o primeiro quadro da faixa. Uma
     cópia, e não o próprio quadro, porque a faixa rola na horizontal e
     (dentro do painel que rola) cortaria a foto no meio do caminho. Mesma proporção (quadrada) nas
     duas pontas: o voo é só transform, sem animar largura/altura. */
  const caixa = (r) => ({ left: r.left, top: r.top, width: r.width, height: r.height });

  const ateOrigem = (destino) => {
    const o = origem.getBoundingClientRect();
    const escala = o.width / destino.width;
    return {
      x: o.left - destino.left,
      y: o.top - destino.top,
      scale: escala,
      borderRadius: RAIO_ORIGEM / escala,
    };
  };

  const recorteOrigem = () => {
    const o = origem.getBoundingClientRect();
    return `inset(${o.top}px ${window.innerWidth - o.right}px ${window.innerHeight - o.bottom}px ${o.left}px round ${RAIO_ORIGEM}px)`;
  };

  /* ABERTURA */
  useLayoutEffect(() => {
    const painel = painelRef.current;
    const primeiro = primeiroRef.current;
    const entradas = painel.querySelectorAll('[data-entrada]');
    // foco no próprio diálogo (leitor de tela anuncia o título; Tab
    // segue para o botão Fechar) sem acender anel de foco num botão
    painel.focus({ preventScroll: true });

    if (reduzMovimento()) return undefined;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.inOut' } });

      if (origem) {
        const destino = primeiro.getBoundingClientRect();
        const voo = vooRef.current;
        // tudo dentro da timeline: o revert (StrictMode, desmontagem)
        // desfaz junto o "esconder o quadro" e o "mostrar a cópia"
        tl.set(voo, { ...caixa(destino), display: 'block' }, 0)
          .set(primeiro, { visibility: 'hidden' }, 0)
          .fromTo(
            painel,
            { clipPath: recorteOrigem() },
            { clipPath: 'inset(0px 0px 0px 0px round 0px)', duration: 0.95, clearProps: 'clipPath' },
            0
          )
          .fromTo(
            voo,
            { ...ateOrigem(destino), transformOrigin: '0 0' },
            { x: 0, y: 0, scale: 1, borderRadius: 0, duration: 0.95 },
            0
          )
          .set(primeiro, { visibility: 'visible' }, 0.95)
          .set(voo, { display: 'none' }, 0.95);
      } else {
        tl.fromTo(painel, { opacity: 0 }, { opacity: 1, duration: 0.3 }, 0);
      }

      // título e texto sobem; as fotos da primeira tela sobem em cascata
      tl.fromTo(
        entradas,
        { opacity: 0, y: 28 },
        { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out', stagger: 0.07, clearProps: 'opacity,transform' },
        origem ? 0.5 : 0.1
      ).fromTo(
        Array.from(painel.querySelectorAll('.galeria-mosaico-item:not(:first-child)')).slice(0, 12),
        { opacity: 0, y: 40 },
        { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out', stagger: 0.05, clearProps: 'opacity,transform' },
        origem ? 0.55 : 0.15
      );
    }, painel);

    return () => ctx.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [origem]);

  /* FECHAMENTO — o caminho inverso: o texto some, a cópia sai do
     primeiro quadro e volta para a foto do Sobre, e o painel se recolhe
     em volta dela. */
  const fechar = useCallback(() => {
    if (fechando.current) return;
    fechando.current = true;

    const painel = painelRef.current;
    if (!origem || reduzMovimento()) {
      gsap.to(painel, { opacity: 0, duration: 0.2, onComplete: onFechada });
      return;
    }

    const primeiro = primeiroRef.current;
    const destino = primeiro.getBoundingClientRect();
    const voo = vooRef.current;

    gsap
      .timeline({ onComplete: onFechada })
      .set(voo, { ...caixa(destino), display: 'block', x: 0, y: 0, scale: 1, borderRadius: 0 }, 0)
      .set(primeiro, { visibility: 'hidden' }, 0)
      .to(painel.querySelectorAll('[data-entrada], .galeria-mosaico-item'), {
        opacity: 0,
        duration: 0.25,
        ease: 'power2.in',
      })
      .to(
        voo,
        {
          ...ateOrigem(destino),
          transformOrigin: '0 0',
          duration: 0.8,
          ease: 'power3.inOut',
        },
        0.1
      )
      .fromTo(
        painel,
        { clipPath: 'inset(0px 0px 0px 0px round 0px)' },
        { clipPath: recorteOrigem(), duration: 0.8, ease: 'power3.inOut' },
        0.1
      );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [origem, onFechada]);

  /* ── Visualizador ── */
  const mudarFoto = useCallback((i) => {
    setAtiva(Math.min(Math.max(i, 0), FOTOS.length - 1));
  }, []);

  const fecharFoto = useCallback(() => setAtiva(null), []);

  /* Ao fechar o visualizador, o foco volta para o quadro da última foto
     vista (depois do commit, quando o painel já deixou de estar inert). */
  const ultimaVista = useRef(null);
  useEffect(() => {
    if (ativa !== null) {
      ultimaVista.current = ativa;
    } else if (ultimaVista.current !== null) {
      mosaicoRef.current?.querySelector(`[data-indice="${ultimaVista.current}"]`)?.focus();
      ultimaVista.current = null;
    }
  }, [ativa]);

  /* Teclado: Esc fecha (visualizador primeiro, depois a galeria);
     setas passam as fotos no visualizador. */
  useEffect(() => {
    const aoTeclar = (evento) => {
      if (evento.key === 'Escape') {
        evento.preventDefault();
        if (ativa !== null) fecharFoto();
        else fechar();
      } else if (ativa !== null && (evento.key === 'ArrowRight' || evento.key === 'ArrowLeft')) {
        mudarFoto(ativa + (evento.key === 'ArrowRight' ? 1 : -1));
      }
    };
    window.addEventListener('keydown', aoTeclar);
    return () => window.removeEventListener('keydown', aoTeclar);
  }, [ativa, fechar, fecharFoto, mudarFoto]);

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
        <div className="galeria-conteudo">
          <header className="galeria-cabecalho">
            <h2 className="galeria-titulo" id="galeria-titulo" data-entrada>
              Bastidores da Auvox
            </h2>
            <button type="button" className="galeria-botao" onClick={fechar}>
              Fechar <FiX aria-hidden="true" />
            </button>
            <p className="galeria-descricao" data-entrada>
              Da sala do curso de Desenvolvimento de Sistemas, na ETEC de Guaianazes, às
              entregas dos nossos projetos: a equipe no dia a dia.
            </p>
            <p className="galeria-total" data-entrada>
              {FOTOS.length} fotos
            </p>
          </header>

          <ul className="galeria-mosaico" ref={mosaicoRef} aria-label="Fotos dos bastidores">
            {FOTOS.map((foto, i) => {
              const { proporcao, inteira } = quadroDe(foto);
              return (
              <li
                key={foto.id}
                className="galeria-mosaico-item"
                style={{ '--proporcao': proporcao }}
              >
                <button
                  type="button"
                  className="galeria-quadro"
                  ref={i === 0 ? primeiroRef : undefined}
                  data-indice={i}
                  onClick={() => setAtiva(i)}
                  aria-label={`Ampliar: ${foto.alt}`}
                >
                  <Foto
                    foto={foto}
                    tipo="ampliada"
                    sizes={`(max-width: 760px) ${Math.round(proporcao * 200)}px, ${Math.round(proporcao * 420)}px`}
                    carregamento={i < 8 ? 'eager' : 'lazy'}
                    prioridade={i === 0 ? 'high' : undefined}
                    fundo={i === 0 ? fotoSobre : undefined}
                    inteira={inteira}
                  />
                </button>
              </li>
              );
            })}
          </ul>
        </div>
      </div>

      {/* cópia que faz o voo entre a foto do Sobre e o primeiro quadro */}
      <div className="galeria-voo" ref={vooRef} aria-hidden="true">
        <img src={fotoSobre} alt="" />
      </div>

      {ativa !== null && (
        <Visualizador indice={ativa} onMudar={mudarFoto} onFechar={fecharFoto} />
      )}
    </div>,
    document.body
  );
}
