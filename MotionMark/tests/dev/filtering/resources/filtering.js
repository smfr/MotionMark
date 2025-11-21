
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


class FilteringStage extends Stage {
    constructor()
    {
        super();

       //Pseudo.randomSeed = Date.now();

        this._complexity = 0;
    }

    async initialize(benchmark, options)
    {
        await super.initialize(benchmark, options);
    }

    tune(countDelta)
    {
        if (countDelta == 0)
            return;

        console.log(`tune ${countDelta} - new complexity ${this._complexity + countDelta}`);
        this._complexity += countDelta;
    }

    animate()
    {
    }

    complexity()
    {
        return this._complexity;
    }
}

class FilteringBenchmark extends Benchmark {
    constructor(options)
    {
        super(new FilteringStage(), options);
        
        // setTimeout(() => {
        //     this.stage.tune(5);
        // }, 500);
        //
        // setTimeout(() => {
        //     this.stage.tune(-0);
        // }, 1000);
    }
}

window.benchmarkClass = FilteringBenchmark;

class FakeController {
    constructor()
    {
        this.initialComplexity = 42;
        this.startTime = new Date;
    }

    shouldStop()
    {
        const now = new Date();
        return (now - this.startTime) > 50000;
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
