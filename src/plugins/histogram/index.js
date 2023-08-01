import videojs from 'video.js';

import './histogram.scss';

// Default options for the plugin.
let defaults = {};

/**
 * Function to invoke when the player is ready.
 *
 * @function onPlayerReady
 * @param    {Player} player
 *           A Video.js player object.
 *
 * @param    {Object} [options={}]
 *           A plain object containing options for the plugin.
 */
const onPlayerReady = function onPlayerReady(player, options) {
  player.addClass('vjs-histogram');
  player.histogram = new HistogramPlugin(player, options);
};

/**
 * A video.js plugin.
 *
 * In the plugin function, the value of `this` is a video.js `Player`
 * instance. You cannot rely on the player being in a "ready" state here,
 * depending on how the plugin is invoked. This may or may not be important
 * to you; if not, remove the wait for "ready"!
 *
 * @function histogram
 * @param    {Object} [options={}]
 *           An object of options left to the plugin author to define.
 */
const histogram = function histogram(options) {
  let _this = this;

  this.ready(function () {
    onPlayerReady(_this, videojs.mergeOptions(defaults, options));
  });
};

/**
 * Histogram class.
 *
 * This class performs all functions related to displaying the Histogram bar.
 */
const HistogramPlugin = (function () {

  /**
   * Plugin class constructor, called by videojs on
   * ready event.
   *
   * @function  constructor
   * @param    {Player} player
   *           A Video.js player object.
   *
   * @param    {Object} [options={}]
   *           A plain object containing options for the plugin.
   */
  function HistogramPlugin(player, options) {
    this.player = player;
    this.options = options;
    this.listenForDurationChange();
    this.initializeHistogram();
    this.registeredEvents = {};
    return this;
  }

  HistogramPlugin.prototype.src = function src(source) {
    this.resetPlugin();
    this.options.src = source;
    this.initializeHistogram();
  };

  HistogramPlugin.prototype.detach = function detach() {
    this.resetPlugin();
  };

  HistogramPlugin.prototype.resetPlugin = function resetPlugin() {
    if (this.histogramHolder) {
      this.histogramHolder.parentNode.removeChild(this.histogramHolder);
    }
    delete this.progressBar;
    delete this.histogramHolder;
    delete this.lastStyle;
  };

  HistogramPlugin.prototype.listenForDurationChange = function listenForDurationChange() {
    this.player.on('durationchange', function () {
      // ToDo
    });
  };

  /**
   * Bootstrap the plugin.
   */

  HistogramPlugin.prototype.initializeHistogram = function initializeHistogram() {
    let _this2 = this;

    if (!this.options.src) {
      return;
    }

    this.getHistogramFile(this.options.src).then(function (res) {
      _this2.setupHistogramElement();
      if (_this2.histogramHolder) {
        _this2.createHistogram(res);
      }
    });
  };

  /**
   * Grabs the contents of the VTT file.
   *
   * @param url
   * @returns {Promise}
   */

  HistogramPlugin.prototype.getHistogramFile = function getHistogramFile(url) {
    let _this3 = this;

    return new Promise(function (resolve) {
      let req = new XMLHttpRequest();
      req.data = {
        resolve: resolve
      };
      req.addEventListener('load', _this3.histogramDataLoaded);
      req.open('GET', url);
      req.send();
    });
  };

  /**
   * Callback for loaded Histogram file.
   */

  HistogramPlugin.prototype.histogramDataLoaded = function histogramDataLoaded() {
    this.data.resolve(JSON.parse(this.responseText));
  };

  HistogramPlugin.prototype.setupHistogramElement = function setupHistogramElement() {
    let mouseDisplay = this.player.$('.vjs-mouse-display');
    this.progressBar = this.player.$('.vjs-progress-control');
    if (!this.progressBar) {
      return;
    }
    let histogramHolder = this.player.$('.vjs-histogram-display') || document.createElement('div');
    histogramHolder.setAttribute('class', 'vjs-histogram-display');
    this.progressBar.appendChild(histogramHolder);
    this.histogramHolder = histogramHolder;
    if (mouseDisplay) {
      mouseDisplay.classList.add('vjs-hidden');
    }
  };

  /**
   * Function to create the SVG path element
   */
  HistogramPlugin.prototype.createPath = function createPath(dataArray, containerWidth, containerHeight) {
    // Calculate the x and y coordinates for each point
    const stepX = containerWidth / (dataArray.length - 1);
    const points = dataArray.map((value, index) => ({
      x: index * stepX,
      y: containerHeight - value * containerHeight
    }));

    // Create a smooth line path
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('fill', 'lightblue');
    // path.setAttribute('stroke', 'blue');

    // Generate the smooth line path data
    let d = `M ${points[0].x},${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const xc = (points[i].x + points[i + 1].x) / 2;
      const yc = (points[i].y + points[i + 1].y) / 2;
      d += ` Q ${points[i].x},${points[i].y} ${xc},${yc}`;
    }
    d += ` Q ${points[points.length - 1].x},${points[points.length - 1].y} ${points[points.length - 1].x},${points[points.length - 1].y}`;

    // Close the path to fill the region under the line
    d += ` L ${points[points.length - 1].x},${containerHeight} L ${points[0].x},${containerHeight} Z`;

    path.setAttribute('d', d);

    return path;
  };

  HistogramPlugin.prototype.createHistogram = function createHistogram(info) {
    const data = info.data;
    const svgWidth = 600;
    const svgHeight = 20;

    const svg = this.player.$('.vjs-histogram-display > svg') || document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', `0 0 ${svgWidth} ${svgHeight}`);
    svg.setAttribute('preserveAspectRatio', 'none');
    svg.setAttribute('width', svgWidth);
    svg.setAttribute('height', svgHeight);

    const path = this.createPath(data, svgWidth, svgHeight);

    while (svg.firstChild) {
      svg.removeChild(svg.firstChild);
    }
    svg.appendChild(path);

    this.histogramHolder.appendChild(svg);
  };

  return HistogramPlugin;
}());

export default histogram;
