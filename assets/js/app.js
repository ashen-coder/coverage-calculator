// @ts-check
'use strict'

console.log('Script is OK! ༼ つ ◕_◕ ༽つ');

// Types
/** @typedef {import('./lib/chartjs/chart.js').Chart} Chart */
/** @typedef {Record<string, number>[]} ResultList */

const CRITICAL_ERROR_MESSAGE = "Please refresh the page and try again.";

/** @param {Event} event */
function toggleRelatedInputs(event) {
    const element = /** @type {HTMLSelectElement} */ (event.target);
    const id = element.id;
    const index = element.selectedIndex;

    document.querySelectorAll('.' + id)?.forEach(element => {
        element.classList.add("related-item-hidden");
    });

    document.querySelectorAll(`.related-to-${id}-${index}`)?.forEach(element => {
        element.classList.remove("related-item-hidden");
    });
}

/** @param {Event} event */
function forceNumeric(event) {
    const element = /** @type {?HTMLInputElement} */ (event.target);
    if (!element) return;
    element.value = element.value
        .replace(/[^0-9.]/g, '')
        .replace(/(\..*?)\..*/g, '$1');
}

/**
 * @param {number} num
 * @param {string} space
 * @returns {string}
 */
function currencyFormat(num, space = '&nbsp') {
    return `R${space}` + num.toFixed(2).replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,')
}

/**
 * @param {number} annualDrawdown 
 * @param {number} annualStartBalance 
 * @returns {number}
 */
function getMonthlyIncome(annualDrawdown, annualStartBalance) {
    return annualStartBalance * annualDrawdown / 100 / 12;
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
    secondary: '#00ABD0'
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

            const title = `${tooltipModel.title}: ${currencyFormat(tooltipModel.dataPoints[0]?.raw)}`;

            innerHtml += '<tr><th class="loan-chart__title">' + title + '</th></tr>';

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
    labels: ['Required Life Cover', 'Existing Life Cover'],
    datasets: [
        {
            data: [10_850_000, 1_000_000],
            backgroundColor: [colors.secondary, colors.primary],
            borderColor: [colors.secondary, colors.primary]
        }
    ],
};

const $errorBox = document.getElementById('error-box');
const $errorList = document.getElementById('error-list');

const $primaryChart = document.getElementById('primary-chart');
const $calculateBtn = document.getElementById('calculate-btn');
const $calculationType = /** @type {HTMLSelectElement} */ (document.getElementById('calc-type'));

const $monthlyIncome0 = document.getElementById('income-0');
const $supportLength0 = document.getElementById('length-0');
const $existingCover0 = document.getElementById('cover-0');
const $funeralCover0 = document.getElementById('funeral-0');
const $assets0 = document.getElementById('assets-0');
const $debt0 = document.getElementById('debt-0');

const $monthlyIncome1 = document.getElementById('income-1');
const $supportLength1 = document.getElementById('length-1');
const $existingCover1 = document.getElementById('cover-1');
const $debt1 = document.getElementById('debt-1');
const $adjust1 = document.getElementById('adjust-1');

const $monthlyIncome2 = document.getElementById('income-2');
const $supportLength2 = document.getElementById('length-2');
const $existingCover2 = document.getElementById('cover-2');
const $debt2 = document.getElementById('debt-2');
const $adjust2 = document.getElementById('adjust-2');

const $main = document.getElementById('result-main');
const $smallA = document.getElementById('result-small-A');
const $smallB = document.getElementById('result-small-B');
const $smallC = document.getElementById('result-small-C');

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

/** @param {{ main: string, smallA: string }} calculationResults */
const displayCalculationResults = (calculationResults) => {
    $main && ($main.innerHTML = calculationResults.main);
    $smallA && ($smallA.innerHTML = calculationResults.smallA);
}

/**
 * @param {string[]} labels
 * @param {number[]} data
 * @param {Chart} primaryChart
 */
const displayPrimaryResultsChart = (labels, data, primaryChart) => {
    primaryChart.data.labels = labels;
    primaryChart.data.datasets[0].data = data;

    primaryChart.reset();
    primaryChart.update();
}

/** @param {Chart} primaryChart */
const runLifeInsuranceCalculator = (primaryChart) => {
    const monthlyIncome = input.get($monthlyIncome0?.id).nonEmpty().val() ?? 0;
    const supportLength = input.get($supportLength0?.id).nonEmpty().val() ?? 0;
    const existingCover = input.get($existingCover0?.id).nonEmpty().val() ?? 0;
    const funeralCover = input.get($funeralCover0?.id).nonEmpty().val() ?? 0;
    const assets = input.get($assets0?.id).nonEmpty().val() ?? 0;
    const debt = input.get($debt0?.id).nonEmpty().val() ?? 0;

    if (!input.valid()) throw new Error("Invalid State");

    const requiredCover = (monthlyIncome * supportLength * 12) - existingCover + debt + funeralCover - assets;

    displayCalculationResults({
        main: `Required Life Cover: ${currencyFormat(requiredCover)}`,
        smallA: `Existing Life Cover: ${currencyFormat(existingCover)}`
    });

    displayPrimaryResultsChart(
        ['Required Life Cover', 'Existing Life Cover'],
        [requiredCover, existingCover],
        primaryChart
    );
}

/** @param {Chart} primaryChart */
const runDisabilityCalculator = (primaryChart) => {
    const monthlyIncome = input.get($monthlyIncome1?.id).nonEmpty().val() ?? 0;
    const supportLength = input.get($supportLength1?.id).nonEmpty().val() ?? 0;
    const existingCover = input.get($existingCover1?.id).nonEmpty().val() ?? 0;
    const debt = input.get($debt1?.id).nonEmpty().val() ?? 0;
    const adjust = input.get($adjust1?.id).nonEmpty().val() ?? 0;

    if (!input.valid()) throw new Error("Invalid State");

    const requiredCover = (monthlyIncome * supportLength * 12) - existingCover + debt + adjust;

    displayCalculationResults({
        main: `Required Disability Cover: ${currencyFormat(requiredCover)}`,
        smallA: `Existing Disability Cover: ${currencyFormat(existingCover)}`
    });

    displayPrimaryResultsChart(
        ['Required Disability Cover', 'Existing Disability Cover'],
        [requiredCover, existingCover],
        primaryChart
    );
}

/** @param {Chart} primaryChart */
const runCriticalIllnessCalculator = (primaryChart) => {
    const monthlyIncome = input.get($monthlyIncome2?.id).nonEmpty().val() ?? 0;
    const supportLength = input.get($supportLength2?.id).nonEmpty().val() ?? 0;
    const existingCover = input.get($existingCover2?.id).nonEmpty().val() ?? 0;
    const debt = input.get($debt2?.id).nonEmpty().val() ?? 0;
    const adjust = input.get($adjust2?.id).nonEmpty().val() ?? 0;

    if (!input.valid()) throw new Error("Invalid State");

    const requiredCover = (monthlyIncome * supportLength * 12) - existingCover + debt + adjust;

    displayCalculationResults({
        main: `Required Critical Illness Cover: ${currencyFormat(requiredCover)}`,
        smallA: `Existing Critical Illness Cover: ${currencyFormat(existingCover)}`
    });

    displayPrimaryResultsChart(
        ['Required Critical Illness Cover', 'Existing Critical Illness Cover'],
        [requiredCover, existingCover],
        primaryChart
    );
}

/** @param {Chart} primaryChart */
const runApp = (primaryChart) => {
    const calcType = $calculationType.selectedOptions[0].value;
    switch (calcType) {
        case 'Life':
            runLifeInsuranceCalculator(primaryChart);
            break;
        case 'Disability':
            runDisabilityCalculator(primaryChart);
            break;
        case 'Illness':
            runCriticalIllnessCalculator(primaryChart);
            break;
        default:
            input.error([], CRITICAL_ERROR_MESSAGE, true);
            throw new Error(`Invalid calculation type: ${calcType}`);
    }
}

$calculationType.addEventListener('change', toggleRelatedInputs);

[
    $monthlyIncome0,
    $supportLength0,
    $existingCover0,
    $funeralCover0,
    $assets0,
    $debt0,
    $monthlyIncome1,
    $supportLength1,
    $existingCover1,
    $debt1,
    $adjust1,
    $monthlyIncome2,
    $supportLength2,
    $existingCover2,
    $debt2,
    $adjust2,
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

    $calculationType.addEventListener('change', () => runApp(primaryChart));
    $calculateBtn?.addEventListener('click', () => runApp(primaryChart));

    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    if (urlParams.has('type')) {
        const event = new Event('change');
        $calculationType.dispatchEvent(event);
    }
})
