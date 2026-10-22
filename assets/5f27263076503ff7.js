
(function(){
  var root = document.getElementById('appdemo'); if (!root) return;
  var steps = [].slice.call(root.querySelectorAll('.appdemo-step'));
  var screens = [].slice.call(root.querySelectorAll('.ad-screen:not(.ad-subscreen)'));
  var notesEl = root.querySelector('#ad-screen-notes'), respModal = root.querySelector('[data-resp-modal]');
  var caption = root.querySelector('.appdemo-caption');
  
  var cur = 0;
  
  function go(i){
    cur = i;
    steps.forEach(function(s,k){ s.classList.toggle('is-active', k===i); s.querySelector('.appdemo-tab').setAttribute('aria-current', k===i ? 'step' : 'false'); });
    screens.forEach(function(s,k){ s.hidden = k!==i; s.scrollTop = 0; }); notesEl.hidden = true; respModal.hidden = true; if (i===0) screens[0].scrollTop = screens[0].scrollHeight;
    caption.textContent = steps[i].querySelector('.appdemo-side').textContent;
  }
  steps.forEach(function(s,k){ s.querySelector('.appdemo-tab').addEventListener('click', function(){ go(k); }); });
  requestAnimationFrame(function(){ screens[0].scrollTop = screens[0].scrollHeight; });
  window.addEventListener('load', function(){ if (cur===0) screens[0].scrollTop = screens[0].scrollHeight; });
  root.querySelector('[data-next]').addEventListener('click', function(){ go((cur+1)%4); });
  function showHome(){ go(0); var f = screens[0].querySelector('.ad-navpill'); if (f) f.focus(); }
  function openCant(date){ go(2); var b = root.querySelector('.ad-rcard[data-date="'+date+'"] [data-cant]'); if (b && !b.hidden) b.click(); }
  root.querySelector('[data-home-notes]').addEventListener('click', function(){ go(0); screens[0].hidden = true; notesEl.hidden = false; notesEl.scrollTop = 0; notesEl.querySelector('.ad-back').focus(); });
  var respBtn = root.querySelector('[data-home-resp]'), respNote = root.querySelector('[data-home-resp-note]');
  function closeResp(){ respModal.hidden = true; if (!respBtn.hidden) respBtn.focus(); }
  respBtn.addEventListener('click', function(){ respModal.hidden = false; respModal.querySelector('[data-resp="yes"]').focus(); });
  respModal.querySelector('[data-resp-close]').addEventListener('click', closeResp);
  respModal.addEventListener('keydown', function(e){ if (e.key === 'Escape') closeResp(); });
  respModal.querySelectorAll('[data-resp]').forEach(function(b){ b.addEventListener('click', function(){
    respNote.textContent = b.getAttribute('data-resp') === 'yes' ? 'You’re rostered in! Thanks for stepping up.' : 'Thanks for letting us know. That’s all good.';
    respNote.hidden = false; respBtn.parentNode.hidden = true; respModal.hidden = true; respNote.setAttribute('tabindex','-1'); respNote.focus();
  }); });
  root.querySelectorAll('[data-home]').forEach(function(b){ b.addEventListener('click', showHome); });
  root.querySelectorAll('[data-home-go]').forEach(function(b){ b.addEventListener('click', function(){ go(parseInt(b.getAttribute('data-home-go'),10)); }); });
  root.querySelectorAll('[data-home-cant]').forEach(function(b){ b.addEventListener('click', function(){ openCant(b.getAttribute('data-home-cant')); }); });

  var q = root.querySelector('.ad-ask-q');
  root.querySelectorAll('[data-ask]').forEach(function(b){ b.addEventListener('click', function(){
    q.hidden = true; var r = root.querySelector('[data-result="'+b.getAttribute('data-ask')+'"]'); r.hidden = false; r.focus();
  }); });
  root.querySelectorAll('[data-reset]').forEach(function(b){ b.addEventListener('click', function(){
    root.querySelectorAll('[data-result]').forEach(function(r){ r.hidden = true; }); q.hidden = false; q.querySelector('[data-ask="yes"]').focus();
  }); });

  var modal = root.querySelector('#ad-screen-3 .ad-modal'), mDate = modal.querySelector('[data-cant-date]'), activeCard = null, opener = null;
  function closeModal(){ modal.hidden = true; if (opener) opener.focus(); }
  root.querySelectorAll('[data-cant]').forEach(function(b){ b.addEventListener('click', function(){
    activeCard = b.closest('.ad-rcard'); opener = b; mDate.textContent = activeCard.getAttribute('data-short'); modal.querySelector('[data-cant-role]').textContent = b.getAttribute('data-role');
    [].forEach.call(modal.querySelector('.ad-sheet').children, function(c){ c.hidden = c.hasAttribute('data-cant-done'); });
    modal.hidden = false; modal.querySelector('[data-cant-yes]').focus();
  }); });
  modal.querySelector('[data-cant-yes]').addEventListener('click', function(){
    var chip = activeCard.querySelector('[data-you]'); chip.classList.add('is-finding'); chip.textContent = 'Finding a replacement…';
    var note = activeCard.querySelector('.ad-note'); note.textContent = 'Thanks for letting us know. We’ll find a replacement.'; note.hidden = false;
    opener.hidden = true; opener = null;
    [].forEach.call(modal.querySelector('.ad-sheet').children, function(c){ c.hidden = !c.hasAttribute('data-cant-done'); });
    var done = modal.querySelector('[data-cant-done]'); done.hidden = false; done.focus();
  });
  modal.querySelector('[data-cant-no]').addEventListener('click', function(){
    var note = activeCard.querySelector('.ad-note'); note.textContent = 'You’re still down for ' + activeCard.getAttribute('data-date') + '.'; note.hidden = false; closeModal();
  });
  modal.querySelector('[data-cant-close]').addEventListener('click', closeModal);
  modal.querySelector('[data-cant-ok]').addEventListener('click', function(){ modal.hidden = true; var n = activeCard && activeCard.querySelector('.ad-note'); if (n) { n.setAttribute('tabindex','-1'); n.focus(); } });
  modal.addEventListener('keydown', function(e){ if (e.key === 'Escape') closeModal(); });

  var labels = ['Available','Unsure','Unavailable'], syms = ['✓','?','✗'], names = ['Available','Unsure','Unavailable'];
  var status = root.querySelector('[data-av-status]'), t;
  root.querySelectorAll('.ad-av').forEach(function(b){ b.addEventListener('click', function(){
    var n = (parseInt(b.getAttribute('data-state'),10)+1)%3; b.setAttribute('data-state', n);
    b.querySelector('.s').textContent = labels[n]; b.querySelector('.sym').textContent = syms[n];
    var idx = [].indexOf.call(b.parentNode.children, b), mini = root.querySelector('[data-mini="'+idx+'"]'); if (mini) { mini.setAttribute('data-state', n); mini.querySelector('i').textContent = syms[n]; }
    b.setAttribute('aria-label', b.querySelector('.d').textContent + ': ' + names[n] + '. Tap to change.');
    status.textContent = 'Saving…'; status.classList.remove('ad-saved'); clearTimeout(t);
    t = setTimeout(function(){ status.textContent = 'Saved — thank you!'; status.classList.add('ad-saved'); }, 800);
  }); });
})();
