
(function(){
  var WORKER_BASE = "https://rostas-licence.newsletters-432.workers.dev";
  var CANCEL_URL = "https://rostas.app/";

  // BETA MODE: when true, the checkout buttons show the beta message
  // (a link to the beta signup form, with an email address as a fallback)
  // instead of calling Stripe. Flip to false (and nothing else) to restore
  // live checkout once ready.
  var BETA_MODE = true;
  var BETA_EMAIL = "info@rostas.app";
  // The "Rostas Beta Testing - Sign Up" Google Form (owned by
  // rostasapp@gmail.com). Answers land in its linked sheet.
  var BETA_FORM_URL = "https://docs.google.com/forms/d/e/1FAIpQLSch73gm5QrZBWlloZc-WJffWaWDgFBKxfrKHCEiOtkgr-f93w/viewform";

  // Matched by exact visible button text -- robust even if you re-export
  // a slightly different design from Claude Design later, as long as the
  // wording stays close to this.
  //
  // "join the beta" (added 10 Oct 2026) is the wording on all three pricing
  // cards while Rostas is in beta. It has no plan, so it ALWAYS opens the
  // beta message and can never start a checkout, even if BETA_MODE is
  // switched off while the buttons still carry that wording. It is matched
  // only inside the pricing section, so the top-menu "Join the beta" button
  // keeps scrolling to pricing. When signups open, rename the three card
  // buttons in Claude Design back to the wording below, then flip BETA_MODE.
  var BUTTON_MATCHERS = [
    { text: "join the beta",     plan: null, pricingOnly: true },
    { text: "start free trial",  plan: "monthly" },
    { text: "subscribe monthly", plan: "monthly" },
    { text: "subscribe annually", plan: "annual" }
  ];

  // True when the element sits inside the pricing section. If the page has
  // no element with id "pricing" at all (a future export renamed it), this
  // returns true for everything, so the buttons are still wired rather than
  // silently left dead.
  function inPricing(el){
    var section = document.getElementById("pricing");
    return !section || section.contains(el);
  }

  function findCandidates(){
    var els = document.querySelectorAll("a.btn, button.btn");
    var out = [];
    for (var i = 0; i < els.length; i++){
      var el = els[i];
      if (el.getAttribute("data-rostas-wired")) continue;
      var text = (el.textContent || "").trim().toLowerCase();
      for (var j = 0; j < BUTTON_MATCHERS.length; j++){
        if (text === BUTTON_MATCHERS[j].text){
          if (BUTTON_MATCHERS[j].pricingOnly && !inPricing(el)) break;
          out.push({ el: el, plan: BUTTON_MATCHERS[j].plan });
          break;
        }
      }
    }
    return out;
  }

  function wireButton(el, plan){
    el.setAttribute("data-rostas-wired", "1");
    el.addEventListener("click", function(e){
      e.preventDefault();
      if (BETA_MODE || !plan){
        showBetaModal();
      } else {
        startCheckout(el, plan);
      }
    });
  }

  function showBetaModal(){
    if (document.getElementById("rostas-beta-modal")) return;

    var overlay = document.createElement("div");
    overlay.id = "rostas-beta-modal";
    overlay.setAttribute("style", [
      "position:fixed", "inset:0", "z-index:99999",
      "background:rgba(17,32,58,0.55)",
      "display:flex", "align-items:center", "justify-content:center",
      "padding:20px", "font-family:'DM Sans',system-ui,sans-serif"
    ].join(";"));

    var box = document.createElement("div");
    box.setAttribute("style", [
      "background:#ffffff", "border-radius:16px", "max-width:420px",
      "width:100%", "padding:32px", "box-shadow:0 20px 60px rgba(0,0,0,0.3)",
      "text-align:center"
    ].join(";"));

    var heading = document.createElement("h3");
    heading.textContent = "Join the Rostas beta";
    heading.setAttribute("style", [
      "font-family:'Lora',serif", "color:#1a2e4a", "font-size:22px",
      "margin:0 0 12px 0"
    ].join(";"));

    // Wording agreed with Guy 12 Oct 2026: first group is five New Zealand
    // churches; no subscription charge in the beta, texts are still paid for.
    var body = document.createElement("p");
    body.setAttribute("style", "color:#3d4a5c;font-size:15px;line-height:1.5;margin:0 0 20px 0;");
    body.textContent = "We're starting with five New Zealand churches. There's no subscription charge during the beta, and you pay only for the texts you send. Tell us about your church and we'll be in touch.";

    var formLink = document.createElement("a");
    formLink.id = "rostas-beta-form-link";
    formLink.href = BETA_FORM_URL;
    formLink.target = "_blank";
    formLink.rel = "noopener";
    formLink.textContent = "Tell us about your church";
    formLink.setAttribute("style", [
      "display:block", "background:#b8932a", "color:#ffffff",
      "border-radius:8px", "padding:12px 24px", "font-size:15px",
      "font-weight:600", "text-decoration:none", "margin:0 0 14px 0"
    ].join(";"));

    var alt = document.createElement("p");
    alt.setAttribute("style", "color:#6b7686;font-size:13px;line-height:1.5;margin:0 0 20px 0;");
    alt.appendChild(document.createTextNode("Or email "));
    var link = document.createElement("a");
    link.href = "mailto:" + BETA_EMAIL;
    link.textContent = BETA_EMAIL;
    link.setAttribute("style", "color:#b8932a;font-weight:600;text-decoration:none;");
    alt.appendChild(link);

    var closeBtn = document.createElement("button");
    closeBtn.textContent = "Close";
    closeBtn.setAttribute("style", [
      "background:transparent", "color:#1a2e4a", "border:1px solid #c9d1dc",
      "border-radius:8px", "padding:10px 24px", "font-size:14px",
      "font-weight:600", "cursor:pointer"
    ].join(";"));
    closeBtn.addEventListener("click", closeModal);

    function closeModal(){
      if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
      document.removeEventListener("keydown", onKeydown);
    }
    function onKeydown(e){
      if (e.key === "Escape") closeModal();
    }
    overlay.addEventListener("click", function(e){
      if (e.target === overlay) closeModal();
    });
    document.addEventListener("keydown", onKeydown);

    box.appendChild(heading);
    box.appendChild(body);
    box.appendChild(formLink);
    box.appendChild(alt);
    box.appendChild(closeBtn);
    overlay.appendChild(box);
    document.body.appendChild(overlay);
  }

  function startCheckout(el, plan){
    if (el.getAttribute("data-rostas-loading")) return;
    el.setAttribute("data-rostas-loading", "1");
    var originalText = el.textContent;
    el.textContent = "Redirecting…";
    fetch(WORKER_BASE + "/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "subscription",
        plan: plan,
        cancelUrl: CANCEL_URL
      })
    }).then(function(r){ return r.json(); })
      .then(function(data){
        if (data && data.ok && data.url){
          window.location.href = data.url;
        } else {
          el.textContent = "Try again";
          el.removeAttribute("data-rostas-loading");
          console.error("[rostas checkout]", data);
        }
      })
      .catch(function(err){
        el.textContent = "Try again";
        el.removeAttribute("data-rostas-loading");
        console.error("[rostas checkout]", err);
      });
  }

  function scan(){
    var found = findCandidates();
    for (var i = 0; i < found.length; i++){
      wireButton(found[i].el, found[i].plan);
    }
  }

  // The bundler unpacks page content asynchronously, so poll briefly
  // rather than relying on a single DOMContentLoaded pass.
  var attempts = 0;
  var maxAttempts = 40; // ~20s at 500ms
  var interval = setInterval(function(){
    scan();
    attempts++;
    if (attempts >= maxAttempts) clearInterval(interval);
  }, 500);

  var observer = new MutationObserver(function(){ scan(); });
  if (document.body) {
    observer.observe(document.body, { childList: true, subtree: true });
  }
})();
