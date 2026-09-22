import { useAuthStore } from '../store/useAuthStore';

const AI_BASE_URL = import.meta.env?.VITE_AI_SERVICE_BASE_URL || 'http://localhost:8000/api';
const BACKEND_BASE_URL = import.meta.env?.VITE_API_BASE_URL || 'http://localhost:5030/api';

/**
 * Sends a chat message to the Inventory Assistant AI endpoint.
 * Tries direct Python AI service first, with graceful fallback through ASP.NET Core proxy.
 * Payload: { messages: [{ role, content }], pending_action: { action_type, data } | null }
 */
export async function sendInventoryChatMessage({ messages, pendingAction = null }) {
  const token = useAuthStore.getState().token || localStorage.getItem('smartspace_token');

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const body = JSON.stringify({
    messages,
    pending_action: pendingAction,
  });

  // 1. Try direct connection to Python AI service
  try {
    const directResponse = await fetch(`${AI_BASE_URL}/inventory-assistant/chat`, {
      method: 'POST',
      headers,
      body,
    });

    if (directResponse.ok) {
      return await directResponse.json();
    }
  } catch (_) {
    // Direct connection failed (e.g. CORS or network port restriction), attempt backend proxy
  }

  // 2. Fallback: ASP.NET Core backend proxy
  const proxyResponse = await fetch(`${BACKEND_BASE_URL}/inventory/ai-chat`, {
    method: 'POST',
    headers,
    body,
  });

  if (!proxyResponse.ok) {
    const errorData = await proxyResponse.json().catch(() => ({}));
    const message = errorData.detail || errorData.message || `AI service error (${proxyResponse.status})`;
    throw new Error(message);
  }

  return proxyResponse.json();
}

