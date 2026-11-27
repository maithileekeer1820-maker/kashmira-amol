
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

  const SCROLL_THRESHOLD = 25;
  const TOUCH_THRESHOLD = 45;
  const SCROLL_UNLOCK_DELAY = 300;


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

    setTimeout(() => {

      wheelLocked = false;
      touchLocked = false;

    }, SCROLL_UNLOCK_DELAY);

  }


  /* ========================================
     NAVIGATE TO SECTION
  ======================================== */

  function goToSection(index) {

    if (index < 0 || index >= sections.length) return;
    if (isScrolling) return;

    isScrolling = true;

    currentSection = index;

    clearTimeout(scrollEndTimer);

    window.scrollTo({

      top: getSectionTop(sections[index]),
      behavior: "smooth"

    });

    // Fallback for browsers without reliable scrollend.
    scrollEndTimer = setTimeout(() => {

      finishSectionScroll();

    }, 1800);

  }


  /* ========================================
     DETECT SCROLL COMPLETION
  ======================================== */

  window.addEventListener("scroll", () => {

    if (!scrollingUnlocked || !isScrolling) return;

    clearTimeout(scrollEndTimer);

    scrollEndTimer = setTimeout(() => {

      finishSectionScroll();

    }, 180);

  }, { passive: true });


  if ("onscrollend" in window) {

    window.addEventListener("scrollend", () => {

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
     MOBILE TOUCH SWIPE
     ONE SWIPE = ONE SECTION
  ======================================== */

  let touchStartY = 0;
  let touchStartX = 0;

  let touchStartTarget = null;
  let validTouch = false;
  let touchAxis = null;

  const mobileViewport = window.matchMedia("(max-width: 767px)");

  window.addEventListener("touchstart", (event) => {

    if (!event.touches.length) return;

    const touch = event.touches[0];

    touchStartY = touch.clientY;
    touchStartX = touch.clientX;

    touchStartTarget = event.target;
    touchAxis = null;

    validTouch = true;

  }, { passive: true });

  // Disable native vertical panning/momentum on mobile so only one mechanism
  // (the section navigator) can move the page for a swipe.
  window.addEventListener("touchmove", (event) => {
    if (!mobileViewport.matches || !validTouch || !event.touches.length) return;

    if (touchStartTarget?.closest?.("#festivities-carousel")) return;

    const touch = event.touches[0];
    const deltaX = touch.clientX - touchStartX;
    const deltaY = touch.clientY - touchStartY;

    if (!touchAxis && Math.max(Math.abs(deltaX), Math.abs(deltaY)) >= 12) {
      touchAxis = Math.abs(deltaY) > Math.abs(deltaX) * 1.2 ? "y" : "x";
    }

    if (touchAxis === "y") event.preventDefault();
  }, { passive: false });


  window.addEventListener("touchend", (event) => {

    if (!scrollingUnlocked || !validTouch) return;

    validTouch = false;

    if (isScrolling || touchLocked) return;

    if (!event.changedTouches.length) return;

    // Do not interfere with the festivities carousel.
    if (
      touchStartTarget &&
      touchStartTarget.closest &&
      touchStartTarget.closest("#festivities-carousel")
    ) {
      return;
    }

    const touch = event.changedTouches[0];

    const differenceY = touchStartY - touch.clientY;
    const differenceX = touchStartX - touch.clientX;

    // Ignore horizontal gestures.
    if (mobileViewport.matches) {
      if (touchAxis !== "y" || Math.abs(differenceX) > Math.abs(differenceY) * 0.8) return;
    } else if (Math.abs(differenceX) > Math.abs(differenceY)) {
      return;
    }

    const swipeThreshold = mobileViewport.matches
      ? Math.max(TOUCH_THRESHOLD, window.innerHeight * 0.06)
      : TOUCH_THRESHOLD;

    if (Math.abs(differenceY) < swipeThreshold) return;

    touchLocked = true;

    currentSection = getCurrentSection();

    const direction = differenceY > 0 ? 1 : -1;

    goToSection(currentSection + direction);

    setTimeout(() => {

      touchLocked = false;

    }, 1100);

  }, { passive: true });


  window.addEventListener("touchcancel", () => {

    validTouch = false;
    touchAxis = null;

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

    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";

    scrollingUnlocked = false;

    currentSection = 0;
    isScrolling = false;

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

    document.documentElement.style.overflow = "";
    document.body.style.overflow = "";

    scrollingUnlocked = true;

    currentSection = 0;

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
