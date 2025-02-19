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


class ThroughputController extends ChartController {
    constructor(stage, containerElement)
    {
        super(stage, containerElement);

    }
    
    async initialize()
    {
        await super.initialize();

        this.randomGenerator = d3.randomPoisson(10);
    }

    set complexity(complexity)
    {
        super.complexity = complexity;

        const dataLength = complexity;
        this.data = Array.from({ length: dataLength }, () => { return this.randomGenerator(); });

        this.#buildChart();
    }

    #buildChart()
    {
        const containerRect = this.containerElement.getBoundingClientRect();
        
        const marginTop = 30;
        const marginRight = 20;
        const marginBottom = 20;
        const marginLeft = 30;

        const width = containerRect.width - marginLeft - marginRight;
        const height = containerRect.height - marginTop - marginBottom;

        this.xScale = d3.scaleLinear(d3.extent(this.data, (d, i) => i), [marginLeft, width - marginRight]);
        this.yScale = d3.scaleLinear([0, d3.max(this.data, (d, i) => this.data[i])], [height - marginBottom, marginTop]);

        // Declare the area generator.
        this.area = d3.area()
            .x((d, i) => this.xScale(i))
            .y0(this.yScale(0))
            .y1((d, i) => this.yScale(this.data[i]));

        // Create the SVG container.
        const svg = d3.create("svg")
            .attr("width", width)
            .attr("height", height)
            .attr("viewBox", [0, 0, width, height])
            .attr("style", "max-width: 100%; height: auto;");

        // Append a path for the area (under the axes).
        svg.append("path")
            .attr("fill", "#50717b")
            .attr("class", "data-path")
            .attr("d", this.area(this.data));

        // Add the x-axis.
        svg.append("g")
            .attr("transform", `translate(0,${height - marginBottom})`)
            .call(d3.axisBottom(this.xScale).ticks(width / 80).tickSizeOuter(0));

        // Add the y-axis, remove the domain line, add grid lines and a label.
        svg.append("g")
            .attr("transform", `translate(${marginLeft},0)`)
            .call(d3.axisLeft(this.yScale).ticks(height / 40))
            .call(g => g.selectAll(".tick line").clone()
                .attr("x2", width - marginLeft - marginRight)
                .attr("stroke-opacity", 0.1));

        this.chartNode?.remove();
        this.chartNode = svg.node();
        this.containerElement.appendChild(this.chartNode);
    }

    animate(timestamp)
    {
        this.data.push(this.randomGenerator());
        this.data.shift();

        d3.selectAll(".data-path")
            .data(this.data)
            .attr("d", this.area(this.data));
    }
}