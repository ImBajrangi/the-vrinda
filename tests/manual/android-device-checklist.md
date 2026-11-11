# 📱 Android Physical Device Field-Test Checklist

**Target Devices:**
1. Low-End Hardware (e.g. Redmi 9A / Realme C-series, 2GB–3GB RAM, Android 10/11)
2. Mid-Range Hardware (e.g. Pixel 6a / Samsung Galaxy A54, 6GB–8GB RAM, Android 13/14)

---

## Field Checklist (Pass / Fail)

- [ ] **1. Fresh Session Launch**: Open `https://bhav.vrindopnishad.in` in Chrome incognito. Verify initial paint < 2.5s and zero layout jump.
- [ ] **2. 108-Bead Mala Test**: Tap Japa bead button. Verify haptic feedback (if supported), zero dropped frames, and exact counter increment. Complete 108 beads to verify mala sound and counter rollover.
- [ ] **3. Ashtayama Watch Verification**: Verify the active watch reflects current Indian Standard Time (IST) exactly.
- [ ] **4. Two-Step Epics Navigator**: Open `https://path.vrindopnishad.in`, tap Balakanda, and select Sarga 14 from the compact grid. Verify instantaneous sarga loading without freezing.
- [ ] **5. Devanagari Search Input**: Open Spotlight search, type `राधा` and transliterated `radha`. Verify matching results and keyboard dismiss on tap.
- [ ] **6. Offline & Network Interruption**: Enable Airplane Mode while reading. Verify previously loaded verses remain readable with zero blank screen crash.
- [ ] **7. Browser Backgrounding**: Background Chrome for 2 minutes while playing audio or reading; resume and verify state is intact.
- [ ] **8. 320px Viewport Verification**: Rotate / scale display font size to maximum. Verify zero horizontal scroll clipping.

