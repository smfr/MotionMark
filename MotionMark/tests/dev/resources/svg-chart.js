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



class TreeOfLifeDataSet {
    constructor(jsonData, maxNodes = 100)
    {
        this.jsonData = jsonData;
        this.nodeList = this.jsonData['nodes'];
        this.links = this.jsonData['links'];
        this._maxNodes = maxNodes;

        this.nodes = { };
        for (const node of this.nodeList)
            this.nodes[node.id] = node;

        this.#buildTree();
    }
    
    set maxNodes(maxNodes)
    {
        this._maxNodes = maxNodes;

        for (const node of this.nodeList)
            node.children = [];

        this.#buildTree();
    }
    
    #buildTree()
    {
        console.log(`buildTree ${this._maxNodes}`)

        const rootNodeID = 1;
        this.rootNode = this.nodes[rootNodeID];

        let nodeCount = 0;
        
        for (const link of this.links) {
            const sourceNode = this.nodes[link.source];
            const targetNode = this.nodes[link.target];
            if (!targetNode)
                continue;
            
            if (!sourceNode.children)
                sourceNode.children = [];
            
            sourceNode.children.push(targetNode);
            
            if (++nodeCount > this._maxNodes)
                break;
        }
        
        // FIXME: Need to filter nodes that have no leaves.
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
        this.stage.dataSet.maxNodes = this._complexity;
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
        this.root = this.tree(d3.hierarchy(this.stage.dataSet.rootNode)
            .sort((a, b) => d3.ascending(a.data.name, b.data.name)));
        
        // Creates the SVG container.
        this.svg = d3.create("svg")
            .attr("width", width)
            .attr("height", height)
            .attr("viewBox", [-cx, -cy, width, height]);

        // Append links.
        this.svg.append("g")
            .attr("class", "links")
            .attr("fill", "none")
            .attr("stroke-opacity", 0.4)
            .attr("stroke-width", 1.5)
            .selectAll()
            .data(this.root.links())
            .join("path")
                .attr("stroke", d => d.target.children ? "red" : "blue")
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
                .attr("fill", d => d.children ? "red" : "blue")
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

        this.root = this.tree(d3.hierarchy(this.stage.dataSet.rootNode)
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

    async initialize(benchmark, options)
    {
        await super.initialize(benchmark, options);
        
        const stageClientRect = this.element.getBoundingClientRect();
        
        const chartSize = new Size(stageClientRect.width, stageClientRect.height);
        this.controller = new ChartController(this, chartSize);

        await this.#loadData(benchmark);
    }

    async #loadData(benchmark)
    {
        await this.#loadDataJSON();
        await this.#loadImages();
    }

    async #loadDataJSON()
    {
        const url = "resources/treeoflife.json";
        const response = await fetch(url);
        if (!response.ok) {
            const errorString = `Failed to load data source ${url} with error ${response.status}`
            console.error(errorString);
            throw errorString;
        }
    
        this.jsonData = await response.json();
        this.dataSet = new TreeOfLifeDataSet(this.jsonData);
    }
    
    async #loadImages()
    {
    }
    
    tune(count)
    {
        if (count === 0)
            return;

        this._complexity += count;

        console.log(`tune ${count} complexity ${this._complexity}`);
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
}

window.benchmarkClass = SVGChartBenchmark;

class FakeController {
    constructor()
    {
        this.initialComplexity = 500;
        this.startTime = new Date;
    }

    shouldStop()
    {
        const now = new Date();
        return (now - this.startTime) > 1000;
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
window.addEventListener('load', async () => {
    if (!(window === window.parent))
        return;

    var benchmark = new window.benchmarkClass({ });
    benchmark._controller = new FakeController(benchmark);
    
    await benchmark.initialize({ });
    benchmark.run().then(function(testData) {

    });

}, false);
