# PF1e Light Level Tooltip

A Foundry VTT module that displays the current light level when hovering over tokens on the canvas.

**Version:** 1.0.0  
**Foundry VTT Compatibility:** v13  
**Manifest URL:** `https://github.com/Hamilcarbarcas/pf1-light-level-tooltip/releases/latest/download/module.json`

## Features

- **Real-time Light Detection**: Shows the perceived light level at a token's location as you hover over it
- **Light Level Categories**: Displays one of four states:
  - **Bright** - Full illumination from global scene lighting
  - **Normal** - Lit by local light sources within bright radius
  - **Dim** - Partially lit, within dim radius of light sources
  - **Darkness** - No light, including darkvision-only conditions
- **Lighting Analysis**: 
  - Samples 4 points across the token to get accurate readings
  - Combines ambient darkness with local light sources to determine light levels
  - Accounts for region-based darkness adjustments
- **Fully Configurable**: on/off toggle via keybinding or settings

## Usage

### Hover for Tooltip
Hover your mouse over any token on the canvas and a tooltip will appear showing its light level.

### Keyboard Toggle
Press **Alt+L** to enable/disable the tooltip display.

### Settings
- **Enable Token Light Tooltip**: Client-side setting to control whether the tooltip shows (on by default)
- **Darkness Threshold: Dim → Normal**: Adjusts the darkness level at which lighting changes from Dim to Normal (default: 0.75, range: 0.0-1.0)
- **Darkness Threshold: Darkness → Dim**: Adjusts the darkness level at which lighting changes from Darkness to Dim (default: 0.95, range: 0.0-1.0)

## Keybindings

| Action | Default Binding |
|--------|-----------------|
| Toggle Token Light Tooltip | Alt+L |

## Light Level Specifications

The module determines light levels based on a combination of scene ambient darkness and local light sources:

### Ambient Darkness Thresholds
Based on the scene's global darkness level (0 = fully bright, 1 = fully dark). **These thresholds are configurable via module settings:**

| Darkness Level | Category | Setting |
|---|---|---|
| 0.00 | Bright | (Fixed) |
| 0.00 - 0.74* | Normal | Configurable |
| 0.75* - 0.94* | Dim | Configurable |
| 0.95* - 1.00 | Darkness | Configurable |

*Default values. Adjust via module settings to match your preferred lighting thresholds.

### Local Light Sources
- **Within Bright Radius**: Upgrades location to at least **Normal**
- **Within Dim Radius**: Upgrades location to at least **Dim**
- **Outside all light sources**: Falls back to ambient darkness level

Region-based darkness adjustments (from "Adjust Darkness Level" region behaviors) are also factored into the ambient darkness calculation.

## Compatibility

- **Minimum Foundry Version**: 13
- **Verified Version**: 13
- **Works With**: Any Foundry system (PF1e recommended)