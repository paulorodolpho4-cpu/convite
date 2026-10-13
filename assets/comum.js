/* Funções compartilhadas por todas as páginas do convite. */
(function () {
  const C = window.CONVITE;

  /* ---------- Preenche textos e links vindos do config.js ---------- */
  const valor = (caminho) => caminho.split('.').reduce((o, k) => (o ? o[k] : ''), C) || '';
  function preencher(raiz = document) {
    raiz.querySelectorAll('[data-c]').forEach((el) => { el.textContent = valor(el.dataset.c); });
    raiz.querySelectorAll('[data-href]').forEach((el) => { el.href = valor(el.dataset.href); });
  }

  /* ---------- Animação de entrada ao rolar ---------- */
  function animarAoRolar() {
    const els = document.querySelectorAll('.revelar:not(.visivel)');
    if (!('IntersectionObserver' in window)) { els.forEach((e) => e.classList.add('visivel')); return; }
    const obs = new IntersectionObserver((itens) => {
      itens.forEach((i) => { if (i.isIntersecting) { i.target.classList.add('visivel'); obs.unobserve(i.target); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -5% 0px' });
    els.forEach((e) => obs.observe(e));
  }

  /* ---------- Formatação ---------- */
  const soDigitos = (s) => String(s || '').replace(/\D/g, '');
  function mascaraCelular(input) {
    input.addEventListener('input', () => {
      const d = soDigitos(input.value).slice(0, 11);
      let f = d;
      if (d.length > 2) f = `(${d.slice(0, 2)}) ${d.slice(2)}`;
      if (d.length > 7) f = `(${d.slice(0, 2)}) ${d.slice(2, d.length - 4)}-${d.slice(-4)}`;
      input.value = f;
    });
  }
  const reais = (v) => Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const formatarCodigo = (c) => String(c || '').replace(/(.{4})(?=.)/g, '$1-');
  const primeiroNome = (n) => String(n || '').trim().split(/\s+/)[0];
  const normalizarNome = (n) => String(n || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
  const urlDoSite = (pagina) => new URL(pagina, C.apiUrl ? C.siteUrl : location.href).href;
  const linkConvite = (codigo) => urlDoSite('convite.html?id=' + encodeURIComponent(codigo));

  /* ---------- Código do convite (C1 a C5 = convite para 1 a 5 pessoas) ---------- */
  function normalizarCodigoConvite(c) {
    const s = String(c || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
    return /^C[1-5][A-Z0-9]{5}$/.test(s) ? s.slice(0, 2) + '-' + s.slice(2) : '';
  }
  const tipoDoCodigo = (c) => Number(String(c).charAt(1)) || 0;
  function codigoConvite() {
    const daUrl = normalizarCodigoConvite(new URLSearchParams(location.search).get('c'));
    try {
      if (daUrl) { localStorage.setItem('convite-codigo', daUrl); return daUrl; }
      return normalizarCodigoConvite(localStorage.getItem('convite-codigo'));
    } catch (e) { return daUrl; }
  }

  /* ---------- Contador regressivo ---------- */
  function iniciarContador(raiz) {
    const alvo = new Date(C.dataISO).getTime();
    const campos = ['dias', 'horas', 'minutos', 'segundos'].map((k) => raiz.querySelector(`[data-tempo="${k}"]`));
    function tique() {
      let s = Math.max(0, Math.floor((alvo - Date.now()) / 1000));
      const v = [Math.floor(s / 86400), Math.floor(s % 86400 / 3600), Math.floor(s % 3600 / 60), s % 60];
      campos.forEach((el, i) => { if (el) el.textContent = String(v[i]).padStart(2, '0'); });
      if (s === 0) { raiz.classList.add('chegou'); clearInterval(t); }
    }
    const t = setInterval(tique, 1000);
    tique();
  }

  /* ---------- QR Code (SVG na cor do convite) ---------- */
  function qrSvg(texto, cor = '#3B2416') {
    const qr = window.qrcode(0, 'M');
    qr.addData(texto);
    qr.make();
    const n = qr.getModuleCount(), m = 2;
    let d = '';
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (qr.isDark(r, c)) d += `M${c + m} ${r + m}h1v1h-1z`;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${n + 2 * m} ${n + 2 * m}" shape-rendering="crispEdges" role="img" aria-label="QR Code"><rect width="100%" height="100%" fill="#fff"/><path d="${d}" fill="${cor}"/></svg>`;
  }

  /* ---------- Pix "copia e cola" (padrão BR Code do Banco Central) ---------- */
  const emv = (id, v) => id + String(v.length).padStart(2, '0') + v;
  function crc16(s) {
    let crc = 0xffff;
    for (let i = 0; i < s.length; i++) {
      crc ^= s.charCodeAt(i) << 8;
      for (let j = 0; j < 8; j++) crc = (crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1) & 0xffff;
    }
    return crc.toString(16).toUpperCase().padStart(4, '0');
  }
  function pixCopiaECola({ chave, nome, cidade, valor, txid }) {
    const limpa = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Za-z0-9 ]/g, '').toUpperCase().trim();
    let p = emv('00', '01') + emv('26', emv('00', 'br.gov.bcb.pix') + emv('01', String(chave).trim())) + emv('52', '0000') + emv('53', '986');
    if (valor > 0) p += emv('54', Number(valor).toFixed(2));
    p += emv('58', 'BR') + emv('59', limpa(nome).slice(0, 25) || 'NOIVOS') + emv('60', limpa(cidade).slice(0, 15) || 'NATAL');
    p += emv('62', emv('05', String(txid || '').replace(/[^A-Za-z0-9]/g, '').slice(0, 25) || '***'));
    p += '6304';
    return p + crc16(p);
  }

  /* ---------- Ícones em traço fino (estilo do manual) ---------- */
  const ICONES = {
    viagem: '<path d="M43 8 5 22l13 5 4 13 6-10 10 6z"/><path d="m18 27 25-19M22 40l2-11"/>',
    barco: '<path d="M6 34h36l-5 7H11z"/><path d="M24 6v28M24 8l14 22H24M22 12 11 30h11"/>',
    mala: '<rect x="9" y="15" width="30" height="24" rx="3"/><path d="M18 15v-5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v5M17 15v24M31 15v24M14 39v3M34 39v3"/>',
    sol: '<circle cx="24" cy="19" r="7"/><path d="M24 5v4M24 29v3M10 19h4M34 19h4M14 9l3 3M31 26l3 3M14 29l3-3M31 12l3-3M5 40c4-3 8-3 12 0s8 3 12 0 8-3 14 0"/>',
    jantar: '<circle cx="24" cy="25" r="11"/><circle cx="24" cy="25" r="7"/><path d="M7 11v8a2 2 0 0 0 4 0v-8M9 11v28M41 39V11c-3 2-4 6-4 11h4"/>',
    cafe: '<path d="M10 20h22v10a9 9 0 0 1-9 9h-4a9 9 0 0 1-9-9z"/><path d="M32 23h3a4 4 0 0 1 0 8h-3M17 9c-2 2 2 4 0 6M24 9c-2 2 2 4 0 6M7 43h28"/>',
    panelas: '<path d="M8 21h32M10 21v13a6 6 0 0 0 6 6h16a6 6 0 0 0 6-6V21M3 24h7M38 24h7M17 21c0-4 3-6 7-6s7 2 7 6M24 15v-3"/>',
    airfryer: '<path d="M13 10h22l3 26a4 4 0 0 1-4 5H14a4 4 0 0 1-4-5z"/><path d="M14 24h20M30 31h4M21 15h6"/>',
    chef: '<path d="M15 38h18v-9a8 8 0 1 0-3-15 7 7 0 0 0-12 0 8 8 0 1 0-3 15z"/><path d="M15 33h18"/>',
    brinde: '<g transform="rotate(-14 17 24)"><path d="M13 9h8l-1 12a3 3 0 0 1-6 0z"/><path d="M17 24v14M13 38h8M13.5 15h7"/></g><g transform="rotate(14 31 24)"><path d="M27 9h8l-1 12a3 3 0 0 1-6 0z"/><path d="M31 24v14M27 38h8M27.5 15h7"/></g><path d="M24 5V2M20 6l-2-3M28 6l2-3"/>',
    cama: '<path d="M6 38V12M6 30h36v8M6 30v-5h36v5M42 25v-4a4 4 0 0 0-4-4H22v8M10 25v-3a3 3 0 0 1 3-3h4a3 3 0 0 1 3 3v3"/>',
    casa: '<path d="M5 22 24 7l19 15M10 18v22h28V18M20 40V29h8v11"/>',
    sofa: '<path d="M10 22v-6a4 4 0 0 1 4-4h20a4 4 0 0 1 4 4v6"/><path d="M6 24a3 3 0 0 1 6 0v4h24v-4a3 3 0 0 1 6 0v10H6zM9 34v4M39 34v4"/>',
    tv: '<rect x="5" y="9" width="38" height="25" rx="2"/><path d="M17 41h14M24 34v7"/>',
    geladeira: '<rect x="12" y="5" width="24" height="38" rx="3"/><path d="M12 19h24M17 10v5M17 24v7"/>',
    lavar: '<rect x="9" y="5" width="30" height="38" rx="3"/><path d="M9 13h30M14 9h4"/><circle cx="24" cy="28" r="9"/><path d="M17 29c3-2 5 2 8 0s4-1 6-1"/>',
    robo: '<circle cx="24" cy="26" r="15"/><circle cx="24" cy="26" r="5"/><path d="M14 17h20"/>',
    capacete: '<path d="M7 32a17 17 0 0 1 34 0z"/><path d="M4 32h40v4H4zM20 16v-5h8v5M24 16v16"/>',
    bike: '<circle cx="12" cy="31" r="7"/><circle cx="36" cy="31" r="7"/><path d="m12 31 7-13h12l5 13M19 18l5 13 7-13M17 14h5M29 13h4"/>',
    planta: '<path d="M15 30h18l-3 12H18zM24 30V17"/><path d="M24 23c-7 0-11-4-11-11 7 0 11 4 11 11zM24 19c0-7 4-11 11-11 0 7-4 11-11 11z"/>',
    spa: '<path d="M24 39c-9 0-15-5-15-12 6 0 12 3 15 8 3-5 9-8 15-8 0 7-6 12-15 12z"/><path d="M24 35c-5-4-6-11 0-19 6 8 5 15 0 19z"/>',
    foto: '<path d="M7 16h9l3-5h10l3 5h9v23H7z"/><circle cx="24" cy="27" r="7"/><circle cx="24" cy="27" r="3.5"/><path d="M11 20h3"/>',
    coracao: '<path d="M24 40S7 30 7 18.5a8.5 8.5 0 0 1 17-2 8.5 8.5 0 0 1 17 2C41 30 24 40 24 40z"/>',
    presente: '<path d="M7 19h34v7H7zM9 26v15h30V26M24 19v22"/><path d="M24 19c-3-6-12-8-12-3 0 3 12 3 12 3zM24 19c3-6 12-8 12-3 0 3-12 3-12 3z"/>',
    aliancas: '<circle cx="19" cy="29" r="10"/><circle cx="29" cy="29" r="10"/><path d="m26 11 3-4 3 4-3 4z"/>',
    relogio: '<circle cx="24" cy="26" r="15"/><path d="M24 17v9l6 4M20 6h8M24 6v5"/>',
    cabide: '<path d="M21 13a3 3 0 1 1 3 3c-1.5 0-2 1-2 2.5V21M24 21 5 34c-1 1 0 3 1 3h36c1 0 2-2 1-3L24 21z"/>',
    calendario: '<path d="M8 12h32v28H8zM8 20h32M16 8v7M32 8v7M18 30l4 4 8-8"/>',
    pin: '<path d="M24 42S12 30 12 20a12 12 0 0 1 24 0c0 10-12 22-12 22z"/><circle cx="24" cy="20" r="4.5"/><path d="M8 42h32"/>',
    toque: '<path d="M19 27V12a3 3 0 0 1 6 0v11"/><path d="M25 21a3 3 0 0 1 6 0v3M31 23a3 3 0 0 1 6 0v8c0 7-5 12-11 12h-2c-4 0-7-2-9-5l-6-9a3 3 0 0 1 5-3l2 3"/><path d="M13 9a10 10 0 0 1 18 0"/>',
    musica: '<path d="M18 36V10l20-4v26"/><circle cx="13" cy="36" r="5"/><circle cx="33" cy="32" r="5"/>',
    mudo: '<path d="M18 36V10l20-4v26"/><circle cx="13" cy="36" r="5"/><circle cx="33" cy="32" r="5"/><path d="M6 6l36 36"/>',
    whatsapp: '<path d="M24 6a18 18 0 0 0-15.6 27L6 42l9.3-2.4A18 18 0 1 0 24 6z"/><path d="M17 16.5c-.8 7.5 6.8 15.2 14.4 14.5l1.6-3.5-4.2-2-2 2c-2.8-1-5-3.2-6-6l2-2-2-4.2z"/>',
    batedeira: '<path d="M8 41h32M12 41V13a5 5 0 0 1 5-5h13a8 8 0 0 1 8 8v2H12"/><path d="M18 26h20a8 8 0 0 1-8 8h-4a8 8 0 0 1-8-8zM28 18v8"/>',
    liquidificador: '<path d="M15 7h18l-3 23H18z"/><path d="M14 30h20l2 11H12zM33 11h4v10h-5M21 36h6"/>',
    churrasco: '<path d="M8 20h32a16 16 0 0 1-32 0z"/><path d="M15 33l-4 9M33 33l4 9M24 36v6M18 6c-2 3 2 5 0 8M24 6c-2 3 2 5 0 8M30 6c-2 3 2 5 0 8"/>',
    gota: '<path d="M24 6s-12 14-12 22a12 12 0 0 0 24 0C36 20 24 6 24 6z"/><path d="M18 29a6 6 0 0 0 6 6"/>',
    ar: '<rect x="5" y="9" width="38" height="17" rx="3"/><path d="M10 21h28M14 32c0 3 3 3 3 6M24 32c0 3 3 3 3 6M34 32c0 3-3 3-3 6"/>',
    assistente: '<rect x="8" y="9" width="32" height="23" rx="4"/><path d="M15 39h18M24 32v7"/><circle cx="24" cy="20.5" r="5"/>',
    fechadura: '<rect x="14" y="5" width="20" height="38" rx="4"/><path d="M19 12h10v12H19z"/><circle cx="24" cy="33" r="3"/>',
    toalha: '<path d="M9 8h30v6H9zM12 14v26h24V14M12 31h24M12 35h24"/>',
    aspirador: '<path d="M31 5l-8 31M23 36h-9a4 4 0 0 0 0 8h12a4 4 0 0 0 0-8M27 5h8"/>',
    dividir: '<circle cx="17" cy="16" r="6"/><circle cx="33" cy="16" r="6"/><path d="M5 40c0-7 5-12 12-12s12 5 12 12M23 31c2-2 6-3 10-3 7 0 12 5 12 12"/>'
  };
  function icone(nome, classe = 'icone') {
    return `<svg class="${classe}" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONES[nome] || ICONES.presente}</svg>`;
  }

  /* ---------- Lista de presentes usada no modo demonstração ---------- */
  const P = (codigo, categoria, nome, descricao, valor, imagem, quantidade = 1) => ({ codigo, categoria, nome, descricao, valor, imagem: 'icone:' + imagem, linkCartao: '', linkCartaoMetade: '', quantidade });
  const PRESENTES_EXEMPLO = [
    P('P01', 'Cozinha', 'Air fryer forno 12 litros', 'A queridinha das cozinhas: assa, gratina e frita sem óleo.', 650, 'airfryer'),
    P('P02', 'Cozinha', 'Cafeteira Nespresso Vertuo', 'Com kit de cápsulas para o café da manhã a dois.', 900, 'cafe'),
    P('P03', 'Cozinha', 'Batedeira planetária', 'Estilo KitchenAid, para bolos e receitas de domingo.', 2800, 'batedeira'),
    P('P04', 'Cozinha', 'Jogo de panelas cerâmicas', 'Antiaderentes, coloridas e livres de PFOA.', 900, 'panelas'),
    P('P05', 'Cozinha', 'Panela de pressão elétrica', 'Multifuncional: arroz, feijão e carnes com um toque.', 550, 'panelas'),
    P('P06', 'Cozinha', 'Liquidificador de alta potência', 'Para sucos, vitaminas e smoothies.', 450, 'liquidificador'),
    P('P07', 'Cozinha', 'Aparelho de jantar 30 peças', 'Para receber a família e os amigos.', 650, 'jantar'),
    P('P08', 'Cozinha', 'Faqueiro inox 72 peças', 'Completo, para todas as ocasiões.', 500, 'jantar'),
    P('P09', 'Cozinha', 'Jogo de taças de cristal', 'Para brindarmos cada conquista.', 380, 'brinde'),
    P('P10', 'Cozinha', 'Kit churrasco premium', 'Facas, tábua e acessórios para os encontros em casa.', 400, 'churrasco'),
    P('P11', 'Eletros', 'Geladeira frost free inverse', 'Freezer embaixo e muito espaço para a casa nova.', 4500, 'geladeira'),
    P('P12', 'Eletros', 'Lava e seca', 'Roupa limpa e seca sem varal.', 3800, 'lavar'),
    P('P13', 'Eletros', 'Lava-louças', 'Porque a louça não vai se lavar sozinha… ou vai!', 2900, 'lavar'),
    P('P14', 'Eletros', 'Robô aspirador e passa pano', 'Tempo juntos vale mais que faxina.', 1900, 'robo'),
    P('P15', 'Eletros', 'Ar-condicionado split inverter', 'Noites fresquinhas no calor de Natal.', 2600, 'ar'),
    P('P16', 'Eletros', 'Purificador de água', 'Água gelada e filtrada direto na cozinha.', 900, 'gota'),
    P('P17', 'Eletros', 'Aspirador vertical sem fio', 'Leve, prático e sempre à mão.', 800, 'aspirador'),
    P('P18', 'Casa', 'Smart TV 55" 4K', 'Para as noites de filme e série.', 3200, 'tv'),
    P('P19', 'Casa', 'Sofá retrátil', 'O cantinho mais aconchegante do primeiro lar.', 3500, 'sofa'),
    P('P20', 'Casa', 'Assistente de voz com tela', 'Música, receitas e lembretes com um comando.', 700, 'assistente'),
    P('P21', 'Casa', 'Fechadura digital', 'Entrar em casa com senha ou digital.', 900, 'fechadura'),
    P('P22', 'Casa', 'Plantas e vasos para a varanda', 'Um toque de verde na casa nova.', 300, 'planta', 2),
    P('P23', 'Cama & banho', 'Colchão e base box casal', 'Noites de sono perfeitas.', 3000, 'cama'),
    P('P24', 'Cama & banho', 'Jogo de cama 400 fios', 'Lençóis macios, tamanho queen.', 450, 'cama'),
    P('P25', 'Cama & banho', 'Kit de toalhas felpudas', 'Banho e rosto, para o casal e as visitas.', 350, 'toalha'),
    P('P26', 'Cama & banho', 'Edredom e manta', 'Aconchego para os dias de chuva.', 380, 'cama'),
    P('P27', 'Contribuição', 'Contribuição livre', 'Escolha o valor que desejar.', 0, 'coracao', 0)
  ];
  const LIMITE_DIVIDIR_DEMO = 1500;

  /* ---------- Convites de exemplo (modo demonstração) ---------- */
  const CONVITES_EXEMPLO = [
    { codigo: 'C1-T7KQM', tipo: 1, nome: 'Ana Beatriz Souza' },
    { codigo: 'C2-H4XPR', tipo: 2, nome: 'Carlos e Fernanda' },
    { codigo: 'C3-M9ZTW', tipo: 3, nome: 'Família Lima' },
    { codigo: 'C4-Q2RVD', tipo: 4, nome: 'Família Oliveira' },
    { codigo: 'C5-W8NJB', tipo: 5, nome: 'Família Santos' }
  ];

  /* ---------- Modo demonstração (sem planilha conectada) ---------- */
  const CHAVE_DEMO = 'convite-demo-v2';
  const lerDemo = () => { try { return JSON.parse(localStorage.getItem(CHAVE_DEMO)) || { pessoas: [], presentes: [] }; } catch (e) { return { pessoas: [], presentes: [] }; } };
  const salvarDemo = (d) => { try { localStorage.setItem(CHAVE_DEMO, JSON.stringify(d)); } catch (e) { /* sem armazenamento */ } };
  function novoCodigo(n = 8) {
    const a = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
    const r = crypto.getRandomValues(new Uint32Array(n));
    return 'ABCDFGHJKMNPQRSTUVWXYZ'.charAt(r[0] % 22) + Array.from(r.slice(1), (x) => a[x % a.length]).join('');
  }
  const SENHA_DEMO = '1234';
  function conviteDemo(codigo) {
    const cod = normalizarCodigoConvite(codigo);
    if (!cod) return null;
    return CONVITES_EXEMPLO.find((c) => c.codigo === cod) || { codigo: cod, tipo: tipoDoCodigo(cod), nome: 'Convidado(s)' };
  }
  const demo = {
    convite(d) {
      const c = conviteDemo(d.codigo);
      if (!c) return { ok: false, erro: 'Código de convite inválido.' };
      const pessoas = lerDemo().pessoas.filter((p) => p.convite === c.codigo).map(({ nome, codigo, resposta }) => ({ nome, codigo, resposta }));
      return { ok: true, codigo: c.codigo, tipo: c.tipo, nome: c.nome, pessoas };
    },
    confirmar(d) {
      const c = conviteDemo(d.codigo);
      if (!c) return { ok: false, erro: 'Código de convite inválido.' };
      const nomes = (d.nomes || []).map((n) => String(n).trim().replace(/\s+/g, ' ')).filter(Boolean);
      if (!nomes.length) return { ok: false, erro: 'Informe ao menos um nome.' };
      if (nomes.length > c.tipo) return { ok: false, erro: `Este convite é válido para ${c.tipo} pessoa(s).` };
      if (nomes.some((n) => n.split(' ').length < 2)) return { ok: false, erro: 'Informe nome e sobrenome de cada pessoa.' };
      const db = lerDemo();
      const doConvite = db.pessoas.filter((p) => p.convite === c.codigo);
      const vai = d.resposta === 'Confirmado';
      doConvite.forEach((p) => { p.resposta = 'Não comparecerá'; });
      nomes.forEach((nome) => {
        let p = doConvite.find((x) => normalizarNome(x.nome) === normalizarNome(nome));
        if (!p) { p = { convite: c.codigo, codigo: novoCodigo() }; db.pessoas.push(p); doConvite.push(p); }
        Object.assign(p, { nome, celular: d.celular, resposta: vai ? 'Confirmado' : 'Não comparecerá' });
      });
      salvarDemo(db);
      return demo.convite({ codigo: c.codigo });
    },
    convidado(d) {
      const p = lerDemo().pessoas.find((x) => x.codigo === String(d.codigo).toUpperCase());
      if (!p) return { ok: false, erro: 'Convite não encontrado.' };
      return { ok: true, nome: p.nome, resposta: p.resposta, convite: (conviteDemo(p.convite) || {}).nome };
    },
    presentes() {
      const db = lerDemo();
      return {
        ok: true,
        valorMinimo: C.valorMinimo,
        limiteDividir: LIMITE_DIVIDIR_DEMO,
        pix: { chave: '00000000000', nome: `${C.noivos.ela} e ${C.noivos.ele}`, cidade: 'Natal' },
        presentes: PRESENTES_EXEMPLO.map((p) => ({ ...p, recebidos: db.presentes.filter((x) => x.codigo === p.codigo).reduce((s, x) => s + (x.fracao || 1), 0) }))
      };
    },
    presente(d) {
      const db = lerDemo();
      const p = demo.presentes().presentes.find((x) => x.codigo === d.codigo);
      if (!p) return { ok: false, erro: 'Este presente não está mais disponível.' };
      const restante = p.quantidade > 0 ? p.quantidade - p.recebidos : Infinity;
      if (restante <= 0) return { ok: false, erro: 'Este presente já foi escolhido por outro convidado.' };
      const dividir = p.valor > LIMITE_DIVIDIR_DEMO && (d.dividir || restante < 1);
      if (!(p.valor > 0) && !(Number(d.valor) >= C.valorMinimo)) return { ok: false, erro: `O valor mínimo é ${reais(C.valorMinimo)}.` };
      const valor = p.valor > 0 ? (dividir ? Math.round(p.valor * 50) / 100 : p.valor) : Number(d.valor);
      const protocolo = 'PR' + novoCodigo(6);
      db.presentes.push({ ...d, valor, fracao: dividir ? 0.5 : 1, protocolo, data: new Date().toISOString() });
      salvarDemo(db);
      return { ok: true, protocolo, valor, dividido: dividir };
    },
    checkin(d) {
      if (d.senha !== SENHA_DEMO) return { ok: false, erro: 'Senha incorreta.' };
      const db = lerDemo();
      const p = db.pessoas.find((x) => x.codigo === String(d.codigo).toUpperCase());
      if (!p) return { ok: true, status: 'invalido' };
      const convite = (conviteDemo(p.convite) || {}).nome;
      if (p.resposta !== 'Confirmado') return { ok: true, status: 'nao_confirmado', nome: p.nome, convite };
      if (p.checkin) return { ok: true, status: 'repetido', nome: p.nome, convite, horario: p.checkin };
      p.checkin = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      salvarDemo(db);
      return { ok: true, status: 'ok', nome: p.nome, convite, horario: p.checkin };
    },
    mensagens() {
      return { ok: true, mensagens: (lerDemo().mensagens || []).slice().reverse() };
    },
    mensagem(d) {
      const db = lerDemo();
      db.mensagens = db.mensagens || [];
      db.mensagens.push({ nome: String(d.nome).slice(0, 60), mensagem: String(d.mensagem).slice(0, 280), data: new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) });
      salvarDemo(db);
      return { ok: true };
    },
    estatisticas(d) {
      if (d.senha !== SENHA_DEMO) return { ok: false, erro: 'Senha incorreta.' };
      const g = lerDemo().pessoas;
      return { ok: true, confirmados: g.filter((x) => x.resposta === 'Confirmado').length, chegaram: g.filter((x) => x.checkin).length };
    }
  };

  /* ---------- Comunicação com a planilha (Google Apps Script) ---------- */
  const LEITURAS = ['convite', 'convidado', 'presentes', 'mensagens'];
  async function api(acao, dados = {}) {
    if (!C.apiUrl) {
      await new Promise((r) => setTimeout(r, 400));
      const res = demo[acao](dados);
      if (!res.ok) throw new Error(res.erro);
      return res;
    }
    let resp;
    if (LEITURAS.includes(acao)) {
      resp = await fetch(C.apiUrl + '?' + new URLSearchParams({ action: acao, ...dados }));
    } else {
      // text/plain evita a verificação prévia de CORS do navegador
      resp = await fetch(C.apiUrl, { method: 'POST', body: JSON.stringify({ action: acao, ...dados }) });
    }
    const j = await resp.json();
    if (!j.ok) throw new Error(j.erro || 'Não foi possível concluir. Tente novamente.');
    return j;
  }

  /* ---------- Mensagem de WhatsApp com os QR Codes do convite ---------- */
  function mensagemWhatsApp(pessoas) {
    const linhas = pessoas.map((p) => `• ${p.nome} (${formatarCodigo(p.codigo)}):\n${linkConvite(p.codigo)}`).join('\n\n');
    return `Nossos convites para o casamento de ${C.noivos.ela} & ${C.noivos.ele} 💍\n` +
      `${C.diaSemana}, ${C.dia} de ${C.mesExtenso} de ${C.ano}, às ${C.hora}\n${C.local} · ${C.endereco}\n\n` +
      `QR Codes de entrada (um por pessoa):\n${linhas}`;
  }

  /* ---------- Painéis (dialog) ---------- */
  function ligarPaineis() {
    document.querySelectorAll('[data-abrir]').forEach((b) => b.addEventListener('click', (e) => {
      e.preventDefault();
      const d = document.getElementById(b.dataset.abrir);
      if (d && !d.open) d.showModal();
    }));
    document.querySelectorAll('dialog').forEach((d) => {
      d.querySelectorAll('[data-fechar]').forEach((b) => b.addEventListener('click', () => d.close()));
      d.addEventListener('click', (e) => { if (e.target === d) d.close(); });
    });
  }

  function copiar(texto, botao) {
    const ok = () => { const t = botao.textContent; botao.textContent = 'Copiado!'; setTimeout(() => { botao.textContent = t; }, 1800); };
    if (navigator.clipboard) navigator.clipboard.writeText(texto).then(ok, () => {});
    else { const ta = document.createElement('textarea'); ta.value = texto; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove(); ok(); }
  }

  window.Convite = {
    preencher, animarAoRolar, mascaraCelular, soDigitos, reais, formatarCodigo, primeiroNome,
    linkConvite, urlDoSite, qrSvg, pixCopiaECola, crc16, icone, api, ligarPaineis, copiar,
    codigoConvite, normalizarCodigoConvite, tipoDoCodigo, iniciarContador, mensagemWhatsApp,
    modoDemo: !C.apiUrl, SENHA_DEMO, CONVITES_EXEMPLO
  };

  document.addEventListener('DOMContentLoaded', () => {
    preencher();
    animarAoRolar();
    ligarPaineis();
    document.querySelectorAll('[data-icone]').forEach((el) => { el.innerHTML = icone(el.dataset.icone); });
    if (!C.apiUrl) {
      const aviso = document.createElement('div');
      aviso.className = 'faixa-demo';
      aviso.textContent = 'Modo demonstração: as respostas ficam salvas só neste navegador.';
      document.body.appendChild(aviso);
    }
  });
})();
