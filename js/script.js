// Navbar Responsivness
function openSidebar() {
    document.getElementById("sidebar").style.width = "250px";
}

function closeSidebar() {
    document.getElementById("sidebar").style.width = "0";
}

const PAGE_MAP = {
    "index.html":       { module: "OPERATOR",   route: "/operator/profile",      label: "Operator Profile" },
    "resume.html":      { module: "RESUME",     route: "/resume/cv",               label: "Resume" },
    "under_construction.html": { module: "PIPELINE", route: "/pipeline/projects", label: "Project Pipeline" },
    "woodworking.html": { module: "WORKSHOP",   route: "/workshop/builds",         label: "Workshop Builds" },
    "finance.html":     { module: "ANALYTICS",  route: "/analytics/finance",       label: "Finance Analytics" },
    "portfolio.html":   { module: "NUVUE",      route: "/nuvue/media",             label: "NuVue Media" },
    "investment_return_calc.html": { module: "ANALYTICS", route: "/analytics/investment", label: "Investment Calc" },
    "options_pricing_calc.html":   { module: "ANALYTICS", route: "/analytics/options",    label: "Options Pricing" },
    "options_profit_calc.html":    { module: "ANALYTICS", route: "/analytics/profit",     label: "Options Profit" },
    "revops.html":      { module: "REVOPS",     route: "/revops/command",          label: "RevOps Command" },
    "videos.html":      { module: "PLAYBACK",   route: "/resume/playback",         label: "Playback Archive" }
};

function getCurrentPage() {
    return window.location.pathname.split("/").pop() || "index.html";
}

function initRevOpsHud() {
    const currentPath = getCurrentPage();
    const pageInfo = PAGE_MAP[currentPath] || { module: "SYSTEM", route: "/system", label: "System" };

    const moduleLabel = document.getElementById("hud-module-label");
    if (moduleLabel) {
        moduleLabel.textContent = `MODULE: ${pageInfo.module}`;
    }

    injectRouteBar(pageInfo);
    initOperatorPage();
}

function initOperatorPage() {
    animateMetricCounters();

    document.querySelectorAll(".pipe-node.active").forEach((node, i) => {
        node.style.animationDelay = `${i * 0.4}s`;
    });
}

function animateMetricCounters() {
    const counters = document.querySelectorAll(".metric-value[data-count]");
    if (!counters.length) return;

    counters.forEach(el => {
        const target = parseFloat(el.dataset.count);
        const decimals = parseInt(el.dataset.decimal || "0", 10);
        const unit = el.querySelector(".metric-unit");
        const unitHTML = unit ? unit.outerHTML : "";
        const duration = 1400;
        const start = performance.now();

        function tick(now) {
            const progress = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = target * eased;
            const display = decimals > 0 ? current.toFixed(decimals) : Math.round(current);
            el.innerHTML = display + unitHTML;
            if (progress < 1) requestAnimationFrame(tick);
        }

        requestAnimationFrame(tick);
    });
}

function injectRouteBar(pageInfo) {
    const mainContent = document.querySelector(".content, .parent, .construction-container, .investment-content, .options-content, .revops-page, .operator-page, .videos-page, .portfolio-page");
    if (!mainContent || document.querySelector(".page-route-bar")) return;

    const bar = document.createElement("div");
    bar.className = "page-route-bar";
    bar.innerHTML = `<span><span class="route-prefix">ROUTE &gt;</span><span class="route-path">${pageInfo.route}</span></span><span class="route-status">● ${pageInfo.label.toUpperCase()} LOADED</span>`;
    mainContent.parentNode.insertBefore(bar, mainContent);
}

function initSnakeGrid() {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const GRID = 40;
    const MAX_LENGTH = 36;
    const TAIL_FADE_MS = 2200;

    const canvas = document.createElement("canvas");
    canvas.className = "snake-grid-canvas";
    canvas.setAttribute("aria-hidden", "true");
    document.body.prepend(canvas);

    const ctx = canvas.getContext("2d");
    let snake = [];
    let lastCell = null;
    let rafId = null;

    function resize() {
        const dpr = window.devicePixelRatio || 1;
        canvas.width = Math.floor(window.innerWidth * dpr);
        canvas.height = Math.floor(window.innerHeight * dpr);
        canvas.style.width = `${window.innerWidth}px`;
        canvas.style.height = `${window.innerHeight}px`;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function cellFromPoint(clientX, clientY) {
        return {
            x: Math.floor(clientX / GRID),
            y: Math.floor(clientY / GRID)
        };
    }

    function cellsBetween(from, to) {
        if (!from) return [to];

        const path = [];
        let x0 = from.x;
        let y0 = from.y;
        const x1 = to.x;
        const y1 = to.y;
        const dx = Math.abs(x1 - x0);
        const dy = Math.abs(y1 - y0);
        const sx = x0 < x1 ? 1 : -1;
        const sy = y0 < y1 ? 1 : -1;
        let err = dx - dy;

        while (true) {
            path.push({ x: x0, y: y0 });
            if (x0 === x1 && y0 === y1) break;
            const e2 = 2 * err;
            if (e2 > -dy) {
                err -= dy;
                x0 += sx;
            }
            if (e2 < dx) {
                err += dx;
                y0 += sy;
            }
        }

        return path;
    }

    function pushCells(cells) {
        const now = performance.now();

        cells.forEach(cell => {
            if (lastCell && lastCell.x === cell.x && lastCell.y === cell.y) return;
            snake.unshift({ x: cell.x, y: cell.y, born: now });
            lastCell = cell;
        });

        const cutoff = now - TAIL_FADE_MS;
        snake = snake.filter(seg => seg.born >= cutoff);

        if (snake.length > MAX_LENGTH) {
            snake.length = MAX_LENGTH;
        }
    }

    function handlePointer(clientX, clientY) {
        const target = cellFromPoint(clientX, clientY);
        const path = cellsBetween(lastCell, target);
        const newCells = lastCell ? path.slice(1) : path;
        if (newCells.length) pushCells(newCells);
        scheduleDraw();
    }

    function draw() {
        rafId = null;
        const now = performance.now();
        const width = window.innerWidth;
        const height = window.innerHeight;

        ctx.clearRect(0, 0, width, height);

        snake = snake.filter(seg => seg.born >= now - TAIL_FADE_MS);

        snake.forEach((seg, index) => {
            const age = (now - seg.born) / TAIL_FADE_MS;
            const trail = 1 - index / Math.max(snake.length, 1);
            const alpha = Math.max(0.08, (1 - age) * trail);
            const isHead = index === 0;
            const pad = 1;
            const x = seg.x * GRID + pad;
            const y = seg.y * GRID + pad;
            const size = GRID - pad * 2;

            if (isHead) {
                ctx.fillStyle = `rgba(0, 240, 255, ${Math.min(0.75, alpha + 0.35)})`;
                ctx.fillRect(x, y, size, size);
                ctx.strokeStyle = `rgba(255, 42, 109, ${Math.min(0.9, alpha + 0.4)})`;
                ctx.lineWidth = 1.5;
                ctx.strokeRect(x + 0.5, y + 0.5, size - 1, size - 1);
            } else {
                const hueShift = index / snake.length;
                const r = Math.round(5 + (0 - 5) * hueShift);
                const g = Math.round(255 - (255 - 240) * hueShift);
                const b = Math.round(161 - (161 - 255) * hueShift);
                ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha * 0.55})`;
                ctx.fillRect(x, y, size, size);
            }
        });

        if (snake.length) {
            scheduleDraw();
        }
    }

    function scheduleDraw() {
        if (!rafId) {
            rafId = requestAnimationFrame(draw);
        }
    }

    window.addEventListener("mousemove", e => handlePointer(e.clientX, e.clientY));
    window.addEventListener("touchmove", e => {
        if (e.touches[0]) {
            handlePointer(e.touches[0].clientX, e.touches[0].clientY);
        }
    }, { passive: true });

    window.addEventListener("resize", () => {
        resize();
        scheduleDraw();
    });

    resize();
}

// Load Navbar and Sidebar dynamically
document.addEventListener("DOMContentLoaded", function() {
    initSnakeGrid();

    const navbarPlaceholder = document.getElementById("navbar-placeholder");
    if (navbarPlaceholder) {
        fetch("navbar.html")
            .then(response => response.text())
            .then(data => {
                navbarPlaceholder.innerHTML = data;
                const sidebar = document.getElementById("sidebar");
                if (sidebar) {
                    document.body.appendChild(sidebar);
                }
                setActiveNavLink();
                initRevOpsHud();
            })
            .catch(error => console.error("Error loading navbar:", error));
    } else {
        initRevOpsHud();
    }
});

function setActiveNavLink() {
    const currentPath = getCurrentPage();
    const navLinks = document.querySelectorAll(".nav-item a");
    const sidebarLinks = document.querySelectorAll(".sidebar a");

    const setActive = (links) => {
        links.forEach(link => {
            const href = link.getAttribute("href");
            if (href === currentPath) {
                if (link.parentElement.classList.contains("nav-item")) {
                    document.querySelectorAll(".nav-item").forEach(item => item.classList.remove("active"));
                    link.parentElement.classList.add("active");
                }
            }
        });
    };

    setActive(navLinks);
    setActive(sidebarLinks);
}

// Tab switching for calculators
function openCalculator(event, calculatorId) {
    var i
    var tabcontent = document.getElementsByClassName("tabcontent")
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none"
    }

    var tablinks = document.getElementsByClassName("tablinks")
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].classList.remove("active")
    }

    var target = document.getElementById(calculatorId)
    if (target) {
        target.style.display = "block"
    }
    if (event && event.currentTarget) {
        event.currentTarget.classList.add("active")
    }
}

// Investment - End Amount calculator
var investmentChart = null;

function calculateEndAmount() {
    var startingAmount = parseFloat(document.getElementById("startingAmount")?.value) || 0
    var years = parseFloat(document.getElementById("afterYears")?.value) || 0
    var returnRate = parseFloat(document.getElementById("returnRate")?.value) || 0
    var compoundFrequency = (document.getElementById("compoundFrequency")?.value || "annually").toLowerCase()
    var additionalContribution = parseFloat(document.getElementById("additionalContribution")?.value) || 0

    var frequencyMap = { annually: 1, semiannually: 2, quarterly: 4, monthly: 12 }
    var n = frequencyMap[compoundFrequency] || 1
    var r = (returnRate / 100) / n
    var periods = years * n

    // Calculate growth over time for chart
    var labels = [];
    var dataPoints = [];
    var balance = startingAmount;

    // We'll plot yearly points for cleaner graph
    var steps = years; 
    
    // Initial point
    labels.push("Year 0");
    dataPoints.push(startingAmount);

    for (var i = 1; i <= steps; i++) {
        // Calculate balance at end of year i
        // Using the formula year by year to accumulate contributions correctly relative to compounding
        var periodsPerYear = n;
        for (var p = 0; p < periodsPerYear; p++) {
            balance = balance * (1 + r) + additionalContribution;
        }
        labels.push("Year " + i);
        dataPoints.push(balance);
    }
    
    var endAmount = balance; // This might slightly differ from direct formula due to loop precision but matches the graph

    var resultEl = document.getElementById("endAmountResult")
    if (resultEl) {
        resultEl.textContent = "End Amount: $" + endAmount.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
    }

    // Update Chart
    var ctx = document.getElementById('investmentChart');
    if (ctx) {
        if (investmentChart) {
            investmentChart.destroy();
        }
        
        investmentChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Portfolio Value',
                    data: dataPoints,
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 2,
                    pointRadius: 3,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return '$' + value.toLocaleString();
                            }
                        }
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                var label = context.dataset.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                if (context.parsed.y !== null) {
                                    label += new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(context.parsed.y);
                                }
                                return label;
                            }
                        }
                    }
                }
            }
        });
    }
}

// Options Pricing - Black-Scholes with dividend yield
function calculateOptionPrice() {
    var S = parseFloat(document.getElementById("underlyingPrice")?.value) || 0
    var K = parseFloat(document.getElementById("strikePrice")?.value) || 0
    var T = parseFloat(document.getElementById("timeToExpiration")?.value) || 0
    var sigmaPct = parseFloat(document.getElementById("volatility")?.value) || 0
    var rPct = parseFloat(document.getElementById("riskFreeRate")?.value) || 0
    var qPct = parseFloat(document.getElementById("dividendYield")?.value) || 0
    var type = (document.getElementById("optionType")?.value || "call").toLowerCase()

    var sigma = sigmaPct / 100
    var r = rPct / 100
    var q = qPct / 100

    if (S <= 0 || K <= 0 || T <= 0 || sigma <= 0) {
        var resultEl0 = document.getElementById("optionPriceResult")
        if (resultEl0) {
            resultEl0.textContent = "Please enter positive inputs."
        }
        return
    }

    var d1 = (Math.log(S / K) + (r - q + 0.5 * sigma * sigma) * T) / (sigma * Math.sqrt(T))
    var d2 = d1 - sigma * Math.sqrt(T)

    function cdf(x) {
        // Standard normal CDF via Abramowitz-Stegun approximation
        var a1 = 0.319381530
        var a2 = -0.356563782
        var a3 = 1.781477937
        var a4 = -1.821255978
        var a5 = 1.330274429
        var p = 0.2316419
        var t = 1 / (1 + p * Math.abs(x))
        var m = 1 - (1 / Math.sqrt(2 * Math.PI)) * Math.exp(-0.5 * x * x) *
            (a1 * t + a2 * Math.pow(t, 2) + a3 * Math.pow(t, 3) + a4 * Math.pow(t, 4) + a5 * Math.pow(t, 5))
        return x >= 0 ? m : 1 - m
    }

    var Nd1 = cdf(d1)
    var Nd2 = cdf(d2)
    var Nnd1 = cdf(-d1)
    var Nnd2 = cdf(-d2)

    var call = S * Math.exp(-q * T) * Nd1 - K * Math.exp(-r * T) * Nd2
    var put = K * Math.exp(-r * T) * Nnd2 - S * Math.exp(-q * T) * Nnd1
    var price = type === "put" ? put : call

    var resultEl = document.getElementById("optionPriceResult")
    if (resultEl) {
        resultEl.textContent = "$" + price.toFixed(4)
    }
}

// Options Profit calculator (simple model)
function calculateProfit() {
    var type = (document.getElementById("optionsType")?.value || "call").toLowerCase()
    var sharePrice = parseFloat(document.getElementById("sharePrice")?.value) || 0
    var optionPrice = parseFloat(document.getElementById("optionPrice")?.value) || 0
    var strikePrice = parseFloat(document.getElementById("strikePrice")?.value) || 0
    var contracts = parseFloat(document.getElementById("contracts")?.value) || 0

    var shares = contracts * 100
    var profitPerShare
    if (type === "put") {
        profitPerShare = (strikePrice - sharePrice) - optionPrice
    } else {
        profitPerShare = (sharePrice - strikePrice) - optionPrice
    }
    var totalProfit = profitPerShare * shares

    var result = document.getElementById("result")
    if (result) {
        var prefix = totalProfit >= 0 ? "Profit" : "Loss"
        result.textContent = prefix + ": $" + totalProfit.toFixed(2)
    }
}
