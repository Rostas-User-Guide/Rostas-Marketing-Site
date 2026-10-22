"use strict";

function _slicedToArray(r, e) { return _arrayWithHoles(r) || _iterableToArrayLimit(r, e) || _unsupportedIterableToArray(r, e) || _nonIterableRest(); }
function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
function _iterableToArrayLimit(r, l) { var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (null != t) { var e, n, i, u, a = [], f = !0, o = !1; try { if (i = (t = t.call(r)).next, 0 === l) { if (Object(t) !== t) return; f = !1; } else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0); } catch (r) { o = !0, n = r; } finally { try { if (!f && null != t["return"] && (u = t["return"](), Object(u) !== u)) return; } finally { if (o) throw n; } } return a; } }
function _arrayWithHoles(r) { if (Array.isArray(r)) return r; }
/* ReplacementDemo — auto-playing SMS chain demonstration.
   Visualises the production replacement-chain flow without exposing
   the literal 4/6-tier algorithm. */

var CHAIN_STAGES = [{
  id: 'idle',
  log: []
}, {
  id: 'scoring',
  log: [{
    icon: 'search',
    text: 'Scoring available volunteers…',
    kind: 'scoring'
  }]
}, {
  id: 'sms-jamie',
  log: [{
    icon: 'check_circle',
    text: 'Best match: Jamie K.',
    kind: 'success'
  }, {
    icon: 'notifications_active',
    text: "Asked Jamie in the app\u2026",
    kind: ''
  }]
}, {
  id: 'jamie-no',
  log: [{
    icon: 'cancel',
    text: 'Jamie can\'t make it. Trying next best match.',
    kind: 'danger'
  }]
}, {
  id: 'sms-priya',
  log: [{
    icon: 'send',
    text: "Text sent to Priya R.\u2026",
    kind: ''
  }]
}, {
  id: 'priya-yes',
  log: [{
    icon: 'check_circle',
    text: 'Priya accepted!',
    kind: 'success'
  }, {
    icon: 'verified',
    text: 'Roster updated. Confirmation sent.',
    kind: 'success'
  }]
}];
function ReplacementDemo() {
  var _React$useState = React.useState(0),
    _React$useState2 = _slicedToArray(_React$useState, 2),
    stageIdx = _React$useState2[0],
    setStageIdx = _React$useState2[1];
  var _React$useState3 = React.useState(false),
    _React$useState4 = _slicedToArray(_React$useState3, 2),
    running = _React$useState4[0],
    setRunning = _React$useState4[1];
  var timeoutsRef = React.useRef([]);
  function clearTimers() {
    timeoutsRef.current.forEach(function (t) {
      return clearTimeout(t);
    });
    timeoutsRef.current = [];
  }
  function schedule(fn, ms) {
    var t = setTimeout(fn, ms);
    timeoutsRef.current.push(t);
  }
  React.useEffect(function () {
    return function () {
      return clearTimers();
    };
  }, []);
  function start() {
    if (running) return;
    setRunning(true);
    setStageIdx(1);
    schedule(function () {
      return setStageIdx(2);
    }, 1800); // SMS to Jamie
    schedule(function () {
      return setStageIdx(3);
    }, 4200); // Jamie declines
    schedule(function () {
      return setStageIdx(4);
    }, 6000); // SMS to Priya
    schedule(function () {
      return setStageIdx(5);
    }, 8400); // Priya accepts
    schedule(function () {
      return setRunning(false);
    }, 9000);
  }
  function reset() {
    clearTimers();
    setStageIdx(0);
    setRunning(false);
  }

  // Build cumulative log across all reached stages
  var visibleEntries = [];
  for (var i = 0; i <= stageIdx; i++) {
    (CHAIN_STAGES[i].log || []).forEach(function (e) {
      return visibleEntries.push(e);
    });
  }

  // Cell visual state for the coordinator board
  var cellClass = '';
  var cellName = 'Sam Patel';
  var cellMeta = 'Sun 7 Jun · Filled';
  if (stageIdx >= 1 && stageIdx <= 4) {
    cellClass = 'declined';
    cellMeta = 'Sun 7 Jun · Finding replacement';
  } else if (stageIdx === 5) {
    cellClass = 'filling';
    cellName = 'Priya R.';
    cellMeta = 'Sun 7 Jun · Confirmed';
  }
  if (stageIdx === 5) cellClass = ''; // green again

  return /*#__PURE__*/React.createElement("div", {
    className: "chain-stage"
  }, /*#__PURE__*/React.createElement("div", {
    className: "chain-coord"
  }, /*#__PURE__*/React.createElement("div", {
    className: "chain-coord-head"
  }, /*#__PURE__*/React.createElement("div", {
    className: "ic"
  }, /*#__PURE__*/React.createElement("span", {
    className: "material-symbols-rounded"
  }, "dashboard")), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "t"
  }, "Coordinator's roster"), /*#__PURE__*/React.createElement("div", {
    className: "s"
  }, "Music team \xB7 Sun 7 Jun"))), /*#__PURE__*/React.createElement("div", {
    className: "chain-cell " + cellClass
  }, /*#__PURE__*/React.createElement("div", {
    className: "role"
  }, "Welcome team"), /*#__PURE__*/React.createElement("div", {
    className: "name"
  }, cellName), /*#__PURE__*/React.createElement("div", {
    className: "meta"
  }, cellMeta)), stageIdx === 0 && /*#__PURE__*/React.createElement("div", {
    className: "chain-tap-hint"
  }, /*#__PURE__*/React.createElement("span", {
    className: "material-symbols-rounded"
  }, "touch_app"), "Tap here to see the replacement chain"), stageIdx === 0 && /*#__PURE__*/React.createElement("button", {
    className: "chain-decline-btn",
    onClick: start,
    disabled: running
  }, /*#__PURE__*/React.createElement("span", {
    className: "material-symbols-rounded"
  }, "play_circle"), "Sam can't make it \u2014 see what happens"), /*#__PURE__*/React.createElement("div", {
    className: "chain-log"
  }, visibleEntries.map(function (e, i) {
    return /*#__PURE__*/React.createElement("div", {
      key: i,
      className: "entry " + (e.kind || '')
    }, e.kind === 'scoring' ? /*#__PURE__*/React.createElement("div", {
      className: "scoring"
    }, /*#__PURE__*/React.createElement("span", {
      className: "pulse"
    }), /*#__PURE__*/React.createElement("span", null, e.text)) : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("span", {
      className: "material-symbols-rounded"
    }, e.icon), /*#__PURE__*/React.createElement("span", null, e.text)));
  })), stageIdx === 5 && /*#__PURE__*/React.createElement("button", {
    className: "chain-reset",
    onClick: reset
  }, /*#__PURE__*/React.createElement("span", {
    className: "material-symbols-rounded"
  }, "restart_alt"), "Play again")), /*#__PURE__*/React.createElement("div", {
    className: "chain-phones"
  }, /*#__PURE__*/React.createElement(AppReplacementPhone, {
    name: "Jamie",
    shown: stageIdx >= 2,
    replied: stageIdx >= 3,
    accepted: false,
    role: "Welcome team",
    date: "Sun 7 Jun"
  }), /*#__PURE__*/React.createElement(ReplacementPhone, {
    name: "Priya",
    shown: stageIdx >= 4,
    replied: stageIdx >= 5,
    accepted: true,
    role: "Welcome team",
    date: "Sun 7 Jun"
  })));
}
function ReplacementPhone(_ref) {
  var name = _ref.name,
    shown = _ref.shown,
    replied = _ref.replied,
    accepted = _ref.accepted,
    role = _ref.role,
    date = _ref.date;
  if (!shown) {
    return null;
  }
  return /*#__PURE__*/React.createElement(PhoneFrame, {
    sm: true,
    label: "Volunteer · " + name
  }, /*#__PURE__*/React.createElement("div", {
    className: "sms-header"
  }, /*#__PURE__*/React.createElement("span", {
    className: "back"
  }, "<"), /*#__PURE__*/React.createElement("div", {
    className: "contact"
  }, /*#__PURE__*/React.createElement("div", {
    className: "avatar"
  }, "R"), /*#__PURE__*/React.createElement("div", {
    className: "name"
  }, "Rostas")), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 16
    }
  })), /*#__PURE__*/React.createElement("div", {
    className: "sms-body"
  }, /*#__PURE__*/React.createElement("div", {
    className: "sms-time"
  }, "9:14 AM"), /*#__PURE__*/React.createElement("div", {
    className: "sms-bubble"
  }, "Hi ", name, ", we've had a cancellation. Can you cover ", role, " on ", date, "?", /*#__PURE__*/React.createElement("div", {
    className: "link-preview"
  }, /*#__PURE__*/React.createElement("div", {
    className: "link-title"
  }, /*#__PURE__*/React.createElement("span", {
    className: "material-symbols-rounded"
  }, "touch_app"), "Tap to respond"), /*#__PURE__*/React.createElement("div", {
    className: "link-sub"
  }, "rostas.app/r/", name.toLowerCase()))), replied && /*#__PURE__*/React.createElement("div", {
    className: "sms-bubble outgoing",
    style: {
      animation: 'log-in 0.4s ease-out'
    }
  }, accepted ? '✓ Yes, I can help' : "✗ Sorry, I can't")));
}
function AppReplacementPhone(_ref2) {
  var name = _ref2.name,
    shown = _ref2.shown,
    replied = _ref2.replied,
    role = _ref2.role,
    date = _ref2.date;
  if (!shown) return null;
  return /*#__PURE__*/React.createElement(PhoneFrame, {
    sm: true,
    label: "Volunteer · " + name + " · app"
  }, /*#__PURE__*/React.createElement("div", {
    className: "apph-screen apph-screen--dim"
  }, /*#__PURE__*/React.createElement("div", {
    className: "apph-push"
  }, /*#__PURE__*/React.createElement("img", {
    src: window.__resources && window.__resources.rmark || "favicon-rmark.png",
    alt: ""
  }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "h"
  }, /*#__PURE__*/React.createElement("strong", null, "Rostas"), /*#__PURE__*/React.createElement("span", null, "now")), /*#__PURE__*/React.createElement("div", {
    className: "b"
  }, "Can you cover ", role, " on ", date, "?"))), /*#__PURE__*/React.createElement("div", {
    className: "apph-sheet"
  }, /*#__PURE__*/React.createElement("div", {
    className: "t"
  }, "Can you help?"), /*#__PURE__*/React.createElement("div", {
    className: "q"
  }, "Can you cover ", role, " on ", date, "?"), /*#__PURE__*/React.createElement("div", {
    className: "apph-btn apph-btn--yes"
  }, "Yes, I can help"), /*#__PURE__*/React.createElement("div", {
    className: "apph-btn apph-btn--no" + (replied ? " pressed" : "")
  }, "Sorry, I can't"), replied && /*#__PURE__*/React.createElement("div", {
    className: "apph-note"
  }, "Thanks for letting us know."))));
}
window.ReplacementDemo = ReplacementDemo;
