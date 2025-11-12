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


// FIXME: Share the layout classes.
class ItemLayout {
    constructor(container, itemSize, stageSize)
    {
        this._container = container;
        this._itemSize = itemSize;
        this._stageSize = stageSize;
    }
    
    arrangeItems()
    {
    }
}

class RandomPlacementLayout extends ItemLayout {
    constructor(container, itemSize, stageSize)
    {
        super(container, itemSize, stageSize);
        this._container.classList.add('layout-random');
    }

    arrangeItems()
    {
        // Choose a position that keeps the element mostly on-screen; 80% of the height and width have to be visible.
        const fractionVisible = 1;
        const allowedMinXClip = (1 - fractionVisible) * this._itemSize.width;
        const allowedMinYClip = (1 - fractionVisible) * this._itemSize.height;
        const allowedMaxXClip = fractionVisible * this._itemSize.width;
        const allowedMaxYClip = fractionVisible * this._itemSize.height;

        for (const child of this._container.children) {

            const x = Stage.randomInt(-allowedMinXClip, this._stageSize.width - allowedMaxXClip);
            const y = Stage.randomInt(-allowedMinYClip, this._stageSize.height - allowedMaxYClip);
        
            child.style.left = `${x}px`;
            child.style.top = `${y}px`;
        }
    }
}


class Column {
    constructor(label, width, fillColor, cellClass)
    {
        this.label = label;
        this.width = width;
        this.fillColor = fillColor;
        this.cellClass = cellClass;
    }
}

class Row {
    constructor(label, height, fillColor)
    {
        this.label = label;
        this.height = height;
        this.fillColor = fillColor;
    }
}




class SheetCell {
    draw(ctx, cellSize)
    {
        
    }
    
}

class TextSheetCell {
    constructor(text)
    {
        this.text = text;
    }

    draw(ctx, cellSize)
    {
        const padding = 4;
        ctx.fillStyle = 'black';
        ctx.fillText(this.text, padding, -padding);
    }
}

class ImageSheetCell {
    constructor(imageURL)
    {
        this.image = new Image();
        this.image.src = imageURL;
    }

    draw(ctx, cellSize)
    {
        const padding = 4;
        ctx.drawImage(this.image, padding, padding - cellSize.height, cellSize.width - 2 * padding, cellSize.height - 2 * padding);
    }
}

class NumericSheetCell {
    constructor(value)
    {
        this.value = value;
    }

    draw(ctx, cellSize)
    {
        // FIXME: Align on the period
        const padding = 4;
        ctx.fillStyle = 'black';
        ctx.fillText(this.value, padding, -padding);
    }
}

class CurrencySheetCell {
    constructor(value)
    {
        this.value = value;
    }

    draw(ctx, cellSize)
    {
        // FIXME: Align on the period
        const padding = 4;
        ctx.fillStyle = 'black';
        ctx.fillText(this.value, padding, -padding);
    }
}

class Sheet {
    constructor()
    {
        this.rows = [];
        this.columns = [];
    }
}


class SheetView {
    constructor(stage)
    {
        this.stage = stage;
        
        this.container = document.createElement('section');
        this.container.className = 'sheet';
        
        this.canvas = document.createElement('canvas');
        this.container.appendChild(this.canvas);

        this.sheet = new Sheet();
        
        this.stage.element.appendChild(this.container);
        
        this.#prepare();
    }
    
    remove()
    {
        this.container.remove();
    }

    #prepare()
    {
        const size = this.measureSize();
        const integralSize = new Size(Math.floor(size.width), Math.floor(size.height));
        
        this.scrollOffset = new Size(0, 0);

        // this.columns = this._randomizedColumns(size.width);
        
        this.columns = [];
        let columnLabel = 'A';
        for (let colInfo of this.stage.columns) {
            const colorAlpha = 0.2;
            const color = Stage.randomRGBColor(colorAlpha);

            const column = new Column(columnLabel++, parseFloat(colInfo.width), color, this.#cellClassFromColumnType(colInfo.type));
            this.columns.push(column);
        }

        //this.rows = this._randomizedRows(size.height);
        const rowHeight = 150;
        let rowLabel = '1';
        this.rows = [];
        for (let plantInfo of this.stage.plantList) {
            const color = 'rgba(0, 0, 0, 0)';
            const row = new Row(rowLabel++, rowHeight, color);
            this.rows.push(row);
        }
        
        this.#createCells(this.rows.length, this.columns.length);

        this.devicePixelRatio = 2;
        this.canvasSize = new Size(integralSize.width * devicePixelRatio, integralSize.height * devicePixelRatio);
        
        this.canvas.width = this.canvasSize.width;
        this.canvas.height = this.canvasSize.height;
        
        const ctx = this.canvas.getContext('2d');

        ctx.fillStyle = 'rgba(255, 255, 255, 1)';
        ctx.fillRect(0, 0, this.canvasSize.width, this.canvasSize.height);

        this.#drawSheet(ctx);
    }
    
    #cellClassFromColumnType(columnType)
    {
        switch (columnType) {
        case 'text':
            return TextSheetCell;
        case 'image':
            return ImageSheetCell;
        case 'numeric':
            return NumericSheetCell;
        case 'currency':
            return CurrencySheetCell;
        }
    }
    
    #createCells(rowCount, columnCount)
    {
        this.cells = Array.from({ length: rowCount }, () => new Array(columnCount));

        for (let colIndex = 0; colIndex < columnCount; ++colIndex) {
            const columnData = this.stage.columns[colIndex];
            const column = this.columns[colIndex];

            for (let rowIndex = 0; rowIndex < rowCount; ++rowIndex) {
                const row = this.rows[rowIndex];
                const plantData = this.stage.plantList[rowIndex];

                this.cells[colIndex][rowIndex] = new column.cellClass(plantData[columnData.key]);
            }
        }
    }

    measureSize(container)
    {
        const bounds = this.container.getBoundingClientRect();
        return new Size(bounds.width, bounds.height);
    }

    animate()
    {
        this.#scrollSheet();
    }

    #scrollSheet()
    {
        const scrollXDelta = 0;
        const scrollYDelta = 2;
        this.scrollOffset = new Size(this.scrollOffset.width + scrollXDelta, this.scrollOffset.height + scrollYDelta);
        
        const ctx = this.canvas.getContext('2d');
        
        const backingScrollX = scrollXDelta * this.devicePixelRatio;
        const backingScrollY = scrollYDelta * this.devicePixelRatio;
        
        ctx.drawImage(this.canvas, -backingScrollX, -backingScrollY);

        ctx.save();
        ctx.beginPath();
        if (backingScrollX > 0)
            ctx.rect(this.canvasSize.width - backingScrollX, 0, backingScrollX, this.canvasSize.height);
        else if (backingScrollX < 0)
            ctx.rect(0, 0, backingScrollX, this.canvasSize.height);

        if (backingScrollY > 0)
            ctx.rect(0, this.canvasSize.height - backingScrollY, this.canvasSize.width, backingScrollY);
        else if (backingScrollY < 0)
            ctx.rect(0, 0, this.canvasSize.width, backingScrollY);

        ctx.closePath();
        ctx.clip('nonzero');

        this.#drawSheet(ctx);
        ctx.restore();
    }
    
    #drawSheet(ctx)
    {
        ctx.save();

        ctx.scale(this.devicePixelRatio, this.devicePixelRatio);
        
        ctx.fillStyle = 'rgba(255, 255, 255, 1)';
        ctx.fillRect(0, 0, this.canvasSize.width, this.canvasSize.height);
        
        ctx.translate(-this.scrollOffset.width, -this.scrollOffset.height);
        
        this.#drawGrid(ctx);
        this.#drawCells(ctx);

        ctx.restore();
    }
    
    #drawGrid(ctx)
    {
        const maxX = this.canvasSize.width;
        const maxY = this.canvasSize.height;

        let currX = 0;

        ctx.save();
        
        // FIXME: We can cache this path.
        const gridPath = new Path2D();

        for (let column of this.columns) {
            gridPath.moveTo(currX, 0);
            gridPath.lineTo(currX, maxX);

            const columnRect = new Rect(new Point(currX, 0), new Size(column.width, maxX));
            ctx.fillStyle = column.fillColor;
            ctx.fillRect(columnRect.x, columnRect.y, columnRect.width, columnRect.height);

            currX += column.width;
        }
        
        let currY = 0;
        for (let row of this.rows) {
            gridPath.moveTo(0, currY);
            gridPath.lineTo(maxX, currY);
            currY += row.height;
        }

        ctx.strokeStyle = 'rgba(31, 31, 31, 0.133)';

        ctx.lineWidth = 1;
        
        if (ctx.lineCap != 'square')
            ctx.lineCap = 'square';

        if (ctx.lineJoin != 'miter')
            ctx.lineJoin = 'miter';

        if (ctx.miterLimit != 10)
            ctx.miterLimit = 10;

        ctx.lineDashOffset = 0;
        ctx.setLineDash([]);
        ctx.stroke(gridPath);
        ctx.restore();
    }
    
    #drawCells(ctx)
    {
        // FIXME: Google Sheets doesn't clip per cell, and draws all the images, and then all the text.
        
        let currY = 0;
        for (let rowIndex = 0; rowIndex < this.rows.length; ++rowIndex) {
            const row = this.rows[rowIndex];
            currY += row.height;

            let currX = 0;
            for (let colIndex = 0; colIndex < this.columns.length; ++colIndex) {
                const col = this.columns[colIndex];
                
                ctx.save();
                
                const cellSize = new Size(col.width, row.height);
                const cellRect = new Rect(new Point(currX, currY), cellSize);

                ctx.translate(cellRect.x, cellRect.y);
                const clipPath = new Path2D();
                clipPath.rect(0, -cellRect.height, cellRect.width, cellRect.height);
                ctx.clip(clipPath, 'evenodd');

                const cell = this.cells[colIndex][rowIndex];
                cell.draw(ctx, cellSize);

                ctx.restore();

                currX += col.width;
            }
        }
    }
    
    _randomizedColumns(availableSpace)
    {
        const minColumnWidth = Math.min(30, availableSpace / 10);
        const maxColumnWidth = Math.max(200, availableSpace / 5);

        const columnCoverageWidth = 2 * availableSpace;

        let totalWidth = 0;
        const columns = [];
        let label = 'A';

        // We let the total width exceed availableSpace, so the last column clips.
        while (totalWidth < columnCoverageWidth) {
            const width = Stage.randomInt(minColumnWidth, maxColumnWidth);
            const colorAlpha = 0.2;
            const color = Stage.randomRGBColor(colorAlpha);
            const column = new Column(label++, width, color);
            columns.push(column);
            totalWidth += width;
        }

        return columns;
    }

    _randomizedRows(availableSpace)
    {
        const numRows = 8;
        const rowCoverageHeight = 2 * availableSpace;
        const rowHeight = Math.floor(this.canvas.height / numRows);

        let totalHeight = 0;
        const rows = [];
        let label = '1';

        // We let the total width exceed availableSpace, so the last column clips.
        while (totalHeight < rowCoverageHeight) {
            const color = 'rgba(0, 0, 0, 0)';
            const row = new Row(label++, rowHeight, color);

            // FIXME: Make some rows be taller.
            rows.push(row);
            totalHeight += rowHeight;
        }

        return rows;
    }
}

class SheetsStage extends Stage {
    constructor()
    {
        super();

        Pseudo.randomSeed = Date.now();

        this._complexity = 0;
        this._sheetViews = [];
    }

    async initialize(benchmark, options)
    {
        await super.initialize(benchmark, options);

        const response = await fetch('resources/sheet-data.json');
        if (!response.ok)
            console.error(`Failed to fetch JSON`);
        
        const jsonData = await response.json();
        this.columns = jsonData.columns;
        this.plantList = jsonData.houseplants;

        await this.#loadImages();

        const stageRect = this.element.getBoundingClientRect();

        const sheetView = new SheetView(this, this.sheetSize);
        this.sheetSize = sheetView.measureSize();
        sheetView.remove();
        
        this.layout = new RandomPlacementLayout(this.element, this.sheetSize, new Size(stageRect.width, stageRect.height));
    }

    tune(delta)
    {
        if (delta == 0)
            return;
        
        const newComplexity = this._complexity + delta;
        if (newComplexity < this._complexity) {

            let itemsToRemove = this._sheetViews.splice(newComplexity);
            itemsToRemove.forEach((item) => item.remove());
            
        } else {
            for (let itemCount = this._complexity; itemCount < newComplexity; ++itemCount) {
                const sheet = new SheetView(this, this.sheetSize);
                this._sheetViews.push(sheet);
            }
        }

        this._complexity = newComplexity;
        this.layout.arrangeItems();
    }

    animate()
    {
        for (let sheet of this._sheetViews) {
            sheet.animate();
        }
    }

    complexity()
    {
        return this._complexity;
    }
    
    async #loadImages()
    {
        const promises = this.plantList.map((data) => {
            return new Promise(resolve => {
                const image = new Image();
                image.onload = resolve;
                image.src = data.image;
            })
        });

        await Promise.all(promises);
    }
}

class SheetsBenchmark extends Benchmark {
    constructor(options)
    {
        super(new SheetsStage(), options);
    }
}

window.benchmarkClass = SheetsBenchmark;

class FakeController {
    constructor()
    {
        this.initialComplexity = 1;
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

// This allows the test HTML file to be loaded directly and run the test with fixed complexity.
window.addEventListener('load', async () => {
    if (!(window === window.parent))
        return;

    var benchmark = new window.benchmarkClass({ });
    benchmark._controller = new FakeController();
    await benchmark.initialize({ });

    benchmark.run().then(function(testData) {

    });

}, false);
