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

  useEffect(() => {
    const timer = window.setInterval(() => navegar(1), 6000);
    return () => window.clearInterval(timer);
  }, [navegar]);

  return (
    <section className="projeto-secao projeto-secao-carrossel" id="projeto" aria-label="Projetos Auvox">
      <div className="projeto-carrossel" aria-roledescription="carrossel">
        <div className="projeto-carrossel-palco">
          {SLIDES.map((slide, indice) => (
            <div
              className={`projeto-slide-imagem${indice === slideAtual ? ' ativo' : ''}`}
              key={slide.src}
              aria-hidden={indice !== slideAtual}
            >
              <img src={slide.src} alt={slide.alt} loading={indice === 0 ? 'eager' : 'lazy'} />
            </div>
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
              onClick={() => setSlideAtual(indice)}
            />
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
