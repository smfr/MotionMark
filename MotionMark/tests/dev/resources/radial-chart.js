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


// To be moved.
class MathHelpers {
    
    static random(min, max)
    {
        return min + Pseudo.random() * (max - min);
    }
    
}

const USStates = ['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY'];

class RandomWalk {
    constructor(min, max, stepFraction)
    {
        this.min = min;
        this.max = max;
        this.stepFraction = stepFraction;
        this.value = MathHelpers.random(this.min, this.max);
    }
    
    // Really need some kind of trends here.
    nextValue()
    {
        const scale = (this.max - this.min) * this.stepFraction;
        const delta = scale * 2 * (Pseudo.random() - 0.5);
        this.value = Math.max(Math.min(this.value + delta, this.max), this.min);
        return this.value;
    }
}

const TwoPI = Math.PI * 2;
const Clockwise = false;
const CounterClockwise = true;

class RadialChart {
    constructor(center, radius)
    {
        this.center = center;
        this.radius = radius;
        this._values = [];
        this.#computeDimensions();

        this.complexity = 1;
    }
    
    get complexity()
    {
        return this._complexity;
    }

    set complexity(value)
    {
        this._complexity = value;
        if (this._complexity < this._values.length) {
            this._values.length = this._complexity;
            return;
        }
        
        const startIndex = this._values.length;
        for (let i = startIndex; i < this._complexity; ++i)
            this._values.push(new RandomWalk(this.innerRadius, this.radius, 1 / 100));
    }
    
    draw(ctx)
    {
        this.numSpokes = this._complexity - 1;
        this.wedgeAngleRadians = TwoPI / this.numSpokes;
        this.angleOffsetRadians = Math.PI / 2; // Start at the top, rather than the right.

        for (let i = 0; i < this.numSpokes; ++i) {
            this.#drawWedge(ctx, i);
            this.#drawBadge(ctx, i);
            this.#drawWedgeLabels(ctx, i);
        }

        this.#drawGraphAxes(ctx);
    }
    
    #computeDimensions()
    {
        this.innerRadius = this.radius / 3;
    }

    #drawGraphAxes(ctx)
    {
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.arc(this.center.x, this.center.y, this.innerRadius, 0, TwoPI, Clockwise);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(this.center.x, this.center.y, this.radius, 0, TwoPI, Clockwise);
        ctx.stroke();

        for (let i = 0; i < this.numSpokes; ++i) {
            const angleRadians = this.#wedgeStartAngle(i);

            const startPoint = this.center.add(GeometryHelpers.createPointOnCircle(angleRadians, this.innerRadius));
            const endPoint = this.center.add(GeometryHelpers.createPointOnCircle(angleRadians, this.radius));

            ctx.beginPath();
            ctx.moveTo(startPoint.x, startPoint.y);
            ctx.lineTo(endPoint.x, endPoint.y);
            ctx.stroke();
        }
    }
    
    #wedgeStartAngle(index)
    {
        return index * this.wedgeAngleRadians - this.angleOffsetRadians;
    }

    #drawWedge(ctx, index)
    {
        const startAngleRadians = this.#wedgeStartAngle(index);
        const endAngleRadians = startAngleRadians + this.wedgeAngleRadians;

        const wedgeOuterRadius = this._values[index].nextValue();

        const wedgePath = new Path2D();

        const firstStartPoint = this.center.add(GeometryHelpers.createPointOnCircle(startAngleRadians, this.innerRadius));
        const firstEndPoint = this.center.add(GeometryHelpers.createPointOnCircle(startAngleRadians, wedgeOuterRadius));

        wedgePath.moveTo(firstStartPoint.x, firstStartPoint.y);
        wedgePath.lineTo(firstEndPoint.x, firstEndPoint.y);

        wedgePath.arc(this.center.x, this.center.y, wedgeOuterRadius, startAngleRadians, endAngleRadians, Clockwise);

        const secondEndPoint = this.center.add(GeometryHelpers.createPointOnCircle(endAngleRadians, this.innerRadius));
        wedgePath.lineTo(secondEndPoint.x, secondEndPoint.y);
        wedgePath.arc(this.center.x, this.center.y, this.innerRadius, endAngleRadians, startAngleRadians, CounterClockwise);

        const gradient = ctx.createRadialGradient(this.center.x, this.center.y, this.innerRadius, this.center.x, this.center.y, wedgeOuterRadius);
        gradient.addColorStop(0, Stage.randomColor());
        gradient.addColorStop(0.9, Stage.randomColor());

        ctx.fillStyle = gradient;
        ctx.fill(wedgePath);
    }
    
    #drawWedgeLabels(ctx, index)
    {
        const midAngleRadians = this.#wedgeStartAngle(index) + 0.5 * this.wedgeAngleRadians;

        const textInset = 15;
        const textCenterPoint = this.center.add(GeometryHelpers.createPointOnCircle(midAngleRadians, this.innerRadius - textInset));

        const stateIndex = index % USStates.length;
        const labelAngle = midAngleRadians + Math.PI / 2;
        
        ctx.save();
        ctx.font = "10px sans-serif";
        ctx.fillStyle = 'black';
        
        ctx.translate(textCenterPoint.x, textCenterPoint.y);
        ctx.rotate(labelAngle);
        
        const label = USStates[stateIndex];
        const textSize = ctx.measureText(label);
        ctx.fillText(USStates[stateIndex], -textSize.width / 2, 0);
        ctx.restore();
        
        
        const outerLabelLocation = this.#locationForOuterLabel(index);
        ctx.fillStyle = 'black';
        ctx.fillText(USStates[stateIndex], outerLabelLocation.x, outerLabelLocation.y);
        
        const wedgeArrowEnd = this.center.add(GeometryHelpers.createPointOnCircle(midAngleRadians, this.radius));
        const arrowPath = this.#pathForArrow(outerLabelLocation, wedgeArrowEnd);
        
        ctx.save();
        ctx.strokeStyle = 'gray';
        ctx.setLineDash([10, 4]);
        ctx.stroke(arrowPath);
        ctx.restore();
    }
    
    #drawBadge(ctx, index)
    {
        // Create sprite sheet canvas?
        const badgeURL = 'resources/department-shields/Blason_département_fr_Ain.png';
        const badgeImage = new Image;
        badgeImage.src = badgeURL;

        const midAngleRadians = this.#wedgeStartAngle(index) + 0.5 * this.wedgeAngleRadians;
        const imageAngle = midAngleRadians + Math.PI / 2;

        const imageInset = 20;
        const imageCenterPoint = this.center.add(GeometryHelpers.createPointOnCircle(midAngleRadians, this.innerRadius + imageInset));

        ctx.save();
        ctx.translate(imageCenterPoint.x, imageCenterPoint.y);
        ctx.rotate(imageAngle);

        ctx.shadowColor = "black";
        ctx.shadowBlur = 5;
        
        const imageSize = new Size(20, 20);
        ctx.drawImage(badgeImage, 0, 0, imageSize.width, imageSize.height);
        ctx.restore();
    }
    
    #locationForOuterLabel(index)
    {
        const labelsPerSide = this.numSpokes / 2;

        const horizonalEdgeOffset = 100;
        const verticalEdgeOffset = 20;
        const verticalSpacing = this.radius * 2 / labelsPerSide;

        if (index <= labelsPerSide) {
            // Right side, going down.
            const labelX = horizonalEdgeOffset + this.center.x + this.radius;
            const labelY = verticalEdgeOffset + index * verticalSpacing;

            return new Point(labelX, labelY);
            
        } else {
            // Left side, going up.
            const bottomY = this.center.y + this.radius;

            const labelX = this.center.x - (horizonalEdgeOffset + this.radius);
            const labelY = bottomY - (index - labelsPerSide) * verticalSpacing;

            return new Point(labelX, labelY);
        }
    }
    
    #pathForArrow(startPoint, endPoint)
    {
        const arrowPath = new Path2D();
        arrowPath.moveTo(startPoint.x, startPoint.y);
        // Compute a bezier path that keeps the line horizontal at the start and end.

        const controlPointProportion = 0.5;

        const controlPoint1 = startPoint.add({ x: controlPointProportion * (endPoint.x - startPoint.x), y: 0});
        const controlPoint2 = endPoint.subtract({ x: controlPointProportion * (endPoint.x - startPoint.x), y: 0});
        arrowPath.bezierCurveTo(controlPoint1.x, controlPoint1.y, controlPoint2.x, controlPoint2.y, endPoint.x, endPoint.y);

        //arrowPath.lineTo(endPoint.x, endPoint.y);
        // Add arrowhead
        return arrowPath;
    }
}

class RadialChartStage extends Stage {
    constructor(canvasObject)
    {
        super();
        this._canvasObject = canvasObject;
        this.charts = [];
    }

    initialize(benchmark, options)
    {
        super.initialize(benchmark, options);

        this.canvasSize = new Size(this._canvasObject.width, this._canvasObject.height);

        const centerPoint = new Point(this.canvasSize.width / 2, this.canvasSize.height / 2);
        const radius = this.canvasSize.height * 0.45;
        
        this._complexity = 1;

        this.charts.push(new RadialChart(centerPoint, radius));

        this.context = this.element.getContext("2d");
    }

    tune(count)
    {
        if (count == 0)
            return;

        this._complexity += count;
    }

    animate()
    {
        console.log(`animate - complexity ${this._complexity}`);
        const context = this.context;
        context.clearRect(0, 0, this.size.x, this.size.y);
        
        const perChartComplexity = Math.max(2, Math.floor(this._complexity / this.charts.length));
        for (const chart of this.charts) {
            chart.complexity = perChartComplexity;
            chart.draw(context);
        }

    }

    complexity()
    {
        return this._complexity;
    }
}

class RadialChartBenchmark extends Benchmark {
    constructor(options)
    {
        const canvas = document.getElementById('stage');
        super(new RadialChartStage(canvas), options);
    }
}


window.benchmarkClass = RadialChartBenchmark;

class FakeController {
    constructor()
    {
        this.initialComplexity = 50;
        this.startTime = new Date;
    }

    shouldStop()
    {
        const now = new Date();
        return (now - this.startTime) > 5000;
    }
    
    results()
    {
        return [];
    }
}

// Testing
// window.addEventListener('load', () => {
//
//     var benchmark = new window.benchmarkClass({ });
//     benchmark._controller = new FakeController();
//
//     benchmark.run().then(function(testData) {
//
//     });
//
// }, false);

