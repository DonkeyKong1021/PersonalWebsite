document.addEventListener("DOMContentLoaded", function () {
    // Function to open a specific calculator tab
    function openCalculator(evt, calculatorName) {
        // Hide all tab content
        var tabcontent = document.getElementsByClassName("tabcontent");
        for (var i = 0; i < tabcontent.length; i++) {
            tabcontent[i].style.display = "none";
        }

        // Remove the active class from all tab links
        var tablinks = document.getElementsByClassName("tablinks");
        for (var i = 0; i < tablinks.length; i++) {
            tablinks[i].className = tablinks[i].className.replace(" active", "");
        }

        // Show the current tab and add the active class to the clicked tab link
        document.getElementById(calculatorName).style.display = "block";
        evt.currentTarget.className += " active";
    }

    // Function to calculate the end amount
    function calculateEndAmount() {
        var startingAmount = parseFloat(document.getElementById("startingAmount").value) || 0;
        var afterYears = parseFloat(document.getElementById("afterYears").value) || 0;
        var returnRate = parseFloat(document.getElementById("returnRate").value) || 0;
        var compoundFrequency = document.getElementById("compoundFrequency").value;
        var additionalContribution = parseFloat(document.getElementById("additionalContribution").value) || 0;

        var compoundTimes = {
            annually: 1,
            semiannually: 2,
            quarterly: 4,
            monthly: 12
        };

        var n = compoundTimes[compoundFrequency];
        var r = returnRate / 100 / n;
        var t = afterYears * n;

        // Formula to calculate the end amount with regular contributions
        var endAmount = startingAmount * Math.pow(1 + r, t) +
            additionalContribution * ((Math.pow(1 + r, t) - 1) / r) * (1 + r);

        document.getElementById("endAmountResult").innerText = `End Amount: $${endAmount.toFixed(2)}`;
    }

    // Attach event listeners to tab buttons and calculate button
    var tabButtons = document.getElementsByClassName("tablinks");
    for (var i = 0; i < tabButtons.length; i++) {
        tabButtons[i].addEventListener("click", function (evt) {
            openCalculator(evt, evt.currentTarget.innerText.replace(" ", ""));
        });
    }

    document.querySelector(".calculate-btn").addEventListener("click", calculateEndAmount);
});