import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import '../styles/projetoIntermediPage.css';
import carrossel1 from '../assets/carroussel1.png';
import carrossel2 from '../assets/carroussel2.png';
import carrossel3 from '../assets/carroussel3.png';
import carrossel4 from '../assets/carroussel4.png';
import carrossel5 from '../assets/carroussel5.png';
import logoIntermedi from '../assets/logo-intermedi-modal.png';

const SLIDES = [
  { src: carrossel1, alt: 'Apresentação do aplicativo Intermedi' },
  { src: carrossel2, alt: 'Busca de medicamentos disponíveis em outras unidades' },
  { src: carrossel3, alt: 'Telas e recursos do Intermedi' },
  { src: carrossel4, alt: 'Interface da plataforma Intermedi' },
  { src: carrossel5, alt: 'Experiência do Intermedi em dispositivos móveis' },
];

/* Área onde o desenho da logo realmente está dentro de cada PNG (px da
   imagem original). A logo do card tem bastante margem branca; sem isto a
   transição miraria na caixa inteira da imagem e não na logo visível. */
const ARTE_CARD = { w: 2240, h: 1260, x0: 108, y0: 449, x1: 2129, y1: 798 };
const ARTE_PAGINA = { w: 1324, h: 232, x0: 5, y0: 4, x1: 1321, y1: 230 };
const DURACAO_LOGO = 620;
const EASING_LOGO = 'cubic-bezier(.2,.75,.25,1)';

/* Retângulo (na tela) do desenho da logo dentro de um <img> com
   object-fit: contain, levando em conta o letterbox da imagem. */
function retanguloDaArte(img, arte) {
  const caixa = img.getBoundingClientRect();
  const escala = Math.min(caixa.width / arte.w, caixa.height / arte.h);
  const sobraX = (caixa.width - arte.w * escala) / 2;
  const sobraY = (caixa.height - arte.h * escala) / 2;
  return {
    left: caixa.left + sobraX + arte.x0 * escala,
    top: caixa.top + sobraY + arte.y0 * escala,
    width: (arte.x1 - arte.x0) * escala,
    height: (arte.y1 - arte.y0) * escala,
  };
}

/* Transformação que leva a logo da página até a logo do card */
function transformacaoAteCard(pageLogo) {
  const cardLogo = document.querySelector('#intermedi-project-card > img');
  if (!cardLogo || !pageLogo) return null;
  const alvo = retanguloDaArte(cardLogo, ARTE_CARD);
  const visivel = alvo.width > 0 && alvo.top + alvo.height > 0 && alvo.top < window.innerHeight;
  if (!visivel) return null;
  const origem = retanguloDaArte(pageLogo, ARTE_PAGINA);
  const sx = alvo.width / origem.width;
  const sy = alvo.height / origem.height;
  /* transform-origin 0 0 na logo: o canto do desenho fica em
     (arte.x0, arte.y0) dentro da caixa, que também é escalado */
  const caixa = pageLogo.getBoundingClientRect();
  const dx = alvo.left - caixa.left - (origem.left - caixa.left) * sx;
  const dy = alvo.top - caixa.top - (origem.top - caixa.top) * sy;
  return `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`;
}

const prefereMenosMovimento = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export default function ProjetoIntermediPage({ onClose }) {
  const [slideAtual, setSlideAtual] = useState(0);
  const [fechando, setFechando] = useState(false);
  const dialogRef = useRef(null);
  const logoRef = useRef(null);
  const navegar = useCallback((direcao) => {
    setSlideAtual((atual) => (atual + direcao + SLIDES.length) % SLIDES.length);
  }, []);

  /* Abertura: a logo sai de cima da logo do card e pousa no lugar dela na
     página, enquanto o fundo branco e o restante do conteúdo aparecem. */
  useLayoutEffect(() => {
    const logo = logoRef.current;
    const cardLogo = document.querySelector('#intermedi-project-card > img');
    if (!logo || prefereMenosMovimento()) return undefined;
    const inicio = transformacaoAteCard(logo);
    if (!inicio) return undefined;
    cardLogo?.classList.add('is-em-transicao');
    const animacao = logo.animate(
      [{ transform: inicio }, { transform: 'none' }],
      { duration: DURACAO_LOGO, easing: EASING_LOGO },
    );
    return () => animacao.cancel();
  }, []);

  /* Ao desmontar a página, a logo do card volta a aparecer */
  useEffect(() => () => {
    document.querySelector('#intermedi-project-card > img')?.classList.remove('is-em-transicao');
  }, []);

  const fecharComAnimacao = useCallback(() => {
    if (fechando) return;
    setFechando(true);
    const logo = logoRef.current;
    /* se ainda estiver no meio da abertura, mede a partir da posição final */
    logo?.getAnimations().forEach((animacao) => animacao.cancel());
    const destino = prefereMenosMovimento() ? null : transformacaoAteCard(logo);
    if (!destino) {
      window.setTimeout(onClose, 320);
      return;
    }
    const animacao = logo.animate(
      [{ transform: 'none' }, { transform: destino }],
      { duration: DURACAO_LOGO, easing: EASING_LOGO, fill: 'forwards' },
    );
    animacao.onfinish = onClose;
  }, [fechando, onClose]);

  useEffect(() => {
    const timer = window.setInterval(() => navegar(1), 6000);
    return () => window.clearInterval(timer);
  }, [navegar]);

  useEffect(() => {
    const tituloAnterior = document.title;
    document.title = 'Intermedi — Projeto Auvox';
    return () => { document.title = tituloAnterior; };
  }, []);

  useEffect(() => {
    const dialog = dialogRef.current;
    const focoAnterior = document.activeElement;
    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialog?.focus();

    const onKeyDown = (event) => {
      if (event.key === 'Escape') { fecharComAnimacao(); return; }
      if (event.key === 'ArrowLeft') navegar(-1);
      if (event.key === 'ArrowRight') navegar(1);
      if (event.key === 'Tab' && dialog) {
        const focaveis = [...dialog.querySelectorAll('a[href], button:not([disabled])')];
        const primeiro = focaveis[0];
        const ultimo = focaveis[focaveis.length - 1];
        if (!primeiro) { event.preventDefault(); return; }
        if (event.shiftKey && (document.activeElement === primeiro || document.activeElement === dialog)) { event.preventDefault(); ultimo.focus(); }
        else if (!dialog.contains(document.activeElement)) { event.preventDefault(); primeiro.focus(); }
        else if (!event.shiftKey && document.activeElement === ultimo) { event.preventDefault(); primeiro.focus(); }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = overflowAnterior;
      if (focoAnterior instanceof HTMLElement) focoAnterior.focus();
    };
  }, [navegar, fecharComAnimacao]);

  return (
    <main
      className={`intermedi-page${fechando ? ' is-closing' : ''}`}
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="intermedi-modal-title"
      tabIndex={-1}
      onWheel={(event) => event.stopPropagation()}
    >
      <div className="intermedi-modal-shell">
        <header className="intermedi-modal-header">
          <button className="intermedi-fechar" type="button" onClick={fecharComAnimacao} aria-label="Voltar ao site">‹</button>
        </header>

        <h1 className="intermedi-sr-only" id="intermedi-modal-title">Projeto Intermedi</h1>

        <div className="intermedi-layout">
          <div className="intermedi-branding">
            <img className="intermedi-modal-logo" ref={logoRef} src={logoIntermedi} alt="Intermedi" width="1324" height="232" />
            <section className="intermedi-modal-description" aria-labelledby="intermedi-sobre-titulo">
              <h2 id="intermedi-sobre-titulo">Sobre a Intermedi</h2>
              <p id="intermedi-modal-description">
                Uma plataforma web e mobile que conecta a rede de farmácias em um só lugar. Reúne painel administrativo, gestão de chamados e ferramentas para apoiar a rotina das equipes no balcão.
              </p>
              <a className="intermedi-cta" href="#intermedi-carousel">Conheça a Intermedi</a>
            </section>
          </div>

          <section className="intermedi-carousel" id="intermedi-carousel" aria-label="Imagens do projeto Intermedi">
          <div className="intermedi-carousel-stage" aria-roledescription="carrossel">
            {SLIDES.map((slide, index) => (
              <div
                className={`intermedi-slide${index === slideAtual ? ' is-active' : ''}`}
                key={slide.src}
                role="group"
                aria-roledescription="slide"
                aria-label={`${index + 1} de ${SLIDES.length}`}
                aria-hidden={index !== slideAtual}
              >
                <img src={slide.src} alt={slide.alt} draggable="false" />
              </div>
            ))}
          </div>
          <div className="intermedi-carousel-controls">
            <div className="intermedi-dots" role="tablist" aria-label="Escolher imagem">
              {SLIDES.map((slide, index) => (
                <button
                  key={slide.src}
                  type="button"
                  role="tab"
                  aria-label={`Ir para imagem ${index + 1}`}
                  aria-selected={slideAtual === index}
                  className={slideAtual === index ? 'is-active' : ''}
                  onClick={() => setSlideAtual(index)}
                />
              ))}
            </div>
          </div>
          </section>
        </div>
      </div>
    </main>
  );
}
