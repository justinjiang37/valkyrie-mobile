import { TextStyle } from 'react-native';

// Inter Variable type scale — adapted from web to React Native
// Sizes 12–34px with spacing scale-aligned line heights

type TypeStyle = Pick<TextStyle, 'fontSize' | 'fontWeight' | 'lineHeight' | 'letterSpacing'>;

export const type: Record<string, TypeStyle> = {
  // 24px — primary screen header
  header: { fontSize: 24, fontWeight: '500', lineHeight: 28, letterSpacing: -0.24 },

  // 34px — screen/navigation title
  largeTitle: { fontSize: 34, fontWeight: '400', lineHeight: 40, letterSpacing: -0.68 },

  // 28px
  title1: { fontSize: 28, fontWeight: '400', lineHeight: 32, letterSpacing: -0.28 },

  // 22px
  title2: { fontSize: 22, fontWeight: '400', lineHeight: 28, letterSpacing: -0.22 },

  // 20px
  title3: { fontSize: 20, fontWeight: '400', lineHeight: 24, letterSpacing: 0 },

  // 17px semibold — list row primary label
  headline: { fontSize: 17, fontWeight: '600', lineHeight: 24, letterSpacing: 0 },

  // 17px regular — primary body
  body: { fontSize: 17, fontWeight: '400', lineHeight: 24, letterSpacing: 0 },

  // 16px — callouts, secondary content
  callout: { fontSize: 16, fontWeight: '400', lineHeight: 24, letterSpacing: 0 },
  calloutBold: { fontSize: 16, fontWeight: '600', lineHeight: 24, letterSpacing: 0 },

  // 15px
  subheadline: { fontSize: 15, fontWeight: '400', lineHeight: 20, letterSpacing: 0 },

  // 13px — footnotes, helper text
  footnote: { fontSize: 13, fontWeight: '400', lineHeight: 16, letterSpacing: 0 },

  // 12px — captions, labels, timestamps
  caption1: { fontSize: 12, fontWeight: '400', lineHeight: 16, letterSpacing: 0 },
  caption1Medium: { fontSize: 12, fontWeight: '500', lineHeight: 16, letterSpacing: 0.48 },

  // 12px — micro labels, badges (positive tracking for ALL CAPS usage)
  caption2: { fontSize: 12, fontWeight: '400', lineHeight: 16, letterSpacing: 0.48 },
  caption2Semibold: { fontSize: 12, fontWeight: '600', lineHeight: 16, letterSpacing: 0.48 },
};
