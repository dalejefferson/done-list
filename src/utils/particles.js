/**
 * Particles background effect - converted from React to vanilla JavaScript
 * Creates an interactive particle animation that responds to mouse movement
 */

function hexToRgb(hex) {
  hex = hex.replace("#", "");

  if (hex.length === 3) {
    hex = hex
      .split("")
      .map((char) => char + char)
      .join("");
  }

  const hexInt = parseInt(hex, 16);
  const red = (hexInt >> 16) & 255;
  const green = (hexInt >> 8) & 255;
  const blue = hexInt & 255;
  return [red, green, blue];
}

class Particles {
  constructor({
    container,
    quantity = 100,
    staticity = 50,
    ease = 50,
    size = 0.4,
    refresh = false,
    color = "#ffffff",
    colors = null,
    vx = 0,
    vy = 0,
  }) {
    this.quantity = quantity;
    this.staticity = staticity;
    this.ease = ease;
    this.size = size;
    this.refresh = refresh;
    // Support both single color and array of colors
    this.colors = colors || (Array.isArray(color) ? color : [color]);
    this.vx = vx;
    this.vy = vy;

    this.canvas = null;
    this.canvasContainer = container;
    this.context = null;
    this.circles = [];
    this.mouse = { x: 0, y: 0 };
    this.canvasSize = { w: 0, h: 0 };
    this.dpr = typeof window !== "undefined" ? window.devicePixelRatio : 1;
    this.mousePosition = { x: 0, y: 0 };
    this.animationFrameId = null;

    this.init();
  }

  init() {
    if (!this.canvasContainer) return;

    // Create canvas element
    this.canvas = document.createElement("canvas");
    this.canvas.className = "size-full";
    this.canvas.style.width = "100%";
    this.canvas.style.height = "100%";
    this.canvasContainer.appendChild(this.canvas);

    this.context = this.canvas.getContext("2d");
    if (!this.context) return;

    // Add mouse move listener
    this.handleMouseMove = (event) => {
      this.mousePosition = { x: event.clientX, y: event.clientY };
      this.onMouseMove();
    };

    window.addEventListener("mousemove", this.handleMouseMove);
    window.addEventListener("resize", this.handleResize);

    this.initCanvas();
    this.animate();
  }

  handleResize = () => {
    this.initCanvas();
  };

  initCanvas() {
    this.resizeCanvas();
    this.drawParticles();
  }

  onMouseMove() {
    if (this.canvas) {
      const rect = this.canvas.getBoundingClientRect();
      const { w, h } = this.canvasSize;
      const x = this.mousePosition.x - rect.left - w / 2;
      const y = this.mousePosition.y - rect.top - h / 2;
      const inside = x < w / 2 && x > -w / 2 && y < h / 2 && y > -h / 2;
      if (inside) {
        this.mouse.x = x;
        this.mouse.y = y;
      }
    }
  }

  resizeCanvas() {
    if (this.canvasContainer && this.canvas && this.context) {
      this.circles.length = 0;
      this.canvasSize.w = this.canvasContainer.offsetWidth;
      this.canvasSize.h = this.canvasContainer.offsetHeight;
      this.canvas.width = this.canvasSize.w * this.dpr;
      this.canvas.height = this.canvasSize.h * this.dpr;
      this.canvas.style.width = `${this.canvasSize.w}px`;
      this.canvas.style.height = `${this.canvasSize.h}px`;
      this.context.scale(this.dpr, this.dpr);
    }
  }

  circleParams() {
    const x = Math.floor(Math.random() * this.canvasSize.w);
    const y = Math.floor(Math.random() * this.canvasSize.h);
    const translateX = 0;
    const translateY = 0;
    const pSize = Math.floor(Math.random() * 2) + this.size;
    const alpha = 0;
    const targetAlpha = parseFloat((Math.random() * 0.6 + 0.1).toFixed(1));
    // Increased movement speed from 0.1 to 0.25 for more dynamic motion
    const dx = (Math.random() - 0.5) * 0.25;
    const dy = (Math.random() - 0.5) * 0.25;
    const magnetism = 0.1 + Math.random() * 4;
    // Randomly select a color from the palette
    const color = this.colors[Math.floor(Math.random() * this.colors.length)];

    return {
      x,
      y,
      translateX,
      translateY,
      size: pSize,
      alpha,
      targetAlpha,
      dx,
      dy,
      magnetism,
      color,
    };
  }

  drawCircle(circle, update = false) {
    if (this.context) {
      const { x, y, translateX, translateY, size, alpha, color } = circle;
      // Use the circle's individual color if available, otherwise fall back to first color
      const circleColor = color || this.colors[0];
      const rgb = hexToRgb(circleColor);

      this.context.translate(translateX, translateY);
      this.context.beginPath();
      this.context.arc(x, y, size, 0, 2 * Math.PI);
      this.context.fillStyle = `rgba(${rgb.join(", ")}, ${alpha})`;
      this.context.fill();
      this.context.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

      if (!update) {
        this.circles.push(circle);
      }
    }
  }

  clearContext() {
    if (this.context) {
      this.context.clearRect(
        0,
        0,
        this.canvasSize.w,
        this.canvasSize.h
      );
    }
  }

  drawParticles() {
    this.clearContext();
    const particleCount = this.quantity;
    for (let i = 0; i < particleCount; i++) {
      const circle = this.circleParams();
      this.drawCircle(circle);
    }
  }

  remapValue(value, start1, end1, start2, end2) {
    const remapped =
      ((value - start1) * (end2 - start2)) / (end1 - start1) + start2;
    return remapped > 0 ? remapped : 0;
  }

  animate = () => {
    this.clearContext();
    this.circles.forEach((circle, i) => {
      // Handle the alpha value
      const edge = [
        circle.x + circle.translateX - circle.size, // distance from left edge
        this.canvasSize.w - circle.x - circle.translateX - circle.size, // distance from right edge
        circle.y + circle.translateY - circle.size, // distance from top edge
        this.canvasSize.h - circle.y - circle.translateY - circle.size, // distance from bottom edge
      ];
      const closestEdge = edge.reduce((a, b) => Math.min(a, b));
      const remapClosestEdge = parseFloat(
        this.remapValue(closestEdge, 0, 20, 0, 1).toFixed(2)
      );
      if (remapClosestEdge > 1) {
        circle.alpha += 0.02;
        if (circle.alpha > circle.targetAlpha) {
          circle.alpha = circle.targetAlpha;
        }
      } else {
        circle.alpha = circle.targetAlpha * remapClosestEdge;
      }
      circle.x += circle.dx + this.vx;
      circle.y += circle.dy + this.vy;
      circle.translateX +=
        (this.mouse.x / (this.staticity / circle.magnetism) - circle.translateX) /
        this.ease;
      circle.translateY +=
        (this.mouse.y / (this.staticity / circle.magnetism) - circle.translateY) /
        this.ease;

      this.drawCircle(circle, true);

      // circle gets out of the canvas
      if (
        circle.x < -circle.size ||
        circle.x > this.canvasSize.w + circle.size ||
        circle.y < -circle.size ||
        circle.y > this.canvasSize.h + circle.size
      ) {
        // remove the circle from the array
        this.circles.splice(i, 1);
        // create a new circle
        const newCircle = this.circleParams();
        this.drawCircle(newCircle);
      }
    });
    this.animationFrameId = window.requestAnimationFrame(this.animate);
  };

  destroy() {
    if (this.animationFrameId) {
      window.cancelAnimationFrame(this.animationFrameId);
    }
    window.removeEventListener("mousemove", this.handleMouseMove);
    window.removeEventListener("resize", this.handleResize);
    if (this.canvas && this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas);
    }
  }
}

export { Particles };

