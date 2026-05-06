/* ═══════════════════════════════════════════════════════════
   data.js — Loads data.json and populates DOM elements
   Runs before main.js. Populates: name, tagline, about text,
   photos, social links, resume details, footer, etc.
═══════════════════════════════════════════════════════════ */

fetch("data.json")
  .then(function (r) {
    return r.json();
  })
  .then(function (data) {

    /* ── Page title ── */
    if (data.site && data.site.title) {
      document.title = data.site.title;
    }

    /* ── Hero tagline ── */
    var taglineEl = document.getElementById("hero-tagline");
    if (taglineEl) {
      var tl = (data.tagline) || (data.site && data.site.tagline) || "";
      if (tl) taglineEl.textContent = tl;
    }

    /* ── Hero nav hint ── */
    var navHintEl = document.getElementById("hero-nav-hint");
    if (navHintEl && data.site && data.site.nav_hint) {
      navHintEl.innerHTML = data.site.nav_hint;
    }

    /* ── About photo label ── */
    var aboutLabel = document.querySelector(".about-photo-label");
    if (aboutLabel && data.site && data.site.about_photo_label) {
      aboutLabel.textContent = data.site.about_photo_label;
    }

    /* ── About body text ── */
    var aboutEl = document.getElementById("about-text");
    if (aboutEl) {
      var aboutText =
        data.aboutText ||
        (data.about && data.about.paragraph_1) ||
        "";

      if (aboutText) {
        aboutEl.textContent = aboutText;
      }
    }

    /* ── About intro quote ── */
    var introEl = document.querySelector(".about-intro");
    if (introEl && data.about && data.about.intro_quote) {
      introEl.textContent = '"' + data.about.intro_quote + '"';
    }

    /* ── Secret about text ── */
    var secretAboutEl = document.querySelector(
      "#secret-about-content .about-body"
    );

    if (secretAboutEl && data.about && data.about.secret_text) {
      secretAboutEl.textContent = data.about.secret_text;
    }

    /* ── Social / profile links ── */
    if (data.socialLinks) {
      var li = document.getElementById("linkedin-link");
      var ig = document.getElementById("instagram-link");
      var rv = document.getElementById("resume-link");

      if (li && data.socialLinks.linkedin) {
        li.href =
          "https://linkedin.com/in/" +
          data.socialLinks.linkedin;
      }

      if (ig && data.socialLinks.instagram) {
        ig.href =
          "https://www.instagram.com/" +
          data.socialLinks.instagram;
      }

      if (rv && data.socialLinks.resume) {
        rv.href = data.socialLinks.resume;
      }
    }

    /* ── Footer ── */
    if (data.site) {
      var footerLeft = document.querySelector(
        ".footer span:first-child"
      );

      var footerRight = document.querySelector(
        ".footer span:last-child"
      );

      if (footerLeft && data.site.footer_left) {
        footerLeft.textContent = data.site.footer_left;
      }

      if (footerRight && data.site.footer_right) {
        footerRight.textContent = data.site.footer_right;
      }
    }

    /* ── Resume headline ── */
    var resumeTitleEl =
      document.querySelector(".resume-title");

    if (
      resumeTitleEl &&
      data.resume &&
      data.resume.headline
    ) {
      resumeTitleEl.textContent =
        data.resume.headline;
    }

    /* ── Resume summary ── */
    if (data.resume && data.resume.summary) {
      var summaryEl =
        document.querySelector(".resume-section p");

      if (summaryEl) {
        summaryEl.textContent =
          data.resume.summary;
      }
    }

    /* ── Skills quote ── */
    var skillsQuoteEl =
      document.querySelector(".skills-hero-quote");

    if (
      skillsQuoteEl &&
      data.skills &&
      data.skills.quote
    ) {
      skillsQuoteEl.textContent =
        '"' + data.skills.quote + '"';
    }

    /* ── Contact intro ── */
    var contactIntroEl =
      document.querySelector(".contact-intro");

    if (
      contactIntroEl &&
      data.contact &&
      data.contact.intro
    ) {
      contactIntroEl.textContent =
        data.contact.intro;
    }

    /* ── Birthday details ── */
    if (data.birthday) {
      var dobEl = document.querySelector(
        "#bday-secret-info p:nth-child(1)"
      );

      var timeEl = document.querySelector(
        "#bday-secret-info p:nth-child(2)"
      );

      var placeEl = document.querySelector(
        "#bday-secret-info p:nth-child(3)"
      );

      if (dobEl && data.birthday.dob_display) {
        dobEl.innerHTML =
          '<strong style="color:var(--text);">Date of Birth:</strong> ' +
          data.birthday.dob_display;
      }

      if (timeEl && data.birthday.time_display) {
        timeEl.innerHTML =
          '<strong style="color:var(--text);">Time:</strong> Approximately ' +
          data.birthday.time_display +
          " IST";
      }

      if (placeEl && data.birthday.place_display) {
        placeEl.innerHTML =
          '<strong style="color:var(--text);">Place:</strong> ' +
          data.birthday.place_display;
      }
    }

    /* ── Journey secret text ── */
    var journeySecretEl =
      document.querySelector("#secret-journey p");

    if (
      journeySecretEl &&
      data.journey &&
      data.journey.secret_text
    ) {
      journeySecretEl.textContent =
        data.journey.secret_text;
    }
  })
  .catch(function (err) {
    console.warn(
      "data.json could not be loaded:",
      err
    );
  });
