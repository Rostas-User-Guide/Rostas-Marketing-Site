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
/* BoardDemo — interactive mini Roster Board.
   3 weeks × 4 generic roles. Click any cell to open the action drawer;
   click Replace/Assign to pick from a small candidate list. */

var BOARD_ROLES = ['Welcome', 'Coffee', 'Worship', 'Tech'];
var INITIAL_BOARD = [
// Sun 7 Jun
{
  date: {
    d: 'Sun 7',
    m: 'Jun'
  },
  cells: [{
    name: 'Alex Morgan',
    filled: true,
    connected: true
  }, {
    name: 'Sam Patel',
    filled: true,
    connected: false
  }, {
    name: 'Priya R.',
    filled: true,
    connected: false
  }, {
    name: null,
    filled: false,
    connected: false
  }]
},
// Sun 14 Jun
{
  date: {
    d: 'Sun 14',
    m: 'Jun'
  },
  cells: [{
    name: 'Jamie Khoo',
    filled: true,
    connected: false
  }, {
    name: 'Alex Morgan',
    filled: true,
    connected: true
  }, {
    name: 'Mia Cooper',
    filled: true,
    connected: false
  }, {
    name: 'Theo Lim',
    filled: true,
    connected: false
  }]
},
// Sun 21 Jun
{
  date: {
    d: 'Sun 21',
    m: 'Jun'
  },
  cells: [{
    name: 'Priya R.',
    filled: true,
    connected: false
  }, {
    name: null,
    filled: false,
    connected: false
  }, {
    name: 'Jamie Khoo',
    filled: true,
    connected: false
  }, {
    name: 'Theo Lim',
    filled: true,
    connected: false
  }]
}];

// Candidate pools per role — fake but consistent so the demo looks real.
var CANDIDATES = {
  0: [{
    name: 'Charlotte W.',
    avail: 'Available',
    meta: '2 wk ago'
  }, {
    name: 'Daniel S.',
    avail: 'Available',
    meta: 'not yet rostered'
  }, {
    name: 'Lena M.',
    avail: 'Unsure',
    meta: '4 wk ago'
  }],
  1: [{
    name: 'Hannah B.',
    avail: 'Available',
    meta: '3 wk ago'
  }, {
    name: 'Theo Lim',
    avail: 'Available',
    meta: '1 wk ago'
  }, {
    name: 'Quinn O.',
    avail: 'Unsure',
    meta: 'not yet rostered'
  }],
  2: [{
    name: 'Marcus J.',
    avail: 'Available',
    meta: '2 wk ago'
  }, {
    name: 'Sofia D.',
    avail: 'Available',
    meta: 'not yet rostered'
  }],
  3: [{
    name: 'Ravi P.',
    avail: 'Available',
    meta: '4 wk ago'
  }, {
    name: 'Ana T.',
    avail: 'Available',
    meta: '2 wk ago'
  }, {
    name: 'Wes G.',
    avail: 'Unsure',
    meta: '6 wk ago'
  }]
};
function BoardDemo() {
  var _React$useState = React.useState(INITIAL_BOARD),
    _React$useState2 = _slicedToArray(_React$useState, 2),
    board = _React$useState2[0],
    setBoard = _React$useState2[1];
  var _React$useState3 = React.useState(null),
    _React$useState4 = _slicedToArray(_React$useState3, 2),
    selected = _React$useState4[0],
    setSelected = _React$useState4[1]; // { row, col }
  var _React$useState5 = React.useState(false),
    _React$useState6 = _slicedToArray(_React$useState5, 2),
    picker = _React$useState6[0],
    setPicker = _React$useState6[1];
  function select(row, col) {
    if (selected && selected.row === row && selected.col === col) {
      setSelected(null);
      setPicker(false);
      return;
    }
    setSelected({
      row: row,
      col: col
    });
    setPicker(false);
  }
  function openPicker() {
    setPicker(true);
  }
  function close() {
    setSelected(null);
    setPicker(false);
  }
  function pick(candidate) {
    if (!selected) return;
    setBoard(function (prev) {
      return prev.map(function (row, ri) {
        if (ri !== selected.row) return row;
        return _objectSpread(_objectSpread({}, row), {}, {
          cells: row.cells.map(function (c, ci) {
            if (ci !== selected.col) return c;
            return _objectSpread(_objectSpread({}, c), {}, {
              name: candidate.name,
              filled: true,
              connected: false
            });
          })
        });
      });
    });
    setSelected(null);
    setPicker(false);
  }
  function reset() {
    setBoard(INITIAL_BOARD);
    setSelected(null);
    setPicker(false);
  }
  var sel = selected ? board[selected.row].cells[selected.col] : null;
  var selRole = selected ? BOARD_ROLES[selected.col] : '';
  var selDate = selected ? board[selected.row].date : null;
  return /*#__PURE__*/React.createElement("div", {
    className: "mini-board"
  }, /*#__PURE__*/React.createElement("div", {
    className: "mini-board-head"
  }, /*#__PURE__*/React.createElement("div", {
    className: "t"
  }, /*#__PURE__*/React.createElement("span", {
    className: "e"
  }, "Coordinator"), /*#__PURE__*/React.createElement("span", {
    className: "h"
  }, "Roster Board")), /*#__PURE__*/React.createElement("div", {
    className: "legend"
  }, /*#__PURE__*/React.createElement("span", {
    className: "pill p-f"
  }, "Filled"), /*#__PURE__*/React.createElement("span", {
    className: "pill p-v"
  }, "Unfilled"))), /*#__PURE__*/React.createElement("div", {
    className: "mini-board-grid"
  }, /*#__PURE__*/React.createElement("div", {
    className: "corner"
  }), BOARD_ROLES.map(function (r) {
    return /*#__PURE__*/React.createElement("div", {
      key: r,
      className: "role-hdr"
    }, r);
  }), board.map(function (row, ri) {
    return /*#__PURE__*/React.createElement(React.Fragment, {
      key: ri
    }, /*#__PURE__*/React.createElement("div", {
      className: "date-cell"
    }, /*#__PURE__*/React.createElement("div", {
      className: "d"
    }, row.date.d), /*#__PURE__*/React.createElement("div", {
      className: "m"
    }, row.date.m)), row.cells.map(function (cell, ci) {
      var isSel = selected && selected.row === ri && selected.col === ci;
      return /*#__PURE__*/React.createElement("div", {
        key: ci,
        className: "vc " + (cell.filled ? 'vF' : 'vV') + (isSel ? ' selected' : ''),
        onClick: function onClick() {
          return select(ri, ci);
        }
      }, /*#__PURE__*/React.createElement("div", {
        className: "vn"
      }, cell.filled ? cell.name : 'Open'), /*#__PURE__*/React.createElement("div", {
        className: "vd"
      }, row.date.d), cell.connected && /*#__PURE__*/React.createElement("span", {
        className: "rel-icon"
      }, /*#__PURE__*/React.createElement("span", {
        className: "material-symbols-rounded"
      }, "group")));
    }), selected && selected.row === ri && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
      className: "mini-board-drawer"
    }, /*#__PURE__*/React.createElement("div", {
      className: "info"
    }, /*#__PURE__*/React.createElement("b", null, sel.filled ? sel.name : selRole + ' · Unfilled'), /*#__PURE__*/React.createElement("span", {
      className: "sep"
    }, "\xB7"), selRole, /*#__PURE__*/React.createElement("span", {
      className: "sep"
    }, "\xB7"), selDate.d, /*#__PURE__*/React.createElement("span", {
      className: "badge " + (sel.filled ? '' : 'v')
    }, sel.filled ? 'Filled' : 'Unfilled')), sel.filled ? /*#__PURE__*/React.createElement("button", {
      className: "action-btn",
      onClick: openPicker
    }, /*#__PURE__*/React.createElement("span", {
      className: "material-symbols-rounded"
    }, "swap_horiz"), "Replace") : /*#__PURE__*/React.createElement("button", {
      className: "action-btn primary",
      onClick: openPicker
    }, /*#__PURE__*/React.createElement("span", {
      className: "material-symbols-rounded"
    }, "person_add"), "Assign"), /*#__PURE__*/React.createElement("button", {
      className: "action-btn",
      onClick: close
    }, "Close")), picker && /*#__PURE__*/React.createElement("div", {
      className: "mini-board-picker"
    }, /*#__PURE__*/React.createElement("div", {
      className: "picker-head"
    }, /*#__PURE__*/React.createElement("span", {
      className: "material-symbols-rounded"
    }, "person_search"), "Available volunteers for ", selRole, " on ", selDate.d), CANDIDATES[selected.col].map(function (c, i) {
      return /*#__PURE__*/React.createElement("div", {
        key: i,
        className: "picker-row"
      }, /*#__PURE__*/React.createElement("span", {
        className: "avdot " + (c.avail === 'Available' ? 'av-g' : 'av-y')
      }), /*#__PURE__*/React.createElement("div", {
        style: {
          flex: 1
        }
      }, /*#__PURE__*/React.createElement("div", {
        className: "nm"
      }, c.name), /*#__PURE__*/React.createElement("div", {
        className: "meta"
      }, c.avail, " \xB7 ", c.meta)), /*#__PURE__*/React.createElement("button", {
        className: "sel",
        onClick: function onClick() {
          return pick(c);
        }
      }, "Select"));
    }))));
  })));
}
window.BoardDemo = BoardDemo;
