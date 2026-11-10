/* Site institucional — renderização do conteúdo e agendamento. */
(function () {
  "use strict";

  var data = SiteStore.loadSiteData();
  var selectedSlot = "";
  var lastAppointment = null;
  var toastTimer = null;

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

  function setText(id, value) {
    var element = document.getElementById(id);
    if (element && value != null) element.textContent = value;
  }

  function setHtml(id, value) {
    var element = document.getElementById(id);
    if (element) element.innerHTML = value;
  }

  function onlyDigits(value) {
    return String(value == null ? "" : value).replace(/\D/g, "");
  }

  function telHref(phone) {
    var digits = onlyDigits(phone);
    if (!digits) return "";
    if (digits.indexOf("55") === 0 && digits.length >= 12) return "tel:+" + digits;
    if (digits.length >= 10) return "tel:+55" + digits;
    return "tel:" + digits;
  }

  function whatsappHref(number, message) {
    var digits = onlyDigits(number);
    if (!digits) return "";
    if (digits.indexOf("55") !== 0 && digits.length <= 11) digits = "55" + digits;
    return "https://wa.me/" + digits + "?text=" + encodeURIComponent(message || "");
  }

  function normalizeInstagram(value) {
    var raw = String(value || "").trim();
    if (!raw) return "";

    raw = raw.replace(/^@+/, "");
    if (!/^https?:\/\//i.test(raw)) {
      if (/^(www\.)?instagram\.com(\/|$)/i.test(raw)) {
        raw = "https://" + raw;
      } else {
        raw = "https://www.instagram.com/" + raw.replace(/^\/+/, "");
      }
    }

    try {
      var url = new URL(raw);
      if (!/(^|\.)instagram\.com$/i.test(url.hostname)) return "";
      var parts = url.pathname.split("/").filter(Boolean);
      if (!parts.length) return "";
      return "https://www.instagram.com/" + parts[0] + "/";
    } catch (error) {
      return "";
    }
  }

  function setLink(id, href, hideWhenEmpty) {
    var element = document.getElementById(id);
    if (!element) return;
    if (href) {
      element.setAttribute("href", href);
      element.style.display = "";
    } else if (hideWhenEmpty) {
      element.style.display = "none";
    }
  }

  function showToast(message, type) {
    var toast = $("#toast");
    if (!toast) return;
    toast.textContent = message;
    toast.classList.toggle("is-error", type === "error");
    toast.classList.add("is-visible");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () {
      toast.classList.remove("is-visible");
    }, 4200);
  }

  function injectIcons(root) {
    $all("[data-icon]", root || document).forEach(function (element) {
      var name = element.getAttribute("data-icon");
      if (name) element.innerHTML = iconSvg(name);
    });
  }

  function applyTheme() {
    var root = document.documentElement;
    root.style.setProperty("--primary", data.theme.primary || "#14263b");
    root.style.setProperty("--accent", data.theme.accent || "#b8935a");
    root.style.setProperty("--bg", data.theme.background || "#f7f5f1");
  }

  function renderBrandMark(id, fallback) {
    var element = document.getElementById(id);
    if (!element) return;
    if (data.brand.logoDataUrl) {
      element.innerHTML = '<img src="' + esc(data.brand.logoDataUrl) + '" alt="" />';
    } else {
      element.textContent = fallback || "S";
    }
  }

  function renderContent() {
    document.title = data.brand.name + " — " + data.brand.tagline;

    var metaDescription = $('meta[name="description"]');
    if (metaDescription && data.hero.subtitle) {
      metaDescription.setAttribute("content", data.hero.subtitle);
    }

    /* Marca */
    setText("brandName", data.brand.name);
    setText("brandTagline", data.brand.tagline);
    setText("heroMonogram", data.brand.monogram);
    setText("heroArtName", data.brand.name);
    setText("heroOab", data.brand.oab);
    setText("footerName", data.brand.name);
    setText("footerTagline", data.brand.tagline);
    setText("footerOab", data.brand.oab);
    setText("footerLegalName", data.brand.name);
    renderBrandMark("brandMark", data.brand.monogram);
    renderBrandMark("footerMark", data.brand.monogram);

    var brandLink = $("#brandLink");
    if (brandLink) brandLink.setAttribute("aria-label", data.brand.name + " — ir para o início");

    /* Hero */
    setText("heroEyebrow", data.hero.eyebrow);
    var heroTitle = $("#heroTitle");
    if (heroTitle) {
      var title = String(data.hero.title || "");
      var highlight = String(data.hero.highlight || "");
      var index = highlight ? title.indexOf(highlight) : -1;
      if (index !== -1) {
        heroTitle.innerHTML =
          esc(title.slice(0, index)) +
          "<em>" +
          esc(highlight) +
          "</em>" +
          esc(title.slice(index + highlight.length));
      } else {
        heroTitle.textContent = title;
      }
    }
    setText("heroSubtitle", data.hero.subtitle);

    var ctaPrimary = $("#heroCtaPrimary");
    if (ctaPrimary) {
      ctaPrimary.innerHTML = esc(data.hero.ctaPrimary) + iconSvg("arrow-right");
    }
    var ctaSecondary = $("#heroCtaSecondary");
    if (ctaSecondary) ctaSecondary.textContent = data.hero.ctaSecondary;

    /* Compromissos */
    var pillarsGrid = $("#pillarsGrid");
    if (pillarsGrid) {
      if (!data.pillars.length) {
        var pillarsSection = pillarsGrid.closest(".pillars");
        if (pillarsSection) pillarsSection.hidden = true;
      } else {
        pillarsGrid.innerHTML = data.pillars
          .map(function (pillar) {
            return (
              '<div class="pillars__item">' +
              '<span class="pillars__icon">' +
              iconSvg(pillar.icon || "check") +
              "</span>" +
              "<strong>" +
              esc(pillar.title) +
              "</strong>" +
              "</div>"
            );
          })
          .join("");
      }
    }

    /* O escritório */
    setText("aboutEyebrow", data.about.eyebrow);
    setText("aboutTitle", data.about.title);
    setText("aboutQuote", "“" + data.about.quote + "”");
    setText("aboutText1", data.about.text1);
    setText("aboutText2", data.about.text2);

    var points = $("#aboutPoints");
    if (points) {
      points.innerHTML = (data.about.points || [])
        .filter(function (point) {
          return String(point).trim();
        })
        .map(function (point) {
          return "<li>" + esc(point) + "</li>";
        })
        .join("");
    }

    /* Áreas */
    var areasGrid = $("#areasGrid");
    if (areasGrid) {
      if (!data.areas.length) {
        var areasSection = $("#areas");
        if (areasSection) areasSection.hidden = true;
      } else {
        areasGrid.innerHTML = data.areas
          .map(function (area, index) {
            var number = String(index + 1).padStart(2, "0");
            return (
              '<article class="area-card reveal">' +
              '<div class="area-card__top">' +
              '<span class="area-card__icon">' +
              iconSvg(area.icon || "scale") +
              "</span>" +
              '<span class="area-card__num">' +
              number +
              "</span>" +
              "</div>" +
              "<h3>" +
              esc(area.title) +
              "</h3>" +
              "<p>" +
              esc(area.description) +
              "</p>" +
              '<a class="area-card__link" href="#agendamento" data-area="' +
              esc(area.id || "") +
              '">Agendar consulta ' +
              iconSvg("arrow-right") +
              "</a>" +
              "</article>"
            );
          })
          .join("");
      }
    }

    /* FAQ */
    var faqList = $("#faqList");
    if (faqList) {
      if (!data.faq.length) {
        var faqSection = $("#duvidas");
        if (faqSection) faqSection.hidden = true;
      } else {
        faqList.innerHTML = data.faq
          .map(function (item) {
            return (
              '<details class="faq-item">' +
              "<summary><span>" +
              esc(item.q) +
              "</span>" +
              iconSvg("chevron-down") +
              "</summary>" +
              '<div class="faq__answer"><p>' +
              esc(item.a) +
              "</p></div>" +
              "</details>"
            );
          })
          .join("");
      }
    }

    /* Contato */
    setText("topPhone", data.contact.phone);
    setText("topEmail", data.contact.email);
    setText("topHours", data.contact.hours);
    setText("contactPhone", data.contact.phone);
    setText("contactEmail", data.contact.email);
    setText("contactAddress", data.contact.address);
    setText("contactHours", data.contact.hours);
    setText("bookingPhone", data.contact.phone);
    setText("footerPhone", data.contact.phone);
    setText("footerAddress", data.contact.address);
    setText("footerHours", data.contact.hours);

    var tel = telHref(data.contact.phone);
    setLink("topPhoneLink", tel, true);
    setLink("bookingPhoneLink", tel, true);
    setLink("contactPhoneLink", tel, true);
    setLink("footerPhoneLink", tel, true);

    var mail = data.contact.email ? "mailto:" + data.contact.email : "";
    setLink("topEmailLink", mail, true);
    setLink("contactEmailLink", mail, true);
    setLink("footerEmailLink", mail, true);

    var defaultWhatsMessage =
      "Olá! Vim pelo site e gostaria de agendar uma consulta com o escritório.";
    var whatsapp = whatsappHref(data.contact.whatsapp, defaultWhatsMessage);
    setLink("bookingWhatsapp", whatsapp, true);
    setLink("contactWhatsapp", whatsapp, true);
    setLink("footerWhatsapp", whatsapp, true);
    setLink("whatsappFloat", whatsapp, true);

    /* Instagram */
    var instagram = normalizeInstagram(data.contact.instagram);
    var instagramHandle = "";
    if (instagram) {
      try {
        var instagramUrl = new URL(instagram);
        var parts = instagramUrl.pathname.split("/").filter(Boolean);
        if (parts.length) instagramHandle = "@" + parts[0];
      } catch (error) {
        instagramHandle = "";
      }
    }

    setLink("topInstagram", instagram, true);
    setLink("contactInstagram", instagram, true);
    setLink("instagramCardLink", instagram, false);
    setLink("footerInstagram", instagram, true);

    var instagramCard = $(".instagram-card");
    if (instagramCard) instagramCard.hidden = !instagram;

    var handleElement = $("#instagramHandle");
    if (handleElement) {
      handleElement.textContent = instagramHandle;
      handleElement.hidden = !instagramHandle;
    }

    /* Agendamento */
    setText("bookingEyebrow", data.booking.eyebrow);
    setText("bookingTitle", data.booking.title);
    setText("bookingSubtitle", data.booking.subtitle);
    setText("successMessage", data.booking.successMessage);

    var areaSelect = $("#bookingArea");
    if (areaSelect) {
      var options = '<option value="">Selecione a área de interesse</option>';
      options += data.areas
        .map(function (area) {
          return '<option value="' + esc(area.id || "") + '">' + esc(area.title) + "</option>";
        })
        .join("");
      options += '<option value="outro">Outro assunto</option>';
      areaSelect.innerHTML = options;
    }

    /* Ano do rodapé */
    setText("footerYear", new Date().getFullYear());
  }

  function setupNavigation() {
    var header = $("#siteHeader");
    var toggle = $("#navToggle");
    var nav = $("#mainNav");

    function closeMenu() {
      if (!nav || !toggle) return;
      nav.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-label", "Abrir menu");
      document.body.classList.remove("nav-open");
    }

    if (toggle && nav) {
      toggle.addEventListener("click", function () {
        var isOpen = nav.classList.toggle("is-open");
        toggle.setAttribute("aria-expanded", String(isOpen));
        toggle.setAttribute("aria-label", isOpen ? "Fechar menu" : "Abrir menu");
        document.body.classList.toggle("nav-open", isOpen);
      });

      nav.addEventListener("click", function (event) {
        if (event.target.closest("a")) closeMenu();
      });

      document.addEventListener("keydown", function (event) {
        if (event.key === "Escape") closeMenu();
      });

      window.addEventListener("resize", function () {
        if (window.innerWidth > 980) closeMenu();
      });
    }

    function onScroll() {
      if (header) header.classList.toggle("is-scrolled", window.scrollY > 8);
      updateActiveLink();
    }

    var navSections = ["inicio", "escritorio", "areas", "processo", "duvidas", "contato"]
      .map(function (id) {
        return document.getElementById(id);
      })
      .filter(Boolean);

    var ticking = false;

    function updateActiveLink() {
      if (!navSections.length) return;
      var position = window.scrollY + 160;
      var current = navSections[0];

      navSections.forEach(function (section) {
        var top = section.getBoundingClientRect().top + window.scrollY;
        if (top <= position) current = section;
      });

      $all(".nav__link").forEach(function (link) {
        link.classList.toggle("is-active", link.getAttribute("href") === "#" + current.id);
      });
    }

    window.addEventListener(
      "scroll",
      function () {
        if (ticking) return;
        ticking = true;
        window.requestAnimationFrame(function () {
          onScroll();
          ticking = false;
        });
      },
      { passive: true }
    );

    onScroll();
  }

  function setupReveal() {
    var elements = $all(".reveal");
    if (!elements.length) return;

    var groups = new Map();
    elements.forEach(function (element) {
      var parent = element.parentElement;
      if (!parent) return;
      if (!groups.has(parent)) groups.set(parent, []);
      groups.get(parent).push(element);
    });

    groups.forEach(function (group) {
      group.forEach(function (element, index) {
        element.style.transitionDelay = Math.min(index * 70, 280) + "ms";
      });
    });

    if (!("IntersectionObserver" in window)) {
      elements.forEach(function (element) {
        element.classList.add("is-visible");
      });
      return;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );

    elements.forEach(function (element) {
      observer.observe(element);
    });
  }

  /* ------------------------------------------------------------------------
     Agendamento
     ------------------------------------------------------------------------ */

  function timeToMinutes(time) {
    var parts = String(time || "00:00").split(":");
    return Number(parts[0]) * 60 + Number(parts[1] || 0);
  }

  function minutesToTime(minutes) {
    var hours = Math.floor(minutes / 60);
    var mins = minutes % 60;
    return String(hours).padStart(2, "0") + ":" + String(mins).padStart(2, "0");
  }

  function toISODate(date) {
    return (
      date.getFullYear() +
      "-" +
      String(date.getMonth() + 1).padStart(2, "0") +
      "-" +
      String(date.getDate()).padStart(2, "0")
    );
  }

  function parseISODate(value) {
    var parts = String(value || "").split("-").map(Number);
    if (parts.length !== 3) return new Date(NaN);
    return new Date(parts[0], parts[1] - 1, parts[2]);
  }

  function formatDateLong(value) {
    var date = parseISODate(value);
    if (isNaN(date.getTime())) return value;
    var formatted = date.toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric"
    });
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  }

  function getBookingSettings() {
    var booking = data.booking;
    return {
      days: Array.isArray(booking.days) ? booking.days : [1, 2, 3, 4, 5],
      start: timeToMinutes(booking.start || "09:00"),
      end: timeToMinutes(booking.end || "18:00"),
      interval: Math.max(15, Number(booking.interval) || 60),
      lunchStart: timeToMinutes(booking.lunchStart || "12:00"),
      lunchEnd: timeToMinutes(booking.lunchEnd || "13:00"),
      maxAdvanceDays: Math.max(1, Number(booking.maxAdvanceDays) || 60)
    };
  }

  function setupDateLimits() {
    var dateInput = $("#bookingDate");
    if (!dateInput) return;
    var settings = getBookingSettings();
    var today = new Date();
    today.setHours(0, 0, 0, 0);
    var max = new Date(today);
    max.setDate(max.getDate() + settings.maxAdvanceDays);
    dateInput.min = toISODate(today);
    dateInput.max = toISODate(max);
  }

  function getBookedTimes(dateValue) {
    return SiteStore.loadAppointments()
      .filter(function (appointment) {
        return appointment.date === dateValue && appointment.status !== "cancelado";
      })
      .map(function (appointment) {
        return appointment.time;
      });
  }

  function renderSlots() {
    var container = $("#bookingSlots");
    var dateInput = $("#bookingDate");
    var hiddenSlot = $("#bookingSlot");
    if (!container || !dateInput) return;

    selectedSlot = "";
    if (hiddenSlot) hiddenSlot.value = "";
    clearError("bookingSlots");

    var dateValue = dateInput.value;
    if (!dateValue) {
      container.innerHTML =
        '<p class="slots__hint">Selecione uma data para ver os horários disponíveis.</p>';
      return;
    }

    var date = parseISODate(dateValue);
    if (isNaN(date.getTime())) {
      container.innerHTML = '<p class="slots__hint">Data inválida. Escolha outra data.</p>';
      return;
    }

    var settings = getBookingSettings();
    if (settings.days.indexOf(date.getDay()) === -1) {
      container.innerHTML =
        '<p class="slots__hint slots__hint--warning">Não há atendimento nesta data. Escolha outro dia.</p>';
      return;
    }

    var booked = getBookedTimes(dateValue);
    var now = new Date();
    var todayISO = toISODate(now);
    var nowMinutes = now.getHours() * 60 + now.getMinutes();
    var slots = [];

    for (var time = settings.start; time + settings.interval <= settings.end; time += settings.interval) {
      if (
        settings.lunchEnd > settings.lunchStart &&
        time >= settings.lunchStart &&
        time < settings.lunchEnd
      ) {
        continue;
      }

      var slotTime = minutesToTime(time);
      var unavailable =
        booked.indexOf(slotTime) !== -1 ||
        (dateValue === todayISO && time < nowMinutes + 30);

      slots.push({ time: slotTime, unavailable: unavailable });
    }

    if (!slots.length) {
      container.innerHTML =
        '<p class="slots__hint slots__hint--warning">Nenhum horário disponível nesta data. Escolha outro dia.</p>';
      return;
    }

    var allUnavailable = slots.every(function (slot) {
      return slot.unavailable;
    });

    container.innerHTML =
      slots
        .map(function (slot) {
          return (
            '<button type="button" class="slot" data-time="' +
            slot.time +
            '"' +
            (slot.unavailable ? " disabled" : "") +
            ">" +
            slot.time +
            "</button>"
          );
        })
        .join("") +
      (allUnavailable
        ? '<p class="slots__hint slots__hint--warning">Todos os horários desta data estão ocupados. Escolha outro dia.</p>'
        : "");
  }

  function showError(fieldId, message) {
    var error = document.querySelector('[data-error-for="' + fieldId + '"]');
    if (error) {
      error.textContent = message;
      error.hidden = false;
    }
    var field = document.getElementById(fieldId);
    if (field) {
      if (field.type === "checkbox") {
        var label = field.closest(".checkbox");
        if (label) label.classList.add("is-invalid");
      } else {
        field.classList.add("is-invalid");
      }
    }
  }

  function clearError(fieldId) {
    var error = document.querySelector('[data-error-for="' + fieldId + '"]');
    if (error) {
      error.textContent = "";
      error.hidden = true;
    }
    var field = document.getElementById(fieldId);
    if (field) {
      if (field.type === "checkbox") {
        var label = field.closest(".checkbox");
        if (label) label.classList.remove("is-invalid");
      } else {
        field.classList.remove("is-invalid");
      }
    }
  }

  function clearAllErrors() {
    $all("[data-error-for]").forEach(function (element) {
      element.hidden = true;
      element.textContent = "";
    });
    $all("#bookingForm .is-invalid").forEach(function (element) {
      element.classList.remove("is-invalid");
    });
  }

  function maskPhone(value) {
    var digits = onlyDigits(value).slice(0, 11);
    if (!digits) return "";
    if (digits.length <= 2) return "(" + digits;
    if (digits.length <= 6) return "(" + digits.slice(0, 2) + ") " + digits.slice(2);
    if (digits.length <= 10) {
      return "(" + digits.slice(0, 2) + ") " + digits.slice(2, 6) + "-" + digits.slice(6);
    }
    return "(" + digits.slice(0, 2) + ") " + digits.slice(2, 7) + "-" + digits.slice(7);
  }

  function makeProtocol() {
    var now = new Date();
    var base =
      String(now.getFullYear()).slice(2) +
      String(now.getMonth() + 1).padStart(2, "0") +
      String(now.getDate()).padStart(2, "0");
    var appointments = SiteStore.loadAppointments();
    var protocol = "";
    do {
      protocol = "AG-" + base + "-" + Math.floor(1000 + Math.random() * 9000);
    } while (
      appointments.some(function (appointment) {
        return appointment.protocol === protocol;
      })
    );
    return protocol;
  }

  function validateBooking() {
    clearAllErrors();
    var name = $("#bookingName").value.trim();
    var email = $("#bookingEmail").value.trim();
    var phone = $("#bookingPhoneInput").value.trim();
    var areaSelect = $("#bookingArea");
    var dateInput = $("#bookingDate");
    var consent = $("#bookingConsent");
    var valid = true;
    var firstInvalid = null;

    function fail(fieldId, message, inputId) {
      showError(fieldId, message);
      valid = false;
      if (!firstInvalid) firstInvalid = document.getElementById(inputId || fieldId);
    }

    if (name.length < 3) {
      fail("bookingName", "Informe seu nome completo.");
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      fail("bookingEmail", "Informe um e-mail válido.");
    }

    var phoneDigits = onlyDigits(phone);
    if (phoneDigits.length < 10 || phoneDigits.length > 13) {
      fail("bookingPhoneInput", "Informe um telefone com DDD.");
    }

    if (!areaSelect.value) {
      fail("bookingArea", "Selecione a área de interesse.");
    }

    var dateValue = dateInput.value;
    if (!dateValue) {
      fail("bookingDate", "Escolha uma data para o atendimento.");
    } else {
      var selectedDate = parseISODate(dateValue);
      var today = new Date();
      today.setHours(0, 0, 0, 0);
      var settings = getBookingSettings();
      var maxDate = new Date(today);
      maxDate.setDate(maxDate.getDate() + settings.maxAdvanceDays);

      if (
        isNaN(selectedDate.getTime()) ||
        selectedDate < today ||
        selectedDate > maxDate
      ) {
        fail("bookingDate", "Escolha uma data dentro do período disponível.");
      } else if (settings.days.indexOf(selectedDate.getDay()) === -1) {
        fail("bookingDate", "Não há atendimento nesta data. Escolha outro dia.");
      }
    }

    if (!selectedSlot) {
      fail("bookingSlots", "Selecione um horário disponível.");
    }

    if (!consent.checked) {
      fail("bookingConsent", "É necessário autorizar o contato para concluir o agendamento.");
    }

    if (!valid && firstInvalid) {
      var focusTarget = firstInvalid.type === "hidden" ? dateInput : firstInvalid;
      if (focusTarget && focusTarget.focus) focusTarget.focus();
      showToast("Revise os campos destacados para continuar.", "error");
    }

    return valid;
  }

  function showBookingSuccess(appointment) {
    var formWrap = $("#bookingFormWrap");
    var success = $("#bookingSuccess");
    if (!formWrap || !success) return;

    setText("successProtocol", appointment.protocol);
    setText("successDate", formatDateLong(appointment.date));
    setText("successTime", appointment.time);
    setText("successMode", appointment.mode);
    setText("successMessage", data.booking.successMessage);

    var successWhats = $("#successWhatsapp");
    if (successWhats) {
      var message =
        "Olá! Acabei de solicitar um agendamento pelo site.\nProtocolo: " +
        appointment.protocol +
        "\nData: " +
        formatDateLong(appointment.date) +
        " às " +
        appointment.time +
        "\nÁrea: " +
        appointment.area;
      var href = whatsappHref(data.contact.whatsapp, message);
      if (href) {
        successWhats.setAttribute("href", href);
        successWhats.hidden = false;
      } else {
        successWhats.hidden = true;
      }
    }

    formWrap.hidden = true;
    success.hidden = false;
    success.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function resetBookingForm() {
    var form = $("#bookingForm");
    var success = $("#bookingSuccess");
    var formWrap = $("#bookingFormWrap");
    if (!form) return;

    form.reset();
    selectedSlot = "";
    var hiddenSlot = $("#bookingSlot");
    if (hiddenSlot) hiddenSlot.value = "";
    clearAllErrors();
    renderSlots();

    if (success) success.hidden = true;
    if (formWrap) formWrap.hidden = false;
    setupDateLimits();

    var card = $(".booking__card");
    if (card) card.scrollIntoView({ behavior: "smooth", block: "center" });
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

  function icsEscape(value) {
    return String(value == null ? "" : value)
      .replace(/\\/g, "\\\\")
      .replace(/;/g, "\\;")
      .replace(/,/g, "\\,")
      .replace(/\r?\n/g, "\\n");
  }

  function downloadIcs(appointment) {
    if (!appointment) return;
    var settings = getBookingSettings();
    var start =
      appointment.date.replace(/-/g, "") + "T" + appointment.time.replace(":", "") + "00";
    var endTime = minutesToTime(timeToMinutes(appointment.time) + settings.interval);
    var end =
      appointment.date.replace(/-/g, "") + "T" + endTime.replace(":", "") + "00";
    var stamp =
      new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    var location =
      appointment.mode === "Online" ? "Atendimento online" : data.contact.address;
    var description =
      "Protocolo: " +
      appointment.protocol +
      "\nÁrea: " +
      appointment.area +
      "\nFormato: " +
      appointment.mode +
      "\n\n" +
      data.booking.successMessage;

    var lines = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Schesman Advocacia//Agendamento//PT-BR",
      "CALSCALE:GREGORIAN",
      "BEGIN:VEVENT",
      "UID:" + appointment.id + "@agendamento",
      "DTSTAMP:" + stamp,
      "DTSTART:" + start,
      "DTEND:" + end,
      "SUMMARY:" + icsEscape("Consulta jurídica — " + data.brand.name),
      "DESCRIPTION:" + icsEscape(description),
      "LOCATION:" + icsEscape(location),
      "STATUS:TENTATIVE",
      "END:VEVENT",
      "END:VCALENDAR"
    ];

    downloadBlob(
      new Blob([lines.join("\r\n")], { type: "text/calendar;charset=utf-8" }),
      "agendamento-" + appointment.protocol + ".ics"
    );
    showToast("Arquivo de agenda gerado. Abra-o para adicionar ao seu calendário.");
  }

  function setupBooking() {
    var form = $("#bookingForm");
    if (!form) return;

    if (!data.booking.enabled) {
      var formWrap = $("#bookingFormWrap");
      if (formWrap) {
        var whatsapp = whatsappHref(
          data.contact.whatsapp,
          "Olá! Vim pelo site e gostaria de agendar uma consulta."
        );
        formWrap.innerHTML =
          '<div class="booking-success">' +
          '<span class="booking-success__icon">' +
          iconSvg("calendar") +
          "</span>" +
          '<span class="eyebrow">Agendamento</span>' +
          "<h3>Agendamento online indisponível</h3>" +
          "<p>No momento, o agendamento pelo site está desativado. Fale com a nossa equipe pelo WhatsApp ou telefone para marcar sua consulta.</p>" +
          '<div class="booking-success__actions">' +
          (whatsapp
            ? '<a class="btn btn--primary" href="' +
              whatsapp +
              '" target="_blank" rel="noopener">Falar no WhatsApp</a>'
            : "") +
          '<a class="btn btn--outline" href="tel:' +
          onlyDigits(data.contact.phone) +
          '">Ligar agora</a>' +
          "</div></div>";
      }
      return;
    }

    setupDateLimits();
    renderSlots();

    var dateInput = $("#bookingDate");
    var slotsContainer = $("#bookingSlots");
    var phoneInput = $("#bookingPhoneInput");

    dateInput.addEventListener("change", function () {
      clearError("bookingDate");
      renderSlots();
    });

    slotsContainer.addEventListener("click", function (event) {
      var button = event.target.closest(".slot");
      if (!button || button.disabled) return;
      $all(".slot", slotsContainer).forEach(function (slot) {
        slot.classList.remove("is-selected");
      });
      button.classList.add("is-selected");
      selectedSlot = button.getAttribute("data-time");
      var hiddenSlot = $("#bookingSlot");
      if (hiddenSlot) hiddenSlot.value = selectedSlot;
      clearError("bookingSlots");
    });

    phoneInput.addEventListener("input", function () {
      phoneInput.value = maskPhone(phoneInput.value);
      clearError("bookingPhoneInput");
    });

    [
      ["bookingName", "bookingName"],
      ["bookingEmail", "bookingEmail"],
      ["bookingArea", "bookingArea"],
      ["bookingDate", "bookingDate"]
    ].forEach(function (pair) {
      var element = document.getElementById(pair[0]);
      if (element) {
        element.addEventListener("input", function () {
          clearError(pair[1]);
        });
      }
    });

    var consent = $("#bookingConsent");
    if (consent) {
      consent.addEventListener("change", function () {
        clearError("bookingConsent");
      });
    }

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      if (!validateBooking()) return;

      var areaSelect = $("#bookingArea");
      var areaLabel =
        areaSelect.options[areaSelect.selectedIndex] &&
        areaSelect.options[areaSelect.selectedIndex].text;

      var dateValue = $("#bookingDate").value;

      if (getBookedTimes(dateValue).indexOf(selectedSlot) !== -1) {
        showError("bookingSlots", "Este horário acabou de ser ocupado. Escolha outro.");
        renderSlots();
        showToast("Este horário não está mais disponível.", "error");
        return;
      }

      var appointment = {
        id: "ag_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8),
        protocol: makeProtocol(),
        name: $("#bookingName").value.trim(),
        email: $("#bookingEmail").value.trim(),
        phone: $("#bookingPhoneInput").value.trim(),
        area: areaLabel || "",
        areaId: areaSelect.value,
        mode: (form.querySelector('input[name="mode"]:checked') || {}).value || "Presencial",
        date: dateValue,
        time: selectedSlot,
        notes: $("#bookingNotes").value.trim(),
        status: "pendente",
        createdAt: new Date().toISOString()
      };

      var appointments = SiteStore.loadAppointments();
      appointments.push(appointment);
      SiteStore.saveAppointments(appointments);
      lastAppointment = appointment;

      showBookingSuccess(appointment);
      showToast("Solicitação de agendamento enviada com sucesso.");
    });

    var newBookingBtn = $("#newBookingBtn");
    if (newBookingBtn) {
      newBookingBtn.addEventListener("click", resetBookingForm);
    }

    var icsBtn = $("#icsBtn");
    if (icsBtn) {
      icsBtn.addEventListener("click", function () {
        downloadIcs(lastAppointment);
      });
    }
  }

  function setupAreaLinks() {
    var grid = $("#areasGrid");
    if (!grid) return;
    grid.addEventListener("click", function (event) {
      var link = event.target.closest("[data-area]");
      if (!link) return;
      var areaId = link.getAttribute("data-area");
      var select = $("#bookingArea");
      if (select && areaId) {
        var exists = Array.prototype.some.call(select.options, function (option) {
          return option.value === areaId;
        });
        if (exists) select.value = areaId;
      }
    });
  }

  /* Inicialização */
  injectIcons();
  applyTheme();
  renderContent();
  injectIcons();
  setupNavigation();
  setupReveal();
  setupBooking();
  setupAreaLinks();
})();
