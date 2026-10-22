"use strict";

/* PhoneFrame — minimal iOS-style device bezel.
   Used by all three marketing-site interactive demos. */

function PhoneFrame(_ref) {
  var children = _ref.children,
    label = _ref.label,
    sm = _ref.sm;
  return /*#__PURE__*/React.createElement("div", {
    className: "phone-frame" + (sm ? " sm" : "")
  }, /*#__PURE__*/React.createElement("div", {
    className: "phone-notch"
  }), /*#__PURE__*/React.createElement("div", {
    className: "phone-screen"
  }, /*#__PURE__*/React.createElement("div", {
    className: "phone-statusbar"
  }, /*#__PURE__*/React.createElement("span", null, "9:41"), /*#__PURE__*/React.createElement("span", {
    className: "phone-statusbar-r"
  }, /*#__PURE__*/React.createElement("span", {
    className: "material-symbols-rounded"
  }, "signal_cellular_alt"), /*#__PURE__*/React.createElement("span", {
    className: "material-symbols-rounded"
  }, "wifi"), /*#__PURE__*/React.createElement("span", {
    className: "material-symbols-rounded"
  }, "battery_full"))), /*#__PURE__*/React.createElement("div", {
    className: "phone-content"
  }, children)), label ? /*#__PURE__*/React.createElement("div", {
    className: "phone-label"
  }, label) : null);
}
window.PhoneFrame = PhoneFrame;
