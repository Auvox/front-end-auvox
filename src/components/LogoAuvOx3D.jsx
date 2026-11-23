import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/* Contornos do símbolo Auvox, medidos sobre a arte original (3dauvox.png,
   695 × 648 px, eixo Y para baixo). Cada peça vira um sólido extrudado, então
   o modelo tem frente, verso e laterais de verdade — ao girar, aparece a parte
   de trás da logo em vez de um plano chapado.
   Os pequenos vãos entre as peças reproduzem os frisos escuros da arte. */
const PECAS = [
  {
    nome: 'azul-superior',
    cor: 'azul',
    pontos: [[352, 55], [213, 293], [272, 378], [338, 352], [607, 474]],
  },
  {
    nome: 'faixa-dourada',
    cor: 'dourado',
    pontos: [[276, 388], [340, 362], [600, 482], [352, 404], [298, 424]],
  },
  {
    nome: 'azul-inferior',
    cor: 'azul',
    pontos: [[302, 434], [354, 414], [612, 490], [648, 540]],
  },
  {
    nome: 'triangulo-dourado',
    cor: 'dourado',
    pontos: [[196, 315], [60, 548], [290, 462]],
  },
];

const ESCALA = 1 / 165;
const CENTRO = { x: 354, y: 300 };

/* Sólido lapidado: lateral fina, chanfro na borda e facetas que sobem até
   um ápice — na frente e, espelhado, no verso (como as referências 3D). */
function criarGema(pontos) {
  const p = pontos.map(([x, y]) => new THREE.Vector2((x - CENTRO.x) * ESCALA, -(y - CENTRO.y) * ESCALA));
  const apice = p.reduce((soma, v) => soma.add(v), new THREE.Vector2()).divideScalar(p.length);
  let area = 0;
  p.forEach((a, i) => { const b = p[(i + 1) % p.length]; area += a.x * b.y - b.x * a.y; });
  area = Math.abs(area) / 2;

  const meia = 0.07;                       // meia espessura da lateral
  const chanfro = 0.05;                    // altura do chanfro
  const altura = 0.26 * Math.sqrt(area);   // quanto o ápice sobe
  const q = p.map((v) => apice.clone().add(v.clone().sub(apice).multiplyScalar(0.9)));

  const pos = [];
  const tri = (a, b, c) => pos.push(...a, ...b, ...c);
  const n = p.length;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    const [a, b, qa, qb] = [p[i], p[j], q[i], q[j]];
    // lateral
    tri([a.x, a.y, meia], [a.x, a.y, -meia], [b.x, b.y, meia]);
    tri([b.x, b.y, meia], [a.x, a.y, -meia], [b.x, b.y, -meia]);
    for (const s of [1, -1]) {
      const z0 = s * meia;
      const z1 = s * (meia + chanfro);
      const zA = s * (meia + altura);
      // chanfro
      tri([a.x, a.y, z0], [b.x, b.y, z0], [qa.x, qa.y, z1]);
      tri([qa.x, qa.y, z1], [b.x, b.y, z0], [qb.x, qb.y, z1]);
      // faceta até o ápice
      tri([qa.x, qa.y, z1], [qb.x, qb.y, z1], [apice.x, apice.y, zA]);
    }
  }
  const geometria = new THREE.BufferGeometry();
  geometria.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geometria.computeVertexNormals(); // não indexada → normais por face (facetado)
  return geometria;
}

export default function LogoAuvOx3D() {
  const hostRef = useRef(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return undefined;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
    camera.position.set(0, 0, 9);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    host.appendChild(renderer.domElement);

    /* Ambiente de estúdio para os reflexos metálicos (sem carregar HDR) */
    const pmrem = new THREE.PMREMGenerator(renderer);
    const ambiente = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = ambiente;

    const luzChave = new THREE.DirectionalLight(0xffffff, 1.6);
    luzChave.position.set(3, 4, 6);
    const luzRecorte = new THREE.DirectionalLight(0xffd88a, 1.1);
    luzRecorte.position.set(-4, -2, -5);
    scene.add(luzChave, luzRecorte, new THREE.AmbientLight(0xffffff, 0.25));

    const materiais = {
      azul: new THREE.MeshPhysicalMaterial({
        color: 0x1b2566,
        metalness: 0.55,
        roughness: 0.22,
        clearcoat: 1,
        clearcoatRoughness: 0.06,
        flatShading: true,
        side: THREE.DoubleSide,
      }),
      dourado: new THREE.MeshPhysicalMaterial({
        color: 0xf2b544,
        metalness: 1,
        roughness: 0.26,
        clearcoat: 0.6,
        clearcoatRoughness: 0.12,
        flatShading: true,
        side: THREE.DoubleSide,
      }),
    };

    const logo = new THREE.Group();
    PECAS.forEach((peca) => {
      const mesh = new THREE.Mesh(criarGema(peca.pontos), materiais[peca.cor]);
      mesh.name = peca.nome;
      logo.add(mesh);
    });

    /* Centraliza o sólido (inclusive na profundidade) para girar no próprio eixo */
    const caixa = new THREE.Box3().setFromObject(logo);
    const centro = caixa.getCenter(new THREE.Vector3());
    logo.children.forEach((mesh) => mesh.geometry.translate(-centro.x, -centro.y, -centro.z));

    const pivo = new THREE.Group();
    pivo.add(logo);
    pivo.rotation.set(-0.12, -0.35, 0);
    scene.add(pivo);

    const draw = () => renderer.render(scene, camera);

    const resize = () => {
      const { width, height } = host.getBoundingClientRect();
      if (!width || !height) return;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      draw();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(host);
    resize();

    /* Gira conforme a página desce: começa quando o bloco entra na tela e
       completa duas voltas (frente → verso → frente → verso → frente) até o
       fim das quatro cenas fixadas do slide. */
    const reduzirMovimento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const gatilho = host.closest('.slide-scroll-unificado') || host;
    const rotacao = reduzirMovimento
      ? null
      : gsap.to(pivo.rotation, {
          y: -0.35 + Math.PI * 4,
          x: 0.12,
          ease: 'none',
          onUpdate: draw,
          scrollTrigger: {
            trigger: gatilho,
            start: 'top bottom',
            end: () => `+=${window.innerHeight * 5}`,
            scrub: 1.2,
            invalidateOnRefresh: true,
          },
        });

    return () => {
      observer.disconnect();
      rotacao?.scrollTrigger?.kill();
      rotacao?.kill();
      logo.children.forEach((mesh) => mesh.geometry.dispose());
      Object.values(materiais).forEach((material) => material.dispose());
      ambiente.dispose();
      pmrem.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return <div className="ocean-logo ocean-logo-three" ref={hostRef} role="img" aria-label="Logo Auvox tridimensional" />;
}
