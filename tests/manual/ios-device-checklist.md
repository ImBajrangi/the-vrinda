# 🍏 iOS Safari Physical Device Field-Test Checklist

**Target Devices:**
1. iPhone 13 / 14 / 15 / 16 (Safari iOS 17 / 18, Dynamic Island & Home Indicator)
2. iPad Air / Mini (Tablet viewport, Split View & Slide Over)

---

## Field Checklist (Pass / Fail)

- [ ] **1. Safe Area Insets**: Verify top Dynamic Island notch and bottom Home Indicator bar have proper clearance (`env(safe-area-inset-top)` & `env(safe-area-inset-bottom)`).
- [ ] **2. 120Hz ProMotion Scrolling**: Scroll through continuous stream in Valmiki Ramayana. Verify fluid 120fps with zero rubber-banding stutter or GPU blur penalty.
- [ ] **3. Apple Books-Style Header**: Verify the top title pill slides away on down-scroll and reappears smoothly on up-scroll with 300ms ease curve.
- [ ] **4. Bottom Sheet Gesture Physics**: Open Scripture Drawer. Swipe down to dismiss; verify natural 1:1 physics tracking and backdrop opacity fade.
- [ ] **5. Dynamic URL Bar Retraction**: Scroll page to bottom; verify floating navbar stays fully visible and is not clipped by Safari's dynamic bottom address bar.
- [ ] **6. Braj Lexicon Bottom Sheet**: Open Lexicon modal; verify safe bottom clearance for the Close button and verify last card is 100% visible.
- [ ] **7. PWA / Home Screen Add**: Add to Home Screen as Web App; verify standalone full-screen launch without browser chrome.

