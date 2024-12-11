import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Loader2 } from "lucide-react"; // Import loading icon
const DBSCAN = require('density-clustering').DBSCAN;

interface DataItem {
    id: string;
    trigger: string;
    thought: string;
    response: string;
    trigger_embedding: number[] | string;
    thought_embedding: number[] | string;
    response_embedding: number[] | string;
}

interface Node {
    id: string;
    x: number;
    y: number;
    fx: number;
    fy: number;
    type: string;
    cluster: number;
    clusterColor: string;
    content: string;
    radius: number;
}

interface Link {
    source: Node;
    target: Node;
}

const ClusteringGraph = () => {
    const svgRef = useRef<SVGSVGElement>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Helper function to generate colors for different clusters
    const getClusterColor = (index: number): string => {
        const colors = [
            '#ff7f7f', '#7fbfff', '#7fff7f', '#ff7fff',
            '#ffbf7f', '#7fffff', '#bf7fff', '#ffff7f'
        ];
        return colors[index % colors.length];
    };

    // Create a map to store cluster colors
    const clusterColorMap = new Map();
    let colorIndex = 0;

    // Function to get or assign cluster color
    const getOrAssignClusterColor = (type: string, clusterId: number) => {
        const key = `${type}-${clusterId}`;
        if (!clusterColorMap.has(key)) {
            clusterColorMap.set(key, getClusterColor(colorIndex++));
        }
        return clusterColorMap.get(key);
    };

    useEffect(() => {
        const fetchDataAndCluster = async () => {
            setIsLoading(true);
            try {
                const response = await fetch('/api/get-embeddings');
                const data = await response.json();

                // Separate and normalize embeddings (using the same normalization code)
                const normalizeEmbeddings = (embeddings: (number[] | string)[]): number[][] => {
                    return embeddings.map((embedding: number[] | string) => {
                        let embeddingArray: number[];
                        if (typeof embedding === 'string') {
                            try {
                                embeddingArray = JSON.parse(embedding);
                            } catch (e) {
                                console.error('Failed to parse embedding string:', e);
                                return [];
                            }
                        } else if (embedding && (embedding as any).embedding) {
                            embeddingArray = (embedding as any).embedding;
                        } else if (Array.isArray(embedding)) {
                            embeddingArray = embedding;
                        } else {
                            embeddingArray = Object.values(embedding as Record<string, number>);
                        }

                        if (!embeddingArray.every((val: any): val is number => typeof val === 'number')) {
                            console.error('Invalid embedding format:', embedding);
                            return embeddingArray;
                        }

                        const magnitude = Math.sqrt(
                            embeddingArray.reduce((sum: number, val: number) => sum + (val * val), 0)
                        );

                        return magnitude === 0 ? embeddingArray : embeddingArray.map(val => val / magnitude);
                    });
                };

                const triggerEmbeddings = normalizeEmbeddings(data.map((item: DataItem) => item.trigger_embedding));
                const thoughtEmbeddings = normalizeEmbeddings(data.map((item: DataItem) => item.thought_embedding));
                const responseEmbeddings = normalizeEmbeddings(data.map((item: DataItem) => item.response_embedding));

                // Perform DBSCAN clustering with adjusted parameters
                const dbscan = new DBSCAN();
                const eps = 0.9;  // Increased epsilon since our similarities are between 0.5-0.9
                const minPts = 1; // At least one point (will create individual clusters if needed)

                const triggerClusters = dbscan.run(triggerEmbeddings, eps, minPts);
                const thoughtClusters = dbscan.run(thoughtEmbeddings, eps, minPts);
                const responseClusters = dbscan.run(responseEmbeddings, eps, minPts);

                // Handle noise points (points that don't belong to any cluster)
                const handleNoisyPoints = (clusters: number[][], totalPoints: number): number[][] => {
                    const assignedPoints = new Set(clusters.flat());
                    const noisePoints: number[][] = [];

                    // Find points that aren't in any cluster
                    for (let i = 0; i < totalPoints; i++) {
                        if (!assignedPoints.has(i)) {
                            noisePoints.push([i]); // Create individual clusters for noise points
                        }
                    }

                    return [...clusters, ...noisePoints];
                };

                // Ensure all points are assigned to clusters
                const processedTriggerClusters = handleNoisyPoints(triggerClusters, triggerEmbeddings.length);
                const processedThoughtClusters = handleNoisyPoints(thoughtClusters, thoughtEmbeddings.length);
                const processedResponseClusters = handleNoisyPoints(responseClusters, responseEmbeddings.length);

                // Debug logging
                console.log('Processed Trigger Clusters:', processedTriggerClusters);
                console.log('Processed Thought Clusters:', processedThoughtClusters);
                console.log('Processed Response Clusters:', processedResponseClusters);

                // Helper function to calculate cosine similarity between two embeddings
                const cosineSimilarity = (embedding1: number[], embedding2: number[]): number => {
                    const dotProduct = embedding1.reduce((sum, a, i) => sum + a * embedding2[i], 0);
                    const magnitude1 = Math.sqrt(embedding1.reduce((sum, a) => sum + a * a, 0));
                    const magnitude2 = Math.sqrt(embedding2.reduce((sum, a) => sum + a * a, 0));
                    return dotProduct / (magnitude1 * magnitude2);
                };

                // Debug log similarities between responses
                responseEmbeddings.forEach((embedding1, i) => {
                    responseEmbeddings.forEach((embedding2, j) => {
                        if (i < j) {
                            const similarity = cosineSimilarity(embedding1, embedding2);
                            console.log(`Similarity between response ${i} and ${j}:`, similarity);
                            console.log('Response 1:', data[i].response);
                            console.log('Response 2:', data[j].response);
                        }
                    });
                });

                // D3 visualization setup
                const width = 1200;
                const height = 800;
                const svg = d3.select(svgRef.current)
                    .attr('width', width)
                    .attr('height', height);

                // Clear previous content
                svg.selectAll('*').remove();

                // Create graph data structure
                const nodes: Node[] = [];
                const links: Link[] = [];

                // Constants for positioning
                const TRIGGER_X = 200;
                const THOUGHT_X = 600;
                const RESPONSE_X = 1000;
                const VERTICAL_SPACING = 100;

                // Modify addNodesForType to better control node positioning
                const addNodesForType = (
                    clusters: number[][],
                    xPosition: number,
                    type: string,
                    clusterOffset: number
                ): void => {
                    if (!clusters.length) {
                        console.warn(`No clusters found for ${type}`);
                        return;
                    }

                    clusters.forEach((cluster, clusterIndex) => {
                        const clusterColor = getOrAssignClusterColor(type, clusterIndex);
                        const yOffset = (height / (clusters.length + 1)) * (clusterIndex + 1);

                        // Calculate cluster dimensions based on number of nodes
                        const clusterHeight = cluster.length * 40 + 60;
                        const clusterY = yOffset - clusterHeight / 2;

                        // Add cluster background
                        svg.append('rect')
                            .attr('x', xPosition - 100)
                            .attr('y', clusterY)
                            .attr('width', 200)
                            .attr('height', clusterHeight)
                            .attr('fill', clusterColor)
                            .attr('opacity', 0.2)
                            .attr('rx', 10)
                            .attr('ry', 10);

                        // Position nodes within cluster bounds
                        cluster.forEach((nodeIndex, idx) => {
                            const item = data[nodeIndex];
                            if (!item) {
                                console.warn(`No data found for index ${nodeIndex} in ${type}`);
                                return;
                            }

                            // Calculate fixed y position within cluster
                            const nodeY = clusterY + 40 + (idx * 40); // 40px spacing between nodes

                            nodes.push({
                                id: `${type}-${item.id}`,
                                x: xPosition,
                                y: nodeY,
                                fx: xPosition, // Fix x position
                                fy: nodeY,    // Fix y position
                                type,
                                cluster: clusterIndex,
                                clusterColor: clusterColor,
                                content: item[type.toLowerCase()] || 'Unknown content',
                                radius: 15
                            });
                        });
                    });
                };

                // Create nodes for each type using processed clusters
                addNodesForType(processedTriggerClusters, TRIGGER_X, 'Trigger', 0);
                addNodesForType(processedThoughtClusters, THOUGHT_X, 'Thought', processedTriggerClusters.length);
                addNodesForType(processedResponseClusters, RESPONSE_X, 'Response', processedTriggerClusters.length + processedThoughtClusters.length);

                // Create links between nodes
                data.forEach((item: DataItem) => {
                    links.push({
                        source: nodes.find(n => n.id === `Trigger-${item.id}`)!,
                        target: nodes.find(n => n.id === `Thought-${item.id}`)!,
                    });
                    links.push({
                        source: nodes.find(n => n.id === `Thought-${item.id}`)!,
                        target: nodes.find(n => n.id === `Response-${item.id}`)!,
                    });
                });

                // Modify the force simulation to respect fixed positions
                const simulation = d3.forceSimulation<Node>(nodes)
                    .force('link', d3.forceLink<Node, Link>(links).id(d => d.id).distance(300))
                    .force('charge', d3.forceManyBody().strength(-50))
                    .force('collision', d3.forceCollide().radius(20));

                // Create container group for all elements
                const container = svg.append('g')
                    .attr('class', 'zoom-container');

                // Draw links in the container
                const link = container.append('g')
                    .attr('class', 'links')
                    .selectAll<SVGLineElement, Link>('line')
                    .data(links)
                    .join('line')
                    .attr('stroke', (d: Link) => (d.source as Node).clusterColor)
                    .attr('stroke-width', 2)
                    .attr('stroke-opacity', 0.6);

                // Draw nodes in the container
                const node = container.append('g')
                    .attr('class', 'nodes')
                    .selectAll<SVGGElement, Node>('g')
                    .data(nodes)
                    .join('g');

                // Add circles for nodes
                node.append('circle')
                    .attr('r', d => d.radius)
                    .attr('fill', 'white')
                    .attr('stroke', d => d.clusterColor)
                    .attr('stroke-width', 2);

                // Add labels
                node.append('text')
                    .text(d => d.content.substring(0, 20) + '...')
                    .attr('x', 0)
                    .attr('y', 0)
                    .attr('text-anchor', 'middle')
                    .attr('dominant-baseline', 'middle')
                    .attr('font-size', '10px')
                    .attr('fill', '#333');

                // Add tooltips
                node.append('title')
                    .text(d => d.content);

                // Update positions on simulation tick
                simulation.on('tick', () => {
                    link
                        .attr('x1', d => d.source.x)
                        .attr('y1', d => d.source.y)
                        .attr('x2', d => d.target.x)
                        .attr('y2', d => d.target.y);

                    node.attr('transform', d => `translate(${d.x},${d.y})`);
                });

                setIsLoading(false);
            } catch (error) {
                console.error('Error fetching and processing data:', error);
                setIsLoading(false);
            }
        };

        fetchDataAndCluster();
    }, []);

    return (
        <div>
            <div className="mb-4 text-center">
                <h2 className="text-2xl font-bold text-gray-800">Client Daily Logs - Clustering Analysis</h2>
                <p className="text-sm text-gray-600 mt-2">
                    Visualization of client logs grouped by similarity: Triggers (left) → Thoughts (middle) → Responses (right)
                </p>
            </div>
            <div style={{ width: '100%', height: '800px', border: '1px solid #ccc' }} className="relative">
                {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-80 z-10">
                        <div className="text-center">
                            <Loader2 className="h-8 w-8 animate-spin text-gray-500 mx-auto" />
                            <p className="mt-2 text-sm text-gray-600">Processing data...</p>
                        </div>
                    </div>
                )}
                <svg ref={svgRef} style={{ width: '100%', height: '100%' }}></svg>
            </div>
        </div>
    );
};

export default ClusteringGraph;