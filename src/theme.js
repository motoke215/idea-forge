// 设计系统 - 统一管理颜色和样式 token
export const theme = {
  colors: {
    bg: "#E8F4FC",
    bgCard: "#FFFFFF",
    bgInput: "#FFFFFF",
    bgHover: "#F0F8FF",
    bgSettings: "#F8FBFF",

    primary: "#004488",
    primaryLight: "#87CEEB",
    border: "#B0D4E8",
    borderFocus: "#004488",

    text: "#000000",
    textSecondary: "#336699",
    textMuted: "#6699BB",
    textPlaceholder: "#88AACC",

    accent: "#00E5FF",
    success: "#34D399",
    error: "#CC4444",
    errorBg: "#FFF5F5",
  },

  fonts: {
    sans: "'IBM Plex Sans','Noto Sans SC',sans-serif",
    serif: "'Playfair Display',serif",
    mono: "'JetBrains Mono',monospace",
  },

  shadows: {
    sm: "0 0 12px rgba(135,206,235,0.7)",
    md: "0 4px 18px rgba(0,72,136,0.25)",
    lg: "0 4px 16px rgba(0,72,136,0.3)",
  },

  radius: {
    sm: 4,
    md: 6,
    lg: 8,
    xl: 12,
  },
};

// 通用按钮样式
export const btnStyles = {
  primary: {
    background: theme.colors.primary,
    color: "#FFFFFF",
    border: "none",
    borderRadius: theme.radius.md,
    padding: "0.5rem 1.2rem",
    fontSize: "0.85rem",
    cursor: "pointer",
  },
  secondary: {
    background: "transparent",
    border: `1px solid ${theme.colors.border}`,
    color: theme.colors.primary,
    borderRadius: theme.radius.sm,
    padding: "0.27rem 0.7rem",
    fontSize: "0.73rem",
    cursor: "pointer",
  },
  ghost: {
    background: "transparent",
    border: "none",
    color: theme.colors.textMuted,
    fontSize: "1.2rem",
    cursor: "pointer",
  },
};

// 复用样式生成器
export const makeInputStyle = (focused = false) => ({
  width: "100%",
  padding: "0.4rem 0.5rem",
  border: `1px solid ${focused ? theme.colors.borderFocus : theme.colors.border}`,
  borderRadius: theme.radius.sm,
  fontSize: "0.78rem",
  background: theme.colors.bgInput,
  color: theme.colors.text,
  boxSizing: "border-box",
  outline: "none",
});

export const makeCardStyle = {
  background: theme.colors.bgCard,
  border: `1px solid ${theme.colors.border}`,
  borderRadius: theme.radius.lg,
  padding: "0.8rem",
};
