import '../styles/projeto.css';
import logoIntermedi from '../assets/logo-intermedi2.png';

export default function ProjetoAuvox() {
  return (
    <section className="projeto-secao projeto-secao-carrossel" id="projeto" aria-label="Projetos Auvox">
      <header className="projeto-cabecalho secao-topo">
        <p className="secao-slug"><span className="projeto-barras">//</span> projetos</p>
        <h2 className="secao-titulo" style={{ color: '#fff' }}>Nossos <span>projetos</span></h2>
        <div className="secao-sep" />
      </header>
      <a className="projeto-intermedi-logo-card" href="/projeto/intermedi" aria-label="Abrir página do projeto Intermedi">
        <img src={logoIntermedi} alt="Intermedi" />
        <span className="projeto-intermedi-card-abrir" aria-hidden="true">↗</span>
      </a>
    </section>
  );
}
