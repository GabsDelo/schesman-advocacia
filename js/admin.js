/* Painel administrativo — edição do site e gestão de agendamentos. */
(function () {
  "use strict";

  var AUTH_KEY = "schesman_admin_session";

  var state = {
    data: SiteStore.loadSiteData(),
    appointments: SiteStore.loadAppointments(),
    tab: "visao",
    dirty: false,
    lastAppointmentId: null
  };

  var toastTimer = null;

  var TAB_META = {
    visao: {
      title: "Visão geral",
      subtitle: "Resumo dos agendamentos e atalhos do painel."
    },
    agendamentos: {
      title: "Agendamentos",
      subtitle: "Gerencie os pedidos de horário recebidos pelo site."
    },
    identidade: {
      title: "Identidade",
      subtitle: "Marca, logo e cores do site."
    },
    contato: {
      title: "Contato & redes",
      subtitle: "Telefone, e-mail, endereço e Instagram."
    },
    inicio: {
      title: "Página inicial",
      subtitle: "Textos do topo, sobre o escritório e compromissos."
    },
    areas: {
      title: "Áreas de atuação",
      subtitle: "Cartões exibidos no site e opções do agendamento."
    },
    faq: {
      title: "Perguntas frequentes",
      subtitle: "Dúvidas exibidas na seção de perguntas."
    },
    horarios: {
      title: "Horários",
      subtitle: "Dias, faixas de atendimento e textos do agendamento."
    },
    config: {
      title: "Configurações",
      subtitle: "Senha, backup e manutenção dos dados."
    }
  };

  function $(selector, root) {
    return (root || document).querySelector(selector);
  }

  function $all(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  function esc(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (char) {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      }[char];
    });
  }

  function injectIcons(root) {
    $all("[data-icon]", root || document).forEach(function (element) {
      var name = element.getAttribute("data-icon");
      if (name) element.innerHTML = iconSvg(name);
    });
  }

  function showToast(message, type) {
    var toast = $("#adminToast");
    if (!toast) return;
    toast.textContent = message;
    toast.classList.toggle("is-error", type === "error");
    toast.classList.add("is-visible");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () {
      toast.classList.remove("is-visible");
    }, 4200);
  }

  function isHex(value) {
    return /^#[0-9a-fA-F]{6}$/.test(String(value || ""));
  }

  function getPath(object, path) {
    return path.split(".").reduce(function (accumulator, key) {
      return accumulator == null ? undefined : accumulator[key];
    }, object);
  }

  function setPath(object, path, value) {
    var keys = path.split(".");
    var target = object;
    for (var index = 0; index < keys.length - 1; index += 1) {
      var key = keys[index];
      if (target[key] == null || typeof target[key] !== "object") {
        target[key] = /^\d+$/.test(keys[index + 1]) ? [] : {};
      }
      target = target[key];
    }
    target[keys[keys.length - 1]] = value;
  }

  function onlyDigits(value) {
    return String(value == null ? "" : value).replace(/\D/g, "");
  }

  function downloadBlob(blob, filename) {
    var url = URL.createObjectURL(blob);
    var link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.setTimeout(function () {
      URL.revokeObjectURL(url);
    }, 1000);
  }

  function isAuthed() {
    try {
      return sessionStorage.getItem(AUTH_KEY) === "1";
    } catch (error) {
      return false;
    }
  }

  function setAuthed(value) {
    try {
      if (value) sessionStorage.setItem(AUTH_KEY, "1");
      else sessionStorage.removeItem(AUTH_KEY);
    } catch (error) {
      /* sessionStorage indisponível: a sessão vale apenas enquanto a página estiver aberta. */
    }
  }

  /* ------------------------------------------------------------------------
     Estado e interface geral
     ------------------------------------------------------------------------ */

  function setDirty(value) {
    state.dirty = Boolean(value);
    var saveBtn = $("#saveBtn");
    var discardBtn = $("#discardBtn");
    var dirtyDot = $("#dirtyDot");
    if (saveBtn) saveBtn.disabled = !state.dirty;
    if (discardBtn) discardBtn.disabled = !state.dirty;
    if (dirtyDot) dirtyDot.hidden = !state.dirty;
  }

  function updateBrandChrome() {
    var brand = state.data.brand;
    var shortName = brand.shortName || brand.name;

    var loginMonogram = $("#loginMonogram");
    if (loginMonogram) loginMonogram.textContent = brand.monogram || "S";

    var loginName = $("#loginBrandName");
    if (loginName) loginName.textContent = brand.name;

    var loginTagline = $("#loginBrandTagline");
    if (loginTagline) loginTagline.textContent = brand.tagline;

    var loginOab = $("#loginOab");
    if (loginOab) loginOab.textContent = brand.oab;

    var sidebarName = $("#sidebarBrandName");
    if (sidebarName) sidebarName.textContent = shortName;

    var sidebarMonogram = $("#sidebarMonogram");
    if (sidebarMonogram) {
      if (brand.logoDataUrl) {
        sidebarMonogram.innerHTML = '<img src="' + esc(brand.logoDataUrl) + '" alt="" />';
      } else {
        sidebarMonogram.textContent = brand.monogram || "S";
      }
    }

    var previewName = $("#themePreviewName");
    if (previewName) previewName.textContent = brand.name;

    var previewTagline = $("#themePreviewTagline");
    if (previewTagline) previewTagline.textContent = brand.tagline;

    document.title = "Painel do escritório — " + brand.name;
    renderLoginHint();
    updateLogoPreview();
  }

  function renderLoginHint() {
    var hint = $("#loginHint");
    if (!hint) return;
    hint.hidden = state.data.admin.password !== "admin123";
  }

  function updateLogoPreview() {
    var preview = $("#logoPreview");
    if (!preview) return;
    if (state.data.brand.logoDataUrl) {
      preview.innerHTML = '<img src="' + esc(state.data.brand.logoDataUrl) + '" alt="Logo atual" />';
    } else {
      preview.textContent = state.data.brand.monogram || "S";
    }
  }

  function updateThemePreview() {
    var preview = $("#themePreview");
    if (!preview) return;
    var theme = state.data.theme;
    var primary = isHex(theme.primary) ? theme.primary : "#14263b";
    var accent = isHex(theme.accent) ? theme.accent : "#b8935a";
    var background = isHex(theme.background) ? theme.background : "#f7f5f1";

    preview.style.setProperty("--pv-primary", primary);
    preview.style.setProperty("--pv-accent", accent);
    preview.style.setProperty("--pv-bg", background);

    var name = $("#themePreviewName");
    if (name) name.textContent = state.data.brand.name;

    var tagline = $("#themePreviewTagline");
    if (tagline) tagline.textContent = state.data.brand.tagline;
  }

  function fillForms() {
    $all("[data-bind]").forEach(function (element) {
      var path = element.getAttribute("data-bind");
      var value = getPath(state.data, path);

      if (element.type === "checkbox") {
        element.checked = Boolean(value);
      } else if (element.type === "color") {
        if (isHex(value)) element.value = value;
      } else {
        element.value = value == null ? "" : value;
      }
    });

    $all("[data-day]").forEach(function (checkbox) {
      var day = Number(checkbox.getAttribute("data-day"));
      checkbox.checked = (state.data.booking.days || []).indexOf(day) !== -1;
    });
  }

  function syncColorInputs(path, value, source) {
    $all('[data-bind="' + path + '"]').forEach(function (element) {
      if (element === source) return;
      if (element.type === "color" && !isHex(value)) return;
      element.value = value;
    });
  }

  function updateEditorIcon(select, value) {
    var item = select.closest(".editor-item");
    if (!item) return;
    var preview = item.querySelector("[data-icon-preview]");
    if (preview) preview.innerHTML = iconSvg(value);
  }

  function handleBoundInput(event) {
    var element = event.target.closest("[data-bind]");
    if (!element) return;

    var path = element.getAttribute("data-bind");
    var value;

    if (element.type === "checkbox") value = element.checked;
    else if (element.type === "number") value = element.value === "" ? 0 : Number(element.value);
    else value = element.value;

    setPath(state.data, path, value);
    setDirty(true);

    if (path.indexOf("theme.") === 0) {
      syncColorInputs(path, value, element);
      updateThemePreview();
    }

    if (path.indexOf("brand.") === 0) {
      updateBrandChrome();
    }

    if (path.indexOf("booking.") === 0) {
      updateBookingSummary();
    }

    if (
      (path.indexOf("areas.") === 0 ||
        path.indexOf("pillars.") === 0 ||
        path.indexOf("faq.") === 0) &&
      (path.indexOf(".icon") !== -1 ||
        path.indexOf(".title") !== -1 ||
        path.indexOf(".q") !== -1)
    ) {
      if (path.indexOf(".icon") !== -1) updateEditorIcon(element, value);

      var item = element.closest(".editor-item");
      var title = item && item.querySelector(".editor-item__title");
      if (title) {
        if (path.indexOf(".q") !== -1) title.textContent = value || "Nova pergunta";
        else title.textContent = value || "Sem título";
      }
    }
  }

  /* ------------------------------------------------------------------------
     Editores dinâmicos
     ------------------------------------------------------------------------ */

  function iconOptions(selected) {
    return ICON_NAMES.map(function (name) {
      return (
        '<option value="' +
        name +
        '"' +
        (name === selected ? " selected" : "") +
        ">" +
        esc(ICON_LABELS[name]) +
        "</option>"
      );
    }).join("");
  }

  function renderAreasEditor() {
    var container = $("#areasEditor");
    if (!container) return;

    if (!state.data.areas.length) {
      container.innerHTML =
        '<div class="empty-editor">Nenhuma área cadastrada. Clique em “Nova área” para começar.</div>';
      return;
    }

    container.innerHTML = state.data.areas
      .map(function (area, index) {
        return (
          '<article class="editor-item">' +
          '<div class="editor-item__head">' +
          '<span class="editor-item__icon" data-icon-preview>' +
          iconSvg(area.icon || "scale") +
          "</span>" +
          '<span class="editor-item__title">' +
          esc(area.title || "Nova área") +
          "</span>" +
          '<button type="button" class="editor-item__remove" data-action="remove-area" data-index="' +
          index +
          '" aria-label="Remover área">' +
          iconSvg("trash") +
          "</button>" +
          "</div>" +
          '<div class="editor-item__body"><div class="editor-grid">' +
          '<div class="field"><label>Ícone</label><select data-bind="areas.' +
          index +
          '.icon">' +
          iconOptions(area.icon || "scale") +
          "</select></div>" +
          '<div class="field"><label>Título</label><input type="text" data-bind="areas.' +
          index +
          '.title" value="' +
          esc(area.title) +
          '" /></div>' +
          '<div class="field field--full"><label>Descrição</label><textarea rows="2" data-bind="areas.' +
          index +
          '.description">' +
          esc(area.description) +
          "</textarea></div>" +
          "</div></div></article>"
        );
      })
      .join("");
  }

  function renderPillarsEditor() {
    var container = $("#pillarsEditor");
    if (!container) return;

    if (!state.data.pillars.length) {
      container.innerHTML =
        '<div class="empty-editor">Nenhum destaque cadastrado. Clique em “Adicionar” para criar.</div>';
      return;
    }

    container.innerHTML = state.data.pillars
      .map(function (pillar, index) {
        return (
          '<article class="editor-item">' +
          '<div class="editor-item__head">' +
          '<span class="editor-item__icon" data-icon-preview>' +
          iconSvg(pillar.icon || "check") +
          "</span>" +
          '<span class="editor-item__title">' +
          esc(pillar.title || "Novo destaque") +
          "</span>" +
          '<button type="button" class="editor-item__remove" data-action="remove-pillar" data-index="' +
          index +
          '" aria-label="Remover destaque">' +
          iconSvg("trash") +
          "</button>" +
          "</div>" +
          '<div class="editor-item__body"><div class="editor-grid">' +
          '<div class="field"><label>Ícone</label><select data-bind="pillars.' +
          index +
          '.icon">' +
          iconOptions(pillar.icon || "check") +
          "</select></div>" +
          '<div class="field"><label>Título</label><input type="text" data-bind="pillars.' +
          index +
          '.title" value="' +
          esc(pillar.title) +
          '" /></div>' +
          "</div></div></article>"
        );
      })
      .join("");
  }

  function renderFaqEditor() {
    var container = $("#faqEditor");
    if (!container) return;

    if (!state.data.faq.length) {
      container.innerHTML =
        '<div class="empty-editor">Nenhuma pergunta cadastrada. Clique em “Nova pergunta” para começar.</div>';
      return;
    }

    container.innerHTML = state.data.faq
      .map(function (item, index) {
        return (
          '<article class="editor-item">' +
          '<div class="editor-item__head">' +
          '<span class="editor-item__icon" data-icon-preview>' +
          iconSvg("info") +
          "</span>" +
          '<span class="editor-item__title">' +
          esc(item.q || "Nova pergunta") +
          "</span>" +
          '<button type="button" class="editor-item__remove" data-action="remove-faq" data-index="' +
          index +
          '" aria-label="Remover pergunta">' +
          iconSvg("trash") +
          "</button>" +
          "</div>" +
          '<div class="editor-item__body">' +
          '<div class="field"><label>Pergunta</label><input type="text" data-bind="faq.' +
          index +
          '.q" value="' +
          esc(item.q) +
          '" /></div>' +
          '<div class="field"><label>Resposta</label><textarea rows="3" data-bind="faq.' +
          index +
          '.a">' +
          esc(item.a) +
          "</textarea></div>" +
          "</div></article>"
        );
      })
      .join("");
  }

  function focusLastEditor(container, selector) {
    if (!container) return;
    var items = container.querySelectorAll(".editor-item");
    var last = items[items.length - 1];
    if (!last) return;
    last.scrollIntoView({ block: "nearest", behavior: "smooth" });
    var input = last.querySelector(selector);
    if (input) input.focus();
  }

  /* ------------------------------------------------------------------------
     Resumo de horários
     ------------------------------------------------------------------------ */

  function timeToMinutes(value) {
    var parts = String(value || "00:00").split(":");
    return Number(parts[0]) * 60 + Number(parts[1] || 0);
  }

  function joinDays(days) {
    var names = [
      "domingo",
      "segunda-feira",
      "terça-feira",
      "quarta-feira",
      "quinta-feira",
      "sexta-feira",
      "sábado"
    ];
    var labels = days.map(function (day) {
      return names[day] || "";
    });
    if (labels.length <= 1) return labels.join("");
    return labels.slice(0, -1).join(", ") + " e " + labels[labels.length - 1];
  }

  function updateBookingSummary() {
    var summary = $("#bookingSummary");
    if (!summary) return;
    var booking = state.data.booking;
    var days = (booking.days || []).slice().sort(function (a, b) {
      return a - b;
    });

    var text =
      (booking.enabled ? "Agendamento online ativo. " : "Agendamento online desativado. ") +
      (days.length
        ? "Atendimento de " + joinDays(days)
        : "Nenhum dia de atendimento selecionado") +
      ", das " +
      (booking.start || "—") +
      " às " +
      (booking.end || "—") +
      ", com intervalos de " +
      (booking.interval || "—") +
      " minutos.";

    if (
      booking.lunchStart &&
      booking.lunchEnd &&
      timeToMinutes(booking.lunchEnd) > timeToMinutes(booking.lunchStart)
    ) {
      text +=
        " Pausa das " + booking.lunchStart + " às " + booking.lunchEnd + ".";
    }

    text +=
      " Agendamentos com até " +
      (booking.maxAdvanceDays || "—") +
      " dias de antecedência.";

    summary.innerHTML = "<strong>Resumo:</strong> " + esc(text);
  }

  /* ------------------------------------------------------------------------
     Agendamentos
     ------------------------------------------------------------------------ */

  function refreshAppointments() {
    state.appointments = SiteStore.loadAppointments();
  }

  function parseISODate(value) {
    var parts = String(value || "").split("-").map(Number);
    if (parts.length !== 3) return new Date(NaN);
    return new Date(parts[0], parts[1] - 1, parts[2]);
  }

  function formatDateShort(value) {
    var date = parseISODate(value);
    if (isNaN(date.getTime())) return value || "—";
    return date.toLocaleDateString("pt-BR");
  }

  function weekdayShort(value) {
    var date = parseISODate(value);
    if (isNaN(date.getTime())) return "";
    var weekday = date.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "");
    return weekday.charAt(0).toUpperCase() + weekday.slice(1);
  }

  function monthShort(value) {
    var date = parseISODate(value);
    if (isNaN(date.getTime())) return "";
    return date
      .toLocaleDateString("pt-BR", { month: "short" })
      .replace(".", "")
      .toUpperCase();
  }

  function formatDateTime(value) {
    if (!value) return "—";
    var date = new Date(value);
    if (isNaN(date.getTime())) return value;
    return date.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  function statusLabel(status) {
    if (status === "confirmado") return "Confirmado";
    if (status === "cancelado") return "Cancelado";
    return "Pendente";
  }

  function statusClass(status) {
    if (status === "confirmado") return "confirmado";
    if (status === "cancelado") return "cancelado";
    return "pendente";
  }

  function updatePendingBadge() {
    var badge = $("#pendingCount");
    if (!badge) return;
    var count = state.appointments.filter(function (appointment) {
      return appointment.status === "pendente";
    }).length;
    badge.textContent = count;
    badge.hidden = count === 0;
  }

  function renderDashboard() {
    refreshAppointments();
    var now = new Date();
    var monthKey =
      now.getFullYear() + "-" + String(now.getMonth() + 1).padStart(2, "0");

    var pending = state.appointments.filter(function (appointment) {
      return appointment.status === "pendente";
    }).length;
    var confirmed = state.appointments.filter(function (appointment) {
      return appointment.status === "confirmado";
    }).length;
    var thisMonth = state.appointments.filter(function (appointment) {
      return appointment.status !== "cancelado" && appointment.date.indexOf(monthKey) === 0;
    }).length;

    var statPending = $("#statPending");
    if (statPending) statPending.textContent = pending;

    var statConfirmed = $("#statConfirmed");
    if (statConfirmed) statConfirmed.textContent = confirmed;

    var statMonth = $("#statMonth");
    if (statMonth) statMonth.textContent = thisMonth;

    var statTotal = $("#statTotal");
    if (statTotal) statTotal.textContent = state.appointments.length;

    updatePendingBadge();

    var upcoming = state.appointments
      .filter(function (appointment) {
        return (
          appointment.status !== "cancelado" &&
          new Date(appointment.date + "T" + (appointment.time || "00:00")) >= now
        );
      })
      .sort(function (a, b) {
        return (
          new Date(a.date + "T" + (a.time || "00:00")) -
          new Date(b.date + "T" + (b.time || "00:00"))
        );
      })
      .slice(0, 4);

    var list = $("#nextAppointments");
    if (!list) return;

    if (!upcoming.length) {
      list.innerHTML =
        '<p class="empty-mini">Nenhum agendamento futuro. Os novos pedidos aparecerão aqui.</p>';
      return;
    }

    list.innerHTML = upcoming
      .map(function (appointment) {
        var day = String(parseISODate(appointment.date).getDate()).padStart(2, "0");
        return (
          '<div class="next-item">' +
          '<div class="next-date"><strong>' +
          day +
          "</strong><span>" +
          monthShort(appointment.date) +
          "</span></div>" +
          '<div class="next-info"><strong>' +
          esc(appointment.name) +
          "</strong><span>" +
          esc(appointment.area || "Consulta") +
          " · " +
          esc(appointment.mode || "") +
          "</span></div>" +
          '<span class="next-time">' +
          esc(appointment.time) +
          "</span>" +
          '<span class="badge badge--' +
          statusClass(appointment.status) +
          '">' +
          statusLabel(appointment.status) +
          "</span>" +
          "</div>"
        );
      })
      .join("");
  }

  function getFilteredAppointments() {
    var search = ($("#apptSearch").value || "").trim().toLowerCase();
    var status = $("#apptStatusFilter").value;
    var date = $("#apptDateFilter").value;
    var now = new Date();

    return state.appointments
      .filter(function (appointment) {
        var haystack = [
          appointment.name,
          appointment.email,
          appointment.phone,
          appointment.protocol,
          appointment.area
        ]
          .join(" ")
          .toLowerCase();

        if (search && haystack.indexOf(search) === -1) return false;
        if (status && appointment.status !== status) return false;
        if (date && appointment.date !== date) return false;
        return true;
      })
      .sort(function (a, b) {
        var dateA = new Date(a.date + "T" + (a.time || "00:00"));
        var dateB = new Date(b.date + "T" + (b.time || "00:00"));
        var upcomingA = dateA >= now;
        var upcomingB = dateB >= now;

        if (upcomingA && !upcomingB) return -1;
        if (!upcomingA && upcomingB) return 1;
        if (upcomingA && upcomingB) return dateA - dateB;
        return dateB - dateA;
      });
  }

  function renderAppointments() {
    refreshAppointments();
    var body = $("#appointmentsBody");
    var table = $(".data-table");
    var empty = $("#appointmentsEmpty");
    if (!body) return;

    var list = getFilteredAppointments();

    if (table) table.hidden = list.length === 0;
    if (empty) {
      empty.hidden = list.length > 0;
      var emptyTitle = empty.querySelector("h3");
      var emptyText = empty.querySelector("p");
      if (emptyTitle && emptyText) {
        if (!state.appointments.length) {
          emptyTitle.textContent = "Nenhum agendamento encontrado";
          emptyText.textContent =
            "Quando um cliente solicitar um horário pelo site, ele aparecerá aqui.";
        } else {
          emptyTitle.textContent = "Nenhum resultado com os filtros atuais";
          emptyText.textContent = "Ajuste a busca ou limpe os filtros para ver todos.";
        }
      }
    }

    body.innerHTML = list
      .map(function (appointment) {
        return (
          "<tr>" +
          '<td><div class="client-cell"><strong>' +
          esc(appointment.name) +
          "</strong><span>" +
          esc(appointment.protocol) +
          "</span></div></td>" +
          '<td><div class="contact-cell"><span>' +
          esc(appointment.email) +
          "</span><span>" +
          esc(appointment.phone) +
          "</span></div></td>" +
          '<td class="area-cell">' +
          esc(appointment.area || "—") +
          "</td>" +
          '<td><div class="date-cell"><strong>' +
          formatDateShort(appointment.date) +
          "</strong><span>" +
          esc(appointment.time) +
          " · " +
          weekdayShort(appointment.date) +
          "</span></div></td>" +
          '<td><span class="format-tag">' +
          esc(appointment.mode || "—") +
          "</span></td>" +
          '<td><span class="badge badge--' +
          statusClass(appointment.status) +
          '">' +
          statusLabel(appointment.status) +
          "</span></td>" +
          '<td><div class="row-actions">' +
          '<button type="button" class="icon-action" data-action="view" data-id="' +
          esc(appointment.id) +
          '" title="Ver detalhes" aria-label="Ver detalhes">' +
          iconSvg("eye") +
          "</button>" +
          (appointment.status === "pendente"
            ? '<button type="button" class="icon-action icon-action--confirm" data-action="confirm" data-id="' +
              esc(appointment.id) +
              '" title="Confirmar" aria-label="Confirmar agendamento">' +
              iconSvg("check") +
              "</button>"
            : "") +
          (appointment.status !== "cancelado"
            ? '<button type="button" class="icon-action" data-action="cancel" data-id="' +
              esc(appointment.id) +
              '" title="Cancelar" aria-label="Cancelar agendamento">' +
              iconSvg("x") +
              "</button>"
            : "") +
          '<button type="button" class="icon-action icon-action--danger" data-action="delete" data-id="' +
          esc(appointment.id) +
          '" title="Excluir" aria-label="Excluir agendamento">' +
          iconSvg("trash") +
          "</button>" +
          "</div></td></tr>"
        );
      })
      .join("");
  }

  function openAppointmentDialog(id) {
    refreshAppointments();
    var appointment = state.appointments.find(function (item) {
      return item.id === id;
    });
    if (!appointment) {
      showToast("Agendamento não encontrado.", "error");
      return;
    }

    state.lastAppointmentId = id;
    var details = $("#apptDetails");
    var actions = $("#apptDialogActions");
    var dialog = $("#apptDialog");

    if (details) {
      details.innerHTML =
        '<div class="detail-grid">' +
        '<div class="detail-item"><span>Cliente</span><strong>' +
        esc(appointment.name) +
        "</strong></div>" +
        '<div class="detail-item"><span>Protocolo</span><strong>' +
        esc(appointment.protocol) +
        "</strong></div>" +
        '<div class="detail-item"><span>E-mail</span><strong>' +
        esc(appointment.email) +
        "</strong></div>" +
        '<div class="detail-item"><span>Telefone</span><strong>' +
        esc(appointment.phone) +
        "</strong></div>" +
        '<div class="detail-item"><span>Área</span><strong>' +
        esc(appointment.area || "—") +
        "</strong></div>" +
        '<div class="detail-item"><span>Formato</span><strong>' +
        esc(appointment.mode || "—") +
        "</strong></div>" +
        '<div class="detail-item"><span>Data</span><strong>' +
        formatDateShort(appointment.date) +
        " (" +
        weekdayShort(appointment.date) +
        ")</strong></div>" +
        '<div class="detail-item"><span>Horário</span><strong>' +
        esc(appointment.time) +
        "</strong></div>" +
        '<div class="detail-item"><span>Status</span><strong>' +
        statusLabel(appointment.status) +
        "</strong></div>" +
        '<div class="detail-item"><span>Solicitado em</span><strong>' +
        formatDateTime(appointment.createdAt) +
        "</strong></div>" +
        "</div>" +
        (appointment.notes
          ? '<div class="detail-notes">' + esc(appointment.notes) + "</div>"
          : "");
    }

    if (actions) {
      actions.innerHTML =
        (appointment.status === "pendente"
          ? '<button type="button" class="btn btn--primary btn--sm" data-action="confirm" data-id="' +
            esc(appointment.id) +
            '">Confirmar agendamento</button>'
          : "") +
        (appointment.status !== "cancelado"
          ? '<button type="button" class="btn btn--outline btn--sm" data-action="cancel" data-id="' +
            esc(appointment.id) +
            '">Cancelar</button>'
          : "") +
        '<button type="button" class="btn btn--danger btn--sm" data-action="delete" data-id="' +
        esc(appointment.id) +
        '">Excluir</button>';
    }

    if (dialog && typeof dialog.showModal === "function") dialog.showModal();
    else if (dialog) dialog.setAttribute("open", "");
  }

  function closeAppointmentDialog() {
    var dialog = $("#apptDialog");
    if (!dialog) return;
    if (typeof dialog.close === "function") dialog.close();
    else dialog.removeAttribute("open");
  }

  function updateAppointmentStatus(id, status) {
    refreshAppointments();
    var appointment = state.appointments.find(function (item) {
      return item.id === id;
    });
    if (!appointment) return false;

    appointment.status = status;
    SiteStore.saveAppointments(state.appointments);
    renderAppointments();
    renderDashboard();
    showToast(
      status === "confirmado" ? "Agendamento confirmado com sucesso." : "Agendamento cancelado."
    );
    return true;
  }

  function deleteAppointment(id) {
    refreshAppointments();
    var appointment = state.appointments.find(function (item) {
      return item.id === id;
    });
    if (!appointment) return false;

    if (
      !window.confirm(
        'Excluir o agendamento de "' + appointment.name + '"? Esta ação não pode ser desfeita.'
      )
    ) {
      return false;
    }

    state.appointments = state.appointments.filter(function (item) {
      return item.id !== id;
    });
    SiteStore.saveAppointments(state.appointments);
    renderAppointments();
    renderDashboard();
    showToast("Agendamento excluído.");
    return true;
  }

  function handleAppointmentAction(action, id) {
    if (action === "view") {
      openAppointmentDialog(id);
      return false;
    }
    if (action === "confirm") return updateAppointmentStatus(id, "confirmado");
    if (action === "cancel") return updateAppointmentStatus(id, "cancelado");
    if (action === "delete") return deleteAppointment(id);
    return false;
  }

  function csvCell(value) {
    return '"' + String(value == null ? "" : value).replace(/"/g, '""') + '"';
  }

  function exportCsv() {
    refreshAppointments();
    var list = getFilteredAppointments();
    if (!list.length) {
      showToast("Não há agendamentos para exportar.", "error");
      return;
    }

    var headers = [
      "Protocolo",
      "Nome",
      "E-mail",
      "Telefone",
      "Área",
      "Formato",
      "Data",
      "Horário",
      "Status",
      "Observações",
      "Solicitado em"
    ];

    var rows = list.map(function (appointment) {
      return [
        appointment.protocol,
        appointment.name,
        appointment.email,
        appointment.phone,
        appointment.area,
        appointment.mode,
        formatDateShort(appointment.date),
        appointment.time,
        statusLabel(appointment.status),
        appointment.notes,
        formatDateTime(appointment.createdAt)
      ];
    });

    var csv =
      "\uFEFF" +
      [headers]
        .concat(rows)
        .map(function (row) {
          return row.map(csvCell).join(";");
        })
        .join("\r\n");

    downloadBlob(new Blob([csv], { type: "text/csv;charset=utf-8" }), "agendamentos.csv");
    showToast("CSV exportado com " + list.length + " agendamento(s).");
  }

  /* ------------------------------------------------------------------------
     Backup, senha e manutenção
     ------------------------------------------------------------------------ */

  function exportBackup() {
    var payload = {
      app: "schesman-advocacia",
      version: 1,
      exportedAt: new Date().toISOString(),
      site: SiteStore.clone(state.data),
      appointments: SiteStore.loadAppointments()
    };
    delete payload.site.admin;

    var date = new Date().toISOString().slice(0, 10);
    downloadBlob(
      new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" }),
      "backup-schesman-" + date + ".json"
    );
    showToast("Backup exportado. Guarde o arquivo em local seguro.");
  }

  function importBackup(file) {
    if (!file) return;
    var reader = new FileReader();

    reader.onload = function () {
      var parsed;
      try {
        parsed = JSON.parse(String(reader.result));
      } catch (error) {
        showToast("Arquivo inválido. Selecione um backup JSON.", "error");
        return;
      }

      var site = parsed && parsed.site ? parsed.site : parsed && parsed.brand ? parsed : null;
      if (!site || typeof site !== "object" || !site.brand) {
        showToast("Backup não reconhecido. Verifique o arquivo.", "error");
        return;
      }

      if (
        !window.confirm(
          "Importar este backup? O conteúdo atual do site e as configurações serão substituídos."
        )
      ) {
        return;
      }

      var currentPassword = state.data.admin.password;
      state.data = SiteStore.normalizeData(site);
      state.data.admin = state.data.admin || {};
      state.data.admin.password = currentPassword;

      if (Array.isArray(parsed.appointments)) {
        state.appointments = parsed.appointments;
        SiteStore.saveAppointments(state.appointments);
      }

      SiteStore.saveSiteData(state.data);
      setDirty(false);
      renderEverything();
      showToast("Backup importado com sucesso.");
    };

    reader.onerror = function () {
      showToast("Não foi possível ler o arquivo.", "error");
    };

    reader.readAsText(file);
  }

  function changePassword(event) {
    event.preventDefault();
    var current = $("#currentPassword");
    var next = $("#newPassword");
    var confirmation = $("#confirmPassword");
    var error = $("#passwordError");

    function fail(message) {
      if (error) {
        error.textContent = message;
        error.hidden = false;
      }
      showToast(message, "error");
    }

    if (current.value !== state.data.admin.password) {
      fail("A senha atual está incorreta.");
      current.focus();
      return;
    }
    if (next.value.length < 6) {
      fail("A nova senha precisa ter pelo menos 6 caracteres.");
      next.focus();
      return;
    }
    if (next.value !== confirmation.value) {
      fail("A confirmação não corresponde à nova senha.");
      confirmation.focus();
      return;
    }

    state.data.admin.password = next.value;
    SiteStore.saveSiteData(state.data);
    var hadChanges = state.dirty;
    setDirty(false);
    if (error) error.hidden = true;
    $("#passwordForm").reset();
    renderLoginHint();
    showToast(
      hadChanges
        ? "Senha alterada. As demais alterações pendentes também foram salvas."
        : "Senha alterada com sucesso."
    );
  }

  function resetContent() {
    if (
      !window.confirm(
        "Restaurar todo o conteúdo padrão do site? Textos, cores e configurações serão substituídos. Os agendamentos não serão apagados."
      )
    ) {
      return;
    }

    var password = state.data.admin.password;
    SiteStore.resetSiteData();
    state.data = SiteStore.loadSiteData();
    state.data.admin.password = password;
    SiteStore.saveSiteData(state.data);
    setDirty(false);
    renderEverything();
    showToast("Conteúdo padrão restaurado.");
  }

  function clearAppointments() {
    if (
      !window.confirm(
        "Apagar TODOS os agendamentos? Esta ação não pode ser desfeita. Considere exportar um backup antes."
      )
    ) {
      return;
    }

    SiteStore.saveAppointments([]);
    state.appointments = [];
    renderAppointments();
    renderDashboard();
    showToast("Todos os agendamentos foram apagados.");
  }

  /* ------------------------------------------------------------------------
     Navegação e renderização
     ------------------------------------------------------------------------ */

  function switchTab(tab) {
    if (!TAB_META[tab]) return;
    state.tab = tab;

    $all(".nav-item").forEach(function (button) {
      button.classList.toggle("is-active", button.getAttribute("data-tab") === tab);
    });

    $all(".tab-panel").forEach(function (panel) {
      panel.hidden = panel.getAttribute("data-panel") !== tab;
    });

    var meta = TAB_META[tab];
    var pageTitle = $("#pageTitle");
    var pageSubtitle = $("#pageSubtitle");
    if (pageTitle) pageTitle.textContent = meta.title;
    if (pageSubtitle) pageSubtitle.textContent = meta.subtitle;

    if (tab === "visao") renderDashboard();
    if (tab === "agendamentos") renderAppointments();
    if (tab === "horarios") updateBookingSummary();

    closeSidebar();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function renderEverything() {
    fillForms();
    renderAreasEditor();
    renderPillarsEditor();
    renderFaqEditor();
    updateLogoPreview();
    updateThemePreview();
    updateBookingSummary();
    updateBrandChrome();
    renderDashboard();
    renderAppointments();
  }

  function openSidebar() {
    var sidebar = $("#sidebar");
    var overlay = $("#sidebarOverlay");
    if (!sidebar) return;
    sidebar.classList.add("is-open");
    if (overlay) overlay.hidden = false;
    document.body.style.overflow = "hidden";
  }

  function closeSidebar() {
    var sidebar = $("#sidebar");
    var overlay = $("#sidebarOverlay");
    if (!sidebar) return;
    sidebar.classList.remove("is-open");
    if (overlay) overlay.hidden = true;
    document.body.style.overflow = "";
  }

  function showApp() {
    var loginView = $("#loginView");
    var adminView = $("#adminView");
    if (loginView) loginView.hidden = true;
    if (adminView) adminView.hidden = false;

    state.data = SiteStore.loadSiteData();
    state.appointments = SiteStore.loadAppointments();
    setDirty(false);
    renderEverything();
    switchTab("visao");
  }

  function showLogin() {
    var loginView = $("#loginView");
    var adminView = $("#adminView");
    if (adminView) adminView.hidden = true;
    if (loginView) loginView.hidden = false;

    var password = $("#loginPassword");
    if (password) password.value = "";
    var error = $("#loginError");
    if (error) error.hidden = true;
    closeSidebar();
    window.scrollTo(0, 0);
  }

  /* ------------------------------------------------------------------------
     Validação e salvamento
     ------------------------------------------------------------------------ */

  function slugify(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40);
  }

  function ensureAreaIds() {
    var used = {};
    state.data.areas.forEach(function (area) {
      var id = String(area.id || "").trim();
      if (!id || used[id]) {
        var base = slugify(area.title) || "area";
        id = base;
        var suffix = 2;
        while (used[id]) {
          id = base + "-" + suffix;
          suffix += 1;
        }
        area.id = id;
      }
      used[id] = true;
    });
  }

  function validateAll() {
    if (!String(state.data.brand.name || "").trim()) {
      return { message: "Informe o nome do escritório.", tab: "identidade" };
    }

    var themeKeys = ["primary", "accent", "background"];
    for (var index = 0; index < themeKeys.length; index += 1) {
      if (!isHex(state.data.theme[themeKeys[index]])) {
        return {
          message: "Confira os códigos de cor. Use o formato #RRGGBB.",
          tab: "identidade"
        };
      }
    }

    for (var areaIndex = 0; areaIndex < state.data.areas.length; areaIndex += 1) {
      if (!String(state.data.areas[areaIndex].title || "").trim()) {
        return { message: "Toda área precisa de um título.", tab: "areas" };
      }
    }

    for (var faqIndex = 0; faqIndex < state.data.faq.length; faqIndex += 1) {
      if (
        !String(state.data.faq[faqIndex].q || "").trim() ||
        !String(state.data.faq[faqIndex].a || "").trim()
      ) {
        return {
          message: "Preencha a pergunta e a resposta de todos os itens.",
          tab: "faq"
        };
      }
    }

    for (var pillarIndex = 0; pillarIndex < state.data.pillars.length; pillarIndex += 1) {
      if (!String(state.data.pillars[pillarIndex].title || "").trim()) {
        return { message: "Todo destaque precisa de um título.", tab: "inicio" };
      }
    }

    var booking = state.data.booking;
    if (!booking.days || !booking.days.length) {
      return {
        message: "Selecione pelo menos um dia de atendimento.",
        tab: "horarios"
      };
    }
    if (!booking.start || !booking.end) {
      return { message: "Informe o início e o fim do atendimento.", tab: "horarios" };
    }
    if (timeToMinutes(booking.end) <= timeToMinutes(booking.start)) {
      return {
        message: "O fim do atendimento precisa ser depois do início.",
        tab: "horarios"
      };
    }
    if (!booking.lunchStart || !booking.lunchEnd) {
      return {
        message: "Informe o início e o fim da pausa (ou use horários iguais para não ter pausa).",
        tab: "horarios"
      };
    }
    if (Number(booking.interval) < 15) {
      return { message: "O intervalo precisa ser de pelo menos 15 minutos.", tab: "horarios" };
    }
    if (Number(booking.maxAdvanceDays) < 1) {
      return {
        message: "A antecedência máxima precisa ser de pelo menos 1 dia.",
        tab: "horarios"
      };
    }

    return null;
  }

  function saveAll() {
    var problem = validateAll();
    if (problem) {
      switchTab(problem.tab);
      showToast(problem.message, "error");
      return;
    }

    ensureAreaIds();
    SiteStore.saveSiteData(state.data);
    setDirty(false);
    renderEverything();
    showToast("Alterações salvas com sucesso. Abra o site para conferir.");
  }

  function discardChanges() {
    if (!state.dirty) return;
    if (!window.confirm("Descartar todas as alterações não salvas?")) return;

    state.data = SiteStore.loadSiteData();
    state.appointments = SiteStore.loadAppointments();
    setDirty(false);
    renderEverything();
    showToast("Alterações descartadas.");
  }

  /* ------------------------------------------------------------------------
     Inicialização e eventos
     ------------------------------------------------------------------------ */

  function setupLogin() {
    var form = $("#loginForm");
    var password = $("#loginPassword");
    var error = $("#loginError");
    var toggle = $("#toggleLoginPassword");

    if (toggle && password) {
      toggle.addEventListener("click", function () {
        var show = password.type === "password";
        password.type = show ? "text" : "password";
        toggle.innerHTML = iconSvg(show ? "eye-off" : "eye");
        toggle.setAttribute("aria-label", show ? "Ocultar senha" : "Mostrar senha");
      });
    }

    if (password && error) {
      password.addEventListener("input", function () {
        error.hidden = true;
        password.classList.remove("is-invalid");
      });
    }

    if (!form) return;

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var value = password.value;

      if (value === state.data.admin.password) {
        setAuthed(true);
        if (error) error.hidden = true;
        password.classList.remove("is-invalid");
        showApp();
        showToast("Bem-vindo ao painel do escritório.");
      } else {
        if (error) error.hidden = false;
        password.classList.add("is-invalid");
        password.focus();
      }
    });
  }

  function setupNavigation() {
    $all(".nav-item").forEach(function (button) {
      button.addEventListener("click", function () {
        switchTab(button.getAttribute("data-tab"));
      });
    });

    $all("[data-goto]").forEach(function (button) {
      button.addEventListener("click", function () {
        switchTab(button.getAttribute("data-goto"));
      });
    });

    var menuBtn = $("#adminMenuBtn");
    if (menuBtn) menuBtn.addEventListener("click", openSidebar);

    var sidebarClose = $("#sidebarClose");
    if (sidebarClose) sidebarClose.addEventListener("click", closeSidebar);

    var overlay = $("#sidebarOverlay");
    if (overlay) overlay.addEventListener("click", closeSidebar);

    var saveBtn = $("#saveBtn");
    if (saveBtn) saveBtn.addEventListener("click", saveAll);

    var discardBtn = $("#discardBtn");
    if (discardBtn) discardBtn.addEventListener("click", discardChanges);

    var logoutBtn = $("#logoutBtn");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", function () {
        if (state.dirty && !window.confirm("Sair sem salvar as alterações?")) return;
        setAuthed(false);
        setDirty(false);
        showLogin();
        showToast("Sessão encerrada.");
      });
    }
  }

  function setupEditors() {
    var addArea = $("#addArea");
    if (addArea) {
      addArea.addEventListener("click", function () {
        state.data.areas.push({
          id: "area-" + Date.now().toString(36),
          icon: "scale",
          title: "Nova área",
          description: ""
        });
        setDirty(true);
        renderAreasEditor();
        focusLastEditor($("#areasEditor"), '[data-bind$=".title"]');
      });
    }

    var addPillar = $("#addPillar");
    if (addPillar) {
      addPillar.addEventListener("click", function () {
        state.data.pillars.push({ icon: "users", title: "Novo destaque" });
        setDirty(true);
        renderPillarsEditor();
        focusLastEditor($("#pillarsEditor"), '[data-bind$=".title"]');
      });
    }

    var addFaq = $("#addFaq");
    if (addFaq) {
      addFaq.addEventListener("click", function () {
        state.data.faq.push({ q: "Nova pergunta", a: "" });
        setDirty(true);
        renderFaqEditor();
        focusLastEditor($("#faqEditor"), '[data-bind$=".q"]');
      });
    }

    var areasEditor = $("#areasEditor");
    if (areasEditor) {
      areasEditor.addEventListener("click", function (event) {
        var button = event.target.closest('[data-action="remove-area"]');
        if (!button) return;
        state.data.areas.splice(Number(button.getAttribute("data-index")), 1);
        setDirty(true);
        renderAreasEditor();
        showToast("Área removida. Salve para aplicar no site.");
      });
    }

    var pillarsEditor = $("#pillarsEditor");
    if (pillarsEditor) {
      pillarsEditor.addEventListener("click", function (event) {
        var button = event.target.closest('[data-action="remove-pillar"]');
        if (!button) return;
        state.data.pillars.splice(Number(button.getAttribute("data-index")), 1);
        setDirty(true);
        renderPillarsEditor();
        showToast("Destaque removido. Salve para aplicar no site.");
      });
    }

    var faqEditor = $("#faqEditor");
    if (faqEditor) {
      faqEditor.addEventListener("click", function (event) {
        var button = event.target.closest('[data-action="remove-faq"]');
        if (!button) return;
        state.data.faq.splice(Number(button.getAttribute("data-index")), 1);
        setDirty(true);
        renderFaqEditor();
        showToast("Pergunta removida. Salve para aplicar no site.");
      });
    }
  }

  function setupLogo() {
    var input = $("#logoInput");
    var remove = $("#removeLogoBtn");

    if (input) {
      input.addEventListener("change", function () {
        var file = input.files && input.files[0];
        if (!file) return;

        if (file.size > 400 * 1024) {
          showToast("A imagem precisa ter no máximo 400 KB.", "error");
          input.value = "";
          return;
        }

        var reader = new FileReader();
        reader.onload = function () {
          state.data.brand.logoDataUrl = String(reader.result);
          setDirty(true);
          updateLogoPreview();
          updateBrandChrome();
          showToast("Logo carregada. Salve as alterações para aplicar.");
        };
        reader.onerror = function () {
          showToast("Não foi possível ler a imagem.", "error");
        };
        reader.readAsDataURL(file);
        input.value = "";
      });
    }

    if (remove) {
      remove.addEventListener("click", function () {
        if (!state.data.brand.logoDataUrl) {
          showToast("Nenhuma logo carregada.");
          return;
        }
        state.data.brand.logoDataUrl = "";
        setDirty(true);
        updateLogoPreview();
        updateBrandChrome();
        showToast("Logo removida. Salve para aplicar.");
      });
    }
  }

  function setupBookingDays() {
    var grid = $(".days-grid");
    if (!grid) return;

    grid.addEventListener("change", function (event) {
      var checkbox = event.target.closest("[data-day]");
      if (!checkbox) return;
      var day = Number(checkbox.getAttribute("data-day"));
      var days = (state.data.booking.days || []).filter(function (value) {
        return value !== day;
      });
      if (checkbox.checked) days.push(day);
      days.sort(function (a, b) {
        return a - b;
      });
      state.data.booking.days = days;
      setDirty(true);
      updateBookingSummary();
    });
  }

  function setupAppointments() {
    var body = $("#appointmentsBody");
    if (body) {
      body.addEventListener("click", function (event) {
        var button = event.target.closest("[data-action]");
        if (!button) return;
        handleAppointmentAction(button.getAttribute("data-action"), button.getAttribute("data-id"));
      });
    }

    var search = $("#apptSearch");
    if (search) search.addEventListener("input", renderAppointments);

    var status = $("#apptStatusFilter");
    if (status) status.addEventListener("change", renderAppointments);

    var date = $("#apptDateFilter");
    if (date) date.addEventListener("change", renderAppointments);

    var clear = $("#clearFilters");
    if (clear) {
      clear.addEventListener("click", function () {
        if (search) search.value = "";
        if (status) status.value = "";
        if (date) date.value = "";
        renderAppointments();
      });
    }

    var exportButton = $("#exportCsv");
    if (exportButton) exportButton.addEventListener("click", exportCsv);

    var dialog = $("#apptDialog");
    var close = $("#closeDialog");
    if (close) close.addEventListener("click", closeAppointmentDialog);
    if (dialog) {
      dialog.addEventListener("click", function (event) {
        if (event.target === dialog) closeAppointmentDialog();
      });
    }

    var dialogActions = $("#apptDialogActions");
    if (dialogActions) {
      dialogActions.addEventListener("click", function (event) {
        var button = event.target.closest("[data-action]");
        if (!button) return;
        var handled = handleAppointmentAction(
          button.getAttribute("data-action"),
          button.getAttribute("data-id")
        );
        if (handled) closeAppointmentDialog();
      });
    }
  }

  function setupConfig() {
    var passwordForm = $("#passwordForm");
    if (passwordForm) passwordForm.addEventListener("submit", changePassword);

    var exportButton = $("#exportBackup");
    if (exportButton) exportButton.addEventListener("click", exportBackup);

    var importInput = $("#importBackup");
    if (importInput) {
      importInput.addEventListener("change", function () {
        var file = importInput.files && importInput.files[0];
        importBackup(file);
        importInput.value = "";
      });
    }

    var resetButton = $("#resetContent");
    if (resetButton) resetButton.addEventListener("click", resetContent);

    var clearButton = $("#clearAppointments");
    if (clearButton) clearButton.addEventListener("click", clearAppointments);
  }

  function init() {
    injectIcons();
    updateBrandChrome();
    renderLoginHint();

    document.addEventListener("input", handleBoundInput);
    document.addEventListener("change", handleBoundInput);

    setupLogin();
    setupNavigation();
    setupEditors();
    setupLogo();
    setupBookingDays();
    setupAppointments();
    setupConfig();

    window.addEventListener("beforeunload", function (event) {
      if (!state.dirty) return;
      event.preventDefault();
      event.returnValue = "";
    });

    if (isAuthed()) showApp();
    else showLogin();
  }

  init();
})();
