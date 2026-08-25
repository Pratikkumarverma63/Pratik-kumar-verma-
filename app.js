/**
 * Clebsch Robotics - Main Application Controller
 * Handles Theme Switcher (White & Black / Dark), 3D Tilts, Blueprint Modals, and Forms.
 */

document.addEventListener("DOMContentLoaded", () => {
  // 1. Theme Switcher (White Default ↔ Dark/Night Theme)
  const themeToggleBtn = document.getElementById("theme-toggle-btn");
  const themeIcon = document.getElementById("theme-icon");
  const themeLabel = document.getElementById("theme-label");

  const savedTheme = localStorage.getItem("clebsch-theme") || localStorage.getItem("clebsch_theme") || "light";
  applyTheme(savedTheme);

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener("click", () => {
      const isDark = document.body.classList.contains("dark-theme");
      const nextTheme = isDark ? "light" : "dark";
      applyTheme(nextTheme);
      if (window.cyberAudio) window.cyberAudio.playClick();
      showToast(nextTheme === "dark" ? "Switched to Obsidian Night Mode" : "Switched to Crisp Light Mode");
    });
  }

  function applyTheme(theme) {
    if (theme === "dark") {
      document.body.classList.add("dark-theme");
      document.body.classList.remove("light-theme");
      document.documentElement.setAttribute("data-theme", "dark");
      if (themeIcon) themeIcon.className = "fa-solid fa-sun";
      if (themeLabel) themeLabel.textContent = "Night";
      localStorage.setItem("clebsch-theme", "dark");
      localStorage.setItem("clebsch_theme", "dark");
    } else {
      document.body.classList.remove("dark-theme");
      document.body.classList.add("light-theme");
      document.documentElement.setAttribute("data-theme", "light");
      if (themeIcon) themeIcon.className = "fa-solid fa-moon";
      if (themeLabel) themeLabel.textContent = "Light";
      localStorage.setItem("clebsch-theme", "light");
      localStorage.setItem("clebsch_theme", "light");
    }
  }

  // 2. Audio Control UI
  const audioToggleBtn = document.getElementById("audio-toggle-btn");
  const audioIcon = document.getElementById("audio-icon");
  const audioLabel = document.getElementById("audio-label");

  if (audioToggleBtn && window.cyberAudio) {
    const updateAudioBtnUI = () => {
      const isMuted = window.cyberAudio.muted;
      if (audioIcon) {
        audioIcon.className = isMuted ? "fa-solid fa-volume-xmark" : "fa-solid fa-volume-high";
      }
      if (audioLabel) {
        audioLabel.textContent = isMuted ? "SFX: OFF" : "SFX: ON";
      }
      audioToggleBtn.classList.toggle("active", !isMuted);
    };

    updateAudioBtnUI();

    audioToggleBtn.addEventListener("click", () => {
      window.cyberAudio.toggleMute();
      updateAudioBtnUI();
      if (!window.cyberAudio.muted) {
        window.cyberAudio.playClick();
      }
    });
  }

  // 3. Button Hover & Click SFX
  document.querySelectorAll("button, a, .tilt-card, .gallery-card, .robot-lab-card").forEach(el => {
    el.addEventListener("mouseenter", () => {
      if (window.cyberAudio) window.cyberAudio.playHover();
    });
    el.addEventListener("click", () => {
      if (window.cyberAudio) window.cyberAudio.playClick();
    });
  });

  // 4. Mobile Navigation Menu Toggle
  const mobileMenuBtn = document.getElementById("mobile-menu-btn");
  const navLinks = document.getElementById("nav-links");

  if (mobileMenuBtn && navLinks) {
    mobileMenuBtn.addEventListener("click", () => {
      navLinks.classList.toggle("open");
      const isOpen = navLinks.classList.contains("open");
      mobileMenuBtn.innerHTML = isOpen ? '<i class="fa-solid fa-xmark"></i>' : '<i class="fa-solid fa-bars"></i>';
    });

    navLinks.querySelectorAll("a").forEach(link => {
      link.addEventListener("click", () => {
        navLinks.classList.remove("open");
        mobileMenuBtn.innerHTML = '<i class="fa-solid fa-bars"></i>';
      });
    });
  }

  // 5. 3D Card Tilt (Throttled for silky-smooth 60fps)
  const init3DTilt = () => {
    document.querySelectorAll(".tilt-card, .gallery-card, .robot-lab-card").forEach(card => {
      let isTicking = false;
      card.addEventListener("mousemove", (e) => {
        if (!isTicking) {
          window.requestAnimationFrame(() => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const rotateX = -((y - rect.height / 2) / (rect.height / 2)) * 6;
            const rotateY = ((x - rect.width / 2) / (rect.width / 2)) * 6;

            card.style.transform = `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateZ(4px)`;
            
            const glare = card.querySelector(".card-glare");
            if (glare) {
              glare.style.background = `radial-gradient(circle at ${x}px ${y}px, rgba(0, 0, 0, 0.06), transparent 70%)`;
            }
            isTicking = false;
          });
          isTicking = true;
        }
      }, { passive: true });

      card.addEventListener("mouseleave", () => {
        card.style.transform = "perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0)";
        const glare = card.querySelector(".card-glare");
        if (glare) glare.style.background = "transparent";
      });
    });
  };
  init3DTilt();

  // 6. Number Counters
  const counterObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const target = entry.target;
        const endVal = parseInt(target.getAttribute("data-target"), 10) || 0;
        const prefix = target.getAttribute("data-prefix") || "";
        const suffix = target.getAttribute("data-suffix") || "";
        let current = 0;
        const duration = 1600;
        const stepTime = 25;
        const increment = endVal / (duration / stepTime);

        const timer = setInterval(() => {
          current += increment;
          if (current >= endVal) {
            target.textContent = prefix + endVal + suffix;
            clearInterval(timer);
          } else {
            target.textContent = prefix + Math.floor(current) + suffix;
          }
        }, stepTime);

        observer.unobserve(target);
      }
    });
  }, { threshold: 0.3 });

  document.querySelectorAll(".stat-counter").forEach(el => counterObserver.observe(el));

  // 7. Fleet Prototypes: Search, Filter & Live Telemetry HUD
  const projectFilterBtns = document.querySelectorAll(".proj-filter-btn");
  const projectCards = document.querySelectorAll(".project-card");
  const fleetSearchInput = document.getElementById("fleet-search-input");
  const fleetSearchClear = document.getElementById("fleet-search-clear");
  const fleetCountBadge = document.getElementById("fleet-count-badge");

  let currentCategory = "all";
  let currentSearchQuery = "";

  const applyFleetFilters = () => {
    let visibleCount = 0;
    projectCards.forEach(card => {
      const categoryMatch = (currentCategory === "all" || card.dataset.category === currentCategory);
      const textContent = (card.textContent + " " + (card.dataset.tags || "")).toLowerCase();
      const searchMatch = !currentSearchQuery || textContent.includes(currentSearchQuery);

      if (categoryMatch && searchMatch) {
        card.style.display = "flex";
        setTimeout(() => card.style.opacity = "1", 30);
        visibleCount++;
      } else {
        card.style.opacity = "0";
        setTimeout(() => card.style.display = "none", 200);
      }
    });

    if (fleetCountBadge) {
      fleetCountBadge.textContent = `${visibleCount} / ${projectCards.length} PROTOTYPES ONLINE`;
    }
  };

  // Category Filter Buttons
  projectFilterBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      projectFilterBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentCategory = btn.dataset.filter;
      applyFleetFilters();
      if (window.soundFX) window.soundFX.playClick();
    });
  });

  // Realtime Search Input
  if (fleetSearchInput) {
    fleetSearchInput.addEventListener("input", (e) => {
      currentSearchQuery = e.target.value.trim().toLowerCase();
      if (fleetSearchClear) {
        fleetSearchClear.style.display = currentSearchQuery ? "block" : "none";
      }
      applyFleetFilters();
    });
  }

  if (fleetSearchClear) {
    fleetSearchClear.addEventListener("click", () => {
      if (fleetSearchInput) {
        fleetSearchInput.value = "";
        currentSearchQuery = "";
        fleetSearchClear.style.display = "none";
        applyFleetFilters();
      }
    });
  }

  // Interactive Live Telemetry HUD Toggle
  const telemetryBtns = document.querySelectorAll(".telemetry-btn");
  telemetryBtns.forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const bot = btn.dataset.bot;
      const specsEl = document.getElementById(`specs-${bot}`);
      const teleEl = document.getElementById(`telemetry-${bot}`);
      btn.classList.toggle("active");

      if (teleEl && specsEl) {
        const isTelemetry = btn.classList.contains("active");
        if (isTelemetry) {
          specsEl.style.display = "none";
          teleEl.style.display = "block";
        } else {
          teleEl.style.display = "none";
          specsEl.style.display = "grid";
        }
      }
      if (window.soundFX) window.soundFX.playHover();
    });
  });

  // Realtime Live Micro-Fluctuations for Telemetry HUDs
  setInterval(() => {
    document.querySelectorAll(".project-telemetry-hud").forEach(hud => {
      // Small realistic fluctuations
      const batEl = hud.querySelector("[data-metric='bat']");
      if (batEl) {
        const v = (48.4 + Math.random() * 0.4).toFixed(1);
        batEl.textContent = `${v} V`;
      }
      const tempEl = hud.querySelector("[data-metric='temp']");
      if (tempEl) {
        const t = (41.8 + Math.random() * 0.6).toFixed(1);
        tempEl.textContent = `${t} °C`;
      }
      const rpmEl = hud.querySelector("[data-metric='rpm']");
      if (rpmEl) {
        const r = Math.floor(9900 + Math.random() * 180);
        rpmEl.textContent = r.toLocaleString();
      }
    });
  }, 1200);

  // 8. Team Category Filter
  const teamFilterBtns = document.querySelectorAll(".team-filter-btn");
  const teamCards = document.querySelectorAll(".team-card");

  teamFilterBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      teamFilterBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      const filter = btn.dataset.filter;
      teamCards.forEach(card => {
        if (filter === "all" || card.dataset.wing === filter) {
          card.style.display = "flex";
          setTimeout(() => card.style.opacity = "1", 50);
        } else {
          card.style.opacity = "0";
          setTimeout(() => card.style.display = "none", 250);
        }
      });
    });
  });

  // 9. Countdown Timer
  const countdownTarget = new Date(Date.now() + 18 * 24 * 60 * 60 * 1000 + 7 * 60 * 60 * 1000);
  const daysEl = document.getElementById("count-days");
  const hoursEl = document.getElementById("count-hours");
  const minsEl = document.getElementById("count-mins");
  const secsEl = document.getElementById("count-secs");

  setInterval(() => {
    const diff = countdownTarget - new Date();
    if (diff <= 0) return;
    if (daysEl) daysEl.textContent = String(Math.floor(diff / (1000 * 60 * 60 * 24))).padStart(2, "0");
    if (hoursEl) hoursEl.textContent = String(Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))).padStart(2, "0");
    if (minsEl) minsEl.textContent = String(Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))).padStart(2, "0");
    if (secsEl) secsEl.textContent = String(Math.floor((diff % (1000 * 60)) / 1000)).padStart(2, "0");
  }, 1000);

  // 10. Blueprint Modal Database
  const blueprintModal = document.getElementById("blueprint-modal");
  const modalCloseBtn = document.getElementById("blueprint-modal-close");
  const modalTitle = document.getElementById("blueprint-title");
  const modalCategory = document.getElementById("blueprint-category");
  const modalDesc = document.getElementById("blueprint-desc");
  const modalSpecs = document.getElementById("blueprint-specs-list");
  const modalBom = document.getElementById("blueprint-bom-list");
  const modalFormats = document.getElementById("blueprint-formats-list");

  const projectData = {
    "robobot": {
      title: "PROJECT ROBO-BOT // TACTICAL GROUND BREACHER",
      category: "Tactical Combat & All-Terrain Autonomous Rover",
      desc: "Heavy-duty dual-track all-terrain reconnaissance bot equipped with 360-degree Livox 3D LiDAR, hydraulic ram wedge, and high-torque brushless drive capable of traversing 45-degree inclines.",
      specs: [
        { label: "Chassis Configuration", val: "Titanium / Hardox Armored Dual-Track Pods" },
        { label: "Compute & AI Stack", val: "NVIDIA Jetson Orin Nano + STM32F7 FOC Controller" },
        { label: "Top Speed & Incline", val: "4.2 m/s | 45° Max Incline Traversal" },
        { label: "Sensor Array", val: "Livox Mid-360 LiDAR + FLIR Boson Thermal Imager" }
      ],
      bom: ["Dual 1.2kW Brushless Outrunners with 15:1 Planetary Reducers", "Reinforced Kevlar-Rubber Continuous Tracks", "Crossfire Dual-Band 868MHz Telemetry Link"]
    },
    "robosoccer": {
      title: "PROJECT ROBO-SOCCER // OMNI-DIRECTIONAL STRIKER",
      category: "Autonomous Multi-Agent Robotics / RoboCup SSL",
      desc: "High-speed omnidirectional soccer robot complying with RoboCup Small Size League (SSL). Features 3-wheel custom omni-drive, high-voltage solenoid ball kicker, and overhead global computer vision tracking at 60 FPS.",
      specs: [
        { label: "Kinematics", val: "3-Wheel Symmetric Omnidirectional Drive" },
        { label: "Max Velocity", val: "4.8 m/s with 6.5 m/s² Acceleration" },
        { label: "Kicking Mechanism", val: "250V Capacitive Solenoid Kicker (8 m/s Ball Velocity)" },
        { label: "Vision & Control", val: "SSL-Vision Overhead Tracking + Onboard IMU Fusion" }
      ],
      bom: ["3x Maxon EC-45 Flat Brushless Motors with Encoders", "Custom 4-Layer Solenoid Charging PCB", "Dual ESP32-S3 Real-Time Wireless Mesh Co-processors"]
    },
    "aiassistant": {
      title: "PROJECT AI PERSONAL ASSISTANT // NEXUS COMPANION",
      category: "Edge LLM Intelligence, Spatial Audio & Bionics",
      desc: "Futuristic interactive robotic assistant featuring on-device Large Language Model inference, 6-microphone circular spatial audio beamforming, and magnetic levitation visualizer.",
      specs: [
        { label: "AI Neural Core", val: "On-Device Quantized LLM (DeepSeek / Llama-3 8B Edge)" },
        { label: "Audio System", val: "6-Mic Beamforming Circular Array with Echo Cancellation" },
        { label: "Vision & Tracking", val: "Stereo Depth RealSense Camera with Face Tracking" }
      ],
      bom: ["NVIDIA Jetson AGX Orin 64GB Compute Node", "XMOS Multichannel Spatial Audio DSP", "Bilateral Magnetic Suspension Core"]
    },
    "vortex": {
      title: "PROJECT VORTEX // 60KG COMBAT SPINNER",
      category: "Heavyweight Combat Robotics",
      desc: "National Championship combat warrior equipped with a 12kg Hardox-500 kinetic energy spinning drum producing 28,000 Joules of impact force at 10,000 RPM.",
      specs: [
        { label: "Weight Category", val: "60 kg Heavyweight Class" },
        { label: "Kinetic Weapon", val: "Hardox-500 Drum (10,000 RPM / 28kJ Impact)" },
        { label: "Drivetrain", val: "4x Brushless Outrunner Motors + 8:1 Planetary Hubs" }
      ],
      bom: ["Scorpion Power Systems 130A Brushless ESC", "Vented Weapon Pulley System", "Aircraft-grade Titanium Axles"]
    },
    "skyguardian": {
      title: "PROJECT SKYGUARDIAN // AUTONOMOUS HEXACOPTER",
      category: "UAV Aerial Robotics & Computer Vision",
      desc: "Long-endurance autonomous hexacopter equipped with FLIR dual optical/thermal gimbal, RTK-GPS sub-centimeter positioning, and onboard neural YOLOv10 object tracking.",
      specs: [
        { label: "Airframe Config", val: "Foldable Carbon-Fiber Hexacopter (900mm Wheelbase)" },
        { label: "Flight Controller", val: "Cube Orange+ running ArduPilot Custom Firmware" },
        { label: "Vision Payload", val: "4K 30x Optical Zoom + Radiometric Thermal Gimbal" }
      ],
      bom: ["T-Motor U8 II 85KV High-Efficiency Motors", "22-inch Carbon Fiber Folding Propellers", "Mesh Radio Video Downlink"]
    },
    "cyberarm": {
      title: "PROJECT CYBERARM-6 // HAPTIC 6-DOF MANIPULATOR",
      category: "Industrial Kinematics & Bionics",
      desc: "Precision robotic arm with harmonic drive gearing, force torque sensing, and bilateral haptic teleoperation for delicate industrial tasks.",
      specs: [
        { label: "Degrees of Freedom", val: "6-DOF Articulated Arm" },
        { label: "Repeatability", val: "± 0.05 mm Precision" },
        { label: "Payload Capacity", val: "4.5 kg at Full 750mm Reach" }
      ],
      bom: ["Frameless Brushless Motors with 17-bit Absolute Encoders", "6-Axis Wrist Force/Torque Sensor", "EtherCAT Real-Time Bus"]
    }
  };

  // Blueprint Modal Opening with Event Delegation
  document.addEventListener("click", (e) => {
    const btn = e.target.closest(".open-blueprint-btn");
    if (!btn) return;
    e.preventDefault();
    const projId = btn.dataset.project;
    const data = projectData[projId];
    if (!data || !blueprintModal) return;

    if (modalTitle) modalTitle.textContent = data.title;
    if (modalCategory) modalCategory.textContent = data.category;
    if (modalDesc) modalDesc.textContent = data.desc;

    if (modalSpecs) {
      modalSpecs.innerHTML = data.specs.map(s => `
        <div class="spec-row">
          <span class="spec-label">${s.label}:</span>
          <span class="spec-val">${s.val}</span>
        </div>
      `).join("");
    }

    if (modalBom) {
      modalBom.innerHTML = data.bom.map(b => `
        <li class="bom-item"><i class="fa-solid fa-microchip mr-2"></i> ${b}</li>
      `).join("");
    }

    if (modalFormats) {
      const defaultFormats = ["SCHEMATIC.PDF", "STEP.3D", "GERBER.ZIP", "ARDUINO_CODE.INO"];
      modalFormats.innerHTML = defaultFormats.map(f => `
        <button class="cad-format-download-btn" data-format="${f}" data-title="${data.title}" data-id="${projId}" data-cat="${data.category}" data-desc="${data.desc}" title="Download ${f} specification">
          <i class="fa-solid fa-download mr-1"></i> ${f}
        </button>
      `).join("");
    }

    blueprintModal.classList.add("active");
    if (window.cyberAudio) window.cyberAudio.playAccessGranted();
  });

  // Global Engineering Asset Downloader Handler
  function triggerMainAssetDownload(title, formatName, id, cat, desc) {
    const cleanTitle = (title || "CLEBSCH_ASSET").replace(/[^a-zA-Z0-9_-]/g, "_").toUpperCase();
    const cleanFmt = (formatName || "SPEC").trim().toUpperCase();
    let ext = ".txt";
    let mimeType = "text/plain";
    let content = "";

    if (cleanFmt.includes("INO") || cleanFmt.includes("CODE")) {
      ext = ".ino";
      mimeType = "text/x-c";
      content = `/* ========================================================================
 * CLEBSCH ROBOTICS LAB // EMBEDDED FIRMWARE SOURCE
 * Asset: ${title} (${id || "SYS-01"})
 * Domain: ${cat || "Hardware & Microcontroller"}
 * Verified: PW IOI Lucknow Robotics Laboratory
 * ======================================================================== */

#include <Arduino.h>

#define STATUS_LED     13  // Telemetry Heartbeat

void setup() {
  Serial.begin(115200);
  while (!Serial && millis() < 2000);
  pinMode(STATUS_LED, OUTPUT);
  Serial.println(F("[CLEBSCH]: Initializing ${title}..."));
  Serial.println(F("[CLEBSCH]: System Active & Calibrated."));
}

void loop() {
  digitalWrite(STATUS_LED, HIGH);
  delay(500);
  digitalWrite(STATUS_LED, LOW);
  delay(500);
}
`;
    } else if (cleanFmt.includes("STEP") || cleanFmt.includes("3D") || cleanFmt.includes("CAD")) {
      ext = ".step";
      mimeType = "application/step";
      content = `ISO-10303-21;
HEADER;
FILE_DESCRIPTION(('CLEBSCH ROBOTICS 3D CAD MODEL', 'PRECISION ENGINEERING ASSEMBLY'), '2;1');
FILE_NAME('${cleanTitle}.STEP', '2026-08-25T12:00:00', ('CLEBSCH CAD TEAM'), ('CLEBSCH R&D LAB'), 'CLEBSCH CAD KERNEL V4', 'SOLIDWORKS / FUSION 360', '');
FILE_SCHEMA(('AUTOMOTIVE_DESIGN { 1 0 10303 214 1 1 1 1 }'));
ENDSEC;
DATA;
#10=APPLICATION_CONTEXT('core data for automotive mechanical design');
#20=PRODUCT('${cleanTitle}', '${title}', 'CLEBSCH Hardware Prototype Assembly', (#10));
#30=PRODUCT_DEFINITION_SHAPE('B-Rep Solid Body Definition', 'Solid Model', #20);
#40=SHAPE_REPRESENTATION('${cleanTitle}_GEOM', (#50, #60), #100);
#50=AXIS2_PLACEMENT_3D('Origin Coordinate System', #70, #80, #90);
#60=MANIFOLD_SOLID_BREP('${cleanTitle}_SOLID', #110);
#70=CARTESIAN_POINT('ORIGIN', (0.0, 0.0, 0.0));
#80=DIRECTION('Z_AXIS', (0.0, 0.0, 1.0));
#90=DIRECTION('X_AXIS', (1.0, 0.0, 0.0));
#100=(GEOMETRIC_REPRESENTATION_CONTEXT(3) GLOBAL_UNCERTAINTY_ASSIGNED_CONTEXT((#105)) GLOBAL_UNIT_ASSIGNED_CONTEXT((#115,#120,#125)) REPRESENTATION_CONTEXT('3D Workspace','PRECISION_CAD'));
#105=UNCERTAINTY_MEASURE_WITH_UNIT(LENGTH_MEASURE(1.E-05),#115,'distance_accuracy_value','Maximum Tolerance');
#110=CLOSED_SHELL('SOLID_SHELL', (#130,#140,#150,#160));
ENDSEC;
END-ISO-10303-21;
`;
    } else {
      ext = ".txt";
      mimeType = "text/plain";
      content = `================================================================================
CLEBSCH ROBOTICS RESEARCH COLLECTIVE // PW IOI LUCKNOW
OFFICIAL ENGINEERING SPECIFICATION DATASHEET & BLUEPRINT MANIFEST
================================================================================

COMPONENT / MODULE: ${title}
MODULE ID:          ${id || "SYS-01"}
CLASSIFICATION:     ${cat || "Robotics Engineering Asset"}
VERIFICATION:       CLEBSCH R&D Hardware Validation Lab
STATUS:             Verified / Production Ready

--------------------------------------------------------------------------------
OVERVIEW & FUNCTIONAL ARCHITECTURE
--------------------------------------------------------------------------------
${desc || "High-performance robotics module engineered for collegiate robotics competitions and laboratory research."}

================================================================================
Generated by CLEBSCH CAD Engineering System. All Rights Reserved.
================================================================================
`;
    }

    const filename = `CLEBSCH_${cleanTitle}_${cleanFmt.replace(/[^a-zA-Z0-9]/g, "_")}${ext}`;
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    if (window.cyberAudio) window.cyberAudio.playAccessGranted();
    showToast(`Downloaded: ${filename}`);
  }

  document.addEventListener("click", (e) => {
    const downloadBtn = e.target.closest(".cad-format-download-btn");
    if (downloadBtn) {
      e.preventDefault();
      e.stopPropagation();
      const formatName = downloadBtn.dataset.format;
      const title = downloadBtn.dataset.title;
      const id = downloadBtn.dataset.id;
      const cat = downloadBtn.dataset.cat;
      const desc = downloadBtn.dataset.desc;
      triggerMainAssetDownload(title, formatName, id, cat, desc);
    }
  });

  if (modalCloseBtn && blueprintModal) {
    modalCloseBtn.addEventListener("click", () => blueprintModal.classList.remove("active"));
    blueprintModal.addEventListener("click", (e) => {
      if (e.target === blueprintModal) blueprintModal.classList.remove("active");
    });
  }

  // Global ESC key to close any active modal
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      document.querySelectorAll(".cyber-modal.active").forEach(m => m.classList.remove("active"));
    }
  });

  // 11. Event Registration Modal
  const eventRegModal = document.getElementById("event-reg-modal");
  const eventCloseBtn = document.getElementById("event-modal-close");
  const eventNameEl = document.getElementById("event-reg-name");
  const eventForm = document.getElementById("event-reg-form");
  const passContainer = document.getElementById("event-pass-result");

  document.querySelectorAll(".open-event-reg-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const name = btn.dataset.eventname || "Clebsch RoboClash 2026";
      if (eventNameEl) eventNameEl.textContent = name;
      if (eventForm) eventForm.style.display = "block";
      if (passContainer) passContainer.style.display = "none";
      if (eventRegModal) eventRegModal.classList.add("active");
      if (window.cyberAudio) window.cyberAudio.playClick();
    });
  });

  if (eventCloseBtn && eventRegModal) {
    eventCloseBtn.addEventListener("click", () => eventRegModal.classList.remove("active"));
    eventRegModal.addEventListener("click", (e) => {
      if (e.target === eventRegModal) eventRegModal.classList.remove("active");
    });
  }

  if (eventForm) {
    eventForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = document.getElementById("reg-user-name").value;
      const email = document.getElementById("reg-user-email").value;
      const team = document.getElementById("reg-user-team").value;
      const passId = "CLB-" + Math.floor(100000 + Math.random() * 900000);

      eventForm.style.display = "none";
      if (passContainer) {
        passContainer.innerHTML = `
          <div style="background: var(--bg-surface-elevated); border: 1px solid var(--border-subtle); border-radius: 14px; padding: 1.8rem; text-align: center;">
            <span style="background: var(--text-primary); color: var(--bg-surface); font-family: var(--font-mono); font-size: 0.72rem; padding: 0.25rem 0.6rem; border-radius: 100px; font-weight: 700;">ENTRY PASS CONFIRMED</span>
            <h4 style="font-size: 1.3rem; margin: 1rem 0 0.4rem; color: var(--text-primary);">${name}</h4>
            <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 0.8rem;">Team: ${team || "Independent Roboticist"}</p>
            <div style="background: #fff; padding: 0.8rem; border-radius: 10px; display: inline-block; margin: 0.8rem auto;">
              <i class="fa-solid fa-qrcode fa-3x" style="color: #000;"></i>
            </div>
            <p class="font-mono text-xs" style="color: var(--text-primary); margin-top: 0.5rem;">PASS ID: ${passId}</p>
          </div>
          <button class="cyber-btn cyber-btn-primary w-full mt-4" onclick="document.getElementById('event-reg-modal').classList.remove('active')">
            <i class="fa-solid fa-check mr-2"></i> Close & Save Pass
          </button>
        `;
        passContainer.style.display = "block";
      }

      if (window.cyberAudio) window.cyberAudio.playAccessGranted();
      showToast("Registration Confirmed! Pass ID: " + passId);
    });
  }

  // 12. Contact Form Handler (Direct Telemetry Dispatch to pw.clebsch@gmail.com & pratik.varma.sot25@pwioi.com)
  const contactForm = document.getElementById("clebsch-contact-form");
  const contactResult = document.getElementById("contact-result-box");

  if (contactForm) {
    contactForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const nameInput = document.getElementById("contact-name");
      const emailInput = document.getElementById("contact-email");
      const subjectInput = document.getElementById("contact-subject");
      const msgInput = document.getElementById("contact-msg");

      const name = nameInput ? nameInput.value.trim() : "Anonymous";
      const email = emailInput ? emailInput.value.trim() : "";
      const subject = subjectInput ? subjectInput.value.trim() : "General Inquiry";
      const msg = msgInput ? msgInput.value.trim() : "";

      const refId = "TX-CLEBSCH-" + Math.floor(100000 + Math.random() * 900000);
      const timestamp = new Date().toLocaleString();

      // Store in localStorage for audit & offline retention
      try {
        const stored = JSON.parse(localStorage.getItem("clebsch_telemetry_inbox") || "[]");
        stored.unshift({ refId, timestamp, name, email, subject, msg });
        localStorage.setItem("clebsch_telemetry_inbox", JSON.stringify(stored.slice(0, 50)));
      } catch (err) {}

      // Formatted Email Payload
      const targetEmail = "pw.clebsch@gmail.com";
      const ccEmail = "pratik.varma.sot25@pwioi.com";
      const emailSubject = `[CLEBSCH INQUIRY: ${subject}] from ${name} (${refId})`;
      const emailBody = `========================================\n` +
        `CLEBSCH ROBOTICS LAB - TRANSMISSION PACKET\n` +
        `========================================\n` +
        `Reference Token: ${refId}\n` +
        `Timestamp: ${timestamp}\n\n` +
        `--- SENDER DETAILS ---\n` +
        `Full Name: ${name}\n` +
        `Email: ${email}\n` +
        `Domain: ${subject}\n\n` +
        `--- INQUIRY MESSAGE & PROPOSAL ---\n` +
        `${msg}\n\n` +
        `========================================\n` +
        `Dispatched via CLEBSCH Web Telemetry Portal`;

      const gmailComposeUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(targetEmail)}&cc=${encodeURIComponent(ccEmail)}&su=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
      const mailtoUrl = `mailto:${encodeURIComponent(targetEmail)}?cc=${encodeURIComponent(ccEmail)}&subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;

      // Reset form fields
      contactForm.reset();

      // Show confirmation & direct dispatch UI
      if (contactResult) {
        contactResult.innerHTML = `
          <div style="margin-top: 1rem; padding: 1.1rem; background: rgba(16, 185, 129, 0.1); border: 1px solid #10b981; border-radius: 12px; font-family: var(--font-mono);">
            <div style="font-weight: 700; font-size: 0.95rem; margin-bottom: 0.3rem; color: #10b981; display: flex; align-items: center; gap: 0.5rem;">
              <i class="fa-solid fa-circle-check"></i> TELEMETRY PACKET DISPATCHED
            </div>
            <p style="font-size: 0.78rem; color: var(--text-secondary); margin: 0 0 0.8rem 0; line-height: 1.4;">
              Inquiry token: <strong style="color: #ffffff;">${refId}</strong>. Data queued for <strong>pw.clebsch@gmail.com</strong> &amp; <strong>pratik.varma.sot25@pwioi.com</strong>.
            </p>
            <a href="${gmailComposeUrl}" target="_blank" rel="noopener noreferrer" class="cyber-btn cyber-btn-primary" style="display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem; width: 100%; padding: 0.55rem 1rem; font-size: 0.78rem; border-radius: 8px; text-decoration: none;">
              <i class="fa-solid fa-envelope-circle-check"></i> Open Direct Gmail Uplink
            </a>
          </div>
        `;
        contactResult.style.display = "block";
      }

      // Automatically trigger email compose tab
      try {
        window.open(gmailComposeUrl, "_blank", "noopener,noreferrer");
      } catch (err) {
        window.location.href = mailtoUrl;
      }

      if (window.cyberAudio) window.cyberAudio.playAccessGranted();
      showToast("Telemetry Dispatched to President! Token: " + refId);
    });
  }

  // 13. Recruitment Intake Form (Direct Forward to Leadership)
  const joinForm = document.getElementById("clebsch-join-form");
  const joinResult = document.getElementById("join-result-box");

  if (joinForm) {
    joinForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = document.getElementById("join-name") ? document.getElementById("join-name").value.trim() : "Cadet";
      const email = document.getElementById("join-email") ? document.getElementById("join-email").value.trim() : "";
      const wing = document.getElementById("join-wing") ? document.getElementById("join-wing").value.trim() : "General";
      const exp = document.getElementById("join-exp") ? document.getElementById("join-exp").value.trim() : "";

      const idCode = "CADET-" + Math.floor(1000 + Math.random() * 9000);
      const timestamp = new Date().toLocaleString();

      const targetEmail = "pw.clebsch@gmail.com";
      const ccEmail = "pratik.varma.sot25@pwioi.com";
      const emailSubject = `[CLEBSCH CADET INTAKE: ${wing}] from ${name} (${idCode})`;
      const emailBody = `========================================\n` +
        `CLEBSCH ROBOTICS LAB - CADET APPLICATION\n` +
        `========================================\n` +
        `Cadet ID: ${idCode}\n` +
        `Timestamp: ${timestamp}\n\n` +
        `--- CANDIDATE DETAILS ---\n` +
        `Name: ${name}\n` +
        `Email: ${email}\n` +
        `Preferred Wing: ${wing}\n\n` +
        `--- TECHNICAL BACKGROUND & EXPERIENCE ---\n` +
        `${exp}\n\n` +
        `========================================`;

      const gmailComposeUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(targetEmail)}&cc=${encodeURIComponent(ccEmail)}&su=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;

      joinForm.reset();

      if (joinResult) {
        joinResult.innerHTML = `
          <div class="intake-success-box" style="margin-top: 1.2rem; font-family: var(--font-mono);">
            <div style="font-weight: 700; font-size: 1rem; color: #10b981; margin-bottom: 0.4rem;">
              <i class="fa-solid fa-circle-check mr-2"></i> APPLICATION TRANSMITTED
            </div>
            <p style="font-size: 0.82rem; color: var(--text-muted); margin-bottom: 0.8rem;">
              Welcome, Cadet <strong>${name}</strong>. Application token: <strong style="color: #ffffff;">${idCode}</strong>.
            </p>
            <a href="${gmailComposeUrl}" target="_blank" rel="noopener noreferrer" class="cyber-btn cyber-btn-primary" style="display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem; width: 100%; padding: 0.55rem 1rem; font-size: 0.78rem; border-radius: 8px; text-decoration: none;">
              <i class="fa-solid fa-paper-plane mr-1"></i> Send Direct Application to Leadership
            </a>
          </div>
        `;
        joinResult.style.display = "block";
      }

      try {
        window.open(gmailComposeUrl, "_blank", "noopener,noreferrer");
      } catch (err) {}

      if (window.cyberAudio) window.cyberAudio.playAccessGranted();
      showToast("Application Submitted! Token: " + idCode);
    });
  }

  // 14. Email Click Handler (Opens Gmail Web Compose & Copies to clipboard)
  document.addEventListener("click", (e) => {
    const mailLink = e.target.closest('a[href^="mailto:"], a[href*="mail.google.com"]');
    if (!mailLink) return;

    let email = "";
    const href = mailLink.getAttribute("href") || "";
    if (href.startsWith("mailto:")) {
      e.preventDefault();
      email = href.replace(/^mailto:/i, "").split("?")[0].trim();
      const composeUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(email)}`;
      window.open(composeUrl, "_blank", "noopener,noreferrer");
    } else if (href.includes("mail.google.com")) {
      const match = href.match(/to=([^&]+)/);
      if (match) email = decodeURIComponent(match[1]);
    }

    if (email) {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(email).catch(() => {});
      }
      showToast(`Opening Email: ${email}`);
    }
  });

  // 15. Toast Helper
  function showToast(msg) {
    const toast = document.createElement("div");
    toast.className = "cyber-toast";
    toast.innerHTML = `<i class="fa-solid fa-robot mr-2"></i> ${msg}`;
    document.body.appendChild(toast);

    setTimeout(() => toast.classList.add("show"), 50);
    setTimeout(() => {
      toast.classList.remove("show");
      setTimeout(() => toast.remove(), 400);
    }, 4000);
  }

  window.showToast = showToast;

  // 16. Fullscreen CAD Image Lightbox Handler
  const mainLightbox = document.getElementById("main-lightbox");
  const mainLightboxImg = document.getElementById("main-lightbox-img");
  const mainLightboxCaption = document.getElementById("main-lightbox-caption");
  const mainLightboxClose = document.getElementById("main-lightbox-close");

  function openMainLightbox(src, caption) {
    if (!mainLightbox || !mainLightboxImg) return;
    mainLightboxImg.src = src;
    if (mainLightboxCaption) mainLightboxCaption.textContent = caption || "3D CAD Schematic";
    mainLightbox.style.opacity = "1";
    mainLightbox.style.pointerEvents = "auto";
    if (window.cyberAudio) window.cyberAudio.playAccessGranted();
  }

  function closeMainLightbox() {
    if (!mainLightbox) return;
    mainLightbox.style.opacity = "0";
    mainLightbox.style.pointerEvents = "none";
  }

  if (mainLightboxClose) mainLightboxClose.addEventListener("click", closeMainLightbox);
  if (mainLightbox) {
    mainLightbox.addEventListener("click", (e) => {
      if (e.target === mainLightbox || e.target === mainLightboxClose) closeMainLightbox();
    });
  }

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeMainLightbox();
  });

  // Clicking on any gallery image or wrap opens full-screen lightbox
  document.addEventListener("click", (e) => {
    const trigger = e.target.closest(".lightbox-trigger, .gallery-img-wrap");
    if (!trigger) return;

    let imgEl = trigger.tagName === "IMG" ? trigger : trigger.querySelector("img");
    if (imgEl && imgEl.src) {
      const card = trigger.closest(".gallery-card");
      const title = card ? (card.querySelector(".gallery-title")?.textContent || imgEl.alt) : imgEl.alt;
      openMainLightbox(imgEl.src, title);
    }
  });

  // 17. Guarantee Explore More & Portal Launchers open reliably + Save Scroll State
  document.addEventListener("click", (e) => {
    const exploreBtn = e.target.closest('.robot-lab-explore-cta a, .gallery-explore-cta a, a[href$="robot-lab.html"], a[href$="cad-gallery.html"], a[href$="terminal.html"]');
    if (!exploreBtn) return;

    // Save exact scroll position and section ID so user returns directly here
    sessionStorage.setItem("clebsch_return_scroll", window.scrollY.toString());
    const parentSec = exploreBtn.closest("section");
    if (parentSec && parentSec.id) {
      sessionStorage.setItem("clebsch_return_section", parentSec.id);
    }

    const targetUrl = exploreBtn.getAttribute("href");
    if (!targetUrl) return;

    if (window.cyberAudio) window.cyberAudio.playAccessGranted();
    
    // Open in new tab/window reliably across file:// and web protocols
    try {
      const newWin = window.open(targetUrl, "_blank");
      if (!newWin || newWin.closed || typeof newWin.closed === "undefined") {
        window.location.href = targetUrl;
      }
    } catch (err) {
      window.location.href = targetUrl;
    }
  });

  // 18. Command Center Explore Division Action Controller
  document.addEventListener("click", (e) => {
    const exploreBtn = e.target.closest(".cmd-explore-btn");
    if (!exploreBtn) return;

    e.preventDefault();
    e.stopPropagation();

    if (window.cyberAudio) window.cyberAudio.playAccessGranted();

    const targetWing = exploreBtn.getAttribute("data-explore-wing") || "all";
    const href = exploreBtn.getAttribute("href") || "#projects";
    const targetSectionId = href.replace("#", "");
    const targetSection = document.getElementById(targetSectionId) || document.getElementById("projects") || document.getElementById("robot-lab");

    if (targetSection) {
      // 1. Smooth scroll to target section
      targetSection.scrollIntoView({ behavior: "smooth", block: "start" });

      // 2. Automatically select the corresponding division filter in the fleet grid
      if (targetWing) {
        setTimeout(() => {
          const filterBtn = document.querySelector(`.proj-filter-btn[data-filter="${targetWing}"]`);
          if (filterBtn) {
            filterBtn.click();
          }
        }, 400);
      }

      // 3. Audio & Notification feedback
      const wingTitles = {
        "ai": "Autonomous Systems & AI Fleet",
        "combat": "Heavyweight Combat Robotics Fleet",
        "uav": "UAV & Aerial Drone Platforms"
      };
      showToast(`Command Center: Routing to ${wingTitles[targetWing] || "Engineering Division"}...`);
    }
  });

  // 19. Smart Return Scroll Controller (Restores location on return, resets to top on reload)
  function handleReturnScroll() {
    const navEntry = performance.getEntriesByType && performance.getEntriesByType("navigation")[0];
    const isReload = navEntry ? (navEntry.type === "reload") : (performance.navigation && performance.navigation.type === 1);

    // If the user refreshed/reloaded the page, always reset to the top
    if (isReload) {
      sessionStorage.removeItem("clebsch_return_scroll");
      sessionStorage.removeItem("clebsch_return_section");
      if (window.location.hash) {
        history.replaceState(null, "", window.location.pathname);
      }
      window.scrollTo(0, 0);
      return;
    }

    // Handle smooth transition when returning with a hash
    const hash = window.location.hash;
    if (hash && hash.length > 1) {
      const targetSec = document.querySelector(hash);
      if (targetSec) {
        setTimeout(() => {
          targetSec.scrollIntoView({ behavior: "smooth", block: "start" });
          // Automatically clean hash from address bar after navigation
          setTimeout(() => {
            history.replaceState(null, "", window.location.pathname);
          }, 700);
        }, 150);
        return;
      }
    }

    const savedScroll = sessionStorage.getItem("clebsch_return_scroll");
    if (savedScroll) {
      const scrollPos = parseInt(savedScroll, 10);
      if (!isNaN(scrollPos) && scrollPos > 50) {
        setTimeout(() => {
          window.scrollTo({ top: scrollPos, behavior: "smooth" });
          sessionStorage.removeItem("clebsch_return_scroll");
        }, 150);
      }
    }
  }

  handleReturnScroll();
  window.addEventListener("hashchange", handleReturnScroll);

  // 20. High-Performance 3D Scene Lazy Loader (Zero Initial Page Lag)
  function init3DLazyLoading() {
    const lazyIframes = document.querySelectorAll('iframe[data-src]');
    if (!lazyIframes.length) return;

    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const el = entry.target;
            const iframes = el.tagName === 'IFRAME' ? [el] : el.querySelectorAll('iframe[data-src]');
            iframes.forEach(iframe => {
              if (iframe.dataset.src && !iframe.src) {
                iframe.src = iframe.dataset.src;
                iframe.removeAttribute('data-src');
              }
            });
            obs.unobserve(el);
          }
        });
      }, {
        rootMargin: "450px 0px 450px 0px", // Preload before user reaches the section
        threshold: 0.01
      });

      document.querySelectorAll('#robot-lab, .robot-lab-viewport, .sketchfab-embed-wrapper').forEach(target => {
        observer.observe(target);
      });
    } else {
      // Fallback for older browsers
      lazyIframes.forEach(iframe => {
        if (iframe.dataset.src) {
          iframe.src = iframe.dataset.src;
        }
      });
    }
  }

  init3DLazyLoading();
});
