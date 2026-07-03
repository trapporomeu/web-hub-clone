// Oculta preloader em caso de qualquer erro de JS (evita travamento infinito)
window.addEventListener("error", function (e) {
  if (e.message && e.message.includes("Turnstile")) return;
  console.error("Erro detectado:", e);
  const preloader = document.getElementById("preloader");
  if (preloader) {
    preloader.style.opacity = "0";
    setTimeout(() => preloader.style.display = "none", 500);
  }
});

if (typeof gsap !== "undefined") {
  if (typeof ScrollTrigger !== "undefined") gsap.registerPlugin(ScrollTrigger);
  if (typeof ScrollSmoother !== "undefined") gsap.registerPlugin(ScrollSmoother);
  if (typeof SplitText !== "undefined") gsap.registerPlugin(SplitText);
}

ScrollTrigger.normalizeScroll(true);

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
//  RELOAD EM RESIZE SIGNIFICATIVO
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Recarrega a pÃ¡gina se a LARGURA mudar mais de 200px desde o load.
// Ignora mudanÃ§as sÃ³ de altura (barra de endereÃ§o do mobile sobe/desce).
(function setupResizeReload() {
  const LIMITE_PX = 200;
  let larguraInicial = window.innerWidth;
  let debounceTimer = null;

  window.addEventListener("resize", () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      const delta = Math.abs(window.innerWidth - larguraInicial);
      if (delta >= LIMITE_PX) {
        window.location.reload();
      }
    }, 250);
  });
})();

let smoother;
if (typeof ScrollSmoother !== "undefined") {
  smoother = ScrollSmoother.create({
    smooth: 2,
    smoothTouch: 0.2,
  });
  smoother.paused(true);
}

// ---------------//
//   PRELOADER    //
// ---------------//
(function () {
  const preloader = document.getElementById("preloader");
  if (!preloader) return;

  const preloaderBg = preloader.querySelector(".preloader-bg");
  const preloaderLogo = preloader.querySelector(".preloader-logo");
  const preloaderFill = preloader.querySelector(".preloader-logo-fill");
  const preloaderPercent = preloader.querySelector(".preloader-percent");
  const headerLogo = document.querySelector(".logoHeader");

  // Garante scroll travado e no topo
  if (smoother) smoother.scrollTo(0);
  window.scrollTo(0, 0);

  // Coleta as imagens reais da hero para preload
  const heroImages = document.querySelectorAll(".hero img");
  const totalSteps = heroImages.length + 1; // +1 para fontes
  let loadedSteps = 0;
  let assetsReady = false;
  let windowLoaded = false;

  const progressObj = { val: 0 };
  let progressTween;

  function setProgress(target) {
    if (typeof gsap === "undefined") {
      preloaderPercent.textContent = Math.round(target) + "%";
      preloaderFill.style.clipPath = `inset(${100 - target}% 0 0 0)`;
      return;
    }
    if (progressTween) progressTween.kill();
    progressTween = gsap.to(progressObj, {
      val: target,
      duration: 0.4,
      ease: "power2.out",
      onUpdate: () => {
        const v = progressObj.val;
        preloaderPercent.textContent = Math.round(v) + "%";
        preloaderFill.style.clipPath = `inset(${100 - v}% 0 0 0)`;
      },
    });
  }

  function stepLoaded() {
    loadedSteps++;
    setProgress((loadedSteps / totalSteps) * 100);
    if (loadedSteps >= totalSteps) {
      assetsReady = true;
      maybeFinish();
    }
  }

  function maybeFinish() {
    if (assetsReady && windowLoaded) {
      if (typeof gsap === "undefined") {
        finish();
      } else {
        gsap.delayedCall(0.35, finish);
      }
    }
  }

  // Fontes
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(stepLoaded);
  } else {
    stepLoaded();
  }

  // Imagens da hero
  heroImages.forEach((img) => {
    if (img.complete) {
      stepLoaded();
    } else {
      img.addEventListener("load", stepLoaded, { once: true });
      img.addEventListener("error", stepLoaded, { once: true });
    }
  });

  // Espera o window.load para garantir que todas as animações GSAP
  // do load handler já estejam montadas antes de revelar a página
  if (document.readyState === "complete") {
    windowLoaded = true;
    maybeFinish();
  } else {
    window.addEventListener("load", () => {
      windowLoaded = true;
      maybeFinish();
    });
  }

  function finish() {
    if (!headerLogo || typeof gsap === "undefined") {
      preloader.style.opacity = 0;
      setTimeout(cleanup, 500);
      return;
    }

    const headerRect = headerLogo.getBoundingClientRect();
    const logoRect = preloaderLogo.getBoundingClientRect();

    const deltaX =
      headerRect.left + headerRect.width / 2 -
      (logoRect.left + logoRect.width / 2);
    const deltaY =
      headerRect.top + headerRect.height / 2 -
      (logoRect.top + logoRect.height / 2);
    const scaleX = headerRect.width / logoRect.width;
    const scaleY = headerRect.height / logoRect.height;

    // Limpa o bg do #preloader (inline style do <head>) para que a
    // div .preloader-bg, ao deslizar para cima, realmente revele a pÃ¡gina
    preloader.style.background = "transparent";

    // GSAP assume o controle do transform da logo
    gsap.set(preloaderLogo, { xPercent: -50, yPercent: -50, x: 0, y: 0 });
    gsap.set(preloaderBg, { y: 0, force3D: true });

    const tl = gsap.timeline({ onComplete: cleanup });

    tl.to(preloaderPercent, {
      opacity: 0,
      y: 10,
      duration: 0.35,
      ease: "power2.out",
    });

    tl.to(
      preloaderBg,
      {
        y: () => -window.innerHeight,
        duration: 1.1,
        ease: "power3.inOut",
      },
      0.4,
    );

    tl.to(
      preloaderLogo,
      {
        x: deltaX,
        y: deltaY,
        scaleX: scaleX,
        scaleY: scaleY,
        transformOrigin: "center center",
        duration: 1.1,
        ease: "power3.inOut",
      },
      0.15,
    );

    tl.to(
      headerLogo,
      {
        opacity: 1,
        duration: 0.3,
        ease: "power2.out",
      },
      "-=0.25",
    );

    tl.to(
      preloaderLogo,
      {
        opacity: 0,
        duration: 1,
        
      },
      "<",
    );
  }

  function cleanup() {
    preloader.style.display = "none";
    if (smoother) smoother.paused(false);
    // ScrollTrigger.refresh();
  }
})();

// ---------------//
//     VÃDEOS     //
// ---------------//
window.addEventListener("load", () => {
  function carregarVideo(videoId, overlayId, btnId) {
    const video = document.getElementById(videoId);
    const overlay = document.getElementById(overlayId);
    const playBtn = document.getElementById(btnId);
    const src = video.getAttribute("data-src");

    if (src) {
      const source = document.createElement("source");
      source.src = src;
      source.type = "video/mp4";
      video.appendChild(source);
      video.load();

      // BotÃ£o de play personalizado
      playBtn.addEventListener("click", () => {
        video.pause();
        video.currentTime = 0;
        video.muted = false;
        video.play();

        overlay.style.opacity = "0";
        setTimeout(() => {
          overlay.style.display = "none";
        }, 300);
      });
    }
  }

  // Carregar ambos os vÃ­deos depois do carregamento da pÃ¡gina
  carregarVideo("video", "videoOverlay", "playBtn");
  carregarVideo("videoVertical", "videoOverlayVertical", "playBtnVertical");
});

window.addEventListener("load", () => {
  // ---------------//
  //  MENU LATERAL  //
  // ---------------//
  const btn = document.getElementById("menuBtn");
  const lateral = document.getElementById("menuLateral");
  const overlay = document.getElementById("menuOverlay");

  function toggleMenu() {
    const aberto = btn.classList.toggle("aberto");
    lateral.classList.toggle("aberto");
    overlay.classList.toggle("aberto");
    document.body.style.overflow = aberto ? "hidden" : "";
  }

  btn.addEventListener("click", toggleMenu);
  overlay.addEventListener("click", toggleMenu);

  // ---------------//
  // HERO TRANSICAO //
  // ---------------//
  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: ".hero",
      pin: true,
      scrub: 2,
      start: "top top",
      end: "+=1000",
      invalidateOnRefresh: true,
      anticipatePin: 1,
    },
  });

  tl.to(".divDegrade2", {
    opacity: 1,
    duration: 1,
  });

  tl.to(
    ".divDegrade",
    {
      opacity: 0,
      duration: 1,
    },
    "<",
  );

  tl.to(
    ".hero .conteudo",
    {
      opacity: 0,
      duration: 1,
    },
    "-=.6",
  );

  tl.to(
    ".divDegrade2",
    {
      opacity: 0,
      duration: 0.2,
    },
    "-=.4",
  );

  tl.to(
    ".tela",
    {
      opacity: 1,
      duration: 0.4,
    },
    "<",
  );

  tl.to(
    ".tela",
    {
      rotateX: 0,
      scaleX: 1,
      top: 0,
      duration: 2,
    },
    "-=.3",
  );

  tl.to(
    ".tela",
    {
      borderRadius: "0px",
      duration: 1,
    },
    "<",
  );
  tl.to(
    ".sobreposicaoTela",
    {
      opacity: 0,
      duration: 1,
    },
    "-=1.5",
  );
  tl.to(".tela", {
    duration: 0.4,
  });

  // -----------------//
  // TITULOS ANIMADOS //
  // -----------------//
  const textosAnimados = document.querySelectorAll(".tituloAnimado");
  textosAnimados.forEach((texto) => {
    const split = new SplitText(texto, { types: "lines, words, chars" });

    // Cria animaÃ§Ã£o com ScrollTrigger
    gsap.from(split.chars, {
      filter: "blur(8px)",
      opacity: 0,
      duration: 0.3,
      stagger: {
        each: 0.02,
        from: "random",
      },
      scrollTrigger: {
        trigger: texto,
        start: "top 80%",
        toggleActions: "play none restart none",
      },
    });
  });

  // -----------------//
  //  CARDS SOZINHO   //
  // -----------------//
  gsap.from(".secao3 .cardBordaInterna", {
    filter: "blur(8px)",
    opacity: 0,
    duration: 0.5,
    stagger: 0.3,
    scrollTrigger: {
      trigger: ".secao3 .cardBordaInterna",
      start: "top 80%",
    },
  });
  const icones = document.querySelectorAll(".cardBordaInterna .icone img");
  icones.forEach((icone) => {
    gsap.from(icone, {
      rotate: 200,
      duration: 0.5,
      scrollTrigger: {
        trigger: icone,
        scrub: 3,
      },
    });
  });

  // ---------------//
  //    MÃ“DULOS     //
  // ---------------//
  const mmModulos = gsap.matchMedia();

  mmModulos.add("(min-width: 1000px)", () => {
    const tlModulos = gsap.timeline({
      scrollTrigger: {
        trigger: ".secao5",
        pin: true,
        scrub: 3,
        end: "+=3000",
      },
    });
    tlModulos.to(".slideSuperior .modulos", {
      x: "-59.6%",
      duration: 0.3,
    });
    tlModulos.to(
      ".slideInferior .modulos",
      {
        x: "55.5%",
        duration: 0.3,
      },
      "<",
    );
  });

  mmModulos.add("(max-width: 999px)", () => {
    const superiorEl = document.querySelector(".slideSuperior .modulos");
    const inferiorEl = document.querySelector(".slideInferior .modulos");
    const containerWidth = document.querySelector(".secao5").clientWidth;

    const moveSuper = -(superiorEl.scrollWidth - containerWidth);
    const moveInfer = inferiorEl.scrollWidth - containerWidth;

    const tlModulos = gsap.timeline({
      scrollTrigger: {
        trigger: ".secao5",
        pin: true,
        scrub: 3,
        end: "+=3000",
      },
    });
    tlModulos.to(superiorEl, {
      x: moveSuper,
      duration: 0.3,
    });
    tlModulos.to(
      inferiorEl,
      {
        x: moveInfer,
        duration: 0.3,
      },
      "<",
    );
  });

  const tlModulos2 = gsap.timeline({
    scrollTrigger: {
      trigger: ".secao5",
      scrub: 3,
      start: "top 70%",
      end: "+=3000 top",
    },
  });

  tlModulos2.to(".slideSuperior .divImg", {
    height: "100%",
    stagger: 0.1,
    duration: 0.5,
  });

  tlModulos2.to(
    ".slideInferior .divImg",
    {
      height: "100%",
      stagger: {
        each: 0.1,
        from: "end",
      },
      duration: 0.9,
    },
    "<",
  );

  // Selecionar todos os h2 dentro de .div3d
  const titulosModulos = document.querySelectorAll(".titulos h2");

  // Criar array com SplitText de cada h2
  const splits = Array.from(titulosModulos).map(
    (titulo) => new SplitText(titulo, { type: "chars" }),
  );

  // Criar timeline
  const tlTitulosModulos = gsap.timeline({
    scrollTrigger: {
      trigger: ".secao5",
      scrub: 3,
      end: "+=3000",
      start: "top top",
    },
  });

  // Loop atravÃ©s de cada split
  splits.forEach((split) => {
    // Aparecer
    tlTitulosModulos.from(split.chars, {
      opacity: 0,
      filter: `blur(8px)`,
      duration: 2,
      stagger: { each: 0.8, from: "random" },
    });

    // Pausa
    tlTitulosModulos.to({}, { duration: 4 });

    // Desaparecer
    tlTitulosModulos.to(split.chars, {
      opacity: 0,
      filter: `blur(8px)`,
      duration: 2,
      stagger: { each: 0.3, from: "random" },
    });
  });

  // ---------------//
  //   DEPOIMENTOS  //
  // ---------------//
  const mmDepoimentos = gsap.matchMedia();
  mmDepoimentos.add("(min-width: 1023px)", () => {
    ScrollTrigger.create({
      trigger: ".secao7",
      start: "top top",
      end: "bottom 94%",
      pin: ".secao7 .video",
      pinSpacing: false,
    });
  });

  // let duracao = window.innerWidth > 767 ? 2 : 0.5;
  // let intervalo = window.innerWidth > 767 ? "-=1.6" : "-=2.6";

  if (window.innerWidth > 1023) {
    const tl3 = gsap.timeline({
      scrollTrigger: {
        trigger: ".depoimentos",
        scrub: 2,
        start: "top 100%",
        end: "bottom 0%",
      },
    });

    tl3.from(".depoimento", {
      opacity: 0,
      filter: "blur(8px)",
      duration: 1,
      stagger: 0.5,
    });

    tl3.to(
      ".depoimento",
      {
        opacity: 0,
        filter: "blur(8px)",
        duration: 1,
        stagger: 0.5,
      },
      "-=1.0",
    );
  } else {
    const depoimentos = document.querySelectorAll(".depoimento");
    depoimentos.forEach((depoimento) => {
      const tl4 = gsap.timeline({
        scrollTrigger: {
          trigger: depoimento,
          scrub: 2,
          start: "top 100%",
          end: "bottom 0%",
          // markers: true
        },
      });

      tl4.from(depoimento, {
        opacity: 0,
        duration: 1,
        filter: "blur(8px)",
      });

      tl4.to(depoimento, {
        opacity: 0,
        duration: 1,
        filter: "blur(8px)",
      }, "+=1");
    });
  }

  // ---------------//
  //   TRANSICAO    //
  // ---------------//

  const fundadorMaskP = window.innerWidth > 767 ? "50.9% 80%" : "50.9% 14%";

  const fundadorMaskS = window.innerWidth > 767 ? "16vw" : "170px";

  const tl4 = gsap.timeline({
    scrollTrigger: {
      trigger: ".transicao",
      pin: true,
      scrub: 2,
      start: "top top",
      end: "+=700",
    },
  });

  tl4.to(".secao8", {
    maskSize: fundadorMaskS,
    duration: 2,
  });
  tl4.to(
    ".secao8 .sobreposicao",
    {
      opacity: 1,
      duration: 0.5,
    },
    "-=1.1",
  );
  tl4.to(
    ".secao8",
    {
      maskPosition: fundadorMaskP,

      duration: 1,
    },
    "-=1",
  );

  tl4.to(".secao8 .sobreposicao", {
    opacity: 0.9,
    duration: 0.3,
  });

  // ---------------//
  //LETREIROS SEC 8 //
  // ---------------//

  gsap.to(".letreiroEsq", {
    x: "-30%",
    scrollTrigger: {
      trigger: ".secao8",

      scrub: 3,
      start: "top bottom",
      end: "bottom top",
    },
  });

  gsap.from(".letreiroDir", {
    x: "-20%",
    scrollTrigger: {
      trigger: ".secao8",

      scrub: 3,
      start: "top bottom",
      end: "bottom top",
    },
  });

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  //        MODAL FORMULÃRIO
  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  const paises = [
    { nome: "Brasil", code: "+55", iso: "BR" },
    { nome: "Estados Unidos", code: "+1", iso: "US" },
    { nome: "Portugal", code: "+351", iso: "PT" },
    { nome: "Argentina", code: "+54", iso: "AR" },
    { nome: "MÃ©xico", code: "+52", iso: "MX" },
    { nome: "ColÃ´mbia", code: "+57", iso: "CO" },
    { nome: "Chile", code: "+56", iso: "CL" },
    { nome: "Peru", code: "+51", iso: "PE" },
    { nome: "Uruguai", code: "+598", iso: "UY" },
    { nome: "Paraguai", code: "+595", iso: "PY" },
    { nome: "BolÃ­via", code: "+591", iso: "BO" },
    { nome: "Venezuela", code: "+58", iso: "VE" },
    { nome: "Equador", code: "+593", iso: "EC" },
    { nome: "Reino Unido", code: "+44", iso: "GB" },
    { nome: "Alemanha", code: "+49", iso: "DE" },
    { nome: "FranÃ§a", code: "+33", iso: "FR" },
    { nome: "Espanha", code: "+34", iso: "ES" },
    { nome: "ItÃ¡lia", code: "+39", iso: "IT" },
    { nome: "CanadÃ¡", code: "+1", iso: "CA" },
    { nome: "AustrÃ¡lia", code: "+61", iso: "AU" },
    { nome: "JapÃ£o", code: "+81", iso: "JP" },
    { nome: "China", code: "+86", iso: "CN" },
    { nome: "Ãndia", code: "+91", iso: "IN" },
    { nome: "PaÃ­ses Baixos", code: "+31", iso: "NL" },
    { nome: "SuÃ­Ã§a", code: "+41", iso: "CH" },
    { nome: "SuÃ©cia", code: "+46", iso: "SE" },
    { nome: "Noruega", code: "+47", iso: "NO" },
    { nome: "Dinamarca", code: "+45", iso: "DK" },
    { nome: "RÃºssia", code: "+7", iso: "RU" },
    { nome: "Coreia do Sul", code: "+82", iso: "KR" },
    { nome: "Angola", code: "+244", iso: "AO" },
    { nome: "MoÃ§ambique", code: "+258", iso: "MZ" },
    { nome: "Cabo Verde", code: "+238", iso: "CV" },
    { nome: "Ãfrica do Sul", code: "+27", iso: "ZA" },
    { nome: "BÃ©lgica", code: "+32", iso: "BE" },
    { nome: "Ãustria", code: "+43", iso: "AT" },
    { nome: "PolÃ´nia", code: "+48", iso: "PL" },
    { nome: "Rep. Tcheca", code: "+420", iso: "CZ" },
    { nome: "Hungria", code: "+36", iso: "HU" },
    { nome: "Turquia", code: "+90", iso: "TR" },
    { nome: "Israel", code: "+972", iso: "IL" },
    { nome: "ArÃ¡bia Saudita", code: "+966", iso: "SA" },
    { nome: "Emirados Ãrabes", code: "+971", iso: "AE" },
    { nome: "Singapura", code: "+65", iso: "SG" },
    { nome: "TailÃ¢ndia", code: "+66", iso: "TH" },
    { nome: "IndonÃ©sia", code: "+62", iso: "ID" },
    { nome: "Filipinas", code: "+63", iso: "PH" },
    { nome: "MalÃ¡sia", code: "+60", iso: "MY" },
    { nome: "Nova ZelÃ¢ndia", code: "+64", iso: "NZ" },
    { nome: "Irlanda", code: "+353", iso: "IE" },
    { nome: "GrÃ©cia", code: "+30", iso: "GR" },
    { nome: "RomÃªnia", code: "+40", iso: "RO" },
    { nome: "FinlÃ¢ndia", code: "+358", iso: "FI" },
    { nome: "UcrÃ¢nia", code: "+380", iso: "UA" },
    { nome: "Marrocos", code: "+212", iso: "MA" },
    { nome: "NigÃ©ria", code: "+234", iso: "NG" },
    { nome: "Egito", code: "+20", iso: "EG" },
    { nome: "PanamÃ¡", code: "+507", iso: "PA" },
    { nome: "Costa Rica", code: "+506", iso: "CR" },
    { nome: "Rep. Dominicana", code: "+1", iso: "DO" },
    { nome: "Cuba", code: "+53", iso: "CU" },
    { nome: "Guatemala", code: "+502", iso: "GT" },
  ];

  const modalOverlay = document.getElementById("modalOverlay");
  const modalContainer = document.getElementById("modalContainer");
  const modalFechar = document.getElementById("modalFechar");
  const countrySelector = document.getElementById("countrySelector");
  const countryDropdown = document.getElementById("countryDropdown");
  const countrySearchInput = document.getElementById("countrySearchInput");
  const countryList = document.getElementById("countryList");
  const selectedFlag = document.getElementById("selectedFlag");
  const selectedDialCode = document.getElementById("selectedDialCode");
  const codigoPaisInput = document.getElementById("codigoPais");
  const cadastroForm = document.getElementById("cadastroForm");
  const submitBtn = document.getElementById("submitBtn");

  let paisSelecionado = paises[0];

  // â”€â”€ Render list â”€â”€
  function renderPaises(lista) {
    if (!lista.length) {
      countryList.innerHTML =
        '<li class="country-vazio">Nenhum paÃ­s encontrado</li>';
      return;
    }
    countryList.innerHTML = "";
    lista.forEach((pais) => {
      const li = document.createElement("li");
      li.className =
        "country-item" +
        (pais.iso === paisSelecionado.iso ? " selecionado" : "");
      li.setAttribute("role", "option");
      li.innerHTML = `<img class="country-item-flag" src="https://flagcdn.com/w20/${pais.iso.toLowerCase()}.png" alt="${pais.nome}" width="22" height="16" /><span class="country-item-name">${pais.nome}</span><span class="country-item-code">${pais.code}</span>`;
      li.addEventListener("click", () => selecionarPais(pais));
      countryList.appendChild(li);
    });
  }

  function selecionarPais(pais) {
    paisSelecionado = pais;
    selectedFlag.src = `https://flagcdn.com/w20/${pais.iso.toLowerCase()}.png`;
    selectedFlag.alt = pais.nome;
    selectedDialCode.textContent = pais.code;
    codigoPaisInput.value = pais.code;
    fecharDropdown();
    atualizarMaskTelefone(pais.iso);
    document.getElementById("inputTelefone").focus();
  }

  function abrirDropdown() {
    countrySelector.classList.add("aberto");
    countryDropdown.classList.add("aberto");
    countrySearchInput.value = "";
    renderPaises(paises);
    setTimeout(() => countrySearchInput.focus(), 50);
  }

  function fecharDropdown() {
    countrySelector.classList.remove("aberto");
    countryDropdown.classList.remove("aberto");
  }

  countrySelector.addEventListener("click", (e) => {
    e.stopPropagation();
    countryDropdown.classList.contains("aberto")
      ? fecharDropdown()
      : abrirDropdown();
  });

  countrySelector.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      countryDropdown.classList.contains("aberto")
        ? fecharDropdown()
        : abrirDropdown();
    }
  });

  countrySearchInput.addEventListener("input", () => {
    const q = countrySearchInput.value.toLowerCase().trim();
    renderPaises(
      q
        ? paises.filter(
            (p) => p.nome.toLowerCase().includes(q) || p.code.includes(q),
          )
        : paises,
    );
  });

  document.addEventListener("click", (e) => {
    if (
      !countrySelector.contains(e.target) &&
      !countryDropdown.contains(e.target)
    ) {
      fecharDropdown();
    }
  });

  // â”€â”€ Phone mask (BR) â”€â”€
  function atualizarMaskTelefone(iso) {
    const input = document.getElementById("inputTelefone");
    if (iso === "BR") {
      input.placeholder = "(11) 99999-9999";
      input.maxLength = 15;
    } else if (iso === "US" || iso === "CA") {
      input.placeholder = "(555) 555-5555";
      input.maxLength = 14;
    } else {
      input.placeholder = "NÃºmero de telefone";
      input.maxLength = 20;
    }
    input.value = "";
  }

  document.getElementById("inputTelefone").addEventListener("input", (e) => {
    if (paisSelecionado.iso !== "BR") return;
    let val = e.target.value.replace(/\D/g, "");
    if (val.length > 11) val = val.slice(0, 11);
    if (val.length > 6) {
      val = `(${val.slice(0, 2)}) ${val.slice(2, 7)}-${val.slice(7)}`;
    } else if (val.length > 2) {
      val = `(${val.slice(0, 2)}) ${val.slice(2)}`;
    } else if (val.length > 0) {
      val = `(${val}`;
    }
    e.target.value = val;
  });

  // â”€â”€ Modal open / close â”€â”€
  function abrirModal() {
    modalOverlay.classList.add("ativo");
    gsap.fromTo(
      modalOverlay,
      { opacity: 0 },
      { opacity: 1, duration: 0.3, ease: "power2.out" },
    );
    gsap.fromTo(
      modalContainer,
      { opacity: 0, filter: "blur(10px)", scale: 0.95, y: 24 },
      {
        opacity: 1,
        filter: "blur(0px)",
        scale: 1,
        y: 0,
        duration: 0.4,
        ease: "power3.out",
        delay: 0.04,
      },
    );
    document.body.style.overflow = "hidden";
    setTimeout(() => document.getElementById("inputNome").focus(), 430);
  }

  function fecharModal() {
    fecharDropdown();
    gsap.to(modalContainer, {
      opacity: 0,
      filter: "blur(10px)",
      scale: 0.95,
      y: 16,
      duration: 0.22,
      ease: "power2.in",
    });
    gsap.to(modalOverlay, {
      opacity: 0,
      duration: 0.28,
      ease: "power2.in",
      onComplete: () => {
        modalOverlay.classList.remove("ativo");
        document.body.style.overflow = "";
        resetarFormulario();
      },
    });
  }

  document.querySelectorAll(".botaoForm").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      abrirModal();
    });
  });

  modalFechar.addEventListener("click", fecharModal);

  modalOverlay.addEventListener("click", (e) => {
    if (e.target === modalOverlay) fecharModal();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modalOverlay.classList.contains("ativo"))
      fecharModal();
  });

  // â”€â”€ Validation â”€â”€
  function sanitizar(str) {
    return str.replace(/[<>"'`]/g, "").trim();
  }

  function validarNome(v) {
    if (!v) return "Por favor, informe seu nome completo.";
    if (v.length < 3) return "O nome deve ter ao menos 3 caracteres.";
    if (!/^[a-zA-Z\u00C0-\u00FF\s'.-]+$/.test(v))
      return "O nome contém caracteres inválidos.";
    if (v.trim().split(/\s+/).length < 2)
      return "Por favor, informe nome e sobrenome.";
    return "";
  }

  function validarEmail(v) {
    if (!v) return "Por favor, informe seu e-mail.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v))
      return "Informe um e-mail vÃ¡lido.";
    return "";
  }

  function validarTelefone(v, iso) {
    const digits = v.replace(/\D/g, "");
    if (!digits) return "Por favor, informe seu telefone.";
    if (iso === "BR" && (digits.length < 10 || digits.length > 11))
      return "Informe um telefone vÃ¡lido com DDD. Ex: (11) 99999-9999";
    if (iso !== "BR" && digits.length < 6)
      return "Informe um nÃºmero de telefone vÃ¡lido.";
    return "";
  }

  function mostrarErro(inputId, erroId, msg) {
    const campo = document.getElementById(inputId);
    const erro = document.getElementById(erroId);
    if (msg) {
      campo.classList.add("erro");
      erro.textContent = msg;
      erro.classList.add("visivel");
      return false;
    }
    campo.classList.remove("erro");
    erro.textContent = "";
    erro.classList.remove("visivel");
    return true;
  }

  function resetarFormulario() {
    cadastroForm.reset();
    ["inputNome", "inputEmail", "inputTelefone"].forEach((id) =>
      document.getElementById(id).classList.remove("erro"),
    );
    ["erroNome", "erroEmail", "erroTelefone", "erroConsentimento"].forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.textContent = "";
      el.classList.remove("visivel");
    });
    selecionarPais(paises[0]);
    submitBtn.disabled = false;
    submitBtn.querySelector(".submit-text").textContent = "GARANTIR MINHA VAGA";

    // Reseta o widget Turnstile (se carregado)
    try {
      if (window.turnstile) {
        const widget = document.getElementById("turnstileWidget");
        if (widget) window.turnstile.reset(widget);
      }
    } catch {}
  }

  // ValidaÃ§Ã£o em tempo real (ao sair do campo)
  document.getElementById("inputNome").addEventListener("blur", () => {
    mostrarErro(
      "inputNome",
      "erroNome",
      validarNome(sanitizar(document.getElementById("inputNome").value)),
    );
  });
  document.getElementById("inputEmail").addEventListener("blur", () => {
    mostrarErro(
      "inputEmail",
      "erroEmail",
      validarEmail(sanitizar(document.getElementById("inputEmail").value)),
    );
  });
  document.getElementById("inputTelefone").addEventListener("blur", () => {
    mostrarErro(
      "inputTelefone",
      "erroTelefone",
      validarTelefone(
        document.getElementById("inputTelefone").value,
        paisSelecionado.iso,
      ),
    );
  });

  // â”€â”€ Submit â”€â”€
  cadastroForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const nome = sanitizar(document.getElementById("inputNome").value);
    const email = sanitizar(
      document.getElementById("inputEmail").value.toLowerCase(),
    );
    const telefone = document.getElementById("inputTelefone").value;

    const nomeOk = mostrarErro("inputNome", "erroNome", validarNome(nome));
    const emailOk = mostrarErro("inputEmail", "erroEmail", validarEmail(email));
    const telefoneOk = mostrarErro(
      "inputTelefone",
      "erroTelefone",
      validarTelefone(telefone, paisSelecionado.iso),
    );

    // Consentimento LGPD obrigatÃ³rio
    const consentEl = document.getElementById("inputConsentimento");
    const consentimento = !!(consentEl && consentEl.checked);
    const erroConsentEl = document.getElementById("erroConsentimento");
    if (!consentimento) {
      if (erroConsentEl) {
        erroConsentEl.textContent = "Ã‰ necessÃ¡rio aceitar a polÃ­tica de privacidade.";
        erroConsentEl.classList.add("visivel");
      }
    } else if (erroConsentEl) {
      erroConsentEl.textContent = "";
      erroConsentEl.classList.remove("visivel");
    }

    if (!nomeOk || !emailOk || !telefoneOk || !consentimento) {
      const primeiroErro = !nomeOk
        ? "grupoNome"
        : !emailOk
          ? "grupoEmail"
          : !telefoneOk
            ? "grupoTelefone"
            : null;
      if (primeiroErro) {
        document.getElementById(primeiroErro).classList.add("shake");
        setTimeout(
          () => document.getElementById(primeiroErro).classList.remove("shake"),
          500,
        );
      }
      return;
    }

    // Token do Cloudflare Turnstile (modo invisÃ­vel â†’ executa sob demanda)
    let cfToken = "";
    try {
      if (window.turnstile) {
        const widget = document.getElementById("turnstileWidget");
        cfToken = window.turnstile.getResponse(widget) || "";
        // Se ainda nÃ£o hÃ¡ token (modo invisible), executa o desafio agora
        if (!cfToken && widget) {
          cfToken = await new Promise((resolve) => {
            let resolvido = false;
            const finalizar = (valor) => {
              if (resolvido) return;
              resolvido = true;
              resolve(valor || "");
            };
            try {
              window.turnstile.execute(widget, {
                callback: (token) => finalizar(token),
                "error-callback": () => finalizar(""),
                "timeout-callback": () => finalizar(""),
              });
              // Fallback: se em 10s nÃ£o retornar, segue sem token
              setTimeout(() => finalizar(""), 10000);
            } catch {
              finalizar("");
            }
          });
        }
      }
    } catch {}

    submitBtn.disabled = true;
    submitBtn.querySelector(".submit-text").textContent = "ENVIANDO...";

    try {
      const payload = {
        nome,
        email,
        telefone,
        codigo_pais: paisSelecionado.code,
        pais_iso: paisSelecionado.iso,
        consentimento: true,
        cf_turnstile_token: cfToken,
        website: document.getElementById("campoWebsite")?.value || "",
      };

      const resp = await fetch("api/cadastro.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await resp.json().catch(() => ({}));

      if (!resp.ok || !data.ok) {
        // Erros de validaÃ§Ã£o vindos do servidor
        if (data.erros) {
          if (data.erros.nome) mostrarErro("inputNome", "erroNome", data.erros.nome);
          if (data.erros.email) mostrarErro("inputEmail", "erroEmail", data.erros.email);
          if (data.erros.telefone) mostrarErro("inputTelefone", "erroTelefone", data.erros.telefone);
          if (data.erros.consentimento && erroConsentEl) {
            erroConsentEl.textContent = data.erros.consentimento;
            erroConsentEl.classList.add("visivel");
          }
        } else if (data.erro) {
          mostrarErro("inputEmail", "erroEmail", data.erro);
        } else {
          mostrarErro("inputEmail", "erroEmail", "Erro ao enviar. Tente novamente.");
        }
        // Reseta Turnstile para tentar de novo
        try {
          if (window.turnstile) {
            const widget = document.getElementById("turnstileWidget");
            if (widget) window.turnstile.reset(widget);
          }
        } catch {}
        submitBtn.disabled = false;
        submitBtn.querySelector(".submit-text").textContent = "GARANTIR MINHA VAGA";
        return;
      }

      window.location.href =
        data.redirect || "https://gustavocampelo.com.br/comunidade-webhub-planos/";
    } catch {
      submitBtn.disabled = false;
      submitBtn.querySelector(".submit-text").textContent =
        "GARANTIR MINHA VAGA";
      mostrarErro("inputEmail", "erroEmail", "Falha de conexÃ£o. Tente novamente.");
    }
  });

  renderPaises(paises);

  // ---------------//
  //      FAQ       //
  // ---------------//
  const faqItems = document.querySelectorAll(".faq__item");
  faqItems.forEach((el) => {
    el.querySelector(".faq__summary").addEventListener("click", () => {
      const isOpen = el.classList.contains("faq__item--open");
      faqItems.forEach((other) => other.classList.remove("faq__item--open"));
      if (!isOpen) el.classList.add("faq__item--open");
      ScrollTrigger.refresh();
    });
  });

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  //   GLITCH BOTÃƒO "ACESSAR PLATAFORMA"
  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  (function setupGlitchBotao() {
    // SÃ³ roda em desktop com hover real (sem touch / mobile)
    const desktopMQ = window.matchMedia("(hover: hover) and (min-width: 1024px)");
    if (!desktopMQ.matches) return;

    const btn = document.querySelector(".secao5 .ui-btn");
    if (!btn) return;

    const span = btn.querySelector("span");
    if (!span) return;

    const textoOriginal = span.textContent;
    span.setAttribute("data-text", textoOriginal);

    // Trava a largura pra layout nÃ£o tremer enquanto os chars trocam
    requestAnimationFrame(() => {
      const w = span.getBoundingClientRect().width;
      if (w) span.style.minWidth = w + "px";
    });

    const glitchChars =
      "!<>-_\\/[]{}=+*^?#â–‘â–’â–“â–ˆâ–„â–Œâ–â–€ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@$&%";
    let glitchTimer = null;

    function scramble() {
      clearTimeout(glitchTimer);
      let progresso = 0;
      const total = textoOriginal.length;

      (function tick() {
        const novo = textoOriginal
          .split("")
          .map((c, i) => {
            if (c === " ") return " ";
            if (i < progresso) return textoOriginal[i];
            return glitchChars[Math.floor(Math.random() * glitchChars.length)];
          })
          .join("");

        span.textContent = novo;
        span.setAttribute("data-text", novo);

        progresso += 0.6;

        if (progresso < total) {
          glitchTimer = setTimeout(tick, 38);
        } else {
          span.textContent = textoOriginal;
          span.setAttribute("data-text", textoOriginal);
        }
      })();
    }

    btn.addEventListener("mouseenter", scramble);
    btn.addEventListener("focus", scramble);
    btn.addEventListener("mouseleave", () => {
      clearTimeout(glitchTimer);
      span.textContent = textoOriginal;
      span.setAttribute("data-text", textoOriginal);
    });
  })();

  // ---------------//
  // TEXTOS LONGOS  //
  // ---------------//
  const textosLonngos = document.querySelectorAll(".textoLongo");
  textosLonngos.forEach((texto) => {
    const split = new SplitText(texto, {
      types: "lines, words, chars",
      mask: "lines",
    });

    gsap.from(split.chars, {
      y: "100%",
      opacity: 0,

      duration: 0.3,
      stagger: 0.02,

      scrollTrigger: {
        trigger: texto,
        start: "top 90%",
        end: "bottom 50%",
        scrub: 3,
      },
    });
  });
});
