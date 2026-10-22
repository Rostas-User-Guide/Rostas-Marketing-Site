"use strict";

function _slicedToArray(r, e) { return _arrayWithHoles(r) || _iterableToArrayLimit(r, e) || _unsupportedIterableToArray(r, e) || _nonIterableRest(); }
function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
function _iterableToArrayLimit(r, l) { var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (null != t) { var e, n, i, u, a = [], f = !0, o = !1; try { if (i = (t = t.call(r)).next, 0 === l) { if (Object(t) !== t) return; f = !1; } else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0); } catch (r) { o = !0, n = r; } finally { try { if (!f && null != t["return"] && (u = t["return"](), Object(u) !== u)) return; } finally { if (o) throw n; } } return a; } }
function _arrayWithHoles(r) { if (Array.isArray(r)) return r; }
/* Rostas marketing — Tweaks app.
   Mounts a single floating panel (via the shared TweaksPanel shell)
   that mutates the live page's DOM/CSS in response to user input.
   No persistence in here — useTweaks() handles posting __edit_mode_set_keys
   so the host writes new defaults back to disk. */

var _React = React,
  useEffect = _React.useEffect;
var TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "heroHeadline": "Automated rostering<br>with empathy.",
  "heroLede": "Rostas collects availability, builds the roster and finds replacements automatically. Volunteers answer in the Rostas app, or by text and email if they'd rather not install it. Coordinators get their evenings back. Volunteers serve alongside the people they love.",
  "ctaLabel": "Join the beta",
  "monthlyPrice": 30,
  "annualPrice": 299,
  "accent": "#b8932a",
  "navy": "#1a2e4a",
  "density": "regular",
  "showVideo": true,
  "showDeck": true,
  "showCompare": true,
  "showShowcase": true,
  "showTwoSides": true,
  "showFeatures": true,
  "showQuote": true,
  "showPricing": true,
  "showFaq": true
} /*EDITMODE-END*/;

/* ── Effects ─────────────────────────────────────────────── */

function applyTextContent(selector, html) {
  document.querySelectorAll(selector).forEach(function (el) {
    el.innerHTML = html;
  });
}
function applyNumber(selector, n) {
  document.querySelectorAll(selector).forEach(function (el) {
    el.textContent = String(n);
  });
}
function applyToggle(selector, on) {
  document.querySelectorAll(selector).forEach(function (el) {
    el.style.display = on ? '' : 'none';
  });
}
function applyVar(name, value) {
  document.documentElement.style.setProperty(name, value);
}
function applyDensity(mode) {
  var root = document.documentElement;
  root.classList.remove('tw-density-compact', 'tw-density-regular', 'tw-density-comfy');
  root.classList.add("tw-density-".concat(mode));
}
function applyCtaLabel(template) {
  var text = template;
  document.querySelectorAll('.tw-cta-primary').forEach(function (btn) {
    // keep the icon child intact, replace only the trailing text node(s)
    var icon = btn.querySelector('.material-symbols-rounded');
    btn.textContent = '';
    if (icon) btn.appendChild(icon);
    btn.appendChild(document.createTextNode(' ' + text));
  });
}

/* ── App ─────────────────────────────────────────────────── */

function TweaksApp() {
  var _useTweaks = useTweaks(TWEAK_DEFAULTS),
    _useTweaks2 = _slicedToArray(_useTweaks, 2),
    t = _useTweaks2[0],
    setTweak = _useTweaks2[1];
  useEffect(function () {
    applyTextContent('#hero-headline', t.heroHeadline);
  }, [t.heroHeadline]);
  useEffect(function () {
    applyTextContent('#hero-lede', t.heroLede);
  }, [t.heroLede]);
  useEffect(function () {
    applyCtaLabel(t.ctaLabel);
  }, [t.ctaLabel]);
  useEffect(function () {
    applyVar('--gold', t.accent);
  }, [t.accent]);
  useEffect(function () {
    applyVar('--navy', t.navy);
  }, [t.navy]);
  useEffect(function () {
    applyDensity(t.density);
  }, [t.density]);
  useEffect(function () {
    applyToggle('#video', t.showVideo);
  }, [t.showVideo]);
  useEffect(function () {
    applyToggle('#deck', t.showDeck);
  }, [t.showDeck]);
  useEffect(function () {
    applyToggle('.board-showcase', t.showShowcase);
  }, [t.showShowcase]);
  useEffect(function () {
    applyToggle('.two-sides', t.showTwoSides);
  }, [t.showTwoSides]);
  useEffect(function () {
    applyToggle('#features', t.showFeatures);
  }, [t.showFeatures]);
  useEffect(function () {
    applyToggle('.compare', t.showCompare);
  }, [t.showCompare]);
  useEffect(function () {
    applyToggle('.quote-section', t.showQuote);
  }, [t.showQuote]);
  useEffect(function () {
    applyToggle('#pricing', t.showPricing);
  }, [t.showPricing]);
  useEffect(function () {
    applyToggle('#faq', t.showFaq);
  }, [t.showFaq]);
  return /*#__PURE__*/React.createElement(TweaksPanel, null, /*#__PURE__*/React.createElement(TweakSection, {
    label: "Hero"
  }), /*#__PURE__*/React.createElement(TweakText, {
    label: "Headline (HTML ok)",
    value: t.heroHeadline,
    onChange: function onChange(v) {
      return setTweak('heroHeadline', v);
    }
  }), /*#__PURE__*/React.createElement(TweakText, {
    label: "Sub-headline",
    multiline: true,
    value: t.heroLede,
    onChange: function onChange(v) {
      return setTweak('heroLede', v);
    }
  }), /*#__PURE__*/React.createElement(TweakText, {
    label: "Primary CTA",
    value: t.ctaLabel,
    onChange: function onChange(v) {
      return setTweak('ctaLabel', v);
    }
  }), /*#__PURE__*/React.createElement(TweakSection, {
    label: "Pricing"
  }), /*#__PURE__*/React.createElement(TweakSlider, {
    label: "Monthly price",
    min: 0,
    max: 200,
    step: 5,
    value: t.monthlyPrice,
    unit: " $/mo",
    onChange: function onChange(v) {
      return setTweak('monthlyPrice', v);
    }
  }), /*#__PURE__*/React.createElement(TweakSlider, {
    label: "Annual price",
    min: 0,
    max: 1000,
    step: 5,
    value: t.annualPrice,
    unit: " $/yr",
    onChange: function onChange(v) {
      return setTweak('annualPrice', v);
    }
  }), /*#__PURE__*/React.createElement(TweakSection, {
    label: "Visual"
  }), /*#__PURE__*/React.createElement(TweakColor, {
    label: "Accent",
    value: t.accent,
    options: ['#b8932a', '#d97706', '#2a7d7b', '#4a7cd4', '#7a5cb8', '#c0392b'],
    onChange: function onChange(v) {
      return setTweak('accent', v);
    }
  }), /*#__PURE__*/React.createElement(TweakColor, {
    label: "Navy",
    value: t.navy,
    options: ['#1a2e4a', '#0d1b2a', '#15263d', '#1f2937', '#1c2541', '#0f172a'],
    onChange: function onChange(v) {
      return setTweak('navy', v);
    }
  }), /*#__PURE__*/React.createElement(TweakRadio, {
    label: "Density",
    value: t.density,
    options: ['compact', 'regular', 'comfy'],
    onChange: function onChange(v) {
      return setTweak('density', v);
    }
  }), /*#__PURE__*/React.createElement(TweakSection, {
    label: "Sections"
  }), /*#__PURE__*/React.createElement(TweakToggle, {
    label: "Intro video",
    value: t.showVideo,
    onChange: function onChange(v) {
      return setTweak('showVideo', v);
    }
  }), /*#__PURE__*/React.createElement(TweakToggle, {
    label: "Slideshow",
    value: t.showDeck,
    onChange: function onChange(v) {
      return setTweak('showDeck', v);
    }
  }), /*#__PURE__*/React.createElement(TweakToggle, {
    label: "Roster Board showcase",
    value: t.showShowcase,
    onChange: function onChange(v) {
      return setTweak('showShowcase', v);
    }
  }), /*#__PURE__*/React.createElement(TweakToggle, {
    label: "Coord / volunteer split",
    value: t.showTwoSides,
    onChange: function onChange(v) {
      return setTweak('showTwoSides', v);
    }
  }), /*#__PURE__*/React.createElement(TweakToggle, {
    label: "Features grid",
    value: t.showFeatures,
    onChange: function onChange(v) {
      return setTweak('showFeatures', v);
    }
  }), /*#__PURE__*/React.createElement(TweakToggle, {
    label: "Comparison table",
    value: t.showCompare,
    onChange: function onChange(v) {
      return setTweak('showCompare', v);
    }
  }), /*#__PURE__*/React.createElement(TweakToggle, {
    label: "Testimonial quote",
    value: t.showQuote,
    onChange: function onChange(v) {
      return setTweak('showQuote', v);
    }
  }), /*#__PURE__*/React.createElement(TweakToggle, {
    label: "Pricing",
    value: t.showPricing,
    onChange: function onChange(v) {
      return setTweak('showPricing', v);
    }
  }), /*#__PURE__*/React.createElement(TweakToggle, {
    label: "FAQ",
    value: t.showFaq,
    onChange: function onChange(v) {
      return setTweak('showFaq', v);
    }
  }));
}
window.RostasMarketingTweaks = TweaksApp;
