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

class FanLayout3D extends ItemLayout {
    constructor(container, itemSize, stageSize)
    {
        super(container, itemSize, stageSize);
        this._container.classList.add('layout-fan');
    }

    arrangeItems()
    {
        const itemCount = this._container.children.length;
        const startAngle = -80;
        const endAngle = 80;
        const angleIncrement = (endAngle - startAngle) / (itemCount - 1);
        
        for (let i = 0; i < this._container.children.length; ++ i) {
            const child = this._container.children[i];
            child.style.transform = `rotate3d(0, 1, 0, ${startAngle + angleIncrement * i}deg) translateZ(-50vw)`;
        }
    }
}

class Grid2DLayout extends ItemLayout {
    constructor(container, itemSize, stageSize)
    {
        super(container, itemSize, stageSize);
        this._container.classList.add('grid-2d');
    }

    arrangeItems()
    {
        const itemCount = this._container.children.length;

        const aspectRatio = this._stageSize.width / this._stageSize.height;

        const columnCount = Math.ceil(Math.sqrt(itemCount * aspectRatio));
        const rowCount = Math.ceil(itemCount / columnCount);
        
        const cellSize = new Size(this._stageSize.width / columnCount, this._stageSize.height / rowCount);
        const scale = Math.min(cellSize.width / this._itemSize.width, cellSize.height / this._itemSize.height);
        
        for (let i = 0; i < this._container.children.length; ++ i) {
            const child = this._container.children[i];

            const row = Math.floor(i / columnCount);
            const col = i % columnCount;

            child.style.translate = `${col * cellSize.width}px ${row * cellSize.height}px`;
            child.style.scale = scale;
        }
    }
}

class PictureWallLayout3D extends ItemLayout {
    constructor(container, itemSize, stageSize)
    {
        super(container, itemSize, stageSize);
        this._container.classList.add('picture-wall');
    }

    arrangeItems()
    {
        const itemCount = this._container.children.length;

        const aspectRatio = this._stageSize.width / this._stageSize.height;

        const columnCount = Math.ceil(Math.sqrt(itemCount * aspectRatio));
        const rowCount = Math.ceil(itemCount / columnCount);
        
        const cellSize = new Size(this._stageSize.width / columnCount, this._stageSize.height / rowCount);
        const scale = Math.min(cellSize.width / this._itemSize.width, cellSize.height / this._itemSize.height);

        const startAngle = 60;
        const endAngle = -60;
        const angleIncrement = (endAngle - startAngle) / (columnCount - 1);

        for (let i = 0; i < this._container.children.length; ++ i) {
            const child = this._container.children[i];

            const row = Math.floor(i / columnCount);
            const col = i % columnCount;

            child.style.transform = `translate(0, ${row * cellSize.height}px) rotate3d(0, 1, 0, ${startAngle + angleIncrement * col}deg) translateZ(-50vw) scale(${scale})`;
        }
    }
}

class ZStackLayout3D extends ItemLayout {
    constructor(container, itemSize, stageSize)
    {
        super(container, itemSize, stageSize);
        this._container.classList.add('z-stack');
    }

    arrangeItems()
    {
        const itemCount = this._container.children.length;

        const closeZ = 0;
        const distantZ = 2000;
        const zIncrement = (closeZ - distantZ) / (itemCount - 1);

        const xSpace = (this._stageSize.width - this._itemSize.width) / 2;
        const minX = -xSpace;
        const maxX = xSpace;
        const xIncrement = (maxX - minX) / (itemCount - 1);

        const ySpace = (this._stageSize.height - this._itemSize.height) / 2;
        const minY = -ySpace;
        const maxY = ySpace;
        const yIncrement = (maxY - minY) / (itemCount - 1);
        
        for (let i = 0; i < this._container.children.length; ++ i) {
            const child = this._container.children[i];
            child.style.transform = `translate(${minX + i * xIncrement}px, ${minY + i * yIncrement}px) rotate3d(0, 1, 0, -4deg) translateZ(${closeZ + i * zIncrement}px)`;
        }
    }
}

/* ------------------------------------------------------------ */

class Item {
    constructor(container)
    {
        this.#createElements(container);
    }
    
    remove()
    {
        this.section.remove();
    }
    
    measureSize(container)
    {
        const bounds = this.section.getBoundingClientRect();
        return new Size(bounds.width, bounds.height);
    }

    #createElements(container)
    {
        const loremIpsum = 'Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.'

        this.section = this.#createElement('section', 'item');
        this.heading = this.#createElement('h1', 'heading', 'Lorem ipsum dolor sit amet');
        this.bodyText = this.#createElement('p', 'body-text', loremIpsum);
        this.marqueeContainer = this.#createElement('div', 'marquee-container');
        
        const marqeeLine1 = this.#createElement('div', 'line', loremIpsum);
        const marqeeLine2 = this.#createElement('div', 'line', loremIpsum);
        
        this.#colorizeWords(marqeeLine1);
        this.#colorizeWords(marqeeLine2);

        this.marqueeContainer.appendChild(marqeeLine1);
        this.marqueeContainer.appendChild(marqeeLine2);
        
        this.section.appendChild(this.heading);
        this.section.appendChild(this.bodyText);
        this.section.appendChild(this.marqueeContainer);
        
        container.appendChild(this.section);
    }

    #createElement(tagName, className, textContent)
    {
        const element = document.createElement(tagName);
        element.className = className;
        if (textContent)
            element.textContent = textContent;
        return element;
    }

    #colorizeWords(container)
    {
        const segmenter = new Intl.Segmenter([], { granularity: 'word' });
        const segmentedText = segmenter.segment(container.textContent);
        const words = [...segmentedText].filter(s => s.isWordLike).map(s => s.segment);

        container.textContent = '';
        for (let word of words) {
            const span = document.createElement('span');
            span.textContent = word;
            container.appendChild(span);
            container.appendChild(document.createTextNode(' '));
        }
    }
}

class NewsletterStage extends Stage {
    constructor()
    {
        super();

        Pseudo.randomSeed = Date.now();
        this.container = document.getElementById('container');
        this.container.innerText = '';

        this._complexity = 0;
        this._items = [];
    }

    async initialize(benchmark, options)
    {
        await super.initialize(benchmark, options);

        const stageRect = this.element.getBoundingClientRect();
        this._stageRect = new Rect(Point.zero, new Size(stageRect.width, stageRect.height));
        
        const item = new Item(this.container);
        const approximateItemSize = item.measureSize()
        item.remove();

        this.layout = new PictureWallLayout3D(this.container, approximateItemSize, new Size(stageRect.width, stageRect.height));
    }

    tune(count)
    {
        if (count == 0)
            return;

        const newComplexity = this._complexity + count;
        if (newComplexity < this._complexity) {

            let itemsToRemove = this._items.splice(newComplexity);
            itemsToRemove.forEach((item) => item.remove());

        } else if (newComplexity > this._complexity) {
            
            for (let itemCount = this._complexity; itemCount < newComplexity; ++itemCount) {
                const item = new Item(this.container);
                this._items.push(item);
            }
        }

        this._complexity = newComplexity;
        this.layout.arrangeItems();
    }

    animate()
    {
        this._items.forEach((item) => {
            // item.section.style.left = parseInt(item.section.style.left) + 1 + 'px';
        });
    }

    complexity()
    {
        return this._complexity;
    }
    
    #createHeading(textContent)
    {
        const heading = document.createElement('h1');
        heading.className = 'heading';
        heading.textContent = textContent;
        return heading;
    }
}

class NewsletterBenchmark extends Benchmark {
    constructor(options)
    {
        super(new NewsletterStage(), options);
    }
}

window.benchmarkClass = NewsletterBenchmark;

class FakeController {
    constructor()
    {
        this.initialComplexity = 20;
        this.startTime = new Date;
    }

    shouldStop()
    {
        const now = new Date();
        return (now - this.startTime) > 1500;
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

    const benchmark = new window.benchmarkClass({ });
    benchmark._controller = new FakeController();
    await benchmark.initialize({ });

    benchmark.run().then(function(testData) {
        
    });

}, false);
