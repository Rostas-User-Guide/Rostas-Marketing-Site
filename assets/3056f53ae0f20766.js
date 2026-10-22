"use strict";

// Each demo mounts into its own root so they're isolated.
ReactDOM.createRoot(document.getElementById('demo-roles')).render(/*#__PURE__*/React.createElement(RolePreferenceDemo, null));
ReactDOM.createRoot(document.getElementById('demo-availability')).render(/*#__PURE__*/React.createElement(AvailabilityDemo, null));
ReactDOM.createRoot(document.getElementById('demo-replacement')).render(/*#__PURE__*/React.createElement(ReplacementDemo, null));
// BoardDemo is mounted INSIDE RosterBoardShowcase — merged with the static screenshot.
ReactDOM.createRoot(document.getElementById('board-showcase-root')).render(/*#__PURE__*/React.createElement(RosterBoardShowcase, null));
