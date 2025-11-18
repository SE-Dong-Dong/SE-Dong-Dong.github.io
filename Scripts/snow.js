const snowflakes = [];
const numFlakes = 50; // 雪花数量
let container;

function createSnowflake() {
    const snowflake = document.createElement('div');
    snowflake.classList.add('snowflake');
    snowflake.innerHTML = '❄'; // 雪花字符
    const left = Math.random() * window.innerWidth;
    snowflake.style.left = left + 'px';
    snowflake.style.top = '-20px';
    snowflake.style.fontSize = (10 + Math.random() * 20) + 'px';
    snowflake.speed = 1 + Math.random() * 3;
    snowflake.x = left;
    snowflake.y = -20;
    container.appendChild(snowflake);
    snowflakes.push(snowflake);
}

function moveSnowflakes() {
    for (let flake of snowflakes) {
        flake.y += flake.speed;
        flake.style.top = flake.y + 'px';
        if (flake.y > window.innerHeight) {
            flake.y = -20;
            flake.x = Math.random() * window.innerWidth;
            flake.style.left = flake.x + 'px';
        }
    }
    requestAnimationFrame(moveSnowflakes);
}

function initSnow(containerId) {
    container = document.getElementById(containerId);
    for (let i = 0; i < numFlakes; i++) {
        createSnowflake();
    }
    moveSnowflakes();

    window.addEventListener('resize', () => {
        for (let flake of snowflakes) {
            if (flake.x > window.innerWidth) {
                flake.x = Math.random() * window.innerWidth;
                flake.style.left = flake.x + 'px';
            }
        }
    });
}