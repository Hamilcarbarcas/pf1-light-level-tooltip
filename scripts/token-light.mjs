let tlcTooltip;

// Register setting and keybinding during init
Hooks.once("init", () => {
  // Per-client setting to control whether the tooltip shows
  game.settings.register("pf1-light-level-tooltip", "tokenLightTooltipEnabled", {
    name: "Enable Token Light Tooltip",
    hint: "Show the light category tooltip when hovering tokens.",
    scope: "client",
    config: true,
    type: Boolean,
    default: true
  });

  // Darkness thresholds for light level classification
  game.settings.register("pf1-light-level-tooltip", "darknessThresholdDim", {
    name: "Darkness Threshold: Dim → Normal",
    hint: "Global darkness level at which lighting changes from Dim to Normal (0.0 - 1.0). Default: 0.75",
    scope: "world",
    config: true,
    type: Number,
    default: 0.75,
    range: { min: 0, max: 1, step: 0.05 }
  });

  game.settings.register("pf1-light-level-tooltip", "darknessThresholdDarkness", {
    name: "Darkness Threshold: Darkness → Dim",
    hint: "Global darkness level at which lighting changes from Darkness to Dim (0.0 - 1.0). Default: 0.95",
    scope: "world",
    config: true,
    type: Number,
    default: 0.95,
    range: { min: 0, max: 1, step: 0.05 }
  });

  // Keybinding: Alt+L toggles the tooltip on/off
  game.keybindings.register("pf1-light-level-tooltip", "toggleTokenLightTooltip", {
    name: "Toggle Token Light Tooltip",
    hint: "Enable/disable showing the token light tooltip.",
    editable: [{ key: "KeyL", modifiers: ["Alt"] }],
    onDown: () => {
      const current = game.settings.get("pf1-light-level-tooltip", "tokenLightTooltipEnabled");
      const next = !current;
      game.settings.set("pf1-light-level-tooltip", "tokenLightTooltipEnabled", next);
      if (!next && tlcTooltip) tlcTooltip.style.display = "none";
      ui.notifications?.info(`Token Light Tooltip ${next ? "enabled" : "disabled"}`);
      return true;
    },
    restricted: false,
    precedence: CONST.KEYBINDING_PRECEDENCE.NORMAL
  });
});

Hooks.on("ready", () => {
  tlcTooltip = document.createElement("div");
  tlcTooltip.id = "tlc-local-light-tooltip";
  tlcTooltip.style.position = "fixed";
  tlcTooltip.style.pointerEvents = "none";
  tlcTooltip.style.zIndex = 10000;
  tlcTooltip.style.padding = "4px 6px";
  tlcTooltip.style.borderRadius = "6px";
  tlcTooltip.style.fontSize = "12px";
  tlcTooltip.style.background = "rgba(0,0,0,0.75)";
  tlcTooltip.style.color = "white";
  tlcTooltip.style.display = "none";
  document.body.appendChild(tlcTooltip);

  window.addEventListener("mousemove", (e) => {
    if (tlcTooltip.style.display !== "none") {
      tlcTooltip.style.left = `${e.clientX + 12}px`;
      tlcTooltip.style.top = `${e.clientY + 12}px`;
    }
  });
});

Hooks.on("hoverToken", (token, hovered) => {
  if (!token) return;

  // Respect user setting: hide/skip if disabled
  if (!game.settings.get("pf1-light-level-tooltip", "tokenLightTooltipEnabled")) {
    if (tlcTooltip) tlcTooltip.style.display = "none";
    return;
  }

  if (!hovered) {
    tlcTooltip.style.display = "none";
    return;
  }

  const state = getPerceivedLightStateAtToken(token);
  tlcTooltip.textContent = `Light: ${state}`;
  tlcTooltip.style.display = "block";
});

/**
 * Returns one of: "Bright" | "Normal" | "Dim" | "Darkness"
 * based on THIS CLIENT's rendered/perceived lighting.
 * This is intentionally viewer-relative (so PF1e LLV/darkvision rendering effects are reflected).
 * Also detects if the token is only visible via darkvision (no actual light).
 */
function getPerceivedLightStateAtToken(token) {
  const center = token.center;
  const elev = token.document.elevation ?? 0;

  // Calculate 4 sample points at half the distance from center to each corner
  const w = token.document.width * canvas.grid.size;
  const h = token.document.height * canvas.grid.size;
  const offsetX = w / 4;
  const offsetY = h / 4;

  const samplePoints = [
    { x: center.x + offsetX, y: center.y + offsetY },  // bottom-right quadrant
    { x: center.x + offsetX, y: center.y - offsetY },  // top-right quadrant
    { x: center.x - offsetX, y: center.y + offsetY },  // bottom-left quadrant
    { x: center.x - offsetX, y: center.y - offsetY }   // top-left quadrant
  ];

  // Test each sample point and keep the brightest result
  let brightestState = "Darkness";

  for (const pt of samplePoints) {
    const state = getLightStateAtPoint(pt, elev);
    brightestState = maxLightState(brightestState, state);
    // Early exit if we found the brightest possible
    if (brightestState === "Bright") break;
  }

  return brightestState;
}

/**
 * Get the light state at a specific point
 */
function getLightStateAtPoint(pt, elev) {
  // 1) Optional: global illumination -> PF-style ambient bucket
  // Your thresholds:
  // 0 => Bright, <.75 => Normal, .75-.95 => Dim, >=.95 => Darkness
  const giBucket = getAmbientBucketFromDarknessLevel(getDarknessAtLocation(pt.x, pt.y, elev) ?? 0);

  // 2) Local lights: check only ACTUAL light sources (exclude vision-only sources)
  // Only check sources that are explicitly light-emitting (not vision modes)
  let local = "Darkness";

  for (const source of canvas.effects.lightSources.values()) {
    if (!source?.active) continue;

    // Skip vision sources - check if this is from a token's vision vs light
    // Vision sources don't have a 'luminosity' property or it's <= 0
    if (source.data?.luminosity !== undefined && source.data.luminosity <= 0) continue;
    
    // Also skip if the source explicitly has no light emission
    const lightData = source.data;
    if (!lightData || (lightData.bright === 0 && lightData.dim === 0)) continue;

    // Skip sources that are vision-mode specific (darkvision, etc.)
    // These typically come from DetectionMode or VisionSource, not LightSource
    if (source.object?.document?.light && !source.object.document.light.dim && !source.object.document.light.bright) continue;

    // Some sources have testPoint; if not, fall back to distance only.
    if (typeof source.testPoint === "function") {
      if (!source.testPoint({ x: pt.x, y: pt.y, elevation: elev })) continue;
    }

    const bright = lightData.bright ?? 0;
    const dim = lightData.dim ?? 0;

    const dx = pt.x - source.x;
    const dy = pt.y - source.y;
    const d = Math.hypot(dx, dy);

    if (bright > 0 && d <= bright) {
      // Bright radius counts as Normal (Bright reserved for GI 0)
      local = "Normal";
      break;
    }
    if (dim > 0 && d <= dim) {
      local = "Dim";
      // don't break; a brighter classification could still be found by another source
    }
  }

  // 3) Combine: upgrade only (PF-friendly)
  // Treat GI bucket as minimum ambient; local light can be brighter.
  const finalState = maxLightState(local, giBucket);

  // Note: We still filter vision sources above, but don't append text to the tooltip
  // This keeps the light level accurate regardless of vision type (darkvision, tremorsense, etc.)

  return finalState;
}

function getAmbientBucketFromDarknessLevel(dl) {
  const thresholdDim = game.settings.get("pf1-light-level-tooltip", "darknessThresholdDim");
  const thresholdDarkness = game.settings.get("pf1-light-level-tooltip", "darknessThresholdDarkness");
  
  if (dl === 0) return "Bright";
  if (dl < thresholdDim) return "Normal";
  if (dl < thresholdDarkness) return "Dim";
  return "Darkness";
}

/**
 * Get effective darkness (0..1) at a specific scene coordinate.
 * Combines Scene global darkness with any Region "Adjust Darkness Level"
 * behaviors whose regions contain the point.
 *
 * @param {number} x - Scene pixel X
 * @param {number} y - Scene pixel Y
 * @param {number} elevation - Elevation to test against regions
 * @returns {number|null} Darkness value 0..1, or null if scene unavailable
 */
function getDarknessAtLocation(x, y, elevation = 0) {
  const scene = canvas?.scene;
  if (!scene) return null;

  const clamp01 = (n) => Math.max(0, Math.min(1, n ?? 0));

  // Base darkness from Scene global illumination
  let darkness = clamp01(scene.darkness);

  const regions = scene.regions?.contents ?? [];
  for (const region of regions) {
    if (!region.testPoint({ x, y, elevation })) continue;

    const behaviors =
      region.behaviors?.contents ??
      region.getEmbeddedCollection?.("behaviors")?.contents ??
      [];

    for (const b of behaviors) {
      if (!b?.active) continue;

      // Detect Adjust Darkness Level behavior robustly
      const isAdjustDarkness =
        (b.system?.constructor?.name === "AdjustDarknessLevelRegionBehaviorType") ||
        (b.type === "adjustDarknessLevel");

      if (!isAdjustDarkness) continue;

      const mode = b.system?.mode;              // 0=OVERRIDE, 1=BRIGHTEN, 2=DARKEN
      const mod  = clamp01(b.system?.modifier); // 0..1

      if (mode === 0) darkness = mod;                    // OVERRIDE
      else if (mode === 1) darkness = clamp01(darkness - mod); // BRIGHTEN
      else if (mode === 2) darkness = clamp01(darkness + mod); // DARKEN
    }
  }

  return darkness;
}

function maxLightState(a, b) {
  const rank = { "Darkness": 0, "Dim": 1, "Normal": 2, "Bright": 3 };
  return (rank[a] ?? 0) >= (rank[b] ?? 0) ? a : b;
}
