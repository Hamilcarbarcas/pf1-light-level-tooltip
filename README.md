# PF1e Light Level Tooltip

A Foundry VTT module that displays the current light level when hovering over tokens on the canvas.

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
- **Enable Token Light Tooltip**: Client-side setting in the module settings menu to control whether the tooltip shows (on by default)

## Keybindings

| Action | Default Binding |
|--------|-----------------|
| Toggle Token Light Tooltip | Alt+L |

## Light Level Specifications

The module determines light levels based on a combination of scene ambient darkness and local light sources:

### Ambient Darkness Thresholds
Based on the scene's global darkness level (0 = fully bright, 1 = fully dark):

| Darkness Level | Category |
|---|---|
| 0.00 | Bright |
| 0.00 - 0.74 | Normal |
| 0.75 - 0.94 | Dim |
| 0.95 - 1.00 | Darkness |

### Local Light Sources
- **Within Bright Radius**: Upgrades location to at least **Normal** (unless already Bright)
- **Within Dim Radius**: Upgrades location to at least **Dim** (unless already brighter)
- **Outside all light sources**: Falls back to ambient darkness level

### Final Determination
The module uses the **brightest** classification from either ambient darkness or local lights. For example:
- Ambient darkness = Dim, but token is within a light source's bright radius → **Normal**
- Ambient darkness = Normal, token is in dim radius of light → **Normal** (no downgrade)
- No local lights, ambient darkness = Darkness → **Darkness**

Region-based darkness adjustments (from "Adjust Darkness Level" region behaviors) are also factored into the ambient darkness calculation.

## Compatibility

- **Minimum Foundry Version**: 13
- **Verified Version**: 13
- **Works With**: Any Foundry system (PF1e recommended for best results)

## Technical Details

The module:
- Analyzes the rendered lighting at the token's location
- Samples 4 points across the token for more accurate readings
- Distinguishes between actual light sources and vision modes
- Filters out vision-only sources (darkvision, tremorsense, etc.)
- Respects region-based darkness behaviors
