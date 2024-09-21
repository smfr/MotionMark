/*
 * Copyright (C) 2015-2024 Apple Inc. All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 * 1. Redistributions of source code must retain the above copyright
 *    notice, this list of conditions and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright
 *    notice, this list of conditions and the following disclaimer in the
 *    documentation and/or other materials provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY APPLE INC. AND ITS CONTRIBUTORS ``AS IS''
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO,
 * THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
 * PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL APPLE INC. OR ITS CONTRIBUTORS
 * BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
 * CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
 * SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
 * INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
 * CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 * ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF
 * THE POSSIBILITY OF SUCH DAMAGE.
 */

// Move to shared code

class Size {
    constructor(width, height)
    {
        this.width = width;
        this.height = height;
    }
}



class TreeOfLifeData {
    constructor(jsonData)
    {
        
    }
}


class ChartController {
    constructor(stage, chartSize)
    {
        this.stage = stage;
        this._complexity = 0;
        this.chartSize = chartSize;
        this.radiusDiff = 0;
    }
    
    get complexity()
    {
        return this._complexity;
    }
    
    set complexity(complexity)
    {
        console.log(`setComplexity ${complexity}`)
        this._complexity = complexity;
        this.#layoutChart();
    }
    
    #layoutChart()
    {
        const width = Math.min(this.chartSize.width, this.chartSize.height);
        const height = width;
        const cx = width * 0.5; // adjust as needed to fit
        const cy = height * 0.5; // adjust as needed to fit
        this.radius = Math.min(width, height) / 2 - 80;
        
        // Create a radial cluster layout. The layout’s first dimension (x)
        // is the angle, while the second (y) is the radius.
        this.tree = d3.cluster()
            .size([2 * Math.PI, this.radius])
            .separation((a, b) => (a.parent == b.parent ? 1 : 2) / a.depth);
        
        // Sort the tree and apply the layout.
        this.root = this.tree(d3.hierarchy(this.stage.data)
            .sort((a, b) => d3.ascending(a.data.name, b.data.name)));
        
        // Creates the SVG container.
        this.svg = d3.create("svg")
            .attr("width", width)
            .attr("height", height)
            .attr("viewBox", [-cx, -cy, width, height]);

        console.log(this.root.links());

        // Append links.
        this.svg.append("g")
            .attr("class", "links")
            .attr("fill", "none")
            .attr("stroke", "#555")
            .attr("stroke-opacity", 0.4)
            .attr("stroke-width", 1.5)
            .selectAll()
            .data(this.root.links())
            .join("path")
                .attr("d", d3.linkRadial()
                    .angle(d => d.x)
                    .radius(d => d.y));
        
        // Append nodes.
        this.svg.append("g")
            .attr("class", "nodes")
            .selectAll()
            .data(this.root.descendants())
            .join("circle")
                .attr("transform", d => `rotate(${d.x * 180 / Math.PI - 90}) translate(${d.y},0)`)
                .attr("fill", d => d.children ? "#555" : "#999")
                .attr("r", 2.5)
                .attr("class", "target");
        
        // Append labels.
        this.svg.append("g")
            .attr("class", "labels")
            .attr("stroke-linejoin", "round")
            .attr("stroke-width", 3)
            .selectAll()
            .data(this.root.descendants())
            .join("text")
                .attr("transform", d => `rotate(${d.x * 180 / Math.PI - 90}) translate(${d.y},0) rotate(${d.x >= Math.PI ? 180 : 0})`)
                .attr("dy", "0.31em")
                .attr("x", d => d.x < Math.PI === !d.children ? 6 : -6)
                .attr("text-anchor", d => d.x < Math.PI === !d.children ? "start" : "end")
                .attr("paint-order", "stroke")
                .attr("stroke", "white")
                .attr("fill", "currentColor")
                .text(d => d.data.name);
    
        this.stage.element.innerText = '';
        this.stage.element.appendChild(this.svg.node());
    }
    
    animate(timestamp)
    {
        this.radiusDiff += 0.005;
        this.radius += this.radiusDiff;
        
        this.tree = d3.cluster()
            .size([2 * Math.PI, this.radius])
            .separation((a, b) => (a.parent == b.parent ? 1 : 2) / a.depth);

        this.root = this.tree(d3.hierarchy(this.stage.data)
            .sort((a, b) => d3.ascending(a.data.name, b.data.name)));

        d3.selectAll("g.links")
            .selectAll("path")
            .data(this.root.links())
            .join()
                .attr("d", d3.linkRadial()
                    .angle(d => d.x)
                    .radius(d => d.y));

        d3.selectAll("g.nodes")
            .selectAll("circle")
            .data(this.root.descendants())
            .join()
                .attr("transform", d => `rotate(${d.x * 180 / Math.PI - 90}) translate(${d.y},0)`);
        
        d3.selectAll("g.labels")
            .selectAll("text")
            .data(this.root.descendants())
            .join()
                .attr("transform", d => `rotate(${d.x * 180 / Math.PI - 90}) translate(${d.y},0) rotate(${d.x >= Math.PI ? 180 : 0})`)
                .attr("x", d => d.x < Math.PI === !d.children ? 6 : -6);
    }    
}

class SVGChartStage extends Stage {
    constructor()
    {
        super();
        Pseudo.randomSeed = Date.now();
        this._complexity = 0;
    }

    initialize(benchmark, options)
    {
        super.initialize(benchmark, options);
        
        const stageClientRect = this.element.getBoundingClientRect();
        
        const chartSize = new Size(stageClientRect.width, stageClientRect.height);
        this.controller = new ChartController(this, chartSize);
        
        this.#startLoadingData(benchmark);
    }

    #startLoadingData(benchmark)
    {
        setTimeout(async () => {
            await this.#loadDataJSON();
            await this.#loadImages();
            benchmark.readyPromise.resolve();
        }, 0);
    }

    async #loadDataJSON()
    {
        const url = "resources/flare-2.json";
        const response = await fetch(url);
        if (!response.ok) {
            const errorString = `Failed to load data source ${url} with error ${response.status}`
            console.error(errorString);
            throw errorString;
        }
    
        this.data = await response.json();
    }
    
    async #loadImages()
    {
    }
    
    tune(count)
    {
        if (count === 0)
            return;

        this._complexity += count;

        // console.log(`tune ${count} complexity ${this._complexity}`);
        this.controller.complexity = this._complexity;
    }

    animate()
    {
        const timestamp = Date.now();
        this.controller.animate(timestamp);
    }

    complexity()
    {
        return this._complexity;
    }
}

class SVGChartBenchmark extends Benchmark {
    constructor(options)
    {
        const stage = document.getElementById('stage');
        super(new SVGChartStage(stage), options);
    }

    waitUntilReady()
    {
        this.readyPromise = new SimplePromise;
        return this.readyPromise;
    }
}

window.benchmarkClass = SVGChartBenchmark;

class FakeController {
    constructor()
    {
        this.initialComplexity = 10;
        this.startTime = new Date;
    }

    shouldStop()
    {
        const now = new Date();
        return (now - this.startTime) > 5000;
    }
    
    update(timestamp, stage)
    {
        stage.tune(-1);
    }
    
    results()
    {
        return [];
    }
}

// Testing
window.addEventListener('load', () => {
    if (!(window === window.parent))
        return;

    var benchmark = new window.benchmarkClass({ });
    benchmark._controller = new FakeController(benchmark);

    benchmark.run().then(function(testData) {

    });

}, false);
