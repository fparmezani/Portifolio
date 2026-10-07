(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.RaioXAnalyze = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  const STOP = new Set(`
    a o os as de da do das dos e em no na nos nas um uma uns umas para por com sem sob sobre
    que quem qual quais cujo cuja cujo cujo ou mas se como quando onde porque porquê porque
    the of and to in for on with from by at as is are was were be been being this that
    your you our their its it an or not into onto than then also more most other such
    experiencia experiencia profissional formacao formacao academica educacao education
    habilidades competencias skills tecnologias stack objetivo resumo summary contato
    telefone email e-mail curriculo curriculum vitae anos ano meses mes atual presente
    brasil paulo sao são remoto hibrido híbrido clt pj empresa empresas projeto projetos
    sistema sistemas equipe time cliente clientes desenvolvimento desenvolvedor desenvolvedora
    developer engineer engenheiro analista estagiario estagiário pleno senior sênior junior
    júnior tech lead gerente coordenador consultor especialista profissional trabalho
    trabalhei atuei responsavel responsável atividades atividade resultados resultado
    usando uso utilizada utilizado tools ferramentas conhecimento conhecimentos
    janeiro fevereiro marco março abril maio junho julho agosto setembro outubro novembro dezembro
    jan fev mar abr mai jun jul ago set out nov dez january february march april june july august september october november december
    rua avenida av centro cidade estado cep linkedin github http https www com br
  `.split(/\s+/).filter(Boolean));

  const TECH = [
    { id: "javascript", label: "JavaScript", family: "web", weight: 4, pattern: /\bjavascript\b/gi },
    { id: "typescript", label: "TypeScript", family: "web", weight: 4, pattern: /\btypescript\b/gi },
    { id: "nodejs", label: "Node.js", family: "web", weight: 4, pattern: /\bnode\.?js\b/gi },
    { id: "react", label: "React", family: "web", weight: 4, pattern: /\breact(?:\.js)?\b/gi },
    { id: "angular", label: "Angular", family: "web", weight: 4, pattern: /\bangular\b/gi },
    { id: "vue", label: "Vue", family: "web", weight: 4, pattern: /\bvue(?:\.js)?\b/gi },
    { id: "csharp", label: "C#", family: "dotnet", weight: 5, pattern: /\bcsharp\b|\bc\s+sharp\b|\bc\s*#/gi },
    { id: "dotnet", label: ".NET", family: "dotnet", weight: 5, pattern: /\basp\.net(?:\s+core)?\b|\bdotnet\b|(?<![a-z])\.net(?:\s+core)?\b/gi },
    { id: "linq", label: "LINQ", family: "dotnet", weight: 4, pattern: /\blinq\b/gi },
    { id: "ef", label: "Entity Framework", family: "dotnet", weight: 4, pattern: /\bentity\s+framework(?:\s+core)?\b|\bef\s*core\b/gi },
    { id: "sqlserver", label: "SQL Server", family: "data", weight: 4, pattern: /\bsql\s*server\b/gi },
    { id: "postgres", label: "PostgreSQL", family: "data", weight: 4, pattern: /\bpostgres(?:ql)?\b/gi },
    { id: "mysql", label: "MySQL", family: "data", weight: 3, pattern: /\bmysql\b/gi },
    { id: "sql", label: "SQL", family: "data", weight: 3, pattern: /\bsql\b/gi },
    { id: "azure", label: "Azure", family: "azure", weight: 3, pattern: /\bazure\b/gi },
    { id: "aws", label: "AWS", family: "cloud", weight: 3, pattern: /\baws\b/gi },
    { id: "docker", label: "Docker", family: "cloud", weight: 3, pattern: /\bdocker\b/gi },
    { id: "kubernetes", label: "Kubernetes", family: "cloud", weight: 3, pattern: /\bkubernetes\b|\bk8s\b/gi },
    { id: "python", label: "Python", family: "other", weight: 4, pattern: /\bpython\b/gi },
    { id: "java", label: "Java", family: "other", weight: 4, pattern: /\bjava\b/gi },
    { id: "php", label: "PHP", family: "other", weight: 4, pattern: /\bphp\b/gi },
    { id: "kotlin", label: "Kotlin", family: "other", weight: 4, pattern: /\bkotlin\b/gi },
    { id: "flutter", label: "Flutter", family: "other", weight: 4, pattern: /\bflutter\b/gi },
    { id: "golang", label: "Go", family: "other", weight: 3, pattern: /\bgolang\b/gi }
  ];

  const SECTION_MARKERS = [
    { id: "objetivo", label: "Objetivo", pattern: /\b(objetivo profissional|objetivo)\b/i },
    { id: "resumo", label: "Resumo", pattern: /\b(resumo profissional|resumo|summary|sobre mim)\b/i },
    { id: "experiencia", label: "Experiência", pattern: /\b(experi[eê]ncia profissional|experi[eê]ncia|experience)\b/i },
    { id: "formacao", label: "Formação", pattern: /\b(forma[cç][aã]o acad[eê]mica|forma[cç][aã]o|educa[cç][aã]o|education)\b/i },
    { id: "skills", label: "Habilidades", pattern: /\b(habilidades|compet[eê]ncias|skills|tecnologias)\b/i },
    { id: "cursos", label: "Cursos", pattern: /\b(cursos complementares|cursos|treinamentos)\b/i },
    { id: "certificados", label: "Certificados", pattern: /\b(certificados|certifica[cç][oõ]es)\b/i },
    { id: "idiomas", label: "Idiomas", pattern: /\b(idiomas|languages)\b/i },
    { id: "projetos", label: "Projetos", pattern: /\b(projetos relevantes|projetos pessoais|projects)\b/i }
  ];

  function countAndMask(text, pattern) {
    const flags = pattern.flags.includes("g") ? pattern.flags : pattern.flags + "g";
    const re = new RegExp(pattern.source, flags);
    const matches = text.match(re);
    return {
      count: matches ? matches.length : 0,
      masked: text.replace(re, " ")
    };
  }

  function stripDiacritics(value) {
    return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  }

  function findSections(text) {
    const found = [];
    for (const marker of SECTION_MARKERS) {
      const match = marker.pattern.exec(text);
      if (!match) continue;
      found.push({ id: marker.id, label: marker.label, index: match.index });
    }
    found.sort((a, b) => a.index - b.index);
    return found.map((section, index) => ({
      ...section,
      end: found[index + 1] ? found[index + 1].index : text.length
    }));
  }

  function sliceOf(sections, id, text) {
    const section = sections.find((item) => item.id === id);
    if (!section) return "";
    return text.slice(section.index, section.end);
  }

function keywordIn(text, keyword) {
  if (!keyword || keyword.weak) return false;
  if (keyword.generic) return stripDiacritics(text.toLowerCase()).includes(keyword.label);
  const flags = keyword.pattern.flags.includes("g") ? keyword.pattern.flags : keyword.pattern.flags + "g";
  return new RegExp(keyword.pattern.source, flags).test(text);
}

  function pickKeyword(text) {
    let scan = text.toLowerCase();
    const techHits = [];
    for (const term of TECH) {
      const result = countAndMask(scan, term.pattern);
      scan = result.masked;
      if (result.count > 0) {
        techHits.push({ ...term, count: result.count, score: result.count * term.weight, generic: false });
      }
    }

    const counts = new Map();
    const tokens = scan.match(/[a-zà-ÿ][a-zà-ÿ0-9+#.]{2,}/gi) || [];
    for (const token of tokens) {
      const key = stripDiacritics(token.toLowerCase());
      if (STOP.has(key) || STOP.has(token.toLowerCase())) continue;
      if (/^\d+$/.test(key)) continue;
      counts.set(key, (counts.get(key) || 0) + 1);
    }

    const genericHits = [...counts.entries()].map(([label, count]) => ({
      id: label,
      label,
      family: "generic",
      weight: 1,
      pattern: new RegExp(`\\b${label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "gi"),
      count,
      score: count,
      generic: true
    }));

    const ranked = [...techHits, ...genericHits].sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (b.count !== a.count) return b.count - a.count;
      if (a.generic !== b.generic) return a.generic ? 1 : -1;
      return 0;
    });

    const winner = ranked[0];
    if (!winner || winner.count < 2) {
      return {
        weak: true,
        hint: winner ? { label: winner.label, count: winner.count } : null,
        dotnetMentions: techHits.filter((item) => item.family === "dotnet").reduce((sum, item) => sum + item.count, 0)
      };
    }

    const dotnetMentions = techHits
      .filter((item) => item.family === "dotnet")
      .reduce((sum, item) => sum + item.count, 0);

    return {
      weak: false,
      id: winner.id,
      label: winner.label,
      family: winner.family,
      count: winner.count,
      pattern: winner.pattern,
      generic: winner.generic,
      dotnetMentions
    };
  }

  function countYears(text) {
    const matches = text.match(/\b(?:19|20)\d{2}\b/g) || [];
    return new Set(matches).size;
  }

  function clip(value, size) {
    const clean = value.replace(/\s+/g, " ").trim();
    if (clean.length <= size) return clean;
    return `${clean.slice(0, size).trim()}…`;
  }

  function experienceBlocks(experienceText) {
    if (!experienceText) return [];
    const re = /\b(?:19|20)\d{2}\b(?:\s*[-–—/a]\s*(?:(?:19|20)\d{2}|atual|presente|hoje|current))?/gi;
    const marks = [...experienceText.matchAll(re)];
    const anchors = [];
    for (const mark of marks) {
      const last = anchors[anchors.length - 1];
      if (last && mark.index - last.end < 10) {
        last.end = mark.index + mark[0].length;
        last.date = experienceText.slice(last.index, last.end).replace(/\s+/g, " ");
        continue;
      }
      anchors.push({
        index: mark.index,
        end: mark.index + mark[0].length,
        date: mark[0].replace(/\s+/g, " ")
      });
    }
    return anchors.slice(0, 4).map((anchor, index) => {
      const next = anchors[index + 1];
      const before = experienceText.slice(Math.max(0, anchor.index - 70), anchor.index);
      const heading = before.split(/\s+/).filter(Boolean).slice(-3).join(" ");
      let body = experienceText.slice(anchor.end, next ? next.index : experienceText.length).trim();
      if (next) {
        const parts = body.split(/\s+/).filter(Boolean);
        if (parts.length > 3) body = parts.slice(0, -3).join(" ");
      }
      return {
        date: anchor.date,
        heading,
        body,
        excerpt: clip(`${heading} ${anchor.date} ${body}`, 140)
      };
    });
  }

  function cleanField(value, max) {
    const text = String(value || "").replace(/\s+/g, " ").trim();
    return text ? text.slice(0, max) : null;
  }

  function vacancyOverlap(resume, description) {
    if (!description) return null;
    const words = [];
    const seen = new Set();
    const shortTech = /^(c#|c\+\+|go|sql|api|ef)$/i;
    for (const token of description.match(/[A-Za-zÀ-ÿ0-9+#.+]{2,}/g) || []) {
      const key = stripDiacritics(token.toLowerCase());
      if ((token.length < 4 && !shortTech.test(key)) || STOP.has(key) || seen.has(key)) continue;
      seen.add(key);
      words.push(token);
      if (words.length >= 12) break;
    }
    if (!words.length) return { checked: 0, present: 0, missing: [] };
    const hay = stripDiacritics(resume.toLowerCase());
    const missing = words.filter((word) => !hay.includes(stripDiacritics(word.toLowerCase())));
    return {
      checked: words.length,
      present: words.length - missing.length,
      missing: missing.slice(0, 5)
    };
  }

  function wordCount(value) {
    return value.split(/\s+/).filter(Boolean).length;
  }

  function mentionOf(text, source) {
    const match = new RegExp(source, "i").exec(text);
    if (!match) return null;
    return clip(text.slice(Math.max(0, match.index - 30), match.index + 110), 160);
  }

  function suggestBullet(job) {
    const body = String(job.body || "").replace(/\s+/g, " ").trim();
    if (wordCount(body) < 8) {
      return "O arquivo quase não descreve este cargo. Sem frase, não há reescrita.";
    }
    let framed = body.replace(/^(respons[aá]vel por|responsible for|ajudei a|helped (?:with|to)|atuei em|participei de)\s+/i, "");
    framed = framed.charAt(0).toUpperCase() + framed.slice(1);
    if (!hasResultNumber(body)) framed += " [falta o número do resultado]";
    return clip(framed, 320);
  }

  function jobNotes(block, keyword) {
    const notes = [];
    if (!hasResultNumber(block.body)) notes.push("Não há um número de resultado neste cargo.");
    if (!keyword.weak && !keywordIn(`${block.heading} ${block.body}`, keyword)) {
      notes.push(`“${keyword.label}” não aparece neste cargo.`);
    }
    if (wordCount(block.body) < 8) notes.push("Quase só há cargo e data.");
    if (!notes.length) notes.push("Este cargo tem texto, um número e a palavra em destaque.");
    return notes;
  }

  function sheet(label, present, summary, excerpt, notes, jobs) {
    return {
      label,
      present,
      summary,
      excerpt: excerpt || null,
      notes: notes || [],
      jobs: jobs || []
    };
  }

  function namedBlock(section, text) {
    const body = text.slice(section.index, section.end);
    return sheet(section.label, true, `${section.label} tem ${wordCount(body)} palavras neste trecho.`, clip(body, 180));
  }

  function looseBlock(label, text, headingId, sections, source, missingSummary) {
    const section = sections.find((item) => item.id === headingId);
    if (section) return namedBlock({ ...section, label }, text);
    const excerpt = mentionOf(text, source);
    if (excerpt) {
      return sheet(label, true, `Não há um título “${label}”. A palavra aparece no meio do texto.`, excerpt);
    }
    return sheet(label, false, missingSummary, null);
  }

  function resumeBlocks(text, sections, keyword) {
    const blocks = [];
    const firstIndex = sections.length ? sections[0].index : text.length;
    const header = text.slice(0, firstIndex).trim();
    const headZone = header.length >= 40 ? header : text.slice(0, 600);
    const hasEmail = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i.test(headZone);
    const hasPhone = /\(\d{2}\)\s*\d{4,5}-?\d{4}/.test(headZone)
      || /\+55\s?\d{2}\s?9?\d{4}-?\d{4}/.test(headZone)
      || /\b\d{2}\s?9\d{4}-?\d{4}\b/.test(headZone);
    const hasLinkedin = /\blinkedin\b/i.test(headZone);
    const contact = [];
    if (hasEmail) contact.push("e-mail");
    if (hasPhone) contact.push("telefone");
    if (hasLinkedin) contact.push("LinkedIn");
    const headerNotes = [];
    if (!hasEmail) headerNotes.push("Não achei e-mail no começo do arquivo.");
    if (!hasPhone) headerNotes.push("Não achei telefone no começo do arquivo.");
    if (!hasLinkedin) headerNotes.push("Não achei LinkedIn no começo do arquivo.");
    blocks.push(sheet(
      "Cabeçalho",
      Boolean(header || contact.length),
      contact.length
        ? `No começo do arquivo há ${contact.join(", ")}.`
        : "No começo do arquivo não achei e-mail, telefone nem LinkedIn.",
      header ? clip(header, 180) : (headZone ? clip(headZone, 180) : null),
      headerNotes
    ));

    const objetivo = sections.find((item) => item.id === "objetivo");
    const resumo = sections.find((item) => item.id === "resumo");
    if (objetivo) {
      const body = text.slice(objetivo.index, objetivo.end);
      const count = wordCount(body);
      const notes = [];
      if (count < 12) notes.push("O objetivo tem poucas palavras.");
      blocks.push(sheet("Objetivo", true, `Objetivo tem ${count} palavras neste trecho.`, clip(body, 180), notes));
    } else {
      blocks.push(sheet(
        "Objetivo",
        false,
        resumo
          ? "Não achei um título Objetivo. O arquivo tem Resumo no lugar."
          : "Não achei um título Objetivo nem Resumo.",
        null
      ));
    }

    const experience = sections.find((item) => item.id === "experiencia");
    if (!experience) {
      blocks.push(sheet("Experiência", false, "Não achei um título Experiência.", null));
    } else {
      const jobs = experienceBlocks(text.slice(experience.index, experience.end));
      blocks.push(sheet(
        "Experiência",
        true,
        jobs.length
          ? `Separei ${jobs.length} cargo(s) pela data.`
          : "A seção existe, mas não separei cargos por ano.",
        jobs.length ? null : clip(text.slice(experience.index, experience.end), 180),
        [],
        jobs.map((job, index) => ({
          title: `Cargo ${index + 1} (${job.date})`,
          excerpt: job.excerpt,
          detail: jobNotes(job, keyword).join(" "),
          suggestion: suggestBullet(job)
        }))
      ));
    }

    blocks.push(looseBlock(
      "Cursos",
      text,
      "cursos",
      sections,
      "\\b(curso|cursos|treinamento|treinamentos)\\b",
      "Não achei curso nem treinamento no texto."
    ));
    blocks.push(looseBlock(
      "Certificados",
      text,
      "certificados",
      sections,
      "\\b(certificado|certificados|certifica[cç][aã]o|certifica[cç][oõ]es)\\b",
      "Não achei certificado nem certificação no texto."
    ));

    for (const section of sections) {
      if (["objetivo", "experiencia", "cursos", "certificados"].includes(section.id)) continue;
      blocks.push(namedBlock(section, text));
    }

    return blocks;
  }

  function buildSuggestion(blocks) {
    return (blocks || []).map((block) => {
      if (block.jobs && block.jobs.length) {
        return {
          label: block.label,
          items: block.jobs.map((job) => ({
            title: job.title,
            source: job.excerpt,
            suggestion: job.suggestion
          }))
        };
      }
      return {
        label: block.label,
        items: [{
          title: block.present ? "No arquivo" : "Ausente",
          source: block.excerpt,
          suggestion: block.present
            ? "Mantido como está no arquivo. Contato, título e data não são reescritos."
            : "Nada sugerido. O arquivo não traz este bloco."
        }]
      };
    });
  }

  function hasResultNumber(body) {
    const withoutYears = body.replace(/\b(?:19|20)\d{2}\b/g, " ");
    return /\d/.test(withoutYears);
  }

  function reviewExperiences(experienceText, keyword) {
    const blocks = experienceBlocks(experienceText);
    if (!blocks.length) {
      return {
        score: experienceText ? 20 : 0,
        items: [],
        gaps: experienceText
          ? [{ title: "Experiências sem data separável", detail: "A seção existe, mas não achei anos para separar um cargo do outro." }]
          : []
      };
    }

    const gaps = [];
    const solid = [];
    const scores = blocks.map((block, index) => {
      const where = `Experiência ${index + 1} (${block.date})`;
      const missing = [];
      let score = 100;
      if (!hasResultNumber(block.body)) {
        score -= 40;
        missing.push("não há um número de resultado. Falta o efeito do trabalho");
      }
      if (!keyword.weak && !keywordIn(`${block.heading} ${block.body}`, keyword)) {
        score -= 30;
        missing.push(`“${keyword.label}” não aparece neste trecho`);
      }
      if (block.body.split(/\s+/).filter(Boolean).length < 8) {
        score -= 30;
        missing.push("o texto quase só tem cargo e data. Falta descrever o que foi feito");
      }
      if (missing.length) {
        gaps.push({
          title: where,
          excerpt: block.excerpt,
          missing,
          detail: missing.join(" ")
        });
      } else {
        solid.push({
          title: where,
          excerpt: block.excerpt,
          detail: "Este bloco tem texto, a palavra em destaque e um número."
        });
      }
      return Math.max(0, score);
    });

    const score = Math.round(scores.reduce((sum, value) => sum + value, 0) / scores.length);
    return { score, items: solid, gaps };
  }

  function repeatedVerb(text) {
    const verbs = [
      { label: "desenvolvi", pattern: /\bdesenvolv(?:i|eu|emos|ido|er|a)\b|\bdeveloped\b/gi },
      { label: "atuei", pattern: /\batue[iu]\b|\bworked\b/gi },
      { label: "mantive", pattern: /\bmantive\b|\bmaintained\b/gi },
      { label: "construí", pattern: /\bconstru[ií]\b|\bbuilt\b/gi },
      { label: "participei", pattern: /\bparticip(?:ei|ou)\b/gi },
      { label: "implementei", pattern: /\bimplement(?:ei|ou|ed)\b/gi },
      { label: "criei", pattern: /\bcriei\b|\bcreated\b/gi },
      { label: "liderei", pattern: /\blider(?:ei|ou)\b|\bled\b/gi }
    ];
    let best = null;
    for (const verb of verbs) {
      const count = (text.match(new RegExp(verb.pattern.source, "gi")) || []).length;
      if (!best || count > best.count) best = { label: verb.label, count };
    }
    return best && best.count >= 3 ? best : null;
  }

  function mixedDateFormats(text) {
    const kinds = [];
    if (/\b(jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez|janeiro|fevereiro|mar[cç]o|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)\b/i.test(text)) {
      kinds.push("mês por extenso");
    }
    if (/\b(?:0?[1-9]|1[0-2])\s*\/\s*(?:19|20)\d{2}\b/.test(text)) kinds.push("mês/ano");
    if (/\b(?:19|20)\d{2}\s*[-–—]\s*(?:(?:19|20)\d{2}|atual|presente|hoje)\b/i.test(text)) kinds.push("ano–ano");
    return kinds.length >= 2 ? kinds : null;
  }

  function certificateRank(text) {
    const hits = text.match(/\b(certifica(?:ção|ções|cao|coes)|certificados?|cursos?|treinamentos?)\b/gi) || [];
    if (!hits.length) {
      return {
        score: 0,
        title: "Certificados e cursos",
        detail: "Não achei certificado nem curso no texto. Mostrar isso aumentaria esta parte do rank. Hoje está 0/100."
      };
    }
    const at = text.search(/\b(certifica|certificado|curso|treinamento)/i);
    const snippet = clip(text.slice(Math.max(0, at - 30), at + 90), 120);
    const score = hits.length >= 2 ? 100 : 60;
    return {
      score,
      title: "Certificados e cursos",
      detail: `Encontrei no arquivo: “${snippet}”. Esta parte está ${score}/100.`
    };
  }

  function analyze(pageTexts, meta, context) {
    const texts = Array.isArray(pageTexts) ? pageTexts : [];
    const text = texts.join("\n").replace(/\s+/g, " ").trim();
    const pages = meta?.pages || texts.length || 0;
    const images = Number(meta?.images) || 0;
    const columns = Boolean(meta?.columns);
    const truncated = Boolean(meta?.truncated);
    const chars = text.replace(/\s/g, "").length;
    const sections = findSections(text);
    const sectionLabels = sections.map((section) => section.label);
    const email = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i.test(text);
    const phone = /\(\d{2}\)\s*\d{4,5}-?\d{4}/.test(text)
      || /\+55\s?\d{2}\s?9?\d{4}-?\d{4}/.test(text)
      || /\b\d{2}\s?9\d{4}-?\d{4}\b/.test(text);
    const years = countYears(text);
    const keyword = pickKeyword(text);
    const top = text.slice(0, 600);
    const experience = sliceOf(sections, "experiencia", text);
    const skills = sliceOf(sections, "skills", text);
    const fixes = [];
    const good = [];

    function fix(weight, title, detail) {
      fixes.push({ weight, title, detail });
    }
    function ok(title, detail) {
      good.push({ title, detail });
    }

    if (chars < 120) {
      fix(100, "Pouco texto selecionável", `O arquivo mostrou ${chars} caracteres de texto. Um leitor automático pode estar vendo imagem em vez de texto.`);
    } else {
      ok("Texto selecionável", `${chars} caracteres puderam ser lidos no arquivo.`);
    }

    if (email) ok("E-mail no texto", "Há um e-mail escrito no conteúdo, não só num ícone.");
    else fix(60, "E-mail não encontrado", "Não achei um e-mail no texto extraído.");

    if (phone) ok("Telefone no texto", "Há um telefone escrito no conteúdo.");
    else fix(40, "Telefone não encontrado", "Não achei um telefone no texto extraído.");

    if (sections.some((section) => section.id === "experiencia")) {
      ok("Seção de experiência", "O texto tem um título de experiência.");
    } else {
      fix(80, "Sem título de experiência", "Não achei um título como Experiência no texto.");
    }

    if (sections.some((section) => section.id === "formacao" || section.id === "skills")) {
      ok("Seção de formação ou habilidades", sectionLabels.filter((label) => label === "Formação" || label === "Habilidades").join(" e ") || "Encontrada.");
    } else {
      fix(35, "Sem formação e sem habilidades", "Não achei título de formação nem de habilidades.");
    }

    if (years >= 2) ok("Datas no texto", `${years} anos diferentes aparecem no arquivo.`);
    else fix(70, "Datas pouco claras", `Encontrei ${years} ano(s) no texto. O esperado aqui é ver pelo menos dois.`);

    if (images > 0 && chars < 250 * Math.max(pages, 1)) {
      fix(65, "Área que parece imagem", `O PDF tem ${images} imagem(ns) e pouco texto em volta. O que estiver só na imagem pode não ser lido.`);
    } else if (images > 0) {
      fix(20, "Há imagem além do texto", `Detectei ${images} imagem(ns). Confira se o conteúdo importante também está escrito.`);
    } else {
      ok("Sem imagem no lugar do texto", "Não detectei imagem pintada nas páginas lidas.");
    }

    if (columns) {
      fix(50, "Texto em colunas curtas", "Parte do texto está alinhada em colunas. Tabela e coluna costumam sair fora de ordem para um leitor automático.");
    }

    if (truncated) {
      fix(15, "PDF longo", "Li só as primeiras 15 páginas.");
    }

    if (keyword.weak) {
      const hint = keyword.hint
        ? `A repetição mais alta foi “${keyword.hint.label}”, ${keyword.hint.count} vez.`
        : "Nenhuma palavra passou do filtro de rótulos de currículo.";
      fix(25, "Palavra-chave sem segurança", `${hint} Não destaco uma palavra com menos de 2 aparições.`);
    } else {
      ok("Palavra em destaque", `“${keyword.label}” aparece ${keyword.count} vezes no texto lido.`);
      if (keywordIn(top, keyword)) ok("Palavra no topo", `“${keyword.label}” aparece nos primeiros caracteres do arquivo.`);
      else fix(30, "Palavra fora do topo", `“${keyword.label}” não aparece nos primeiros 600 caracteres.`);

      if (experience) {
        if (keywordIn(experience, keyword)) ok("Palavra na experiência", `“${keyword.label}” aparece no trecho de experiência.`);
        else fix(55, "Palavra fora da experiência", `“${keyword.label}” não aparece no trecho sob o título de experiência.`);
      }

      if (skills && keywordIn(skills, keyword)) {
        ok("Palavra nas habilidades", `“${keyword.label}” aparece no trecho de habilidades.`);
      }

      const words = text.split(/\s+/).filter(Boolean).length || 1;
      if (keyword.count >= 8 && keyword.count / words > 0.04) {
        fix(48, "Repetição alta da palavra", `“${keyword.label}” aparece ${keyword.count} vezes em ${words} palavras. Repetir demais não cria contexto.`);
      }
    }

    const experiences = reviewExperiences(experience, keyword);
    const intake = {
      company: cleanField(context && context.company, 120),
      recruiter: cleanField(context && context.recruiter, 120),
      jobDescription: cleanField(context && context.jobDescription, 2000)
    };
    const vacancy = vacancyOverlap(text, intake.jobDescription);
    const certificates = certificateRank(text);
    if (certificates.score === 0) fix(90, certificates.title, certificates.detail);
    else ok(certificates.title, certificates.detail);
    for (const gap of experiences.gaps) fix(75, gap.title, gap.detail);
    for (const item of experiences.items) ok(item.title, item.detail);

    fixes.sort((a, b) => b.weight - a.weight);
    const priority = fixes.slice(0, 3).map(({ title, detail }) => ({ title, detail }));
    let formScore = 100;
    for (const item of fixes) {
      if (item.weight === 90 || item.weight === 75) continue;
      formScore -= Math.max(4, Math.round(item.weight / 5));
    }
    formScore = Math.max(0, Math.min(100, formScore));
    const score = Math.round((formScore + experiences.score + certificates.score) / 3);
    const verb = repeatedVerb(text);
    const dateFormats = mixedDateFormats(text);
    const missingNumbers = experiences.gaps.filter((gap) => gap.detail.includes("não há um número")).length;
    const actions = [];
    if (certificates.score === 0) {
      actions.push({ title: "Mostrar certificados ou cursos", detail: certificates.detail });
    }
    if (missingNumbers) {
      actions.push({
        title: "Colocar um número na experiência",
        detail: `${missingNumbers} trecho(s) com data não mostram resultado em número. A leitura não inventa esse número.`
      });
    }
    if (verb) {
      actions.push({
        title: "Variar o verbo",
        detail: `“${verb.label}” aparece ${verb.count} vezes. O texto sugerido, no fim, mantém o que o arquivo disse e marca o que falta.`
      });
    }
    if (dateFormats) {
      actions.push({
        title: "Usar um formato de data",
        detail: `O arquivo mistura ${dateFormats.join(" e ")}.`
      });
    }
    let lift = null;
    if (certificates.score < 100) {
      const next = Math.round((formScore + experiences.score + 100) / 3);
      if (next > score) lift = { from: score, to: next, reason: "se o arquivo citasse certificado ou curso" };
    } else if (experiences.score < 100) {
      const next = Math.round((formScore + 100 + certificates.score) / 3);
      if (next > score) lift = { from: score, to: next, reason: "se cada experiência tivesse número e a palavra em destaque" };
    }

    const dotnetPitch = !keyword.weak && (
      keyword.family === "dotnet" ||
      (keyword.family === "azure" && keyword.dotnetMentions >= 1)
    );
    const blocks = resumeBlocks(text, sections, keyword);

    return {
      score,
      ranks: [
        { label: "Forma do arquivo", score: formScore },
        { label: "Experiências", score: experiences.score },
        { label: certificates.title, score: certificates.score }
      ],
      lift,
      actions: actions.slice(0, 4),
      experiences: experiences.gaps,
      blocks,
      suggested: buildSuggestion(blocks),
      intake,
      vacancy,
      keyword: keyword.weak
        ? { weak: true, hint: keyword.hint }
        : { weak: false, label: keyword.label, count: keyword.count, family: keyword.family },
      priority,
      good,
      fix: fixes.map(({ title, detail }) => ({ title, detail })),
      found: {
        email,
        phone,
        sections: sectionLabels,
        selectable: chars >= 120,
        chars,
        images,
        years,
        pages
      },
      dotnetPitch
    };
  }

  function looksLikeColumns(items) {
    const cells = (items || []).filter((item) => item && item.str && item.str.trim().length > 0 && item.str.trim().length <= 24 && item.transform);
    if (cells.length < 12) return false;
    const buckets = new Map();
    for (const cell of cells) {
      const x = Math.round(cell.transform[4] / 8) * 8;
      buckets.set(x, (buckets.get(x) || 0) + 1);
    }
    const columns = [...buckets.values()].filter((count) => count >= 4);
    return columns.length >= 3;
  }

  return { analyze, looksLikeColumns };
});
