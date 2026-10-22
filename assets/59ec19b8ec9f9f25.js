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
/* RolePreferenceDemo — interactive role preference picker.
   Faithful to the production Phase4_RolePreferences.gs PWA:
   - Single flat list of role cards (not buckets)
   - Each card has a state badge + name + description
   - Tap to cycle: None → Primary → Fillable → None
   - States use the production hex colour palette exactly:
       None     bg #FEF2F2  border #FECACA  badge bg #FECACA  text #991B1B  icon ✕
       Primary  bg #E8F5EE  border #A8D5B8  badge bg #A8D5B8  text #2D7A4F  icon ✓
       Fillable bg #FFFBEB  border #F5D07A  badge bg #F5D07A  text #B45309  icon ~
   - Labels: "Not for me" / "Yes, I do this" / "Happy to fill in"

   Privacy guardrails: fake names, generic role names. */

var ROLES_INITIAL = [{
  name: 'Welcome Team',
  desc: 'Greet people at the door and hand out service sheets.',
  state: 'None'
}, {
  name: 'Coffee &amp; Hospitality',
  desc: 'Make and serve coffee before and after the service.',
  state: 'None'
}, {
  name: 'Worship Leader',
  desc: 'Lead the music team during the service.',
  state: 'None'
}, {
  name: 'Sound &amp; Tech',
  desc: 'Run the sound desk, projector and lyrics slides.',
  state: 'None'
}, {
  name: 'Setup &amp; Pack-down',
  desc: 'Set up chairs and equipment before the service.',
  state: 'None'
}];
var ROLE_CYCLE = ['None', 'Primary', 'Fillable'];
var ROLE_ICON = {
  None: "\u2715",
  Primary: "\u2713",
  Fillable: '~'
};
var ROLE_LABEL = {
  None: 'Not for me',
  Primary: 'Yes, I do this',
  Fillable: 'Happy to fill in'
};
var ROLE_CLASS = {
  None: 'rp-none',
  Primary: 'rp-primary',
  Fillable: 'rp-fillable'
};
function RolePreferenceDemo() {
  var _React$useState = React.useState('sms'),
    _React$useState2 = _slicedToArray(_React$useState, 2),
    stage = _React$useState2[0],
    setStage = _React$useState2[1];
  var _React$useState3 = React.useState(ROLES_INITIAL),
    _React$useState4 = _slicedToArray(_React$useState3, 2),
    roles = _React$useState4[0],
    setRoles = _React$useState4[1];
  var _React$useState5 = React.useState(false),
    _React$useState6 = _slicedToArray(_React$useState5, 2),
    saving = _React$useState6[0],
    setSaving = _React$useState6[1];
  function cycle(idx) {
    setRoles(function (prev) {
      return prev.map(function (r, i) {
        if (i !== idx) return r;
        var next = ROLE_CYCLE[(ROLE_CYCLE.indexOf(r.state) + 1) % ROLE_CYCLE.length];
        return _objectSpread(_objectSpread({}, r), {}, {
          state: next
        });
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
    setRoles(ROLES_INITIAL);
  }
  return /*#__PURE__*/React.createElement(PhoneFrame, {
    label: "Volunteer \xB7 Sam"
  }, stage === 'sms' && /*#__PURE__*/React.createElement(SmsRoleScreen, {
    onTap: function onTap() {
      return setStage('picker');
    }
  }), stage === 'picker' && /*#__PURE__*/React.createElement(RolePickerScreen, {
    roles: roles,
    cycle: cycle,
    onSave: save,
    saving: saving
  }), stage === 'saved' && /*#__PURE__*/React.createElement(RoleSavedScreen, {
    onReset: reset
  }));
}
function SmsRoleScreen(_ref) {
  var onTap = _ref.onTap;
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
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
  }, "Mon 9:14 AM"), /*#__PURE__*/React.createElement("div", {
    className: "sms-bubble"
  }, "Hi Sam, welcome to the team! Tell us which roles you'd love to do \u2014 only takes a moment.", /*#__PURE__*/React.createElement("div", {
    className: "link-preview",
    onClick: onTap
  }, /*#__PURE__*/React.createElement("div", {
    className: "link-title"
  }, /*#__PURE__*/React.createElement("span", {
    className: "material-symbols-rounded"
  }, "favorite"), "Set my role preferences"), /*#__PURE__*/React.createElement("div", {
    className: "link-sub"
  }, "rostas.app/roles/sam"))), /*#__PURE__*/React.createElement("div", {
    className: "sms-tap-hint"
  }, /*#__PURE__*/React.createElement("span", {
    className: "material-symbols-rounded"
  }, "touch_app"), "Tap here to see how volunteers choose their roles")));
}
function RolePickerScreen(_ref2) {
  var roles = _ref2.roles,
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
  }, "Role Preferences")), /*#__PURE__*/React.createElement("div", {
    className: "ap-greeting"
  }, /*#__PURE__*/React.createElement("div", {
    className: "name"
  }, "Hi Sam,"), /*#__PURE__*/React.createElement("div", {
    className: "instr"
  }, "Tap each role to tell us how you'd like to serve. You can update this any time.")), /*#__PURE__*/React.createElement("div", {
    className: "rp-legend"
  }, /*#__PURE__*/React.createElement("div", {
    className: "rp-legend-item"
  }, /*#__PURE__*/React.createElement("span", {
    className: "rp-legend-swatch rp-ls-red"
  }, ROLE_ICON.None), "Not for me"), /*#__PURE__*/React.createElement("div", {
    className: "rp-legend-item"
  }, /*#__PURE__*/React.createElement("span", {
    className: "rp-legend-swatch rp-ls-green"
  }, ROLE_ICON.Primary), "Yes, I do this"), /*#__PURE__*/React.createElement("div", {
    className: "rp-legend-item"
  }, /*#__PURE__*/React.createElement("span", {
    className: "rp-legend-swatch rp-ls-yellow"
  }, ROLE_ICON.Fillable), "Happy to fill in")), /*#__PURE__*/React.createElement("div", {
    className: "rp-roles-list"
  }, roles.map(function (r, i) {
    return /*#__PURE__*/React.createElement("div", {
      key: i,
      className: "rp-role-card " + ROLE_CLASS[r.state],
      onClick: function onClick() {
        return cycle(i);
      }
    }, /*#__PURE__*/React.createElement("div", {
      className: "rp-state-badge"
    }, ROLE_ICON[r.state]), /*#__PURE__*/React.createElement("div", {
      className: "rp-card-text"
    }, /*#__PURE__*/React.createElement("div", {
      className: "rp-role-name",
      dangerouslySetInnerHTML: {
        __html: r.name
      }
    }), /*#__PURE__*/React.createElement("div", {
      className: "rp-role-desc"
    }, r.desc), /*#__PURE__*/React.createElement("div", {
      className: "rp-role-state-label"
    }, ROLE_LABEL[r.state])));
  })), /*#__PURE__*/React.createElement("div", {
    className: "ap-save"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: onSave,
    disabled: saving
  }, saving ? 'Saving…' : 'Save my preferences'), /*#__PURE__*/React.createElement("span", {
    className: "hint"
  }, "You can update this any time")));
}
function RoleSavedScreen(_ref3) {
  var onReset = _ref3.onReset;
  return /*#__PURE__*/React.createElement("div", {
    className: "ap-success"
  }, /*#__PURE__*/React.createElement("span", {
    className: "check material-symbols-rounded"
  }, "check_circle"), /*#__PURE__*/React.createElement("div", {
    className: "h"
  }, "Saved \u2014 thank you!"), /*#__PURE__*/React.createElement("div", {
    className: "s"
  }, "Your role preferences are saved. We'll match you to your favourite roles first."), /*#__PURE__*/React.createElement("button", {
    className: "reset",
    onClick: onReset
  }, "Try again"));
}
window.RolePreferenceDemo = RolePreferenceDemo;
