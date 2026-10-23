function rgb(value) {
  const hex = /^#([\da-f]{6})$/i.exec(value || '');
  if (hex) return [0, 2, 4].map((offset) => parseInt(hex[1].slice(offset, offset + 2), 16));
  const rgba = /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)$/i.exec(value || '');
  return rgba ? [...rgba.slice(1, 4).map(Number), ...(rgba[4] == null ? [] : [Number(rgba[4])])] : null;
}

function themeDevotionalStyle(style, theme, name = '') {
  const next = { ...style };
  const foreground = rgb(style.color);
  if (foreground && Math.max(...foreground.slice(0, 3)) < 220) {
    // Keep the gold hierarchy while making the original brown text readable.
    next.color = foreground[0] > 150 && foreground[1] < 170 && foreground[2] < 90
      ? theme.accent : foreground[0] > 105 ? theme.textSecondary : theme.text;
  }
  const surface = rgb(style.backgroundColor);
  if (surface && surface[0] > 210 && surface[1] > 185 && surface[2] > 130 && (surface.length < 4 || surface[3] >= 0.45)) {
    // Low-opacity decorative glows and saturated action buttons retain their colors.
    next.backgroundColor = /overlay|background/i.test(name) ? theme.background : /selected|active|inner|alt/i.test(name) ? theme.cardAlt : theme.card;
  }
  return next;
}

module.exports = { themeDevotionalStyle };
