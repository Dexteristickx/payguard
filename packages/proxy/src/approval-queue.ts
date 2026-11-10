import { randomUUID } from "node:crypto";
import type { PendingApproval, DashboardEvent, TransactionRecord } from "./types.js";

// ─── In-Memory Stores ────────────────────────────────────────

const pendingApprovals = new Map<string, PendingApproval>();
const transactionLog = new Map<string, TransactionRecord>();

// ─── Dashboard Event Subscribers (SSE / WebSocket) ───────────

type EventListener = (event: DashboardEvent) => void;
const listeners = new Set<EventListener>();

export function subscribe(listener: EventListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function emit(event: DashboardEvent): void {
  for (const listener of listeners) {
    try {
      listener(event);
    } catch {
      // Don't let a broken listener crash the server
    }
  }
}

// ─── Transaction Log ─────────────────────────────────────────

export function recordTransaction(record: TransactionRecord): void {
  transactionLog.set(record.id, record);
  emit({
    type: "TRANSACTION_NEW",
    timestamp: Date.now(),
    data: record,
  });
}

export function updateTransactionStatus(
  id: string,
  status: TransactionRecord["status"],
  paypalOrderId?: string
): void {
  const record = transactionLog.get(id);
  if (!record) return;

  record.status = status;
  if (paypalOrderId) record.paypalOrderId = paypalOrderId;
  transactionLog.set(id, record);

  emit({
    type: "TRANSACTION_UPDATED",
    timestamp: Date.now(),
    data: record,
  });
}

export function getAllTransactions(): TransactionRecord[] {
  return Array.from(transactionLog.values()).sort(
    (a, b) => b.timestamp - a.timestamp
  );
}

export function clearAllTransactions(): void {
  for (const pending of pendingApprovals.values()) {
    clearTimeout(pending.timeout);
  }
  pendingApprovals.clear();
  transactionLog.clear();
}

// ─── Approval Queue ──────────────────────────────────────────

const APPROVAL_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

export function createApprovalRequest(
  record: TransactionRecord
): Promise<boolean> {
  const approvalId = randomUUID().slice(0, 8);
  const transactionId = record.id;

  // Attach approvalId before recording/emitting so UI has it immediately on first render
  record.approvalId = approvalId;
  record.status = "HELD";
  recordTransaction(record);

  return new Promise<boolean>((resolve) => {
    const timeout = setTimeout(() => {
      pendingApprovals.delete(approvalId);
      updateTransactionStatus(transactionId, "TIMEOUT");
      resolve(false);
    }, APPROVAL_TIMEOUT_MS);

    pendingApprovals.set(approvalId, {
      approvalId,
      transactionId,
      resolve,
      timeout,
    });

    emit({
      type: "APPROVAL_REQUESTED",
      timestamp: Date.now(),
      data: record,
    });
  });
}

export function resolveApproval(
  approvalId: string,
  approved: boolean
): boolean {
  const pending = pendingApprovals.get(approvalId);
  if (pending) {
    clearTimeout(pending.timeout);
    pendingApprovals.delete(approvalId);

    const newStatus = approved ? "APPROVED" : "REJECTED";
    updateTransactionStatus(pending.transactionId, newStatus);

    const updatedRecord = transactionLog.get(pending.transactionId);
    if (updatedRecord) {
      emit({
        type: "APPROVAL_RESOLVED",
        timestamp: Date.now(),
        data: updatedRecord,
      });
    }

    pending.resolve(approved);
    return true;
  }

  // Fallback: if the approval timer already elapsed ("TIMEOUT") or was already resolved,
  // find the transaction by approvalId so late Telegram/Dashboard clicks still work gracefully!
  for (const record of transactionLog.values()) {
    if (record.approvalId === approvalId) {
      const newStatus = approved ? "COMPLETED" : "REJECTED";
      const mockOrderId = approved
        ? record.paypalOrderId ?? `ORDER-MOCK-${randomUUID().slice(0, 8).toUpperCase()}`
        : undefined;
      updateTransactionStatus(record.id, newStatus, mockOrderId);
      const updatedRecord = transactionLog.get(record.id);
      if (updatedRecord) {
        emit({
          type: "APPROVAL_RESOLVED",
          timestamp: Date.now(),
          data: updatedRecord,
        });
      }
      return true;
    }
  }

  return false;
}

export function getPendingCount(): number {
  return pendingApprovals.size;
}
