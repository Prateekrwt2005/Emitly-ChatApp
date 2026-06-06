import { useEffect, useRef } from "react";

function FullScreenReactionCanvas() {
  const canvasRef = useRef(null);
  const particlesRef = useRef([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId;
    
    // Resize handler
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Particle Class
    class Particle {
      constructor(x, y, emoji) {
        this.x = x;
        this.y = y;
        this.emoji = emoji;
        this.size = Math.random() * 20 + 20; // Size between 20px and 40px
        this.vx = (Math.random() - 0.5) * 8; // Horizontal velocity
        this.vy = -Math.random() * 10 - 8;    // Vertical velocity (upwards)
        this.gravity = 0.25;                 // Gravity pull
        this.opacity = 1.0;
        this.decay = Math.random() * 0.015 + 0.01; // Fade speed
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 0.1;
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += this.gravity;
        this.rotation += this.rotationSpeed;
        this.opacity -= this.decay;
      }

      draw(context) {
        context.save();
        context.globalAlpha = Math.max(0, this.opacity);
        context.translate(this.x, this.y);
        context.rotate(this.rotation);
        context.font = `${this.size}px Arial`;
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.fillText(this.emoji, 0, 0);
        context.restore();
      }
    }

    // Animation loop
    const tick = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const particles = particlesRef.current;
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.update();
        if (p.opacity <= 0 || p.y > canvas.height + 50) {
          particles.splice(i, 1);
        } else {
          p.draw(ctx);
        }
      }

      animationId = requestAnimationFrame(tick);
    };
    tick();

    // Trigger handler
    const handleTrigger = (e) => {
      const { emoji, x, y } = e.detail;
      const spawnX = x || window.innerWidth / 2;
      const spawnY = y || window.innerHeight * 0.8;

      // Spawn 24 particles in a burst
      for (let i = 0; i < 24; i++) {
        particlesRef.current.push(new Particle(spawnX, spawnY, emoji));
      }
    };

    window.addEventListener("trigger-reaction", handleTrigger);

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      window.removeEventListener("trigger-reaction", handleTrigger);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-50 w-full h-full"
    />
  );
}

export default FullScreenReactionCanvas;
