/* Acesso ao Lenis (scroll suave do App) para quem precisa pausar a
   página por trás de um overlay — ex.: a galeria de bastidores.
   O App registra a instância; os componentes só chamam pausar/retomar. */

let lenis = null;

export function registrarLenis(instancia) {
  lenis = instancia;
}

export function pausarRolagem() {
  lenis?.stop();
}

export function retomarRolagem() {
  lenis?.start();
}
