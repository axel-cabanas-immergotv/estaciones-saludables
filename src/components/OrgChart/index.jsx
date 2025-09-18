import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import './OrgChart.css';

const OrgChart = ({ data, width = 800, height = 500 }) => {
    const svgRef = useRef(null);
    const [chartData, setChartData] = useState(null);
    const [zoomLevel, setZoomLevel] = useState(1);

    useEffect(() => {
        if (data && svgRef.current) {
            renderOrgChart(data);
        }
    }, [data, width, height]);

    const renderOrgChart = (hierarchyData) => {
        if (!hierarchyData) return;

        const svg = d3.select(svgRef.current);
        svg.selectAll("*").remove();

        // Configuración de nodos
        const nodeWidth = 180;
        const nodeHeight = 80;

        // Crear SVG
        const chartSvg = svg
            .attr('viewBox', `0 0 ${width} ${height}`)
            .attr('preserveAspectRatio', 'xMidYMid meet')
            .attr('class', 'd3-orgchart')
            .style('cursor', 'grab');

        // Crear grupo para zoom/pan
        const g = chartSvg.append('g');

        // Fondo para capturar eventos de pan/zoom
        chartSvg.append('rect')
            .attr('width', width)
            .attr('height', height)
            .attr('fill', 'transparent')
            .style('pointer-events', 'all');

        // Zoom y pan
        const zoom = d3.zoom()
            .scaleExtent([0.1, 3])
            .on('start', () => {
                chartSvg.style('cursor', 'grabbing');
            })
            .on('zoom', (event) => {
                g.attr('transform', event.transform);
                setZoomLevel(event.transform.k);
            })
            .on('end', () => {
                chartSvg.style('cursor', 'grab');
            });

        chartSvg.call(zoom);
        chartSvg.on('dblclick.zoom', null); // desactivar zoom con doble click

        // Crear layout de árbol
        const tree = d3.tree()
            .nodeSize([nodeWidth + 50, nodeHeight + 60])
            .separation((a, b) => (a.parent === b.parent ? 1 : 1.2));

        // Jerarquía de datos
        const root = d3.hierarchy(hierarchyData);
        tree(root);

        // Datos de nodos y enlaces
        const nodes = root.descendants();
        const links = root.links();

        // 📌 Centrar el nodo raíz (Yo) en el medio del ancho
        const rootX = root.x;
        const centerX = width / 2 - rootX;
        const centerY = 60;

        // 📌 Inicializar el zoom con el transform inicial
        const initialTransform = d3.zoomIdentity.translate(centerX, centerY);
        chartSvg.call(zoom.transform, initialTransform);

        // g.attr('transform', `translate(${centerX}, ${centerY})`);

        // Enlaces
        g.selectAll('.d3-link')
            .data(links)
            .enter().append('path')
            .attr('class', 'd3-link')
            .attr('d', d => {
                const sourceX = d.source.x;
                const sourceY = d.source.y + nodeHeight;
                const targetX = d.target.x;
                const targetY = d.target.y;

                return `M${sourceX},${sourceY}
                       C${sourceX},${(sourceY + targetY) / 2}
                       ${targetX},${(sourceY + targetY) / 2}
                       ${targetX},${targetY}`;
            });

        // Grupos de nodos
        const nodeGroups = g.selectAll('.d3-node')
            .data(nodes)
            .enter().append('g')
            .attr('class', d => `d3-node ${d.data.nodeType}-node`)
            .attr('transform', d => `translate(${d.x - nodeWidth / 2}, ${d.y})`)
            .style('pointer-events', 'all');

        // Rectángulo del nodo
        nodeGroups.append('rect')
            .attr('class', 'd3-node-rect')
            .attr('width', nodeWidth)
            .attr('height', nodeHeight)
            .attr('rx', 8)
            .attr('ry', 8);

        // Nombre
        nodeGroups.append('text')
            .attr('class', 'd3-node-name')
            .attr('x', nodeWidth / 2)
            .attr('y', 25)
            .text(d => d.data.name);

        // Rol
        nodeGroups.append('text')
            .attr('class', 'd3-node-role')
            .attr('x', nodeWidth / 2)
            .attr('y', 42)
            .text(d => d.data.role);

        // Asignación
        nodeGroups.filter(d => d.data.assignment)
            .append('text')
            .attr('class', 'd3-node-assignment')
            .attr('x', nodeWidth / 2)
            .attr('y', 58)
            .text(d => d.data.assignment);

        // Botones expandir (si hay hijos no cargados)
        const expandableNodes = nodeGroups.filter(d => d.data.hasUnloadedChildren);

        const expandButtons = expandableNodes.append('g')
            .attr('class', 'd3-expand-btn')
            .attr('transform', `translate(${nodeWidth / 2}, ${nodeHeight + 15})`)
            .style('cursor', 'pointer');

        expandButtons.on('click', (event, d) => {
            event.stopPropagation();
            console.log('Expand button clicked for node:', d.data.id);
            if (d.data.hasUnloadedChildren) {
                console.log('Loading children for node:', d.data.userId);
            }
        });

        setChartData({ svg: chartSvg, g, tree, root, centerX, centerY, nodeWidth, nodeHeight, zoom });
    };

    if (!data) {
        return (
            <div className="org-chart-container">
                <div className="org-chart-placeholder">
                    <p>No hay datos disponibles para mostrar el organigrama</p>
                </div>
            </div>
        );
    }

    return (
        <div className="org-chart-container">            
            <div className="org-chart-wrapper">
                {/* SVG responsive */}
                <svg ref={svgRef} className="org-chart-svg" style={{ width: "100%", height: "auto" }}></svg>
            </div>
            
            {/* Leyenda */}
            <div className="org-chart-legend">
                <h4 className="legend-title">Leyenda del Organigrama</h4>
                <div className="legend-items">
                    <div className="legend-item">
                        <div className="legend-color current-node-color"></div>
                        <span className="legend-label">Yo</span>
                    </div>
                    <div className="legend-item">
                        <div className="legend-color superior-node-color"></div>
                        <span className="legend-label">Superior</span>
                    </div>
                    <div className="legend-item">
                        <div className="legend-color subordinate-node-color"></div>
                        <span className="legend-label">Colaboradores</span>
                    </div>
                    <div className="legend-item">
                        <div className="legend-color sibling-node-color"></div>
                        <span className="legend-label">Pares</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrgChart;
