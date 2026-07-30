"""
Expo Push Notification Service.
Sends native push notifications to mobile devices via Expo's free push service.
"""
import httpx
from typing import Optional

EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send"


async def send_expo_push(
    token: str,
    title: str,
    body: str,
    data: Optional[dict] = None,
    severity: str = "medium"
):
    """Send a push notification via Expo's push service.
    
    Args:
        token: Expo push token (ExponentPushToken[...])
        title: Notification title
        body: Notification body text
        data: Extra data payload (e.g. action_url for deep-linking)
        severity: Alert severity for setting notification priority
    """
    if not token or not token.startswith("ExponentPushToken"):
        return False

    priority = "high" if severity in ("critical", "high") else "default"
    
    payload = {
        "to": token,
        "title": title,
        "body": body,
        "data": data or {},
        "sound": "default",
        "priority": priority,
    }

    # Add channel for Android (high-priority alerts get their own channel)
    if severity == "critical":
        payload["channelId"] = "critical-alerts"

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(EXPO_PUSH_URL, json=payload)
            return resp.status_code == 200
    except Exception as e:
        print(f"[PushService] Failed to send push to {token[:30]}...: {e}")
        return False


async def send_expo_push_batch(messages: list[dict]):
    """Send multiple push notifications in a single batch request.
    
    Each message dict should have: to, title, body, data, sound, priority
    """
    if not messages:
        return
    
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            await client.post(EXPO_PUSH_URL, json=messages)
    except Exception as e:
        print(f"[PushService] Batch push failed: {e}")
