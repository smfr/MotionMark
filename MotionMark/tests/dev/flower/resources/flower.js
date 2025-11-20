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


// FIXME: Share
class Size {
    static zero = new Size(0, 0);

    constructor(width, height)
    {
        this.width = width;
        this.height = height;
    }

    clone()
    {
        return new Point(this.width, this.height);
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


class TreeNode {
    constructor(parentNode)
    {
        this.parentNode = parentNode;
    }
}

// A non-leaf node. This always has 4 children, either other nodes, or leaves (possibly mixed).
class ContainerNode extends TreeNode {
    constructor(parentNode, containerElement, depth)
    {
        super(parentNode);
        
        this.depth = depth;
        this.containerElement = containerElement;
        this.element = containerElement.ownerDocument.createElement('div');
        this.element.className = 'node';
        
        this.containerElement.appendChild(this.element);
        this.children = new Array(FractalLayoutController.MAX_CHILDREN_PER_NODE);
    }
    
    addChildInRandomEmptySlot(node)
    {
        const emptyChildIndex = this.#findRandomEmptyChildIndex();
        if (emptyChildIndex === -1)
            return false;

        node.parentNode = this;
        this.children[emptyChildIndex] = node;
        this.element.appendChild(node.element);
        this.#setGridPositionForIndex(emptyChildIndex, node.element);
        return true;
    }
    
    setChildAtIndex(index, node)
    {
        node.parentNode = this;
        this.children[index] = node;
        this.element.appendChild(node.element);
        this.#setGridPositionForIndex(index, node.element);
    }

    removeChildNode(node)
    {
        const index = this.children.indexOf(node);
        if (index === -1)
            throw new TypeError('Tried to remove a node which is not a child');

        this.removeChildAtIndex(index);
    }
    
    removeChildAtIndex(index)
    {
        const childNode = this.children[index];
        childNode.parentNode = null;
        childNode.element.remove();
        delete this.children[index];
    }
    
    get childCount()
    {
        return this.children.reduce(c => c + 1, 0);
    }
    
    get containerChildren()
    {
        const children = [];
        this.children.reduce((c, node) => {
            if (node instanceof ContainerNode)
                children.push(node);
        }, 0);
        return children;
    }
    
    hasAllLeafChildren()
    {
        return this.children.reduce((count, node) => {
            return (node instanceof LeafNode) ? count + 1 : count;
        }, 0) === FractalLayoutController.MAX_CHILDREN_PER_NODE;
    }

    findRandomContainerChildIndex()
    {
        const containerChildIndexes = this.containerChildIndices;
        return containerChildIndexes[Stage.randomInt(0, containerChildIndexes.length - 1)];
    }
    
    get containerChildIndices()
    {
        const containerChildIndexes = [];
        
        for (let i = 0; i < this.children.length; ++i) {
            if (this.children[i] instanceof ContainerNode)
                containerChildIndexes.push(i);
        }
        
        return containerChildIndexes;
    }

    #findRandomEmptyChildIndex()
    {
        const emptyChildIndexes = [];
        
        for (let i = 0; i < this.children.length; ++i) {
            if (this.children[i] === undefined)
                emptyChildIndexes.push(i);
        }
        
        if (emptyChildIndexes.length === 0)
            return -1;
        
        return emptyChildIndexes[Stage.randomInt(0, emptyChildIndexes.length - 1)];
    }

    findRandomLeafChildIndex()
    {
        const leafChildIndexes = [];
        
        for (let i = 0; i < this.children.length; ++i) {
            if (this.children[i] instanceof LeafNode)
                leafChildIndexes.push(i);
        }
        
        if (leafChildIndexes.length === 0)
            return -1;
        
        return leafChildIndexes[Stage.randomInt(0, leafChildIndexes.length - 1)];
    }
    
    #setGridPositionForIndex(index, element)
    {
        switch (index) {
        case 0:
            element.style.gridRow = 1;
            element.style.gridColumn = 1;
            break;
        case 1:
            element.style.gridRow = 1;
            element.style.gridColumn = 2;
            break;
        case 2:
            element.style.gridRow = 2;
            element.style.gridColumn = 1;
            break;
        case 3:
            element.style.gridRow = 2;
            element.style.gridColumn = 2;
            break;
        }
    }    
}


class LeafNode extends TreeNode {
    constructor(parentNode)
    {
        super(parentNode);
        this.element = document.createElement('div');
        this.element.className = 'leaf';
    }   
}


class LayoutController {
    constructor(container, stageSize)
    {
        this._container = container;
        this._stageSize = stageSize;
    }
    
    arrangeItems()
    {
    }
}

class FractalLayoutController extends LayoutController {
    static MAX_CHILDREN_PER_NODE = 4;

    constructor(container, stageSize)
    {
        super(container, stageSize);
        this._container = container;
        this._stageSize = stageSize;
        this._rootNode = new ContainerNode(null, container, 0);

        // Keep track of leaf nodes at each depth level. The lists aren't sorted.
        this.leafNodes = new Array();
    }
    
    arrangeItems(countDelta)
    {
        if (countDelta > 0)
            this.#addNodes(countDelta);
        else if (countDelta < 0)
            this.#removeNodes(Math.abs(countDelta));
    }

    #addNodes(count)
    {
        for (let i = 0; i < count; ++i)
            this.#insertLeafNode(new LeafNode());
    }
    
    #removeNodes(count)
    {
        for (let i = 0; i < count; ++i)
            this.#removeLeafNode();
    }
    
    #ensureLeafSetForDepth(depth)
    {
        while (this.leafNodes.length <= depth)
            this.leafNodes.push(new Set());
    }

    #leafWillBeRemoved(leafNode)
    {
        const depth = leafNode.parentNode.depth;
        this.#ensureLeafSetForDepth(depth);
        this.leafNodes[depth].delete(leafNode);
    }

    #leafWasAdded(leafNode)
    {
        const depth = leafNode.parentNode.depth;
        this.#ensureLeafSetForDepth(depth);
        this.leafNodes[depth].add(leafNode);
    }
    
    #insertLeafNode(leafNode)
    {
        // First try to find the lowest hole in the tree.
        let container = this.#containerWithHole(this._rootNode);
        if (container) {
            container.addChildInRandomEmptySlot(leafNode);
            leafNode.element.textContent = `${container.depth}`;
            this.#leafWasAdded(leafNode);
            return;
        }
        
        // Find the lowest leaf.
        const leafSlot = this.#findLeafBreadthFirst(this._rootNode);
        if (leafSlot) {
            const { parent, index } = leafSlot;
            const oldLeaf = parent.children[index];
        
            if (!(oldLeaf instanceof LeafNode))
                throw new TypeError('Old leaf node should be a LeafNode');

            const newContainer = new ContainerNode(parent, parent.element, parent.depth + 1);
            parent.children[index] = newContainer;

            this.#leafWillBeRemoved(oldLeaf);
            newContainer.addChildInRandomEmptySlot(oldLeaf);
            this.#leafWasAdded(oldLeaf);
            oldLeaf.element.textContent = `${newContainer.depth}`;

            newContainer.addChildInRandomEmptySlot(leafNode);
            this.#leafWasAdded(leafNode);
            leafNode.element.textContent = `${newContainer.depth}`;
            return;
        }

        throw new TypeError('Failed to find insertion point for leaf node');
    }
    
    #deepestLeafNodeSet()
    {
        for (let i = this.leafNodes.length - 1; i >= 0; --i) {
            if (this.leafNodes[i].size > 0)
                return this.leafNodes[i];
        }
        return null;
    }

    #removeLeafNode()
    {
        const targetSet = this.#deepestLeafNodeSet();
        if (!targetSet)
            return;

        // Set doesn't have `any`, which would be handy here. For now, remove any, but we may want to bias towards the most
        // recently added.
        const targetIndex = Stage.randomInt(0, targetSet.size - 1);
        const leafToRemove = [...targetSet][targetIndex];
        const container = leafToRemove.parentNode;
        this.#leafWillBeRemoved(leafToRemove);
        leafToRemove.parentNode.removeChildNode(leafToRemove);
        
        this.#removeEmptyContainers(container);
    }
    
    #removeEmptyContainers(containerNode)
    {
        while (containerNode.childCount === 0) {
            const nextContainer = containerNode.parentNode;
            if (!nextContainer)
                break;
            
            nextContainer.removeChildNode(containerNode);
            containerNode = nextContainer;
        }
    }

    #findLeafBreadthFirst(currNode)
    {
        function findLeafChild(currNode)
        {
            const leafIndex = currNode.findRandomLeafChildIndex();
            if (leafIndex !== -1)
                return { parent: currNode, index: leafIndex };

            return undefined;
        }
        
        let queue = [];
        queue.push(currNode);

        while (queue.length) {
            const testNode = queue.shift();
            
            const leafInfo = findLeafChild(testNode);
            if (leafInfo)
                return leafInfo;

            queue.push(...testNode.containerChildren);
        }
        
        return undefined;
    }

    #containerWithHole(currNode)
    {
        if (currNode.childCount < FractalLayoutController.MAX_CHILDREN_PER_NODE)
            return currNode;

        // Make this breadth first
        for (let child of currNode.children) {
            if (!(child instanceof ContainerNode))
                continue;

            const found = this.#containerWithHole(child);
            if (found)
                return found;
        }
        return null;
    }
}

class FlowerStage extends Stage {
    constructor()
    {
        super();

       Pseudo.randomSeed = Date.now();

        this._complexity = 0;
        this._items = [];
    }

    async initialize(benchmark, options)
    {
        await super.initialize(benchmark, options);
        
        this.container = document.getElementById('container');
        const stageRect = this.container.getBoundingClientRect();
        
        this.layout = new FractalLayoutController(this.container, new Size(stageRect.width, stageRect.height));
    }

    tune(countDelta)
    {
        if (countDelta == 0)
            return;

        console.log(`tune ${countDelta} - new complexity ${this._complexity + countDelta}`);
        this.layout.arrangeItems(countDelta);
        this._complexity += countDelta;
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
}

class FlowerBenchmark extends Benchmark {
    constructor(options)
    {
        super(new FlowerStage(), options);
        
        setTimeout(() => {
            this.stage.tune(2);
        }, 500);

        setTimeout(() => {
            this.stage.tune(-0);
        }, 1000);
    }
}

window.benchmarkClass = FlowerBenchmark;

class FakeController {
    constructor()
    {
        this.initialComplexity = 0;
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
