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

function criarForma(pontos) {
  const forma = new THREE.Shape();
  pontos.forEach(([x, y], i) => {
    const px = (x - CENTRO.x) * ESCALA;
    const py = -(y - CENTRO.y) * ESCALA;
    if (i === 0) forma.moveTo(px, py);
    else forma.lineTo(px, py);
  });
  forma.closePath();
  return forma;
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
        clearcoatRoughness: 0.08,
      }),
      dourado: new THREE.MeshPhysicalMaterial({
        color: 0xf2b544,
        metalness: 1,
        roughness: 0.26,
        clearcoat: 0.6,
        clearcoatRoughness: 0.15,
      }),
    };

    const extrusao = {
      depth: 0.22,
      bevelEnabled: true,
      bevelThickness: 0.06,
      bevelSize: 0.045,
      bevelSegments: 4,
      curveSegments: 1,
    };

    const logo = new THREE.Group();
    PECAS.forEach((peca) => {
      const geometria = new THREE.ExtrudeGeometry(criarForma(peca.pontos), extrusao);
      const mesh = new THREE.Mesh(geometria, materiais[peca.cor]);
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
