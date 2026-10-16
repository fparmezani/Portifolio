// Auth dos kits = mesma conta das Tools (mesmo origin após redirect).
// WhatsApp é pedido uma vez se ainda faltar no perfil.
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

/** Login obrigatório nos kits; WhatsApp só se ainda não estiver no perfil. */
export function exigirCadastro({ origem }) {
  return exigirCadastroShared({ origem, exigirWhatsapp: true });
}
