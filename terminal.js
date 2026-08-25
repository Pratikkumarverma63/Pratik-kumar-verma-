/**
 * Clebsch Robotics - Interactive Hacker / Roboticist Terminal
 */

class ClebschTerminal {
  constructor() {
    this.output = document.getElementById('terminal-output');
    this.input = document.getElementById('terminal-input');
    this.form = document.getElementById('terminal-form');
    this.history = [];
    this.historyIndex = -1;

    if (!this.input || !this.output) return;

    this.init();
  }

  init() {
    this.form.addEventListener('submit', (e) => {
      e.preventDefault();
      const cmd = this.input.value.trim();
      if (cmd) {
        this.history.push(cmd);
        this.historyIndex = this.history.length;
        this.executeCommand(cmd);
        this.input.value = '';
      }
    });

    this.input.addEventListener('keydown', (e) => {
      if (window.cyberAudio) window.cyberAudio.playTerminalKey();

      if (e.key === 'ArrowUp') {
        if (this.historyIndex > 0) {
          this.historyIndex--;
          this.input.value = this.history[this.historyIndex] || '';
        }
      } else if (e.key === 'ArrowDown') {
        if (this.historyIndex < this.history.length - 1) {
          this.historyIndex++;
          this.input.value = this.history[this.historyIndex] || '';
        } else {
          this.historyIndex = this.history.length;
          this.input.value = '';
        }
      }
    });

    // Quick Command Buttons
    document.querySelectorAll('.term-quick-cmd').forEach(btn => {
      btn.addEventListener('click', () => {
        const cmd = btn.dataset.cmd;
        this.input.value = cmd;
        this.executeCommand(cmd);
        this.input.value = '';
        if (window.cyberAudio) window.cyberAudio.playClick();
      });
    });

    this.printInitialGreeting();
  }

  printInitialGreeting() {
    this.appendLine(`
<span class="text-dim">========================================================</span>
<span class="text-white font-bold">CLEBSCH OS v4.8 [KERNEL: NEURAL-ROS2]</span>
<span class="text-muted">Type <span class="text-white font-bold">'help'</span> for available commands or click quick prompts below.</span>
<span class="text-dim">========================================================</span>
    `, true);
  }

  appendLine(html, isRaw = false) {
    const line = document.createElement('div');
    line.className = 'terminal-line';
    if (isRaw) {
      line.innerHTML = html;
    } else {
      line.textContent = html;
    }
    this.output.appendChild(line);
    this.output.scrollTop = this.output.scrollHeight;
  }

  executeCommand(rawCmd) {
    this.appendLine(`<span class="term-prompt">guest@clebsch-core:~$</span> <span class="text-white">${this.escapeHtml(rawCmd)}</span>`, true);

    const parts = rawCmd.toLowerCase().trim().split(' ');
    const cmd = parts[0];
    const args = parts.slice(1);

    switch (cmd) {
      case 'help':
        this.appendLine(`
<span class="text-white font-bold">AVAILABLE SYSTEM COMMANDS:</span>
  <span class="text-silver">help</span>        - Display this manual
  <span class="text-silver">about</span>       - Briefing on Clebsch Robotics Club
  <span class="text-silver">wings</span>       - Technical wings &amp; specializations
  <span class="text-silver">projects</span>    - Active autonomous &amp; combat bot prototypes
  <span class="text-silver">events</span>      - Upcoming conclaves &amp; hackathons
  <span class="text-silver">team</span>        - Core leadership and architects
  <span class="text-silver">apply</span>       - Open the recruitment intake pipeline
  <span class="text-silver">ping</span>        - Check telemetry signal latency
  <span class="text-silver">matrix</span>      - Stream matrix neural code
  <span class="text-silver">clear</span>       - Wipe terminal screen
        `, true);
        break;

      case 'about':
        this.appendLine(`
<span class="text-white font-bold">[ABOUT CLEBSCH ROBOTICS]</span>
Clebsch Robotics Club is the premier collegiate engineering research collective dedicated to designing autonomous mobile robots, heavy-duty combat machines, AI drone swarms, and high-performance embedded systems.
Headquarters: Advanced Robotics Research Lab, Block-IV.
        `, true);
        break;

      case 'wings':
        this.appendLine(`
<span class="text-white font-bold">[CLEBSCH TECHNICAL WINGS]</span>
  1. <span class="text-white">AUTONOMOUS &amp; ROS</span> : 2D/3D LiDAR SLAM, Navigation2, Trajectory Tracking
  2. <span class="text-white">COMBAT ROBOTICS</span>  : 60kg Heavyweight Spinners, Pneumatic Flippers
  3. <span class="text-white">DRONES &amp; UAV</span>    : ArduPilot Autonomous Swarms, FPV Racing
  4. <span class="text-white">AI &amp; VISION</span>     : YOLOv10 Object Detection, Jetson Orin Edge ML
  5. <span class="text-white">EMBEDDED SYSTEMS</span>: STM32, ESP32 RTOS, Custom 4-Layer Motor PCBs
        `, true);
        break;

      case 'projects':
        this.appendLine(`
<span class="text-white font-bold">[ACTIVE ROBOTIC PROTOTYPES]</span>
  • <span class="text-white font-bold">Aegis-X Quadruped</span>     : 12-DOF Quadruped with Jetson Orin &amp; 3D LiDAR
  • <span class="text-white font-bold">Vortex Combat Spinner</span> : 10,000 RPM Hardox-500 Drum Weapon
  • <span class="text-white font-bold">SkyGuardian Hexacopter</span>: Autonomous thermal tracking UAV
  • <span class="text-white font-bold">CyberArm 6-DOF</span>        : 0.05mm precision haptic manipulator
        `, true);
        break;

      case 'events':
        this.appendLine(`
<span class="text-white font-bold">[UPCOMING CONCLAVES &amp; EVENTS]</span>
  • <span class="text-silver">RoboClash National Combat Wars 2026</span> (Countdown Active!)
  • <span class="text-silver">Autonomous Maze Solver &amp; Line Following GP</span>
  • <span class="text-silver">AI Drone Racing Championship</span>
  • <span class="text-silver">Winter Embedded Systems Bootcamp</span>
        `, true);
        break;

      case 'team':
        this.appendLine(`
<span class="text-white font-bold">[CLEBSCH CORE LEADERSHIP &amp; PERSONNEL]</span>
  • <span class="text-white font-bold">Pratik Kumar Verma</span>      : Club President
  • <span class="text-white font-bold">Gaurav Dey</span>              : Club Vice President
  • <span class="text-silver font-bold">Suryansh Yadav</span>          : Club Mentor
  • <span class="text-silver font-bold">Rashi Tiwari</span>            : Technical Department
  • <span class="text-silver font-bold">Saloni Kumari</span>           : R&amp;D Department
  • <span class="text-silver font-bold">Bhoomika Pal</span>            : Support &amp; Operation Executive
  • <span class="text-silver font-bold">Anurag Kumar Jaiswara</span>  : Operations Coordinator (Lab)
        `, true);
        break;

      case 'specs':
        this.appendLine(`
<span class="text-white font-bold">[SYSTEM HARDWARE TELEMETRY]</span>
  • Primary Controller : NVIDIA Jetson Orin Nano (40 TOPS AI Compute)
  • Motor Inverters    : VESC 6.0 Dual FOC Controller @ 60V 100A
  • Sensors            : Mid-360 3D LiDAR (40m range), RealSense D435i Stereo
  • Battery Chemistry  : 12S 5000mAh 75C Graphene LiPo Pack
  • Bus Architecture   : CAN-FD / EtherCAT @ 1000Hz Real-Time Loop
        `, true);
        break;

      case 'join':
      case 'apply':
        this.appendLine(`<span class="text-white">Redirecting recruitment protocol... Scrolling to Application Intake Form!</span>`, true);
        document.getElementById('join')?.scrollIntoView({ behavior: 'smooth' });
        if (window.cyberAudio) window.cyberAudio.playAccessGranted();
        break;

      case 'contact':
        this.appendLine(`
<span class="text-white font-bold">[CLEBSCH COMMUNICATIONS]</span>
  • Email   : <a href="https://mail.google.com/mail/?view=cm&fs=1&to=pw.clebsch@gmail.com" target="_blank" style="color: #10b981;">pw.clebsch@gmail.com</a>
  • Lab     : Advanced Robotics Lab, PW IOI, Platinum Mall, Lucknow
        `, true);
        break;

      case 'whoami':
        this.appendLine(`<span class="text-white">guest_cadet@clebsch-workstation [ROLE: RESEARCH CADET / GUEST]</span>`, true);
        break;

      case 'ping':
        const latency = (Math.random() * 3 + 1.2).toFixed(2);
        this.appendLine(`<span class="text-silver">PING 127.0.0.1 (neural-telemetry): seq=1 ttl=64 time=${latency} ms</span>`, true);
        this.appendLine(`<span class="text-white">STATUS: 100% PACKET INTEGRITY // ZERO JITTER</span>`, true);
        break;

      case 'matrix':
        this.appendLine(`<span class="text-silver font-mono">01000011 01001100 01000101 01000011 01010011 01000011 01001000<br/>INITIALIZING MATRIX STREAM... [ACCESS GRANTED]</span>`, true);
        if (window.cyberAudio) window.cyberAudio.playAccessGranted();
        break;

      case 'clear':
        this.output.innerHTML = '';
        break;

      default:
        this.appendLine(`<span class="text-red">Command not recognized: '${this.escapeHtml(cmd)}'. Type 'help' for manual.</span>`, true);
        break;
    }
  }

  escapeHtml(str) {
    return str.replace(/[&<>"']/g, m => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[m]));
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.clebschTerminal = new ClebschTerminal();
});
