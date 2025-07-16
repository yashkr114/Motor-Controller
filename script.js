let currentFrequency = 0;
let currentSwitch = 1;
let direction = 1; // 1 for forward, -1 for reverse

function updateDisplay(freq) {
    currentFrequency = parseInt(freq);
    document.getElementById('currentFreq').textContent = Math.abs(currentFrequency);
    document.getElementById('freqSlider').value = Math.abs(currentFrequency);
    document.getElementById('freq').value = Math.abs(currentFrequency);

    document.getElementById('currentFreq').classList.add('frequency-updated');
    setTimeout(() => {
        document.getElementById('currentFreq').classList.remove('frequency-updated');
    }, 300);
}


function setFrequency(isForward) {
    let rpm = parseInt(document.getElementById('freq').value);
    if (isNaN(rpm)) return;

    direction = isForward ? 1 : -1;
    const signedRpm = direction * rpm;

    fetch(`/set_delay?value=${signedRpm}`)
        .then(response => response.text())
        .then(() => {
            updateDisplay(signedRpm);
            updateDirectionDisplay();
        });
}





function sendCommand(type) {
    let newFreq = currentFrequency;

    if (type === 'increase') {
        // When direction is forward: increase RPM (+1)
        // When direction is reverse: decrease RPM (-1 to go more negative)
        newFreq += direction * 1;
        fetch(`/set_delay?value=${newFreq}`)
            .then(response => response.text())
            .then(() => updateDisplay(newFreq));
    }

    else if (type === 'decrease') {
        // When direction is forward: decrease RPM (-1)
        // When direction is reverse: increase RPM (+1 to go less negative)
        newFreq -= direction * 1;
        fetch(`/set_delay?value=${newFreq}`)
            .then(response => response.text())
            .then(() => updateDisplay(newFreq));
    }

    else if (type === 'switch') {
        currentSwitch = currentSwitch === 0 ? 1 : 0;
        fetch(`/set_switch?value=${currentSwitch}`)
            .then(response => response.text());
    }
}


function updateDirectionDisplay() {
    document.getElementById('currentDirection').textContent = direction === 1 ? "Forward" : "Reverse";
}


function sliderChange(value) {
    const signedValue = direction * parseInt(value);
    fetch(`/set_delay?value=${signedValue}`)
        .then(response => response.text())
        .then(() => updateDisplay(signedValue));
}


window.onload = function() {
    fetch('/get_status')
        .then(response => response.json())
        .then(data => {
            console.log("Fetched data on load:", data);  // optional debug log
            updateDisplay(data.rpm);
            direction = data.rpm >= 0 ? 1 : -1;
            updateDirectionDisplay();
            currentSwitch = data.switch;

        })
        .catch(err => console.error('Failed to fetch status:', err));
};

// 🔄 Auto-refresh every 3 seconds
setInterval(() => {
    fetch('/get_status')
        .then(response => response.json())
        .then(data => {
            console.log("Fetched data on interval:", data);  // optional debug log
            updateDisplay(data.rpm);

            // 🔁 FIX: update direction and UI
            direction = data.rpm >= 0 ? 1 : -1;
            updateDirectionDisplay();

            currentSwitch = data.switch;
        })
        .catch(err => console.error('Auto refresh failed:', err));
}, 10000);


