// BIGZY Games — Authentication
// Handles Sign In, Sign Up, Google, Apple, Password Reset

// ─── Demo mode (active when Firebase is not yet configured) ───────────────────
const FIREBASE_CONFIGURED = (
  typeof firebaseConfig !== "undefined" &&
  firebaseConfig.apiKey !== "YOUR_API_KEY"
);

const DEMO_CREDENTIALS = { email: "Demo123@bigzy.com", password: "Demo0987", displayName: "Test User" };
const DEMO_KEY = "bigzy_demo_user";
const ADMIN_EMAILS = ["Ahmedsofficialpc@gmail.com"];

function demoSignIn(email, password) {
  if (email === DEMO_CREDENTIALS.email && password === DEMO_CREDENTIALS.password) {
    localStorage.setItem(DEMO_KEY, JSON.stringify(DEMO_CREDENTIALS));
    return true;
  }
  return false;
}

function demoSignOut() {
  localStorage.removeItem(DEMO_KEY);
}

function isDemoSignedIn() {
  return !FIREBASE_CONFIGURED && !!localStorage.getItem(DEMO_KEY);
}

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

// ─── State ───────────────────────────────────────────────────────────────────
let currentAuthView = "signin";

// ─── Init ────────────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  setupAuthListeners();

  if (!FIREBASE_CONFIGURED) {
    // Demo mode — check localStorage for a demo session
    if (isDemoSignedIn()) {
      onUserSignedIn(JSON.parse(localStorage.getItem(DEMO_KEY)));
    } else {
      onUserSignedOut();
    }
    return;
  }

  // Real Firebase auth state
  auth.onAuthStateChanged((user) => {
    if (user) onUserSignedIn(user);
    else onUserSignedOut();
  });
});

// ─── Auth state handlers ──────────────────────────────────────────────────────
function onUserSignedIn(user) {
  hideAuthModal();
  const userBtn   = document.getElementById("user-btn");
  const signInBtn = document.getElementById("header-sign-in");
  const signUpBtn = document.getElementById("header-sign-up");
  const nudge     = document.getElementById("signup-nudge");
  if (userBtn) {
    userBtn.textContent = getInitials(user.displayName || user.email);
    userBtn.classList.remove("hidden");
    userBtn.title = user.displayName || user.email;
  }
  if (signInBtn) signInBtn.classList.add("hidden");
  if (signUpBtn) signUpBtn.classList.add("hidden");
  if (nudge) nudge.remove();
  if (typeof onAdminStatusChange === "function") {
    onAdminStatusChange(ADMIN_EMAILS.includes(user.email));
  }
}

function onUserSignedOut() {
  hideAuthModal();
  const userBtn   = document.getElementById("user-btn");
  const signInBtn = document.getElementById("header-sign-in");
  const signUpBtn = document.getElementById("header-sign-up");
  if (userBtn)   userBtn.classList.add("hidden");
  if (signInBtn) signInBtn.classList.remove("hidden");
  if (signUpBtn) signUpBtn.classList.remove("hidden");
  if (typeof onAdminStatusChange === "function") {
    onAdminStatusChange(false);
  }
}

// ─── Show / hide modal ────────────────────────────────────────────────────────
function showAuthModal(view) {
  currentAuthView = view || "signin";
  renderAuthView(currentAuthView);
  const el = document.getElementById("auth-modal");
  if (el) { el.classList.remove("hidden"); el.setAttribute("aria-hidden", "false"); }
}

function hideAuthModal() {
  const el = document.getElementById("auth-modal");
  if (el) { el.classList.add("hidden"); el.setAttribute("aria-hidden", "true"); }
}

// ─── Render auth views ────────────────────────────────────────────────────────
function renderAuthView(view) {
  const body = document.getElementById("auth-body");
  if (!body) return;
  clearAuthError();

  if (view === "reset") {
    body.innerHTML = `
      <p class="auth-desc" style="margin-bottom:16px">Enter your email and we'll send you a link to reset your password.</p>
      <div class="auth-field">
        <label for="reset-email">Email</label>
        <input type="email" id="reset-email" placeholder="you@example.com" autocomplete="email" />
      </div>
      <button class="auth-primary-btn" onclick="handlePasswordReset()">Send reset link</button>
      <button class="auth-text-btn" onclick="switchAuthView('signin')" style="margin-top:12px">← Back to Sign In</button>
    `;
    return;
  }

  const isSignUp = view === "signup";
  body.innerHTML = `
    <div class="auth-tabs">
      <button class="auth-tab ${!isSignUp ? "active" : ""}" onclick="switchAuthView('signin')">Sign In</button>
      <button class="auth-tab ${isSignUp ? "active" : ""}"  onclick="switchAuthView('signup')">Sign Up</button>
    </div>

    <button class="auth-social-btn google-btn" onclick="handleGoogleSignIn()">
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
        <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
        <path d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
        <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.96L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
      </svg>
      Continue with Google
    </button>

    <div class="auth-divider"><span>or</span></div>

    ${isSignUp ? `
    <div class="auth-field">
      <label for="auth-name">Display name</label>
      <input type="text" id="auth-name" placeholder="Your name" autocomplete="name" />
    </div>` : ""}

    <div class="auth-field">
      <label for="auth-email">Email</label>
      <input type="email" id="auth-email" placeholder="you@example.com" autocomplete="email" />
    </div>

    <div class="auth-field">
      <label for="auth-password">Password</label>
      <input type="password" id="auth-password"
        placeholder="${isSignUp ? "At least 8 characters" : "Your password"}"
        autocomplete="${isSignUp ? "new-password" : "current-password"}" />
    </div>

    ${!isSignUp ? `<button class="auth-text-btn" style="text-align:right;margin-top:-6px" onclick="switchAuthView('reset')">Forgot password?</button>` : ""}

    ${!FIREBASE_CONFIGURED && !isSignUp ? `
    <p style="font-size:0.75rem;color:var(--text-muted);margin-bottom:4px;text-align:center">
      Demo: <strong style="color:var(--accent-h)">test@bigzy.com</strong> / <strong style="color:var(--accent-h)">Test1234</strong>
    </p>` : ""}

    <button class="auth-primary-btn" onclick="${isSignUp ? "handleSignUp()" : "handleSignIn()"}">
      ${isSignUp ? "Create account" : "Sign in"}
    </button>

    ${isSignUp ? `<p class="auth-terms">By creating an account you agree to our Terms of Service.</p>` : ""}
  `;
}

function switchAuthView(view) {
  currentAuthView = view;
  renderAuthView(view);
}

// ─── Email Sign In ────────────────────────────────────────────────────────────
async function handleSignIn() {
  const email    = val("auth-email");
  const password = val("auth-password");

  if (!validateEmail(email)) return showAuthError("Please enter a valid email address.");
  if (!password) return showAuthError("Please enter your password.");

  setAuthLoading(true);

  if (!FIREBASE_CONFIGURED) {
    await delay(600);
    if (demoSignIn(email, password)) {
      onUserSignedIn(JSON.parse(localStorage.getItem(DEMO_KEY)));
    } else {
      showAuthError("Wrong credentials. Use test@bigzy.com / Test1234");
      setAuthLoading(false);
    }
    return;
  }

  try {
    await auth.signInWithEmailAndPassword(email, password);
  } catch (e) {
    showAuthError(friendlyError(e.code));
  } finally {
    setAuthLoading(false);
  }
}

// ─── Email Sign Up ────────────────────────────────────────────────────────────
async function handleSignUp() {
  const name     = val("auth-name");
  const email    = val("auth-email");
  const password = val("auth-password");

  if (!name) return showAuthError("Please enter your display name.");
  if (!validateEmail(email)) return showAuthError("Please enter a valid email address.");
  if (password.length < 8)   return showAuthError("Password must be at least 8 characters.");

  setAuthLoading(true);

  if (!FIREBASE_CONFIGURED) {
    await delay(600);
    const u = { email, displayName: name };
    localStorage.setItem(DEMO_KEY, JSON.stringify(u));
    onUserSignedIn(u);
    return;
  }

  try {
    const cred = await auth.createUserWithEmailAndPassword(email, password);
    await cred.user.updateProfile({ displayName: name });
  } catch (e) {
    showAuthError(friendlyError(e.code));
  } finally {
    setAuthLoading(false);
  }
}

// ─── Google Sign In ───────────────────────────────────────────────────────────
async function handleGoogleSignIn() {
  if (!FIREBASE_CONFIGURED) {
    return showAuthError("Google sign-in requires Firebase setup. Use test@bigzy.com / Test1234 for now.");
  }
  const provider = new firebase.auth.GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  try {
    await auth.signInWithPopup(provider);
  } catch (e) {
    if (e.code !== "auth/popup-closed-by-user") showAuthError(friendlyError(e.code));
  }
}

// ─── Password Reset ───────────────────────────────────────────────────────────
async function handlePasswordReset() {
  const email = val("reset-email");
  if (!validateEmail(email)) return showAuthError("Please enter a valid email address.");

  setAuthLoading(true);

  if (!FIREBASE_CONFIGURED) {
    await delay(800);
    showAuthSuccess("Reset link sent! (Demo mode — no real email sent)");
    setAuthLoading(false);
    return;
  }

  try {
    await auth.sendPasswordResetEmail(email);
    showAuthSuccess("Reset link sent! Check your inbox.");
    const btn = document.querySelector("#auth-body .auth-primary-btn");
    if (btn) { btn.disabled = true; btn.textContent = "Email sent"; }
  } catch (e) {
    showAuthError(friendlyError(e.code));
    setAuthLoading(false);
  }
}

// ─── Sign Out ─────────────────────────────────────────────────────────────────
async function handleSignOut() {
  if (!FIREBASE_CONFIGURED) {
    demoSignOut();
    onUserSignedOut();
    return;
  }
  await auth.signOut();
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function setupAuthListeners() {
  document.getElementById("auth-modal")?.addEventListener("click", (e) => {
    if (e.target.id !== "auth-modal") return;
    const loggedIn = FIREBASE_CONFIGURED ? !!auth.currentUser : isDemoSignedIn();
    if (loggedIn) hideAuthModal();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key !== "Enter") return;
    const overlay = document.getElementById("auth-modal");
    if (!overlay || overlay.classList.contains("hidden")) return;
    if (currentAuthView === "signin")  handleSignIn();
    else if (currentAuthView === "signup") handleSignUp();
    else if (currentAuthView === "reset")  handlePasswordReset();
  });
}

function val(id) {
  const el = document.getElementById(id);
  return el ? el.value.trim() : "";
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function setAuthLoading(loading) {
  const btn = document.querySelector("#auth-body .auth-primary-btn");
  if (!btn) return;
  btn.disabled = loading;
  if (loading) { btn.dataset.label = btn.textContent; btn.textContent = "Please wait…"; }
  else if (btn.dataset.label) btn.textContent = btn.dataset.label;
}

function showAuthError(msg) {
  const el = document.getElementById("auth-error");
  if (!el) return;
  el.textContent = msg;
  el.className = "error";
}

function showAuthSuccess(msg) {
  const el = document.getElementById("auth-error");
  if (!el) return;
  el.textContent = msg;
  el.className = "success";
}

function clearAuthError() {
  const el = document.getElementById("auth-error");
  if (el) { el.textContent = ""; el.className = "hidden"; }
}

function getInitials(str) {
  if (!str) return "?";
  const parts = str.trim().split(/\s+/);
  return parts.length >= 2
    ? (parts[0][0] + parts[1][0]).toUpperCase()
    : str.slice(0, 2).toUpperCase();
}

function friendlyError(code) {
  const map = {
    "auth/user-not-found":        "No account found with that email.",
    "auth/wrong-password":        "Incorrect password. Try again.",
    "auth/invalid-credential":    "Incorrect email or password.",
    "auth/invalid-email":         "That doesn't look like a valid email.",
    "auth/email-already-in-use":  "An account with that email already exists.",
    "auth/weak-password":         "Password is too weak — use at least 8 characters.",
    "auth/too-many-requests":     "Too many attempts. Please wait and try again.",
    "auth/network-request-failed":"Network error. Check your connection.",
    "auth/operation-not-allowed": "This sign-in method isn't enabled yet.",
    "auth/missing-email":         "Please enter your email address.",
  };
  return map[code] || "Something went wrong. Please try again.";
}
