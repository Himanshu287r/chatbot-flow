import React, { useCallback, useMemo, useRef, useState } from "react";
import ReactFlow, {
  Background,
  Controls,
  addEdge,
  useEdgesState,
  useNodesState,
  Handle,
  Position,
} from "reactflow";
import "reactflow/dist/style.css";

const newId = () => Math.random().toString(36).slice(2, 9);

function MessageNode({ data }) {
  return (
    <div
      style={{
        borderRadius: "0.375rem",
        boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
        border: "1px solid #d1d5db",
        backgroundColor: "white",
        width: "15rem",
      }}
    >
      <div
        style={{
          backgroundColor: "#ccfbf1",
          color: "#1f2937",
          padding: "0.75rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span style={{ fontWeight: "600", fontSize: "0.875rem" }}>
          💬 Send Message
        </span>
      </div>
      <div style={{ padding: "0.75rem", color: "#1f2937", fontSize: "0.875rem" }}>
        {data.text}
      </div>
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
    </div>
  );
}

// Define nodeTypes outside the component
const nodeTypes = { messageNode: MessageNode };

export default function ChatbotFlowBuilder() {
  const wrapperRef = useRef(null);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);
  const initialNodes = [
    {
      id: "1",
      type: "messageNode",
      position: { x: 100, y: 100 },
      data: { text: "Initial message" },
    },
  ];
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNodeId, setSelectedNodeId] = useState(null);

  const selectedNode = useMemo(
    () => nodes.find((n) => n.id === selectedNodeId),
    [nodes, selectedNodeId]
  );

  const onDragStart = (event, nodeType) => {
    event.dataTransfer.setData("application/reactflow", nodeType);
    event.dataTransfer.effectAllowed = "move";
  };

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();
      const bounds = wrapperRef.current.getBoundingClientRect();
      const type = event.dataTransfer.getData("application/reactflow");
      const position = reactFlowInstance.project({
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
      });
      console.log("Dropping node:", { type, position });
      setNodes((nds) =>
        nds.concat({
          id: newId(),
          type,
          position,
          data: { text: "New message" },
        })
      );
    },
    [reactFlowInstance]
  );

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onConnect = useCallback(
    (connection) => {
      const alreadyHasOutgoing = edges.some(
        (e) => e.source === connection.source && e.sourceHandle === connection.sourceHandle
      );
      if (alreadyHasOutgoing) {
        alert("Only one outgoing edge allowed");
        return;
      }
      setEdges((eds) => addEdge(connection, eds));
    },
    [edges]
  );

  const onSelectionChange = useCallback(({ nodes }) => {
    setSelectedNodeId(nodes?.[0]?.id || null);
  }, []);

  const updateNodeText = (text) => {
    setNodes((nds) =>
      nds.map((n) => (n.id === selectedNodeId ? { ...n, data: { ...n.data, text } } : n))
    );
  };

  const onSave = () => {
    const incomingCount = new Map(nodes.map((n) => [n.id, 0]));
    edges.forEach((e) => {
      incomingCount.set(e.target, (incomingCount.get(e.target) || 0) + 1);
    });
    const emptyTargets = nodes.filter((n) => (incomingCount.get(n.id) || 0) === 0);
    if (nodes.length > 1 && emptyTargets.length > 1) {
      alert("Multiple nodes have empty target handles");
      return;
    }
    console.log({ nodes, edges });
    alert("Flow saved. See console.");
  };

  return (
    <div style={{ display: "flex", height: "100vh", width: "100vw" }}>
      {/* Canvas */}
      <div
        style={{ height: "100vh", width: "100%", position: "relative" }}
        ref={wrapperRef}
        onDrop={onDrop}
        onDragOver={onDragOver}
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onInit={(instance) => {
            console.log("ReactFlow initialized:", instance);
            setReactFlowInstance(instance);
          }}
          onSelectionChange={onSelectionChange}
          nodeTypes={nodeTypes}
          fitView
        >
          <Background />
          <Controls />
        </ReactFlow>
      </div>

      {/* Right panel */}
      <div
        style={{
          width: "16rem",
          borderLeft: "1px solid #d1d5db",
          backgroundColor: "white",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{ padding: "0.75rem", borderBottom: "1px solid #d1d5db" }}>
          <button
            onClick={onSave}
            style={{
              width: "100%",
              backgroundColor: "#3b82f6",
              color: "white",
              padding: "0.25rem 0.75rem",
              borderRadius: "0.25rem",
            }}
          >
            Save Changes
          </button>
        </div>

        {!selectedNode && (
          <div style={{ padding: "0.75rem" }}>
            <div style={{ fontSize: "0.875rem", fontWeight: "500", marginBottom: "0.5rem" }}>
              Nodes Panel
            </div>
            <div
              draggable
              onDragStart={(e) => onDragStart(e, "messageNode")}
              style={{
                border: "1px solid #d1d5db",
                borderRadius: "0.25rem",
                padding: "0.5rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "move",
              }}
            >
              Message
            </div>
          </div>
        )}

        {selectedNode && (
          <div style={{ padding: "0.75rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <button
              onClick={() => setSelectedNodeId(null)}
              style={{ fontSize: "0.875rem", color: "#3b82f6" }}
            >
              ← Back
            </button>
            <div style={{ fontSize: "0.875rem", fontWeight: "500" }}>Message</div>
            <textarea
              style={{
                width: "100%",
                border: "1px solid #d1d5db",
                borderRadius: "0.25rem",
                padding: "0.25rem",
                fontSize: "0.875rem",
              }}
              value={selectedNode.data.text}
              onChange={(e) => updateNodeText(e.target.value)}
            />
          </div>
        )}
      </div>
    </div>
  );
}