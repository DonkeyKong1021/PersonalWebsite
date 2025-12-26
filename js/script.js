// Navbar Responsivness
function openSidebar() {
    document.getElementById("sidebar").style.width = "250px";
}

function closeSidebar() {
    document.getElementById("sidebar").style.width = "0";
}

// Load Navbar and Sidebar dynamically
document.addEventListener("DOMContentLoaded", function() {
    const navbarPlaceholder = document.getElementById("navbar-placeholder");
    if (navbarPlaceholder) {
        fetch("navbar.html")
            .then(response => response.text())
            .then(data => {
                navbarPlaceholder.innerHTML = data;
                setActiveNavLink();
            })
            .catch(error => console.error("Error loading navbar:", error));
    }
});

function setActiveNavLink() {
    const currentPath = window.location.pathname.split("/").pop() || "index.html";
    const navLinks = document.querySelectorAll(".nav-item a");
    const sidebarLinks = document.querySelectorAll(".sidebar a");

    // Helper to set active class
    const setActive = (links) => {
        links.forEach(link => {
            const href = link.getAttribute("href");
            if (href === currentPath) {
                // For navbar items, the class is on the li parent
                if (link.parentElement.classList.contains("nav-item")) {
                    document.querySelectorAll(".nav-item").forEach(item => item.classList.remove("active"));
                    link.parentElement.classList.add("active");
                }
                // For sidebar, usually we might style the link itself, but let's check styles
                // Global css: .sidebar a:hover { ... } - no active class defined for sidebar links in global.css
                // But we can add one if needed. For now, focus on main nav.
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
