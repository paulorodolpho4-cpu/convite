/* =====================================================================
   CONFIGURAÇÃO DO CONVITE — edite apenas este arquivo para atualizar
   textos, data, horário, local e endereços. O site e o PDF leem daqui.
   ===================================================================== */
window.CONVITE = {
  noivos: { ela: "Mylli", ele: "Rodolpho" },

  // Data e horário (dataISO alimenta o contador regressivo; -03:00 = horário de Natal)
  dataISO: "2026-12-17T15:30:00-03:00",
  diaSemana: "Quinta-feira",
  dia: "17",
  mes: "Dez",
  mesExtenso: "dezembro",
  ano: "2026",
  hora: "15h30",
  dataCurta: "17·12·26",

  // Local
  local: "Por Amor Recepções",
  endereco: "Redinha · Natal/RN",
  mapsUrl: "https://www.google.com/maps/place/Por+Amor+Recep%C3%A7%C3%B5es/@-5.7307909,-35.2041378,17z/data=!3m1!4b1!4m6!3m5!1s0x7b307c6acb607ef:0x27b6fea8270504c7!8m2!3d-5.7307909!4d-35.2041378!16s%2Fg%2F11ld3cxj0k",

  // Texto do convite
  textoConvite: "Com a bênção de Deus e de nossas famílias, temos a imensa alegria de convidar você para celebrar conosco o dia em que diremos “sim” para toda a vida.",
  frase: "A verdadeira felicidade só é completa quando é compartilhada — por isso queremos você ao nosso lado neste dia.",

  // Nossa história
  historia: [
    { data: "2017", titulo: "O começo", texto: "Nos conhecemos nos corredores da faculdade de engenharia. Entre cálculos, projetos e madrugadas de estudo, nasceu uma amizade." },
    { data: "13·09·2019", titulo: "O primeiro sim", texto: "A amizade virou amor e começamos a namorar. Desde então, somos parceiros em cada projeto da vida." },
    { data: "17·12·2026", titulo: "Para sempre", texto: "Engenheiros e cúmplices de vida, agora vamos construir juntos a obra mais importante: a nossa família." }
  ],

  // Versículos e mensagem
  versiculo1: "O amor é paciente, o amor é bondoso. Tudo sofre, tudo crê, tudo espera, tudo suporta. O amor nunca perece.",
  versiculo1Ref: "1 Coríntios 13:4,7-8",
  versiculo2: "Por essa razão, o homem deixará pai e mãe e se unirá à sua mulher, e os dois se tornarão uma só carne.",
  versiculo2Ref: "Efésios 5:31",
  deusAma: "Foi Ele quem criou a união entre o homem e a mulher e a abençoou desde o princípio. Por isso, mais do que uma festa, este dia é um culto de gratidão a Ele por tudo o que construímos até aqui.",

  // Avisos
  confirmarAte: "17 de novembro de 2026",
  traje: "Esporte fino",

  // Música de fundo (ID do vídeo no YouTube: youtube.com/watch?v=ESTE_ID)
  musicaYoutube: "o-jWu3sdCok",
  musicaTitulo: "Diga Sim pra Mim · Dueto Enamorados",

  // Valor mínimo de um presente na lista (R$)
  valorMinimo: 250,

  // Endereço público do site (GitHub Pages), com barra no final.
  siteUrl: "https://paulorodolpho4-cpu.github.io/convite/",

  // URL do Apps Script publicado (termina em /exec).
  // Enquanto estiver vazio, o site funciona em MODO DEMONSTRAÇÃO.
  apiUrl: "https://script.google.com/macros/s/AKfycbxvtBlrj0PlesuimqABBWd2IlsBDEOLlTKR9nQxemt-vAcXI3EYwgDp6j9q4Qx0RaahSg/exec"
};
