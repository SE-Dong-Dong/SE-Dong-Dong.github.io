// Load songs from JSON and render them
async function loadSongs() {
    try {
        // Try different possible paths
        const possiblePaths = [
            'Data/songs.json',
            '../Data/songs.json',
            './Data/songs.json'
        ];
        
        let response;
        let data;
        
        for (const path of possiblePaths) {
            try {
                response = await fetch(path);
                if (response.ok) {
                    data = await response.json();
                    console.log('Songs loaded from:', path);
                    renderSongs(data.songs);
                    return;
                }
            } catch (e) {
                console.log('Path not found:', path);
                continue;
            }
        }
        
        console.error('Failed to load songs from all paths');
        
    } catch (error) {
        console.error('Failed to load songs:', error);
    }
}

// Render songs into the song list
function renderSongs(songs) {
    const songList = document.querySelector('.song-list');
    if (!songList) {
        console.error('Song list element not found');
        return;
    }
    songList.innerHTML = '';

    // Group songs by date
    const songsByDate = {};
    songs.forEach(song => {
        if (!songsByDate[song.date]) {
            songsByDate[song.date] = [];
        }
        songsByDate[song.date].push(song);
    });

    // Render each date group as a card
    Object.keys(songsByDate).forEach(date => {
        // 卡片容器
        const card = document.createElement('div');
        card.className = 'song-card';
        card.style.background = '#263238';
        card.style.borderRadius = '10px';
        card.style.boxShadow = '0 2px 8px rgba(0,0,0,0.18)';
        card.style.margin = '18px 0';
        card.style.padding = '18px 22px';

        // 日期标题
        const dateHeader = document.createElement('div');
        dateHeader.innerHTML = `<p class="date" style="font-size:17px;font-weight:bold;color:#64b5f6;margin-bottom:10px;">${date}</p>`;
        card.appendChild(dateHeader);

        // 歌曲编号列表
        const ol = document.createElement('ol');
        ol.style.marginLeft = '20px';
        ol.style.paddingLeft = '0';
        ol.style.color = '#e9f0ed';
        songsByDate[date].forEach(song => {
            const item = document.createElement('li');
            item.style.marginBottom = '8px';
            let content = `<a href="${song.youtubeUrl}" target="_blank">${song.title}</a>`;
            content += ` by <a href="${song.artistUrl}" target="_blank">${song.artist}</a>`;
            if (song.lyricsUrl) {
                content += ` | <a href="${song.lyricsUrl}">View lyrics</a>`;
            }
            item.innerHTML = content;
            ol.appendChild(item);
        });
        card.appendChild(ol);

        // 插入到列表
        songList.appendChild(card);
    });
}

// Initialize after page loads
document.addEventListener('DOMContentLoaded', loadSongs);