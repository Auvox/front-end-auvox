import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import logoTextura from '../assets/3dauvox.webp';

gsap.registerPlugin(ScrollTrigger);

export default function LogoAuvOx3D() {
  const hostRef = useRef(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return undefined;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
    camera.position.z = 5;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    host.appendChild(renderer.domElement);

    const group = new THREE.Group();
    scene.add(group);
    const loader = new THREE.TextureLoader();
    loader.load(logoTextura, (texture) => {
      texture.colorSpace = THREE.SRGBColorSpace;
      const geometry = new THREE.PlaneGeometry(3.2, 3.2);
      const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true, side: THREE.DoubleSide });
      group.add(new THREE.Mesh(geometry, material));
      draw();
    });

    const resize = () => {
      const { width, height } = host.getBoundingClientRect();
      if (!width || !height) return;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      draw();
    };
    const draw = () => renderer.render(scene, camera);
    const observer = new ResizeObserver(resize);
    observer.observe(host);
    resize();

    const rotation = gsap.to(group.rotation, {
      y: Math.PI * 2,
      z: Math.PI * 0.12,
      ease: 'none',
      scrollTrigger: {
        trigger: '#solucoes',
        start: 'top top',
        end: 'bottom bottom',
        scrub: 1.2,
        onUpdate: draw,
      },
      onUpdate: draw,
    });

    return () => {
      observer.disconnect();
      rotation.scrollTrigger?.kill();
      rotation.kill();
      group.traverse((object) => {
        if (object.geometry) object.geometry.dispose();
        if (object.material) {
          object.material.map?.dispose();
          object.material.dispose();
        }
      });
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return <div className="ocean-logo ocean-logo-three" ref={hostRef} role="img" aria-label="Logo Auvox tridimensional" />;
}
