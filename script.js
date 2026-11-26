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
     SCROLL CONTROL
  ======================================== */

  let currentSection = 0;
  let isScrolling = false;
  let scrollingUnlocked = false;

  const SCROLL_DURATION = 1100;
  const SCROLL_THRESHOLD = 25;

  function getCurrentSection() {

    const scrollPosition = window.scrollY;

    let closestIndex = 0;
    let closestDistance = Infinity;

    sections.forEach((section, index) => {

      const distance = Math.abs(section.offsetTop - scrollPosition);

      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = index;
      }

    });

    return closestIndex;
  }


  function goToSection(index) {

    if (index < 0 || index >= sections.length) return;
    if (isScrolling) return;

    isScrolling = true;
    currentSection = index;

    window.scrollTo({
      top: sections[index].offsetTop,
      behavior: "smooth"
    });

    setTimeout(() => {

      isScrolling = false;
      currentSection = getCurrentSection();

    }, SCROLL_DURATION);

  }


  /* ========================================
     MOUSE WHEEL SCROLLING
  ======================================== */

  window.addEventListener("wheel", (event) => {

    if (!scrollingUnlocked) return;

    if (Math.abs(event.deltaY) < SCROLL_THRESHOLD) return;

    event.preventDefault();

    if (isScrolling) return;

    const direction = event.deltaY > 0 ? 1 : -1;

    currentSection = getCurrentSection();

    goToSection(currentSection + direction);

  }, { passive: false });


  /* ========================================
     TOUCH SWIPE SCROLLING
  ======================================== */

  let touchStartY = 0;

  window.addEventListener("touchstart", (event) => {

    touchStartY = event.touches[0].clientY;

  }, { passive: true });


  window.addEventListener("touchend", (event) => {

    if (!scrollingUnlocked || isScrolling) return;

    const touchEndY = event.changedTouches[0].clientY;
    const difference = touchStartY - touchEndY;

    if (Math.abs(difference) < 50) return;

    currentSection = getCurrentSection();

    if (difference > 0) {
      goToSection(currentSection + 1);
    } else {
      goToSection(currentSection - 1);
    }

  }, { passive: true });


  /* ========================================
     KEYBOARD SCROLLING
  ======================================== */

  window.addEventListener("keydown", (event) => {

    if (!scrollingUnlocked || isScrolling) return;

    if (
      event.key === "ArrowDown" ||
      event.key === "PageDown"
    ) {

      event.preventDefault();

      currentSection = getCurrentSection();
      goToSection(currentSection + 1);

    }

    if (
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

    window.scrollTo(0, 0);

    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";

    scrollingUnlocked = false;
    currentSection = 0;
    isScrolling = false;

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


  // Always begin with closed doors
  resetInvitation();


  /* ========================================
     FADE-IN OBSERVER
  ======================================== */

  const fadeElements = document.querySelectorAll(".fade-in-section");

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

  window.addEventListener("resize", () => {

    if (!scrollingUnlocked || isScrolling) return;

    currentSection = getCurrentSection();

    window.scrollTo({
      top: sections[currentSection].offsetTop,
      behavior: "instant"
    });

  });
  /* ========================================
   WEDDING FESTIVITIES CAROUSEL
======================================== */

const festivitiesCarousel = document.getElementById("festivities-carousel");

const festivityCards = document.querySelectorAll(".festivity-card");

const festivityDots = document.querySelectorAll(".festivity-dot");


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


      /* Circular positioning */

      if (difference > totalFestivities / 2) {

        difference -= totalFestivities;

      }

      if (difference < -totalFestivities / 2) {

        difference += totalFestivities;

      }


      /* Center */

      if (difference === 0) {

        card.classList.add("center");

      }


      /* Previous */

      else if (difference === -1) {

        card.classList.add("left");

      }


      /* Next */

      else if (difference === 1) {

        card.classList.add("right");

      }


      /* Remaining cards */

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

      (activeFestivity - 1 + totalFestivities)

      % totalFestivities;

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
     SWIPE / DRAG
  ======================================== */

  let startX = 0;

  let endX = 0;

  let isDragging = false;

  const SWIPE_THRESHOLD = 40;


  festivitiesCarousel.addEventListener("pointerdown", (event) => {

    startX = event.clientX;

    endX = startX;

    isDragging = true;

    festivitiesCarousel.classList.add("dragging");

  });


  festivitiesCarousel.addEventListener("pointermove", (event) => {

    if (!isDragging) return;

    endX = event.clientX;

  });


  festivitiesCarousel.addEventListener("pointerup", (event) => {

    if (!isDragging) return;

    endX = event.clientX;

    finishSwipe();

  });


  festivitiesCarousel.addEventListener("pointercancel", () => {

    isDragging = false;

    festivitiesCarousel.classList.remove("dragging");

  });


  festivitiesCarousel.addEventListener("pointerleave", (event) => {

    if (!isDragging) return;

    if (event.buttons === 0) {

      endX = event.clientX;

      finishSwipe();

    }

  });


  function finishSwipe() {

    if (!isDragging) return;

    isDragging = false;

    festivitiesCarousel.classList.remove("dragging");

    const distance = startX - endX;


    if (Math.abs(distance) < SWIPE_THRESHOLD) return;


    if (distance > 0) {

      nextFestivity();

    } else {

      previousFestivity();

    }

  }


  /* ========================================
     PREVENT PAGE SECTION SWIPE CONFLICT
  ======================================== */

  festivitiesCarousel.addEventListener("touchstart", (event) => {

    event.stopPropagation();

  }, { passive: true });


  festivitiesCarousel.addEventListener("touchend", (event) => {

    event.stopPropagation();

  }, { passive: true });


  festivitiesCarousel.addEventListener("touchcancel", (event) => {

    event.stopPropagation();

  }, { passive: true });


  /* ========================================
     KEYBOARD
  ======================================== */

  festivitiesCarousel.setAttribute("tabindex", "0");


  festivitiesCarousel.addEventListener("keydown", (event) => {

    if (event.key === "ArrowRight") {

      event.preventDefault();

      nextFestivity();

    }


    if (event.key === "ArrowLeft") {

      event.preventDefault();

      previousFestivity();

    }

  });


  /* ========================================
     INITIAL STATE
  ======================================== */

  updateFestivitiesCarousel();

}

/* ========================================
   COPY VENUE ADDRESS
======================================== */

const copyLocationButton = document.getElementById("copy-location");

if (copyLocationButton) {

  copyLocationButton.addEventListener("click", async () => {

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

      document.body.appendChild(textArea);

      textArea.select();

      document.execCommand("copy");

      textArea.remove();

      copyLocationButton.textContent = "ADDRESS COPIED";

      setTimeout(() => {

        copyLocationButton.textContent = "COPY ADDRESS";

      }, 2000);

    }

  });

}

});
