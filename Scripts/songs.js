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

function setupFilterControls(songs) {
    const yearSelect = document.getElementById('filter-year');
    const monthSelect = document.getElementById('filter-month');
    const dateSelect = document.getElementById('filter-date');
    const clearBtn = document.getElementById('clear-filter');

    if (!yearSelect || !monthSelect || !dateSelect) return;

    // 获取所有可用的日期
    const dates = songs
        .map(s => normalizeToISO(s.date))
        .filter(Boolean)
        .sort();

    // 提取所有年份
    const years = Array.from(new Set(dates.map(d => d.slice(0, 4)))).sort().reverse();
    
    // 填充年份下拉
    yearSelect.innerHTML = '<option value="">Year</option>';
    years.forEach(year => {
        const opt = document.createElement('option');
        opt.value = year;
        opt.textContent = year;
        yearSelect.appendChild(opt);
    });

    // 年份改变
    yearSelect.onchange = () => {
        const selectedYear = yearSelect.value;
        
        if (selectedYear) {
            // 清空月份和日期
            monthSelect.value = '';
            dateSelect.value = '';
            currentFilter = { type: 'year', value: selectedYear };
        } else {
            currentFilter = null;
        }
        
        // 更新月份选项（仅显示该年的月份）
        updateMonthOptions(dates, selectedYear);
        updateDateOptions(dates, selectedYear, '');
        renderSongs(songs);
    };

    // 月份改变
    monthSelect.onchange = () => {
        const selectedYear = yearSelect.value;
        const selectedMonth = monthSelect.value;
        
        if (selectedMonth) {
            dateSelect.value = '';
            currentFilter = { type: 'month', value: selectedMonth };
        } else if (selectedYear) {
            currentFilter = { type: 'year', value: selectedYear };
        } else {
            currentFilter = null;
        }
        
        updateDateOptions(dates, selectedYear, selectedMonth);
        renderSongs(songs);
    };

    // 日期改变
    dateSelect.onchange = () => {
        const selectedDate = dateSelect.value;
        
        if (selectedDate) {
            currentFilter = { type: 'date', value: selectedDate };
        } else {
            const selectedMonth = monthSelect.value;
            const selectedYear = yearSelect.value;
            if (selectedMonth) {
                currentFilter = { type: 'month', value: selectedMonth };
            } else if (selectedYear) {
                currentFilter = { type: 'year', value: selectedYear };
            } else {
                currentFilter = null;
            }
        }
        
        renderSongs(songs);
    };

    // Clear 按钮
    clearBtn.onclick = () => {
        yearSelect.value = '';
        monthSelect.value = '';
        dateSelect.value = '';
        currentFilter = null;
        monthSelect.innerHTML = '<option value="">Month</option>';
        dateSelect.innerHTML = '<option value="">Date</option>';
        renderSongs(songs);
    };

    // 初始化
    updateMonthOptions(dates, '');
    updateDateOptions(dates, '', '');
}

function updateMonthOptions(dates, year) {
    const monthSelect = document.getElementById('filter-month');
    monthSelect.innerHTML = '<option value="">Month</option>';
    
    if (!year) return;
    
    // 获取该年的所有月份
    const months = Array.from(new Set(
        dates
            .filter(d => d.startsWith(year))
            .map(d => d.slice(0, 7)) // YYYY-MM
    )).sort();
    
    months.forEach(month => {
        const opt = document.createElement('option');
        const monthNum = month.slice(5); // 提取 MM
        opt.value = month;
        opt.textContent = `${monthNum}`;
        monthSelect.appendChild(opt);
    });
}

function updateDateOptions(dates, year, month) {
    const dateSelect = document.getElementById('filter-date');
    dateSelect.innerHTML = '<option value="">Date</option>';
    
    if (!month) return;
    
    // 获取该月的所有日期
    const datesInMonth = dates
        .filter(d => d.startsWith(month))
        .sort();
    
    datesInMonth.forEach(date => {
        const opt = document.createElement('option');
        const day = date.slice(8); // 提取 DD
        opt.value = date;
        opt.textContent = day;
        dateSelect.appendChild(opt);
    });
}

function applyFilterToList(list) {
    if (!currentFilter) return list;
    
    if (currentFilter.type === 'year') {
        return list.filter(s => {
            const iso = normalizeToISO(s.date);
            return iso && iso.startsWith(currentFilter.value);
        });
    }
    if (currentFilter.type === 'month') {
        return list.filter(s => {
            const iso = normalizeToISO(s.date);
            return iso && iso.startsWith(currentFilter.value);
        });
    }
    if (currentFilter.type === 'date') {
        return list.filter(s => normalizeToISO(s.date) === currentFilter.value);
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

        // 可点击的日期标题（仅添加一次）
        const header = document.createElement('div');
        const btn = document.createElement('button');
        btn.className = 'date-btn';
        const iso = normalizeToISO(date) || '';
        btn.dataset.date = iso.slice(0,10);
        btn.textContent = date;
        btn.onclick = () => {
            if (btn.dataset.date) {
                currentFilter = { type: 'date', value: btn.dataset.date };
                const yearSelect = document.getElementById('filter-year');
                const monthSelect = document.getElementById('filter-month');
                const dateSelect = document.getElementById('filter-date');
                if (yearSelect) yearSelect.value = btn.dataset.date.slice(0, 4);
                if (monthSelect) monthSelect.value = btn.dataset.date.slice(0, 7);
                if (dateSelect) dateSelect.value = btn.dataset.date;
                renderSongs(songsCache);
            }
        };
        header.appendChild(btn);
        group.appendChild(header);

        // songs list（每个日期只添加一次日期标题，然后添加所有歌曲）
        const songsList = document.createElement('ul');
        songsList.className = 'songs-for-date';
        
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
            songsList.appendChild(item);
        });

        group.appendChild(songsList);
        songList.appendChild(group);
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