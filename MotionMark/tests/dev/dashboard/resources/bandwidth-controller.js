/*
 * Copyright (C) 2025 Apple Inc. All rights reserved.
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


class GraphData {
    constructor(steadyStateValue, generator)
    {
        this.steadyStateValue = steadyStateValue;
        this.generator = generator;
        this._complexity = 0;
    }

    set complexity(complexity)
    {
        this._complexity = complexity;
        // FIXME: Shorten
        this.data = Array.from({ length: this._complexity }, () => { return this.yieldValue() } );
    }

    yieldValue()
    {
        return Math.max(this.steadyStateValue - this.generator(), 0);
    }
}

class BandwidthController extends ChartController {
    constructor(stage, containerElement)
    {
        super(stage, containerElement);
        
        const chartContainers = containerElement.querySelectorAll('.chart');
        
        this.downloadChartContainer = chartContainers[0];
        this.uploadChartContainer = chartContainers[1];
    }
    
    async initialize()
    {
        await super.initialize();
        
        const steadyStateDownload = 2400;
        const steadyStateUpload = 750;
        
        this.downloadGraph = new GraphData(steadyStateDownload, d3.randomLogNormal(5, 1));
        this.uploadGraph = new GraphData(steadyStateDownload, d3.randomLogNormal(3, 0.8));
    }

    set complexity(complexity)
    {
        super.complexity = complexity;

        this.downloadGraph.complexity = complexity;
        this.uploadGraph.complexity = complexity;

        this.#buildChart(this.downloadGraph, this.downloadChartContainer);
        this.#buildChart(this.uploadGraph, this.uploadChartContainer);
    }

    #buildChart(graph, container)
    {
        container.firstChild?.remove();

        const width = 928;
        const height = 200;
        const marginTop = 20;
        const marginRight = 30;
        const marginBottom = 30;
        const marginLeft = 100;

        graph.xScale = d3.scaleLinear(d3.extent(graph.data, (d, i) => i), [marginLeft, width - marginRight]);
        graph.yScale = d3.scaleLinear([0, d3.max(graph.data, (d, i) => graph.data[i])], [height - marginBottom, marginTop]);

        // Declare the area generator.
        graph.area = d3.area()
            .x((d, i) => graph.xScale(i))
            .y0(graph.yScale(0))
            .y1((d, i) => graph.yScale(graph.data[i]));

        graph.line = d3.line()
            .x((d, i) => graph.xScale(i))
            .y((d, i) => graph.yScale(graph.data[i]));

        // Create the SVG container.
        const svg = d3.create("svg")
            .attr("width", width)
            .attr("height", height)
            .attr("viewBox", [0, 0, width, height])
            .attr("style", "max-width: 100%; height: auto;");

        const gradient = svg.append("defs").append("linearGradient")
            .attr("id", "fade")
            .attr("x1", "0%")
            .attr("x2", "0%")
            .attr("y1", "0%")
            .attr("y2", "100%");

        gradient.append("stop")
            .attr("offset", "0%")
            .style("stop-color", "#8ecccc")
            .style("stop-opacity", 1)

        gradient.append("stop")
            .attr("offset", "30%")
            .style("stop-color", "#8ecccc")
            .style("stop-opacity", 0.4)

        gradient.append("stop")
            .attr("offset", "100%")
            .style("stop-color", "#8ecccc")
            .style("stop-opacity", 0)

        // Append a path for the area (under the axes).
        svg.append("path")
            .attr("fill", "url(#fade)")
            .attr("class", "data-path")
            .attr("d", graph.area(graph.data));

        svg.append("path")
            .attr("fill", "none")
            .attr("stroke", "#8ecccc")
            .attr("class", "data-fill")
            .attr("d", graph.line(graph.data));

        container.appendChild(svg.node());
    }

    animate(timestamp)
    {
        this.#animateGraph(this.downloadGraph, this.downloadChartContainer, timestamp);
        this.#animateGraph(this.uploadGraph, this.uploadChartContainer, timestamp);
    }
    
    #animateGraph(graph, container, timestamp)
    {
        graph.data.push(graph.yieldValue());
        graph.data.shift();

        d3.select(container).selectAll(".data-path")
            .data(graph.data)
            .attr("d", graph.area(graph.data));

        d3.select(container).selectAll(".data-fill")
            .data(graph.data)
            .attr("d", graph.line(graph.data));
        
    }
}