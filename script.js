const API_BASE = '/api';
const TOKEN_KEY = 'ast_token';
const SPORT_KEY = 'ast_sport_v1';

const state = {
  events: [],
  editingId: null,
  activeSection: "landing",
  activeDiet: "bulking",
  activeWorkout: "strength",
  user: null,
  isAuthenticated: false,
  preferredSport: "Football",
  profile: null,
};

/* ─── API Helper ─── */
const apiRequest = async (endpoint, method = 'GET', body = null) => {
  const headers = { 'Content-Type': 'application/json' };
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);

  const res = await fetch(`${API_BASE}${endpoint}`, options);
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || 'Request failed');
  }
  return data;
};

/* ─── Activity level multipliers for TDEE calculation ─── */
const activityMultipliers = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  athlete: 1.9
};

function calculateBMR(height, weight, age, gender) {
  if (gender === 'male') {
    return 10 * weight + 6.25 * height - 5 * age + 5;
  } else {
    return 10 * weight + 6.25 * height - 5 * age - 161;
  }
}

function calculateTDEE(bmr, activityLevel) {
  return Math.round(bmr * activityMultipliers[activityLevel]);
}

function calculateBMI(height, weight) {
  const heightInMeters = height / 100;
  return (weight / (heightInMeters * heightInMeters)).toFixed(1);
}

function calculatePersonalizedDiet(tdee, goal) {
  let calories;
  switch (goal) {
    case 'bulking':
      calories = tdee + 500;
      break;
    case 'cutting':
      calories = Math.max(tdee - 500, 1200);
      break;
    case 'maintenance':
    default:
      calories = tdee;
      break;
  }

  const proteinGrams = Math.round(state.profile.weight * 2.0);
  const proteinCalories = proteinGrams * 4;
  const fatPercentage = goal === 'cutting' ? 0.25 : 0.30;
  const fatCalories = Math.round(calories * fatPercentage);
  const fatGrams = Math.round(fatCalories / 9);
  const carbCalories = calories - proteinCalories - fatCalories;
  const carbGrams = Math.round(carbCalories / 4);

  return {
    calories: Math.round(calories),
    macros: `Protein ${proteinGrams}g | Carbs ${carbGrams}g | Fat ${fatGrams}g`
  };
}

const dietPlans = {
  bulking: {
    title: "Bulking Plan",
    getCalories: () => state.profile ? calculatePersonalizedDiet(state.profile.tdee, 'bulking').calories : 3100,
    getMacros: () => state.profile ? calculatePersonalizedDiet(state.profile.tdee, 'bulking').macros : "Protein 180g | Carbs 390g | Fat 90g",
    meals: {
      Breakfast: "Oats, eggs, banana, peanut butter",
      Lunch: "Chicken rice bowl, avocado, vegetables",
      Dinner: "Salmon, sweet potato, mixed greens",
      Snacks: "Greek yogurt, nuts, protein shake",
    },
  },
  cutting: {
    title: "Cutting Plan",
    getCalories: () => state.profile ? calculatePersonalizedDiet(state.profile.tdee, 'cutting').calories : 2300,
    getMacros: () => state.profile ? calculatePersonalizedDiet(state.profile.tdee, 'cutting').macros : "Protein 190g | Carbs 220g | Fat 70g",
    meals: {
      Breakfast: "Egg white omelet, whole grain toast",
      Lunch: "Turkey salad, quinoa, olive oil",
      Dinner: "Grilled fish, steamed veggies",
      Snacks: "Cottage cheese, berries",
    },
  },
  maintenance: {
    title: "Maintenance Plan",
    getCalories: () => state.profile ? calculatePersonalizedDiet(state.profile.tdee, 'maintenance').calories : 2650,
    getMacros: () => state.profile ? calculatePersonalizedDiet(state.profile.tdee, 'maintenance').macros : "Protein 170g | Carbs 300g | Fat 75g",
    meals: {
      Breakfast: "Protein smoothie, oats, chia seeds",
      Lunch: "Lean beef wrap, brown rice",
      Dinner: "Chicken pasta, side salad",
      Snacks: "Fruit, mixed nuts",
    },
  },
};

const workoutPlans = {
  strength: [
    { name: "Barbell Squat", setsReps: "4 sets x 6 reps", description: "Build lower-body power for explosive duels and sprints." },
    { name: "Romanian Deadlift", setsReps: "3 sets x 8 reps", description: "Strengthen posterior chain for stability and acceleration." },
    { name: "Bench Press", setsReps: "4 sets x 6 reps", description: "Improve upper-body contact strength and shielding." },
  ],
  endurance: [
    { name: "Interval Runs", setsReps: "8 rounds (30s hard/60s easy)", description: "Boost match-level cardiovascular endurance and recovery." },
    { name: "Tempo Run", setsReps: "20 minutes steady", description: "Improve aerobic efficiency for full-match consistency." },
    { name: "Bike Sprints", setsReps: "6 sets x 45 seconds", description: "Low-impact conditioning for high output." },
  ],
  agility: [
    { name: "Cone Zig-Zag", setsReps: "5 rounds", description: "Enhance direction changes and close control movement." },
    { name: "Ladder Footwork", setsReps: "6 patterns x 2 rounds", description: "Improve coordination, rhythm, and reaction speed." },
    { name: "Shuttle Runs", setsReps: "10 x 20m", description: "Develop acceleration-deceleration mechanics." },
  ],
};

const cityEventsBySport = {
  Football: [
    { name: "City Premier League Matchday", date: "2026-04-03", venue: "Central Stadium" },
    { name: "Open 5v5 Night Tournament", date: "2026-04-06", venue: "Riverside Turf" },
    { name: "Youth Academy Showcase", date: "2026-04-10", venue: "North Arena" },
  ],
  Basketball: [
    { name: "City Hoops Cup Qualifier", date: "2026-04-02", venue: "Downtown Indoor Court" },
    { name: "3v3 Streetball Finals", date: "2026-04-07", venue: "Metro Sports Park" },
    { name: "Skills Challenge Night", date: "2026-04-11", venue: "Westside Gym" },
  ],
  Tennis: [
    { name: "City Clay Open", date: "2026-04-04", venue: "Greenline Tennis Club" },
    { name: "Weekend Doubles League", date: "2026-04-08", venue: "Lakeside Courts" },
    { name: "Junior Singles Ladder", date: "2026-04-12", venue: "Central Tennis Complex" },
  ],
  Running: [
    { name: "5K City Night Run", date: "2026-04-01", venue: "City Boulevard" },
    { name: "Track Intervals Meetup", date: "2026-04-05", venue: "East Athletic Track" },
    { name: "10K Preparation Group", date: "2026-04-09", venue: "Riverfront Park" },
  ],
  Shooting: [
    { name: "Target Shooting Championship", date: "2026-04-03", venue: "Precision Range" },
    { name: "Archery Skills Workshop", date: "2026-04-07", venue: "Arrowhead Sports Center" },
    { name: "Olympic Rifle Practice Session", date: "2026-04-11", venue: "Elite Shooting Complex" },
  ],
  General: [
    { name: "Community Fitness Circuit", date: "2026-04-02", venue: "Urban Wellness Hub" },
    { name: "Functional Strength Camp", date: "2026-04-06", venue: "Peak Performance Center" },
    { name: "Weekend Recovery Workshop", date: "2026-04-13", venue: "South City Sports Hall" },
  ],
};

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

const showLoader = (visible) => {
  const loader = $("#app-loader");
  if (!loader) return;
  loader.classList.toggle("hidden", !visible);
};

/* ─── Events: API-backed ─── */
const loadEvents = async () => {
  if (!state.isAuthenticated) {
    state.events = [];
    return;
  }
  try {
    const events = await apiRequest('/events');
    state.events = events.map(e => ({
      id: e._id,
      date: e.date,
      opponent: e.opponent,
      location: e.location,
      notes: e.notes
    }));
  } catch (err) {
    console.error('Failed to load events:', err);
    state.events = [];
  }
};

/* ─── Profile: API-backed ─── */
const loadProfile = async () => {
  if (!state.isAuthenticated) return;
  try {
    const data = await apiRequest('/profile');
    if (data.profile && data.profile.height) {
      state.profile = {
        height: data.profile.height,
        weight: data.profile.weight,
        age: data.profile.age,
        gender: data.profile.gender,
        activityLevel: data.profile.activityLevel,
        bmr: data.profile.bmr,
        tdee: data.profile.tdee,
        bmi: data.profile.bmi
      };
      populateProfileForm();
      updateProfileSummary();
    }
    if (data.preferredSport) {
      state.preferredSport = data.preferredSport;
      const select = document.querySelector("#sport-select");
      if (select) select.value = state.preferredSport;
      updateSportUI(state.preferredSport);
    }
  } catch (err) {
    console.error('Failed to load profile:', err);
  }
};

const saveProfileToAPI = async () => {
  if (!state.isAuthenticated || !state.profile) return;
  try {
    await apiRequest('/profile', 'PUT', {
      ...state.profile,
      preferredSport: state.preferredSport
    });
  } catch (err) {
    console.error('Failed to save profile:', err);
  }
};

const populateProfileForm = () => {
  if (!state.profile) return;
  $("#profile-height").value = state.profile.height;
  $("#profile-weight").value = state.profile.weight;
  $("#profile-age").value = state.profile.age;
  $("#profile-gender").value = state.profile.gender;
  $("#profile-activity").value = state.profile.activityLevel;
};

const updateProfileSummary = () => {
  if (!state.profile) return;
  $("#bmr-value").textContent = `${Math.round(state.profile.bmr)} kcal`;
  $("#tdee-value").textContent = `${state.profile.tdee} kcal`;
  $("#bmi-value").textContent = state.profile.bmi;
  $("#profile-summary").style.display = "block";
};

/* ─── User / Auth: API-backed ─── */
const loadUser = () => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) return;

  try {
    // Decode JWT payload to check expiry
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (payload.exp * 1000 < Date.now()) {
      localStorage.removeItem(TOKEN_KEY);
      return;
    }
    // We'll load user data from profile API after setting auth state
    state.isAuthenticated = true;
  } catch {
    localStorage.removeItem(TOKEN_KEY);
  }
};

const loadUserProfile = async () => {
  if (!state.isAuthenticated) return;
  try {
    const data = await apiRequest('/profile');
    state.user = { name: data.name, email: data.email };
  } catch {
    // Token might be invalid
    state.isAuthenticated = false;
    localStorage.removeItem(TOKEN_KEY);
  }
};

const loadSport = () => {
  const saved = localStorage.getItem(SPORT_KEY);
  if (saved) {
    state.preferredSport = saved;
  }
  const select = document.querySelector("#sport-select");
  if (select) {
    select.value = state.preferredSport;
  }
  updateSportUI(state.preferredSport);
};

const updateSportUI = (sport) => {
  const label = document.querySelector("#sport-label");
  if (label) label.textContent = sport;

  const heroSubtitle = document.querySelector("#hero-subtitle");
  if (heroSubtitle) {
    heroSubtitle.textContent = `Your ${sport.toLowerCase()}-focused performance hub for event prep, nutrition, training plans, and AI guidance.`;
  }

  const eventsTitle = document.querySelector("#events-title");
  if (eventsTitle) eventsTitle.textContent = `${sport} Events`;

  const cityEventsTitle = document.querySelector("#city-events-title");
  if (cityEventsTitle) cityEventsTitle.textContent = `${sport} Events Across the City`;

  const upcomingTitle = document.querySelector("#upcoming-title");
  if (upcomingTitle) {
    upcomingTitle.textContent = sport === "Running" ? "Upcoming Runs" : "Upcoming Matches";
    if (sport === "General") upcomingTitle.textContent = "Upcoming Sessions";
  }

  const chatbotTitle = document.querySelector("#chatbot-title");
  if (chatbotTitle) chatbotTitle.textContent = `AI ${sport} Assistant`;

  renderCityEvents();
};

const renderCityEvents = () => {
  const cityList = $("#city-events-list");
  const emptyState = $("#city-events-empty");
  if (!cityList || !emptyState) return;

  const cityEvents = cityEventsBySport[state.preferredSport] || [];
  cityList.innerHTML = "";

  if (!cityEvents.length) {
    emptyState.style.display = "block";
    return;
  }

  emptyState.style.display = "none";
  cityEvents.forEach((event) => {
    const item = document.createElement("li");
    item.className = "event-item";
    item.innerHTML = `
      <strong>${event.name}</strong>
      <p class="event-meta">${formatDate(event.date)} • ${event.venue}</p>
    `;
    cityList.appendChild(item);
  });
};

const updateAuthUI = () => {
  const authNav = document.querySelector("#auth-nav-link");
  const heroLoginBtn = document.querySelector('[data-section-jump="auth"]');
  const userPill = document.querySelector("#user-pill");
  const logoutBtn = document.querySelector("#logout-btn");

  if (state.isAuthenticated && state.user) {
    if (authNav) authNav.style.display = "none";
    if (heroLoginBtn) heroLoginBtn.style.display = "none";
    if (userPill) {
      const displayName = state.user.name || state.user.email;
      userPill.textContent = `Signed in as ${displayName}`;
      userPill.style.display = "inline-flex";
    }
    if (logoutBtn) logoutBtn.style.display = "inline-flex";
  } else {
    if (authNav) authNav.style.display = "";
    if (heroLoginBtn) heroLoginBtn.style.display = "";
    if (userPill) userPill.style.display = "none";
    if (logoutBtn) logoutBtn.style.display = "none";
  }
};

const setActiveSection = (sectionId) => {
  state.activeSection = sectionId;
  $$(".app-section").forEach((section) => {
    section.classList.toggle("active-section", section.id === sectionId);
  });
  $$(".nav-link").forEach((link) => {
    link.classList.toggle("active", link.dataset.section === sectionId);
  });
  $("#nav-links")?.classList.remove("open");
  window.scrollTo({ top: 0, behavior: "smooth" });
};

const formatDate = (dateStr) => {
  const date = new Date(`${dateStr}T00:00:00`);
  return date.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const updateDashboardMetrics = () => {
  const today = new Date();
  const upcoming = state.events.filter((evt) => new Date(evt.date) >= new Date(today.toDateString()));
  $("#upcoming-matches").textContent = upcoming.length;
};

const renderEvents = () => {
  const list = $("#events-list");
  const emptyState = $("#events-empty");
  const count = $("#events-count");

  list.innerHTML = "";
  count.textContent = `${state.events.length} Event${state.events.length === 1 ? "" : "s"}`;

  if (!state.events.length) {
    emptyState.style.display = "block";
    updateDashboardMetrics();
    return;
  }

  emptyState.style.display = "none";

  const sorted = [...state.events].sort((a, b) => new Date(a.date) - new Date(b.date));
  sorted.forEach((event) => {
    const item = document.createElement("li");
    item.className = "event-item";
    item.innerHTML = `
      <strong>${event.opponent}</strong>
      <p class="event-meta">${formatDate(event.date)} • ${event.location}</p>
      <p>${event.notes || "No notes"}</p>
      <div class="event-actions">
        <button class="icon-btn" data-edit="${event.id}" title="Edit">
          <i class="fa-regular fa-pen-to-square"></i>
        </button>
        <button class="icon-btn delete" data-delete="${event.id}" title="Delete">
          <i class="fa-regular fa-trash-can"></i>
        </button>
      </div>
    `;
    list.appendChild(item);
  });

  updateDashboardMetrics();
};

const resetEventForm = () => {
  state.editingId = null;
  $("#event-form").reset();
  $("#event-id").value = "";
  $("#event-form-title").textContent = "Add Event";
  $("#event-submit-btn").textContent = "Save Event";
  $("#event-form-error").textContent = "";
};

const handleEventSubmit = async (e) => {
  e.preventDefault();

  if (!state.isAuthenticated) {
    $("#event-form-error").textContent = "Please login to save events.";
    return;
  }

  const editId = $("#event-id").value;
  const date = $("#event-date").value;
  const opponent = $("#event-opponent").value.trim();
  const location = $("#event-location").value.trim();
  const notes = $("#event-notes").value.trim();

  if (!date || !opponent || !location) {
    $("#event-form-error").textContent = "Please fill all required fields.";
    return;
  }

  const payload = { date, opponent, location, notes };
  const btn = $("#event-submit-btn");
  btn.disabled = true;
  btn.textContent = state.editingId ? "Updating..." : "Saving...";

  try {
    if (state.editingId) {
      await apiRequest(`/events/${editId}`, 'PUT', payload);
    } else {
      await apiRequest('/events', 'POST', payload);
    }

    await loadEvents();
    renderEvents();
    resetEventForm();
  } catch (err) {
    $("#event-form-error").textContent = err.message || "Failed to save event.";
  } finally {
    btn.disabled = false;
    btn.textContent = "Save Event";
  }
};

const handleEventListClick = async (e) => {
  const editId = e.target.closest("[data-edit]")?.dataset.edit;
  const deleteId = e.target.closest("[data-delete]")?.dataset.delete;

  if (editId) {
    const event = state.events.find((evt) => evt.id === editId);
    if (!event) return;

    state.editingId = editId;
    $("#event-id").value = event.id;
    $("#event-date").value = event.date;
    $("#event-opponent").value = event.opponent;
    $("#event-location").value = event.location;
    $("#event-notes").value = event.notes || "";

    $("#event-form-title").textContent = "Edit Event";
    $("#event-submit-btn").textContent = "Update Event";
    setActiveSection("events");
    return;
  }

  if (deleteId) {
    try {
      await apiRequest(`/events/${deleteId}`, 'DELETE');
      await loadEvents();
      renderEvents();
    } catch (err) {
      console.error('Failed to delete event:', err);
    }
  }
};

const renderDietPlan = () => {
  const plan = dietPlans[state.activeDiet];
  $("#diet-title").textContent = plan.title;
  $("#diet-calories").textContent = `${plan.getCalories()} kcal/day`;
  $("#diet-macros").textContent = plan.getMacros();

  const mealsRoot = $("#diet-meals");
  mealsRoot.innerHTML = "";

  Object.entries(plan.meals).forEach(([mealType, mealDesc]) => {
    const item = document.createElement("article");
    item.className = "meal-card";
    item.innerHTML = `
      <h4>${mealType}</h4>
      <p>${mealDesc}</p>
    `;
    mealsRoot.appendChild(item);
  });
};

const renderWorkoutPlan = () => {
  const list = $("#workout-list");
  list.innerHTML = "";

  workoutPlans[state.activeWorkout].forEach((exercise) => {
    const card = document.createElement("article");
    card.className = "card workout-card";
    card.innerHTML = `
      <h3>${exercise.name}</h3>
      <p class="pill">${exercise.setsReps}</p>
      <p>${exercise.description}</p>
    `;
    list.appendChild(card);
  });
};

const getBotResponseLocal = (message) => {
  const msg = message.toLowerCase();
  if (msg.includes("pre-match") || msg.includes("meal")) {
    return "Try a high-carb meal 3-4 hours before kickoff: rice/pasta + lean protein + hydration.";
  }
  if (msg.includes("stamina") || msg.includes("endurance")) {
    return "Add interval runs twice weekly, plus one tempo run. Prioritize sleep and hydration for adaptation.";
  }
  if (msg.includes("recover") || msg.includes("recovery")) {
    return "Post-match: protein + carbs within 60 minutes, light mobility, and at least 8 hours of sleep.";
  }
  if (msg.includes("speed") || msg.includes("agility")) {
    return "Use sprint drills with full rest and cone change-of-direction work 2-3 times per week.";
  }
  return "I can help with meal timing, stamina, agility, and match prep. Try: 'Pre-match meal?'";
};

const addChatBubble = (text, role = "bot") => {
  const container = $("#chat-messages");
  const bubble = document.createElement("div");
  bubble.className = `chat-bubble ${role}`;
  bubble.textContent = text;
  container.appendChild(bubble);
  container.scrollTop = container.scrollHeight;
};

const handleChatSubmit = async (e) => {
  e.preventDefault();
  const input = $("#chat-input");
  const sendBtn = $("#chat-send-btn");
  const text = input.value.trim();
  if (!text) return;

  addChatBubble(text, "user");
  input.value = "";
  sendBtn.disabled = true;
  sendBtn.textContent = "Thinking...";

  // If authenticated, use Groq AI via backend
  if (state.isAuthenticated) {
    try {
      const data = await apiRequest('/chat', 'POST', {
        message: text,
        sport: state.preferredSport
      });
      addChatBubble(data.reply, "bot");
    } catch (err) {
      // Fallback to local if API fails
      console.error('AI chat error:', err);
      addChatBubble(getBotResponseLocal(text), "bot");
    }
  } else {
    // Fallback for unauthenticated users
    addChatBubble(getBotResponseLocal(text), "bot");
  }

  sendBtn.disabled = false;
  sendBtn.textContent = "Send";
};

const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

/* ─── Login: API-backed ─── */
const handleLogin = async (e) => {
  e.preventDefault();
  const email = $("#login-email").value.trim();
  const password = $("#login-password").value;
  const error = $("#login-error");
  const btn = $("#login-btn");

  error.textContent = "";

  if (!validateEmail(email)) {
    error.textContent = "Enter a valid email.";
    return;
  }
  if (password.length < 6) {
    error.textContent = "Password must be at least 6 characters.";
    return;
  }

  btn.disabled = true;
  btn.textContent = "Logging in...";

  try {
    const data = await apiRequest('/auth/login', 'POST', { email, password });

    // Save token
    localStorage.setItem(TOKEN_KEY, data.token);

    // Update state
    state.user = { name: data.user.name, email: data.user.email };
    state.isAuthenticated = true;

    if (data.user.profile && data.user.profile.height) {
      state.profile = data.user.profile;
      populateProfileForm();
      updateProfileSummary();
      renderDietPlan();
    }

    if (data.user.preferredSport) {
      state.preferredSport = data.user.preferredSport;
      localStorage.setItem(SPORT_KEY, state.preferredSport);
      const select = document.querySelector("#sport-select");
      if (select) select.value = state.preferredSport;
      updateSportUI(state.preferredSport);
    }

    updateAuthUI();

    // Load user's events
    await loadEvents();
    renderEvents();

    error.style.color = "#30ff7a";
    error.textContent = "Login successful!";
    btn.disabled = false;
    btn.textContent = "Login";
    e.target.reset();

    setTimeout(() => {
      error.style.color = "";
      error.textContent = "";
      setActiveSection("dashboard");
    }, 900);
  } catch (err) {
    error.textContent = err.message || "Login failed.";
    btn.disabled = false;
    btn.textContent = "Login";
  }
};

/* ─── Signup: API-backed ─── */
const handleSignup = async (e) => {
  e.preventDefault();

  const name = $("#signup-name").value.trim();
  const email = $("#signup-email").value.trim();
  const password = $("#signup-password").value;
  const confirm = $("#signup-confirm").value;

  const error = $("#signup-error");
  const btn = $("#signup-btn");
  error.textContent = "";

  if (name.length < 2) {
    error.textContent = "Name must be at least 2 characters.";
    return;
  }
  if (!validateEmail(email)) {
    error.textContent = "Enter a valid email.";
    return;
  }
  if (password.length < 6) {
    error.textContent = "Password must be at least 6 characters.";
    return;
  }
  if (password !== confirm) {
    error.textContent = "Passwords do not match.";
    return;
  }

  btn.disabled = true;
  btn.textContent = "Creating...";

  try {
    const data = await apiRequest('/auth/signup', 'POST', { name, email, password });

    // Save token
    localStorage.setItem(TOKEN_KEY, data.token);

    // Update state
    state.user = { name: data.user.name, email: data.user.email };
    state.isAuthenticated = true;

    updateAuthUI();

    error.style.color = "#30ff7a";
    error.textContent = "Account created successfully!";
    btn.disabled = false;
    btn.textContent = "Create Account";
    e.target.reset();

    setTimeout(() => {
      error.style.color = "";
      error.textContent = "";
      setActiveSection("dashboard");
    }, 900);
  } catch (err) {
    error.textContent = err.message || "Signup failed.";
    btn.disabled = false;
    btn.textContent = "Create Account";
  }
};

/* ─── Logout ─── */
const handleLogout = () => {
  state.user = null;
  state.isAuthenticated = false;
  state.events = [];
  state.profile = null;
  localStorage.removeItem(TOKEN_KEY);
  updateAuthUI();
  renderEvents();
  $("#profile-summary").style.display = "none";
  $("#profile-form").reset();
  renderDietPlan();
  setActiveSection("landing");
};

/* ─── Profile Submit: API-backed ─── */
const handleProfileSubmit = async (e) => {
  e.preventDefault();

  const height = parseFloat($("#profile-height").value);
  const weight = parseFloat($("#profile-weight").value);
  const age = parseInt($("#profile-age").value);
  const gender = $("#profile-gender").value;
  const activityLevel = $("#profile-activity").value;

  const error = $("#profile-error");
  error.textContent = "";

  if (!height || height < 100 || height > 250) {
    error.textContent = "Please enter a valid height (100-250 cm).";
    return;
  }
  if (!weight || weight < 30 || weight > 200) {
    error.textContent = "Please enter a valid weight (30-200 kg).";
    return;
  }
  if (!age || age < 16 || age > 100) {
    error.textContent = "Please enter a valid age (16-100).";
    return;
  }
  if (!gender) {
    error.textContent = "Please select your gender.";
    return;
  }
  if (!activityLevel) {
    error.textContent = "Please select your activity level.";
    return;
  }

  const bmr = calculateBMR(height, weight, age, gender);
  const tdee = calculateTDEE(bmr, activityLevel);
  const bmi = calculateBMI(height, weight);

  state.profile = { height, weight, age, gender, activityLevel, bmr, tdee, bmi };

  updateProfileSummary();
  renderDietPlan();

  // Save to backend if authenticated
  if (state.isAuthenticated) {
    try {
      await saveProfileToAPI();
      error.style.color = "#30ff7a";
      error.textContent = "Profile saved to your account!";
    } catch (err) {
      error.style.color = "#30ff7a";
      error.textContent = "Profile saved locally (backend sync failed).";
    }
  } else {
    error.style.color = "#30ff7a";
    error.textContent = "Profile saved! Login to sync across devices.";
  }

  setTimeout(() => {
    error.style.color = "";
    error.textContent = "";
  }, 2000);
};

const resetProfileForm = () => {
  $("#profile-form").reset();
  $("#profile-error").textContent = "";
  $("#profile-summary").style.display = "none";
  state.profile = null;

  if (state.isAuthenticated) {
    apiRequest('/profile', 'PUT', {
      height: null, weight: null, age: null,
      gender: null, activityLevel: null,
      bmr: null, tdee: null, bmi: null
    }).catch(() => {});
  }

  renderDietPlan();
};

const renderChart = () => {
  const canvas = $("#training-chart");
  const ctx = canvas.getContext("2d");

  const data = [3, 4, 2, 5, 4, 3, 1];
  const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#d7f3e2";
  ctx.font = "14px Inter";

  const padding = 40;
  const chartW = canvas.width - padding * 2;
  const chartH = canvas.height - padding * 2;
  const barW = chartW / data.length - 20;
  const maxVal = Math.max(...data) + 1;

  ctx.strokeStyle = "rgba(200, 255, 220, 0.3)";
  ctx.beginPath();
  ctx.moveTo(padding, padding);
  ctx.lineTo(padding, canvas.height - padding);
  ctx.lineTo(canvas.width - padding, canvas.height - padding);
  ctx.stroke();

  data.forEach((value, index) => {
    const x = padding + index * (barW + 20) + 10;
    const barHeight = (value / maxVal) * chartH;
    const y = canvas.height - padding - barHeight;

    const grad = ctx.createLinearGradient(0, y, 0, canvas.height - padding);
    grad.addColorStop(0, "#30ff7a");
    grad.addColorStop(1, "#0f5f34");

    ctx.fillStyle = grad;
    ctx.fillRect(x, y, barW, barHeight);

    ctx.fillStyle = "#d7f3e2";
    ctx.fillText(labels[index], x, canvas.height - padding + 18);
    ctx.fillText(value, x + barW / 2 - 4, y - 8);
  });
};

/* ─── Wire up event handlers ─── */
const wireNavigation = () => {
  $$(".nav-link").forEach((link) => {
    link.addEventListener("click", () => setActiveSection(link.dataset.section));
  });
  $$("[data-section-jump]").forEach((btn) => {
    btn.addEventListener("click", () => setActiveSection(btn.dataset.sectionJump));
  });
  $("#mobile-menu-btn")?.addEventListener("click", () => {
    $("#nav-links")?.classList.toggle("open");
  });
  document.querySelector("#logout-btn")?.addEventListener("click", handleLogout);
};

const wireDietTabs = () => {
  $$("#diet-tabs .tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.activeDiet = btn.dataset.diet;
      $$("#diet-tabs .tab-btn").forEach((tab) => tab.classList.remove("active"));
      btn.classList.add("active");
      renderDietPlan();
    });
  });
};

const wireWorkoutTabs = () => {
  $$("#workout-tabs .tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.activeWorkout = btn.dataset.workout;
      $$("#workout-tabs .tab-btn").forEach((tab) => tab.classList.remove("active"));
      btn.classList.add("active");
      renderWorkoutPlan();
    });
  });
};

const wireEvents = () => {
  $("#event-form").addEventListener("submit", handleEventSubmit);
  $("#event-reset-btn").addEventListener("click", resetEventForm);
  $("#events-list").addEventListener("click", handleEventListClick);
};

const wireChat = () => {
  $("#chat-form").addEventListener("submit", handleChatSubmit);
  $$(".prompt-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      $("#chat-input").value = btn.textContent;
      $("#chat-form").dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
    });
  });
};

const wireAuth = () => {
  $("#login-form").addEventListener("submit", handleLogin);
  $("#signup-form").addEventListener("submit", handleSignup);
};

const wireProfile = () => {
  $("#profile-form").addEventListener("submit", handleProfileSubmit);
  $("#profile-reset-btn").addEventListener("click", resetProfileForm);
};

const wireSport = () => {
  const select = document.querySelector("#sport-select");
  if (!select) return;
  select.addEventListener("change", async (e) => {
    const sport = e.target.value;
    state.preferredSport = sport;
    localStorage.setItem(SPORT_KEY, sport);
    updateSportUI(sport);

    // Sync to backend if authenticated
    if (state.isAuthenticated) {
      try {
        await apiRequest('/profile', 'PUT', { preferredSport: sport });
      } catch (err) {
        console.error('Failed to save sport preference:', err);
      }
    }
  });
};

const wireChartRefresh = () => {
  $("#refresh-chart").addEventListener("click", (e) => {
    const btn = e.currentTarget;
    btn.disabled = true;
    btn.textContent = "Refreshing...";
    setTimeout(() => {
      renderChart();
      btn.disabled = false;
      btn.textContent = "Refresh";
    }, 400);
  });
};

/* ─── App Init ─── */
const init = async () => {
  showLoader(true);

  // Load token-based auth state synchronously
  loadUser();
  loadSport();

  // Wire all UI handlers
  wireNavigation();
  wireEvents();
  wireDietTabs();
  wireWorkoutTabs();
  wireChat();
  wireAuth();
  wireChartRefresh();
  wireSport();
  wireProfile();

  // Render static content
  renderDietPlan();
  renderWorkoutPlan();
  renderChart();
  renderCityEvents();
  renderEvents();

  // If authenticated, load data from API
  if (state.isAuthenticated) {
    await loadUserProfile();
    await loadProfile();
    await loadEvents();
    renderEvents();
    renderDietPlan();
  }

  updateAuthUI();
  addChatBubble(`Hi! I am your AI ${state.preferredSport.toLowerCase()} assistant. Ask me about meal timing, stamina, and recovery.`);

  setTimeout(() => showLoader(false), 800);
};

document.addEventListener("DOMContentLoaded", init);
