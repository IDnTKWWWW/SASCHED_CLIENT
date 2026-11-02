import { useEffect, useRef } from "react";

const LIGHT_WAVE_COLOR = 0xc2d8f2; // Subtle pastel ice-blue for light mode
const DARK_WAVE_COLOR = 0x111c35;  // Deep midnight navy with visible 3D specular wave crests for dark mode

export function useVantaWaves(
  reduceMotion: boolean,
  isAuthenticated: boolean,
  resolvedTheme: "light" | "dark" = "light"
) {
  const vantaRef = useRef<HTMLDivElement>(null);
  const vantaEffectRef = useRef<any>(null);
  const resolvedThemeRef = useRef<"light" | "dark">(resolvedTheme);
  resolvedThemeRef.current = resolvedTheme;

  // Initialize / teardown Vanta when authentication or reduceMotion changes
  useEffect(() => {
    if (!isAuthenticated || reduceMotion) {
      if (vantaEffectRef.current) {
        try {
          vantaEffectRef.current.destroy();
        } catch {
          // Ignore WebGL cleanup errors
        }
        vantaEffectRef.current = null;
      }
      return;
    }

    let attempts = 0;
    let timerId: ReturnType<typeof setTimeout> | null = null;

    const init = () => {
      if (vantaEffectRef.current) return;

      if (vantaRef.current && (window as any).VANTA?.WAVES) {
        try {
          vantaEffectRef.current = (window as any).VANTA.WAVES({
            el: vantaRef.current,
            mouseControls: true,
            touchControls: true,
            gyroControls: false,
            minHeight: 200.0,
            minWidth: 200.0,
            scale: 1.0,
            scaleMobile: 1.0,
            color:
              resolvedThemeRef.current === "dark"
                ? DARK_WAVE_COLOR
                : LIGHT_WAVE_COLOR,
            shininess: 32.0, // Gentle silvery specular sheen on wave crests
            waveHeight: 18.0, // Elegant rolling ripples with visible 3D facets
            waveSpeed: 0.6, // Calm, relaxing liquid motion
            zoom: 0.95,
          });
        } catch (err) {
          if (import.meta.env.DEV) {
            console.error("Vanta initialization failed:", err);
          }
        }
        return;
      }

      if (attempts < 20) {
        attempts += 1;
        timerId = setTimeout(init, 100);
      }
    };

    timerId = setTimeout(init, 100);

    return () => {
      if (timerId !== null) clearTimeout(timerId);
      if (vantaEffectRef.current) {
        try {
          vantaEffectRef.current.destroy();
        } catch {
          // Ignore WebGL cleanup errors
        }
        vantaEffectRef.current = null;
      }
    };
  }, [reduceMotion, isAuthenticated]);

  // Dynamically update Vanta wave color when resolvedTheme changes without recreating WebGL context
  useEffect(() => {
    const effect = vantaEffectRef.current;
    if (!effect) return;
    const nextColor =
      resolvedTheme === "dark" ? DARK_WAVE_COLOR : LIGHT_WAVE_COLOR;
    try {
      if (typeof effect.setOptions === "function") {
        effect.setOptions({ color: nextColor });
      }
    } catch {
      // Ignore if Vanta instance is mid-disposal
    }
  }, [resolvedTheme]);

  return vantaRef;
}
