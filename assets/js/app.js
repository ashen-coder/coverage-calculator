// @ts-check
'use strict'

console.log('Script is OK! ༼ つ ◕_◕ ༽つ');

// Types
/** @typedef {import('./lib/chartjs/chart.js').Chart} Chart */
/** @typedef {Record<string, number>[]} ResultList */

const CRITICAL_ERROR_MESSAGE = "Please refresh the page and try again.";

let currency = 'R';

/** @param {Event} event */
function forceNumeric(event) {
    const element = /** @type {?HTMLInputElement} */ (event.target);
    if (!element) return;
    element.value = element.value
        .replace(/[^0-9.]/g, '')
        .replace(/(\..*?)\..*/g, '$1');
}

/** @param {string} value */
function getCurrencySymbol(value) {
    switch (value) {
        case 'USD':
            return '$';
        case 'EUR':
            return '€';
        case 'GBP':
            return '£';
        case 'ZAR':
        default:
            return 'R';
    }
}

/**
 * @param {number} num
 * @param {string} space
 * @returns {string}
 */
function currencyFormat(num, space = '&nbsp') {
    return `${currency}${space}` + num.toFixed(2).replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,')
}

/**
 * @param {string} backgroundColor 
 * @param {string} patternColor 
 * @param {number} stroke 
 * @returns {?CanvasPattern}
 */
function createDiagonalPattern(backgroundColor, patternColor, stroke) {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    if (!context) return null;

    const size = 10;
    const strokeOffset = stroke / 2;
    canvas.width = size;
    canvas.height = size;

    context.fillStyle = backgroundColor;
    context.fillRect(0, 0, canvas.width, canvas.height);

    context.strokeStyle = patternColor;
    context.lineWidth = stroke;

    context.moveTo(size / 2 - strokeOffset, -strokeOffset);
    context.lineTo(size + strokeOffset, size / 2 + strokeOffset);
    context.moveTo(-strokeOffset, size / 2 - strokeOffset);
    context.lineTo(size / 2 + strokeOffset, size + strokeOffset);
    context.stroke();

    return context.createPattern(canvas, 'repeat');
}


const customDataLabels = {
    id: 'customDataLabel',
    afterDatasetDraw(chart, args, pluginOptions) {
        const {
            ctx,
            data
        } = chart;
        ctx.save();

        data.datasets[0].data.forEach((datapoint, index) => {
            const { x, y } = chart.getDatasetMeta(0).data[index].tooltipPosition();

            ctx.textAlign = 'center';
            ctx.font = '14px Inter';
            ctx.fillStyle = '#fff';
            ctx.textBaseline = 'middle';
            let toolTipText = datapoint != '0' ? datapoint + '%' : '';
            ctx.fillText(toolTipText, x, y);
        });
    },
};

const colors = {
    primary: '#162953',
    primaryLight: '#25468d',
    secondary: '#00ABD0',
    red: 'hsl(7, 75%, 60%)'
};

const tooltip = {
    enabled: false,
    external: function (context) {
        let tooltipEl = document.getElementById('chartjs-tooltip');

        // Create element on first render
        if (!tooltipEl) {
            tooltipEl = document.createElement('div');
            tooltipEl.id = 'chartjs-tooltip';
            tooltipEl.innerHTML = '<table></table>';
            document.body.appendChild(tooltipEl);
        }

        // Hide if no tooltip
        const tooltipModel = context.tooltip;
        if (tooltipModel.opacity === 0) {
            tooltipEl.style.opacity = '0';
            return;
        }

        // Set caret Position
        tooltipEl.classList.remove('above', 'below', 'no-transform');
        if (tooltipModel.yAlign) {
            tooltipEl.classList.add(tooltipModel.yAlign);
        } else {
            tooltipEl.classList.add('no-transform');
        }

        if (tooltipModel.body) {
            let innerHtml = '<thead>';

            const required = `Required ${tooltipModel.title}: ${currencyFormat(tooltipModel.dataPoints[0]?.raw)}`;
            const existing = `Existing ${tooltipModel.title}: ${currencyFormat(tooltipModel.dataPoints[1]?.raw)}`;
            const shortfall = `Shorfall in ${tooltipModel.title}: ${currencyFormat(tooltipModel.dataPoints[2]?.raw)}`;

            innerHtml += '<tr><th class="loan-chart__title">' + required + '</th></tr>';
            innerHtml += '<tr><th class="loan-chart__title">' + existing + '</th></tr>';
            innerHtml += '<tr><th class="loan-chart__title">' + shortfall + '</th></tr>';

            innerHtml += '</thead>';

            const tableRoot = tooltipEl.querySelector('table');
            if (tableRoot) {
                tableRoot.innerHTML = innerHtml;
            }
        }

        const position = context.chart.canvas.getBoundingClientRect();

        // Display, position, and set styles for font
        tooltipEl.style.opacity = '1';
        tooltipEl.style.position = 'absolute';
        tooltipEl.style.left = position.left + window.scrollX + tooltipModel.caretX - tooltipEl.clientWidth / 2 + 'px';
        tooltipEl.style.top = position.top + window.scrollY + tooltipModel.caretY - tooltipEl.clientHeight / 2 + 'px';
        tooltipEl.classList.add('loan-chart');
    },
};

const primaryChartData = {
    labels: ['Life Cover', 'Disability Cover', 'Critical Illness Cover'],
    datasets: [
        {
            data: [
                3050000,
                3750000,
                3750000
            ],
            stack: "1",
            backgroundColor: colors.secondary,
            borderColor: colors.secondary
        },
        {
            data: [
                1000000,
                1000000,
                1000000
            ],
            stack: "2",
            backgroundColor: colors.primary,
            borderColor: colors.primary
        },
        {
            data: [
                2050000,
                2750000,
                2750000
            ],
            stack: "2",
            backgroundColor: createDiagonalPattern('hsla(7, 75%, 60%, 0.5)', colors.red, 1.5),
            borderWidth: 2,
            borderColor: colors.red
        }
    ],
};

const $errorBox = document.getElementById('error-box');
const $errorList = document.getElementById('error-list');

const $primaryChart = document.getElementById('primary-chart');
const $calculateBtn = document.getElementById('calculate-btn');

const $monthlyIncome = document.getElementById('income');
const $supportLength = document.getElementById('length');
const $assets = document.getElementById('assets');
const $debt = document.getElementById('debt');

const $lifeCover = document.getElementById('life-cover');
const $funeralCover = document.getElementById('funeral');

const $disabilityCover = document.getElementById('disability-cover');
const $disabilityAdjust = document.getElementById('disability-adjust');

const $illnessCover = document.getElementById('illness-cover');
const $illnessAdjust = document.getElementById('illness-adjust');

const $mainA = document.getElementById('result-main-A');
const $mainB = document.getElementById('result-main-B');
const $mainC = document.getElementById('result-main-C');
const $smallA = document.getElementById('result-small-A');
const $smallB = document.getElementById('result-small-B');
const $smallC = document.getElementById('result-small-C');
const $smallA2 = document.getElementById('result-small-A2');
const $smallB2 = document.getElementById('result-small-B2');
const $smallC2 = document.getElementById('result-small-C2');

const $currency = /** @type {HTMLSelectElement} */ (document.getElementById('currency'));

const input = {
    value: /** @type {*} */ (null),
    elementId: "",
    shown: false,
    processed: false,
    silent: false,
    reset: function () {
        this.shown = false;
        $errorBox?.classList.remove('calculator-result--error-active');
        document.querySelectorAll('.input-field--error')?.forEach(el => el.classList.remove('input-field--error'))
        document.querySelectorAll('.calculator-result:not(.calculator-result--error)').forEach(el => el.classList.remove('calculator-result--hidden'))
    },
    error: function (inputId, message = `Incorrect value for "${inputId}"`, last = false) {
        if (this.silent) return;
        if (this.processed) this.reset();
        if (!Array.isArray(inputId)) inputId = [inputId];
        for (const inputIdItem of inputId) {
            const wrapperElement = /** @type {?HTMLElement} */ (document.getElementById(inputIdItem)?.parentNode);
            wrapperElement?.classList.add('input-field--error');
        }
        if (!this.shown) {
            this.processed = false;
            this.shown = true;
            $errorList && ($errorList.innerHTML = '');
            $errorBox?.classList.add('calculator-result--error-active');
            document.querySelectorAll('.calculator-result:not(.calculator-result--error)').forEach(el => el.classList.add('calculator-result--hidden'))
        }
        const element = document.createElement('p');
        element.classList.add('calculator-error__item');
        element.innerHTML = message;
        $errorList?.append(element);
        if (last) this.processed = true;
    },
    valid: function () {
        if (!this.shown || this.processed) this.reset();
        this.processed = true;
        this.silent = false;
        return !this.shown;
    },
    get: function (elementId) {
        this.elementId = elementId;
        let element = /** @type {HTMLInputElement} */ (document.getElementById(elementId));
        this.silent = false;
        if (element == null) {
            this.value = null;
        } else {
            this.value = element.value;
        }
        return this;
    },
    index: function () {
        const element = /** @type {?HTMLSelectElement} */ (document.getElementById(this.elementId));
        this.value = element?.selectedIndex;
        return this;
    },
    checked: function (elementId) {
        const element = /** @type {?HTMLInputElement} */ (document.getElementById(this.elementId))
        this.value = element?.checked;
        return this;
    },
    split: function (separator) {
        this.value = this.value.split(separator);
        return this;
    },
    replace: function (pattern, replacement) {
        this.value = this.value.replace(pattern, replacement);
        return this;
    },
    default: function (value) {
        if (!this.value) this.value = value;
        return this;
    },
    optional: function (value) {
        if (!this.value) this.silent = true;
        return this;
    },
    gt: function (compare = 0, errorText = `The ${this.elementId} must be greater than ${compare}.`) {
        if (isNaN(compare)) {
            const element = /** @type {?HTMLInputElement} */ (document.getElementById(this.elementId));
            compare = Number(element?.value);
        }
        if (this.value === '' || isNaN(Number(this.value)))
            this.error(this.elementId, `The ${this.elementId} must be a number.`);
        else if (Number(this.value) <= compare) this.error(this.elementId, errorText);
        return this;
    },
    gte: function (compare = 0, errorText = `The ${this.elementId} must be greater than or equal to ${compare}.`) {
        if (isNaN(compare)) {
            const element = /** @type {?HTMLInputElement} */ (document.getElementById(this.elementId));
            compare = Number(element?.value);
        }
        if (this.value === '' || isNaN(Number(this.value)))
            this.error(this.elementId, `The ${this.elementId} must be a number.`);
        else if (Number(this.value) < compare) this.error(this.elementId, errorText);
        return this;
    },
    lt: function (compare = 0, errorText = `The ${this.elementId} must be less than ${compare}.`) {
        if (isNaN(compare)) {
            const element = /** @type {?HTMLInputElement} */ (document.getElementById(this.elementId));
            compare = Number(element?.value);
        }
        if (this.value === '' || isNaN(Number(this.value)))
            this.error(this.elementId, `The ${this.elementId} must be a number.`);
        else if (Number(this.value) >= compare) this.error(this.elementId, errorText);
        return this;
    },
    lte: function (compare = 0, errorText = `The ${this.elementId} must be less than or equal to ${compare}.`) {
        if (isNaN(compare)) {
            const element = /** @type {?HTMLInputElement} */ (document.getElementById(this.elementId));
            compare = Number(element?.value);
        }
        if (this.value === '' || isNaN(Number(this.value)))
            this.error(this.elementId, `The ${this.elementId} must be a number.`);
        else if (Number(this.value) > compare) this.error(this.elementId, errorText);
        return this;
    },
    integer: function (errorText = `The ${this.elementId
        } must be integer number (-3, -2, -1, 0, 1, 2, 3, ...).`) {
        if (!this.value.match(/^-?(0|[1-9]\d*)$/)) this.error(this.elementId, errorText);
        return this;
    },
    _naturalRegexp: /^([1-9]\d*)$/,
    natural: function (errorText = `The ${this.elementId} must be a natural number(1, 2, 3, ...).`) {
        if (!this.value.match(this._naturalRegexp)) this.error(this.elementId, errorText);
        return this;
    },
    natural_numbers: function (errorText = `The ${this.elementId} must be a set of natural numbers(1, 2, 3, ...).`) {
        this.split(/[ ,]+/);
        if (!this.value.every(value => value.match(this._naturalRegexp))) this.error(this.elementId, errorText);
        return this;
    },
    _mixedRegexp: /^(0|-?[1-9]\d*|-?[1-9]\d*\/[1-9]\d*|-?[1-9]\d*\s[1-9]\d*\/[1-9]\d*)$/,
    mixed: function (errorText = `The ${this.elementId} must be an integer / fraction / mixed number(1, 2 / 3, 4 5 / 6, ...).`) {
        if (!this.value.match(this._mixedRegexp)) this.error(this.elementId, errorText);
        return this;
    },
    mixed_numbers: function (errorText = `The ${this.elementId} must be a set of integer / fraction / mixed numbers(1, 2 / 3, 4 5 / 6, ...).`) {
        this.split(/,\s*/);
        if (!this.value.every(value => value.match(this._mixedRegexp))) this.error(this.elementId, errorText);
        return this;
    },
    number: function (errorText = `The "${this.elementId}" must be a number.`) {
        if (this.value === '' || isNaN(Number(this.value))) this.error(this.elementId, errorText);
        return this;
    },
    probability: function (errorText = `The "${this.elementId}" must be a number between 0 and 1.`) {
        if (this.value === '' || isNaN(Number(this.value)) || Number(this.value) < 0 || Number(this.value) > 1)
            this.error(this.elementId, errorText);
        return this;
    },
    percentage: function (errorText = `The "${this.elementId}" must be a number between 0 and 100.`) {
        if (this.value === '' || isNaN(Number(this.value)) || Number(this.value) < 0 || Number(this.value) > 100)
            this.error(this.elementId, errorText);
        return this;
    },
    numbers: function (errorText = `The ${this.elementId} must be a set of numbers.`) {
        if (this.value.filter(value => isNaN(Number(value))).length) this.error(this.elementId, errorText);
        return this;
    },
    whole: function (errorText = `The ${this.elementId} must be a whole number.`) {
        if (!this.value.match(/^(0|[1-9]\d*)$/)) this.error(this.elementId, errorText);
        return this;
    },
    positive: function (errorText = `The ${this.elementId} must be greater than 0.`) {
        this.gt(0, errorText);
        return this;
    },
    nonZero: function (errorText = `The ${this.elementId} must be non - zero.`) {
        if (this.value === '' || isNaN(Number(this.value)))
            this.error(this.elementId, `The ${this.elementId} must be a number.`);
        else
            if (Number(this.value) == 0) this.error(this.elementId, errorText);
        return this;
    },
    nonNegative: function (errorText = `The ${this.elementId} must be greater than or equal to 0.`) {
        this.gte(0, errorText);
        return this;
    },
    negative: function (errorText = `The ${this.elementId} must be less than 0.`) {
        this.lt(0, errorText);
        return this;
    },
    bool: function () {
        return !!this.value;
    },
    val: function () {
        if (this.value === '' || this.value === null) return null;
        return Number(this.value);
    },
    vals: function () {
        return this.value.map(value => Number(value));
    },
    raw: function () {
        return this.value;
    },
    nonEmpty: function () {
        const element = document.getElementById(this.elementId);
        const elementTitle = element?.parentNode?.parentNode?.querySelector('.input__title')?.textContent;
        const errorText = `Please fill in the value for ${elementTitle ?? this.elementId}`;
        if (!this.value) this.error(this.elementId, errorText);
        return this;
    },
}

/** @param {*} calculationResults */
const displayCalculationResults = (calculationResults) => {
    $mainA && ($mainA.innerHTML = calculationResults.mainA);
    $smallA && ($smallA.innerHTML = calculationResults.smallA);
    $smallA2 && ($smallA2.innerHTML = calculationResults.smallA2);
    $mainB && ($mainB.innerHTML = calculationResults.mainB);
    $smallB && ($smallB.innerHTML = calculationResults.smallB);
    $smallB2 && ($smallB2.innerHTML = calculationResults.smallB2);
    $mainC && ($mainC.innerHTML = calculationResults.mainC);
    $smallC && ($smallC.innerHTML = calculationResults.smallC);
    $smallC2 && ($smallC2.innerHTML = calculationResults.smallC2);
}

/**
 * @param {number[]} requiredCoverData
 * @param {number[]} existingCoverData
 * @param {number[]} shortfallCoverData
 * @param {Chart} primaryChart
 */
const displayPrimaryResultsChart = (requiredCoverData, existingCoverData, shortfallCoverData, primaryChart) => {
    primaryChart.data.datasets[0].data = requiredCoverData;
    primaryChart.data.datasets[1].data = existingCoverData;
    primaryChart.data.datasets[2].data = shortfallCoverData;

    primaryChart.reset();
    primaryChart.update();
}

const getInputs = () => {
    const monthlyIncome = input.get($monthlyIncome?.id).nonEmpty().val() ?? 0;
    const supportLength = input.get($supportLength?.id).nonEmpty().val() ?? 0;
    const assets = input.get($assets?.id).nonEmpty().val() ?? 0;
    const debt = input.get($debt?.id).nonEmpty().val() ?? 0;

    const lifeCover = input.get($lifeCover?.id).nonEmpty().val() ?? 0;
    const funeralCover = input.get($funeralCover?.id).nonEmpty().val() ?? 0;

    const disabilityCover = input.get($disabilityCover?.id).nonEmpty().val() ?? 0;
    const disabilityAdjust = input.get($disabilityAdjust?.id).nonEmpty().val() ?? 0;

    const illnessCover = input.get($illnessCover?.id).nonEmpty().val() ?? 0;
    const illnessAdjust = input.get($illnessAdjust?.id).nonEmpty().val() ?? 0;

    if (!input.valid()) throw new Error("Invalid State");

    return {
        monthlyIncome,
        supportLength,
        assets,
        debt,
        lifeCover,
        funeralCover,
        disabilityCover,
        disabilityAdjust,
        illnessCover,
        illnessAdjust
    };
}

/** @param {Chart} primaryChart */
const runApp = (primaryChart) => {
    const {
        monthlyIncome,
        supportLength,
        assets,
        debt,
        lifeCover,
        funeralCover,
        disabilityCover,
        disabilityAdjust,
        illnessCover,
        illnessAdjust
    } = getInputs();

    let requiredLifeCover = (monthlyIncome * supportLength * 12) + debt + funeralCover - assets;
    let requiredDisabilityCover = (monthlyIncome * supportLength * 12) + debt + disabilityAdjust;
    let requiredIllnessCover = (monthlyIncome * supportLength * 12) + debt + illnessAdjust;

    requiredLifeCover = Math.max(requiredLifeCover, 0);
    requiredDisabilityCover = Math.max(requiredDisabilityCover, 0);
    requiredIllnessCover = Math.max(requiredIllnessCover, 0);

    const shortfallLifeCover = Math.max(requiredLifeCover - lifeCover, 0);
    const shortfallDisabilityCover = Math.max(requiredDisabilityCover - disabilityCover, 0);
    const shortfallIllnessCover = Math.max(requiredIllnessCover - illnessCover, 0);

    displayCalculationResults({
        mainA: `Required Life Cover: ${currencyFormat(requiredLifeCover)}`,
        smallA: `Existing Life Cover: ${currencyFormat(lifeCover)}`,
        smallA2: `Shortfall in Life Cover: ${currencyFormat(shortfallLifeCover)}`,
        mainB: `Required Disability Cover: ${currencyFormat(requiredDisabilityCover)}`,
        smallB: `Existing Disability Cover: ${currencyFormat(disabilityCover)}`,
        smallB2: `Shortfall in Disability Cover: ${currencyFormat(shortfallDisabilityCover)}`,
        mainC: `Required Critical Illness Cover: ${currencyFormat(requiredIllnessCover)}`,
        smallC: `Existing Critical Illness Cover: ${currencyFormat(illnessCover)}`,
        smallC2: `Shortfall in Critical Illness Cover: ${currencyFormat(shortfallIllnessCover)}`,
    });

    displayPrimaryResultsChart(
        [requiredLifeCover, requiredDisabilityCover, requiredIllnessCover],
        [lifeCover, disabilityCover, illnessCover],
        [shortfallLifeCover, shortfallDisabilityCover, shortfallIllnessCover],
        primaryChart
    );
}

/**
 * @param {Chart} primaryChart
 */
const changeCurrency = (primaryChart) => {
    currency = getCurrencySymbol($currency.value);
    document.querySelectorAll('.input-field__currency').forEach(el => el.textContent = currency);
    runApp(primaryChart);
};

[
    $monthlyIncome,
    $supportLength,
    $assets,
    $debt,
    $lifeCover,
    $funeralCover,
    $disabilityCover,
    $disabilityAdjust,
    $illnessCover,
    $illnessAdjust
].forEach(input => input?.addEventListener('input', forceNumeric));

import("./lib/chartjs/chart.js").then(({ Chart, registerables }) => {
    Chart.register(...registerables);

    const primaryChart = new Chart($primaryChart, {
        type: 'bar',
        data: primaryChartData,
        options: {
            response: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false,
                },
                tooltip: tooltip,
            },
            interaction: {
                mode: 'index',
                intersect: false,
            },
            scales: {
                y: {
                    stacked: true,
                    ticks: {
                        callback: (it) => currencyFormat(it, ' '),
                    },
                },
                x: {
                    stacked: true,
                    grid: {
                        display: false
                    },
                },
            },
        }
    });

    $calculateBtn?.addEventListener('click', () => runApp(primaryChart));
    $currency.addEventListener('change', () => changeCurrency(primaryChart));
})
