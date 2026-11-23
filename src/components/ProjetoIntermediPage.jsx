import { useCallback, useEffect, useRef, useState } from 'react';
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

export default function ProjetoIntermediPage({ onClose }) {
  const [slideAtual, setSlideAtual] = useState(0);
  const [fechando, setFechando] = useState(false);
  const dialogRef = useRef(null);
  const navegar = useCallback((direcao) => {
    setSlideAtual((atual) => (atual + direcao + SLIDES.length) % SLIDES.length);
  }, []);
  const fecharComAnimacao = useCallback(() => {
    if (fechando) return;
    const cardLogo = document.querySelector('#intermedi-project-card > img');
    const pageLogo = document.querySelector('.intermedi-modal-logo');
    const alvo = cardLogo?.getBoundingClientRect();
    const origem = pageLogo?.getBoundingClientRect();
    if (alvo && origem && pageLogo) {
      pageLogo.style.setProperty('--logo-dx', `${alvo.left - origem.left}px`);
      pageLogo.style.setProperty('--logo-dy', `${alvo.top - origem.top}px`);
      pageLogo.style.setProperty('--logo-sx', `${alvo.width / origem.width}`);
      pageLogo.style.setProperty('--logo-sy', `${alvo.height / origem.height}`);
    }
    setFechando(true);
    window.setTimeout(onClose, 480);
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
            <img className="intermedi-modal-logo" src={logoIntermedi} alt="Intermedi" />
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
