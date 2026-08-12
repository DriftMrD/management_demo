(function () {
  const AUTH_KEY = "pm_auth_user";
  const DEFAULT_USER = {
    name: "张伟",
    role: "项目管理员",
    email: "zhangwei@company.com",
    products: ["日活", "Note"],
  };

  function ensureStyles() {
    if (document.getElementById("app-auth-styles")) return;
    const style = document.createElement("style");
    style.id = "app-auth-styles";
    style.textContent = `
.page-topbar{display:flex;align-items:center;justify-content:space-between;gap:16px;width:100%;min-width:0}
.page-topbar .breadcrumb,.page-topbar .home-breadcrumb{flex:1;min-width:0}
.iteration-detail-topnav.has-app-auth{justify-content:space-between;gap:16px}
.iteration-detail-topnav.has-app-auth .breadcrumb{flex:1;min-width:0}
.app-auth{position:relative;flex-shrink:0;margin-left:auto}
.app-auth-fixed{position:fixed;top:16px;right:24px;z-index:1200}
.app-auth-login-btn{display:inline-flex;align-items:center;justify-content:center;height:32px;padding:0;border:none;border-radius:0;background:transparent;color:#5d7599;font-size:13px;font-weight:600;text-decoration:none;white-space:nowrap;box-shadow:none}
.app-auth-login-btn:hover{background:transparent;color:#4d6485;text-decoration:none}
.app-auth-user{position:relative}
.app-auth-user-link{display:flex;align-items:center;gap:12px;padding:0;border:none;background:transparent;cursor:pointer;font-family:inherit;text-decoration:none;color:inherit}
.app-auth-user-link:hover{text-decoration:none;opacity:.92}
.app-auth-user-meta{display:flex;flex-direction:column;align-items:flex-end;gap:2px;line-height:1.2}
.app-auth-user-name{font-size:13px;font-weight:600;color:#1f2937;white-space:nowrap}
.app-auth-user-role{font-size:11px;font-weight:400;color:#9ca3af;white-space:nowrap}
.app-auth-avatar{display:inline-flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:50%;background:#e5edf7;color:#5d7599;font-size:13px;font-weight:700;flex-shrink:0;overflow:hidden}
.app-auth-menu{position:absolute;top:100%;right:0;padding-top:8px;min-width:120px;opacity:0;visibility:hidden;pointer-events:none;transition:opacity .12s ease,visibility .12s ease;z-index:1300}
.app-auth-user:hover .app-auth-menu,.app-auth-user:focus-within .app-auth-menu{opacity:1;visibility:visible;pointer-events:auto}
.app-auth-menu-inner{padding:6px;background:#fff;border:1px solid #dadada;border-radius:8px;box-shadow:0 8px 24px rgba(0,0,0,.08)}
.app-auth-menu-item{display:block;width:100%;padding:8px 12px;border:none;border-radius:6px;background:transparent;text-align:left;font-size:13px;color:#4b5563;cursor:pointer;font-family:inherit}
.app-auth-menu-item:hover{background:#f9fafb;color:#1f2937}
@media (max-width:800px){.app-auth-user-meta{display:none}}
`;
    document.head.appendChild(style);
  }

  function getUser() {
    try {
      const raw = localStorage.getItem(AUTH_KEY);
      if (!raw) return null;
      const user = JSON.parse(raw);
      if (!user || !user.name) return null;
      return user;
    } catch {
      return null;
    }
  }

  function setUser(user) {
    localStorage.setItem(AUTH_KEY, JSON.stringify(user));
  }

  function clearUser() {
    localStorage.removeItem(AUTH_KEY);
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function initialOf(name) {
    const s = String(name || "").trim();
    return s ? s.charAt(0) : "?";
  }

  function loginHref() {
    const current = window.location.pathname.split("/").pop() || "index.html";
    const search = window.location.search || "";
    const hash = window.location.hash || "";
    const redirect = encodeURIComponent(current + search + hash);
    return `login.html?redirect=${redirect}`;
  }

  function ensureMount() {
    let mount = document.getElementById("app-auth");
    if (mount) return mount;

    const crumb = document.querySelector("nav.breadcrumb, .home-breadcrumb");
    if (crumb) {
      const topnav = crumb.closest(".iteration-detail-topnav");
      mount = document.createElement("div");
      mount.id = "app-auth";
      mount.className = "app-auth";

      if (topnav) {
        topnav.classList.add("has-app-auth");
        topnav.appendChild(mount);
        return mount;
      }

      let topbar = crumb.closest(".page-topbar");
      if (!topbar) {
        topbar = document.createElement("div");
        topbar.className = "page-topbar";
        crumb.parentNode.insertBefore(topbar, crumb);
        topbar.appendChild(crumb);
      }
      topbar.appendChild(mount);
      return mount;
    }

    mount = document.createElement("div");
    mount.id = "app-auth";
    mount.className = "app-auth app-auth-fixed";
    document.body.appendChild(mount);
    return mount;
  }

  function closeMenus(except) {
    document.querySelectorAll(".app-auth-menu").forEach((menu) => {
      if (menu !== except) menu.hidden = true;
    });
    document.querySelectorAll(".app-auth-user-btn[aria-expanded='true']").forEach((btn) => {
      if (!except || btn.getAttribute("aria-controls") !== except.id) {
        btn.setAttribute("aria-expanded", "false");
      }
    });
  }

  function render() {
    if (document.body.classList.contains("auth-page")) return;
    ensureStyles();

    const mount = ensureMount();
    const user = getUser();

    if (!user) {
      mount.innerHTML = `<a class="app-auth-login-btn" href="${loginHref()}">登录</a>`;
      return;
    }

    const name = escapeHtml(user.name);
    const role = escapeHtml(user.role || "用户");
    const initial = escapeHtml(initialOf(user.name));

    mount.innerHTML = `
      <div class="app-auth-user">
        <a class="app-auth-user-link" href="profile.html" aria-label="个人设置">
          <span class="app-auth-user-meta">
            <span class="app-auth-user-name">${name}</span>
            <span class="app-auth-user-role">${role}</span>
          </span>
          <span class="app-auth-avatar" aria-hidden="true">${initial}</span>
        </a>
        <div class="app-auth-menu" role="menu" aria-label="快捷操作">
          <div class="app-auth-menu-inner">
            <button type="button" class="app-auth-menu-item" data-action="logout" role="menuitem">退出登录</button>
          </div>
        </div>
      </div>
    `;

    mount.querySelector('[data-action="logout"]').addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      clearUser();
      const onProfile = /profile\.html$/i.test(window.location.pathname.split("/").pop() || "");
      if (onProfile) {
        window.location.href = loginHref();
        return;
      }
      render();
    });
  }

  document.addEventListener("click", () => closeMenus());
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeMenus();
  });

  window.PMAuth = {
    getUser,
    setUser,
    clearUser,
    login: function (partial) {
      const next = {
        name: (partial && partial.name) || DEFAULT_USER.name,
        role: (partial && partial.role) || DEFAULT_USER.role,
        email: (partial && partial.email) || DEFAULT_USER.email,
        products: (partial && partial.products) || DEFAULT_USER.products,
      };
      setUser(next);
      return next;
    },
    render,
    DEFAULT_USER,
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", render);
  } else {
    render();
  }
})();
