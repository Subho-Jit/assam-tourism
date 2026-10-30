const $ = selector => document.querySelector(selector);
    const $$ = selector => [...document.querySelectorAll(selector)];

    function safeRead(key) {
      try {
        const value = JSON.parse(localStorage.getItem(key) || "[]");
        return Array.isArray(value) ? value : [];
      } catch {
        return [];
      }
    }

    function safeWrite(key, value) {
      try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
      } catch {
        return false;
      }
    }

    function showToast(message) {
      const toast = $("#toast");
      toast.textContent = message;
      toast.classList.add("show");
      clearTimeout(showToast.timer);
      showToast.timer = setTimeout(() => toast.classList.remove("show"), 3000);
    }

    // Mobile navigation
    $("#menuToggle").addEventListener("click", () => {
      const open = $("#navLinks").classList.toggle("open");
      $("#menuToggle").setAttribute("aria-expanded", String(open));
      $("#menuToggle").textContent = open ? "✕" : "☰";
    });

    $$("#navLinks a").forEach(link => {
      link.addEventListener("click", () => {
        $("#navLinks").classList.remove("open");
        $("#menuToggle").setAttribute("aria-expanded", "false");
        $("#menuToggle").textContent = "☰";
      });
    });

    // Destination search and filters
    let activeFilter = "all";

    function filterDestinations() {
      const query = $("#destinationSearch").value.trim().toLowerCase();
      let visibleCount = 0;

      $$(".destination-card").forEach(card => {
        const matchesCategory = activeFilter === "all" || card.dataset.category === activeFilter;
        const matchesText = card.dataset.name.toLowerCase().includes(query) ||
          card.textContent.toLowerCase().includes(query);
        const visible = matchesCategory && matchesText;
        card.hidden = !visible;
        if (visible) visibleCount++;
      });

      $("#noResults").hidden = visibleCount !== 0;
    }

    $("#destinationSearch").addEventListener("input", filterDestinations);

    $$(".filter").forEach(button => {
      button.addEventListener("click", () => {
        activeFilter = button.dataset.filter;
        $$(".filter").forEach(item => item.classList.toggle("active", item === button));
        filterDestinations();
      });
    });

    // Reveal animations; respect reduced-motion preferences
    if ("IntersectionObserver" in window &&
        !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.12 });

      $$(".reveal").forEach(element => observer.observe(element));
    } else {
      $$(".reveal").forEach(element => element.classList.add("visible"));
    }

    // Package buttons prefill the booking form
    $$("[data-package]").forEach(button => {
      button.addEventListener("click", () => {
        $("#bookDays").value = button.dataset.package;
        $("#tripInterest").value = button.dataset.interest;
        $("#planner").scrollIntoView({ behavior: "smooth" });
        setTimeout(() => $("#bookName").focus({ preventScroll: true }), 450);
      });
    });

    // Set booking date minimum to today
    const today = new Date();
    const localToday = new Date(today.getTime() - today.getTimezoneOffset() * 60000)
      .toISOString().slice(0, 10);

    $("#travelDate").min = localToday;
    $("#year").textContent = new Date().getFullYear();

    // Generate a sample itinerary and save the enquiry locally
    $("#bookingForm").addEventListener("submit", event => {
      event.preventDefault();

      const form = event.currentTarget;
      if (!form.reportValidity()) return;

      const data = Object.fromEntries(new FormData(form).entries());

      if (data.date < localToday) {
        $("#bookingMessage").textContent = "Please choose today or a future date.";
        $("#bookingMessage").classList.add("show");
        return;
      }

      data.createdAt = new Date().toISOString();
      const entries = safeRead("exploreAssamBookings");
      entries.push(data);
      const saved = safeWrite("exploreAssamBookings", entries);

      const itineraries = {
        nature: [
          "Travel to Kaziranga and settle into nearby accommodation.",
          "Enjoy an authorised wildlife experience, subject to season and availability.",
          "Explore tea country or a nature stop along the route.",
          "Visit a local market and try regional food.",
          "Keep time flexible for transfers and weather."
        ],
        culture: [
          "Explore Guwahati and try Assamese cuisine.",
          "Discover local crafts, weaving and cultural traditions.",
          "Travel towards Majuli if ferry schedules allow.",
          "Learn about satra traditions or a cultural activity.",
          "Leave time for local markets and travel."
        ],
        spiritual: [
          "Visit Kamakhya Temple and allow time for queues.",
          "Explore other cultural and spiritual sites in Guwahati.",
          "Enjoy regional food and a relaxed city day.",
          "Add a heritage or riverfront stop.",
          "Keep a flexible day for travel and rest."
        ],
        heritage: [
          "Explore Guwahati's cultural landmarks.",
          "Plan travel towards Sivasagar if suitable for your dates.",
          "Visit Ahom-era monuments such as Rang Ghar.",
          "Learn about local history and craft traditions.",
          "Allow time for transfers and return travel."
        ],
        mixed: [
          "Explore Guwahati and Kamakhya Temple.",
          "Travel towards Kaziranga if time and conditions permit.",
          "Enjoy a guided nature experience.",
          "Discover tea culture and local food.",
          "Choose a heritage, craft or village experience.",
          "Add another region only if transport allows.",
          "Keep a flexible day for rest and transfers."
        ]
      };

      const selected = itineraries[data.interest] || itineraries.mixed;
      const days = Number(data.days);
      const message = $("#bookingMessage");
      message.replaceChildren();

      const heading = document.createElement("strong");
      heading.textContent = saved
        ? "Your enquiry has been saved in this browser."
        : "Your itinerary is ready, but browser storage is unavailable.";
      message.appendChild(heading);

      const intro = document.createElement("p");
      intro.textContent =
        `Suggested ${days}-day itinerary for ${data.name}, starting ${data.date}, for ${data.travellers} traveller(s):`;
      message.appendChild(intro);

      const list = document.createElement("ol");

      Array.from({ length: days }, (_, index) => {
        const item = document.createElement("li");
        item.textContent = `Day ${index + 1}: ${
          selected[index] ||
          "Flexible day: explore nearby at your own pace or allow extra transfer time."
        }`;
        list.appendChild(item);
      });

      message.appendChild(list);

      const note = document.createElement("p");
      note.textContent =
        "This is a planning suggestion, not a confirmed booking. Check permits, opening dates, transport, weather and prices with official providers.";
      message.appendChild(note);

      message.classList.add("show");
      message.scrollIntoView({ behavior: "smooth", block: "nearest" });

      if (saved) showToast("Trip enquiry saved locally.");
    });

    // Contact form demo storage
    $("#contactForm").addEventListener("submit", event => {
      event.preventDefault();

      const form = event.currentTarget;
      if (!form.reportValidity()) return;

      const data = Object.fromEntries(new FormData(form).entries());
      data.createdAt = new Date().toISOString();

      const entries = safeRead("exploreAssamMessages");
      entries.push(data);
      const saved = safeWrite("exploreAssamMessages", entries);

      const status = $("#contactStatus");
      status.textContent = saved
        ? "Thank you! Your message has been saved in this browser . No email has been sent."
        : "Your message could not be saved in this browser. No email has been sent.";

      status.classList.add("show");
      if (saved) form.reset();
      showToast(saved ? "Message saved locally." : "Browser storage unavailable.");
    });

    // Login and registration demo
    const modal = $("#authModal");
    const authForm = $("#authForm");
    let authMode = "login";
    let lastFocused = null;

    function setAuthMode(mode) {
      authMode = mode;
      const registering = mode === "register";

      $("#loginTab").classList.toggle("active", !registering);
      $("#registerTab").classList.toggle("active", registering);
      $("#authNameField").hidden = !registering;
      $("#authName").required = registering;
      $("#authPassword").autocomplete = registering ? "new-password" : "current-password";
      $("#authTitle").textContent = registering ? "Create your account" : "Welcome to Explore Assam";
      $("#authSubtitle").textContent = registering
        ? "Create a profile in this browser."
        : "Sign in to your local account.";
      $("#authSubmit").textContent = registering ? "Create account" : "Sign in";
      $("#authStatus").classList.remove("show");
    }

    function openAuth(mode = "login") {
      lastFocused = document.activeElement;
      setAuthMode(mode);
      modal.classList.add("open");
      setTimeout(() => {
        (mode === "register" ? $("#authName") : $("#authEmail")).focus();
      }, 50);
    }

    function closeAuth() {
      modal.classList.remove("open");
      if (lastFocused && typeof lastFocused.focus === "function") lastFocused.focus();
    }

    $$("[data-open-auth]").forEach(button => {
      button.addEventListener("click", () => openAuth(button.dataset.openAuth));
    });

    $("#loginTab").addEventListener("click", () => setAuthMode("login"));
    $("#registerTab").addEventListener("click", () => setAuthMode("register"));
    $("#closeAuth").addEventListener("click", closeAuth);

    modal.addEventListener("click", event => {
      if (event.target === modal) closeAuth();
    });

    document.addEventListener("keydown", event => {
      if (event.key === "Escape" && modal.classList.contains("open")) closeAuth();
    });

    authForm.addEventListener("submit", event => {
      event.preventDefault();
      if (!authForm.reportValidity()) return;

      const email = $("#authEmail").value.trim().toLowerCase();
      const password = $("#authPassword").value;
      const status = $("#authStatus");
      const users = safeRead("exploreAssamDemoUsers");

      if (authMode === "register") {
        if (users.some(user => user.email === email)) {
          status.textContent = "An account with this email already exists in this browser.";
          status.classList.add("show");
          return;
        }

        users.push({
          name: $("#authName").value.trim(),
          email,
          password,
          createdAt: new Date().toISOString()
        });

        if (!safeWrite("exploreAssamUsers", users)) {
          status.textContent = "Browser storage is unavailable. The account could not be saved.";
          status.classList.add("show");
          return;
        }

        status.textContent = "Account created. You can now sign in.";
        status.classList.add("show");
        showToast("Account created.");
        authForm.reset();
        setAuthMode("login");
      } else {
        const user = users.find(item => item.email === email && item.password === password);

        if (!user) {
          status.textContent = "No matching account found. Check your details or register first.";
          status.classList.add("show");
          return;
        }

        safeWrite("exploreAssamSession", {
          name: user.name,
          email: user.email,
          signedInAt: new Date().toISOString()
        });

        status.textContent = `Welcome back, ${user.name}! You are signed in to this browser .`;
        status.classList.add("show");
        showToast(`Welcome, ${user.name}!`);
        setTimeout(closeAuth, 1200);
      }
    });
