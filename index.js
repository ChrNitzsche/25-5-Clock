'use strict';

// Settings
const svg_startBtn = 'M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM6.79 5.093A.5.5 0 0 0 6 5.5v5a.5.5 0 0 0 .79.407l3.5-2.5a.5.5 0 0 0 0-.814l-3.5-2.5z';
const svg_pauseBtn = 'M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM6.25 5C5.56 5 5 5.56 5 6.25v3.5a1.25 1.25 0 1 0 2.5 0v-3.5C7.5 5.56 6.94 5 6.25 5zm3.5 0c-.69 0-1.25.56-1.25 1.25v3.5a1.25 1.25 0 1 0 2.5 0v-3.5C11 5.56 10.44 5 9.75 5z';
const svg_resetBtn = 'M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM6.5 5A1.5 1.5 0 0 0 5 6.5v3A1.5 1.5 0 0 0 6.5 11h3A1.5 1.5 0 0 0 11 9.5v-3A1.5 1.5 0 0 0 9.5 5h-3z';
const defaultSessionMinutes = 25;
const defaultBreakMinutes = 5;

let timerWarning = 15; // Zeit, wenn #time-left ändert sich zur Warnfarbe! Bitte eine Sekunde mehr!
let timerAlarm = 10; // Zeit, wenn #time-left rot blinkt! Bitte eine Sekunde mehr angeben!
let timerDelay = 30; // setIntervall Delay

/* Variablen: State (global) */
let timer_state_isPaused = false;
let timer_state_pauseOffset = 0;
let timer_state_isSession = true;
let timer_state_timeLeft; // verbleibende Zeit des Timers; global, da auch notwendig für setPause()
let timer_startTime; // Wann wurde der Timer gestartet (nach Start und Pause->Weiter)
let timer_setSessionMinute = defaultSessionMinutes;
let timer_setBreakMinute = defaultBreakMinutes;
let timerIntervalID;
var innerCircle;

$(document).ready(function() {
    $('#circle').circleProgress({
        startAngle: -Math.PI / 2,
        value: 0,
        size: 300,
        animation: false,
        animationStartValue: 0.0,
        emptyFill: "rgb(75, 75, 75)",
        fill: { image: 'src/img/radial.png' },
        thickness: 15
    });
    $('#svg_reset').attr('d', svg_resetBtn);
    initValues();
});


function initValues() {

    timer_state_pauseOffset = 0;

    $('#session-length').text(defaultSessionMinutes);
    $('#break-length').text(defaultBreakMinutes);
    $('#time-left').text(Sekundenumwandeln(defaultSessionMinutes * 60));
    $('#timer-label').text('Session');
    setStartButton(true);
    timer_setSessionMinute = defaultSessionMinutes;
    timer_setBreakMinute = defaultBreakMinutes;

    timer_state_isPaused = false;
    timerIntervalID = null;

    $('#circle').circleProgress({ 'value': 0 });
    innerCircle.set(0);
}


/* ########################################################################################### */

function fuehrendeNull(wert) {
    if (wert < 10) return "0" + parseInt(wert)
    else return parseInt(wert);
}

function Sekundenumwandeln(Sekundenzahl) {
    Sekundenzahl = Math.abs(Sekundenzahl)
    return fuehrendeNull((Sekundenzahl / 60)) + ":" + fuehrendeNull(Sekundenzahl % 60);
}

function calculateTimerDiference(start, now, q = 1) {
    return Math.trunc(now - start) / q;
}


function startStopButtonClick() {

    if (document.getElementById('time-left').classList.length == 0) { // erster Start, nach Reset o.ä.
        timer_state_isSession = true;
    }

    // Wenn der Start-Button das Startsymbol hat, dann ... sonst ...
    if ($('#svg_start').attr('d') == svg_startBtn) {
        setStartButton(false);
        startNewTimer(timer_state_isSession, timer_state_pauseOffset);
        timer_state_isPaused = false;
    } else
        setPause();
}

function setPause() {
    timer_state_isPaused = true;
    setStartButton(true);
    if (timer_state_timeLeft < timerAlarm) $('#time-left').removeClass('blink');
    timer_state_pauseOffset = calculateTimerDiference(timer_startTime, new Date().getTime(), 1000);
    clearInt(timerIntervalID);
}


function startNewTimer(currentIsSession, timer_state_pauseOffset = 0) {
    setClasses(timer_state_isSession, false);
    timer_state_isSession == true ?
        calculateTimeLeft(timer_setSessionMinute, 0, timer_state_pauseOffset) :
        calculateTimeLeft(timer_setBreakMinute, 0, timer_state_pauseOffset);
}


function setClasses(nowSession, timeLeft) {
    // timeLeft = restliche Zeit in Sekunden.
    nowSession == true ?
        $('#time-left').addClass('sessionTime').removeClass('breakTime') :
        $('#time-left').removeClass('sessionTime').addClass('breakTime');

    if (timeLeft != false) {
        if (timeLeft <= timerAlarm)
            $('#time-left').addClass('blink lastSeconds').removeClass('warnTime')
        else {
            if (timeLeft <= timerWarning)
                $('#time-left').addClass('warnTime').removeClass('blink lastSeconds');
        }
    } else
        $('#time-left').removeClass('warnTime blink lastSeconds');
}


function outerArcOutput(percentValue) {
    if (percentValue >= 1) {
        $('#circle').circleProgress({ 'reverse': true });
        percentValue = 1 - percentValue;
    } else {
        $('#circle').circleProgress({ 'reverse': false });
    }
    $('#circle').circleProgress({ 'value': percentValue });
}


function setTimerLabel() {
    timer_state_isSession == true ?
        $('#timer-label').html('Session') :
        $('#timer-label').html('Break');
}

function calculateTimeLeft(min, sek, rest = 0) {
    timer_startTime = new Date().getTime() - rest * 1000;
    timerIntervalID = setInterval(() => {
        if (timer_state_isPaused == true) {
            clearInt(timerIntervalID);
        } else {
            let timer_nowTime = new Date().getTime();

            // #time-left of session in sec
            timer_state_timeLeft = (min * 60 + sek + 1) - calculateTimerDiference(timer_startTime, timer_nowTime, 1000);
            if (timer_state_timeLeft <= timerWarning) setClasses(timer_state_isSession, timer_state_timeLeft);
            $('#time-left').text(Sekundenumwandeln(timer_state_timeLeft));

            // timerProgressLeft >> % von innerCircle berechnen in der Geschwindigkeit von timerDelay
            let timerProgressLeft = (calculateTimerDiference(timer_startTime, timer_nowTime) * 100 / (min * 60 + sek)) / 1000;
            timer_state_isSession ?
                innerCircle.set(timerProgressLeft, true) :
                innerCircle.set(100 - timerProgressLeft, true);

            // outer Circle Progress & every 2nd minute reverse and back
            // berechneter Wert: 0 < x < 2 && entspricht %-Werts eines vollen Kreisumrundung
            outerArcOutput(((timer_nowTime - timer_startTime) / 60000) % 2);

            // Abfrage, wann Timer zu ende & neuer Timer!
            if (timer_state_timeLeft <= 1 || fixfix == true) {
                timer_state_isSession = !timer_state_isSession;
                setTimerLabel()
                document.getElementById('beep').play();
                clearInt(timerIntervalID);
                timer_state_pauseOffset = 0;
                startNewTimer(timer_state_isSession);
            }
        }

    }, timerDelay);
}


function setStartButton(start = true) {
    if (start == true || start == null)
        $('#svg_start').attr('d', svg_startBtn) // SVG: Start
    else
        $('#svg_start').attr('d', svg_pauseBtn); // SVG: Pause!
}


function clearInt(id) {
    clearInterval(id);
    timerIntervalID = null;
}

function createElement(tag, attrs) {
    var element = document.createElement(tag);
    for (var k in attrs) {
        element.setAttribute(k, attrs[k]);
    }
    return element;
}

function createInnerCircle() {
    var progressPath = createElement('div', {
        class: 'ldBar',
        style: 'width: 300px; height: 300px; margin: 0 auto;',
        'data-type': 'fill',
        'data-duration': '0',
        'data-precision': '0.001',
        'data-path': 'M 0 0 a 100 100 0 1 1 0.00001 0',
        'data-fill-background': 'rgba(0,0,0,0.2)',
        'data-fill': 'data:ldbar/res,gradient(90,0,#101010,#FFA9F5)',
        'data-min': '0',
        'data-max': '100',
        'data-fill-background-extrude': '9'
    });

    $('#InnerArc').prepend(progressPath);
    innerCircle = new ldBar(document.querySelector(".ldBar"));
}

function btnReset() {
    document.getElementById('beep').pause();
    document.getElementById('beep').currentTime = 0;
    timer_startTime = undefined;
    clearInt(timerIntervalID);
    setStartButton(true);
    initValues();
    setClasses(true, false);
    $('#time-left').removeClass('blink lastSeconds breakTime sessionTime');
}

function handleBtnClick(value) {
    if (timer_startTime == undefined) {
        switch (value) {
            case 'b+':
                (value[1] && timer_setBreakMinute >= 60) ? timer_setBreakMinute: timer_setBreakMinute++;
                break;
            case 'b-':
                (value[1] && timer_setBreakMinute <= 1) ? timer_setBreakMinute: timer_setBreakMinute--;
                break;
            case 's+':
                (value[1] && timer_setSessionMinute >= 60) ? timer_setSessionMinute: timer_setSessionMinute++;
                break;
            case 's-':
                (value[1] && timer_setSessionMinute <= 1) ? timer_setSessionMinute: timer_setSessionMinute--;
                break;
            case 'b*':
                (value[1] && timer_setBreakMinute + 5 >= 60) ? timer_setBreakMinute = 60: timer_setBreakMinute += 5;
                break;
            case 'b/':
                (value[1] && timer_setBreakMinute - 5 <= 1) ? timer_setBreakMinute = 1: timer_setBreakMinute -= 5;
                break;
            case 's*':
                (value[1] && timer_setSessionMinute + 5 >= 60) ? timer_setSessionMinute = 60: timer_setSessionMinute += 5;
                break;
            case 's/':
                (value[1] && timer_setSessionMinute - 5 <= 1) ? timer_setSessionMinute = 1: timer_setSessionMinute -= 5;
                break;
        }

        if (value[0] == 's') {
            $('#session-length').text(timer_setSessionMinute);
            $('#time-left').html(Sekundenumwandeln(timer_setSessionMinute * 60));
        } else {
            $('#break-length').html(timer_setBreakMinute);
        };
    }
}

createInnerCircle();