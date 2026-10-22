"use strict";

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { _defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
function _slicedToArray(r, e) { return _arrayWithHoles(r) || _iterableToArrayLimit(r, e) || _unsupportedIterableToArray(r, e) || _nonIterableRest(); }
function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
function _iterableToArrayLimit(r, l) { var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (null != t) { var e, n, i, u, a = [], f = !0, o = !1; try { if (i = (t = t.call(r)).next, 0 === l) { if (Object(t) !== t) return; f = !1; } else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0); } catch (r) { o = !0, n = r; } finally { try { if (!f && null != t["return"] && (u = t["return"](), Object(u) !== u)) return; } finally { if (o) throw n; } } return a; } }
function _arrayWithHoles(r) { if (Array.isArray(r)) return r; }
/* AvailabilityDemo — interactive availability picker.
   Mirrors Phase3_Availability.gs buildAvailabilityPage_().
   Stages: sms → picker → saved → reset */

var INITIAL_AVAILABILITY = [{
  m: 'Jun',
  d: 7,
  dow: 'Sun',
  status: 'Available'
}, {
  m: 'Jun',
  d: 14,
  dow: 'Sun',
  status: 'Available'
}, {
  m: 'Jun',
  d: 21,
  dow: 'Sun',
  status: 'Available'
}, {
  m: 'Jun',
  d: 28,
  dow: 'Sun',
  status: 'Available'
}, {
  m: 'Jul',
  d: 5,
  dow: 'Sun',
  status: 'Available'
}, {
  m: 'Jul',
  d: 12,
  dow: 'Sun',
  status: 'Available'
}];
var NEXT_STATUS = {
  Available: 'Unsure',
  Unsure: 'Unavailable',
  Unavailable: 'Available'
};
var STATUS_ICON = {
  Available: "\u2713",
  Unsure: '?',
  Unavailable: "\u2717"
};
var STATUS_LABEL = {
  Available: 'Available',
  Unsure: 'Not sure',
  Unavailable: "Can't make it"
};
var STATUS_CLASS = {
  Available: 'av-available',
  Unsure: 'av-unsure',
  Unavailable: 'av-unavailable'
};
function AvailabilityDemo() {
  var _React$useState = React.useState('sms'),
    _React$useState2 = _slicedToArray(_React$useState, 2),
    stage = _React$useState2[0],
    setStage = _React$useState2[1];
  var _React$useState3 = React.useState(INITIAL_AVAILABILITY),
    _React$useState4 = _slicedToArray(_React$useState3, 2),
    dates = _React$useState4[0],
    setDates = _React$useState4[1];
  var _React$useState5 = React.useState(false),
    _React$useState6 = _slicedToArray(_React$useState5, 2),
    saving = _React$useState6[0],
    setSaving = _React$useState6[1];
  function cycle(idx) {
    setDates(function (prev) {
      return prev.map(function (d, i) {
        return i === idx ? _objectSpread(_objectSpread({}, d), {}, {
          status: NEXT_STATUS[d.status]
        }) : d;
      });
    });
  }
  function save() {
    setSaving(true);
    setTimeout(function () {
      setSaving(false);
      setStage('saved');
    }, 700);
  }
  function reset() {
    setStage('sms');
    setDates(INITIAL_AVAILABILITY);
  }
  return /*#__PURE__*/React.createElement(PhoneFrame, {
    label: "Volunteer \xB7 Alex"
  }, stage === 'sms' && /*#__PURE__*/React.createElement(SmsScreen, {
    onTap: function onTap() {
      return setStage('picker');
    }
  }), stage === 'picker' && /*#__PURE__*/React.createElement(PickerScreen, {
    dates: dates,
    cycle: cycle,
    onSave: save,
    saving: saving
  }), stage === 'saved' && /*#__PURE__*/React.createElement(SavedScreen, {
    onReset: reset
  }));
}
function SmsScreen(_ref) {
  var onTap = _ref.onTap;
  return /*#__PURE__*/React.createElement("div", {
    className: "apph-screen"
  }, /*#__PURE__*/React.createElement("div", {
    className: "apph-top"
  }, /*#__PURE__*/React.createElement("img", {
    src: window.__resources && window.__resources.rmark || "favicon-rmark.png",
    alt: "",
    className: "apph-logo"
  }), /*#__PURE__*/React.createElement("div", {
    className: "apph-org"
  }, /*#__PURE__*/React.createElement("div", {
    className: "n"
  }, "Rostas"), /*#__PURE__*/React.createElement("div", {
    className: "o"
  }, "Knox Church Waitara"))), /*#__PURE__*/React.createElement("div", {
    className: "apph-hi"
  }, "Hi Alex"), /*#__PURE__*/React.createElement("div", {
    className: "apph-card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "apph-pill"
  }, /*#__PURE__*/React.createElement("span", {
    className: "material-symbols-rounded"
  }, "event_available"), "Roster"), /*#__PURE__*/React.createElement("div", {
    className: "apph-row"
  }, /*#__PURE__*/React.createElement("strong", null, "Sun, 31 May"), /*#__PURE__*/React.createElement("span", null, "Welcome team"))), /*#__PURE__*/React.createElement("div", {
    className: "apph-card apph-card--tap",
    onClick: onTap
  }, /*#__PURE__*/React.createElement("div", {
    className: "apph-pill"
  }, /*#__PURE__*/React.createElement("span", {
    className: "material-symbols-rounded"
  }, "calendar_month"), "Future availability", /*#__PURE__*/React.createElement("span", {
    className: "material-symbols-rounded chev"
  }, "chevron_right")), /*#__PURE__*/React.createElement("div", {
    className: "apph-dates"
  }, INITIAL_AVAILABILITY.map(function (d, i) {
    return /*#__PURE__*/React.createElement("div", {
      key: i,
      className: "apph-date"
    }, /*#__PURE__*/React.createElement("span", {
      className: "d"
    }, d.d), /*#__PURE__*/React.createElement("span", {
      className: "m"
    }, d.m), /*#__PURE__*/React.createElement("span", {
      className: "c"
    }, "\u2713"));
  }))), /*#__PURE__*/React.createElement("div", {
    className: "sms-tap-hint"
  }, /*#__PURE__*/React.createElement("span", {
    className: "material-symbols-rounded"
  }, "touch_app"), "Tap here to see how volunteers set their availability"));
}
function PickerScreen(_ref2) {
  var dates = _ref2.dates,
    cycle = _ref2.cycle,
    onSave = _ref2.onSave,
    saving = _ref2.saving;
  return /*#__PURE__*/React.createElement("div", {
    className: "ap-screen"
  }, /*#__PURE__*/React.createElement("div", {
    className: "ap-header"
  }, /*#__PURE__*/React.createElement("span", {
    className: "e"
  }, "Rostas"), /*#__PURE__*/React.createElement("span", {
    className: "t"
  }, "Sunday Roster"), /*#__PURE__*/React.createElement("span", {
    className: "s"
  }, "Availability")), /*#__PURE__*/React.createElement("div", {
    className: "ap-greeting"
  }, /*#__PURE__*/React.createElement("div", {
    className: "name"
  }, "Hi Alex,"), /*#__PURE__*/React.createElement("div", {
    className: "instr"
  }, "Tap any date to change. Everything starts as Available \u2014 only change the ones you can't make.")), /*#__PURE__*/React.createElement("div", {
    className: "ap-legend"
  }, /*#__PURE__*/React.createElement("div", {
    className: "ap-legend-item"
  }, /*#__PURE__*/React.createElement("span", {
    className: "ap-legend-dot ap-dot-g"
  }), "Available"), /*#__PURE__*/React.createElement("div", {
    className: "ap-legend-item"
  }, /*#__PURE__*/React.createElement("span", {
    className: "ap-legend-dot ap-dot-y"
  }), "Unsure"), /*#__PURE__*/React.createElement("div", {
    className: "ap-legend-item"
  }, /*#__PURE__*/React.createElement("span", {
    className: "ap-legend-dot ap-dot-r"
  }), "Can't make it")), /*#__PURE__*/React.createElement("div", {
    className: "ap-grid"
  }, dates.map(function (d, i) {
    return /*#__PURE__*/React.createElement("div", {
      key: i,
      className: "ap-card " + STATUS_CLASS[d.status],
      onClick: function onClick() {
        return cycle(i);
      }
    }, /*#__PURE__*/React.createElement("span", {
      className: "m"
    }, d.m), /*#__PURE__*/React.createElement("span", {
      className: "d"
    }, d.d), /*#__PURE__*/React.createElement("span", {
      className: "dow"
    }, d.dow), /*#__PURE__*/React.createElement("span", {
      className: "si"
    }, STATUS_ICON[d.status]), /*#__PURE__*/React.createElement("span", {
      className: "sl"
    }, STATUS_LABEL[d.status]));
  })), /*#__PURE__*/React.createElement("div", {
    className: "ap-tap-hint"
  }, "Click once or twice"), /*#__PURE__*/React.createElement("div", {
    className: "ap-save"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: onSave,
    disabled: saving
  }, saving ? 'Saving…' : 'Save my availability'), /*#__PURE__*/React.createElement("span", {
    className: "hint"
  }, "You can update this any time")));
}
function SavedScreen(_ref3) {
  var onReset = _ref3.onReset;
  return /*#__PURE__*/React.createElement("div", {
    className: "ap-success"
  }, /*#__PURE__*/React.createElement("span", {
    className: "check material-symbols-rounded"
  }, "check_circle"), /*#__PURE__*/React.createElement("div", {
    className: "h"
  }, "Saved \u2014 thank you!"), /*#__PURE__*/React.createElement("div", {
    className: "s"
  }, "Your availability has been recorded. You'll receive your roster by email once it's ready."), /*#__PURE__*/React.createElement("button", {
    className: "reset",
    onClick: onReset
  }, "Try again"));
}
window.AvailabilityDemo = AvailabilityDemo;
