import { useEffect, useRef } from "react";

export function useVantaWaves(reduceMotion: boolean) {
  const vantaRef = useRef<HTMLDivElement>(null);
  const vantaEffectRef = useRef<any>(null);

  useEffect(() => {
    if (reduceMotion) {
      if (vantaEffectRef.current) {
        vantaEffectRef.current.destroy();
        vantaEffectRef.current = null;
      }
      return;
    }
    // Small delay to ensure CDN scripts are fully parsed before init
    const init = () => {
      if (vantaRef.current && (window as any).VANTA && !vantaEffectRef.current) {
        try {
          vantaEffectRef.current = (window as any).VANTA.WAVES({
            el: vantaRef.current,
            mouseControls: true,
            touchControls: true,
            gyroControls: false,
            minHeight: 200.00,
            minWidth: 200.00,
            scale: 1.00,
            scaleMobile: 1.00,
            color: 0xc2d8f2, // Subtle pastel ice-blue that complements white cards and slate text
            shininess: 32.00, // Gentle silvery specular sheen on wave crests
            waveHeight: 18.00, // Elegant rolling ripples with visible 3D facets
            waveSpeed: 0.60, // Calm, relaxing liquid motion
            zoom: 0.95
          });
        } catch (err) {
          if (import.meta.env.DEV) console.error("Vanta initialization failed:", err);
        }
      }
    };
    const t = setTimeout(init, 100);
    return () => {
      clearTimeout(t);
      if (vantaEffectRef.current) {
        vantaEffectRef.current.destroy();
        vantaEffectRef.current = null;
      }
    };
  }, [reduceMotion]);

  return vantaRef;
}

