export const colors = {
    background: '#F4F9F6',
    surface: '#FFFFFF',
    primary: '#6FAE8C',
    primaryDark: '#4E8F6D',
    primaryLight: '#E1F0E6',
    accent: '#A8D5BA',
    accentLight: '#EAF6EE',
    success: '#6FCF97',
    danger: '#E8998D',
    dangerLight: '#FBEAE7',
    text: '#2E3A34',
    textMuted: '#7C8A83',
    border: '#DCEDE3',
    white: '#FFFFFF',
  };
  
  export const spacing = {
    xs: 6,
    sm: 12,
    md: 20,
    lg: 28,
    xl: 40,
  };
  
  export const radius = {
    sm: 10,
    md: 16,
    lg: 24,
    pill: 999,
  };
  
  export const typography = {
    title: { fontSize: 24, fontWeight: '700', color: colors.white },
    titleDark: { fontSize: 22, fontWeight: '700', color: colors.text },
    subtitle: { fontSize: 14, fontWeight: '400', color: '#E3F2E9' },
    sectionHeading: { fontSize: 16, fontWeight: '700', color: colors.primaryDark },
    body: { fontSize: 14, color: colors.text },
    cardTitle: { fontSize: 16, fontWeight: '600', color: colors.text },
    cardDescription: { fontSize: 13, color: colors.textMuted },
  };
  
  export const shadow = {
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  };
  
  export const buttonBase = {
    paddingVertical: 16,
    borderRadius: radius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  };
  
  export const categoryColors = {
    memory: { bg: '#E6E9FB', icon: '#7B84D6' },
    attention: { bg: '#DCEEFB', icon: '#4C9BD6' },
    visual_memory: { bg: '#F3DCF7', icon: '#B366C9' },
    processing_speed: { bg: '#FDE0E0', icon: '#E07A7A' },
    executive_function: { bg: '#DFF5E3', icon: '#5FAE7B' },
    bdi: { bg: '#E1E7FB', icon: '#6C7FD6' },
    sleep: { bg: '#E1E7FB', icon: '#6C7FD6' },
    weight: { bg: '#DFF5E3', icon: '#5FAE7B' },
  };