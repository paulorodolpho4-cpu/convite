/* Envio de fotos e vídeos dos convidados para a pasta do casal no Google Drive.
   O Apps Script abre uma sessão de envio (ação "iniciarEnvio") e o arquivo vai
   direto do celular para o Drive, com barra de progresso. */
(function () {
  const TIPOS = {
    jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', heic: 'image/heic', heif: 'image/heif', webp: 'image/webp', gif: 'image/gif',
    mp4: 'video/mp4', mov: 'video/quicktime', m4v: 'video/x-m4v', '3gp': 'video/3gpp', webm: 'video/webm', avi: 'video/x-msvideo'
  };
  const LIMITE = 2 * 1024 * 1024 * 1024; // 2 GB por arquivo

  function tipoDo(arquivo) {
    if (/^(image|video)\//.test(arquivo.type)) return arquivo.type;
    const ext = String(arquivo.name || '').split('.').pop().toLowerCase();
    return TIPOS[ext] || '';
  }

  function tamanhoLegivel(b) {
    if (b < 1024 * 1024) return Math.max(1, Math.round(b / 1024)) + ' KB';
    if (b < 1024 * 1024 * 1024) return (b / 1024 / 1024).toFixed(1).replace('.', ',') + ' MB';
    return (b / 1024 / 1024 / 1024).toFixed(2).replace('.', ',') + ' GB';
  }

  function enviarPara(sessao, arquivo, tipo, aoProgredir) {
    return new Promise((resolve, reject) => {
      const x = new XMLHttpRequest();
      x.open('PUT', sessao);
      x.setRequestHeader('Content-Type', tipo);
      x.upload.onprogress = (e) => { if (e.lengthComputable && aoProgredir) aoProgredir(e.loaded / e.total); };
      x.onload = () => (x.status === 200 || x.status === 201) ? resolve() : reject(new Error('O envio falhou (' + x.status + '). Tente de novo.'));
      x.onerror = () => { const e = new Error('A conexão caiu durante o envio. Tente de novo.'); e.bloqueado = x.upload && !enviouAlgo; reject(e); };
      let enviouAlgo = false;
      x.upload.addEventListener('progress', (e) => { if (e.loaded > 0) enviouAlgo = true; });
      x.send(arquivo);
    });
  }

  // Alternativa: manda o arquivo em pedaços pelo Apps Script (mais lento, mas sempre funciona)
  const PEDACO = 4 * 1024 * 1024; // múltiplo de 256 KB, exigido pelo Google Drive
  function base64(blob) {
    return new Promise((ok, erro) => { const r = new FileReader(); r.onload = () => ok(String(r.result).split(',')[1]); r.onerror = erro; r.readAsDataURL(blob); });
  }
  async function enviarEmPedacos(sessao, arquivo, aoProgredir) {
    for (let inicio = 0; inicio < arquivo.size; inicio += PEDACO) {
      const dados = await base64(arquivo.slice(inicio, Math.min(inicio + PEDACO, arquivo.size)));
      await window.Convite.api('enviarPedaco', { sessao, inicio, total: arquivo.size, dados });
      if (aoProgredir) aoProgredir(Math.min(1, (inicio + PEDACO) / arquivo.size));
    }
  }

  /** Envia um arquivo (File ou Blob com .name). autor = nome de quem envia. */
  async function enviarArquivo(arquivo, autor, aoProgredir) {
    const tipo = tipoDo(arquivo);
    if (!tipo) throw new Error('Envie apenas fotos ou vídeos.');
    if (arquivo.size > LIMITE) throw new Error('Arquivo muito grande (máximo 2 GB).');
    const r = await window.Convite.api('iniciarEnvio', {
      nome: arquivo.name || ('foto.' + (tipo.split('/')[1] || 'jpg')),
      tipo, tamanho: arquivo.size, autor: autor || ''
    });
    try {
      await enviarPara(r.sessao, arquivo, tipo, aoProgredir);
    } catch (e) {
      if (!e.bloqueado) throw e;
      await enviarEmPedacos(r.sessao, arquivo, aoProgredir);
    }
  }

  window.Album = { enviarArquivo, tipoDo, tamanhoLegivel };
})();
