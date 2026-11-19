import { useCallback, useEffect, useRef, useState } from 'react';
import '../styles/projetoIntermediPage.css';
import carrossel1 from '../assets/carroussel1.png';
import carrossel2 from '../assets/carroussel2.png';
import carrossel3 from '../assets/carroussel3.png';
import carrossel4 from '../assets/carroussel4.png';
import carrossel5 from '../assets/carroussel5.png';
import logoIntermedi from '../assets/logo-intermedi-texto.png';

const SLIDES = [
  { src: carrossel1, alt: 'Apresentação do aplicativo Intermedi' },
  { src: carrossel2, alt: 'Busca de medicamentos disponíveis em outras unidades' },
  { src: carrossel3, alt: 'Telas e recursos do Intermedi' },
  { src: carrossel4, alt: 'Interface da plataforma Intermedi' },
  { src: carrossel5, alt: 'Experiência do Intermedi em dispositivos móveis' },
];

export default function ProjetoIntermediPage({ onClose }) {
  const [slideAtual, setSlideAtual] = useState(0);
  const dialogRef = useRef(null);
  const navegar = useCallback((direcao) => {
    setSlideAtual((atual) => (atual + direcao + SLIDES.length) % SLIDES.length);
  }, []);

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
      if (event.key === 'Escape') { onClose(); return; }
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
  }, [navegar, onClose]);

  return (
    <main
      className="intermedi-page"
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="intermedi-modal-title"
      tabIndex={-1}
      onWheel={(event) => event.stopPropagation()}
    >
      <div className="intermedi-modal-shell">
        <header className="intermedi-modal-header">
          <button className="intermedi-fechar" type="button" onClick={onClose} aria-label="Fechar apresentação do projeto">×</button>
          <img className="intermedi-modal-logo" src={logoIntermedi} alt="Intermedi" />
        </header>

        <h1 className="intermedi-sr-only" id="intermedi-modal-title">Projeto Intermedi</h1>

        <section className="intermedi-carousel" aria-label="Imagens do projeto Intermedi">
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
            <button className="intermedi-arrow intermedi-arrow-prev" type="button" onClick={() => navegar(-1)} aria-label="Imagem anterior">←</button>
            <button className="intermedi-arrow intermedi-arrow-next" type="button" onClick={() => navegar(1)} aria-label="Próxima imagem">→</button>
          </div>
          <div className="intermedi-carousel-controls">
            <span className="intermedi-slide-count">0{slideAtual + 1} <i>/</i> 0{SLIDES.length}</span>
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
            <span className="intermedi-controls-hint">USE AS SETAS</span>
          </div>
        </section>

        <p className="intermedi-modal-description" id="intermedi-modal-description">
          Uma plataforma web e mobile que conecta a rede de farmácias em um só lugar. Reúne painel administrativo, gestão de chamados e ferramentas para apoiar a rotina das equipes no balcão.
        </p>
      </div>
    </main>
  );
}
