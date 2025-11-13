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

/* -------------------------------------------------------- */

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

/* -------------------------------------------------------- */

class SheetCell {
    static CELL_PADDING = 4;
    draw(ctx, cellSize)
    {
    }   
}

class TextDrawingSheetCell {
    constructor(fontSize, textStyle, alignment, wrap)
    {
        this.fontSize = fontSize ?? 18;
        this.textStyle = textStyle ?? '';
        this.alignment = alignment ?? 'left';
        this.wrapText = wrap ?? false;
    }
    
    get textValue()
    {
        return '';
    }

    draw(ctx, cellSize)
    {
        this.drawText(ctx, cellSize, this.textValue);
    }
    
    drawText(ctx, cellSize, text)
    {
        ctx.font = `${this.fontSize} Arial ${this.textStyle}`;
        ctx.fillStyle = 'black';
        
        const availableWidth = cellSize.width - 2 * SheetCell.CELL_PADDING;
        const metrics = ctx.measureText(text);
        let location = this.textDrawingLocation(ctx, cellSize, metrics);

        if (metrics.width > availableWidth && this.wrapText) {
            const words = text.split(' ');
            const textHeight = metrics.fontBoundingBoxAscent + metrics.fontBoundingBoxDescent;
            if (words.length > 1) {
                location = this.textDrawingLocation(ctx, cellSize, metrics, words.length);
                
                let yOffset = location.y;
                for (let word of words) {
                    
                    ctx.fillText(word, location.x, location.y + yOffset);
                    yOffset += textHeight;
                }
                return;
            }
        }

        ctx.fillText(text, location.x, location.y);
    }
    
    textDrawingLocation(ctx, cellSize, textMetrics, lineCount = 1)
    {
        const textHeight = lineCount * (textMetrics.fontBoundingBoxAscent + textMetrics.fontBoundingBoxDescent);
        const yOffset = (cellSize.height - SheetCell.CELL_PADDING * 2 - textHeight) / 2 - textMetrics.fontBoundingBoxDescent;
        
        let xOffset = SheetCell.CELL_PADDING;
        switch (this.alignment) {
        case 'left':
            break;
        case 'right':
            xOffset = cellSize.width - SheetCell.CELL_PADDING - textMetrics.width;
            break;
        case 'center':
            xOffset = ((cellSize.width - SheetCell.CELL_PADDING * 2) - textMetrics.width) / 2;
            break;
        }
        
        return new Point(xOffset, -yOffset);
    }
}

class TextSheetCell extends TextDrawingSheetCell {
    constructor(text, fontSize, textStyle, alignment, wrap)
    {
        super(fontSize, textStyle, alignment, wrap);
        this.text = text;
    }

    get textValue()
    {
        return this.text;
    }
}

class ImageSheetCell {
    constructor(image)
    {
        this.image = image;
    }

    draw(ctx, cellSize)
    {
        const insetRect = new Rect(new Point(0, 0), cellSize).inflatedBy(new Size(-SheetCell.CELL_PADDING, -SheetCell.CELL_PADDING));

        const destRect = GeometryHelpers.containRect(
            new Rect(new Point(0, 0), new Size(this.image.width, this.image.height)),
            insetRect
        );

        ctx.drawImage(this.image, destRect.x, -cellSize.height + destRect.y, destRect.width, destRect.height);
    }
}

class NumericSheetCell extends TextDrawingSheetCell {
    constructor(value, fontSize, textStyle, alignment)
    {
        super(fontSize, textStyle, alignment);
        this.value = value;
    }

    get textValue()
    {
        return this.value.toString();
    }
}

class CurrencySheetCell extends TextDrawingSheetCell {
    constructor(value, fontSize, textStyle, alignment)
    {
        super(fontSize, textStyle, alignment);
        this.value = value;
    }

    get textValue()
    {
        const currency = '$';
        return `${currency}${this.value}`;
    }
    
    textDrawingLocation(ctx, cellSize, textMetrics)
    {
        let location = super.textDrawingLocation(ctx, cellSize, textMetrics);

        let leadingWidth = 0;
        const currency = '$';
        const decimalOffset = this.textValue.indexOf('.');
        if (decimalOffset != -1)
            leadingWidth = ctx.measureText(this.textValue.substring(0, decimalOffset)).width;
        
        const zerosMetrics = ctx.measureText('000');
        const textHeight = zerosMetrics.fontBoundingBoxAscent + zerosMetrics.fontBoundingBoxDescent;
        const textStartX = cellSize.width - SheetCell.CELL_PADDING - leadingWidth - zerosMetrics.width;
        
        return new Point(textStartX, location.y);
    }
}

/* -------------------------------------------------------- */

class SheetView {
    static DIVIDER_THICKNESS = 4;

    constructor(stage)
    {
        this.stage = stage;
        
        this.container = document.createElement('section');
        this.container.className = 'sheet';
        
        this.canvas = document.createElement('canvas');
        this.container.appendChild(this.canvas);
        
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

        for (let colInfo of this.stage.columns) {
            const colorAlpha = 0.2;
            const color = Stage.randomRGBColor(colorAlpha);

            const column = new Column(colInfo.title, parseFloat(colInfo.width), color, this.#cellClassFromColumnType(colInfo.type));
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
        
        const headerRowHeight = 50;
        const headerColumnWidth = 50;
        this.headerRow = new Row('', headerRowHeight, 'rgba(0, 0, 100, 0)', TextSheetCell);
        this.headerColumn = new Column('', headerColumnWidth, 'rgba(0, 0, 100, 0)', TextSheetCell);

        this.#createCells(this.rows.length, this.columns.length);

        this.devicePixelRatio = 2;
        this.canvasSize = new Size(integralSize.width * devicePixelRatio, integralSize.height * devicePixelRatio);
        
        this.canvas.width = this.canvasSize.width;
        this.canvas.height = this.canvasSize.height;
        
        const ctx = this.canvas.getContext('2d');

        ctx.fillStyle = 'rgba(255, 255, 255, 1)';
        ctx.fillRect(0, 0, this.canvasSize.width, this.canvasSize.height);

        this.#drawBodyCells(ctx);
        this.#drawHeaders(ctx);
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

                const dataType = plantData[columnData.key];
                let cellData = plantData[columnData.key];
                if (columnData.key === 'image')
                    cellData = this.stage.images[cellData];

                const cell = new column.cellClass(cellData, columnData.fontSize, columnData.textStyle, columnData.alignment, columnData.wraps);
                this.cells[colIndex][rowIndex] = cell;
            }
        }
        
        this.headerRowCells = new Array(columnCount);
        for (let colIndex = 0; colIndex < columnCount; ++colIndex) {
            const columnData = this.stage.columns[colIndex];
            const cell = new TextSheetCell(columnData.title, this.stage.columns[0].fontSize);
            this.headerRowCells[colIndex] = cell;
        }

        this.headerColumnCells = new Array(rowCount);
        for (let rowIndex = 0; rowIndex < rowCount; ++rowIndex) {
            const cell = new TextSheetCell((rowIndex + 1).toString(), this.stage.columns[0].fontSize);
            this.headerColumnCells[rowIndex] = cell;
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
        const scrollXDelta = 1;
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

        this.#drawBodyCells(ctx);
        ctx.restore();
        
        this.#drawHeaders(ctx);
    }
    
    #drawBodyCells(ctx)
    {
        ctx.save();

        ctx.scale(this.devicePixelRatio, this.devicePixelRatio);
        
        ctx.fillStyle = 'rgba(255, 255, 255, 1)';
        ctx.fillRect(0, 0, this.canvasSize.width, this.canvasSize.height);

        ctx.translate(this.headerColumn.width - this.scrollOffset.width, this.headerRow.height - this.scrollOffset.height);
        
        this.#drawGrid(ctx);
        this.#drawCells(ctx);

        ctx.restore();
    }
    
    #drawHeaders(ctx)
    {
        ctx.save();

        ctx.scale(this.devicePixelRatio, this.devicePixelRatio);
        this.#drawHeaderRow(ctx);
        this.#drawHeaderColumn(ctx);
        
        // Just splat a rect over the top left corner.
        const cornerRect = new Rect(new Point(0, 0), new Size(this.headerColumn.width, this.headerRow.height));
        ctx.fillStyle = 'rgba(255, 255, 255, 1)';
        ctx.fillRect(cornerRect.x, cornerRect.y, cornerRect.width, cornerRect.height);

        ctx.strokeStyle = 'rgba(31, 31, 31, 0.133)';
        ctx.lineWidth = 1;
        ctx.strokeRect(cornerRect.x, cornerRect.y, cornerRect.width, cornerRect.height);
        
        // Dividers
        ctx.strokeStyle = 'rgba(220, 220, 220, 1)';
        ctx.lineWidth = SheetView.DIVIDER_THICKNESS;
        ctx.beginPath();
        ctx.moveTo(0, this.headerRow.height);
        ctx.lineTo(this.canvasSize.width, this.headerRow.height);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(this.headerColumn.width, 0);
        ctx.lineTo(this.headerColumn.width, this.canvasSize.height);
        ctx.stroke();

        ctx.restore();
    }

    #drawHeaderRow(ctx)
    {
        let currX = this.headerColumn.width - this.scrollOffset.width;
        const rowHeight = this.headerRow.height;

        const headerRect = new Rect(new Point(0, 0), new Size(this.canvasSize.width, rowHeight));
        ctx.fillStyle = 'rgba(255, 255, 255, 1)';
        ctx.fillRect(headerRect.x, headerRect.y, headerRect.width, headerRect.height);

        const gridPath = new Path2D();

        for (let colIndex = 0; colIndex < this.columns.length; ++colIndex) {
            const col = this.columns[colIndex];

            gridPath.moveTo(currX, 0);
            gridPath.lineTo(currX, rowHeight);
            
            ctx.save();
            
            const cellSize = new Size(col.width, rowHeight);
            const cellRect = new Rect(new Point(currX, rowHeight), cellSize);

            ctx.translate(cellRect.x, cellRect.y);
            const clipPath = new Path2D();
            clipPath.rect(0, -cellRect.height, cellRect.width, cellRect.height);
            ctx.clip(clipPath, 'evenodd');

            const cell = this.headerRowCells[colIndex];
            cell.draw(ctx, cellSize);

            ctx.restore();

            currX += col.width;
        }

        this.#strokeGridPath(ctx, gridPath);
    }

    #drawHeaderColumn(ctx)
    {
        let currY = this.headerRow.height - this.scrollOffset.height;
        const columnWidth = this.headerColumn.width;

        const headerRect = new Rect(new Point(0, 0), new Size(columnWidth, this.canvasSize.height));
        ctx.fillStyle = 'rgba(255, 255, 255, 1)';
        ctx.fillRect(headerRect.x, headerRect.y, headerRect.width, headerRect.height);

        const gridPath = new Path2D();

        for (let rowIndex = 0; rowIndex < this.rows.length; ++rowIndex) {
            const row = this.rows[rowIndex];

            gridPath.moveTo(0, currY);
            gridPath.lineTo(columnWidth, currY);
            
            ctx.save();
            
            const cellSize = new Size(columnWidth, row.height);
            const cellRect = new Rect(new Point(0, currY), cellSize);

            ctx.translate(cellRect.x, cellRect.y);
            const clipPath = new Path2D();
            clipPath.rect(0, -cellRect.height, cellRect.width, cellRect.height);
            ctx.clip(clipPath, 'evenodd');

            const cell = this.headerColumnCells[rowIndex];
            console.log(`header cell ${cell} for row ${rowIndex}`)
            cell.draw(ctx, cellSize);
            
            ctx.restore();

            currY += row.height;
        }

        this.#strokeGridPath(ctx, gridPath);
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

        this.#strokeGridPath(ctx, gridPath);
        ctx.restore();
    }
    
    #strokeGridPath(ctx, path)
    {
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
        ctx.stroke(path);
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
        this.images = { };
        const promises = this.plantList.map((data) => {
            const image = new Image();
            this.images[data.image] = image;
            return new Promise((resolve, reject) => {
                image.onload = () => image.decode().then(() => resolve());
                image.onerror = () => reject(new Error(`Failed to load image: ${data.image}`));
                image.src = data.image;
            });
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
