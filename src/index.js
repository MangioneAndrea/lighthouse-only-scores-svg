const lighthouse = require("lighthouse");
const fs = require("fs");
const chromeLauncher = require("chrome-launcher");

const getLighthouseReport = async (link) => {
  const chrome = await chromeLauncher.launch({ chromeFlags: ["--headless"] });
  const options = {
    logLevel: "info",
    output: "json",
    quiet: true,
    port: chrome.port,
  };
  const runnerResult = await lighthouse(link, options);

  await chrome.kill();
  return Object.entries(runnerResult.lhr.categories).reduce(
    (acc, [key, { score }]) => {
      return { ...acc, [key]: score * 100 };
    },
    {}
  );
};

const svgTemplate = (scores) => {
  const getColor = (score) => {
    return score >= 90
      ? "green"
      : score >= 50
      ? "orange"
      : score >= 0
      ? "red"
      : "undefined;";
  };
  const guageCircle = (category, score, count) => {
    const offset = count * 200 + 100;

    return `<g class="${getColor(score)}" transform="translate(${offset},0) ">
          <circle class="gauge-base" r="56" cx="100" cy="60" stroke-width="8"></circle>
          <circle class="gauge-arc guage-arc-1" r="56" cx="100" cy="60" stroke-width="8" style="stroke-dasharray: ${
            score >= 0 ? (score * 351.858) / 100 : 351.858
          }, 351.858;"></circle>
          <text class="guage-text" x="100px" y="60px" alignment-baseline="central" dominant-baseline="central" text-anchor="middle">${
            score ?? "NA"
          }</text>
          <text class="guage-title" x="100px" y="160px" alignment-baseline="central" dominant-baseline="central" text-anchor="middle">${category}</text>
      </g>
      `;
  };

  const guages = Object.entries(scores).reduce(
    (svg, [category, score], index) => {
      if (category !== "pwa") {
        svg += guageCircle(category, score, index);
      }
      return svg;
    },
    ""
  );

  return `
	<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" fill="none" width="1000" height="330">
		<style>
			.gauge-base {
				opacity: 0.1
			}
			.gauge-arc {
				fill: none;
				animation-delay: 250ms;
				stroke-linecap: round;
				transform: rotate(-90deg);
				transform-origin: 100px 60px;
				animation: load-gauge 1s ease forwards
			}
			.guage-text {
				font-size: 40px;
				font-family: monospace;
				text-align: center
			}
			.red {
				color: #ff4e42;
				fill: #ff4e42;
				stroke: #ff4e42
			}
			.orange {
				color: #ffa400;
				fill: #ffa400;
				stroke: #ffa400
			}
			.green {
				color: #0cce6b;
				fill: #0cce6b;
				stroke: #0cce6b
			}
			.undefined {
				color: #1e1e1e;
				fill: #1e1e1e;
				stroke: #1e1e1e
			}
			.guage-title {
				stroke: none;
				font-size: 26px;
				line-height: 26px;
				font-family: Roboto, Halvetica, Arial, sans-serif
			}
			.metric.guage-title {
				font-family: 'Courier New', Courier, monospace
			}
			.guage-title {
				color: #212121;
				fill: #212121
			}
			@keyframes load-gauge {
				from {
					stroke-dasharray: 0 352.858
				}
			}
			#cont {
				stroke: #00000022
			}
		</style>
        ${guages}
		<g transform="translate(200,250)" x="200" y="250">
			<g>
				<rect fill="none" id="canvas_background" height="80" width="604" y="-1" x="-1"/>
				<g display="none" overflow="visible" y="0" x="0" height="100%" width="100%" id="canvasGrid">
					<rect fill="url(#gridpattern)" stroke-width="0" y="0" x="0" height="100%" width="100%"/>
				</g>
			</g>
			<g>
				<rect fill-opacity="0" stroke-width="2" rx="40" id="cont" height="72" width="600" y="1" x="0" fill="#000000"/>
				<rect stroke="#000" rx="8" id="svg_3" height="14" width="48" y="30" x="35" stroke-opacity="null" stroke-width="0" fill="#ff4e42"/>
				<rect stroke="#000" rx="6" id="svg_4" height="14" width="48" y="30" x="220" stroke-opacity="null" stroke-width="0" fill="#ffa400"/>
				<rect stroke="#000" rx="6" id="svg_5" height="14" width="48" y="30" x="410" stroke-opacity="null" stroke-width="0" fill="#0cce6b"/>
				<text class="metric guage-title" xml:space="preserve" text-anchor="start" font-size="26" id="svg_6" y="45" x="100" stroke-opacity="null" stroke-width="0" stroke="#000">0-49</text>
				<text class="metric guage-title" xml:space="preserve" text-anchor="start" font-size="26" id="svg_7" y="45" x="280" stroke-opacity="null" stroke-width="0" stroke="#000">50-89</text>
				<text class="metric guage-title" xml:space="preserve" text-anchor="start" font-size="26" id="svg_8" y="45" x="470" stroke-opacity="null" stroke-width="0" stroke="#000">90-100</text>
			</g>
		</g>
	</svg>`;
};

function createReport({ url } = {}) {
  getLighthouseReport(url).then((res) => {
    const svg = svgTemplate(res);
    fs.writeFileSync("res.svg", svg);
  });
}
module.exports = createReport;
