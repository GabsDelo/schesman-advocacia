/* Conteúdo padrão do site e persistência local (localStorage). */
(function () {
  "use strict";

  var SITE_KEY = "schesman_site_v1";
  var APPOINTMENTS_KEY = "schesman_appointments_v1";

  var DEFAULT_DATA = {
    version: 1,
    brand: {
      name: "Schesman Advocacia",
      shortName: "Schesman",
      monogram: "S",
      tagline: "Advocacia & Consultoria Jurídica",
      oab: "OAB/SP 000.000",
      logoDataUrl: ""
    },
    theme: {
      primary: "#14263b",
      accent: "#b8935a",
      background: "#f7f5f1"
    },
    contact: {
      phone: "(11) 99999-9999",
      whatsapp: "5511999999999",
      email: "contato@schesman.adv.br",
      address: "São Paulo — SP",
      instagram: "https://www.instagram.com/schesmanadvocacia",
      hours: "Segunda a sexta, das 9h às 18h"
    },
    hero: {
      eyebrow: "Advocacia & Consultoria",
      title: "Defendemos seus direitos com estratégia, ética e dedicação.",
      highlight: "estratégia, ética e dedicação.",
      subtitle:
        "Atendimento jurídico personalizado para pessoas e empresas. Conte com uma equipe próxima, técnica e comprometida com a defesa dos seus interesses.",
      ctaPrimary: "Agendar consulta",
      ctaSecondary: "Conheça o escritório"
    },
    about: {
      eyebrow: "O escritório",
      title: "Tradição jurídica, visão contemporânea.",
      text1:
        "O Schesman Advocacia nasceu com o propósito de oferecer um atendimento jurídico próximo e transparente, unindo rigor técnico e sensibilidade para compreender cada história.",
      text2:
        "Atuamos de forma preventiva e contenciosa, sempre com comunicação clara sobre cada etapa do processo. Nosso compromisso é construir soluções seguras, com ética e dedicação.",
      quote: "Cada caso é único. Por isso, cada estratégia também deve ser.",
      points: [
        "Atendimento humanizado e personalizado",
        "Comunicação clara em todas as etapas",
        "Sigilo profissional e ética em primeiro lugar"
      ]
    },
    pillars: [
      { icon: "users", title: "Atendimento humanizado" },
      { icon: "shield", title: "Sigilo profissional" },
      { icon: "scale", title: "Estratégia personalizada" },
      { icon: "clock", title: "Resposta ágil" }
    ],
    areas: [
      {
        id: "civil",
        icon: "scale",
        title: "Direito Civil",
        description:
          "Contratos, responsabilidade civil, cobranças e soluções para conflitos entre particulares."
      },
      {
        id: "trabalhista",
        icon: "gavel",
        title: "Direito Trabalhista",
        description:
          "Orientação e defesa em relações de trabalho, tanto para empregados quanto para empregadores."
      },
      {
        id: "familia",
        icon: "users",
        title: "Direito de Família",
        description:
          "Divórcio, guarda, alimentos, inventário e demais questões familiares com acolhimento."
      },
      {
        id: "empresarial",
        icon: "building",
        title: "Direito Empresarial",
        description:
          "Assessoria jurídica para empresas, contratos, constituição societária e prevenção de riscos."
      },
      {
        id: "previdenciario",
        icon: "file-text",
        title: "Direito Previdenciário",
        description:
          "Aposentadorias, benefícios do INSS e planejamento previdenciário com análise individual."
      },
      {
        id: "consumidor",
        icon: "shield",
        title: "Direito do Consumidor",
        description:
          "Defesa dos seus direitos em compras, serviços, cobranças indevidas e relações de consumo."
      }
    ],
    faq: [
      {
        q: "Como funciona a primeira consulta?",
        a: "A primeira consulta é um momento para ouvir o seu caso, esclarecer dúvidas e apresentar os caminhos jurídicos possíveis. Você pode agendar pelo site, presencialmente ou online."
      },
      {
        q: "Preciso levar algum documento?",
        a: "Sim. Documentos pessoais e tudo o que estiver relacionado ao caso — contratos, mensagens, comprovantes e notificações — ajudam na análise inicial. Se tiver dúvidas, entre em contato antes da consulta."
      },
      {
        q: "O atendimento pode ser online?",
        a: "Sim. Oferecemos atendimento online com a mesma atenção e sigilo do atendimento presencial, além da possibilidade de envio digital de documentos."
      },
      {
        q: "Como são definidos os honorários?",
        a: "Os honorários são definidos após a análise do caso, considerando a complexidade e o trabalho envolvido. Todos os valores são apresentados de forma clara e transparente, em conformidade com a tabela da OAB."
      },
      {
        q: "O que acontece depois do agendamento?",
        a: "Você receberá uma confirmação com os dados do atendimento. O escritório entrará em contato para confirmar o horário e orientar sobre os próximos passos."
      }
    ],
    booking: {
      enabled: true,
      eyebrow: "Agendamento",
      title: "Escolha o melhor dia e horário para conversar.",
      subtitle:
        "Agende uma consulta presencial ou online. Preencha os dados ao lado e aguarde a confirmação da nossa equipe.",
      days: [1, 2, 3, 4, 5],
      start: "09:00",
      end: "18:00",
      interval: 60,
      lunchStart: "12:00",
      lunchEnd: "13:00",
      maxAdvanceDays: 60,
      successMessage:
        "Recebemos o seu pedido de agendamento. Nossa equipe entrará em contato para confirmar o horário."
    },
    admin: {
      password: "admin123"
    }
  };

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function isObject(value) {
    return value && typeof value === "object" && !Array.isArray(value);
  }

  function merge(base, extra) {
    Object.keys(extra || {}).forEach(function (key) {
      if (isObject(extra[key]) && isObject(base[key])) {
        merge(base[key], extra[key]);
      } else if (extra[key] !== undefined) {
        base[key] = extra[key];
      }
    });
    return base;
  }

  function normalizeData(data) {
    var merged = merge(clone(DEFAULT_DATA), data || {});
    if (!Array.isArray(merged.areas)) merged.areas = clone(DEFAULT_DATA.areas);
    if (!Array.isArray(merged.faq)) merged.faq = clone(DEFAULT_DATA.faq);
    if (!Array.isArray(merged.pillars)) merged.pillars = clone(DEFAULT_DATA.pillars);
    if (!Array.isArray(merged.booking.days) || !merged.booking.days.length) {
      merged.booking.days = clone(DEFAULT_DATA.booking.days);
    }
    return merged;
  }

  function loadSiteData() {
    try {
      var raw = localStorage.getItem(SITE_KEY);
      if (!raw) return clone(DEFAULT_DATA);
      return normalizeData(JSON.parse(raw));
    } catch (error) {
      return clone(DEFAULT_DATA);
    }
  }

  function saveSiteData(data) {
    localStorage.setItem(SITE_KEY, JSON.stringify(data));
  }

  function resetSiteData() {
    localStorage.removeItem(SITE_KEY);
  }

  function loadAppointments() {
    try {
      var raw = localStorage.getItem(APPOINTMENTS_KEY);
      var list = raw ? JSON.parse(raw) : [];
      return Array.isArray(list) ? list : [];
    } catch (error) {
      return [];
    }
  }

  function saveAppointments(list) {
    localStorage.setItem(APPOINTMENTS_KEY, JSON.stringify(list));
  }

  window.SiteStore = {
    SITE_KEY: SITE_KEY,
    APPOINTMENTS_KEY: APPOINTMENTS_KEY,
    defaults: clone(DEFAULT_DATA),
    clone: clone,
    normalizeData: normalizeData,
    loadSiteData: loadSiteData,
    saveSiteData: saveSiteData,
    resetSiteData: resetSiteData,
    loadAppointments: loadAppointments,
    saveAppointments: saveAppointments
  };
})();
