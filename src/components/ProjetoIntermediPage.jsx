import { useCallback, useEffect, useRef, useState } from 'react';
import '../styles/projetoIntermediPage.css';
import carrossel1 from '../assets/carroussel1.png';
import carrossel2 from '../assets/carroussel2.png';
import carrossel3 from '../assets/carroussel3.png';
import carrossel4 from '../assets/carroussel4.png';
import carrossel5 from '../assets/carroussel5.png';
import logoIntermedi from '../assets/logo-intermedi2.png';

const SLIDES = [
  { src: carrossel1, alt: 'Apresentação visual do aplicativo Intermedi' },
  { src: carrossel2, alt: 'Recursos e telas do Intermedi' },
  { src: carrossel3, alt: 'Experiência do Intermedi em dispositivos móveis' },
  { src: carrossel4, alt: 'Interface da plataforma Intermedi' },
  { src: carrossel5, alt: 'Detalhes do projeto Intermedi' },
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
        if (!focaveis.length) { event.preventDefault(); return; }
        const primeiro = focaveis[0];
        const ultimo = focaveis[focaveis.length - 1];
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
    <main className="intermedi-page" ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="intermedi-titulo" tabIndex={-1} onWheel={(event) => event.stopPropagation()}>
      <header className="intermedi-topbar">
        <a className="intermedi-voltar" href="/#projeto" aria-label="Voltar para os projetos Auvox">← <span>Voltar aos projetos</span></a>
        <a className="intermedi-marca" href="/" aria-label="Auvox — página inicial">AUVOX<span>.</span></a>
        <button className="intermedi-fechar" type="button" onClick={onClose} aria-label="Fechar apresentação do projeto">×</button>
      </header>

      <section className="intermedi-hero" aria-labelledby="intermedi-titulo">
        <div className="intermedi-hero-copy">
          <span className="intermedi-kicker"><i /> CASE DE PROJETO · SAÚDE</span>
          <h1 id="intermedi-titulo">Cuidado mais perto.<br /><em>Conexões que importam.</em></h1>
          <p>Uma plataforma pensada para aproximar pessoas, farmácias e informação — e tornar a busca por medicamentos uma experiência mais simples e humana.</p>
          <a className="intermedi-cta" href="#sobre-intermedi" onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            document.querySelector('.intermedi-page')?.scrollTo({ top: document.getElementById('sobre-intermedi')?.offsetTop ?? 0, behavior: 'smooth' });
          }}>Conheça o projeto <span>↓</span></a>
        </div>
        <div className="intermedi-logo-wrap"><img src={logoIntermedi} alt="Logo do Intermedi" /></div>
        <span className="intermedi-hero-index">0{slideAtual + 1} <b>/</b> 0{SLIDES.length}</span>
      </section>

      <section className="intermedi-galeria" aria-label="Galeria do projeto Intermedi">
        <div className="intermedi-section-heading">
          <span className="intermedi-kicker">01 — VISÃO DO PRODUTO</span>
          <p>Uma ideia que ganha forma<br />em cada tela.</p>
        </div>
        <div className="intermedi-carousel" tabIndex="0" aria-roledescription="carrossel" aria-label="Imagens do Intermedi">
          <div className="intermedi-carousel-stage">
            {SLIDES.map((slide, index) => {
              let delta = index - slideAtual;
              if (delta > SLIDES.length / 2) delta -= SLIDES.length;
              if (delta < -SLIDES.length / 2) delta += SLIDES.length;
              return <button type="button" key={slide.src} className={`intermedi-slide intermedi-slide-${delta}${delta === 0 ? ' is-active' : ''}`} aria-label={`Mostrar imagem ${index + 1} de ${SLIDES.length}`} aria-current={delta === 0 ? 'true' : undefined} onClick={() => delta && navegar(delta)}>
                <img src={slide.src} alt={slide.alt} draggable="false" />
              </button>;
            })}
            <button className="intermedi-arrow intermedi-arrow-prev" type="button" onClick={() => navegar(-1)} aria-label="Imagem anterior">←</button>
            <button className="intermedi-arrow intermedi-arrow-next" type="button" onClick={() => navegar(1)} aria-label="Próxima imagem">→</button>
          </div>
          <div className="intermedi-carousel-bottom">
            <span>0{slideAtual + 1} <i>/</i> 0{SLIDES.length}</span>
            <div className="intermedi-dots" role="tablist" aria-label="Escolher imagem">
              {SLIDES.map((slide, index) => <button key={slide.src} type="button" role="tab" aria-label={`Ir para imagem ${index + 1}`} aria-selected={slideAtual === index} className={slideAtual === index ? 'is-active' : ''} onClick={() => setSlideAtual(index)} />)}
            </div>
            <span className="intermedi-auto-label">DESLIZE OU USE AS SETAS</span>
          </div>
        </div>
      </section>

      <section className="intermedi-about" id="sobre-intermedi">
        <div className="intermedi-about-intro">
          <span className="intermedi-kicker">02 — SOBRE O PROJETO</span>
          <h2>Saúde se constrói<br />com <em>acesso e informação.</em></h2>
        </div>
        <div className="intermedi-about-copy">
          <p className="intermedi-lead">O Intermedi nasceu de uma pergunta simples: como facilitar o caminho entre quem precisa de um medicamento e quem pode ajudar a encontrá-lo?</p>
          <p>A resposta é uma plataforma digital que organiza a conexão entre pessoas e farmácias em um só lugar. Em vez de depender de buscas dispersas e contatos feitos um a um, o projeto propõe uma experiência centralizada, clara e fácil de acompanhar.</p>
          <p>Mais do que exibir informações, o Intermedi foi pensado para apoiar a rotina de todos os lados dessa jornada. A pessoa usuária consegue explorar opções e acompanhar possibilidades; as equipes de farmácia contam com ferramentas para organizar atendimentos, solicitações e informações do serviço.</p>
          <p>O produto também considera referências importantes da rede de assistência farmacêutica, como o SUS e a Farmácia Popular, para deixar esse contexto mais visível durante a navegação. A proposta é reduzir fricções, tornar a informação mais acessível e aproximar os serviços das pessoas.</p>
        </div>
      </section>

      <section className="intermedi-pilares">
        <div className="intermedi-section-heading">
          <span className="intermedi-kicker">03 — COMO AJUDA</span>
          <p>Uma experiência feita<br />para conectar pontas.</p>
        </div>
        <div className="intermedi-pilar-grid">
          <article><span>01</span><h3>Mais clareza<br />para encontrar</h3><p>Informações reunidas em uma experiência direta ajudam a pessoa a entender as opções disponíveis e seguir os próximos passos com mais segurança.</p></article>
          <article><span>02</span><h3>Mais organização<br />no atendimento</h3><p>Recursos de gestão e acompanhamento apoiam o trabalho das equipes e ajudam a manter solicitações e chamados em ordem.</p></article>
          <article><span>03</span><h3>Mais conexão<br />com a rede</h3><p>A plataforma aproxima pessoas e farmácias, trazendo referências de serviços como SUS e Farmácia Popular para dentro da jornada.</p></article>
        </div>
      </section>

      <section className="intermedi-encerramento">
        <span className="intermedi-kicker">INTERMEDI × AUVOX</span>
        <h2>Tecnologia com propósito.<br /><em>Impacto na vida real.</em></h2>
        <p>Um projeto em evolução, criado para transformar uma necessidade cotidiana em uma jornada digital mais acolhedora.</p>
        <a href="/#contato" className="intermedi-cta">Converse com a Auvox <span>↗</span></a>
      </section>
      <footer className="intermedi-footer"><a href="/">AUVOX<span>.</span></a><span>Intermedi — cuidado conectado.</span><a href="/#projeto">Voltar aos projetos ↑</a></footer>
    </main>
  );
}
