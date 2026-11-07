const $ = selector => document.querySelector(selector);
const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
})[char]);

const slides = [
  ['◎', '先想想，<br><em>哪几座城值得停留？</em>', '一个国家里，可能藏着好几座舍不得错过的城。也可以把几个国家放进同一趟旅行，再分别挑选想停留的地方。'],
  ['↗', '想去的城市，<br><em>以怎样的顺序抵达？</em>', '想先走进热闹的城市，还是把海边留到最后？这一轮决定抵达的顺序，以及每座城值得停留几天。'],
  ['✳', '到了每座城，<br><em>把时间留给什么？</em>', '也许是一座美术馆、一片海，或一条想慢慢走的街。这一轮挑出心愿，之后再核对位置与开放时间。'],
  ['☼', '从清晨到夜晚，<br><em>每一天会怎样展开？</em>', '城市、顺序与想看的地方都确定后，再看它们如何落进每天的安排。想法变了，也随时可以返回调整。']
];
const slidePhotos = [
  'photo-1493976040374-85c8e12f0c0e',
  'photo-1502602898657-3e91760cbb34',
  'photo-1560703649-e3055f28bcf8',
  'photo-1570939274717-7eda259b50ed'
];
const citySuggestions = {
  日本: ['东京', '京都', '大阪', '奈良', '箱根', '札幌'],
  德国: ['柏林', '慕尼黑', '汉堡', '科隆', '法兰克福'],
  法国: ['巴黎', '里昂', '尼斯', '波尔多'],
  意大利: ['罗马', '佛罗伦萨', '威尼斯', '米兰'],
  希腊: ['雅典', '圣托里尼', '米科诺斯'],
  土耳其: ['伊斯坦布尔', '卡帕多奇亚', '安塔利亚'],
  西班牙: ['马德里', '巴塞罗那', '塞维利亚'],
  英国: ['伦敦', '爱丁堡', '约克']
};
const sightSuggestions = {
  东京: ['浅草寺', '上野公园', '涩谷街区'],
  京都: ['伏见稻荷大社', '清水寺', '岚山'],
  大阪: ['大阪城', '道顿堀'],
  柏林: ['勃兰登堡门', '博物馆岛'],
  慕尼黑: ['玛利亚广场', '英国花园'],
  巴黎: ['埃菲尔铁塔', '卢浮宫', '蒙马特'],
  罗马: ['斗兽场', '万神殿'],
  佛罗伦萨: ['圣母百花大教堂', '乌菲兹美术馆'],
  威尼斯: ['圣马可广场', '大运河'],
  雅典: ['雅典卫城', '普拉卡老城'],
  圣托里尼: ['伊亚小镇', '费拉步道'],
  伊斯坦布尔: ['圣索菲亚大教堂', '蓝色清真寺'],
  卡帕多奇亚: ['格雷梅露天博物馆', '热气球体验']
};

const state = { round: 0, slide: 0, countries: [], cities: [], days: {}, sights: {} };
const form = $('#trip-form');
const cityId = (country, name) => encodeURIComponent(country) + '--' + encodeURIComponent(name);
const cityLabel = city => `${city.name}（${city.country}）`;

function go(round) {
  state.round = round;
  document.querySelectorAll('.round-panel').forEach(panel => {
    panel.hidden = Number(panel.dataset.round) !== round;
  });
  document.querySelectorAll('.track-item').forEach(item => {
    item.classList.toggle('active', Number(item.dataset.track) === round);
  });
  if (round === 2) renderRoute();
  if (round === 3) renderAttractions();
  if (round === 4) renderDays();
  (round === 1 ? document.querySelector('.round-panel[data-round="1"]') : $('#planner'))
    .scrollIntoView({ behavior: 'smooth' });
}

function showSlide(index) {
  state.slide = Math.max(0, Math.min(slides.length - 1, index));
  const [icon, title, description] = slides[state.slide];
  $('#slide-index').textContent = `0${state.slide + 1} / 04`;
  $('#slide-icon').textContent = icon;
  $('#slide-title').innerHTML = title;
  $('#slide-description').textContent = description;
  $('#slide-dots').innerHTML = slides.map((_, i) =>
    `<button type="button" data-slide="${i}" class="${i === state.slide ? 'active' : ''}" aria-label="查看第 ${i + 1} 步"></button>`
  ).join('');
  $('#slide-prev').disabled = state.slide === 0;
  $('#slide-next').disabled = state.slide === slides.length - 1;
  $('.intro-visual').style.backgroundImage =
    `linear-gradient(180deg,rgba(7,28,38,.05),rgba(7,28,38,.42)),url('https://images.unsplash.com/${slidePhotos[state.slide]}?w=1100&q=85')`;
}

function renderCountries() {
  $('#selected-countries').innerHTML = state.countries.map(country =>
    `<button type="button" class="country-chip" data-remove-country="${escapeHtml(country)}" aria-label="移除${escapeHtml(country)}">${escapeHtml(country)} <span aria-hidden="true">×</span></button>`
  ).join('');
  $('#country-help').textContent = state.countries.length
    ? `已加入 ${state.countries.length} 个国家或地区；继续添加，或在下面选城市。`
    : '可以添加多个国家，随后分别挑选想去的城市。';

  const selector = $('#custom-city-country');
  const previous = selector.value;
  selector.innerHTML = '<option value="">选择所属国家</option>' + state.countries.map(country =>
    `<option value="${escapeHtml(country)}">${escapeHtml(country)}</option>`
  ).join('');
  selector.disabled = state.countries.length === 0;
  if (state.countries.includes(previous)) selector.value = previous;
  else if (state.countries.length === 1) selector.value = state.countries[0];
}

function renderCities() {
  if (!state.countries.length) {
    $('#city-help').textContent = '先添加国家或地区，再分别选择想去的城市。';
    $('#city-options').innerHTML = '';
  } else {
    $('#city-help').textContent = '每个国家可以选多座城市；想去的地方不在列表里，也可以自己添加。';
    $('#city-options').innerHTML = state.countries.map(country => {
      const options = citySuggestions[country] || [];
      const buttons = options.length
        ? options.map(name => {
          const selected = state.cities.some(city => city.country === country && city.name === name);
          return `<button type="button" class="city-chip ${selected ? 'selected' : ''}" data-country-option="${escapeHtml(country)}" data-city-option="${escapeHtml(name)}" aria-pressed="${selected}">${escapeHtml(name)} <span>${selected ? '✓' : '＋'}</span></button>`;
        }).join('')
        : '<p class="country-empty">暂时没有预设城市，可在下方自行添加。</p>';
      return `<div class="country-city-group"><h4>${escapeHtml(country)}</h4><div class="country-city-buttons">${buttons}</div></div>`;
    }).join('');
  }
  $('#selected-cities').textContent = state.cities.length
    ? state.cities.map(cityLabel).join(' → ')
    : '还未选择';
}

function addCountry(country) {
  country = country.trim();
  if (!country || state.countries.includes(country)) return;
  state.countries.push(country);
  renderCountries();
  $('#custom-city-country').value = state.countries.length === 1 ? country : '';
  renderCities();
}

function removeCountry(country) {
  state.countries = state.countries.filter(item => item !== country);
  state.cities.filter(city => city.country === country).forEach(city => {
    delete state.days[city.id];
    delete state.sights[city.id];
  });
  state.cities = state.cities.filter(city => city.country !== country);
  renderCountries();
  renderCities();
}

function toggleCity(country, name) {
  const id = cityId(country, name);
  const existing = state.cities.some(city => city.id === id);
  if (existing) {
    state.cities = state.cities.filter(city => city.id !== id);
    delete state.days[id];
    delete state.sights[id];
  } else {
    state.cities.push({ id, country, name });
  }
  renderCities();
}

function addCustomCity() {
  const name = $('#custom-city').value.trim();
  const country = $('#custom-city-country').value;
  if (!state.countries.length) {
    $('#city-help').textContent = '先添加至少一个国家或地区。';
    return;
  }
  if (!country) {
    $('#city-help').textContent = '请先为这座城市选择所属国家。';
    $('#custom-city-country').focus();
    return;
  }
  if (!name) {
    $('#custom-city').focus();
    return;
  }
  if (!state.cities.some(city => city.id === cityId(country, name))) {
    state.cities.push({ id: cityId(country, name), country, name });
  }
  $('#custom-city').value = '';
  renderCities();
}

function updateRouteTotal() {
  const sum = state.cities.reduce((total, city) => total + (Number(state.days[city.id]) || 2), 0);
  const desired = Number(new FormData(form).get('duration'));
  $('#route-total').textContent = `这些城市打算停留 ${sum} 天${desired ? ` · 第一轮预计约 ${desired} 天` : ''}。别忘了为跨城交通和抵离留出时间。`;
}

function renderRoute() {
  const brief = new FormData(form);
  $('#route-context').innerHTML =
    `<span>目的地：<b>${escapeHtml(state.countries.join('、'))}</b></span><span>从 ${escapeHtml(brief.get('departure'))} 出发</span><span>${escapeHtml(brief.get('travelers'))} 人同行</span>`;
  $('#route-list').innerHTML = state.cities.map((city, index) =>
    `<div class="route-row"><span class="route-node">${String(index + 1).padStart(2, '0')}</span><div class="route-city"><strong>${escapeHtml(city.name)}</strong><small>${escapeHtml(city.country)} · ${index ? '从 ' + escapeHtml(cityLabel(state.cities[index - 1])) + ' 前往' : '从这里开始'}</small></div><label>停留 <input type="number" min="1" max="20" data-days="${escapeHtml(city.id)}" value="${state.days[city.id] || 2}"> 天</label><div class="route-move"><button type="button" data-move="up" data-index="${index}" aria-label="${escapeHtml(cityLabel(city))}上移" ${index === 0 ? 'disabled' : ''}>↑</button><button type="button" data-move="down" data-index="${index}" aria-label="${escapeHtml(cityLabel(city))}下移" ${index === state.cities.length - 1 ? 'disabled' : ''}>↓</button></div></div>`
  ).join('');
  updateRouteTotal();
}

function renderAttractions() {
  $('#attraction-list').innerHTML = state.cities.map(city => {
    const chosen = state.sights[city.id] || [];
    const options = sightSuggestions[city.name] || ['城市地标', '当地美食', '街区漫步', '自然景观'];
    return `<div class="attraction-city"><div class="attraction-city-heading"><span>✳</span><div><h4>${escapeHtml(city.name)} <small>${escapeHtml(city.country)}</small></h4><p>想在这里待 ${state.days[city.id] || 2} 天 · 挑一挑想看的地方</p></div></div><div class="attraction-options">${options.map(sight => `<label><input type="checkbox" data-attraction-city="${escapeHtml(city.id)}" value="${escapeHtml(sight)}" ${chosen.includes(sight) ? 'checked' : ''}><span>${escapeHtml(sight)}</span></label>`).join('')}</div><div class="add-row"><input type="text" data-custom-attraction="${escapeHtml(city.id)}" placeholder="还有什么让你想为这座城停留？"><button type="button" class="outline-button" data-add-attraction="${escapeHtml(city.id)}">添加 ＋</button></div>${chosen.filter(sight => !options.includes(sight)).map(sight => `<span class="custom-tag">${escapeHtml(sight)} <button type="button" data-remove-attraction="${escapeHtml(city.id)}" data-value="${escapeHtml(sight)}" aria-label="移除${escapeHtml(sight)}">×</button></span>`).join('')}</div>`;
  }).join('');
}

function renderDays() {
  const brief = new FormData(form);
  $('#summary-bar').innerHTML =
    `<span><b>${escapeHtml(state.countries.join('、'))}</b> · ${state.cities.length} 座城市</span><span>${escapeHtml(brief.get('travelers'))} 人同行</span><span>去过：${escapeHtml(brief.get('visited') || '未填写')}</span>`;
  let day = 0;
  $('#day-list').innerHTML = state.cities.map(city =>
    Array.from({ length: Number(state.days[city.id]) || 2 }, (_, index) => {
      day++;
      const selected = state.sights[city.id] || [];
      const sight = selected.length ? selected[index % selected.length] : '';
      return `<article class="day-row"><div class="day-number">DAY ${String(day).padStart(2, '0')}</div><div><h4>${escapeHtml(city.name)}（${escapeHtml(city.country)}）· ${index === 0 ? '初见这座城' : '在这里多待一天'}</h4><p>${sight ? '想去看看：' + escapeHtml(sight) + '。' : '这一天想看什么，可以在上一轮补充。'}${index === 0 && day > 1 ? ' 这天还要为跨城移动留出时间。' : ''}</p></div><span class="day-tag">结构示意</span></article>`;
    }).join('')
  ).join('');
}

$('#slide-prev').onclick = () => showSlide(state.slide - 1);
$('#slide-next').onclick = () => showSlide(state.slide + 1);
$('#slide-dots').onclick = event => {
  const button = event.target.closest('[data-slide]');
  if (button) showSlide(Number(button.dataset.slide));
};
$('#begin-planning').onclick = () => go(1);
document.querySelectorAll('[data-go]').forEach(button => {
  button.onclick = () => go(Number(button.dataset.go));
});

$('#add-country').onclick = () => {
  addCountry($('#country').value);
  $('#country').value = '';
};
$('#country').onkeydown = event => {
  if (event.key === 'Enter') {
    event.preventDefault();
    $('#add-country').click();
  }
};
$('#selected-countries').onclick = event => {
  const button = event.target.closest('[data-remove-country]');
  if (button) removeCountry(button.dataset.removeCountry);
};
$('#city-options').onclick = event => {
  const button = event.target.closest('[data-city-option]');
  if (button) toggleCity(button.dataset.countryOption, button.dataset.cityOption);
};
$('#add-city').onclick = addCustomCity;
$('#custom-city').onkeydown = event => {
  if (event.key === 'Enter') {
    event.preventDefault();
    addCustomCity();
  }
};
document.querySelectorAll('[data-city]').forEach(card => {
  card.onclick = () => {
    addCountry(card.dataset.country);
    if (!state.cities.some(city => city.id === cityId(card.dataset.country, card.dataset.city))) {
      toggleCity(card.dataset.country, card.dataset.city);
    }
    go(1);
  };
});

form.onsubmit = event => {
  event.preventDefault();
  if (!form.reportValidity()) return;
  if ($('#country').value.trim()) {
    addCountry($('#country').value);
    $('#country').value = '';
  }
  if (!state.countries.length) {
    $('#country-help').textContent = '请先添加至少一个国家或地区。';
    $('#country').focus();
    return;
  }
  const missing = state.countries.filter(country => !state.cities.some(city => city.country === country));
  if (missing.length) {
    $('#city-help').textContent = `请先为${missing.join('、')}选择或添加至少一座城市。`;
    $('#city-options').scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }
  go(2);
};

$('#route-list').onclick = event => {
  const button = event.target.closest('[data-move]');
  if (!button) return;
  const index = Number(button.dataset.index);
  const next = index + (button.dataset.move === 'up' ? -1 : 1);
  if (next < 0 || next >= state.cities.length) return;
  [state.cities[index], state.cities[next]] = [state.cities[next], state.cities[index]];
  renderRoute();
};
$('#route-list').onchange = event => {
  if (!event.target.matches('[data-days]')) return;
  state.days[event.target.dataset.days] = Math.max(1, Math.min(20, Number(event.target.value) || 1));
  event.target.value = state.days[event.target.dataset.days];
  updateRouteTotal();
};
$('#confirm-route').onclick = () => {
  document.querySelectorAll('[data-days]').forEach(input => {
    state.days[input.dataset.days] = Math.max(1, Math.min(20, Number(input.value) || 1));
  });
  go(3);
};

$('#attraction-list').onchange = event => {
  if (!event.target.matches('[data-attraction-city]')) return;
  const id = event.target.dataset.attractionCity;
  const selected = state.sights[id] || [];
  state.sights[id] = event.target.checked
    ? [...new Set([...selected, event.target.value])]
    : selected.filter(sight => sight !== event.target.value);
};
$('#attraction-list').onclick = event => {
  const add = event.target.closest('[data-add-attraction]');
  if (add) {
    const id = add.dataset.addAttraction;
    const input = [...document.querySelectorAll('[data-custom-attraction]')]
      .find(element => element.dataset.customAttraction === id);
    const value = input.value.trim();
    if (value) {
      state.sights[id] = [...new Set([...(state.sights[id] || []), value])];
      renderAttractions();
    }
    return;
  }
  const remove = event.target.closest('[data-remove-attraction]');
  if (remove) {
    const id = remove.dataset.removeAttraction;
    state.sights[id] = (state.sights[id] || []).filter(sight => sight !== remove.dataset.value);
    renderAttractions();
  }
};
$('#confirm-attractions').onclick = () => go(4);
$('#hero-start').onclick = () => go(1);
$('#nav-start').onclick = event => {
  event.preventDefault();
  go(1);
};

showSlide(0);
renderCountries();
renderCities();
