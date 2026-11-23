import '../styles/projeto.css';
import logoIntermedi from '../assets/logo-intermedi2.png';

export default function ProjetoAuvox({ onOpen }) {
  return (
    <section className="projeto-secao projeto-secao-carrossel" id="projeto" aria-label="Projetos Auvox">
      <header className="projeto-cabecalho secao-topo">
        <p className="secao-slug"><span className="projeto-barras">//</span> projetos</p>
        <h2 className="secao-titulo" style={{ color: '#fff' }}>Nossos <span>projetos</span></h2>
        <div className="secao-sep" />
      </header>
      <button id="intermedi-project-card" className="projeto-intermedi-logo-card" type="button" onClick={onOpen} aria-label="Abrir apresentação do projeto Intermedi">
        <img src={logoIntermedi} alt="Intermedi" />
        <span className="projeto-intermedi-card-abrir" aria-hidden="true">↗</span>
        <span className="projeto-intermedi-tech" aria-hidden="true">
          <span className="projeto-intermedi-tech-selo tech-node"><i>⬡</i>Node.js</span>
          <span className="projeto-intermedi-tech-selo tech-ts"><i>TS</i>TypeScript</span>
          <span className="projeto-intermedi-tech-selo tech-js"><i>JS</i>JavaScript</span>
          <span className="projeto-intermedi-tech-selo tech-react"><i>⚛</i>React</span>
          <span className="projeto-intermedi-tech-selo tech-pg"><i>◉</i>PostgreSQL</span>
          <span className="projeto-intermedi-tech-selo tech-sqlite"><i>▤</i>SQLite</span>
        </span>
      </button>
    </section>
  );
}
