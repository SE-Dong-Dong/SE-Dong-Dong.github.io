let songsCache = [];         // 缓存原始数据
let currentFilter = null;    // { type: 'date'|'month', value: 'YYYY-MM-DD' or 'YYYY-MM' }

async function loadSongs() {
    // Load Data/index.json which contains an array of files to fetch
    try {
        const idxResp = await fetch('./Data/index.json');
        if (!idxResp.ok) throw new Error('Failed to load Data/index.json');
        const idx = await idxResp.json();
        const files = Array.isArray(idx.files) ? idx.files : [];

        // Parallel fetch per-date files
        const fetches = files.map(f =>
            fetch(`./Data/${f.file}`).then(r => ({ r, meta: f })).catch(err => ({ error: err, meta: f }))
        );
        const results = await Promise.all(fetches);

        // Merge data and normalize dates
        const merged = [];
        const availableDates = [];
        for (const res of results) {
            if (res.error) {
                console.warn('Failed to fetch', res.meta.file, res.error);
                continue;
            }
            const resp = res.r;
            if (!resp.ok) {
                console.warn('HTTP', resp.status, 'for', res.meta.file);
                continue;
            }
            const data = await resp.json();
            const date = data.date || res.meta.date || '';
            const iso = normalizeToISO(date);
            if (iso) availableDates.push(iso);
            (data.songs || []).forEach(s => {
                if (!s.date) s.date = date;
                merged.push(s);
            });
        }

        songsCache = merged;

        // populate filter controls using the availableDates (unique)
        const uniqueDates = Array.from(new Set(availableDates)).sort();
        setupFilterControls(songsCache, uniqueDates);
        renderSongs(songsCache);
        console.log('Loaded songs from', files.length, 'files, total songs:', songsCache.length);
    } catch (err) {
        console.error('Error loading songs:', err);
    }
}

function normalizeToISO(dateStr) {
    // 支持 2025.11.18 或 2025-11-18，返回 YYYY-MM-DD
    if (!dateStr) return null;
    if (/\d{4}\.\d{1,2}\.\d{1,2}/.test(dateStr)) return dateStr.replace(/\./g, '-');
    return dateStr;
}

function setupFilterControls(songs, availableDates = []) {
	const yearSelect = document.getElementById('filter-year');
	const monthSelect = document.getElementById('filter-month');
	const dateSelect = document.getElementById('filter-date');
	const clearBtn = document.getElementById('clear-filter');

	// Normalize and sort unique dates (ISO YYYY-MM-DD)
	const dates = (availableDates.length ? availableDates : songs.map(s => normalizeToISO(s.date)).filter(Boolean)).sort();

	// Populate date select (exact dates)
	dateSelect.querySelectorAll('option:not([value=""])').forEach(o => o.remove());
	dates.forEach(d => {
		const opt = document.createElement('option');
		opt.value = d; // YYYY-MM-DD
		opt.textContent = d;
		dateSelect.appendChild(opt);
	});
	if (!dates.length) dateSelect.classList.add('filter-disabled'); else dateSelect.classList.remove('filter-disabled');

	// Populate months available (YYYY-MM) but display as YYYY-M
	const months = Array.from(new Set(dates.map(d => d.slice(0, 7)))).sort();
	monthSelect.querySelectorAll('option:not([value=""])').forEach(o => o.remove());
	months.forEach(m => {
		const [y, mm] = m.split('-');
		const display = `${y}-${parseInt(mm, 10)}`; // e.g. 2025-8
		const opt = document.createElement('option');
		opt.value = m; // YYYY-MM
		opt.textContent = display;
		monthSelect.appendChild(opt);
	});
	if (!months.length) monthSelect.classList.add('filter-disabled'); else monthSelect.classList.remove('filter-disabled');

	// Populate years available (YYYY)
	const years = Array.from(new Set(dates.map(d => d.slice(0, 4)))).sort();
	yearSelect.querySelectorAll('option:not([value=""])').forEach(o => o.remove());
	years.forEach(y => {
		const opt = document.createElement('option');
		opt.value = y;
		opt.textContent = y;
		yearSelect.appendChild(opt);
	});
	if (!years.length) yearSelect.classList.add('filter-disabled'); else yearSelect.classList.remove('filter-disabled');

	// Handlers: selecting a year limits month options; selecting a month limits date options; selecting date sets exact filter
	yearSelect.onchange = (e) => {
		const val = e.target.value; // YYYY
		if (!val) {
			// clear filter
			currentFilter = null;
			// enable all month/date options
			monthSelect.querySelectorAll('option:not([value=""])').forEach(opt => opt.disabled = false);
			dateSelect.querySelectorAll('option:not([value=""])').forEach(opt => opt.disabled = false);
			dateSelect.value = '';
			monthSelect.value = '';
			renderSongs(songs);
			return;
		}
		// disable months not in this year
		monthSelect.querySelectorAll('option:not([value=""])').forEach(opt => {
			opt.disabled = !opt.value.startsWith(val + '-');
		});
		// clear downstream selects
		monthSelect.value = '';
		dateSelect.value = '';
		currentFilter = { type: 'year', value: val };
		renderSongs(songs);
	};

	monthSelect.onchange = (e) => {
		const val = e.target.value; // YYYY-MM
		if (!val) {
			// if month cleared, fall back to year filter if set
			if (yearSelect && yearSelect.value) {
				currentFilter = { type: 'year', value: yearSelect.value };
			} else {
				currentFilter = null;
			}
			// enable all date options
			dateSelect.querySelectorAll('option:not([value=""])').forEach(opt => opt.disabled = false);
			dateSelect.value = '';
			renderSongs(songs);
			return;
		}
		// disable dates not in this month
		dateSelect.querySelectorAll('option:not([value=""])').forEach(opt => {
			opt.disabled = !opt.value.startsWith(val);
		});
		dateSelect.value = '';
		currentFilter = { type: 'month', value: val };
		renderSongs(songs);
	};

	dateSelect.onchange = (e) => {
		const val = e.target.value; // YYYY-MM-DD
		if (!val) {
			// if date cleared, apply month or year filter if present
			if (monthSelect && monthSelect.value) {
				currentFilter = { type: 'month', value: monthSelect.value };
			} else if (yearSelect && yearSelect.value) {
				currentFilter = { type: 'year', value: yearSelect.value };
			} else {
				currentFilter = null;
			}
			renderSongs(songs);
			return;
		}
		// exact date selected
		currentFilter = { type: 'date', value: val };
		// sync month/year selects visually
		if (monthSelect) monthSelect.value = val.slice(0,7);
		if (yearSelect) yearSelect.value = val.slice(0,4);
		renderSongs(songs);
	};

	clearBtn.onclick = () => {
		currentFilter = null;
		yearSelect.value = '';
		monthSelect.value = '';
		dateSelect.value = '';
		monthSelect.querySelectorAll('option:not([value=""])').forEach(opt => opt.disabled = false);
		dateSelect.querySelectorAll('option:not([value=""])').forEach(opt => opt.disabled = false);
		renderSongs(songs);
	};
}

function applyFilterToList(list) {
    if (!currentFilter) return list;
    if (currentFilter.type === 'date') {
        return list.filter(s => normalizeToISO(s.date) === currentFilter.value);
    }
    if (currentFilter.type === 'month') {
        return list.filter(s => {
            const iso = normalizeToISO(s.date);
            return iso && iso.startsWith(currentFilter.value);
        });
    }
    return list;
}

function renderSongs(songs) {
    const songList = document.getElementById('song-list');
    if (!songList) return;
    songList.innerHTML = '';

    // apply filter first
    const filtered = applyFilterToList(songs);

    // Group by date (use original date string)
    const songsByDate = {};
    filtered.forEach(song => {
        const dateKey = song.date || 'Unknown';
        if (!songsByDate[dateKey]) songsByDate[dateKey] = [];
        songsByDate[dateKey].push(song);
    });

    // Render groups sorted descending by date if possible
    const dateKeys = Object.keys(songsByDate).sort((a,b) => {
        const ia = normalizeToISO(a) || a;
        const ib = normalizeToISO(b) || b;
        return ia < ib ? 1 : (ia > ib ? -1 : 0);
    });

    dateKeys.forEach(date => {
        const group = document.createElement('div');
        group.className = 'song-date-group';

        // 可点击的日期标题
        const header = document.createElement('div');
        const btn = document.createElement('button');
        btn.className = 'date-btn';
        // 将日期格式化为 ISO 用于 dataset（可点击时作为筛选）
        const iso = normalizeToISO(date) || '';
        btn.dataset.date = iso.slice(0,10); // YYYY-MM-DD or ''
        btn.textContent = date;
        btn.onclick = () => {
            if (btn.dataset.date) {
                currentFilter = { type: 'date', value: btn.dataset.date };
                // 同步 date input if present
                const di = document.getElementById('filter-date');
                if (di) di.value = btn.dataset.date;
                const mi = document.getElementById('filter-month');
                if (mi) mi.value = btn.dataset.date.slice(0,7);
                renderSongs(songsCache);
            }
        };
        header.appendChild(btn);
        group.appendChild(header);

        // songs list
        songsByDate[date].forEach((song, idx) => {
            const item = document.createElement('li');
            item.className = 'song-item';

            const info = document.createElement('div');
            info.className = 'song-info';

            const title = document.createElement('a');
            title.className = 'song-title';
            title.href = song.youtubeUrl || '#';
            title.target = '_blank';
            title.rel = 'noopener noreferrer';
            title.textContent = song.title || `Untitled ${idx+1}`;

            const artist = document.createElement('div');
            artist.className = 'song-artist';
            if (song.artist) {
                const al = document.createElement('a');
                al.href = song.artistUrl || '#';
                al.target = '_blank';
                al.rel = 'noopener noreferrer';
                al.textContent = song.artist;
                artist.appendChild(al);
            }

            info.appendChild(title);
            info.appendChild(artist);

            const selectBtn = document.createElement('button');
            selectBtn.className = 'select-btn';
            selectBtn.textContent = 'Select';
            selectBtn.onclick = (e) => {
                e.stopPropagation();
                showLyricsInPanel(song.title || 'Untitled', song.lyrics || ['No lyrics available.']);
            };

            item.appendChild(info);
            item.appendChild(selectBtn);
            songList.appendChild(item);
        });
    });
}

// Complete showLyricsInPanel implementation
function showLyricsInPanel(title, lyricsArr) {
    const panel = document.getElementById('lyrics-panel');
    if (!panel) return;
    const lyricsText = Array.isArray(lyricsArr) ? lyricsArr.join('\n') : (lyricsArr || '');
    // simple escape for HTML special chars
    const escaped = lyricsText.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    panel.innerHTML = `<h2>${title ? String(title) : 'Lyrics'}</h2><pre>${escaped}</pre>`;
}