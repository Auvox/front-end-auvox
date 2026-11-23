import { SiJavascript, SiNodedotjs, SiPostgresql, SiReact, SiSqlite, SiTypescript } from 'react-icons/si';
import '../styles/projeto.css';
import logoIntermedi from '../assets/logo-intermedi2.png';

/* Ferramentas usadas no Intermedi, com as logos oficiais (Simple Icons) e a
   cor de marca de cada uma. */
const TECNOLOGIAS = [
  { nome: 'Node.js', icone: <SiNodedotjs />, cor: '#5FA04E' },
  { nome: 'TypeScript', icone: <SiTypescript />, cor: '#3178C6' },
  { nome: 'JavaScript', icone: <SiJavascript />, cor: '#F7DF1E', fundoEscuro: true },
  { nome: 'React', icone: <SiReact />, cor: '#61DAFB', fundoEscuro: true },
  { nome: 'PostgreSQL', icone: <SiPostgresql />, cor: '#4169E1' },
  { nome: 'SQLite', icone: <SiSqlite />, cor: '#003B57' },
];

export default function ProjetoAuvox({ onOpen }) {
  return (
    <section className="projeto-secao projeto-secao-carrossel" id="projeto" aria-label="Projetos Auvox">
      <header className="projeto-cabecalho secao-topo">
        <p className="secao-slug"><span className="projeto-barras">//</span> projetos</p>
        <h2 className="secao-titulo" style={{ color: '#fff' }}>Nossos <span>projetos</span></h2>
        <div className="secao-sep" />
      </header>
      <div className="projeto-intermedi-bloco">
        <button id="intermedi-project-card" className="projeto-intermedi-logo-card" type="button" onClick={onOpen} aria-label="Abrir apresentação do projeto Intermedi">
          <img src={logoIntermedi} alt="Intermedi" />
          <span className="projeto-intermedi-card-abrir" aria-hidden="true">↗</span>
        </button>
        <ul className="projeto-intermedi-tech" aria-label="Tecnologias do Intermedi">
          {TECNOLOGIAS.map(({ nome, icone, cor, fundoEscuro }, indice) => (
            <li
              key={nome}
              className="projeto-intermedi-tech-selo"
              style={{ '--tech-cor': cor, '--tech-atraso': `${indice * 0.05}s` }}
            >
              <span className={`projeto-intermedi-tech-icone${fundoEscuro ? ' is-escuro' : ''}`} aria-hidden="true">
                {icone}
              </span>
              {nome}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
