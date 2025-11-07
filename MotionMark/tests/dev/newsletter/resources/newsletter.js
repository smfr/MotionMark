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
        this.heading = this.#createElement('h1', 'heading', 'Heading 123');
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
        this._approximateItemSize = item.measureSize()
        item.remove();
    }

    tune(count)
    {
        if (count == 0)
            return;
        
        if (count < this._complexity) {

            let itemsToRemove = this._items.slice(count);
            itemsToRemove.forEach((item) => item.remove());

        } else if (count > this._complexity) {
            
            for (let itemCount = this._complexity; itemCount < count; ++itemCount) {
                const item = new Item(this.container);
                this.#randomlyPlaceElement(item.section, this._stageRect, this._approximateItemSize);
                this._items.push(item);
            }
        }

        this._complexity = count;
    }

    animate()
    {
        this._items.forEach((item) => {
            item.heading.style.left = parseInt(item.heading.style.left) + 'px';
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

    #randomlyPlaceElement(element, stageRect, elementSize)
    {
        // Choose a position that keeps the element mostly on-screen; 80% of the height and width have to be visible.
        const fractionVisible = 0.8;
        const allowedMinXClip = (1 - fractionVisible) * elementSize.width;
        const allowedMinYClip = (1 - fractionVisible) * elementSize.height;
        const allowedMaxXClip = fractionVisible * elementSize.width;
        const allowedMaxYClip = fractionVisible * elementSize.height;

        const x = Stage.randomInt(-allowedMinXClip, stageRect.width - allowedMaxXClip);
        const y = Stage.randomInt(-allowedMinYClip, stageRect.height - allowedMaxYClip);
        
        element.style.left = `${x}px`;
        element.style.top = `${y}px`;
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
        this.initialComplexity = 1;
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

    var benchmark = new window.benchmarkClass({ });
    benchmark._controller = new FakeController();
    await benchmark.initialize({ });

    benchmark.run().then(function(testData) {

    });

}, false);
