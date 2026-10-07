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

// ─── Approval Queue ──────────────────────────────────────────

const APPROVAL_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

export function createApprovalRequest(
  transactionId: string
): Promise<boolean> {
  const approvalId = randomUUID().slice(0, 8);

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

    // Update transaction record with approval ID
    const record = transactionLog.get(transactionId);
    if (record) {
      record.approvalId = approvalId;
      record.status = "HELD";
    }

    emit({
      type: "APPROVAL_REQUESTED",
      timestamp: Date.now(),
      data: record!,
    });
  });
}

export function resolveApproval(
  approvalId: string,
  approved: boolean
): boolean {
  const pending = pendingApprovals.get(approvalId);
  if (!pending) return false;

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

export function getPendingCount(): number {
  return pendingApprovals.size;
}
