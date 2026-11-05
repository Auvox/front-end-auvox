import { useCallback, useEffect, useState } from 'react';
import '../styles/projeto.css';

import carrossel1 from '../assets/carroussel1.png';
import carrossel2 from '../assets/carroussel2.png';
import carrossel3 from '../assets/carroussel3.png';
import carrossel4 from '../assets/carroussel4.png';
import carrossel5 from '../assets/carroussel5.png';

const SLIDES = [
  { src: carrossel1, alt: 'Projeto Auvox — slide 1' },
  { src: carrossel2, alt: 'Projeto Auvox — slide 2' },
  { src: carrossel3, alt: 'Projeto Auvox — slide 3' },
  { src: carrossel4, alt: 'Projeto Auvox — slide 4' },
  { src: carrossel5, alt: 'Projeto Auvox — slide 5' },
];

export default function ProjetoAuvox() {
  const [slideAtual, setSlideAtual] = useState(0);
  const total = SLIDES.length;

  const navegar = useCallback((direcao) => {
    setSlideAtual((atual) => (atual + direcao + total) % total);
  }, [total]);

  const selecionar = (indice) => setSlideAtual(indice);

  useEffect(() => {
    const timer = window.setInterval(() => navegar(1), 6000);
    return () => window.clearInterval(timer);
  }, [navegar, slideAtual]);

  const offsetDe = (indice) => {
    let offset = indice - slideAtual;
    if (offset > total / 2) offset -= total;
    if (offset < -total / 2) offset += total;
    return offset;
  };

  return (
    <section className="projeto-secao projeto-secao-carrossel" id="projeto" aria-label="Projetos Auvox">
      <div
        className="projeto-carrossel"
        role="region"
        aria-roledescription="carrossel"
        aria-label="Projetos Auvox"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === 'ArrowLeft') navegar(-1);
          if (event.key === 'ArrowRight') navegar(1);
        }}
      >
        <div className="projeto-carrossel-palco">
          {SLIDES.map((slide, indice) => (
            <button
              type="button"
              className={`projeto-slide-imagem projeto-slide-offset-${offsetDe(indice)}${indice === slideAtual ? ' ativo' : ''}`}
              key={slide.src}
              aria-label={indice === slideAtual ? `Slide ${indice + 1}, atual` : `Ir para o slide ${indice + 1}`}
              aria-current={indice === slideAtual ? 'true' : undefined}
              tabIndex={Math.abs(offsetDe(indice)) > 1 ? -1 : 0}
              onClick={() => {
                if (indice !== slideAtual) navegar(offsetDe(indice));
              }}
            >
              <img src={slide.src} alt={slide.alt} draggable="false" loading={indice === 0 ? 'eager' : 'lazy'} />
            </button>
          ))}

          <button type="button" className="projeto-seta projeto-seta-anterior" onClick={() => navegar(-1)} aria-label="Slide anterior">‹</button>
          <button type="button" className="projeto-seta projeto-seta-proximo" onClick={() => navegar(1)} aria-label="Próximo slide">›</button>
        </div>

        <div className="projeto-carrossel-controles" role="tablist" aria-label="Escolher slide">
          {SLIDES.map((slide, indice) => (
            <button
              key={slide.src}
              type="button"
              role="tab"
              aria-label={`Ir para o slide ${indice + 1}`}
              aria-selected={indice === slideAtual}
              className={`projeto-ponto${indice === slideAtual ? ' ativo' : ''}`}
              onClick={() => selecionar(indice)}
            >
              {indice === slideAtual && <span key={slideAtual} className="projeto-ponto-progresso" />}
            </button>
          ))}
        </div>
      </div>

      <a className="projeto-saiba-mais" href="#contato">
        <span>saiba mais</span>
        <span className="projeto-saiba-seta" aria-hidden="true">↗</span>
      </a>
    </section>
  );
}
