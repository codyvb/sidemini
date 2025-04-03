"use client";
import React, { useEffect, useRef, useState } from "react";

// Define types for our objects
type Vector3 = [number, number, number];

interface SpaceAnimationProps {
  imagePaths?: string[];
}

const SpaceAnimation: React.FC<SpaceAnimationProps> = ({
  imagePaths = ["/milday.png", "/eye.png"],
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const loadedRef = useRef<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(false);

  useEffect(() => {
    // Detect if we're on a mobile device
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768); // Common breakpoint for mobile
    };

    // Run once at start
    checkMobile();

    // Add listener for window resize
    window.addEventListener("resize", checkMobile);

    // Cleanup
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set up the canvas
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const halfw = canvas.width / 2;
    const halfh = canvas.height / 2;
    const warpZ = 12;
    let speed = 0.0075; // 10x slower than original

    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Create and load all the images
    const loadedImages: HTMLImageElement[] = [];

    imagePaths.forEach((path) => {
      const img = new Image();
      img.src = path;
      img.onload = () => {
        loadedRef.current = true;
      };
      loadedImages.push(img);
    });

    imagesRef.current = loadedImages;

    // Vector operations
    const vec3 = {
      fromValues: (x: number, y: number, z: number): Vector3 => [x, y, z],
      create: (): Vector3 => [0, 0, 0],
      add: (out: Vector3, a: Vector3, b: Vector3): Vector3 => {
        out[0] = a[0] + b[0];
        out[1] = a[1] + b[1];
        out[2] = a[2] + b[2];
        return out;
      },
    };

    // Helper functions
    const flr = Math.floor;

    function rnd(num1: number, num2: number): number {
      return flr(Math.random() * num2 * 2) + num1;
    }

    function getAlpha(): number {
      return Math.random() * 0.5 + 0.5; // Random alpha between 0.5 and 1
    }

    // Space object class
    class SpaceObject {
      private v: Vector3;
      private x: number;
      private y: number;
      private z: number;
      private alpha: number;
      private size: number;
      private vel: Vector3;
      private imageIndex: number; // Add an image index property

      constructor() {
        this.v = vec3.fromValues(
          rnd(0 - halfw, halfw),
          rnd(0 - halfh, halfh),
          rnd(1, warpZ)
        );
        this.x = this.v[0];
        this.y = this.v[1];
        this.z = this.v[2];
        this.alpha = getAlpha();
        // Use a smaller size range if on mobile
        this.size = isMobile
          ? rnd(15, 45) / 13.33 // 25% smaller on mobile (div by 13.33 instead of 10)
          : rnd(15, 45) / 10; // Normal size for desktop
        this.vel = this.calcVel();
        // Randomly select an image index
        this.imageIndex = Math.floor(Math.random() * imagesRef.current.length);
      }

      reset(): void {
        // When objects reset, place them far away in z to create "zooming past" effect
        this.v = vec3.fromValues(
          rnd(0 - halfw, halfw),
          rnd(0 - halfh, halfh),
          warpZ // Always start from the furthest z distance
        );
        this.x = this.v[0];
        this.y = this.v[1];
        this.alpha = getAlpha();
        // Use smaller size on mobile when resetting too
        this.size = isMobile
          ? rnd(15, 45) / 13.33 // 25% smaller on mobile
          : rnd(15, 45) / 10; // Normal size for desktop
        this.vel = this.calcVel();
        // Optionally reassign image on reset
        this.imageIndex = Math.floor(Math.random() * imagesRef.current.length);
      }

      calcVel(): Vector3 {
        // Reduced the dynamic speed factor to create a gentler effect
        const zSpeed = speed + (warpZ - this.v[2]) * 0.0001;
        return vec3.fromValues(0, 0, 0 - zSpeed);
      }

      draw(): void {
        // Make sure the selected image is loaded
        if (!imagesRef.current[this.imageIndex]?.complete) return;

        this.vel = this.calcVel();
        this.v = vec3.add(vec3.create(), this.v, this.vel);
        const x = this.v[0] / this.v[2];
        const y = this.v[1] / this.v[2];

        // Calculate size based on z-position (perspective)
        // Use a more modest scaling factor to keep images smaller
        const scaleFactor = 1 / (this.v[2] * 0.2);
        // Adjust base size based on device type
        const baseSizeMultiplier = isMobile ? 11.25 : 15; // 25% smaller on mobile (11.25 vs 15)
        const imgSize = this.size * scaleFactor * baseSizeMultiplier;

        // Draw the image using the object's image index
        if (ctx) {
          ctx.globalAlpha = this.alpha;
          ctx.drawImage(
            imagesRef.current[this.imageIndex],
            x - imgSize / 2,
            y - imgSize / 2,
            imgSize,
            imgSize
          );
          ctx.globalAlpha = 1;
        }

        if (x < 0 - halfw || x > halfw || y < 0 - halfh || y > halfh) {
          this.reset();
        }
      }
    }

    // Space field class
    class SpaceField {
      private spaceObjects: SpaceObject[] = [];

      constructor() {
        this.createField();
      }

      createField(): void {
        // Adjust the number of objects based on device
        const numOfObjects = isMobile ? 300 : 450; // Fewer objects on mobile for better performance
        for (let i = 0; i < numOfObjects; i++) {
          this.spaceObjects.push(new SpaceObject());
        }
      }

      draw(): void {
        if (this.spaceObjects.length === 0 || !ctx) return;

        ctx.translate(halfw, halfh);

        for (let i = 0; i < this.spaceObjects.length; i++) {
          const currentObject = this.spaceObjects[i];
          currentObject.draw();
        }
      }
    }

    const spaceField = new SpaceField();

    // Animation loop
    function draw(): void {
      if (!ctx) return;

      speed = 0.0008; // Significantly reduced speed for a slower zooming effect

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.fillStyle = "rgba(0,0,0,0.2)";
      ctx.fillRect(0, 0, canvas!.width, canvas!.height);

      spaceField.draw();

      animationFrameId = window.requestAnimationFrame(draw);
    }

    // Handle resize
    function handleResize(): void {
      if (!canvas) return;
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    }

    window.addEventListener("resize", handleResize);

    // Start animation
    let animationFrameId = window.requestAnimationFrame(draw);

    // Cleanup function
    return () => {
      window.cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
    };
  }, [imagePaths, isMobile]); // Added isMobile to dependencies

  return (
    <div className="relative w-full h-full">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full z-0" />
      {/* Enhanced Radial Gradient Overlay using pure Tailwind */}
      <div className="absolute inset-0 z-[1] bg-[radial-gradient(circle,rgba(0,0,0,0)_0%,rgba(0,0,0,0.3)_50%,rgba(0,0,0,0.9)_100%)]" />
      {/* Linear gradient overlay for bottom 30% of the canvas */}
      <div className="absolute bottom-0 left-0 right-0 h-[30%] z-[2] bg-gradient-to-t from-neutral-900 to-transparent" />
    </div>
  );
};

export default SpaceAnimation;
