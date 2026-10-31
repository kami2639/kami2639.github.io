const form = document.querySelector('#trip-form');
const destination = document.querySelector('#destination');
const result = document.querySelector('#result');
const resultContent = document.querySelector('#result-content');
const escapeHtml = (value) => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

document.querySelectorAll('[data-destination]').forEach(card => {
  card.addEventListener('click', () => {
    destination.value = card.dataset.destination;
    destination.focus();
    document.querySelector('#start').scrollIntoView({behavior:'smooth'});
  });
});

form.addEventListener('submit', event => {
  event.preventDefault();
  if (!form.reportValidity()) return;
  const data = new FormData(form);
  const interests = data.getAll('interests');
  const fields = [
    ['出发地', data.get('departure')],
    ['想去的地方', data.get('destination') || '一起探索'],
    ['出发日期', data.get('date') || '待定'],
    ['旅行时长', data.get('duration') || '待定'],
    ['同行人数', data.get('travelers')],
    ['每人预算', data.get('budget') || '待定'],
    ['旅行偏好', interests.length ? interests.join('、') : '待定']
  ];
  resultContent.innerHTML = `<dl class="summary-grid">${fields.map(([label,value]) => `<div><dt>${label}</dt><dd>${escapeHtml(value)}</dd></div>`).join('')}</dl>${data.get('notes') ? `<div class="summary-note"><strong>特别想法</strong><p>${escapeHtml(data.get('notes'))}</p></div>` : ''}`;
  result.hidden = false;
  result.scrollIntoView({behavior:'smooth',block:'start'});
});

document.querySelector('#edit-trip').addEventListener('click', () => {
  document.querySelector('#start').scrollIntoView({behavior:'smooth'});
  form.querySelector('input').focus({preventScroll:true});
});
