const starsConfig = {
    count: 100,
    enabled: true
};

const fireflies = [];
const numFireflies = 20;
let fireflyContainer;

function initStars(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    fireflyContainer = container;

    // 创建星星
    for (let i = 0; i < starsConfig.count; i++) {
        const star = document.createElement('div');
        star.className = 'star';
        star.style.left = Math.random() * 100 + '%';
        star.style.top = Math.random() * 100 + '%';
        star.style.animationDelay = Math.random() * 2 + 's';
        star.style.opacity = Math.random() * 0.7 + 0.3;
        container.appendChild(star);
    }

    // 初始化萤火虫
    initFireflies(container);
    animateFireflies();
}

function initFireflies(container) {
    for (let i = 0; i < numFireflies; i++) {
        const firefly = document.createElement('div');
        firefly.className = 'firefly';
        container.appendChild(firefly);

        fireflies.push({
            element: firefly,
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
            vx: (Math.random() - 0.5) * 1.5, // 缓慢漂浮
            vy: (Math.random() - 0.5) * 1.5,
            brightness: Math.random() * 0.5 + 0.5
        });
    }
}

function animateFireflies() {
    function update() {
        fireflies.forEach(firefly => {
            // 缓慢漂浮运动
            firefly.x += firefly.vx;
            firefly.y += firefly.vy;

            // 边界反弹
            if (firefly.x < 0 || firefly.x > window.innerWidth) {
                firefly.vx *= -1;
                firefly.x = Math.max(0, Math.min(window.innerWidth, firefly.x));
            }
            if (firefly.y < 0 || firefly.y > window.innerHeight) {
                firefly.vy *= -1;
                firefly.y = Math.max(0, Math.min(window.innerHeight, firefly.y));
            }

            // 随机改变方向
            if (Math.random() < 0.02) {
                firefly.vx = (Math.random() - 0.5) * 1.5;
                firefly.vy = (Math.random() - 0.5) * 1.5;
            }

            // 随机闪烁
            firefly.brightness += (Math.random() - 0.5) * 0.1;
            firefly.brightness = Math.max(0.2, Math.min(1, firefly.brightness));

            // 更新位置和亮度
            firefly.element.style.left = firefly.x + 'px';
            firefly.element.style.top = firefly.y + 'px';
            firefly.element.style.opacity = firefly.brightness;
        });

        requestAnimationFrame(update);
    }

    update();
}

function toggleStars() {
    const starsContainer = document.getElementById('stars-container');
    const snowContainer = document.getElementById('snow-container');
    const waveContainer = document.querySelector('.wave-container');
    
    if (!starsContainer) return;
    
    starsConfig.enabled = !starsConfig.enabled;
    starsContainer.style.opacity = starsConfig.enabled ? '1' : '0';
    
    // 星空打开时关闭雪花和海浪，星空关闭时打开雪花和海浪
    if (snowContainer) {
        snowContainer.style.opacity = starsConfig.enabled ? '0' : '1';
    }
    if (waveContainer) {
        waveContainer.style.display = starsConfig.enabled ? 'none' : 'block';
    }
    
    // 更新按钮状态
    const btn = document.getElementById('toggle-stars-btn');
    if (btn) {
        btn.textContent = starsConfig.enabled ? '✨ Stars: ON' : '✨ Stars: OFF';
        btn.classList.toggle('stars-active', starsConfig.enabled);
    }
}