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
      <button className="projeto-intermedi-logo-card" type="button" onClick={onOpen} aria-label="Abrir apresentação do projeto Intermedi">
        <img src={logoIntermedi} alt="Intermedi" />
        <span className="projeto-intermedi-card-abrir" aria-hidden="true">↗</span>
      </button>
    </section>
  );
}
