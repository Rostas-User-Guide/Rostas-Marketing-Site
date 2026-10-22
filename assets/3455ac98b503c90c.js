"use strict";

function _slicedToArray(r, e) { return _arrayWithHoles(r) || _iterableToArrayLimit(r, e) || _unsupportedIterableToArray(r, e) || _nonIterableRest(); }
function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
function _iterableToArrayLimit(r, l) { var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (null != t) { var e, n, i, u, a = [], f = !0, o = !1; try { if (i = (t = t.call(r)).next, 0 === l) { if (Object(t) !== t) return; f = !1; } else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0); } catch (r) { o = !0, n = r; } finally { try { if (!f && null != t["return"] && (u = t["return"](), Object(u) !== u)) return; } finally { if (o) throw n; } } return a; } }
function _arrayWithHoles(r) { if (Array.isArray(r)) return r; }
/* RosterBoardShowcase — merged static + interactive Roster Board section.
   Shows the big screenshot by default. Click → swaps in the interactive
   mini Roster Board. "Show screenshot" button to swap back. */

function RosterBoardShowcase() {
  var _React$useState = React.useState(false),
    _React$useState2 = _slicedToArray(_React$useState, 2),
    interactive = _React$useState2[0],
    setInteractive = _React$useState2[1];
  return /*#__PURE__*/React.createElement("div", {
    className: "rbs-wrap"
  }, !interactive && /*#__PURE__*/React.createElement("button", {
    className: "rbs-frame",
    onClick: function onClick() {
      return setInteractive(true);
    },
    "aria-label": "Switch to interactive Roster Board"
  }, /*#__PURE__*/React.createElement("img", {
    src: window.__resources && window.__resources.boardImg || "roster-board-04.png",
    alt: "The Rostas Roster Board showing seven Sundays of assignments across every role"
  }), /*#__PURE__*/React.createElement("div", {
    className: "rbs-overlay"
  }, /*#__PURE__*/React.createElement("div", {
    className: "rbs-overlay-card"
  }, /*#__PURE__*/React.createElement("span", {
    className: "material-symbols-rounded"
  }, "touch_app"), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "rbs-overlay-title"
  }, "Try it interactively"), /*#__PURE__*/React.createElement("div", {
    className: "rbs-overlay-sub"
  }, "Tap any cell to swap, decline or assign"))))), interactive && /*#__PURE__*/React.createElement("div", {
    className: "rbs-interactive"
  }, /*#__PURE__*/React.createElement(BoardDemo, null), /*#__PURE__*/React.createElement("button", {
    className: "rbs-back",
    onClick: function onClick() {
      return setInteractive(false);
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "material-symbols-rounded"
  }, "image"), "See the real product")), /*#__PURE__*/React.createElement("div", {
    className: "board-callouts"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bc"
  }, /*#__PURE__*/React.createElement("span", {
    className: "material-symbols-rounded"
  }, "palette"), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("b", null, "Colour-coded fill state"), /*#__PURE__*/React.createElement("p", null, "Filled green, replacement search blue, pending amber, unfilled red. One look tells you the season's health."))), /*#__PURE__*/React.createElement("div", {
    className: "bc"
  }, /*#__PURE__*/React.createElement("span", {
    className: "material-symbols-rounded"
  }, "touch_app"), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("b", null, "One-tap replacement"), /*#__PURE__*/React.createElement("p", null, "Open any cell, tap Replace, and Rostas finds a substitute without you lifting a finger."))), /*#__PURE__*/React.createElement("div", {
    className: "bc"
  }, /*#__PURE__*/React.createElement("span", {
    className: "material-symbols-rounded"
  }, "diversity_3"), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("b", null, "See relationships"), /*#__PURE__*/React.createElement("p", null, "The group icon flags households travelling together \u2014 and buddy pairs serving side-by-side."))), /*#__PURE__*/React.createElement("div", {
    className: "bc"
  }, /*#__PURE__*/React.createElement("span", {
    className: "material-symbols-rounded"
  }, "trending_up"), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("b", null, "Frequency at a glance"), /*#__PURE__*/React.createElement("p", null, "A per-volunteer counter shows ", /*#__PURE__*/React.createElement("em", null, "4 assignments / 8 weeks"), " \u2014 nobody gets over-rostered.")))));
}
window.RosterBoardShowcase = RosterBoardShowcase;
