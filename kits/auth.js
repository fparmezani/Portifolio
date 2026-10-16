// Auth dos kits = mesma conta das Tools (mesmo origin após redirect).
// WhatsApp nunca bloqueia o kit; opcional só no form de e-mail (tools/auth.js).
if (location.hostname === "kits.fernandoparmezani.com.br") {
  const path = location.pathname === "/" ? "/" : location.pathname;
  location.replace("https://fernandoparmezani.com.br/kits" + path + location.search + location.hash);
}

export {
  supabase,
  toolsApiBase,
  accessToken,
  lerSaldoCreditos,
  comprarCreditos,
  atualizarSaldoBarra,
  barraDoUsuario,
  registrarUso,
  normalizarWhatsapp,
} from "../tools/auth.js";

import { exigirCadastro as exigirCadastroShared } from "../tools/auth.js";

/** Login obrigatório nos kits; um único formulário; libera download na hora. */
export function exigirCadastro({ origem }) {
  return exigirCadastroShared({ origem, contexto: "kit" });
}
