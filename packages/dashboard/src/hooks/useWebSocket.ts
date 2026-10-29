import { useEffect, useState, useRef, useCallback } from "react";
import type { TransactionRecord, DashboardEvent } from "../types";

export function useWebSocket() {
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [events, setEvents] = useState<DashboardEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch initial transaction snapshot
  const fetchTransactions = useCallback(async () => {
    try {
      const res = await fetch("/v1/transactions");
      if (res.ok) {
        const data: TransactionRecord[] = await res.json();
        setTransactions(data);
      }
    } catch (err) {
      console.warn("Failed to fetch initial transactions:", err);
    }
  }, []);

  // Connect WebSocket
  const connect = useCallback(() => {
    if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
      return;
    }

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/v1/ws`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      fetchTransactions();
    };

    ws.onmessage = (event) => {
      try {
        const payload: DashboardEvent = JSON.parse(event.data);
        setEvents((prev) => [payload, ...prev.slice(0, 49)]); // keep last 50 events

        if (payload.type === "TRANSACTION_NEW") {
          setTransactions((prev) => [payload.data, ...prev.filter((t) => t.id !== payload.data.id)]);
        } else if (payload.type === "TRANSACTION_UPDATED" || payload.type === "APPROVAL_RESOLVED" || payload.type === "APPROVAL_REQUESTED") {
          setTransactions((prev) =>
            prev.map((t) => (t.id === payload.data.id ? payload.data : t))
          );
        }
      } catch (e) {
        console.error("Failed to parse WebSocket event:", e);
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
      wsRef.current = null;
      reconnectTimeoutRef.current = setTimeout(connect, 3000);
    };

    ws.onerror = (err) => {
      console.warn("WebSocket error:", err);
      ws.close();
    };
  }, [fetchTransactions]);

  useEffect(() => {
    fetchTransactions();
    connect();

    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) wsRef.current.close();
    };
  }, [connect, fetchTransactions]);

  const resolveApproval = async (approvalId: string, decision: "approve" | "reject") => {
    try {
      const res = await fetch(`/v1/approvals/${approvalId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision }),
      });
      return res.ok;
    } catch (e) {
      console.error("Failed to resolve approval:", e);
      return false;
    }
  };

  return {
    transactions,
    events,
    isConnected,
    connected: isConnected,
    eventCount: events.length,
    refetch: fetchTransactions,
    resolveApproval,
  };
}

