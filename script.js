
/* ========================================
   LOAD DOORS FIRST
======================================== */

(() => {

  const leftDoor = new Image();
  const rightDoor = new Image();

  leftDoor.src = "assets/left.png";
  rightDoor.src = "assets/right.png";

  Promise.all([
    leftDoor.decode(),
    rightDoor.decode()
  ])
    .then(() => {
      document.body.classList.add("doors-loaded");
    })
    .catch(() => {
      document.body.classList.add("doors-loaded");
    });

})();


document.addEventListener("DOMContentLoaded", () => {

  /* ========================================
     ELEMENTS
  ======================================== */

  const coverScreen = document.getElementById("cover-screen");
  const openButton = document.getElementById("open-invitation");
  const invitationScreen = document.getElementById("invitation-screen");
  const petalContainer = document.getElementById("petal-container");
  const weddingDetails = document.getElementById("wedding-details");

  const sections = [
    document.querySelector(".intro-section"),
    weddingDetails,
    document.getElementById("save-date"),
    document.getElementById("festivities"),
    document.getElementById("location"),
    document.getElementById("regards")
  ].filter(Boolean);


  if (!coverScreen || !openButton || !invitationScreen) {
    console.error("Wedding invitation elements are missing.");
    return;
  }


  /* ========================================
     ANIMATION TIMINGS
  ======================================== */

  const DOOR_OPEN_DURATION = 1650;
  const COVER_EXIT_DURATION = 1550;

  const LOTUS_DECORATION_DELAY = 600;
  const GANESHA_MOVE_DELAY = 450;
  const PETALS_START_DELAY = 150;
  const HEADING_AFTER_MOVE = 1550;

  let invitationStarted = false;


  /* ========================================
     SECTION SCROLL CONTROL
  ======================================== */

  let currentSection = 0;
  let isScrolling = false;
  let scrollingUnlocked = false;

  let scrollEndTimer = null;
  let wheelLocked = false;
  let touchLocked = false;
  let targetSection = null;

  const SCROLL_THRESHOLD = 25;
  const TOUCH_THRESHOLD = 45;
  const SCROLL_UNLOCK_DELAY = 300;
  const mobileViewport = window.matchMedia("(max-width: 767px), (hover: none) and (pointer: coarse)");
  let mobileController = null;


  /* ========================================
     GET SECTION POSITION
  ======================================== */

  function getSectionTop(section) {

    return Math.max(
      0,
      section.getBoundingClientRect().top + window.scrollY
    );

  }


  /* ========================================
     FIND CURRENT SECTION
  ======================================== */

  function getCurrentSection() {

    if (mobileViewport.matches && mobileController) return currentSection;

    const scrollPosition = window.scrollY;

    let closestIndex = 0;
    let closestDistance = Infinity;

    sections.forEach((section, index) => {

      const distance = Math.abs(
        getSectionTop(section) - scrollPosition
      );

      if (distance < closestDistance) {

        closestDistance = distance;
        closestIndex = index;

      }

    });

    return closestIndex;

  }


  /* ========================================
     FINISH SECTION SCROLL
  ======================================== */

  function finishSectionScroll() {

    if (!isScrolling) return;

    clearTimeout(scrollEndTimer);

    isScrolling = false;

    currentSection = getCurrentSection();

    targetSection = null;

    setTimeout(() => {

      wheelLocked = false;
      touchLocked = false;

    }, SCROLL_UNLOCK_DELAY);

  }


  /* ========================================
     NAVIGATE TO SECTION
  ======================================== */

  function goToSection(index) {

    if (index < 0 || index >= sections.length) return false;

    if (mobileViewport.matches) {
      return mobileController ? mobileController.navigateTo(index) : false;
    }

    if (isScrolling) return false;

    isScrolling = true;

    currentSection = index;
    targetSection = index;

    clearTimeout(scrollEndTimer);

    window.scrollTo({

      top: getSectionTop(sections[index]),
      behavior: "smooth"

    });

    // Fallback for browsers without reliable scrollend.
    scrollEndTimer = setTimeout(() => {

      finishSectionScroll();

    }, 1800);

    return true;

  }


  /* ========================================
     DETECT SCROLL COMPLETION
  ======================================== */

  window.addEventListener("scroll", () => {

    if (mobileViewport.matches) return;
    if (!scrollingUnlocked || !isScrolling) return;

    clearTimeout(scrollEndTimer);

    scrollEndTimer = setTimeout(() => {

      finishSectionScroll();

    }, 180);

  }, { passive: true });


  if ("onscrollend" in window) {

    window.addEventListener("scrollend", () => {

      if (mobileViewport.matches) return;
      finishSectionScroll();

    });

  }


  /* ========================================
     MOUSE WHEEL / TRACKPAD
     ONE GESTURE = ONE SECTION
  ======================================== */

  let wheelIdleTimer = null;

  window.addEventListener("wheel", (event) => {

    // Touch devices use the controlled touch gesture below; keep desktop wheel behavior unchanged.
    if (window.matchMedia("(max-width: 767px)").matches) return;

    if (!scrollingUnlocked) return;

    if (event.ctrlKey || event.metaKey) return;

    event.preventDefault();

    if (wheelLocked || isScrolling) return;

    if (Math.abs(event.deltaY) < SCROLL_THRESHOLD) return;

    wheelLocked = true;

    currentSection = getCurrentSection();

    const direction = event.deltaY > 0 ? 1 : -1;

    goToSection(currentSection + direction);

    clearTimeout(wheelIdleTimer);

    wheelIdleTimer = setTimeout(() => {

      wheelLocked = false;

    }, 850);

  }, { passive: false });


  /* ========================================
     MOBILE SECTION CONTROLLER
     One completed gesture animates one adjacent section.
  ======================================== */

  function setupMobileSectionController() {
    if (!mobileViewport.matches) return;

    const html = document.documentElement;
    const body = document.body;

    html.classList.add("mobile-section-navigation");
    body.classList.add("mobile-section-navigation");

    sections.forEach((section, index) => {
      section.classList.add("mobile-controlled-section");
      section.style.setProperty("--mobile-section-y", `${(index - currentSection) * 100}dvh`);
      section.style.zIndex = index === currentSection ? "2" : "1";
      section.classList.toggle("mobile-section-active", index === currentSection);
    });

    if (mobileController) return;

    let transitioning = false;
    let touchStart = null;
    let gestureAxis = null;
    let touchIdentifier = null;
    let activeTransitionCleanup = null;

    const finishTransition = (destination) => {
      if (!transitioning || destination !== currentSection) return;

      transitioning = false;
      isScrolling = false;
      sections.forEach((section, index) => {
        section.classList.toggle("mobile-section-active", index === currentSection);
        section.classList.remove("mobile-section-entering");
        section.style.zIndex = index === currentSection ? "2" : "1";
      });

      touchLocked = false;
    };

    const navigateTo = (destination) => {
      if (!scrollingUnlocked || transitioning) return false;
      if (destination < 0 || destination >= sections.length) return false;
      if (Math.abs(destination - currentSection) !== 1) return false;

      const previous = currentSection;
      const incoming = sections[destination];
      const outgoing = sections[previous];

      transitioning = true;
      isScrolling = true;
      touchLocked = true;
      targetSection = destination;
      currentSection = destination;

      incoming.style.zIndex = "3";
      outgoing.style.zIndex = "2";
      incoming.classList.add("mobile-section-entering");
      incoming.classList.remove("mobile-section-active");

      const onTransitionEnd = (event) => {
        if (event.target !== incoming || event.propertyName !== "transform") return;
        activeTransitionCleanup?.();
        targetSection = null;
        finishTransition(destination);
      };

      const onTransitionCancel = (event) => {
        if (event.target !== incoming || event.propertyName !== "transform") return;
        sections.forEach((section, index) => {
          section.style.setProperty("--mobile-section-y", `${(index - destination) * 100}dvh`);
        });
        activeTransitionCleanup?.();
        targetSection = null;
        finishTransition(destination);
      };

      activeTransitionCleanup = () => {
        incoming.removeEventListener("transitionend", onTransitionEnd);
        incoming.removeEventListener("transitioncancel", onTransitionCancel);
        activeTransitionCleanup = null;
      };

      incoming.addEventListener("transitionend", onTransitionEnd);
      incoming.addEventListener("transitioncancel", onTransitionCancel);
      requestAnimationFrame(() => {
        sections.forEach((section, index) => {
          section.style.setProperty("--mobile-section-y", `${(index - destination) * 100}dvh`);
        });
      });

      return true;
    };

    const reset = () => {
      activeTransitionCleanup?.();
      transitioning = false;
      touchStart = null;
      gestureAxis = null;
      touchIdentifier = null;
      isScrolling = false;
      targetSection = null;
    };

    mobileController = { navigateTo, reset };

    const isCarouselGesture = (target) => target?.closest?.("#festivities-carousel");

    window.addEventListener("touchstart", (event) => {
      if (!scrollingUnlocked || transitioning || !event.touches.length) return;
      if (isCarouselGesture(event.target)) return;
      if (event.touches.length !== 1) {
        touchStart = null;
        gestureAxis = null;
        touchIdentifier = null;
        return;
      }

      touchStart = {
        clientX: event.touches[0].clientX,
        clientY: event.touches[0].clientY
      };
      touchIdentifier = event.touches[0].identifier;
      gestureAxis = null;
    }, { passive: true, capture: true });

    window.addEventListener("touchmove", (event) => {
      if (!touchStart || event.touches.length !== 1 || event.touches[0].identifier !== touchIdentifier) {
        touchStart = null;
        gestureAxis = null;
        touchIdentifier = null;
        return;
      }

      const touch = event.touches[0];
      const deltaX = touch.clientX - touchStart.clientX;
      const deltaY = touch.clientY - touchStart.clientY;

      if (!gestureAxis && Math.max(Math.abs(deltaX), Math.abs(deltaY)) >= 10) {
        gestureAxis = Math.abs(deltaY) > Math.abs(deltaX) * 1.15 ? "vertical" : "horizontal";
      }

      if (gestureAxis === "vertical") event.preventDefault();
    }, { passive: false, capture: true });

    window.addEventListener("touchend", (event) => {
      if (!touchStart) return;

      const start = touchStart;
      const identifier = touchIdentifier;
      touchStart = null;
      touchIdentifier = null;
      if (!scrollingUnlocked || transitioning || gestureAxis !== "vertical" || event.touches.length !== 0) return;

      const touch = event.changedTouches[0];
      if (!touch || touch.identifier !== identifier) return;
      const deltaY = touch.clientY - start.clientY;
      if (Math.abs(deltaY) < 10) return;

      navigateTo(currentSection + (deltaY < 0 ? 1 : -1));
    }, { passive: true, capture: true });

    window.addEventListener("touchcancel", () => {
      touchStart = null;
      gestureAxis = null;
      touchIdentifier = null;
    }, { passive: true, capture: true });

    // Mobile navigation is touch-only. Ignore wheel input here so native
    // wheel momentum cannot act as a second section-navigation mechanism.
    window.addEventListener("wheel", (event) => {
      if (mobileViewport.matches && scrollingUnlocked && !event.ctrlKey && !event.metaKey) {
        event.preventDefault();
      }
    }, { passive: false, capture: true });
  }

  // Preserve the prior touch navigation for wide touch-enabled desktop screens.
  let desktopTouchStartY = 0;
  let desktopTouchStartX = 0;
  let desktopTouchTarget = null;
  let desktopTouchValid = false;

  window.addEventListener("touchstart", (event) => {
    if (mobileViewport.matches || !event.touches.length) return;
    desktopTouchStartY = event.touches[0].clientY;
    desktopTouchStartX = event.touches[0].clientX;
    desktopTouchTarget = event.target;
    desktopTouchValid = true;
  }, { passive: true });

  window.addEventListener("touchend", (event) => {
    if (mobileViewport.matches || !scrollingUnlocked || !desktopTouchValid) return;
    desktopTouchValid = false;
    if (isScrolling || touchLocked || !event.changedTouches.length) return;
    if (desktopTouchTarget?.closest?.("#festivities-carousel")) return;

    const touch = event.changedTouches[0];
    const deltaY = desktopTouchStartY - touch.clientY;
    const deltaX = desktopTouchStartX - touch.clientX;
    if (Math.abs(deltaX) > Math.abs(deltaY) || Math.abs(deltaY) < TOUCH_THRESHOLD) return;

    touchLocked = true;
    currentSection = getCurrentSection();
    goToSection(currentSection + (deltaY > 0 ? 1 : -1));
    setTimeout(() => { touchLocked = false; }, 1100);
  }, { passive: true });

  window.addEventListener("touchcancel", () => {
    desktopTouchValid = false;
  }, { passive: true });


  /* ========================================
     KEYBOARD SCROLLING
  ======================================== */

  window.addEventListener("keydown", (event) => {

    if (!scrollingUnlocked || isScrolling) return;

    const activeElement = document.activeElement;

    if (
      activeElement &&
      (
        activeElement.isContentEditable ||
        ["INPUT", "TEXTAREA", "SELECT", "BUTTON", "A"]
          .includes(activeElement.tagName)
      )
    ) {
      return;
    }

    if (
      event.key === "ArrowDown" ||
      event.key === "PageDown"
    ) {

      event.preventDefault();

      currentSection = getCurrentSection();

      goToSection(currentSection + 1);

    }

    else if (
      event.key === "ArrowUp" ||
      event.key === "PageUp"
    ) {

      event.preventDefault();

      currentSection = getCurrentSection();

      goToSection(currentSection - 1);

    }

  });


  /* ========================================
     ALWAYS START FROM INTRO SCREEN
  ======================================== */

  if ("scrollRestoration" in history) {

    history.scrollRestoration = "manual";

  }


  function resetInvitation() {

    clearTimeout(scrollEndTimer);
    clearTimeout(wheelIdleTimer);

    window.scrollTo(0, 0);
    mobileController?.reset();

    document.documentElement.classList.remove("mobile-section-navigation");
    document.body.classList.remove("mobile-section-navigation");
    sections.forEach((section) => {
      section.classList.remove(
        "mobile-controlled-section",
        "mobile-section-active",
        "mobile-section-entering"
      );
      section.style.removeProperty("--mobile-section-y");
      section.style.removeProperty("z-index");
    });

    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";

    scrollingUnlocked = false;

    currentSection = 0;
    isScrolling = false;
    targetSection = null;

    wheelLocked = false;
    touchLocked = false;
    validTouch = false;

    coverScreen.classList.remove(
      "opening",
      "exit-animation",
      "is-hidden"
    );

    invitationScreen.classList.remove(
      "ganesha-preopen",
      "decorations-visible",
      "ganesha-settled",
      "heading-visible"
    );

    openButton.disabled = false;

    if (petalContainer) {

      petalContainer.innerHTML = "";

      petalContainer.classList.remove("petals-visible");

    }

    invitationStarted = false;

  }


  // Always begin with closed doors.
  resetInvitation();


  /* ========================================
     FADE-IN OBSERVER
  ======================================== */

  const fadeElements = document.querySelectorAll(
    ".fade-in-section"
  );

  const fadeObserver = new IntersectionObserver(

    (entries) => {

      entries.forEach((entry) => {

        if (entry.isIntersecting) {

          entry.target.classList.add("visible");

        } else {

          entry.target.classList.remove("visible");

        }

      });

    },

    {
      threshold: 0.2
    }

  );


  fadeElements.forEach((element) => {

    fadeObserver.observe(element);

  });


  /* ========================================
     ROSE PETALS
  ======================================== */

  function createPetals() {

    if (!petalContainer) return;

    petalContainer.innerHTML = "";

    const isMobile = window.innerWidth <= 768;

    const petalCount = isMobile ? 22 : 40;

    for (let i = 0; i < petalCount; i++) {

      const petal = document.createElement("span");

      petal.classList.add("rose-petal");

      const left = Math.random() * 100;
      const duration = 9 + Math.random() * 8;
      const delay = Math.random() * -15;

      petal.style.left = `${left}%`;
      petal.style.animationDuration = `${duration}s`;
      petal.style.animationDelay = `${delay}s`;

      petalContainer.appendChild(petal);

    }

    petalContainer.classList.add("petals-visible");

  }


  /* ========================================
     UNLOCK PAGE SCROLLING
  ======================================== */

  function unlockScrolling() {

    currentSection = 0;
    setupMobileSectionController();

    document.documentElement.style.overflow = "";
    document.body.style.overflow = "";

    scrollingUnlocked = true;

  }


  /* ========================================
     OPEN INVITATION
  ======================================== */

  function openInvitation() {

    if (invitationStarted) return;

    invitationStarted = true;

    openButton.disabled = true;

    invitationScreen.classList.add("ganesha-preopen");

    coverScreen.classList.add("opening");


    /* STEP 1: DOORS OPEN */

    setTimeout(() => {

      coverScreen.classList.add("exit-animation");

    }, DOOR_OPEN_DURATION);


    /* STEP 2: COVER DISAPPEARS */

    setTimeout(() => {

      coverScreen.classList.add("is-hidden");

    }, DOOR_OPEN_DURATION + COVER_EXIT_DURATION);


    /* STEP 3: LOTUS DECORATIONS */

    setTimeout(() => {

      invitationScreen.classList.add("decorations-visible");

    }, DOOR_OPEN_DURATION + LOTUS_DECORATION_DELAY);


    /* STEP 4: GANESHA MOVES UP */

    const ganeshaMoveTime =
      DOOR_OPEN_DURATION +
      COVER_EXIT_DURATION +
      GANESHA_MOVE_DELAY;

    setTimeout(() => {

      invitationScreen.classList.add("ganesha-settled");

    }, ganeshaMoveTime);


    /* STEP 5: FALLING PETALS */

    const petalsTime =
      ganeshaMoveTime +
      PETALS_START_DELAY;

    setTimeout(() => {

      createPetals();

    }, petalsTime);


    /* STEP 6: INVITATION HEADING */

    const headingTime =
      ganeshaMoveTime +
      HEADING_AFTER_MOVE;

    setTimeout(() => {

      invitationScreen.classList.add("heading-visible");

    }, headingTime);


    /* STEP 7: UNLOCK SCROLLING */

    setTimeout(() => {

      unlockScrolling();

    }, headingTime + 1500);

  }


  /* ========================================
     OPEN BUTTON
  ======================================== */

  openButton.addEventListener("click", openInvitation);


  /* ========================================
     BROWSER BACK/FORWARD RESTORE
  ======================================== */

  window.addEventListener("pageshow", (event) => {

    if (event.persisted) {

      resetInvitation();

    }

  });


  /* ========================================
     HANDLE WINDOW RESIZE
  ======================================== */

  let resizeTimer = null;

  window.addEventListener("resize", () => {

    if (mobileViewport.matches) return;
    if (!scrollingUnlocked || isScrolling) return;

    clearTimeout(resizeTimer);

    resizeTimer = setTimeout(() => {

      currentSection = getCurrentSection();

      window.scrollTo(
        0,
        getSectionTop(sections[currentSection])
      );

    }, 150);

  });


  /* ========================================
     WEDDING FESTIVITIES CAROUSEL
  ======================================== */

  const festivitiesCarousel = document.getElementById(
    "festivities-carousel"
  );

  const festivityCards = document.querySelectorAll(
    ".festivity-card"
  );

  const festivityDots = document.querySelectorAll(
    ".festivity-dot"
  );


  if (festivitiesCarousel && festivityCards.length) {

    let activeFestivity = 0;

    const totalFestivities = festivityCards.length;


    /* ========================================
       UPDATE CAROUSEL
    ======================================== */

    function updateFestivitiesCarousel() {

      festivityCards.forEach((card, index) => {

        card.classList.remove(
          "center",
          "left",
          "right",
          "hidden"
        );

        let difference = index - activeFestivity;

        if (difference > totalFestivities / 2) {

          difference -= totalFestivities;

        }

        if (difference < -totalFestivities / 2) {

          difference += totalFestivities;

        }

        if (difference === 0) {

          card.classList.add("center");

        }

        else if (difference === -1) {

          card.classList.add("left");

        }

        else if (difference === 1) {

          card.classList.add("right");

        }

        else {

          card.classList.add("hidden");

        }

      });


      /* Update dots */

      festivityDots.forEach((dot, index) => {

        dot.classList.toggle(
          "active",
          index === activeFestivity
        );

      });

    }


    /* ========================================
       NEXT
    ======================================== */

    function nextFestivity() {

      activeFestivity =
        (activeFestivity + 1) % totalFestivities;

      updateFestivitiesCarousel();

    }


    /* ========================================
       PREVIOUS
    ======================================== */

    function previousFestivity() {

      activeFestivity =
        (activeFestivity - 1 + totalFestivities) %
        totalFestivities;

      updateFestivitiesCarousel();

    }


    /* ========================================
       DOT NAVIGATION
    ======================================== */

    festivityDots.forEach((dot, index) => {

      dot.addEventListener("click", () => {

        activeFestivity = index;

        updateFestivitiesCarousel();

      });

    });


    /* ========================================
       CAROUSEL SWIPE / DRAG
    ======================================== */

    let startX = 0;
    let endX = 0;

    let isDragging = false;
    let activePointerId = null;

    const SWIPE_THRESHOLD = 40;


    festivitiesCarousel.addEventListener(
      "pointerdown",
      (event) => {

        if (!event.isPrimary || event.button !== 0) return;

        startX = event.clientX;
        endX = startX;

        isDragging = true;

        activePointerId = event.pointerId;

        if (festivitiesCarousel.setPointerCapture) {

          festivitiesCarousel.setPointerCapture(
            event.pointerId
          );

        }

        festivitiesCarousel.classList.add("dragging");

      }
    );


    festivitiesCarousel.addEventListener(
      "pointermove",
      (event) => {

        if (!isDragging) return;

        if (event.pointerId !== activePointerId) return;

        endX = event.clientX;

      }
    );


    festivitiesCarousel.addEventListener(
      "pointerup",
      (event) => {

        if (!isDragging) return;

        if (event.pointerId !== activePointerId) return;

        endX = event.clientX;

        finishSwipe();

      }
    );


    festivitiesCarousel.addEventListener(
      "pointercancel",
      cancelSwipe
    );


    festivitiesCarousel.addEventListener(
      "lostpointercapture",
      cancelSwipe
    );


    function finishSwipe() {

      if (!isDragging) return;

      isDragging = false;

      festivitiesCarousel.classList.remove("dragging");

      const distance = startX - endX;

      activePointerId = null;

      if (Math.abs(distance) < SWIPE_THRESHOLD) return;

      if (distance > 0) {

        nextFestivity();

      } else {

        previousFestivity();

      }

    }


    function cancelSwipe() {

      isDragging = false;

      activePointerId = null;

      festivitiesCarousel.classList.remove("dragging");

    }


    /* ========================================
       KEYBOARD
    ======================================== */

    festivitiesCarousel.setAttribute("tabindex", "0");

    festivitiesCarousel.addEventListener(
      "keydown",
      (event) => {

        if (event.key === "ArrowRight") {

          event.preventDefault();

          nextFestivity();

        }

        if (event.key === "ArrowLeft") {

          event.preventDefault();

          previousFestivity();

        }

      }
    );


    /* ========================================
       INITIAL STATE
    ======================================== */

    updateFestivitiesCarousel();

  }


  /* ========================================
     COPY VENUE ADDRESS
  ======================================== */

  const copyLocationButton = document.getElementById(
    "copy-location"
  );

  if (copyLocationButton) {

    copyLocationButton.addEventListener(
      "click",
      async () => {

        const address =
          "Raj Vilas Palace, Amer Road, near Jal Mahal, Jaipur 302002";

        try {

          await navigator.clipboard.writeText(address);

          copyLocationButton.textContent = "ADDRESS COPIED";

          setTimeout(() => {

            copyLocationButton.textContent = "COPY ADDRESS";

          }, 2000);

        } catch (error) {

          const textArea = document.createElement("textarea");

          textArea.value = address;

          textArea.style.position = "fixed";
          textArea.style.opacity = "0";

          document.body.appendChild(textArea);

          textArea.select();

          document.execCommand("copy");

          textArea.remove();

          copyLocationButton.textContent = "ADDRESS COPIED";

          setTimeout(() => {

            copyLocationButton.textContent = "COPY ADDRESS";

          }, 2000);

        }

      }
    );

  }

});
