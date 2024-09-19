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

class MathHelpers {
    static random(min, max)
    {
        return min + Pseudo.random() * (max - min);
    }

    static rotatingColor(hueOffset, cycleLengthMs, saturation, lightness)
    {
        return "hsl("
            + MathHelpers.dateFractionalValue(cycleLengthMs, hueOffset) * 360 + ", "
            + ((saturation || .8) * 100).toFixed(0) + "%, "
            + ((lightness || .35) * 100).toFixed(0) + "%)";
    }

    // Returns a fractional value that wraps around within [0,1]
    static dateFractionalValue(cycleLengthMs, offset)
    {
        return (offset + Date.now() / (cycleLengthMs || 2000)) % 1;
    }
}


class Rect {
    constructor(position, size)
    {
        this.position = position;
        this.size = size;
    }
    
    get x()
    {
        return this.position.x;
    }

    get y()
    {
        return this.position.y;
    }

    get width()
    {
        return this.size.width;
    }

    get height()
    {
        return this.size.height;
    }
}

class Size {
    constructor(width, height)
    {
        this.width = width;
        this.height = height;
    }
}

const testData = [
    { value: 6, label: "6 value" },
    { value: 6, label: "6 value" },
    { value: 4, label: "4 value" },
    { value: 3, label: "3 value" },
    { value: 2, label: "2 value" },
    { value: 1, label: "1 value" },
    { value: 6, label: "6 value" },
    { value: 6, label: "6 value" },
    { value: 4, label: "4 value" },
    { value: 3, label: "3 value" },
    { value: 2, label: "2 value" },
    { value: 1, label: "1 value" },
    { value: 6, label: "6 value" },
    { value: 6, label: "6 value" },
    { value: 4, label: "4 value" },
    { value: 3, label: "3 value" },
    { value: 2, label: "2 value" },
    { value: 1, label: "1 value" },
    { value: 6, label: "6 value" },
    { value: 6, label: "6 value" },
    { value: 4, label: "4 value" },
    { value: 3, label: "3 value" },
    { value: 2, label: "2 value" },
    { value: 1, label: "1 value" },
];

Array.prototype.max = function()
{
  return Math.max.apply(null, this);
};

Array.prototype.min = function()
{
  return Math.min.apply(null, this);
};

Array.prototype.sum = function()
{
    return this.reduce((partialSum, a) => partialSum + a, 0);
};

class BoxItem {
    constructor(value, label)
    {
        this.value = value;
        this.label = label;
        this.element = undefined;
    
        this.hueOffset = Stage.random(0, 1);
        this.saturation = Stage.random(0.2, 0.6);
        this.lightness = Stage.random(0.5, 0.7);
    }
    
    ensureElement()
    {
        if (!this.element) {
            this.element = document.createElement('div');
            this.element.className = 'box';
            this.element.textContent = this.label;
        }
        
        return this.element;
    }
    
    animate(nowData)
    {
        const colorCycleLengthMS = 1200;

        this.element.style.backgroundImage = `linear-gradient(to bottom right, ${MathHelpers.rotatingColor(this.hueOffset, colorCycleLengthMS, this.saturation, this.lightness)},
            ${MathHelpers.rotatingColor(this.hueOffset + 0.2, colorCycleLengthMS, this.saturation, this.lightness)})`;
    }
    
    applyStyle(data)
    {
        const edgeInset = 4;
        this.element.style.left = `${data.x + edgeInset}px`;
        this.element.style.top = `${data.y + edgeInset}px`;
        this.element.style.width = `${Math.max(data.width - 2 * edgeInset, 0)}px`;
        this.element.style.height = `${Math.max(data.height - 2 * edgeInset, 0)}px`;        
    }
}

class LayoutState {
    constructor(position, size)
    {
        this.currentPosition = position;
        this.remainingSize = size;
    }
}

class TreeMapLayout {
    constructor(areaSize, data)
    {
        this.areaSize = areaSize;
        this.originalData = data;
        this.data = this.#normalizeData(this.originalData);
    }
    
    #normalizeData(data)
    {
        const factor = (this.areaSize.width * this.areaSize.height) / data.sum();
        return data.map((x) => (x * factor));
    }
    
    layout()
    {
        this.layoutResults = [];
        const inputData = [...this.data];
        this.#squarishLayoutIterative(inputData);        
    }
    
    #squarishLayoutIterative(items)
    {
        const layoutState = new LayoutState(new Point(0, 0), structuredClone(this.areaSize));
        const remainingItems = [...items];
        let itemsInCurrentRow = [];
        
        let { value: availableSpace, vertical: currentlyVertical } = TreeMapLayout.#getSmallerDimension(layoutState.remainingSize);
        
        while (remainingItems.length > 1) {
            const rowWithChild = [...itemsInCurrentRow, remainingItems[0]]

            if (itemsInCurrentRow.length === 0 || TreeMapLayout.#worstRatio(itemsInCurrentRow, availableSpace) >= TreeMapLayout.#worstRatio(rowWithChild, availableSpace)) {
                remainingItems.shift();
                itemsInCurrentRow = rowWithChild;
                continue;
            }

            this.#layoutRow(itemsInCurrentRow, availableSpace, currentlyVertical, layoutState);
            ({ value: availableSpace, vertical: currentlyVertical } = TreeMapLayout.#getSmallerDimension(layoutState.remainingSize));
            
            itemsInCurrentRow = [];
        }

        this.#layoutLastRow(itemsInCurrentRow, remainingItems, availableSpace, layoutState);
    }

    static #worstRatio(rowValues, width)
    {
        const rowMax = rowValues.max();
        const rowMin = rowValues.min();
        const sumSquared = Math.pow(rowValues.sum(), 2);
        const widthSquared = Math.pow(width, 2);
        return Math.max((widthSquared * rowMax) / sumSquared, sumSquared / (widthSquared * rowMin));
    }

    #layoutRow(rowValues, width, isVertical, layoutState)
    {
        const rowHeight = rowValues.sum() / width;

        rowValues.forEach((rowItem) => {
            const rowWidth = rowItem / rowHeight;
            const curXPos = layoutState.currentPosition.x;
            const curYPos = layoutState.currentPosition.y;

            let data;
            if (isVertical) {
                layoutState.currentPosition.y += rowWidth;
                data = {
                    x: curXPos,
                    y: curYPos,
                    width: rowHeight,
                    height: rowWidth,
                    dataIndex: this.layoutResults.length,
                };
            } else {
                layoutState.currentPosition.x += rowWidth;
                data = {
                    x: curXPos,
                    y: curYPos,
                    width: rowWidth,
                    height: rowHeight,
                    dataIndex: this.layoutResults.length,
                };
            }
            
            this.layoutResults.push(data);
        });

        if (isVertical) {
            layoutState.currentPosition.x += rowHeight;
            layoutState.currentPosition.y -= width;
            layoutState.remainingSize.width -= rowHeight;
        } else {
            layoutState.currentPosition.x -= width;
            layoutState.currentPosition.y += rowHeight;
            layoutState.remainingSize.height -= rowHeight;
        }
    }

    #layoutLastRow(rowValues, remainingItems, width, layoutState)
    {
        const isVertical = TreeMapLayout.#getSmallerDimension(layoutState.remainingSize).vertical;
        this.#layoutRow(rowValues, width, isVertical, layoutState);
        this.#layoutRow(remainingItems, width, isVertical, layoutState);
    }

    static #getSmallerDimension(remainingSpace)
    {
        if (remainingSpace.height ** 2 > remainingSpace.width ** 2)
            return { value: remainingSpace.width, vertical: false };

        return { value: remainingSpace.height, vertical: true };
    }
}

class FractalBoxesController {
    constructor(stage)
    {
        this.stage = stage;
        const stageClientRect = this.stage.element.getBoundingClientRect();
        this.stageSize = new Size(stageClientRect.width, stageClientRect.height);
        this.nodeCount = 1;

        this._complexity = 0;        

        this.items = [];
    }

    set complexity(complexity)
    {
        if (complexity > this._complexity) {
            this.items.length = complexity;
          
            for (let i = this._complexity; i < this.items.length; ++i)
                this.items[i] = new BoxItem(Stage.random(0.1, 1), 'here');
        } else {
            for (let i = complexity; i < this.items.length; ++i)
                this.items[i].element.remove();

            this.items.length = complexity;
        }
        
        this._complexity = complexity;
        
        const numericValues = this.items.map((x) => x.value);
        
        this.treeMap = new TreeMapLayout(this.stageSize, numericValues);
        this.treeMap.layout();
        
        let i = 0;
        for (const data of this.treeMap.layoutResults) {
            const item = this.items[data.dataIndex];
            const element = item.ensureElement();
            item.applyStyle(data);
            
            element.textContent = this.treeMap.data[i].toFixed(2);
            
            if (!element.parentElement)
                this.stage.element.appendChild(element);
            ++i;
        }
    }
    
    animate()
    {
        const nowData = new Date;
        for (const boxItem of this.items)
            boxItem.animate(nowData);
    }
}


class FractalBoxesStage extends Stage {
    constructor()
    {
        super();
        Pseudo.randomSeed = Date.now();
        this._complexity = 0;
    }

    initialize(benchmark, options)
    {
        super.initialize(benchmark, options);
        
        this.element.innerText = '';
        const stageClientRect = this.element.getBoundingClientRect();
        this.stageSize = new Size(stageClientRect.width, stageClientRect.height);
        
        this.controller = new FractalBoxesController(this);
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
        this.controller.animate();
    }

    complexity()
    {
        return this._complexity;
    }
}

class FractalBoxesBenchmark extends Benchmark {
    constructor(options)
    {
        const stage = document.getElementById('stage');
        super(new FractalBoxesStage(stage), options);
    }

}

window.benchmarkClass = FractalBoxesBenchmark;

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
    if (window.parentWindow)
        return;

    var benchmark = new window.benchmarkClass({ });
    benchmark._controller = new FakeController();

    benchmark.run().then(function(testData) {

    });

}, false);
