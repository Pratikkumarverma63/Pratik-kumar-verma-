/**
 * Clebsch Robotics Club - Spline 3D Scene Controller
 * Scene URL: https://prod.spline.design/QQB28e6tSL1YGZ1o/scene.splinecode
 */

class ClebschSplineHero {
  constructor() {
    this.container = document.getElementById("hero-spline-container");
    this.viewer = document.getElementById("hero-spline-viewer");
    this.loader = document.getElementById("hero-spline-loader");
    this.sceneUrl = "https://prod.spline.design/QQB28e6tSL1YGZ1o/scene.splinecode";
    this.isLoaded = false;
  }

  getSplineInstance() {
    if (!this.viewer) return null;
    return (
      this.viewer.spline ||
      this.viewer._spline ||
      this.viewer._app ||
      this.viewer.application ||
      this.viewer._application ||
      window.__splineApp ||
      null
    );
  }

  init() {
    if (!this.container || !this.viewer) return;

    // Ensure viewer has correct URL
    this.viewer.setAttribute("url", this.sceneUrl);

    // Auto clean when scene loads
    this.viewer.addEventListener("load", (e) => {
      if (e && e.detail) {
        if (e.detail.spline) this.viewer.spline = e.detail.spline;
        if (e.detail.app) this.viewer._app = e.detail.app;
      }
      this.cleanEverything();
    });

    this.viewer.addEventListener("load-complete", (e) => {
      if (e && e.detail) {
        if (e.detail.spline) this.viewer.spline = e.detail.spline;
        if (e.detail.app) this.viewer._app = e.detail.app;
      }
      this.cleanEverything();
    });

    // Staggered cleanups for any asynchronous sub-meshes
    this.cleanEverything();
    const cleanLoop = setInterval(() => this.cleanEverything(), 200);
    setTimeout(() => clearInterval(cleanLoop), 8000);

    // Mouse parallax interaction (Throttled with requestAnimationFrame for smooth 60fps)
    let ticking = false;
    window.addEventListener("mousemove", (e) => {
      if (!this.viewer) return;
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const x = (e.clientX / window.innerWidth) * 2 - 1;
          const y = -(e.clientY / window.innerHeight) * 2 + 1;
          try {
            const spline = this.getSplineInstance();
            if (spline && typeof spline.setVariable === "function") {
              spline.setVariable("mouseX", x);
              spline.setVariable("mouseY", y);
            }
          } catch (err) {}
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
  }

  cleanEverything() {
    this.hideWatermark();
    this.hide3DTextObjects();
  }

  hide3DTextObjects() {
    try {
      const spline = this.getSplineInstance();
      if (!spline) return;

      const hideNode = (node) => {
        try {
          node.visible = false;
          node.renderOrder = -999;
          if (node.scale) node.scale.set(0.00001, 0.00001, 0.00001);
          if (node.position) node.position.z = -99999;
          if (node.material) {
            node.material.visible = false;
            node.material.opacity = 0;
            node.material.transparent = true;
          }
        } catch (e) {}
      };

      const isRobotPart = (node) => {
        if (!node) return false;
        const name = (node.name || "").trim().toLowerCase();
        const type = (node.type || "").toLowerCase();
        
        // If it is the background text "NAOBOT" or "ROBOT", it is NOT a robot part!
        if (
          name === "naobot" ||
          name.includes("naobot") ||
          name === "robot" ||
          name.includes("text") ||
          name.includes("typography") ||
          name.includes("word") ||
          name.includes("backdrop") ||
          type === "text" ||
          type.includes("text")
        ) {
          return false;
        }

        // Protect actual humanoid body parts
        if (
          type.includes("bone") ||
          type.includes("skinned") ||
          name.includes("body") ||
          name.includes("head") ||
          name.includes("arm") ||
          name.includes("hand") ||
          name.includes("finger") ||
          name.includes("leg") ||
          name.includes("foot") ||
          name.includes("joint") ||
          name.includes("chest") ||
          name.includes("torso") ||
          name.includes("visor") ||
          name.includes("face") ||
          name.includes("character") ||
          name.includes("mesh") ||
          name.includes("rig")
        ) {
          return true;
        }

        // Check if it's a dark/glossy robot material
        if (node.material) {
          const mat = Array.isArray(node.material) ? node.material[0] : node.material;
          if (mat && mat.color) {
            // Dark glossy material = robot
            if (mat.color.r < 0.4 && mat.color.g < 0.4 && mat.color.b < 0.4) {
              return true;
            }
          }
        }

        return false;
      };

      // 1. Spline API getAllObjects
      if (typeof spline.getAllObjects === "function") {
        const objs = spline.getAllObjects();
        if (Array.isArray(objs)) {
          objs.forEach((obj) => {
            const name = (obj.name || "").trim().toLowerCase();
            const type = (obj.type || "").toLowerCase();

            if (
              name === "naobot" ||
              name.includes("naobot") ||
              name === "robot" ||
              name.includes("text") ||
              name.startsWith("text") ||
              name.includes("typography") ||
              name.includes("word") ||
              name.includes("title") ||
              name.includes("backdrop") ||
              type === "text" ||
              type.includes("text")
            ) {
              if (!isRobotPart(obj)) {
                hideNode(obj);
              }
            }
          });
        }
      }

      // 2. Three.js Scene Graph Traversal
      const threeScene = spline._scene || spline.scene;
      if (threeScene && typeof threeScene.traverse === "function") {
        threeScene.traverse((node) => {
          const name = (node.name || "").trim().toLowerCase();
          const type = (node.type || "").toLowerCase();

          // Target NAOBOT and all text meshes
          if (
            name === "naobot" ||
            name.includes("naobot") ||
            name === "robot" ||
            name.includes("text") ||
            name.startsWith("text") ||
            name.includes("typography") ||
            name.includes("word") ||
            name.includes("backdrop") ||
            type === "text" ||
            type === "troika_text" ||
            type === "textmesh"
          ) {
            if (!isRobotPart(node)) {
              hideNode(node);
            }
          }

          // Flat white geometry in background (the giant white letters)
          if (node.isMesh && node.material && !isRobotPart(node)) {
            const mat = Array.isArray(node.material) ? node.material[0] : node.material;
            if (mat && mat.color && mat.color.r > 0.75 && mat.color.g > 0.75 && mat.color.b > 0.75) {
              if (node.position && node.position.z < -5) {
                hideNode(node);
              }
            }
          }
        });
      }

      // 3. Explicit Named Lookups for NAOBOT and variants
      [
        "NAOBOT",
        "naobot",
        "NaoBot",
        "Nao Bot",
        "ROBOT",
        "robot",
        "Robot",
        "Text",
        "Text 1",
        "Text 2",
        "Text 3",
        "Typography",
        "Word",
        "Backdrop Text"
      ].forEach((tName) => {
        try {
          if (typeof spline.findObjectByName === "function") {
            const found = spline.findObjectByName(tName);
            if (found && !isRobotPart(found)) hideNode(found);
          }
        } catch (e) {}
      });
    } catch (err) {
      console.warn("Spline 3D text cleanup:", err);
    }
  }

  hideWatermark() {
    try {
      if (this.viewer && this.viewer.shadowRoot) {
        if (!this.viewer.shadowRoot.querySelector("#clean-spline-css")) {
          const style = document.createElement("style");
          style.id = "clean-spline-css";
          style.textContent = `
            #logo, #spline-watermark, a[href*="spline.design"], .spline-watermark,
            a, [class*="watermark"], [class*="logo"], [id*="watermark"], [id*="logo"] {
              display: none !important;
              opacity: 0 !important;
              visibility: hidden !important;
              pointer-events: none !important;
              width: 0 !important;
              height: 0 !important;
              position: absolute !important;
              bottom: -9999px !important;
            }
          `;
          this.viewer.shadowRoot.appendChild(style);
        }
        const badNodes = this.viewer.shadowRoot.querySelectorAll(
          "#logo, #spline-watermark, a[href*='spline.design'], .spline-watermark, a"
        );
        badNodes.forEach((el) => el.remove());
      }
    } catch (e) {}
  }
}

/**
 * Controller for the Connect with Clebsch Section Spline 3D Scene
 * Scene URL: https://prod.spline.design/IZ70Y4yVxpLruIgE/scene.splinecode
 */
class ClebschSplineContact {
  constructor() {
    this.viewer = document.getElementById("contact-spline-viewer");
    this.container = document.getElementById("contact-spline-container");
    this.sceneUrl = "https://prod.spline.design/IZ70Y4yVxpLruIgE/scene.splinecode";
    this.pratikLinkedIn = "https://www.linkedin.com/in/pratik-kumar-verma-b402a1382/";
  }

  getSplineInstance() {
    if (!this.viewer) return null;
    return (
      this.viewer.spline ||
      this.viewer._spline ||
      this.viewer._app ||
      this.viewer.application ||
      this.viewer._application ||
      null
    );
  }

  init() {
    if (!this.viewer) return;
    this.loaded = false;

    // Viewport-based lazy loading to eliminate startup lag
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !this.loaded) {
          this.loaded = true;
          this.loadScene();
        }
      });
    }, { rootMargin: "500px" });

    if (this.container) observer.observe(this.container);
    else observer.observe(this.viewer);

    // Global listener on contact container
    if (this.container) {
      this.container.addEventListener("click", (e) => {
        this.override3DLinks();
      }, { passive: true });
    }
  }

  loadScene() {
    this.viewer.setAttribute("url", this.sceneUrl);

    this.viewer.addEventListener("load", (e) => {
      this.handleSceneLoaded(e);
    }, { once: true });

    this.viewer.addEventListener("load-complete", (e) => {
      this.handleSceneLoaded(e);
    }, { once: true });

    // Continuous check for shadowRoot watermark cleanup & link overrides
    let attempts = 0;
    const interval = setInterval(() => {
      attempts++;
      this.hideWatermark();
      this.override3DLinks();
      if (attempts > 25) clearInterval(interval);
    }, 300);
  }

  handleSceneLoaded(e) {
    if (e && e.detail) {
      if (e.detail.spline) this.viewer.spline = e.detail.spline;
      if (e.detail.app) this.viewer._app = e.detail.app;
    }
    this.hideWatermark();
    this.override3DLinks();
  }

  override3DLinks() {
    try {
      const spline = this.getSplineInstance();
      if (spline) {
        // 1. If runtime has event listeners, listen for mouseDown
        if (typeof spline.addEventListener === "function" && !spline._pratikHooked) {
          spline._pratikHooked = true;
          spline.addEventListener("mouseDown", (ev) => {
            if (ev && ev.target) {
              const name = (ev.target.name || "").toLowerCase();
              if (
                name.includes("touch") ||
                name.includes("contact") ||
                name.includes("linkedin") ||
                name.includes("button") ||
                name.includes("link") ||
                name.includes("social")
              ) {
                window.open(this.pratikLinkedIn, "_blank", "noopener,noreferrer");
              }
            }
          });
        }

        // 2. Search scene objects for button
        if (typeof spline.findObjectByName === "function") {
          const btn =
            spline.findObjectByName("Get in touch") ||
            spline.findObjectByName("Button") ||
            spline.findObjectByName("button") ||
            spline.findObjectByName("Contact");
          if (btn && !btn._pratikClick) {
            btn._pratikClick = true;
            if (typeof spline.addEventListener === "function") {
              spline.addEventListener("mouseDown", (ev) => {
                if (ev && ev.target && (ev.target === btn || ev.target.name === btn.name)) {
                  window.open(this.pratikLinkedIn, "_blank", "noopener,noreferrer");
                }
              });
            }
          }
        }

        // 3. Iterate all scene objects to replace any hardcoded URL actions
        if (typeof spline.getAllObjects === "function") {
          const objs = spline.getAllObjects();
          if (Array.isArray(objs)) {
            objs.forEach((obj) => {
              if (obj && obj.events) {
                Object.values(obj.events).forEach((evArray) => {
                  if (Array.isArray(evArray)) {
                    evArray.forEach((action) => {
                      if (action && typeof action.url === "string") {
                        if (
                          action.url.includes("victor") ||
                          action.url.includes("granado") ||
                          action.url.includes("linkedin.com")
                        ) {
                          action.url = this.pratikLinkedIn;
                        }
                      }
                    });
                  }
                });
              }
            });
          }
        }
      }

      // 4. Check inside shadowRoot for any anchor tags
      if (this.viewer && this.viewer.shadowRoot) {
        const anchors = this.viewer.shadowRoot.querySelectorAll("a");
        anchors.forEach((a) => {
          if (a.href && (a.href.includes("victor") || a.href.includes("granado") || a.href.includes("linkedin.com"))) {
            a.href = this.pratikLinkedIn;
            a.target = "_blank";
          }
        });
      }
    } catch (err) {}
  }

  hideWatermark() {
    try {
      if (this.viewer && this.viewer.shadowRoot) {
        if (!this.viewer.shadowRoot.querySelector("#clean-contact-spline-css")) {
          const style = document.createElement("style");
          style.id = "clean-contact-spline-css";
          style.textContent = `
            #logo, #spline-watermark, a[href*="spline.design"], .spline-watermark,
            [class*="watermark"], [class*="logo"], [id*="watermark"], [id*="logo"] {
              display: none !important;
              opacity: 0 !important;
              visibility: hidden !important;
              pointer-events: none !important;
              width: 0 !important;
              height: 0 !important;
              position: absolute !important;
              bottom: -9999px !important;
            }
          `;
          this.viewer.shadowRoot.appendChild(style);
        }
        const badNodes = this.viewer.shadowRoot.querySelectorAll(
          "#logo, #spline-watermark, a[href*='spline.design'], .spline-watermark"
        );
        badNodes.forEach((el) => el.remove());
      }
    } catch (e) {}
  }
}

/**
 * Controller for the Upcoming Conclaves & Hackathons Events Spline 3D Scene
 * Scene URL: https://prod.spline.design/2IHzW7caIQUXhmPv/scene.splinecode
 */
class ClebschSplineEvents {
  constructor() {
    this.viewer = document.getElementById("events-spline-viewer");
    this.container = document.getElementById("events-spline-container");
    this.sceneUrl = "https://prod.spline.design/2IHzW7caIQUXhmPv/scene.splinecode";
    this.loaded = false;
  }

  getSplineInstance() {
    if (!this.viewer) return null;
    return (
      this.viewer.spline ||
      this.viewer._spline ||
      this.viewer._app ||
      this.viewer.application ||
      this.viewer._application ||
      null
    );
  }

  init() {
    if (!this.viewer) return;

    // Viewport-based lazy loading to eliminate initial download lag
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !this.loaded) {
          this.loaded = true;
          this.loadScene();
        }
      });
    }, { rootMargin: "500px" });

    if (this.container) observer.observe(this.container);
    else observer.observe(this.viewer);
  }

  loadScene() {
    this.viewer.setAttribute("url", this.sceneUrl);

    this.viewer.addEventListener("load", (e) => {
      this.handleSceneLoaded(e);
    }, { once: true });

    this.viewer.addEventListener("load-complete", (e) => {
      this.handleSceneLoaded(e);
    }, { once: true });

    let attempts = 0;
    const interval = setInterval(() => {
      attempts++;
      this.applyTransparentBackground();
      this.hideWatermark();
      if (attempts > 30) clearInterval(interval);
    }, 250);
  }

  handleSceneLoaded(e) {
    if (e && e.detail) {
      if (e.detail.spline) this.viewer.spline = e.detail.spline;
      if (e.detail.app) this.viewer._app = e.detail.app;
    }
    this.applyTransparentBackground();
    this.hideWatermark();
  }

  applyTransparentBackground() {
    try {
      const app = this.getSplineInstance();
      if (app) {
        if (app._scene) app._scene.background = null;
        if (app.scene) app.scene.background = null;
        if (app._renderer) {
          app._renderer.setClearColor(0x000000, 0);
          if (app._renderer.setClearAlpha) app._renderer.setClearAlpha(0);
        }
        if (app.renderer) {
          app.renderer.setClearColor(0x000000, 0);
          if (app.renderer.setClearAlpha) app.renderer.setClearAlpha(0);
        }
      }
      if (this.viewer && this.viewer.shadowRoot) {
        const canvas = this.viewer.shadowRoot.querySelector("canvas");
        if (canvas) {
          canvas.style.background = "transparent";
        }
      }
    } catch (e) {}
  }

  hideWatermark() {
    try {
      if (this.viewer && this.viewer.shadowRoot) {
        if (!this.viewer.shadowRoot.querySelector("#clean-events-spline-css")) {
          const style = document.createElement("style");
          style.id = "clean-events-spline-css";
          style.textContent = `
            #logo, #spline-watermark, a[href*="spline.design"], .spline-watermark,
            [class*="watermark"], [class*="logo"], [id*="watermark"], [id*="logo"] {
              display: none !important;
              opacity: 0 !important;
              visibility: hidden !important;
              pointer-events: none !important;
              width: 0 !important;
              height: 0 !important;
              position: absolute !important;
              bottom: -9999px !important;
            }
            canvas {
              background: transparent !important;
            }
          `;
          this.viewer.shadowRoot.appendChild(style);
        }
        const badNodes = this.viewer.shadowRoot.querySelectorAll(
          "#logo, #spline-watermark, a[href*='spline.design'], .spline-watermark"
        );
        badNodes.forEach((el) => el.remove());
      }
    } catch (e) {}
  }
}

// Global click capture to intercept any unexpected popups or anchor tags
document.addEventListener("click", (e) => {
  const a = e.target.closest("a");
  if (a && a.href) {
    if (a.href.includes("victor-granado") || a.href.includes("granado") || a.href.includes("linkedin.com/in/victor")) {
      e.preventDefault();
      e.stopPropagation();
      window.open("https://www.linkedin.com/in/pratik-kumar-verma-b402a1382/", "_blank", "noopener,noreferrer");
    }
  }
}, true);

window.addEventListener("DOMContentLoaded", () => {
  window.clebschSplineHero = new ClebschSplineHero();
  window.clebschSplineHero.init();

  window.clebschSplineContact = new ClebschSplineContact();
  window.clebschSplineContact.init();

  window.clebschSplineEvents = new ClebschSplineEvents();
  window.clebschSplineEvents.init();
});
